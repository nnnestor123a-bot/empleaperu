import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, createSession, hashPassword } from "@/lib/auth";
import { registerSchema, validatePeruvianRucFormat } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!checkRateLimit(`register:${ip}`, 15, 60_000).allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo electrónico." }, { status: 409 });
    }

    if (data.role === "COMPANY") {
      if (!data.companyName || data.companyName.trim().length < 2) {
        return NextResponse.json({ error: "Ingresa la razón social o nombre comercial de la empresa." }, { status: 400 });
      }
      if (!data.ruc) {
        return NextResponse.json({ error: "Ingresa el RUC de 11 dígitos." }, { status: 400 });
      }
      const rucCheck = validatePeruvianRucFormat(data.ruc);
      if (!rucCheck.valid) {
        return NextResponse.json({ error: rucCheck.reason }, { status: 400 });
      }
      const dupRuc = await prisma.company.findUnique({ where: { ruc: data.ruc.trim() } });
      if (dupRuc) {
        return NextResponse.json({ error: "Ya existe una empresa registrada con ese RUC." }, { status: 409 });
      }
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        passwordHash,
        role: data.role,
        phone: data.phone || null,
        consentAcceptedAt: new Date(),
      },
    });

    if (data.role === "CANDIDATE") {
      const slugBase = slugify(data.name) || "postulante";
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          headline: "Profesional en búsqueda activa",
          portfolioSlug: `${slugBase}-${user.id.slice(-5)}`,
          completionPct: 25,
        },
      });
    } else if (data.role === "COMPANY") {
      const freePlan = await prisma.plan.findUnique({ where: { code: "FREE" } });
      const company = await prisma.company.create({
        data: {
          legalName: data.companyName!.trim(),
          tradeName: data.companyName!.trim(),
          ruc: data.ruc!.trim(),
          sector: data.sector || "Tecnología y Software",
          description: `Empresa registrada en EmpleaPerú (${data.companyName!.trim()}). Pendiente de verificación manual.`,
          contactEmail: data.email,
          contactPhone: data.phone || null,
          verificationStatus: "PENDING",
        },
      });
      await prisma.companyMember.create({
        data: { companyId: company.id, userId: user.id, role: "OWNER" },
      });
      if (freePlan) {
        await prisma.subscription.create({
          data: { companyId: company.id, planId: freePlan.id, status: "ACTIVE" },
        });
      }
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Bienvenido(a) a EmpleaPerú",
        body:
          data.role === "COMPANY"
            ? "Tu cuenta empresarial fue creada. Completa el perfil de tu empresa y publica tu primera vacante."
            : "Tu cuenta fue creada. Completa tu perfil y sube tu CV para mejorar tu compatibilidad.",
        link: data.role === "COMPANY" ? "/empresa" : "/postulante",
      },
    });

    await createSession(user, {
      userAgent: req.headers.get("user-agent") || undefined,
      ip,
    });

    await logAudit({
      actorId: user.id,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
      metadata: { role: user.role },
      ip,
    });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Error interno al crear la cuenta." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const companyId = auth.user.primaryCompanyId;
  if (!companyId && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Empresa no asociada." }, { status: 400 });
  }

  const company = companyId
    ? await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      })
    : await prisma.company.findFirst({
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

  if (!company) return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ company, jobs });
}

export async function POST(req: NextRequest) {
  // Add an existing user as recruiter (respecting plan maxRecruiters)
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user.primaryCompanyId) {
    return NextResponse.json({ error: "Empresa no asociada." }, { status: 400 });
  }

  const { email } = await req.json();
  const target = await prisma.user.findUnique({ where: { email: String(email || "").trim().toLowerCase() } });
  if (!target) {
    return NextResponse.json({ error: "No se encontró un usuario registrado con ese correo." }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { id: auth.user.primaryCompanyId },
    include: {
      members: true,
      subscriptions: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 },
    },
  });
  if (!company) return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });

  const maxRec = company.subscriptions[0]?.plan.maxRecruiters ?? 1;
  if (company.members.length >= maxRec) {
    return NextResponse.json({ error: `Tu plan permite hasta ${maxRec} reclutadores.` }, { status: 403 });
  }

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: target.id } },
    update: {},
    create: { companyId: company.id, userId: target.id, role: "RECRUITER" },
  });

  return NextResponse.json({ ok: true });
}

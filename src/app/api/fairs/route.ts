import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const fairs = await prisma.jobFair.findMany({
    include: {
      companies: {
        include: {
          company: { select: { id: true, tradeName: true, sector: true, verificationStatus: true } },
        },
      },
      _count: { select: { registrations: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  let regSet = new Set<string>();
  if (user) {
    const regs = await prisma.jobFairRegistration.findMany({
      where: { userId: user.id },
      select: { fairId: true },
    });
    regSet = new Set(regs.map((r) => r.fairId));
  }

  return NextResponse.json({
    fairs: fairs.map((f) => ({ ...f, isRegistered: regSet.has(f.id) })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { fairId } = await req.json();
  if (!fairId) return NextResponse.json({ error: "fairId requerido." }, { status: 400 });

  const existing = await prisma.jobFairRegistration.findUnique({
    where: { fairId_userId: { fairId, userId: auth.user.id } },
  });

  if (existing) {
    await prisma.jobFairRegistration.delete({ where: { id: existing.id } });
    return NextResponse.json({ registered: false });
  }

  const fair = await prisma.jobFair.findUnique({ where: { id: fairId } });
  if (!fair) return NextResponse.json({ error: "Feria no encontrada." }, { status: 404 });

  await prisma.jobFairRegistration.create({
    data: { fairId, userId: auth.user.id },
  });

  await prisma.notification.create({
    data: {
      userId: auth.user.id,
      type: "SYSTEM",
      title: `Inscripción confirmada: ${fair.title}`,
      body: `Quedaste registrado(a) en la feria (${fair.modality}). Revisa la agenda y empresas participantes.`,
      link: "/ferias",
    },
  });

  return NextResponse.json({ registered: true });
}

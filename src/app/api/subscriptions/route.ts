import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { pricePenMonthly: "asc" } });
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth || !auth.user.primaryCompanyId) {
    return NextResponse.json({
      plans: plans.map((p) => ({ ...p, features: JSON.parse(p.featuresJson || "[]") })),
      activeSubscription: null,
      simulations: [],
    });
  }

  const [activeSubscription, simulations] = await Promise.all([
    prisma.subscription.findFirst({
      where: { companyId: auth.user.primaryCompanyId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentSimulation.findMany({
      where: { companyId: auth.user.primaryCompanyId },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, features: JSON.parse(p.featuresJson || "[]") })),
    activeSubscription,
    simulations,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user.primaryCompanyId) {
    return NextResponse.json({ error: "Empresa no asociada." }, { status: 400 });
  }

  const { planCode } = await req.json();
  const plan = await prisma.plan.findUnique({ where: { code: String(planCode) } });
  if (!plan) return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });

  await prisma.subscription.updateMany({
    where: { companyId: auth.user.primaryCompanyId, status: "ACTIVE" },
    data: { status: "CANCELLED", endsAt: new Date() },
  });

  const sub = await prisma.subscription.create({
    data: {
      companyId: auth.user.primaryCompanyId,
      planId: plan.id,
      status: "ACTIVE",
      endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
    include: { plan: true },
  });

  const sim = await prisma.paymentSimulation.create({
    data: {
      subscriptionId: sub.id,
      companyId: auth.user.primaryCompanyId,
      amountPen: plan.pricePenMonthly,
      method: "SIMULACION_LOCAL_SIN_TARJETA",
      referenceCode: `SIM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      status: "SIMULATED_PAID",
      isSimulated: true,
    },
  });

  await logAudit({
    actorId: auth.user.id,
    action: "SUBSCRIPTION_SIMULATED",
    entityType: "SUBSCRIPTION",
    entityId: sub.id,
    metadata: { planCode: plan.code, amountPen: plan.pricePenMonthly, isSimulated: true },
  });

  return NextResponse.json({
    subscription: sub,
    simulation: sim,
    notice: "Suscripción activada mediante simulación local explícita (sin cobro real ni datos de tarjeta).",
  });
}

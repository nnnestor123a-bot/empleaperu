import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { reportSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de denuncia inválidos." }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: auth.user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  await logAudit({
    actorId: auth.user.id,
    action: "REPORT_SUBMITTED",
    entityType: parsed.data.targetType,
    entityId: parsed.data.targetId,
    metadata: { reason: parsed.data.reason },
  });

  return NextResponse.json({ report, message: "Denuncia registrada para revisión humana." }, { status: 201 });
}

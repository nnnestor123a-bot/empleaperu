import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessCompany, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const VALID_STATUSES = [
  "ENVIADA",
  "REVISION",
  "PRESELECCION",
  "ENTREVISTA",
  "EVALUACION",
  "SELECCIONADO",
  "NO_SELECCIONADO",
  "RETIRADO",
];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, companyId: true } },
      candidate: { select: { id: true, userId: true } },
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Postulación no encontrada." }, { status: 404 });
  }

  const body = await req.json();

  // Candidate can ONLY withdraw their own application
  if (auth.user.role === "CANDIDATE") {
    if (app.candidate.userId !== auth.user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    if (body.status !== "RETIRADO") {
      return NextResponse.json({ error: "Solo puedes retirar tu propia postulación." }, { status: 403 });
    }
    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "RETIRADO",
        history: {
          create: {
            fromStatus: app.status,
            toStatus: "RETIRADO",
            note: "Postulación retirada por el candidato.",
            actorId: auth.user.id,
          },
        },
      },
    });
    return NextResponse.json({ application: updated });
  }

  // Company / Admin isolation check
  if (!canAccessCompany(auth.user, app.job.companyId)) {
    return NextResponse.json({ error: "Aislamiento empresarial: acceso denegado." }, { status: 403 });
  }

  // Schedule interview
  if (body.interview) {
    const iv = await prisma.interview.create({
      data: {
        applicationId: id,
        scheduledAt: new Date(body.interview.scheduledAt),
        durationMin: Number(body.interview.durationMin || 45),
        modality: body.interview.modality || "VIRTUAL",
        locationOrLink: String(body.interview.locationOrLink || "Enlace por confirmar"),
        notes: String(body.interview.notes || ""),
      },
    });
    await prisma.notification.create({
      data: {
        userId: app.candidate.userId,
        type: "INTERVIEW",
        title: `Entrevista programada: ${app.job.title}`,
        body: `Tienes una entrevista ${iv.modality.toLowerCase()} el ${iv.scheduledAt.toLocaleString("es-PE")}.`,
        link: "/postulante/entrevistas",
      },
    });
  }

  // Add structured evaluation
  if (body.evaluation) {
    const tech = Math.min(5, Math.max(1, Number(body.evaluation.technicalScore || 3)));
    const soft = Math.min(5, Math.max(1, Number(body.evaluation.softSkillsScore || 3)));
    const cult = Math.min(5, Math.max(1, Number(body.evaluation.cultureScore || 3)));
    const overall = Math.round((tech + soft + cult) / 3);
    await prisma.evaluation.create({
      data: {
        applicationId: id,
        reviewerId: auth.user.id,
        technicalScore: tech,
        softSkillsScore: soft,
        cultureScore: cult,
        overallScore: overall,
        comments: String(body.evaluation.comments || ""),
      },
    });
  }

  const nextStatus =
    body.status && VALID_STATUSES.includes(body.status) ? body.status : app.status;
  const statusChanged = nextStatus !== app.status;

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: nextStatus,
      internalNotes: body.internalNotes !== undefined ? String(body.internalNotes) : app.internalNotes,
      recruiterRating:
        body.recruiterRating !== undefined
          ? Number(body.recruiterRating)
          : app.recruiterRating,
      ...(statusChanged
        ? {
            history: {
              create: {
                fromStatus: app.status,
                toStatus: nextStatus,
                note: String(body.note || `Estado actualizado a ${nextStatus}`),
                actorId: auth.user.id,
              },
            },
          }
        : {}),
    },
  });

  if (statusChanged) {
    await prisma.notification.create({
      data: {
        userId: app.candidate.userId,
        type: "STATUS",
        title: `Tu postulación cambió a ${nextStatus}`,
        body: `La empresa actualizó tu proceso en "${app.job.title}".`,
        link: "/postulante/postulaciones",
      },
    });
    await logAudit({
      actorId: auth.user.id,
      action: "APPLICATION_STATUS_CHANGED",
      entityType: "APPLICATION",
      entityId: id,
      metadata: { from: app.status, to: nextStatus },
    });
  }

  return NextResponse.json({ application: updated });
}

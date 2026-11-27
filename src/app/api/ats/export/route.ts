import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessCompany, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function csvCell(val: unknown): string {
  const str = String(val ?? "").replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const jobId = req.nextUrl.searchParams.get("jobId") || undefined;
  if (jobId && auth.user.role !== "ADMIN") {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { companyId: true } });
    if (!job || !canAccessCompany(auth.user, job.companyId)) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }
  }

  const apps = await prisma.application.findMany({
    where: {
      ...(jobId ? { jobId } : {}),
      ...(auth.user.role === "ADMIN" ? {} : { job: { companyId: { in: auth.user.companyIds } } }),
    },
    include: {
      job: { select: { title: true, department: true } },
      candidate: {
        include: { user: { select: { name: true, email: true, phone: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "ID",
    "Vacante",
    "Postulante",
    "Correo",
    "Departamento",
    "Estado",
    "Compatibilidad (%)",
    "Calificación",
    "Fecha",
  ].join(",");

  const rows = apps.map((a) =>
    [
      csvCell(a.id),
      csvCell(a.job.title),
      csvCell(a.candidate.user.name),
      csvCell(a.candidate.user.email),
      csvCell(a.candidate.department),
      csvCell(a.status),
      csvCell(a.compatibilityScore),
      csvCell(a.recruiterRating ?? ""),
      csvCell(a.createdAt.toISOString()),
    ].join(",")
  );

  await logAudit({
    actorId: auth.user.id,
    action: "ATS_CSV_EXPORTED",
    entityType: "APPLICATION",
    metadata: { count: apps.length, jobId: jobId || "ALL" },
  });

  return new NextResponse([header, ...rows].join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="empleaperu-ats-postulantes.csv"',
    },
  });
}

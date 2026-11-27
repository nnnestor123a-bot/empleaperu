import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [
    users,
    companies,
    jobs,
    applications,
    reports,
    reviews,
    categories,
    auditLogs,
    contactMessages,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      include: {
        _count: { select: { jobs: true, members: true } },
        subscriptions: { where: { status: "ACTIVE" }, include: { plan: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.findMany({
      include: {
        company: { select: { tradeName: true } },
        category: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: [{ fraudRiskScore: "desc" }, { createdAt: "desc" }],
    }),
    prisma.application.findMany({
      select: { id: true, status: true, createdAt: true, compatibilityScore: true },
    }),
    prisma.report.findMany({
      include: { reporter: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.companyReview.findMany({
      include: {
        company: { select: { tradeName: true } },
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobCategory.findMany({
      include: { _count: { select: { jobs: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  // Real DB-derived analytics
  const byCategoryMap = new Map<string, number>();
  const byDepartmentMap = new Map<string, number>();
  const byJobStatusMap = new Map<string, number>();
  for (const j of jobs) {
    byCategoryMap.set(j.category.name, (byCategoryMap.get(j.category.name) || 0) + 1);
    byDepartmentMap.set(j.department, (byDepartmentMap.get(j.department) || 0) + 1);
    byJobStatusMap.set(j.status, (byJobStatusMap.get(j.status) || 0) + 1);
  }

  const byAppStatusMap = new Map<string, number>();
  const byMonthMap = new Map<string, number>();
  for (const a of applications) {
    byAppStatusMap.set(a.status, (byAppStatusMap.get(a.status) || 0) + 1);
    const mKey = a.createdAt.toISOString().slice(0, 7);
    byMonthMap.set(mKey, (byMonthMap.get(mKey) || 0) + 1);
  }

  const hiredCount = applications.filter((a) => a.status === "SELECCIONADO").length;
  const hiringRate = applications.length
    ? Math.round((hiredCount / applications.length) * 1000) / 10
    : 0;

  return NextResponse.json({
    kpis: {
      totalUsers: users.length,
      totalCompanies: companies.length,
      verifiedCompanies: companies.filter((c) => c.verificationStatus === "VERIFIED").length,
      totalJobs: jobs.length,
      publishedJobs: jobs.filter((j) => j.status === "PUBLISHED").length,
      totalApplications: applications.length,
      hiredCount,
      hiringRate,
      openReports: reports.filter((r) => r.status === "OPEN").length,
      flaggedJobs: jobs.filter((j) => j.fraudRiskScore >= 25).length,
    },
    charts: {
      jobsByCategory: Array.from(byCategoryMap.entries()).map(([name, value]) => ({ name, value })),
      jobsByDepartment: Array.from(byDepartmentMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      jobsByStatus: Array.from(byJobStatusMap.entries()).map(([name, value]) => ({ name, value })),
      applicationsByStatus: Array.from(byAppStatusMap.entries()).map(([name, value]) => ({ name, value })),
      applicationsByMonth: Array.from(byMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
    },
    users,
    companies,
    jobs,
    reports,
    reviews,
    categories,
    auditLogs,
    contactMessages,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();

  if (body.action === "toggleUser" && body.userId) {
    const target = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { isActive: !target.isActive },
    });
    await logAudit({
      actorId: auth.user.id,
      action: updated.isActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
      entityType: "USER",
      entityId: target.id,
    });
    return NextResponse.json({ user: updated });
  }

  if (body.action === "verifyCompany" && body.companyId) {
    const status = body.status === "VERIFIED" ? "VERIFIED" : body.status === "REJECTED" ? "REJECTED" : "PENDING";
    const company = await prisma.company.update({
      where: { id: body.companyId },
      data: { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : null },
      include: { members: true },
    });
    for (const m of company.members) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          type: "VERIFICATION",
          title: `Verificación de empresa: ${status}`,
          body: `El estado de verificación manual de ${company.tradeName} fue actualizado a ${status}.`,
          link: "/empresa",
        },
      });
    }
    await logAudit({
      actorId: auth.user.id,
      action: "COMPANY_VERIFICATION_UPDATED",
      entityType: "COMPANY",
      entityId: company.id,
      metadata: { status },
    });
    return NextResponse.json({ company });
  }

  if (body.action === "moderateJob" && body.jobId) {
    const job = await prisma.job.update({
      where: { id: body.jobId },
      data: { status: body.status || "PAUSED" },
    });
    await logAudit({
      actorId: auth.user.id,
      action: "JOB_MODERATED",
      entityType: "JOB",
      entityId: job.id,
      metadata: { status: job.status },
    });
    return NextResponse.json({ job });
  }

  if (body.action === "resolveReport" && body.reportId) {
    const report = await prisma.report.update({
      where: { id: body.reportId },
      data: {
        status: body.status || "REVIEWED",
        resolvedById: auth.user.id,
        resolutionNote: String(body.resolutionNote || "Revisado por administración"),
      },
    });
    await logAudit({
      actorId: auth.user.id,
      action: "REPORT_RESOLVED",
      entityType: "REPORT",
      entityId: report.id,
      metadata: { status: report.status },
    });
    return NextResponse.json({ report });
  }

  if (body.action === "moderateReview" && body.reviewId) {
    const review = await prisma.companyReview.update({
      where: { id: body.reviewId },
      data: { status: body.status === "APPROVED" ? "APPROVED" : "REJECTED" },
    });
    return NextResponse.json({ review });
  }

  if (body.action === "createCategory" && body.name) {
    const name = String(body.name).trim();
    const cat = await prisma.jobCategory.create({
      data: {
        name,
        slug: slugify(name),
        description: String(body.description || ""),
      },
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  }

  return NextResponse.json({ error: "Acción administrativa no reconocida." }, { status: 400 });
}

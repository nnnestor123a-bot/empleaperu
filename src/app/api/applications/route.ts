import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessCompany, requireRole } from "@/lib/auth";
import { applicationSchema } from "@/lib/validators";
import {
  calculateCompatibility,
  estimateExperienceYears,
  inferHighestEducation,
} from "@/lib/compatibility";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sp = req.nextUrl.searchParams;
  const jobId = sp.get("jobId") || undefined;
  const status = sp.get("status") || undefined;

  if (auth.user.role === "CANDIDATE") {
    if (!auth.user.candidateProfileId) {
      return NextResponse.json({ applications: [] });
    }
    const apps = await prisma.application.findMany({
      where: {
        candidateId: auth.user.candidateProfileId,
        ...(status ? { status } : {}),
      },
      include: {
        job: {
          include: {
            company: { select: { id: true, tradeName: true, verificationStatus: true, department: true } },
            category: { select: { name: true } },
          },
        },
        history: { orderBy: { createdAt: "asc" } },
        interviews: { orderBy: { scheduledAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ applications: apps });
  }

  // COMPANY or ADMIN ATS view (with strict company isolation)
  const companyIds = auth.user.role === "ADMIN" ? undefined : auth.user.companyIds;
  if (jobId && companyIds) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { companyId: true } });
    if (!job || !canAccessCompany(auth.user, job.companyId)) {
      return NextResponse.json({ error: "No autorizado para ver postulantes de esta vacante." }, { status: 403 });
    }
  }

  const apps = await prisma.application.findMany({
    where: {
      ...(jobId ? { jobId } : {}),
      ...(status ? { status } : {}),
      ...(companyIds ? { job: { companyId: { in: companyIds } } } : {}),
    },
    select: {
      id: true,
      status: true,
      compatibilityScore: true,
      internalNotes: true,
      recruiterRating: true,
      coverLetter: true,
      createdAt: true,
      job: {
        select: { id: true, title: true, slug: true, companyId: true, department: true, modality: true },
      },
      candidate: {
        select: {
          id: true,
          headline: true,
          department: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
          skills: { select: { skill: { select: { name: true } } }, take: 8 },
          resumes: { select: { id: true, originalName: true, isPrimary: true, createdAt: true }, take: 3 },
        },
      },
      resume: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
      interviews: {
        select: { id: true, scheduledAt: true, modality: true, locationOrLink: true },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      },
      evaluations: {
        select: { id: true, overallScore: true, comments: true, reviewer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: [{ compatibilityScore: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ applications: apps });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!auth.user.candidateProfileId) {
    return NextResponse.json({ error: "Perfil de postulante no encontrado." }, { status: 400 });
  }

  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de postulación inválidos." }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    include: {
      company: { include: { members: true } },
      skills: { include: { skill: true } },
    },
  });

  if (!job || job.status !== "PUBLISHED") {
    return NextResponse.json({ error: "La vacante no está abierta para postulaciones." }, { status: 404 });
  }

  const dup = await prisma.application.findUnique({
    where: {
      jobId_candidateId: { jobId: job.id, candidateId: auth.user.candidateProfileId },
    },
  });
  if (dup) {
    return NextResponse.json({ error: "Ya te postulaste a esta vacante anteriormente." }, { status: 409 });
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { id: auth.user.candidateProfileId },
    include: {
      skills: { include: { skill: true } },
      experiences: true,
      educations: true,
      resumes: { orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }], take: 1 },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  }

  // Verify resume ownership if provided
  let resumeId: string | null = profile.resumes[0]?.id ?? null;
  if (parsed.data.resumeId) {
    const owned = await prisma.resume.findFirst({
      where: { id: parsed.data.resumeId, candidateId: profile.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "CV no válido para tu cuenta." }, { status: 403 });
    }
    resumeId = owned.id;
  }

  const compat = calculateCompatibility(
    {
      skills: profile.skills.map((s) => s.skill.name),
      experienceYears: estimateExperienceYears(profile.experiences),
      highestEducation: inferHighestEducation(profile.educations),
      department: profile.department,
      preferredModality: profile.preferredModality,
      expectedSalaryPen: profile.expectedSalaryPen,
    },
    {
      skills: job.skills.map((s) => s.skill.name),
      experienceLevel: job.experienceLevel,
      educationLevel: job.educationLevel,
      department: job.department,
      modality: job.modality,
      salaryMinPen: job.salaryMinPen,
      salaryMaxPen: job.salaryMaxPen,
    }
  );

  const app = await prisma.application.create({
    data: {
      jobId: job.id,
      candidateId: profile.id,
      resumeId,
      coverLetter: parsed.data.coverLetter,
      status: "ENVIADA",
      compatibilityScore: compat.totalScore,
      compatibilityBreakdownJson: JSON.stringify(compat),
      history: {
        create: {
          fromStatus: null,
          toStatus: "ENVIADA",
          note: "Postulación enviada por el candidato.",
          actorId: auth.user.id,
        },
      },
    },
  });

  // Notify candidate and company recruiters
  await prisma.notification.create({
    data: {
      userId: auth.user.id,
      type: "APPLICATION",
      title: `Postulación enviada: ${job.title}`,
      body: `Tu postulación a ${job.company.tradeName} fue registrada con compatibilidad orientativa del ${compat.totalScore}%.`,
      link: "/postulante/postulaciones",
    },
  });

  for (const member of job.company.members) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        type: "APPLICATION",
        title: `Nuevo postulante en ${job.title}`,
        body: `${auth.user.name} postuló a tu vacante (Compatibilidad orientativa: ${compat.totalScore}%).`,
        link: "/empresa/ats",
      },
    });
  }

  await logAudit({
    actorId: auth.user.id,
    action: "APPLICATION_CREATED",
    entityType: "APPLICATION",
    entityId: app.id,
    metadata: { jobId: job.id, compatibilityScore: compat.totalScore },
  });

  return NextResponse.json({ application: app, compatibility: compat }, { status: 201 });
}

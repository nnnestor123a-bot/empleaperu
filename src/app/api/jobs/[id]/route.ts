import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessCompany, getCurrentUser, requireRole } from "@/lib/auth";
import { evaluateJobAntifraud } from "@/lib/antifraud";
import { logAudit } from "@/lib/audit";
import {
  calculateCompatibility,
  estimateExperienceYears,
  inferHighestEducation,
} from "@/lib/compatibility";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const job = await prisma.job.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      company: true,
      category: true,
      skills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Vacante no encontrada." }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (job.status !== "PUBLISHED" && (!user || !canAccessCompany(user, job.companyId))) {
    return NextResponse.json({ error: "Esta vacante no está disponible públicamente." }, { status: 404 });
  }

  let compatibility = null;
  let hasApplied = false;
  let isFavorite = false;

  if (user?.candidateProfileId) {
    const [profile, app, fav] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { id: user.candidateProfileId },
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          educations: true,
        },
      }),
      prisma.application.findUnique({
        where: { jobId_candidateId: { jobId: job.id, candidateId: user.candidateProfileId } },
      }),
      prisma.favorite.findUnique({
        where: { userId_jobId: { userId: user.id, jobId: job.id } },
      }),
    ]);
    hasApplied = Boolean(app);
    isFavorite = Boolean(fav);
    if (profile) {
      compatibility = calculateCompatibility(
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
    }
  }

  return NextResponse.json({
    job: {
      ...job,
      skillNames: job.skills.map((s) => s.skill.name),
      fraudFlags: JSON.parse(job.fraudFlagsJson || "[]"),
      compatibility,
      hasApplied,
      isFavorite,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const existing = await prisma.job.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vacante no encontrada." }, { status: 404 });
  }
  if (!canAccessCompany(auth.user, existing.companyId)) {
    return NextResponse.json({ error: "No autorizado para modificar esta vacante." }, { status: 403 });
  }

  const body = await req.json();
  const title = body.title ?? existing.title;
  const description = body.description ?? existing.description;
  const responsibilities = body.responsibilities ?? existing.responsibilities;
  const requirements = body.requirements ?? existing.requirements;
  const salaryMinPen = body.salaryMinPen !== undefined ? body.salaryMinPen : existing.salaryMinPen;
  const salaryMaxPen = body.salaryMaxPen !== undefined ? body.salaryMaxPen : existing.salaryMaxPen;

  const fraud = evaluateJobAntifraud({
    title,
    description,
    responsibilities,
    requirements,
    salaryMinPen,
    salaryMaxPen,
    companyVerified: existing.company.verificationStatus === "VERIFIED",
  });

  const updated = await prisma.job.update({
    where: { id },
    data: {
      title,
      description,
      responsibilities,
      requirements,
      benefits: body.benefits ?? existing.benefits,
      department: body.department ?? existing.department,
      district: body.district ?? existing.district,
      salaryMinPen,
      salaryMaxPen,
      salaryVisible: body.salaryVisible ?? existing.salaryVisible,
      modality: body.modality ?? existing.modality,
      contractType: body.contractType ?? existing.contractType,
      experienceLevel: body.experienceLevel ?? existing.experienceLevel,
      educationLevel: body.educationLevel ?? existing.educationLevel,
      vacanciesCount: body.vacanciesCount ?? existing.vacanciesCount,
      status: body.status ?? existing.status,
      isFeatured: body.isFeatured ?? existing.isFeatured,
      fraudRiskScore: fraud.riskScore,
      fraudFlagsJson: JSON.stringify(fraud.flags),
    },
  });

  await logAudit({
    actorId: auth.user.id,
    action: "JOB_UPDATED",
    entityType: "JOB",
    entityId: id,
    metadata: { status: updated.status },
  });

  return NextResponse.json({ job: updated, antifraud: fraud });
}

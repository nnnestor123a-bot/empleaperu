import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { jobInputSchema } from "@/lib/validators";
import { evaluateJobAntifraud } from "@/lib/antifraud";
import { getDepartmentCoords } from "@/lib/peru-data";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import {
  calculateCompatibility,
  estimateExperienceYears,
  inferHighestEducation,
} from "@/lib/compatibility";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const department = (sp.get("department") || "").trim();
  const category = (sp.get("category") || "").trim();
  const modality = (sp.get("modality") || "").trim();
  const experience = (sp.get("experience") || "").trim();
  const contract = (sp.get("contract") || "").trim();
  const salaryMin = sp.get("salaryMin") ? Number(sp.get("salaryMin")) : undefined;
  const days = sp.get("days") ? Number(sp.get("days")) : undefined;
  const internship = sp.get("internship") === "true";
  const featured = sp.get("featured") === "true";
  const companyId = (sp.get("companyId") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") || 12)));

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (q) {
    const isPg = (process.env.DATABASE_URL || "").startsWith("postgres");
    const ci = isPg ? { contains: q, mode: "insensitive" as const } : { contains: q };
    where.OR = [
      { title: ci },
      { description: ci },
      { company: { tradeName: ci } },
      { department: ci },
      { district: ci },
    ];
  }
  if (department) where.department = department;
  if (category) where.category = { slug: category };
  if (modality) where.modality = modality;
  if (experience) where.experienceLevel = experience;
  if (contract) where.contractType = contract;
  if (internship) where.isInternship = true;
  if (featured) where.isFeatured = true;
  if (companyId) where.companyId = companyId;
  if (salaryMin && !Number.isNaN(salaryMin)) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { salaryMaxPen: { gte: salaryMin } },
      { salaryMinPen: { gte: salaryMin } },
    ];
  }
  if (days && !Number.isNaN(days)) {
    where.publishedAt = { gte: new Date(Date.now() - days * 24 * 3600 * 1000) };
  }

  const [total, jobs, user] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            tradeName: true,
            sector: true,
            verificationStatus: true,
            department: true,
            size: true,
          },
        },
        category: { select: { id: true, name: true, slug: true } },
        skills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    getCurrentUser(),
  ]);

  let candInput: Parameters<typeof calculateCompatibility>[0] | null = null;
  let favSet = new Set<string>();
  let appliedSet = new Set<string>();

  if (user?.candidateProfileId) {
    const [profile, favs, apps] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { id: user.candidateProfileId },
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          educations: true,
        },
      }),
      prisma.favorite.findMany({ where: { userId: user.id }, select: { jobId: true } }),
      prisma.application.findMany({
        where: { candidateId: user.candidateProfileId },
        select: { jobId: true },
      }),
    ]);

    favSet = new Set(favs.map((f) => f.jobId));
    appliedSet = new Set(apps.map((a) => a.jobId));

    if (profile) {
      candInput = {
        skills: profile.skills.map((s) => s.skill.name),
        experienceYears: estimateExperienceYears(profile.experiences),
        highestEducation: inferHighestEducation(profile.educations),
        department: profile.department,
        preferredModality: profile.preferredModality,
        expectedSalaryPen: profile.expectedSalaryPen,
      };
    }
  }

  const enriched = jobs.map((job) => {
    const jobSkills = job.skills.map((s) => s.skill.name);
    const compatibility = candInput
      ? calculateCompatibility(candInput, {
          skills: jobSkills,
          experienceLevel: job.experienceLevel,
          educationLevel: job.educationLevel,
          department: job.department,
          modality: job.modality,
          salaryMinPen: job.salaryMinPen,
          salaryMaxPen: job.salaryMaxPen,
        })
      : null;

    return {
      ...job,
      skillNames: jobSkills,
      fraudFlags: JSON.parse(job.fraudFlagsJson || "[]"),
      isFavorite: favSet.has(job.id),
      hasApplied: appliedSet.has(job.id),
      compatibility,
    };
  });

  return NextResponse.json({
    jobs: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = jobInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const companyId =
      auth.user.role === "ADMIN" && body.companyId
        ? String(body.companyId)
        : auth.user.primaryCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: "No tienes una empresa asociada." }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!company) {
      return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });
    }

    const data = parsed.data;

    // Enforce plan limits when publishing
    if (data.status === "PUBLISHED") {
      const activePlan = company.subscriptions[0]?.plan;
      const maxJobs = activePlan?.maxActiveJobs ?? 3;
      const maxFeatured = activePlan?.maxFeaturedJobs ?? 0;

      const currentActive = await prisma.job.count({
        where: { companyId, status: "PUBLISHED" },
      });
      if (currentActive >= maxJobs) {
        return NextResponse.json(
          {
            error: `Has alcanzado el límite de ${maxJobs} vacantes activas de tu plan actual. Pausa una vacante o actualiza tu plan.`,
          },
          { status: 403 }
        );
      }
      if (data.isFeatured) {
        const currentFeatured = await prisma.job.count({
          where: { companyId, status: "PUBLISHED", isFeatured: true },
        });
        if (currentFeatured >= maxFeatured) {
          return NextResponse.json(
            {
              error: `Tu plan permite hasta ${maxFeatured} vacantes destacadas simultáneas.`,
            },
            { status: 403 }
          );
        }
      }
    }

    const dupTitle = await prisma.job.findFirst({
      where: { companyId, title: data.title, status: "PUBLISHED" },
    });

    const fraud = evaluateJobAntifraud({
      title: data.title,
      description: data.description,
      responsibilities: data.responsibilities,
      requirements: data.requirements,
      salaryMinPen: data.salaryMinPen,
      salaryMaxPen: data.salaryMaxPen,
      companyVerified: company.verificationStatus === "VERIFIED",
      isDuplicateTitleInCompany: Boolean(dupTitle),
    });

    const coords = getDepartmentCoords(data.department);
    const slug = `${slugify(data.title)}-${Date.now().toString(36)}`;

    const job = await prisma.job.create({
      data: {
        companyId,
        categoryId: data.categoryId,
        title: data.title,
        slug,
        description: data.description,
        responsibilities: data.responsibilities,
        requirements: data.requirements,
        benefits: data.benefits || "",
        department: data.department,
        province: data.province || data.department,
        district: data.district || "",
        latitude: coords.lat,
        longitude: coords.lng,
        salaryMinPen: data.salaryMinPen ?? null,
        salaryMaxPen: data.salaryMaxPen ?? null,
        salaryVisible: data.salaryVisible,
        modality: data.modality,
        contractType: data.contractType,
        scheduleType: data.scheduleType,
        experienceLevel: data.experienceLevel,
        educationLevel: data.educationLevel,
        vacanciesCount: data.vacanciesCount,
        isInternship: data.isInternship,
        internshipCareer: data.internshipCareer ?? null,
        internshipCycle: data.internshipCycle ?? null,
        isFeatured: data.isFeatured,
        status: data.status,
        fraudRiskScore: fraud.riskScore,
        fraudFlagsJson: JSON.stringify(fraud.flags),
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        expiresAt: new Date(Date.now() + 45 * 24 * 3600 * 1000),
      },
    });

    for (const skName of data.skillNames) {
      const cleanName = skName.trim();
      if (!cleanName) continue;
      const skill = await prisma.skill.upsert({
        where: { name: cleanName },
        update: {},
        create: { name: cleanName, category: "TECHNICAL" },
      });
      await prisma.jobSkill.upsert({
        where: { jobId_skillId: { jobId: job.id, skillId: skill.id } },
        update: {},
        create: { jobId: job.id, skillId: skill.id },
      });
    }

    await logAudit({
      actorId: auth.user.id,
      action: "JOB_CREATED",
      entityType: "JOB",
      entityId: job.id,
      metadata: { title: job.title, status: job.status, fraudRiskScore: fraud.riskScore },
    });

    return NextResponse.json({ job, antifraud: fraud }, { status: 201 });
  } catch (err) {
    console.error("Create job error:", err);
    return NextResponse.json({ error: "Error al crear la vacante." }, { status: 500 });
  }
}

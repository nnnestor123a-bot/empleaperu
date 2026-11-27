import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function computeCompletion(profile: {
  headline: string;
  bio: string;
  department: string;
  expectedSalaryPen: number | null;
  experiences: unknown[];
  educations: unknown[];
  skills: unknown[];
  resumes: unknown[];
}): number {
  let pct = 15;
  if (profile.headline.trim().length > 5) pct += 15;
  if (profile.bio.trim().length > 20) pct += 10;
  if (profile.department) pct += 5;
  if (profile.expectedSalaryPen) pct += 5;
  if (profile.experiences.length > 0) pct += 15;
  if (profile.educations.length > 0) pct += 15;
  if (profile.skills.length >= 3) pct += 10;
  if (profile.resumes.length > 0) pct += 10;
  return Math.min(100, pct);
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: auth.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, consentAcceptedAt: true, createdAt: true } },
      experiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startYear: "desc" } },
      certifications: { orderBy: { issueYear: "desc" } },
      skills: { include: { skill: true } },
      resumes: { orderBy: { createdAt: "desc" } },
      resumeVersions: { orderBy: { updatedAt: "desc" } },
      portfolioItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  }

  // Ley 29733 data portability export
  if (req.nextUrl.searchParams.get("export") === "true") {
    await logAudit({
      actorId: auth.user.id,
      action: "PERSONAL_DATA_EXPORTED",
      entityType: "USER",
      entityId: auth.user.id,
    });
    return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), profile }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mis-datos-empleaperu.json"',
      },
    });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: auth.user.id },
    include: { experiences: true, educations: true, skills: true, resumes: true },
  });
  if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });

  const body = await req.json();

  if (body.action === "addExperience") {
    await prisma.workExperience.create({
      data: {
        candidateId: profile.id,
        company: String(body.company || ""),
        title: String(body.title || ""),
        startDate: String(body.startDate || "2024-01"),
        endDate: body.isCurrent ? null : body.endDate || null,
        isCurrent: Boolean(body.isCurrent),
        description: String(body.description || ""),
      },
    });
  } else if (body.action === "deleteExperience" && body.id) {
    await prisma.workExperience.deleteMany({ where: { id: body.id, candidateId: profile.id } });
  } else if (body.action === "addEducation") {
    await prisma.education.create({
      data: {
        candidateId: profile.id,
        institution: String(body.institution || ""),
        degree: String(body.degree || ""),
        fieldOfStudy: String(body.fieldOfStudy || ""),
        startYear: Number(body.startYear || 2020),
        endYear: body.inProgress ? null : Number(body.endYear || 2024),
        inProgress: Boolean(body.inProgress),
      },
    });
  } else if (body.action === "deleteEducation" && body.id) {
    await prisma.education.deleteMany({ where: { id: body.id, candidateId: profile.id } });
  } else if (body.action === "addCertification") {
    await prisma.certification.create({
      data: {
        candidateId: profile.id,
        name: String(body.name || ""),
        issuer: String(body.issuer || ""),
        issueYear: Number(body.issueYear || 2025),
        credentialUrl: body.credentialUrl ? String(body.credentialUrl) : null,
      },
    });
  } else if (body.action === "deleteCertification" && body.id) {
    await prisma.certification.deleteMany({ where: { id: body.id, candidateId: profile.id } });
  } else if (body.action === "addSkill" && body.skillName) {
    const clean = String(body.skillName).trim();
    const skill = await prisma.skill.upsert({
      where: { name: clean },
      update: {},
      create: { name: clean, category: body.category || "TECHNICAL" },
    });
    await prisma.candidateSkill.upsert({
      where: { candidateId_skillId: { candidateId: profile.id, skillId: skill.id } },
      update: { level: body.level || "INTERMEDIATE" },
      create: { candidateId: profile.id, skillId: skill.id, level: body.level || "INTERMEDIATE" },
    });
  } else if (body.action === "removeSkill" && body.skillId) {
    await prisma.candidateSkill.deleteMany({
      where: { candidateId: profile.id, skillId: body.skillId },
    });
  } else if (body.action === "addPortfolio") {
    await prisma.portfolioItem.create({
      data: {
        candidateId: profile.id,
        title: String(body.title || ""),
        description: String(body.description || ""),
        category: String(body.category || "Proyecto Web"),
        projectUrl: body.projectUrl || null,
        repoUrl: body.repoUrl || null,
        tags: String(body.tags || ""),
      },
    });
  } else if (body.action === "deletePortfolio" && body.id) {
    await prisma.portfolioItem.deleteMany({ where: { id: body.id, candidateId: profile.id } });
  } else {
    // Update basic profile fields
    if (body.name || body.phone !== undefined) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: {
          ...(body.name ? { name: String(body.name) } : {}),
          ...(body.phone !== undefined ? { phone: String(body.phone) } : {}),
        },
      });
    }
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        headline: body.headline ?? profile.headline,
        bio: body.bio ?? profile.bio,
        department: body.department ?? profile.department,
        province: body.province ?? profile.province,
        district: body.district ?? profile.district,
        availability: body.availability ?? profile.availability,
        expectedSalaryPen:
          body.expectedSalaryPen !== undefined
            ? body.expectedSalaryPen
              ? Number(body.expectedSalaryPen)
              : null
            : profile.expectedSalaryPen,
        preferredModality: body.preferredModality ?? profile.preferredModality,
        portfolioPublic:
          body.portfolioPublic !== undefined ? Boolean(body.portfolioPublic) : profile.portfolioPublic,
        showPhone: body.showPhone !== undefined ? Boolean(body.showPhone) : profile.showPhone,
        showEmail: body.showEmail !== undefined ? Boolean(body.showEmail) : profile.showEmail,
      },
    });
  }

  const refreshed = await prisma.candidateProfile.findUnique({
    where: { id: profile.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      experiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startYear: "desc" } },
      certifications: { orderBy: { issueYear: "desc" } },
      skills: { include: { skill: true } },
      resumes: { orderBy: { createdAt: "desc" } },
      portfolioItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (refreshed) {
    const pct = computeCompletion(refreshed);
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { completionPct: pct },
    });
    refreshed.completionPct = pct;
  }

  return NextResponse.json({ profile: refreshed });
}

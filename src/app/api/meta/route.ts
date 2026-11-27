import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [categories, skills, jobCount, companyCount, candidateCount, appCount, recentTitles] =
    await Promise.all([
      prisma.jobCategory.findMany({
        include: { _count: { select: { jobs: { where: { status: "PUBLISHED" } } } } },
        orderBy: { name: "asc" },
      }),
      prisma.skill.findMany({ orderBy: { name: "asc" } }),
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.company.count(),
      prisma.candidateProfile.count(),
      prisma.application.count(),
      prisma.job.findMany({
        where: { status: "PUBLISHED" },
        select: { title: true, department: true, company: { select: { tradeName: true } } },
        take: 40,
      }),
    ]);

  const suggestions = Array.from(
    new Set([
      ...recentTitles.map((j) => j.title),
      ...recentTitles.map((j) => j.company.tradeName),
    ])
  ).slice(0, 30);

  return NextResponse.json({
    categories,
    skills,
    stats: {
      activeJobs: jobCount,
      companies: companyCount,
      candidates: candidateCount,
      applications: appCount,
    },
    suggestions,
  });
}

import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export const getHomePageData = unstable_cache(
  async () => {
    const [
      activeJobsCount,
      companiesCount,
      candidatesCount,
      applicationsCount,
      categories,
      featuredJobs,
      latestJobs,
      featuredCompanies,
      deptCounts,
    ] = await Promise.all([
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.company.count(),
      prisma.candidateProfile.count(),
      prisma.application.count(),
      prisma.jobCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: { select: { jobs: { where: { status: "PUBLISHED" } } } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.job.findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        select: {
          id: true,
          slug: true,
          title: true,
          department: true,
          district: true,
          modality: true,
          salaryMinPen: true,
          salaryMaxPen: true,
          salaryVisible: true,
          publishedAt: true,
          company: { select: { id: true, tradeName: true, verificationStatus: true } },
          skills: { select: { id: true, skill: { select: { name: true } } }, take: 4 },
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
      }),
      prisma.job.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          department: true,
          modality: true,
          salaryMinPen: true,
          salaryMaxPen: true,
          salaryVisible: true,
          publishedAt: true,
          company: { select: { id: true, tradeName: true, verificationStatus: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
      }),
      prisma.company.findMany({
        where: { verificationStatus: "VERIFIED" },
        select: {
          id: true,
          tradeName: true,
          sector: true,
          department: true,
          _count: { select: { jobs: { where: { status: "PUBLISHED" } } } },
        },
        orderBy: [{ isFeatured: "desc" }, { tradeName: "asc" }],
        take: 6,
      }),
      prisma.job.groupBy({
        by: ["department"],
        where: { status: "PUBLISHED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
    ]);

    return {
      activeJobsCount,
      companiesCount,
      candidatesCount,
      applicationsCount,
      categories,
      featuredJobs,
      latestJobs,
      featuredCompanies,
      deptCounts,
    };
  },
  ["empleaperu-home-v1"],
  { revalidate: 60, tags: ["jobs", "companies", "categories"] }
);

export const getCategoriesCached = unstable_cache(
  async () =>
    prisma.jobCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ["empleaperu-categories-v1"],
  { revalidate: 300, tags: ["categories"] }
);

export const getCompaniesDirectoryCached = unstable_cache(
  async () =>
    prisma.company.findMany({
      select: {
        id: true,
        tradeName: true,
        ruc: true,
        sector: true,
        description: true,
        department: true,
        verificationStatus: true,
        _count: {
          select: {
            jobs: { where: { status: "PUBLISHED" } },
            reviews: { where: { status: "APPROVED" } },
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: {
            environmentRating: true,
            growthRating: true,
            selectionRating: true,
            communicationRating: true,
            benefitsRating: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { verificationStatus: "desc" }, { tradeName: "asc" }],
    }),
  ["empleaperu-companies-dir-v1"],
  { revalidate: 60, tags: ["companies", "jobs"] }
);

export const getRecentPublishedJobsCached = unstable_cache(
  async () =>
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        department: true,
        modality: true,
        salaryMinPen: true,
        salaryMaxPen: true,
        salaryVisible: true,
        experienceLevel: true,
        educationLevel: true,
        company: { select: { tradeName: true } },
        skills: { select: { skill: { select: { name: true } } } },
      },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 20,
    }),
  ["empleaperu-recent-jobs-v1"],
  { revalidate: 60, tags: ["jobs"] }
);

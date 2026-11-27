import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calcMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const department = sp.get("department") || undefined;
  const category = sp.get("category") || undefined;
  const experience = sp.get("experience") || undefined;
  const modality = sp.get("modality") || undefined;
  const contract = sp.get("contract") || undefined;

  const jobs = await prisma.job.findMany({
    where: {
      status: "PUBLISHED",
      salaryVisible: true,
      salaryMinPen: { not: null },
      ...(department ? { department } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(experience ? { experienceLevel: experience } : {}),
      ...(modality ? { modality } : {}),
      ...(contract ? { contractType: contract } : {}),
    },
    include: { category: true },
  });

  const midpoints = jobs
    .map((j) => {
      const min = j.salaryMinPen ?? 0;
      const max = j.salaryMaxPen ?? min;
      return Math.round((min + max) / 2);
    })
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const avg = midpoints.length
    ? Math.round(midpoints.reduce((a, b) => a + b, 0) / midpoints.length)
    : 0;
  const median = calcMedian(midpoints);
  const min = midpoints[0] ?? 0;
  const max = midpoints[midpoints.length - 1] ?? 0;

  const groupBy = (keyFn: (j: (typeof jobs)[number]) => string) => {
    const map = new Map<string, number[]>();
    for (const j of jobs) {
      const key = keyFn(j);
      const mid = Math.round(((j.salaryMinPen ?? 0) + (j.salaryMaxPen ?? j.salaryMinPen ?? 0)) / 2);
      if (mid <= 0) continue;
      const arr = map.get(key) || [];
      arr.push(mid);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([name, vals]) => {
        vals.sort((a, b) => a - b);
        return {
          name,
          sampleSize: vals.length,
          average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          median: calcMedian(vals),
          min: vals[0],
          max: vals[vals.length - 1],
        };
      })
      .sort((a, b) => b.average - a.average);
  };

  return NextResponse.json({
    sampleSize: midpoints.length,
    averagePen: avg,
    medianPen: median,
    minPen: min,
    maxPen: max,
    byCategory: groupBy((j) => j.category.name),
    byDepartment: groupBy((j) => j.department),
    byExperience: groupBy((j) => j.experienceLevel),
    byModality: groupBy((j) => j.modality),
    disclaimer:
      "Indicadores calculados directamente desde las vacantes en soles (PEN) de la base de datos local de demostración. Los datos semilla son sintéticos y no constituyen estadística oficial nacional.",
  });
}

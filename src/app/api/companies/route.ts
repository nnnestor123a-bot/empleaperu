import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canAccessCompany, requireRole } from "@/lib/auth";
import { validatePeruvianRucFormat } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const sector = (sp.get("sector") || "").trim();

  const where: Record<string, unknown> = {};
  if (q) {
    const isPg = (process.env.DATABASE_URL || "").startsWith("postgres");
    const ci = isPg ? { contains: q, mode: "insensitive" as const } : { contains: q };
    where.OR = [
      { tradeName: ci },
      { legalName: ci },
      { sector: ci },
      { department: ci },
    ];
  }
  if (sector) where.sector = sector;

  const companies = await prisma.company.findMany({
    where,
    include: {
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
  });

  const data = companies.map((c) => {
    const avgRating =
      c.reviews.length > 0
        ? Math.round(
            (c.reviews.reduce(
              (acc, r) =>
                acc +
                (r.environmentRating +
                  r.growthRating +
                  r.selectionRating +
                  r.communicationRating +
                  r.benefitsRating) /
                  5,
              0
            ) /
              c.reviews.length) *
              10
          ) / 10
        : null;
    return { ...c, avgRating, reviews: undefined };
  });

  return NextResponse.json({ companies: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(["COMPANY", "ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const companyId = body.companyId || auth.user.primaryCompanyId;
  if (!companyId || !canAccessCompany(auth.user, companyId)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (body.ruc) {
    const check = validatePeruvianRucFormat(String(body.ruc));
    if (!check.valid) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      legalName: body.legalName,
      tradeName: body.tradeName,
      ruc: body.ruc,
      sector: body.sector,
      description: body.description,
      department: body.department,
      province: body.province,
      district: body.district,
      website: body.website,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      size: body.size,
    },
  });

  await logAudit({
    actorId: auth.user.id,
    action: "COMPANY_UPDATED",
    entityType: "COMPANY",
    entityId: companyId,
  });

  revalidateTag("companies");
  return NextResponse.json({ company: updated });
}

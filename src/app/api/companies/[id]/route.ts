import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      jobs: {
        where: { status: "PUBLISHED" },
        include: { category: true, skills: { include: { skill: true } } },
        orderBy: { publishedAt: "desc" },
      },
      reviews: {
        where: { status: "APPROVED" },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ company });
}

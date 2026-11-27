import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const favorites = await prisma.favorite.findMany({
    where: { userId: auth.user.id },
    include: {
      job: {
        include: {
          company: { select: { id: true, tradeName: true, verificationStatus: true } },
          category: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId requerido." }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_jobId: { userId: auth.user.id, jobId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.favorite.create({
    data: { userId: auth.user.id, jobId },
  });
  return NextResponse.json({ saved: true });
}

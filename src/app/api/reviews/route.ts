import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
  }

  const dup = await prisma.companyReview.findUnique({
    where: {
      companyId_authorId: { companyId: parsed.data.companyId, authorId: auth.user.id },
    },
  });
  if (dup) {
    return NextResponse.json({ error: "Ya registraste una valoración para esta empresa." }, { status: 409 });
  }

  const review = await prisma.companyReview.create({
    data: {
      ...parsed.data,
      authorId: auth.user.id,
      status: "PENDING",
    },
  });

  return NextResponse.json(
    {
      review,
      message: "Tu valoración fue enviada y pasará por moderación antes de publicarse.",
    },
    { status: 201 }
  );
}

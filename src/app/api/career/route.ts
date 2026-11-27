import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { CAREER_PATHS } from "@/lib/career-paths";

export async function GET() {
  const auth = await requireRole(["CANDIDATE", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [goal, profile] = await Promise.all([
    prisma.careerGoal.findUnique({ where: { userId: auth.user.id } }),
    auth.user.candidateProfileId
      ? prisma.candidateProfile.findUnique({
          where: { id: auth.user.candidateProfileId },
          include: { skills: { include: { skill: true } } },
        })
      : null,
  ]);

  const userSkills = profile?.skills.map((s) => s.skill.name) || [];
  const selectedRole = goal?.targetRole || CAREER_PATHS[0].role;
  const completedSteps: string[] = goal ? JSON.parse(goal.completedStepsJson || "[]") : [];

  return NextResponse.json({
    paths: CAREER_PATHS,
    selectedRole,
    completedSteps,
    userSkills,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const targetRole = String(body.targetRole || CAREER_PATHS[0].role);
  const completedSteps = Array.isArray(body.completedSteps) ? body.completedSteps : [];

  const goal = await prisma.careerGoal.upsert({
    where: { userId: auth.user.id },
    update: { targetRole, completedStepsJson: JSON.stringify(completedSteps) },
    create: {
      userId: auth.user.id,
      targetRole,
      completedStepsJson: JSON.stringify(completedSteps),
    },
  });

  return NextResponse.json({ goal });
}

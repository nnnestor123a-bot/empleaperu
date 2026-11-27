import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";

interface QuestionItem {
  id: string;
  prompt: string;
  options: string[];
  answerIdx: number;
  explanation: string;
}

export async function GET() {
  const user = await getCurrentUser();
  const assessments = await prisma.assessment.findMany({
    orderBy: [{ area: "asc" }, { title: "asc" }],
  });

  const attempts = user
    ? await prisma.assessmentAttempt.findMany({
        where: { userId: user.id },
        include: { assessment: { select: { title: true, area: true } } },
        orderBy: { completedAt: "desc" },
      })
    : [];

  return NextResponse.json({
    assessments: assessments.map((a) => {
      const qs = JSON.parse(a.questionsJson || "[]") as QuestionItem[];
      return {
        id: a.id,
        title: a.title,
        area: a.area,
        difficulty: a.difficulty,
        durationMin: a.durationMin,
        description: a.description,
        questionCount: qs.length,
        questions: qs.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })),
      };
    }),
    attempts,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();

  // Company custom assessment creation
  if (body.mode === "create" && (auth.user.role === "COMPANY" || auth.user.role === "ADMIN")) {
    const created = await prisma.assessment.create({
      data: {
        title: String(body.title || "Evaluación Empresarial"),
        area: String(body.area || "PROGRAMACION"),
        difficulty: String(body.difficulty || "INTERMEDIO"),
        durationMin: Number(body.durationMin || 15),
        description: String(body.description || "Prueba técnica personalizada"),
        companyId: auth.user.primaryCompanyId ?? null,
        questionsJson: JSON.stringify(body.questions || []),
      },
    });
    return NextResponse.json({ assessment: created }, { status: 201 });
  }

  // Candidate submits answers
  const assessment = await prisma.assessment.findUnique({ where: { id: String(body.assessmentId) } });
  if (!assessment) return NextResponse.json({ error: "Evaluación no encontrada." }, { status: 404 });

  const questions = JSON.parse(assessment.questionsJson || "[]") as QuestionItem[];
  const answers = (body.answers || {}) as Record<string, number>;

  let correct = 0;
  const feedback = questions.map((q) => {
    const chosen = answers[q.id];
    const isCorrect = chosen === q.answerIdx;
    if (isCorrect) correct += 1;
    return {
      questionId: q.id,
      prompt: q.prompt,
      isCorrect,
      correctOption: q.options[q.answerIdx],
      explanation: q.explanation,
    };
  });

  const scorePct = Math.round((correct / Math.max(1, questions.length)) * 100);
  const passed = scorePct >= 70;

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment.id,
      userId: auth.user.id,
      answersJson: JSON.stringify(answers),
      scorePct,
      passed,
      feedbackJson: JSON.stringify(feedback),
    },
  });

  return NextResponse.json({
    attempt,
    scorePct,
    passed,
    feedback,
    note: "Las evaluaciones son orientativas y complementarias; nunca constituyen un criterio único de contratación.",
  });
}

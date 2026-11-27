import { NextRequest, NextResponse } from "next/server";
import { evaluateInterviewAnswer, INTERVIEW_QUESTIONS } from "@/lib/interview-bank";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const role = (sp.get("role") || "").toLowerCase();
  const type = sp.get("type") || "";
  const level = sp.get("level") || "";

  const filtered = INTERVIEW_QUESTIONS.filter((q) => {
    if (role && !q.role.toLowerCase().includes(role) && !q.sector.toLowerCase().includes(role)) {
      return false;
    }
    if (type && q.type !== type) return false;
    if (level && q.level !== level) return false;
    return true;
  });

  return NextResponse.json({ questions: filtered });
}

export async function POST(req: NextRequest) {
  const { questionId, answer } = await req.json();
  const question = INTERVIEW_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Pregunta no encontrada." }, { status: 404 });
  }
  if (!answer || String(answer).trim().length < 8) {
    return NextResponse.json({ error: "Escribe una respuesta de al menos 8 caracteres." }, { status: 400 });
  }
  const evaluation = evaluateInterviewAnswer(question, String(answer));
  return NextResponse.json({ evaluation, sampleOutline: question.sampleOutline });
}

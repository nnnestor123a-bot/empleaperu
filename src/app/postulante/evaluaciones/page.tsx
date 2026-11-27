"use client";

import React, { useEffect, useState } from "react";
import { Award, Clock } from "lucide-react";

interface AssessmentItem {
  id: string;
  title: string;
  area: string;
  difficulty: string;
  durationMin: number;
  description: string;
  questions: Array<{ id: string; prompt: string; options: string[] }>;
}

interface AttemptRow {
  id: string;
  scorePct: number;
  passed: boolean;
  completedAt: string;
  assessment: { title: string; area: string };
}

export default function PostulanteEvaluacionesPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [active, setActive] = useState<AssessmentItem | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<{
    scorePct: number;
    passed: boolean;
    note: string;
    feedback: Array<{ prompt: string; isCorrect: boolean; correctOption: string; explanation: string }>;
  } | null>(null);

  async function load() {
    const res = await fetch("/api/assessments");
    const data = await res.json();
    setAssessments(data.assessments || []);
    setAttempts(data.attempts || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!active || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [active, secondsLeft]);

  function startAssessment(a: AssessmentItem) {
    setActive(a);
    setAnswers({});
    setResult(null);
    setSecondsLeft(a.durationMin * 60);
  }

  async function submitQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: active.id, answers }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
      setActive(null);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
          <Award className="h-6 w-6 text-[#2563EB]" /> Evaluaciones Técnicas y de Competencias
        </h1>
        <p className="text-xs text-slate-500">
          Banco de 9 áreas (programación, ciberseguridad, redes, electricidad, automatización, administración, ofimática, idiomas y lógica). Orientativo y nunca criterio único de contratación.
        </p>
      </div>

      {active ? (
        <form onSubmit={submitQuiz} className="space-y-5 rounded-2xl border border-[#2563EB] bg-white p-6 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#2563EB]">{active.area}</span>
              <h2 className="text-lg font-bold text-[#12336B] dark:text-white">{active.title}</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-800 tabular-nums">
              <Clock className="h-4 w-4" /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </span>
          </div>

          {active.questions.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-bold">{idx + 1}. {q.prompt}</p>
              <div className="mt-2.5 space-y-1.5">
                {q.options.map((opt, optIdx) => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === optIdx}
                      onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                      required
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button type="submit" className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white">
              Finalizar evaluación
            </button>
            <button type="button" onClick={() => setActive(null)} className="rounded-xl border px-4 py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3 text-xs dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-base font-extrabold text-[#12336B] dark:text-white">
                Resultado: {result.scorePct}% — {result.passed ? "Aprobado" : "En práctica"}
              </p>
              {result.feedback.map((f, i) => (
                <div key={i} className="rounded-xl bg-white/80 p-3 dark:bg-slate-900">
                  <p className="font-bold">{f.isCorrect ? "✓" : "✗"} {f.prompt}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Respuesta correcta: <strong>{f.correctOption}</strong> — {f.explanation}
                  </p>
                </div>
              ))}
              <p className="text-[11px] text-slate-500">{result.note}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((a) => (
              <div key={a.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#2563EB]">{a.area}</span>
                    <span className="text-slate-500">{a.durationMin} min · {a.difficulty}</span>
                  </div>
                  <h2 className="mt-2 font-bold text-slate-900 dark:text-white">{a.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{a.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startAssessment(a)}
                  className="mt-4 w-full rounded-xl bg-[#12336B] py-2 text-xs font-bold text-white hover:bg-[#2563EB]"
                >
                  Iniciar evaluación
                </button>
              </div>
            ))}
          </div>

          {attempts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-[#12336B] dark:text-white">Historial de intentos ({attempts.length})</h2>
              <div className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {attempts.map((at) => (
                  <div key={at.id} className="flex items-center justify-between py-2">
                    <span><strong>{at.assessment.title}</strong> ({at.assessment.area})</span>
                    <span className={`font-bold ${at.passed ? "text-[#16A34A]" : "text-amber-600"}`}>
                      {at.scorePct}% ({at.passed ? "Aprobado" : "Práctica"})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

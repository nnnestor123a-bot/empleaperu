"use client";

import React, { useEffect, useState } from "react";
import { Calendar, CheckCircle2, MessageCircle } from "lucide-react";
import type { InterviewQuestion } from "@/lib/interview-bank";

export default function PostulanteEntrevistasPage() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedQ, setSelectedQ] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [evalRes, setEvalRes] = useState<{
    score: number;
    matchedCriteria: string[];
    missingCriteria: string[];
    feedback: string[];
    disclaimer: string;
    sampleOutline: string;
  } | null>(null);
  const [scheduled, setScheduled] = useState<Array<{ jobTitle: string; company: string; scheduledAt: string; modality: string; locationOrLink: string }>>([]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (typeFilter) sp.set("type", typeFilter);
    fetch(`/api/interviews/practice?${sp.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.questions || [];
        setQuestions(list);
        if (list.length > 0) setSelectedQ(list[0]);
      });

    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        const rows: typeof scheduled = [];
        for (const a of d.applications || []) {
          for (const iv of a.interviews || []) {
            rows.push({
              jobTitle: a.job.title,
              company: a.job.company.tradeName,
              scheduledAt: iv.scheduledAt,
              modality: iv.modality,
              locationOrLink: iv.locationOrLink,
            });
          }
        }
        setScheduled(rows);
      });
  }, [typeFilter]);

  async function evaluate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQ) return;
    const res = await fetch("/api/interviews/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: selectedQ.id, answer }),
    });
    const data = await res.json();
    if (res.ok) {
      setEvalRes({ ...data.evaluation, sampleOutline: data.sampleOutline });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
          Entrevistas Programadas y Simulador Local
        </h1>
        <p className="text-xs text-slate-500">
          Revisa tus citas reales con empresas y practica preguntas técnicas, conductuales y situacionales con retroalimentación por criterios.
        </p>
      </div>

      {/* Scheduled Interviews */}
      {scheduled.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#12336B] dark:text-blue-200">
            <Calendar className="h-4 w-4 text-[#2563EB]" /> Tus próximas entrevistas ({scheduled.length})
          </h2>
          <div className="mt-3 space-y-2">
            {scheduled.map((iv, i) => (
              <div key={i} className="rounded-xl bg-white p-3 text-xs shadow-sm dark:bg-slate-900">
                <p className="font-bold">{iv.jobTitle} — {iv.company}</p>
                <p className="text-slate-500">
                  {new Date(iv.scheduledAt).toLocaleString("es-PE")} · {iv.modality} · {iv.locationOrLink}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todos los tipos de pregunta</option>
            <option value="TECNICA">Técnica</option>
            <option value="CONDUCTUAL">Conductual</option>
            <option value="SITUACIONAL">Situacional</option>
          </select>

          <div className="space-y-2">
            {questions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setSelectedQ(q);
                  setEvalRes(null);
                  setAnswer("");
                }}
                className={`w-full rounded-xl border p-3.5 text-left text-xs transition ${
                  selectedQ?.id === q.id
                    ? "border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[#2563EB]">
                  <span>{q.role}</span>
                  <span>{q.type} · {q.difficulty}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-700 dark:text-slate-300">{q.question}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          {selectedQ ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563EB]">{selectedQ.role}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold dark:bg-slate-800">{selectedQ.type}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-[#16A34A]">{selectedQ.level}</span>
              </div>
              <h2 className="flex items-start gap-2 text-base font-bold text-[#12336B] dark:text-white">
                <MessageCircle className="h-5 w-5 shrink-0 text-[#2563EB] mt-0.5" />
                {selectedQ.question}
              </h2>

              <form onSubmit={evaluate} className="space-y-3">
                <textarea
                  rows={5}
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Redacta tu respuesta estructurada (usa método STAR o pasos técnicos concretos)..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <button type="submit" className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12336B]">
                  Evaluar mi respuesta
                </button>
              </form>

              {evalRes && (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-[#16A34A]" /> Retroalimentación por criterios
                    </span>
                    <span className="text-lg font-extrabold text-[#16A34A]">{evalRes.score}/100</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {evalRes.feedback.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900">
                    <p className="font-bold text-[#12336B] dark:text-blue-300">Estructura de referencia sugerida:</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{evalRes.sampleOutline}</p>
                  </div>
                  <p className="text-[11px] text-slate-500">{evalRes.disclaimer}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

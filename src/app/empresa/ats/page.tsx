"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Calendar, Download, FileText, Kanban, MessageSquare, Sparkles } from "lucide-react";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_ORDER } from "@/lib/utils";

interface AtsApp {
  id: string;
  status: string;
  compatibilityScore: number;
  compatibilityBreakdownJson: string;
  internalNotes: string;
  recruiterRating: number | null;
  coverLetter: string;
  createdAt: string;
  job: { id: string; title: string };
  candidate: {
    id: string;
    headline: string;
    department: string;
    user: { id: string; name: string; email: string; phone: string | null };
    skills: Array<{ skill: { name: string } }>;
    resumes: Array<{ id: string; originalName: string }>;
  };
  resume: { id: string; originalName: string } | null;
  interviews: Array<{ id: string; scheduledAt: string; modality: string; locationOrLink: string }>;
  evaluations: Array<{ id: string; overallScore: number; comments: string; reviewer: { name: string } }>;
}

export default function EmpresaAtsPage() {
  const [jobs, setJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [jobFilter, setJobFilter] = useState("");
  const [apps, setApps] = useState<AtsApp[]>([]);
  const [selected, setSelected] = useState<AtsApp | null>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(4);
  const [ivDate, setIvDate] = useState("");
  const [ivLink, setIvLink] = useState("https://meet.empleaperu.local/entrevista");
  const [msgText, setMsgText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [jRes, aRes] = await Promise.all([
      fetch("/api/empresa/jobs"),
      fetch(`/api/applications${jobFilter ? `?jobId=${jobFilter}` : ""}`),
    ]);
    if (jRes.ok) {
      const jd = await jRes.json();
      setJobs(jd.jobs || []);
    }
    if (aRes.ok) {
      const ad = await aRes.json();
      setApps(ad.applications || []);
      if (selected) {
        const refreshed = (ad.applications || []).find((a: AtsApp) => a.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    }
  }, [jobFilter, selected?.id]);

  useEffect(() => {
    load();
  }, [jobFilter]);

  async function updateApp(id: string, payload: Record<string, unknown>, okText: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setFeedback(okText);
      load();
    }
  }

  async function sendDirectMsg(applicationId: string) {
    if (!msgText.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, content: msgText }),
    });
    if (res.ok) {
      setMsgText("");
      setFeedback("Mensaje enviado al postulante.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
            <Kanban className="h-6 w-6 text-[#2563EB]" /> ATS Kanban y Gestión de Candidatos
          </h1>
          <p className="text-xs text-slate-500">
            Aislamiento estricto por empresa · Decisión humana asistida por compatibilidad explicable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todas mis vacantes ({apps.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          <a
            href={`/api/ats/export${jobFilter ? `?jobId=${jobFilter}` : ""}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#12336B] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#2563EB]"
          >
            <Download className="h-4 w-4" /> Exportar CSV autorizado
          </a>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {feedback}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {APPLICATION_STATUS_ORDER.map((stage) => {
          const colApps = apps.filter((a) => a.status === stage);
          return (
            <div
              key={stage}
              className="w-64 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#12336B] dark:text-blue-300">
                  {APPLICATION_STATUS_LABELS[stage]}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold tabular-nums dark:bg-slate-800">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {colApps.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelected(a);
                      setNotes(a.internalNotes || "");
                      setRating(a.recruiterRating || 4);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelected(a);
                        setNotes(a.internalNotes || "");
                      }
                    }}
                    className={`cursor-pointer rounded-xl border bg-white p-3 text-xs shadow-sm transition hover:border-[#2563EB] dark:bg-slate-900 ${
                      selected?.id === a.id ? "border-[#2563EB] ring-2 ring-[#2563EB]/20" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{a.candidate.user.name}</p>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">
                        <Sparkles className="h-2.5 w-2.5" /> {a.compatibilityScore}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">{a.job.title}</p>
                    <select
                      value={a.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateApp(a.id, { status: e.target.value }, `Candidato movido a ${e.target.value}.`)}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-800"
                    >
                      {APPLICATION_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Detail Drawer */}
      {selected && (
        <div className="rounded-2xl border border-[#2563EB] bg-white p-6 space-y-5 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-[#12336B] dark:text-white">
                {selected.candidate.user.name}
              </h2>
              <p className="text-xs text-slate-500">
                {selected.candidate.headline} · {selected.candidate.department} · {selected.candidate.user.email}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#2563EB]">Vacante: {selected.job.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-[#16A34A]">
                Compatibilidad: {selected.compatibilityScore}%
              </span>
              {(selected.resume || selected.candidate.resumes[0]) && (
                <a
                  href={`/api/resumes/${(selected.resume || selected.candidate.resumes[0]).id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-bold text-white"
                >
                  <FileText className="h-4 w-4" /> Descargar CV privado
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 text-xs">
            {/* Notes & Evaluation */}
            <div className="space-y-2.5">
              <p className="font-bold text-[#12336B] dark:text-white">Notas internas y calificación</p>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas privadas del equipo de selección..."
                className="w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <div className="flex items-center gap-2">
                <span>Puntaje (1–5):</span>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border p-1 dark:border-slate-700 dark:bg-slate-800">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    updateApp(
                      selected.id,
                      {
                        internalNotes: notes,
                        recruiterRating: rating,
                        evaluation: { technicalScore: rating, softSkillsScore: rating, cultureScore: rating, comments: notes },
                      },
                      "Notas y evaluación guardadas."
                    )
                  }
                  className="ml-auto rounded-lg bg-[#12336B] px-3 py-1.5 font-bold text-white"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Schedule Interview */}
            <div className="space-y-2.5">
              <p className="flex items-center gap-1 font-bold text-[#12336B] dark:text-white">
                <Calendar className="h-4 w-4 text-[#2563EB]" /> Programar entrevista
              </p>
              <input
                type="datetime-local"
                value={ivDate}
                onChange={(e) => setIvDate(e.target.value)}
                className="w-full rounded-xl border p-2 dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                value={ivLink}
                onChange={(e) => setIvLink(e.target.value)}
                placeholder="Enlace o dirección"
                className="w-full rounded-xl border p-2 dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => {
                  if (!ivDate) return;
                  updateApp(
                    selected.id,
                    {
                      status: "ENTREVISTA",
                      interview: { scheduledAt: ivDate, durationMin: 45, modality: "VIRTUAL", locationOrLink: ivLink },
                    },
                    "Entrevista programada y notificada al postulante."
                  );
                }}
                className="rounded-lg bg-[#16A34A] px-3 py-1.5 font-bold text-white"
              >
                Agendar entrevista
              </button>
            </div>

            {/* Direct Message */}
            <div className="space-y-2.5">
              <p className="flex items-center gap-1 font-bold text-[#12336B] dark:text-white">
                <MessageSquare className="h-4 w-4 text-[#2563EB]" /> Mensaje directo al candidato
              </p>
              <textarea
                rows={3}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Escribe un mensaje directo..."
                className="w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => sendDirectMsg(selected.id)}
                className="rounded-lg bg-[#2563EB] px-3 py-1.5 font-bold text-white"
              >
                Enviar mensaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

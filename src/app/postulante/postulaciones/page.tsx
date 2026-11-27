"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { APPLICATION_STATUS_LABELS } from "@/lib/utils";

interface AppItem {
  id: string;
  status: string;
  compatibilityScore: number;
  createdAt: string;
  job: {
    title: string;
    slug: string;
    department: string;
    company: { tradeName: string };
  };
  history: Array<{ id: string; toStatus: string; note: string; createdAt: string }>;
  interviews: Array<{ id: string; scheduledAt: string; modality: string; locationOrLink: string }>;
}

const TIMELINE_STAGES = ["ENVIADA", "REVISION", "PRESELECCION", "ENTREVISTA", "EVALUACION", "SELECCIONADO"];

export default function PostulantePostulacionesPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/applications");
    if (res.ok) {
      const data = await res.json();
      setApps(data.applications || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function withdraw(id: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RETIRADO" }),
    });
    if (res.ok) {
      setMsg("Postulación retirada.");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
          Mis Postulaciones y Timeline de Transparencia
        </h1>
        <p className="text-xs text-slate-500">
          Sigue cada etapa autorizada de tu proceso en tiempo real, entrevistas programadas y compatibilidad.
        </p>
      </div>

      {msg && <p className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-[#2563EB]">{msg}</p>}

      {apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
          Aún no tienes postulaciones.{" "}
          <Link href="/empleos" className="font-bold text-[#2563EB] underline">Explora empleos aquí</Link>.
        </div>
      ) : (
        apps.map((a) => {
          const currentIdx = TIMELINE_STAGES.indexOf(a.status);
          return (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/empleos/${a.job.slug}`} className="text-lg font-bold text-[#12336B] hover:underline dark:text-white">
                    {a.job.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {a.job.company.tradeName} · {a.job.department} · Postulado el {new Date(a.createdAt).toLocaleDateString("es-PE")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#16A34A]">
                    {a.compatibilityScore}% match
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">
                    {APPLICATION_STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>
              </div>

              {/* Transparency Stepper */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const done = currentIdx >= idx && a.status !== "NO_SELECCIONADO" && a.status !== "RETIRADO";
                  return (
                    <div
                      key={stage}
                      className={`rounded-xl border p-2 text-center text-[11px] font-semibold ${
                        done
                          ? "border-[#16A34A] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-slate-200 text-slate-400 dark:border-slate-800"
                      }`}
                    >
                      {done ? <CheckCircle2 className="mx-auto mb-1 h-3.5 w-3.5 text-[#16A34A]" /> : <Clock className="mx-auto mb-1 h-3.5 w-3.5" />}
                      {APPLICATION_STATUS_LABELS[stage]}
                    </div>
                  );
                })}
              </div>

              {a.interviews.length > 0 && (
                <div className="rounded-xl bg-blue-50/70 p-3 text-xs text-[#12336B] dark:bg-blue-950/30 dark:text-blue-200">
                  <strong>Entrevista programada:</strong>{" "}
                  {new Date(a.interviews[0].scheduledAt).toLocaleString("es-PE")} ({a.interviews[0].modality}) — {a.interviews[0].locationOrLink}
                </div>
              )}

              <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <p className="font-semibold">Historial de eventos:</p>
                {a.history.map((h) => (
                  <p key={h.id}>
                    • <strong>{APPLICATION_STATUS_LABELS[h.toStatus] || h.toStatus}</strong> ({new Date(h.createdAt).toLocaleDateString("es-PE")}): {h.note}
                  </p>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <Link href="/mensajes" className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline">
                  <MessageSquare className="h-3.5 w-3.5" /> Ir a mensajes
                </Link>
                {a.status !== "RETIRADO" && a.status !== "SELECCIONADO" && (
                  <button type="button" onClick={() => withdraw(a.id)} className="text-red-600 hover:underline">
                    Retirar postulación
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

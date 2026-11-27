"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Compass } from "lucide-react";
import type { CareerRolePath } from "@/lib/career-paths";

export default function PostulanteCarreraPage() {
  const [paths, setPaths] = useState<CareerRolePath[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/career")
      .then((r) => r.json())
      .then((d) => {
        setPaths(d.paths || []);
        setSelectedRole(d.selectedRole || "");
        setCompleted(d.completedSteps || []);
        setUserSkills(d.userSkills || []);
      });
  }, []);

  const current = paths.find((p) => p.role === selectedRole) || paths[0];

  async function save(role: string, steps: string[]) {
    setSelectedRole(role);
    setCompleted(steps);
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRole: role, completedSteps: steps }),
    });
    setSavedMsg("Progreso de ruta guardado.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  if (!current) return <p className="text-sm text-slate-500">Cargando rutas de carrera...</p>;

  const userNorm = new Set(userSkills.map((s) => s.toLowerCase()));
  const mastered = current.targetSkills.filter((s) => userNorm.has(s.toLowerCase()));
  const missing = current.targetSkills.filter((s) => !userNorm.has(s.toLowerCase()));
  const readiness = Math.round((mastered.length / Math.max(1, current.targetSkills.length)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
            <Compass className="h-6 w-6 text-[#2563EB]" /> Ruta de Carrera y Brechas
          </h1>
          <p className="text-xs text-slate-500">
            Elige un puesto objetivo, compara tus habilidades actuales y marca tu avance paso a paso.
          </p>
        </div>
        <select
          value={current.role}
          onChange={(e) => save(e.target.value, completed)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
        >
          {paths.map((p) => (
            <option key={p.role} value={p.role}>{p.role}</option>
          ))}
        </select>
      </div>

      {savedMsg && <p className="text-xs font-semibold text-[#16A34A]">{savedMsg}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Preparación estimada</p>
          <p className="mt-1 text-3xl font-extrabold text-[#2563EB] tabular-nums">{readiness}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold text-[#16A34A]">Habilidades dominadas ({mastered.length})</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{mastered.join(", ") || "Agrega habilidades en tu perfil"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold text-amber-700">Brechas prioritarias ({missing.length})</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{missing.join(", ") || "¡Todas cubiertas!"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {current.steps.map((step) => {
          const isDone = completed.includes(step.id);
          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-5 ${
                isDone
                  ? "border-[#16A34A] bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#2563EB]">
                    Prioridad {step.priority} · ~{step.estimatedWeeks} semanas
                  </span>
                  <h2 className="mt-2 font-bold text-[#12336B] dark:text-white">{step.title}</h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{step.description}</p>
                  <p className="mt-2 text-xs font-semibold text-[#16A34A]">Acción práctica: {step.suggestedAction}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = isDone
                      ? completed.filter((id) => id !== step.id)
                      : [...completed, step.id];
                    save(current.role, next);
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${
                    isDone ? "bg-[#16A34A] text-white" : "border border-slate-300"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" /> {isDone ? "Completado" : "Marcar avance"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

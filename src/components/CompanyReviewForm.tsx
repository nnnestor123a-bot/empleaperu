"use client";

import React, { useState } from "react";

export function CompanyReviewForm({ companyId }: { companyId: string }) {
  const [environmentRating, setEnv] = useState(4);
  const [growthRating, setGrowth] = useState(4);
  const [selectionRating, setSel] = useState(4);
  const [communicationRating, setComm] = useState(4);
  const [benefitsRating, setBen] = useState(4);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        environmentRating,
        growthRating,
        selectionRating,
        communicationRating,
        benefitsRating,
        pros,
        cons,
      }),
    });
    const data = await res.json();
    setLoading(false);
    setStatusMsg(data.message || data.error || "Enviado.");
    if (res.ok) {
      setPros("");
      setCons("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold text-[#12336B] dark:text-white">Compartir valoración moderada</h3>
      <p className="text-xs text-slate-500">
        Una valoración por usuario/empresa. Pasa por moderación antes de hacerse pública.
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {[
          ["Ambiente", environmentRating, setEnv],
          ["Crecimiento", growthRating, setGrowth],
          ["Selección", selectionRating, setSel],
          ["Comunicación", communicationRating, setComm],
          ["Beneficios", benefitsRating, setBen],
        ].map(([label, val, setter]) => (
          <label key={label as string} className="block">
            <span className="font-medium">{label as string}</span>
            <select
              value={val as number}
              onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 p-1.5 dark:border-slate-700 dark:bg-slate-800"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} ★</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <textarea
        rows={2}
        required
        value={pros}
        onChange={(e) => setPros(e.target.value)}
        placeholder="Aspectos positivos (mín. 10 caracteres)..."
        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
      />
      <textarea
        rows={2}
        required
        value={cons}
        onChange={(e) => setCons(e.target.value)}
        placeholder="Aspectos por mejorar..."
        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#12336B] disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar valoración"}
      </button>
      {statusMsg && <p className="text-xs font-medium text-[#16A34A]">{statusMsg}</p>}
    </form>
  );
}

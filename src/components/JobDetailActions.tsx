"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, CheckCircle2, Send } from "lucide-react";

export function JobDetailActions({
  jobId,
  initialApplied,
  initialFavorite,
}: {
  jobId: string;
  initialApplied: boolean;
  initialFavorite: boolean;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(initialApplied);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [coverLetter, setCoverLetter] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function apply() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, coverLetter }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setMsg(data.error || "Error al postular.");
      return;
    }
    setApplied(true);
    setMsg(`Postulación registrada (compatibilidad orientativa ${data.compatibility?.totalScore ?? 0}%).`);
  }

  async function toggleFav() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setFavorite(Boolean(data.saved));
  }

  return (
    <div className="space-y-3">
      {!applied && (
        <textarea
          rows={3}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Mensaje opcional para el reclutador..."
          className="w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {applied ? (
          <Link
            href="/postulante/postulaciones"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            <CheckCircle2 className="h-4 w-4" /> Postulación enviada · Ver seguimiento
          </Link>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={apply}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12336B] disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {loading ? "Enviando..." : "Postular a esta vacante"}
          </button>
        )}

        <button
          type="button"
          onClick={toggleFav}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
        >
          <Bookmark className="h-4 w-4" fill={favorite ? "currentColor" : "none"} />
          {favorite ? "Guardado" : "Guardar"}
        </button>
      </div>
      {msg && <p className="text-xs font-medium text-[#16A34A]">{msg}</p>}
    </div>
  );
}

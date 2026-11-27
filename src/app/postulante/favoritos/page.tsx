"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { formatSalaryRange } from "@/lib/utils";

interface FavRow {
  id: string;
  job: {
    id: string;
    slug: string;
    title: string;
    department: string;
    salaryMinPen: number | null;
    salaryMaxPen: number | null;
    salaryVisible: boolean;
    company: { tradeName: string };
  };
}

export default function PostulanteFavoritosPage() {
  const [items, setItems] = useState<FavRow[]>([]);

  async function load() {
    const res = await fetch("/api/favorites");
    if (res.ok) {
      const data = await res.json();
      setItems(data.favorites || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(jobId: string) {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    load();
  }

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
        <Bookmark className="h-6 w-6 text-[#2563EB]" /> Vacantes Guardadas
      </h1>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
          No tienes vacantes guardadas todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <Link href={`/empleos/${f.job.slug}`} className="font-bold text-[#12336B] hover:underline dark:text-white">
                  {f.job.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {f.job.company.tradeName} · {f.job.department} · {formatSalaryRange(f.job.salaryMinPen, f.job.salaryMaxPen, f.job.salaryVisible)}
                </p>
              </div>
              <button type="button" onClick={() => remove(f.job.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

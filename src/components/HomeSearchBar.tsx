"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { PERU_DEPARTMENTS } from "@/lib/peru-data";

interface Props {
  suggestions: string[];
}

export function HomeSearchBar({ suggestions }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [showSug, setShowSug] = useState(false);

  const filtered = q.trim().length >= 2
    ? suggestions.filter((s) => s.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (department) params.set("department", department);
    router.push(`/empleos?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="relative mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSug(true);
            }}
            onBlur={() => setTimeout(() => setShowSug(false), 180)}
            onFocus={() => setShowSug(true)}
            placeholder="Cargo, habilidad o empresa (ej. React, Minería, Contabilidad)"
            aria-label="Buscar por cargo, habilidad o empresa"
            className="w-full rounded-xl bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-slate-800 dark:text-white"
          />
          {showSug && filtered.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {filtered.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setQ(item);
                      setShowSug(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative md:col-span-4">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Seleccionar departamento del Perú"
            className="w-full appearance-none rounded-xl bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-slate-800 dark:text-white"
          >
            <option value="">Todo el Perú</option>
            {PERU_DEPARTMENTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2563EB] px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#12336B] transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}

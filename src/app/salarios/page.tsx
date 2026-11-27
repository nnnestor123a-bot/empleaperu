"use client";

import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Info } from "lucide-react";
import { PERU_DEPARTMENTS } from "@/lib/peru-data";
import { EXPERIENCE_LABELS, formatPen } from "@/lib/utils";

interface GroupStat {
  name: string;
  sampleSize: number;
  average: number;
  median: number;
  min: number;
  max: number;
}

interface SalaryData {
  sampleSize: number;
  averagePen: number;
  medianPen: number;
  minPen: number;
  maxPen: number;
  byCategory: GroupStat[];
  byDepartment: GroupStat[];
  byExperience: GroupStat[];
  byModality: GroupStat[];
  disclaimer: string;
}

export default function SalariosPage() {
  const [department, setDepartment] = useState("");
  const [modality, setModality] = useState("");
  const [experience, setExperience] = useState("");
  const [data, setData] = useState<SalaryData | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (department) sp.set("department", department);
    if (modality) sp.set("modality", modality);
    if (experience) sp.set("experience", experience);
    fetch(`/api/salaries?${sp.toString()}`)
      .then((r) => r.json())
      .then(setData);
  }, [department, modality, experience]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB] dark:bg-blue-950 dark:text-blue-300">
          <BarChart3 className="h-3.5 w-3.5" /> Datos calculados en tiempo real desde la BD local
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-[#12336B] dark:text-white">
          Explorador de Salarios en Perú (PEN)
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Consulta promedios, medianas, rangos y tamaño de muestra por categoría, departamento, experiencia y modalidad.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Todos los departamentos</option>
          {PERU_DEPARTMENTS.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select
          value={modality}
          onChange={(e) => setModality(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Todas las modalidades</option>
          <option value="REMOTO">Remoto</option>
          <option value="HIBRIDO">Híbrido</option>
          <option value="PRESENCIAL">Presencial</option>
        </select>

        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Todos los niveles</option>
          {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Salario promedio", value: formatPen(data.averagePen) },
              { label: "Mediana salarial", value: formatPen(data.medianPen) },
              { label: "Rango observado", value: `${formatPen(data.minPen)} – ${formatPen(data.maxPen)}` },
              { label: "Tamaño de muestra (n)", value: `${data.sampleSize} vacantes` },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                <p className="mt-1 text-xl font-extrabold text-[#12336B] tabular-nums dark:text-white">
                  {k.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-[#12336B] dark:text-white">Promedio y mediana por categoría (PEN)</h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} margin={{ left: 10, right: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="average" name="Promedio (S/)" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="median" name="Mediana (S/)" fill="#16A34A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-[#12336B] dark:text-white">Promedio por departamento (PEN)</h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byDepartment} margin={{ left: 10, right: 10, bottom: 36 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="average" name="Promedio (S/)" fill="#12336B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Detalle por nivel de experiencia</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-4">Nivel</th>
                    <th className="py-2 pr-4">Muestra (n)</th>
                    <th className="py-2 pr-4">Promedio</th>
                    <th className="py-2 pr-4">Mediana</th>
                    <th className="py-2">Rango</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.byExperience.map((row) => (
                    <tr key={row.name}>
                      <td className="py-2.5 pr-4 font-semibold">{EXPERIENCE_LABELS[row.name] || row.name}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{row.sampleSize}</td>
                      <td className="py-2.5 pr-4 font-bold text-[#2563EB] tabular-nums">{formatPen(row.average)}</td>
                      <td className="py-2.5 pr-4 font-bold text-[#16A34A] tabular-nums">{formatPen(row.median)}</td>
                      <td className="py-2.5 tabular-nums text-slate-600 dark:text-slate-400">
                        {formatPen(row.min)} – {formatPen(row.max)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{data.disclaimer}</p>
          </div>
        </>
      )}
    </div>
  );
}

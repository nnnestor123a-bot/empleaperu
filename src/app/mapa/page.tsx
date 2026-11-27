"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, MapPin, Navigation } from "lucide-react";
import { haversineKm, PERU_DEPARTMENTS } from "@/lib/peru-data";
import { formatSalaryRange, MODALITY_LABELS } from "@/lib/utils";

interface MapJob {
  id: string;
  slug: string;
  title: string;
  department: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  modality: string;
  salaryMinPen: number | null;
  salaryMaxPen: number | null;
  salaryVisible: boolean;
  company: { tradeName: string };
}

// Map Peru lat (-18.5..0) & lng (-81.5..-68.5) into SVG coordinates (0..400 x 0..520)
function projectPeru(lat: number, lng: number) {
  const x = ((lng - -81.5) / (-68.5 - -81.5)) * 340 + 30;
  const y = ((0 - lat) / (0 - -18.5)) * 460 + 25;
  return { x: Math.min(370, Math.max(30, x)), y: Math.min(490, Math.max(25, y)) };
}

export default function MapaPage() {
  const [jobs, setJobs] = useState<MapJob[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [modality, setModality] = useState("");
  const [activeJob, setActiveJob] = useState<MapJob | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams({ limit: "50" });
    if (selectedDept) sp.set("department", selectedDept);
    if (modality) sp.set("modality", modality);
    fetch(`/api/jobs?${sp.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.jobs || [];
        setJobs(list);
        if (list.length > 0) setActiveJob(list[0]);
      });
  }, [selectedDept, modality]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoMsg("Tu navegador no soporta geolocalización; usamos Lima como referencia opcional.");
      setUserCoords({ lat: -12.0464, lng: -77.0428 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoMsg("Ubicación autorizada para calcular distancias aproximadas.");
      },
      () => {
        setUserCoords({ lat: -12.0464, lng: -77.0428 });
        setGeoMsg("Ubicación no concedida. Puedes usar el selector de departamento o la referencia de Lima.");
      }
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#16A34A]">
            <Compass className="h-3.5 w-3.5" /> Mapa interactivo offline-first (sin dependencia de teselas externas)
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-[#12336B] dark:text-white">
            Mapa de Empleos en el Perú
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Ubica ofertas por departamento, distrito y modalidad con cálculo aproximado de distancia bajo consentimiento.
          </p>
        </div>

        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#12336B]"
        >
          <Navigation className="h-4 w-4" /> Calcular distancia desde mi ubicación
        </button>
      </div>

      {geoMsg && <p className="text-xs font-medium text-[#2563EB]">{geoMsg}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todos los departamentos</option>
          {PERU_DEPARTMENTS.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
        <select
          value={modality}
          onChange={(e) => setModality(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todas las modalidades</option>
          <option value="PRESENCIAL">Presencial</option>
          <option value="HIBRIDO">Híbrido</option>
          <option value="REMOTO">Remoto</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Interactive Vector Map of Peru */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50 to-slate-50 p-4 lg:col-span-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <svg
            viewBox="0 0 400 520"
            role="img"
            aria-label="Mapa geográfico interactivo de empleos en Perú"
            className="mx-auto h-[460px] w-full max-w-md"
          >
            {/* Stylized Peru silhouette */}
            <path
              d="M 55 125 L 140 50 L 255 60 L 315 115 L 285 190 L 345 290 L 360 390 L 335 485 L 270 500 L 220 465 L 165 395 L 130 320 L 95 250 L 50 185 Z"
              fill="#dbeafe"
              stroke="#2563EB"
              strokeWidth="2"
            />
            {PERU_DEPARTMENTS.map((dept) => {
              const p = projectPeru(dept.lat, dept.lng);
              const count = jobs.filter((j) => j.department === dept.name).length;
              const radius = count > 0 ? Math.min(16, 8 + Math.ceil(Math.sqrt(count) * 1.6)) : 5;
              const labelLeft = dept.name === "Lambayeque" || dept.name === "Lima" || dept.name === "Ica";
              return (
                <g
                  key={dept.name}
                  className="cursor-pointer"
                  onClick={() => setSelectedDept(selectedDept === dept.name ? "" : dept.name)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={radius}
                    fill={selectedDept === dept.name ? "#16A34A" : count > 0 ? "#2563EB" : "#94a3b8"}
                    fillOpacity="0.88"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {count > 0 && (
                    <text
                      x={p.x}
                      y={p.y + 3.5}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#ffffff"
                    >
                      {count}
                    </text>
                  )}
                  <text
                    x={labelLeft ? p.x - radius - 5 : p.x + radius + 5}
                    y={p.y + 3}
                    textAnchor={labelLeft ? "end" : "start"}
                    fontSize="10"
                    fontWeight="600"
                    fill="#12336B"
                  >
                    {dept.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-center text-xs text-slate-500">
            Haz clic en cualquier departamento para filtrar vacantes en el panel derecho.
          </p>
        </div>

        {/* List & Active Detail */}
        <div className="space-y-4 lg:col-span-6">
          {activeJob && (
            <div className="rounded-2xl border border-[#2563EB] bg-white p-5 shadow-sm dark:bg-slate-900">
              <p className="text-xs font-semibold text-[#2563EB]">{activeJob.company.tradeName}</p>
              <h2 className="mt-1 text-lg font-bold text-[#12336B] dark:text-white">{activeJob.title}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {activeJob.department}
                  {activeJob.district ? `, ${activeJob.district}` : ""}
                </span>
                <span>{MODALITY_LABELS[activeJob.modality]}</span>
                <span className="font-bold text-[#16A34A]">
                  {formatSalaryRange(activeJob.salaryMinPen, activeJob.salaryMaxPen, activeJob.salaryVisible)}
                </span>
                {userCoords && activeJob.latitude && activeJob.longitude && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-[#2563EB]">
                    ~{haversineKm(userCoords.lat, userCoords.lng, activeJob.latitude, activeJob.longitude)} km aprox.
                  </span>
                )}
              </div>
              <Link
                href={`/empleos/${activeJob.slug}`}
                className="mt-3 inline-block rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white"
              >
                Ver vacante y postular →
              </Link>
            </div>
          )}

          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {jobs.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => setActiveJob(j)}
                className={`w-full rounded-xl border p-3.5 text-left transition ${
                  activeJob?.id === j.id
                    ? "border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{j.title}</p>
                  <span className="text-xs font-semibold text-[#16A34A]">
                    {MODALITY_LABELS[j.modality]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {j.company.tradeName} · {j.department}
                  {j.district ? `, ${j.district}` : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

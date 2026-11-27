"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { PERU_DEPARTMENTS } from "@/lib/peru-data";
import {
  CONTRACT_LABELS,
  EXPERIENCE_LABELS,
  formatSalaryRange,
  MODALITY_LABELS,
  relativeDateEs,
} from "@/lib/utils";
import type { CompatibilityResult } from "@/lib/compatibility";

interface JobItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  department: string;
  district: string;
  salaryMinPen: number | null;
  salaryMaxPen: number | null;
  salaryVisible: boolean;
  modality: string;
  contractType: string;
  scheduleType: string;
  experienceLevel: string;
  educationLevel: string;
  vacanciesCount: number;
  isInternship: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  fraudRiskScore: number;
  fraudFlags: Array<{ code: string; severity: string; message: string; advice: string }>;
  skillNames: string[];
  isFavorite: boolean;
  hasApplied: boolean;
  compatibility: CompatibilityResult | null;
  company: {
    id: string;
    tradeName: string;
    sector: string;
    verificationStatus: string;
    department: string;
  };
  category: { id: string; name: string; slug: string };
  _count: { applications: number };
}

interface Props {
  categories: Array<{ id: string; name: string; slug: string }>;
  initialInternshipOnly?: boolean;
}

export function JobBoardClient({ categories, initialInternshipOnly = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [modality, setModality] = useState(searchParams.get("modality") || "");
  const [experience, setExperience] = useState(searchParams.get("experience") || "");
  const [contract, setContract] = useState(searchParams.get("contract") || "");
  const [salaryMin, setSalaryMin] = useState(searchParams.get("salaryMin") || "");
  const [days, setDays] = useState(searchParams.get("days") || "");
  const [internship, setInternship] = useState(
    initialInternshipOnly || searchParams.get("internship") === "true"
  );
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selected, setSelected] = useState<JobItem | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Apply & Report modals
  const [coverLetter, setCoverLetter] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Información engañosa o solicitud de pago");
  const [reportDetails, setReportDetails] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (department) params.set("department", department);
    if (category) params.set("category", category);
    if (modality) params.set("modality", modality);
    if (experience) params.set("experience", experience);
    if (contract) params.set("contract", contract);
    if (salaryMin) params.set("salaryMin", salaryMin);
    if (days) params.set("days", days);
    if (internship) params.set("internship", "true");
    params.set("page", String(page));
    params.set("limit", "12");

    try {
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setSelected((prev) => {
        if (!data.jobs?.length) return null;
        if (prev && data.jobs.some((j: JobItem) => j.id === prev.id)) {
          return data.jobs.find((j: JobItem) => j.id === prev.id);
        }
        return data.jobs[0];
      });
    } finally {
      setLoading(false);
    }
  }, [q, department, category, modality, experience, contract, salaryMin, days, internship, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function toggleFavorite(jobId: string) {
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
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, isFavorite: data.saved } : j)));
    if (selected?.id === jobId) {
      setSelected({ ...selected, isFavorite: data.saved });
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setFeedbackMsg(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: selected.id, coverLetter }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setFeedbackMsg({ type: "err", text: data.error || "No se pudo enviar la postulación." });
      return;
    }
    setApplyOpen(false);
    setCoverLetter("");
    setFeedbackMsg({
      type: "ok",
      text: `¡Postulación enviada! Compatibilidad orientativa: ${data.compatibility?.totalScore ?? 0}%.`,
    });
    setJobs((prev) => prev.map((j) => (j.id === selected.id ? { ...j, hasApplied: true } : j)));
    setSelected({ ...selected, hasApplied: true });
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "JOB",
        targetId: selected.id,
        reason: reportReason,
        details: reportDetails,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    setReportOpen(false);
    setReportDetails("");
    setFeedbackMsg({
      type: res.ok ? "ok" : "err",
      text: data.message || data.error || "Denuncia enviada.",
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Cargo, empresa o palabra clave..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            aria-label="Departamento"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Departamento</option>
            {PERU_DEPARTMENTS.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Categoría"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            value={modality}
            onChange={(e) => {
              setModality(e.target.value);
              setPage(1);
            }}
            aria-label="Modalidad"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Modalidad</option>
            <option value="REMOTO">Remoto</option>
            <option value="HIBRIDO">Híbrido</option>
            <option value="PRESENCIAL">Presencial</option>
          </select>

          <select
            value={experience}
            onChange={(e) => {
              setExperience(e.target.value);
              setPage(1);
            }}
            aria-label="Nivel de experiencia"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Experiencia</option>
            {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Más filtros:
          </span>
          <select
            value={salaryMin}
            onChange={(e) => {
              setSalaryMin(e.target.value);
              setPage(1);
            }}
            aria-label="Salario mínimo PEN"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Salario PEN (cualquiera)</option>
            <option value="1500">Desde S/ 1,500</option>
            <option value="3000">Desde S/ 3,000</option>
            <option value="5000">Desde S/ 5,000</option>
            <option value="7000">Desde S/ 7,000</option>
          </select>

          <select
            value={contract}
            onChange={(e) => {
              setContract(e.target.value);
              setPage(1);
            }}
            aria-label="Tipo de contrato"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Contrato</option>
            {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              setPage(1);
            }}
            aria-label="Fecha de publicación"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Cualquier fecha</option>
            <option value="3">Últimos 3 días</option>
            <option value="7">Últimos 7 días</option>
            <option value="15">Últimos 15 días</option>
          </select>

          <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={internship}
              onChange={(e) => {
                setInternship(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-[#2563EB]"
            />
            Solo prácticas / egresados
          </label>

          <button
            type="button"
            onClick={() => {
              setQ("");
              setDepartment("");
              setCategory("");
              setModality("");
              setExperience("");
              setContract("");
              setSalaryMin("");
              setDays("");
              setInternship(initialInternshipOnly);
              setPage(1);
            }}
            className="ml-auto font-semibold text-[#2563EB] hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            feedbackMsg.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Results Header */}
      <div className="mt-5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <p>
          Mostrando <strong className="text-slate-900 dark:text-white">{total}</strong> vacantes activas
        </p>
        <p>Página {page} de {totalPages}</p>
      </div>

      {/* Split View: List (Left) + Sticky Detail (Right) */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left List */}
        <div className="space-y-3 lg:col-span-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 font-semibold text-slate-800 dark:text-white">
                No encontramos vacantes con esos filtros
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba ampliando el departamento, modalidad o rango salarial.
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const isSelected = selected?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelected(job)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(job);
                  }}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-[#2563EB] bg-blue-50/40 ring-2 ring-[#2563EB]/20 dark:bg-blue-950/30"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>{job.company.tradeName}</span>
                        {job.company.verificationStatus === "VERIFIED" && (
                          <BadgeCheck className="h-3.5 w-3.5 text-[#2563EB]" />
                        )}
                        {job.isFeatured && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            Destacado
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{job.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(job.id);
                      }}
                      aria-label={job.isFavorite ? "Quitar de favoritos" : "Guardar vacante"}
                      className={`rounded-lg p-1.5 ${
                        job.isFavorite
                          ? "bg-blue-100 text-[#2563EB]"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <Bookmark className="h-4 w-4" fill={job.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.department}
                    </span>
                    <span>{MODALITY_LABELS[job.modality]}</span>
                    <span className="font-bold text-[#16A34A] tabular-nums">
                      {formatSalaryRange(job.salaryMinPen, job.salaryMaxPen, job.salaryVisible)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {job.skillNames.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {job.compatibility && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-[#16A34A]">
                          <Sparkles className="h-3 w-3" /> {job.compatibility.totalScore}% match
                        </span>
                      )}
                      {job.hasApplied && (
                        <span className="font-semibold text-[#2563EB]">Postulado</span>
                      )}
                      <span className="text-slate-400">
                        {job.publishedAt ? relativeDateEs(job.publishedAt) : "Reciente"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
              >
                ← Anterior
              </button>
              <span className="text-xs text-slate-500">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* Right Sticky Detail Panel */}
        <div className="lg:col-span-7">
          {selected ? (
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
                    <Link href={`/empresas/${selected.company.id}`} className="hover:underline">
                      {selected.company.tradeName}
                    </Link>
                    {selected.company.verificationStatus === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#2563EB] dark:bg-blue-950">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#12336B] dark:text-white">
                    {selected.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {selected.department}
                      {selected.district ? `, ${selected.district}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {MODALITY_LABELS[selected.modality]} · {CONTRACT_LABELS[selected.contractType]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {EXPERIENCE_LABELS[selected.experienceLevel]}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-extrabold text-[#16A34A] tabular-nums">
                    {formatSalaryRange(selected.salaryMinPen, selected.salaryMaxPen, selected.salaryVisible)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selected.vacanciesCount} vacante(s) · {selected._count.applications} postulaciones
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {selected.hasApplied ? (
                  <Link
                    href="/postulante/postulaciones"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Ya postulaste · Ver estado
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setApplyOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#12336B]"
                  >
                    <Send className="h-4 w-4" /> Postular ahora
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleFavorite(selected.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  <Bookmark className="h-4 w-4" fill={selected.isFavorite ? "currentColor" : "none"} />
                  {selected.isFavorite ? "Guardado" : "Guardar"}
                </button>

                <Link
                  href={`/empleos/${selected.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir página
                </Link>

                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
                >
                  <Flag className="h-3.5 w-3.5" /> Reportar aviso
                </button>
              </div>

              {/* Explainable Compatibility Box (when logged in as candidate) */}
              {selected.compatibility && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      <Sparkles className="h-4 w-4 text-[#16A34A]" /> Compatibilidad explicable con tu perfil
                    </span>
                    <span className="text-lg font-extrabold text-[#16A34A] tabular-nums">
                      {selected.compatibility.totalScore}%
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                    <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/70">
                      <p className="text-slate-500">Habilidades</p>
                      <p className="font-bold">{selected.compatibility.breakdown.skills.score}/40</p>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/70">
                      <p className="text-slate-500">Experiencia</p>
                      <p className="font-bold">{selected.compatibility.breakdown.experience.score}/25</p>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/70">
                      <p className="text-slate-500">Formación</p>
                      <p className="font-bold">{selected.compatibility.breakdown.education.score}/15</p>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/70">
                      <p className="text-slate-500">Ubicación</p>
                      <p className="font-bold">{selected.compatibility.breakdown.locationModality.score}/10</p>
                    </div>
                    <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/70">
                      <p className="text-slate-500">Salario</p>
                      <p className="font-bold">{selected.compatibility.breakdown.salary.score}/10</p>
                    </div>
                  </div>
                  {selected.compatibility.breakdown.skills.missing.length > 0 && (
                    <p className="mt-2 text-xs text-emerald-900 dark:text-emerald-200">
                      <strong>Brechas sugeridas:</strong>{" "}
                      {selected.compatibility.breakdown.skills.missing.join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {selected.compatibility.disclaimer}
                  </p>
                </div>
              )}

              {/* Antifraud Alert (if any) */}
              {selected.fraudFlags && selected.fraudFlags.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4" /> Aviso preventivo de transparencia (riesgo {selected.fraudRiskScore}/100)
                  </p>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5">
                    {selected.fraudFlags.map((f) => (
                      <li key={f.code}>{f.message} — {f.advice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Job Body */}
              <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <h3 className="font-bold text-[#12336B] dark:text-white">Descripción del puesto</h3>
                  <p className="mt-1 whitespace-pre-line leading-relaxed">{selected.description}</p>
                </div>
                <div>
                  <h3 className="font-bold text-[#12336B] dark:text-white">Responsabilidades</h3>
                  <p className="mt-1 whitespace-pre-line leading-relaxed">{selected.responsibilities}</p>
                </div>
                <div>
                  <h3 className="font-bold text-[#12336B] dark:text-white">Requisitos</h3>
                  <p className="mt-1 whitespace-pre-line leading-relaxed">{selected.requirements}</p>
                </div>
                {selected.benefits && (
                  <div>
                    <h3 className="font-bold text-[#12336B] dark:text-white">Beneficios</h3>
                    <p className="mt-1 whitespace-pre-line leading-relaxed">{selected.benefits}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-[#12336B] dark:text-white">Habilidades clave</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.skillNames.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#12336B] dark:bg-blue-950 dark:text-blue-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              Selecciona una vacante de la lista para ver el detalle completo.
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleApply}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-[#12336B] dark:text-white">
              Postular a: {selected.title}
            </h3>
            <p className="text-xs text-slate-500">
              {selected.company.tradeName} · Se adjuntará tu perfil y tu CV principal privado.
            </p>
            <label className="mt-4 block text-sm font-medium">
              Mensaje de presentación (opcional)
            </label>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Destaca tu experiencia relevante o disponibilidad para este rol..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-bold text-white hover:bg-[#12336B] disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Confirmar postulación"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleReport}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Reportar vacante sospechosa</h3>
            <p className="mt-1 text-xs text-slate-500">
              Todas las denuncias pasan por revisión humana administrativa.
            </p>
            <label className="mt-4 block text-xs font-semibold">Motivo</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option>Información engañosa o solicitud de pago</option>
              <option>Enlace externo sospechoso</option>
              <option>Vacante duplicada o inactiva</option>
              <option>Requisitos discriminatorios</option>
            </select>
            <label className="mt-3 block text-xs font-semibold">Detalles adicionales</label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Describe brevemente el problema detectado..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-xl border px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Enviar denuncia
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

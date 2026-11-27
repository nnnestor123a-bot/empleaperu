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
import { AlertTriangle, BadgeCheck, ShieldCheck, Users } from "lucide-react";

interface AdminPayload {
  kpis: {
    totalUsers: number;
    totalCompanies: number;
    verifiedCompanies: number;
    totalJobs: number;
    publishedJobs: number;
    totalApplications: number;
    hiredCount: number;
    hiringRate: number;
    openReports: number;
    flaggedJobs: number;
  };
  charts: {
    jobsByCategory: Array<{ name: string; value: number }>;
    jobsByDepartment: Array<{ name: string; value: number }>;
    applicationsByStatus: Array<{ name: string; value: number }>;
    applicationsByMonth: Array<{ month: string; count: number }>;
  };
  users: Array<{ id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }>;
  companies: Array<{ id: string; tradeName: string; ruc: string; sector: string; verificationStatus: string; _count: { jobs: number } }>;
  jobs: Array<{ id: string; title: string; status: string; fraudRiskScore: number; company: { tradeName: string }; _count: { applications: number } }>;
  reports: Array<{ id: string; targetType: string; targetId: string; reason: string; details: string; status: string; reporter: { name: string } }>;
  reviews: Array<{ id: string; pros: string; cons: string; status: string; company: { tradeName: string }; author: { name: string } }>;
  categories: Array<{ id: string; name: string; slug: string; _count: { jobs: number } }>;
  auditLogs: Array<{ id: string; action: string; entityType: string; entityId: string | null; createdAt: string; actor: { name: string; role: string } | null }>;
  contactMessages: Array<{ id: string; name: string; email: string; subject: string; message: string; createdAt: string }>;
}

type TabKey = "analytics" | "companies" | "users" | "jobs" | "reports" | "audit";

export default function AdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [tab, setTab] = useState<TabKey>("analytics");
  const [newCat, setNewCat] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function adminAction(payload: Record<string, unknown>, okText: string) {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMsg(okText);
      load();
    }
  }

  if (!data) return <div className="p-10 text-center text-sm text-slate-500">Cargando panel administrativo...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
            <ShieldCheck className="h-6 w-6 text-[#2563EB]" /> Panel de Administración, Analítica y Antifraude
          </h1>
          <p className="text-xs text-slate-500">
            Indicadores calculados directamente desde la BD local · Moderación humana y trazabilidad completa.
          </p>
        </div>
        <a
          href="/api/ats/export"
          className="rounded-xl bg-[#12336B] px-4 py-2 text-xs font-bold text-white hover:bg-[#2563EB]"
        >
          Exportar postulaciones CSV
        </a>
      </div>

      {msg && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">{msg}</p>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Usuarios", value: data.kpis.totalUsers },
          { label: "Empresas verificadas", value: `${data.kpis.verifiedCompanies}/${data.kpis.totalCompanies}` },
          { label: "Vacantes publicadas", value: `${data.kpis.publishedJobs}/${data.kpis.totalJobs}` },
          { label: "Tasa contratación", value: `${data.kpis.hiringRate}% (${data.kpis.hiredCount})` },
          { label: "Denuncias abiertas", value: data.kpis.openReports },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] text-slate-500">{k.label}</p>
            <p className="mt-1 text-xl font-extrabold text-[#12336B] tabular-nums dark:text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {(
          [
            ["analytics", "Analítica BD"],
            ["companies", `Empresas (${data.companies.length})`],
            ["users", `Usuarios (${data.users.length})`],
            ["jobs", `Vacantes y Antifraude (${data.kpis.flaggedJobs})`],
            ["reports", `Denuncias y Reseñas (${data.reports.length + data.reviews.length})`],
            ["audit", `Auditoría y Contacto (${data.auditLogs.length})`],
          ] as Array<[TabKey, string]>
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              tab === k
                ? "bg-[#2563EB] text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-[#2563EB] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "analytics" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Vacantes por categoría</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.jobsByCategory} margin={{ bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Vacantes" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Distribución geográfica de vacantes</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.jobsByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Vacantes" fill="#16A34A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Postulaciones por etapa ATS</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.applicationsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Postulaciones" fill="#12336B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Categorías laborales ({data.categories.length})</h2>
            <div className="flex flex-wrap gap-2">
              {data.categories.map((c) => (
                <span key={c.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">
                  {c.name} ({c._count.jobs})
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nueva categoría..." className="flex-1 rounded-xl border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
              <button
                type="button"
                onClick={() => {
                  if (!newCat.trim()) return;
                  adminAction({ action: "createCategory", name: newCat }, "Categoría creada.");
                  setNewCat("");
                }}
                className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "companies" && (
        <div className="space-y-3">
          {data.companies.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="font-bold">{c.tradeName} <span className="text-xs font-normal text-slate-500">· RUC {c.ruc}</span></p>
                <p className="text-xs text-slate-500">{c.sector} · {c._count.jobs} vacantes · Estado: <strong>{c.verificationStatus}</strong></p>
              </div>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => adminAction({ action: "verifyCompany", companyId: c.id, status: "VERIFIED" }, "Empresa verificada.")} className="inline-flex items-center gap-1 rounded-lg bg-[#16A34A] px-3 py-1.5 font-bold text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verificar
                </button>
                <button type="button" onClick={() => adminAction({ action: "verifyCompany", companyId: c.id, status: "REJECTED" }, "Verificación rechazada.")} className="rounded-lg border px-3 py-1.5 text-red-600">
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {data.users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#2563EB]" />
                <span><strong>{u.name}</strong> ({u.email}) — <span className="font-bold">{u.role}</span></span>
              </div>
              <button
                type="button"
                onClick={() => adminAction({ action: "toggleUser", userId: u.id }, "Estado de usuario actualizado.")}
                className={`rounded-lg px-3 py-1 font-bold ${u.isActive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                {u.isActive ? "Suspender" : "Reactivar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "jobs" && (
        <div className="space-y-2">
          {data.jobs.map((j) => (
            <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="font-bold">{j.title} <span className="font-normal text-slate-500">({j.company.tradeName})</span></p>
                <p className="text-slate-500">Estado: {j.status} · Postulaciones: {j._count.applications}</p>
              </div>
              <div className="flex items-center gap-2">
                {j.fraudRiskScore >= 25 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                    <AlertTriangle className="h-3 w-3" /> Riesgo {j.fraudRiskScore}
                  </span>
                )}
                <button type="button" onClick={() => adminAction({ action: "moderateJob", jobId: j.id, status: j.status === "PUBLISHED" ? "PAUSED" : "PUBLISHED" }, "Vacante moderada.")} className="rounded-lg border px-3 py-1 font-semibold">
                  {j.status === "PUBLISHED" ? "Pausar" : "Publicar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="font-bold text-[#12336B] dark:text-white">Denuncias ({data.reports.length})</h2>
            {data.reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-bold">{r.targetType} · {r.reason} ({r.status})</p>
                <p className="text-slate-500">Reportado por {r.reporter.name}: {r.details}</p>
                {r.status === "OPEN" && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => adminAction({ action: "resolveReport", reportId: r.id, status: "ACTION_TAKEN" }, "Denuncia atendida.")} className="rounded-lg bg-[#2563EB] px-3 py-1 font-bold text-white">Marcar atendida</button>
                    <button type="button" onClick={() => adminAction({ action: "resolveReport", reportId: r.id, status: "DISMISSED" }, "Denuncia descartada.")} className="rounded-lg border px-3 py-1">Descartar</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-[#12336B] dark:text-white">Moderación de reseñas ({data.reviews.length})</h2>
            {data.reviews.map((rev) => (
              <div key={rev.id} className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-bold">{rev.company.tradeName} · por {rev.author.name} ({rev.status})</p>
                <p>Pros: {rev.pros}</p>
                <p>Cons: {rev.cons}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => adminAction({ action: "moderateReview", reviewId: rev.id, status: "APPROVED" }, "Reseña aprobada.")} className="rounded-lg bg-[#16A34A] px-3 py-1 font-bold text-white">Aprobar</button>
                  <button type="button" onClick={() => adminAction({ action: "moderateReview", reviewId: rev.id, status: "REJECTED" }, "Reseña rechazada.")} className="rounded-lg border px-3 py-1 text-red-600">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Registro de auditoría (sin secretos)</h2>
            <div className="max-h-96 space-y-1.5 overflow-y-auto text-xs">
              {data.auditLogs.map((l) => (
                <div key={l.id} className="border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <span className="font-bold text-[#2563EB]">{l.action}</span> · {l.entityType} · {l.actor?.name || "Sistema"} ·{" "}
                  <span className="text-slate-400">{new Date(l.createdAt).toLocaleString("es-PE")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Mensajes de contacto ({data.contactMessages.length})</h2>
            <div className="max-h-96 space-y-2 overflow-y-auto text-xs">
              {data.contactMessages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 dark:border-slate-800">
                  Aún no hay mensajes enviados desde el formulario público de Contacto.
                </p>
              ) : (
                data.contactMessages.map((c) => (
                  <div key={c.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="font-bold">{c.subject} — {c.name} ({c.email})</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{c.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

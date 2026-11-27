"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { PERU_DEPARTMENTS } from "@/lib/peru-data";
import { formatSalaryRange } from "@/lib/utils";

interface JobRow {
  id: string;
  slug: string;
  title: string;
  department: string;
  modality: string;
  status: string;
  salaryMinPen: number | null;
  salaryMaxPen: number | null;
  salaryVisible: boolean;
  fraudRiskScore: number;
  _count: { applications: number };
}

export default function EmpresaVacantesPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [department, setDepartment] = useState("Lima");
  const [district, setDistrict] = useState("Miraflores");
  const [modality, setModality] = useState("HIBRIDO");
  const [contractType, setContractType] = useState("PLANILLA");
  const [experienceLevel, setExperienceLevel] = useState("SEMI_SENIOR");
  const [educationLevel, setEducationLevel] = useState("UNIVERSITARIO");
  const [salaryMinPen, setSalaryMinPen] = useState("4500");
  const [salaryMaxPen, setSalaryMaxPen] = useState("6500");
  const [skillsText, setSkillsText] = useState("TypeScript, React, SQL");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("Ingreso a planilla con beneficios de ley y capacitaciones.");
  const [isInternship, setIsInternship] = useState(false);

  async function load() {
    const [jRes, mRes] = await Promise.all([fetch("/api/empresa/jobs"), fetch("/api/meta")]);
    if (jRes.ok) {
      const d = await jRes.json();
      setJobs(d.jobs || []);
    }
    if (mRes.ok) {
      const m = await mRes.json();
      setCategories(m.categories || []);
      if (!categoryId && m.categories?.[0]?.id) setCategoryId(m.categories[0].id);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        categoryId,
        department,
        district,
        modality,
        contractType,
        scheduleType: isInternship ? "MEDIO_TIEMPO" : "TIEMPO_COMPLETO",
        experienceLevel,
        educationLevel,
        salaryMinPen: salaryMinPen ? Number(salaryMinPen) : null,
        salaryMaxPen: salaryMaxPen ? Number(salaryMaxPen) : null,
        salaryVisible: true,
        description,
        responsibilities,
        requirements,
        benefits,
        isInternship,
        status: "PUBLISHED",
        skillNames: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Error al publicar vacante.");
      return;
    }
    setShowForm(false);
    setTitle("");
    setDescription("");
    setResponsibilities("");
    setRequirements("");
    setMsg(`Vacante publicada correctamente (Riesgo antifraude evaluado: ${data.antifraud?.riskScore ?? 0}/100).`);
    load();
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMsg(`Estado de vacante actualizado a ${status}.`);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">Gestión de Vacantes</h1>
          <p className="text-xs text-slate-500">Crea, publica, pausa, cierra o archiva ofertas con pre-chequeo antifraude automático.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#12336B]"
        >
          <Plus className="h-4 w-4" /> {showForm ? "Cerrar formulario" : "Nueva vacante"}
        </button>
      </div>

      {msg && <p className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#2563EB]">{msg}</p>}

      {showForm && (
        <form onSubmit={createJob} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-[#12336B] dark:text-white">Publicar nueva vacante</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del puesto (ej. Desarrollador Backend Senior)" className="rounded-xl border p-2.5 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800" />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              {PERU_DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Distrito" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <select value={modality} onChange={(e) => setModality(e.target.value)} className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="HIBRIDO">Híbrido</option>
              <option value="REMOTO">Remoto</option>
              <option value="PRESENCIAL">Presencial</option>
            </select>
            <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="PLANILLA">Planilla</option>
              <option value="PRACTICAS">Prácticas</option>
              <option value="LOCACION">Locación</option>
              <option value="TEMPORAL">Temporal</option>
            </select>
            <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="PRACTICANTE">Practicante</option>
              <option value="JUNIOR">Junior</option>
              <option value="SEMI_SENIOR">Semi-Senior</option>
              <option value="SENIOR">Senior</option>
              <option value="LIDER">Líder</option>
            </select>
            <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="SECUNDARIA">Secundaria</option>
              <option value="TECNICO">Técnico</option>
              <option value="UNIVERSITARIO">Universitario</option>
              <option value="POSGRADO">Posgrado</option>
            </select>
            <input type="number" value={salaryMinPen} onChange={(e) => setSalaryMinPen(e.target.value)} placeholder="Salario mínimo PEN" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <input type="number" value={salaryMaxPen} onChange={(e) => setSalaryMaxPen(e.target.value)} placeholder="Salario máximo PEN" className="rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="Habilidades separadas por coma" className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción detallada del puesto (mín. 30 caracteres)..." className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <textarea required rows={2} value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder="Responsabilidades principales..." className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <textarea required rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Requisitos del puesto..." className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <textarea rows={2} value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="Beneficios ofrecidos..." className="w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={isInternship} onChange={(e) => setIsInternship(e.target.checked)} />
            Incluir en el Hub de Prácticas y Egresados
          </label>
          <div>
            <button type="submit" className="rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-bold text-white">
              Publicar vacante ahora
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/empleos/${j.slug}`} className="font-bold text-[#12336B] hover:underline dark:text-white">
                  {j.title}
                </Link>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  j.status === "PUBLISHED" ? "bg-emerald-50 text-[#16A34A]" : "bg-slate-100 text-slate-600"
                }`}>
                  {j.status}
                </span>
                {j.fraudRiskScore >= 25 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    <AlertTriangle className="h-3 w-3" /> Riesgo {j.fraudRiskScore}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {j.department} · {j.modality} · {formatSalaryRange(j.salaryMinPen, j.salaryMaxPen, j.salaryVisible)} · <strong>{j._count.applications} postulaciones</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {j.status !== "PUBLISHED" && (
                <button type="button" onClick={() => changeStatus(j.id, "PUBLISHED")} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white">Publicar</button>
              )}
              {j.status === "PUBLISHED" && (
                <button type="button" onClick={() => changeStatus(j.id, "PAUSED")} className="rounded-lg border px-3 py-1.5 font-semibold">Pausar</button>
              )}
              <button type="button" onClick={() => changeStatus(j.id, "CLOSED")} className="rounded-lg border px-3 py-1.5 font-semibold">Cerrar</button>
              <button type="button" onClick={() => changeStatus(j.id, "ARCHIVED")} className="rounded-lg border px-3 py-1.5 text-slate-500">Archivar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

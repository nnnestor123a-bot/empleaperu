"use client";

import React, { useEffect, useState } from "react";
import { Download, Plus, Save, Trash2 } from "lucide-react";
import { PERU_DEPARTMENTS } from "@/lib/peru-data";

interface ProfileData {
  id: string;
  headline: string;
  bio: string;
  department: string;
  province: string;
  district: string;
  availability: string;
  expectedSalaryPen: number | null;
  preferredModality: string;
  portfolioSlug: string | null;
  portfolioPublic: boolean;
  completionPct: number;
  showPhone: boolean;
  showEmail: boolean;
  user: { name: string; email: string; phone: string | null };
  experiences: Array<{ id: string; company: string; title: string; startDate: string; endDate: string | null; isCurrent: boolean; description: string }>;
  educations: Array<{ id: string; institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear: number | null; inProgress: boolean }>;
  certifications: Array<{ id: string; name: string; issuer: string; issueYear: number }>;
  skills: Array<{ id: string; skillId: string; level: string; skill: { name: string; category: string } }>;
}

export default function PostulantePerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Basic form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("Lima");
  const [district, setDistrict] = useState("Miraflores");
  const [availability, setAvailability] = useState("INMEDIATA");
  const [expectedSalaryPen, setExpectedSalaryPen] = useState("");
  const [preferredModality, setPreferredModality] = useState("HIBRIDO");
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  // Quick-add states
  const [newSkill, setNewSkill] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expStart, setExpStart] = useState("2024-01");
  const [eduInst, setEduInst] = useState("");
  const [eduDegree, setEduDegree] = useState("Bachiller Universitario");
  const [eduField, setEduField] = useState("");
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");

  async function load() {
    const res = await fetch("/api/profile");
    if (!res.ok) return;
    const data = await res.json();
    const p: ProfileData = data.profile;
    setProfile(p);
    setName(p.user.name);
    setPhone(p.user.phone || "");
    setHeadline(p.headline);
    setBio(p.bio);
    setDepartment(p.department);
    setDistrict(p.district);
    setAvailability(p.availability);
    setExpectedSalaryPen(p.expectedSalaryPen ? String(p.expectedSalaryPen) : "");
    setPreferredModality(p.preferredModality);
    setShowEmail(p.showEmail);
    setShowPhone(p.showPhone);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveBasic(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        headline,
        bio,
        department,
        province: department,
        district,
        availability,
        expectedSalaryPen: expectedSalaryPen ? Number(expectedSalaryPen) : null,
        preferredModality,
        showEmail,
        showPhone,
      }),
    });
    if (res.ok) {
      setMsg("Perfil actualizado correctamente.");
      load();
    }
  }

  async function patchAction(payload: Record<string, unknown>, successText: string) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMsg(successText);
      load();
    }
  }

  if (!profile) return <p className="text-sm text-slate-500">Cargando perfil...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
            Mi Perfil Profesional ({profile.completionPct}%)
          </h1>
          <p className="text-xs text-slate-500">
            Estos datos alimentan el motor explicable de compatibilidad y tu Generador de CV ATS.
          </p>
        </div>
        <a
          href="/api/profile?export=true"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#12336B] hover:border-[#2563EB] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <Download className="h-4 w-4" /> Exportar mis datos (Ley 29733)
        </a>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {msg}
        </div>
      )}

      {/* Basic Info */}
      <form onSubmit={saveBasic} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-[#12336B] dark:text-white">Información personal y preferencias</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold">Nombre completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div>
            <label className="text-xs font-semibold">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">Titular / Profesión</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">Resumen profesional</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div>
            <label className="text-xs font-semibold">Departamento</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              {PERU_DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Distrito</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div>
            <label className="text-xs font-semibold">Expectativa salarial (S/ PEN)</label>
            <input type="number" value={expectedSalaryPen} onChange={(e) => setExpectedSalaryPen(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div>
            <label className="text-xs font-semibold">Modalidad preferida</label>
            <select value={preferredModality} onChange={(e) => setPreferredModality(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
              <option value="REMOTO">Remoto</option>
              <option value="HIBRIDO">Híbrido</option>
              <option value="PRESENCIAL">Presencial</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
            Mostrar correo en portafolio público
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
            Mostrar teléfono en portafolio público
          </label>
        </div>

        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12336B]">
          <Save className="h-4 w-4" /> Guardar cambios
        </button>
      </form>

      {/* Skills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-[#12336B] dark:text-white">Habilidades ({profile.skills.length})</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#12336B] dark:bg-blue-950 dark:text-blue-200">
              {s.skill.name}
              <button type="button" onClick={() => patchAction({ action: "removeSkill", skillId: s.skillId }, "Habilidad eliminada.")} className="text-red-500 hover:text-red-700">×</button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Agregar habilidad (ej. TypeScript, Power BI, Inglés)..."
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              if (!newSkill.trim()) return;
              patchAction({ action: "addSkill", skillName: newSkill }, "Habilidad agregada.");
              setNewSkill("");
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
      </div>

      {/* Experience & Education */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-[#12336B] dark:text-white">Experiencia laboral</h2>
          {profile.experiences.map((e) => (
            <div key={e.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3 text-xs dark:border-slate-800">
              <div>
                <p className="font-bold">{e.title}</p>
                <p className="text-slate-500">{e.company} · {e.startDate} – {e.isCurrent ? "Actualidad" : e.endDate}</p>
              </div>
              <button type="button" onClick={() => patchAction({ action: "deleteExperience", id: e.id }, "Experiencia eliminada.")} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="space-y-2 border-t pt-3">
            <input value={expTitle} onChange={(e) => setExpTitle(e.target.value)} placeholder="Cargo" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <input value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="Empresa" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <input value={expStart} onChange={(e) => setExpStart(e.target.value)} placeholder="Inicio YYYY-MM" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <button
              type="button"
              onClick={() => {
                if (!expTitle || !expCompany) return;
                patchAction({ action: "addExperience", title: expTitle, company: expCompany, startDate: expStart, isCurrent: true }, "Experiencia agregada.");
                setExpTitle("");
                setExpCompany("");
              }}
              className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white"
            >
              + Agregar experiencia
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-[#12336B] dark:text-white">Formación y certificaciones</h2>
          {profile.educations.map((ed) => (
            <div key={ed.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3 text-xs dark:border-slate-800">
              <div>
                <p className="font-bold">{ed.degree} — {ed.fieldOfStudy}</p>
                <p className="text-slate-500">{ed.institution}</p>
              </div>
              <button type="button" onClick={() => patchAction({ action: "deleteEducation", id: ed.id }, "Formación eliminada.")} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="space-y-2 border-t pt-3">
            <input value={eduInst} onChange={(e) => setEduInst(e.target.value)} placeholder="Universidad o Instituto" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <input value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} placeholder="Grado" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <input value={eduField} onChange={(e) => setEduField(e.target.value)} placeholder="Carrera" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <button
              type="button"
              onClick={() => {
                if (!eduInst || !eduField) return;
                patchAction({ action: "addEducation", institution: eduInst, degree: eduDegree, fieldOfStudy: eduField, startYear: 2020, endYear: 2024 }, "Formación agregada.");
                setEduInst("");
                setEduField("");
              }}
              className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white"
            >
              + Agregar formación
            </button>
          </div>
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-bold">Certificaciones ({profile.certifications.length})</p>
            <input value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="Nombre de certificación" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <input value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} placeholder="Emisor" className="w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <button
              type="button"
              onClick={() => {
                if (!certName) return;
                patchAction({ action: "addCertification", name: certName, issuer: certIssuer || "Institución" }, "Certificación agregada.");
                setCertName("");
                setCertIssuer("");
              }}
              className="rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-bold text-white"
            >
              + Agregar certificación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

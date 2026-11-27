"use client";

import React, { useEffect, useState } from "react";
import { Save, UserPlus } from "lucide-react";
import { PERU_DEPARTMENTS, PERU_SECTORS } from "@/lib/peru-data";

export default function EmpresaPerfilPage() {
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; role: string; user: { name: string; email: string } }>>([]);
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/empresa/jobs");
    if (res.ok) {
      const data = await res.json();
      setCompany(data.company);
      setMembers(data.company?.members || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    const res = await fetch("/api/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    const data = await res.json();
    setMsg(res.ok ? "Perfil empresarial actualizado." : data.error || "Error al guardar.");
  }

  async function inviteRecruiter(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/empresa/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recruiterEmail }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Reclutador autorizado agregado al equipo." : data.error || "Error.");
    if (res.ok) {
      setRecruiterEmail("");
      load();
    }
  }

  if (!company) return <p className="text-sm text-slate-500">Cargando perfil empresarial...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
        Perfil Empresarial y Equipo de Reclutamiento
      </h1>
      {msg && <p className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-[#2563EB]">{msg}</p>}

      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold">Nombre comercial</label>
            <input
              value={String(company.tradeName || "")}
              onChange={(e) => setCompany({ ...company, tradeName: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Razón social</label>
            <input
              value={String(company.legalName || "")}
              onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">RUC (11 dígitos — validación local de formato)</label>
            <input
              value={String(company.ruc || "")}
              onChange={(e) => setCompany({ ...company, ruc: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Sector</label>
            <select
              value={String(company.sector || "")}
              onChange={(e) => setCompany({ ...company, sector: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {PERU_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Departamento</label>
            <select
              value={String(company.department || "Lima")}
              onChange={(e) => setCompany({ ...company, department: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {PERU_DEPARTMENTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Sitio web</label>
            <input
              value={String(company.website || "")}
              onChange={(e) => setCompany({ ...company, website: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold">Descripción pública</label>
            <textarea
              rows={3}
              value={String(company.description || "")}
              onChange={(e) => setCompany({ ...company, description: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white">
          <Save className="h-4 w-4" /> Guardar perfil
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-[#12336B] dark:text-white">Reclutadores autorizados ({members.length})</h2>
        <div className="space-y-2 text-sm">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <span><strong>{m.user.name}</strong> ({m.user.email})</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563EB]">{m.role}</span>
            </div>
          ))}
        </div>
        <form onSubmit={inviteRecruiter} className="flex gap-2">
          <input
            type="email"
            required
            value={recruiterEmail}
            onChange={(e) => setRecruiterEmail(e.target.value)}
            placeholder="Correo de usuario registrado para agregar como reclutador"
            className="flex-1 rounded-xl border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white">
            <UserPlus className="h-4 w-4" /> Autorizar
          </button>
        </form>
      </div>
    </div>
  );
}

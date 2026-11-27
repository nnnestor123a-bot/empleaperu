"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, UserPlus } from "lucide-react";
import { PERU_SECTORS } from "@/lib/peru-data";

function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [role, setRole] = useState<"CANDIDATE" | "COMPANY">(
    sp.get("role") === "COMPANY" ? "COMPANY" : "CANDIDATE"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ruc, setRuc] = useState("");
  const [sector, setSector] = useState(PERU_SECTORS[0]);
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        role,
        consentAccepted: consent,
        ...(role === "COMPANY" ? { companyName, ruc, sector } : {}),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo completar el registro.");
      return;
    }
    router.push(role === "COMPANY" ? "/empresa" : "/postulante");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
          Crear cuenta en EmpleaPerú
        </h1>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setRole("CANDIDATE")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              role === "CANDIDATE"
                ? "bg-white text-[#2563EB] shadow-sm dark:bg-slate-900"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Soy Postulante
          </button>
          <button
            type="button"
            onClick={() => setRole("COMPANY")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              role === "COMPANY"
                ? "bg-white text-[#2563EB] shadow-sm dark:bg-slate-900"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <Building2 className="h-4 w-4" /> Soy Empresa
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="text-xs font-semibold">Nombre completo</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Teléfono (opcional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 9XX XXX XXX"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {role === "COMPANY" && (
            <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div>
                <label className="text-xs font-semibold">Razón social / Nombre comercial</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold">RUC (11 dígitos)</label>
                  <input
                    required
                    maxLength={11}
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                    placeholder="20XXXXXXXXX"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Validación local de formato (no consulta SUNAT).
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold">Sector</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    {PERU_SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold">Contraseña (mín. 8 caracteres, 1 mayúscula, 1 número)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#2563EB]"
            />
            <span>
              Acepto el tratamiento de mis datos conforme a la{" "}
              <Link href="/privacidad" className="text-[#2563EB] underline">
                Política de Privacidad (referencia Ley 29733)
              </Link>{" "}
              y los{" "}
              <Link href="/terminos" className="text-[#2563EB] underline">
                Términos de uso
              </Link>
              .
            </span>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-bold text-white hover:bg-[#12336B] disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-[#2563EB] hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Cargando registro...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Postulante Demo", email: "postulante@empleaperu.local", role: "CANDIDATE" },
  { label: "Empresa Demo", email: "empresa@empleaperu.local", role: "COMPANY" },
  { label: "Admin Demo", email: "admin@empleaperu.local", role: "ADMIN" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo iniciar sesión.");
      return;
    }
    const dest =
      data.user.role === "ADMIN"
        ? "/admin"
        : data.user.role === "COMPANY"
        ? "/empresa"
        : "/postulante";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-[#12336B] dark:text-white">
          <LogIn className="h-6 w-6 text-[#2563EB]" />
          <h1 className="text-2xl font-extrabold">Iniciar sesión</h1>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Accede a tu panel de postulante, empresa/ATS o administración.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
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
            <label className="text-xs font-semibold">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

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
            {loading ? "Validando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <Link href="/recuperar-password" className="text-[#2563EB] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link href="/registro" className="font-semibold text-[#12336B] hover:underline dark:text-blue-300">
            Crear cuenta gratis
          </Link>
        </div>

        {/* Local demo credentials helper */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/70">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#12336B] dark:text-blue-200">
            <KeyRound className="h-3.5 w-3.5" /> Cuentas ficticias de demostración local
          </p>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
            Contraseña demo para los 3 roles: <code className="font-bold">Emplea2026!</code>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("Emplea2026!");
                }}
                className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#12336B] shadow-sm hover:bg-[#2563EB] hover:text-white dark:bg-slate-900 dark:text-slate-200"
              >
                Usar {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

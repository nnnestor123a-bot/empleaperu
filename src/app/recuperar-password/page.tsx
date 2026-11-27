"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [devToken, setDevToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    if (data.devResetToken) {
      setDevToken(data.devResetToken);
      setTokenInput(data.devResetToken);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenInput, newPassword }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-extrabold text-[#12336B] dark:text-white">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Entorno de desarrollo local: el código temporal se muestra en pantalla en lugar de enviarse por correo externo.
        </p>

        <form onSubmit={requestReset} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu-correo@empleaperu.local"
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button type="submit" className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-bold text-white">
            Generar código local
          </button>
        </form>

        {devToken && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <strong>Código de desarrollo local:</strong> <code>{devToken}</code>
          </div>
        )}

        <form onSubmit={confirmReset} className="mt-6 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <input
            required
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Código de recuperación"
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña (mín. 8 car., 1 Mayús, 1 Núm)"
            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button type="submit" className="w-full rounded-xl bg-[#16A34A] py-2.5 text-sm font-bold text-white">
            Restablecer contraseña
          </button>
        </form>

        {msg && <p className="mt-4 text-xs font-semibold text-[#2563EB]">{msg}</p>}

        <Link href="/login" className="mt-4 block text-center text-xs text-slate-500 hover:underline">
          Volver a Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

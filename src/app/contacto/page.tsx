"use client";

import React, { useState } from "react";
import { Mail, MapPin, Send } from "lucide-react";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    const data = await res.json();
    setLoading(false);
    setResult({ ok: res.ok, text: data.message || data.error || "Enviado" });
    if (res.ok) {
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-[#12336B] dark:text-white">Contacto</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        ¿Tienes consultas sobre cuentas, verificación de empresas o soporte técnico? Escríbenos.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-2xl bg-[#12336B] p-6 text-white">
          <h2 className="font-bold">Canales locales</h2>
          <p className="flex items-center gap-2 text-xs text-blue-100">
            <Mail className="h-4 w-4 text-emerald-300" /> soporte@empleaperu.local
          </p>
          <p className="flex items-center gap-2 text-xs text-blue-100">
            <MapPin className="h-4 w-4 text-emerald-300" /> Lima, Perú (entorno local)
          </p>
          <p className="text-xs text-blue-200">
            Los mensajes enviados aquí se almacenan directamente en la base de datos SQLite y son visibles desde el panel de administración.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 md:col-span-2 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Nombre completo</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
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
          </div>
          <div>
            <label className="text-xs font-semibold">Asunto</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Mensaje</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#12336B]"
          >
            <Send className="h-4 w-4" /> {loading ? "Enviando..." : "Enviar mensaje"}
          </button>
          {result && (
            <p className={`text-xs font-semibold ${result.ok ? "text-[#16A34A]" : "text-red-600"}`}>
              {result.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

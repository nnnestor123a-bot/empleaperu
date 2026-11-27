"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bot, Send, X } from "lucide-react";

interface ChatMsg {
  from: "bot" | "user";
  text: string;
  suggestions?: string[];
  links?: Array<{ label: string; href: string }>;
}

export function EmpleaBotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      from: "bot",
      text: "Hola, soy EmpleaBot (asistente local basado en reglas). ¿En qué te ayudo hoy?",
      suggestions: [
        "Buscar empleos remotos",
        "¿Cómo mejorar mi CV?",
        "Ver salarios en Perú",
        "Publicar vacante como empresa",
      ],
    },
  ]);

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/empleabot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.answer || "No pude procesar esa consulta.",
          suggestions: data.suggestions,
          links: data.links,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Error de conexión local con EmpleaBot." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-print fixed bottom-5 right-5 z-50">
      {open ? (
        <div
          role="dialog"
          aria-label="Asistente EmpleaBot"
          className="flex h-[460px] w-[350px] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between bg-[#12336B] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-bold leading-none">EmpleaBot</p>
                <p className="text-[11px] text-blue-200">Asistente local basado en reglas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar EmpleaBot"
              className="rounded-lg p-1 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-sm">
            {messages.map((m, idx) => (
              <div key={idx} className={m.from === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                <div
                  className={`max-w-[86%] whitespace-pre-line rounded-xl px-3 py-2 leading-relaxed ${
                    m.from === "user"
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {m.text}
                </div>
                {m.links && m.links.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {l.label} →
                      </Link>
                    ))}
                  </div>
                )}
                {m.suggestions && idx === messages.length - 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendText(s)}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400">Consultando reglas locales...</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendText(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-2.5 dark:border-slate-800"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Enviar consulta"
              className="rounded-lg bg-[#2563EB] p-2 text-white hover:bg-[#12336B] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#12336B] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#2563EB] transition-colors"
        >
          <Bot className="h-4 w-4 text-emerald-400" />
          EmpleaBot
        </button>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

interface Conversation {
  id: string;
  company: { id: string; tradeName: string };
  candidate: { user: { id: string; name: string } };
  application: { job: { title: string } } | null;
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string; role: string };
  }>;
}

export default function MensajesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/messages");
    if (!res.ok) {
      setError("Inicia sesión para ver tus conversaciones autorizadas.");
      return;
    }
    const data = await res.json();
    const list = data.conversations || [];
    setConversations(list);
    if (!activeId && list.length > 0) setActiveId(list[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const active = conversations.find((c) => c.id === activeId) || null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !text.trim()) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: active.id, content: text }),
    });
    if (res.ok) {
      setText("");
      load();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
        <MessageSquare className="h-6 w-6 text-[#2563EB]" /> Mensajería Autorizada
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Solo los participantes autorizados (postulante y empresa de la postulación) acceden a cada hilo.
      </p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {error}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-4">
            {conversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-6 text-xs text-slate-500">
                No tienes conversaciones activas todavía.
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    active?.id === c.id
                      ? "border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <p className="text-sm font-bold text-[#12336B] dark:text-white">
                    {c.company.tradeName} ↔ {c.candidate.user.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {c.application?.job.title || "Conversación directa"}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="flex h-[520px] flex-col rounded-2xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
            {active ? (
              <>
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                  <p className="font-bold text-[#12336B] dark:text-white">
                    {active.company.tradeName} — {active.candidate.user.name}
                  </p>
                  <p className="text-xs text-slate-500">{active.application?.job.title}</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {active.messages.map((m) => (
                    <div key={m.id} className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-[#12336B] dark:text-blue-300">
                          {m.sender.name} ({m.sender.role})
                        </span>
                        <span>{new Date(m.createdAt).toLocaleString("es-PE")}</span>
                      </div>
                      <p className="mt-1 text-slate-800 dark:text-slate-100">{m.content}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white">
                    <Send className="h-4 w-4" /> Enviar
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                Selecciona una conversación.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

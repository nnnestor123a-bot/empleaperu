"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificacionesPage() {
  const [items, setItems] = useState<Notif[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#12336B] dark:text-white">
          <Bell className="h-6 w-6 text-[#2563EB]" /> Notificaciones
        </h1>
        <button
          type="button"
          onClick={markAll}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold hover:border-[#2563EB] dark:border-slate-700 dark:bg-slate-900"
        >
          <CheckCheck className="h-4 w-4 text-[#16A34A]" /> Marcar todas como leídas
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
            No tienes notificaciones pendientes.
          </p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 ${
                n.isRead
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-[#2563EB]">{n.type}</span>
                <span>{new Date(n.createdAt).toLocaleString("es-PE")}</span>
              </div>
              <p className="mt-1 font-bold text-slate-900 dark:text-white">{n.title}</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
              {n.link && (
                <Link href={n.link} className="mt-2 inline-block text-xs font-semibold text-[#2563EB] hover:underline">
                  Ir al detalle →
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

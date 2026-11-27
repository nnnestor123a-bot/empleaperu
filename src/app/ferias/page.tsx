"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, MapPin, Users } from "lucide-react";

interface FairItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  modality: string;
  locationOrLink: string;
  organizer: string;
  status: string;
  isRegistered: boolean;
  _count: { registrations: number };
  companies: Array<{ company: { id: string; tradeName: string; sector: string } }>;
}

export default function FeriasPage() {
  const router = useRouter();
  const [fairs, setFairs] = useState<FairItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/fairs");
    const data = await res.json();
    setFairs(data.fairs || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleReg(fairId: string) {
    const res = await fetch("/api/fairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fairId }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setMsg(data.registered ? "Te inscribiste correctamente a la feria." : "Inscripción cancelada.");
    load();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#12336B] dark:text-white">
          Ferias Laborales y Eventos de Empleabilidad
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Conecta con empresas peruanas, accede a charlas técnicas e inscríbete con alertas automáticas.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {fairs.map((f) => (
          <div
            key={f.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563EB]">
                  {f.modality}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#16A34A]">
                  {f.status}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold text-[#12336B] dark:text-white">{f.title}</h2>
              <p className="mt-1 text-xs text-slate-500">Organiza: {f.organizer}</p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{f.description}</p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
                  {new Date(f.startsAt).toLocaleDateString("es-PE")} – {new Date(f.endsAt).toLocaleDateString("es-PE")}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#2563EB]" /> {f.locationOrLink}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#2563EB]" /> {f._count.registrations} inscritos
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Empresas participantes:</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {f.companies.map((c) => (
                    <Link
                      key={c.company.id}
                      href={`/empresas/${c.company.id}`}
                      className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium hover:text-[#2563EB] dark:bg-slate-800"
                    >
                      {c.company.tradeName}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleReg(f.id)}
              className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                f.isRegistered
                  ? "bg-emerald-600 text-white"
                  : "bg-[#2563EB] text-white hover:bg-[#12336B]"
              }`}
            >
              {f.isRegistered ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Inscrito (click para cancelar)
                </>
              ) : (
                "Inscribirme gratis"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Check, Info, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const plans = await prisma.plan.findMany({ orderBy: { pricePenMonthly: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
          <Sparkles className="h-3.5 w-3.5" /> Soluciones para empresas en el Perú
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-[#12336B] dark:text-white">
          Planes de Reclutamiento y Servicios Comerciales
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Publica vacantes, gestiona tu embudo ATS Kanban y destaca tu marca empleadora con control de equipo.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Transparencia de demostración:</strong> Los planes y suscripciones se prueban mediante{" "}
          <strong>simulación local explícita</strong> sin tarjetas reales ni cobros externos. La integración con pasarelas reales queda prevista como módulo futuro opcional.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((p) => {
          const features: string[] = JSON.parse(p.featuresJson || "[]");
          const highlight = p.code === "PRO";
          return (
            <div
              key={p.id}
              className={`flex flex-col justify-between rounded-3xl border p-7 ${
                highlight
                  ? "border-[#2563EB] bg-white shadow-xl ring-2 ring-[#2563EB]/20 dark:bg-slate-900"
                  : "border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#12336B] dark:text-white">{p.name}</h2>
                  {highlight && (
                    <span className="rounded-full bg-[#2563EB] px-2.5 py-0.5 text-[11px] font-bold text-white">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="mt-4 text-3xl font-extrabold text-slate-900 tabular-nums dark:text-white">
                  {p.pricePenMonthly === 0 ? "Gratis" : `S/ ${p.pricePenMonthly}`}
                  {p.pricePenMonthly > 0 && <span className="text-sm font-normal text-slate-500"> / mes (simulado)</span>}
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#16A34A] mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/empresa/planes"
                className={`mt-8 block rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${
                  highlight
                    ? "bg-[#2563EB] text-white hover:bg-[#12336B]"
                    : "border border-slate-300 text-[#12336B] hover:bg-slate-50 dark:border-slate-700 dark:text-white"
                }`}
              >
                Probar plan en Panel Empresa
              </Link>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-[#12336B] dark:text-white">Publicidad y Marca Empleadora</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Opciones comerciales de avisos destacados, presencia en ferias laborales temáticas y perfil corporativo verificado.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-[#12336B] dark:text-white">Servicios de Reclutamiento Especializado</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Diseño de evaluaciones técnicas a medida, soporte en procesos masivos y acompañamiento en mejores prácticas ATS.
          </p>
        </div>
      </div>
    </div>
  );
}

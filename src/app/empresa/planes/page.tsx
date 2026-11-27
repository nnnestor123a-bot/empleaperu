"use client";

import React, { useEffect, useState } from "react";
import { Check, Info } from "lucide-react";

interface PlanItem {
  id: string;
  code: string;
  name: string;
  pricePenMonthly: number;
  maxActiveJobs: number;
  maxFeaturedJobs: number;
  maxRecruiters: number;
  features: string[];
}

export default function EmpresaPlanesPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [activeCode, setActiveCode] = useState<string>("");
  const [sims, setSims] = useState<Array<{ id: string; referenceCode: string; amountPen: number; createdAt: string; subscription: { plan: { name: string } } }>>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/subscriptions");
    if (res.ok) {
      const d = await res.json();
      setPlans(d.plans || []);
      setActiveCode(d.activeSubscription?.plan?.code || "FREE");
      setSims(d.simulations || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function activatePlan(planCode: string) {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const d = await res.json();
    setMsg(d.notice || d.error || "Actualizado.");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
          Planes Empresariales (Simulación Local Explícita)
        </h1>
        <p className="text-xs text-slate-500">
          Cambia de plan al instante para probar límites de vacantes, destacados y reclutadores sin cobros ni tarjetas reales.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Entorno demostrativo:</strong> No se procesan tarjetas de crédito ni pagos bancarios reales. Cada cambio genera un comprobante marcado como <code>SIMULATED_PAID</code> en la base de datos local.
        </p>
      </div>

      {msg && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">{msg}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.code === activeCode;
          return (
            <div key={p.id} className={`flex flex-col justify-between rounded-2xl border p-6 ${isCurrent ? "border-[#2563EB] bg-blue-50/40 dark:bg-blue-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
              <div>
                <h2 className="text-lg font-bold text-[#12336B] dark:text-white">{p.name}</h2>
                <p className="mt-2 text-2xl font-extrabold tabular-nums">
                  {p.pricePenMonthly === 0 ? "S/ 0" : `S/ ${p.pricePenMonthly}/mes`}
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                disabled={isCurrent}
                onClick={() => activatePlan(p.code)}
                className={`mt-6 w-full rounded-xl py-2.5 text-xs font-bold ${
                  isCurrent
                    ? "bg-emerald-600 text-white opacity-90"
                    : "bg-[#2563EB] text-white hover:bg-[#12336B]"
                }`}
              >
                {isCurrent ? "Plan activo actual" : "Activar mediante simulación local"}
              </button>
            </div>
          );
        })}
      </div>

      {sims.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-[#12336B] dark:text-white">Historial de comprobantes simulados</h2>
          <div className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {sims.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5">
                <span><strong>{s.referenceCode}</strong> · {s.subscription.plan.name} (SIMULADO)</span>
                <span className="font-bold text-[#16A34A]">S/ {s.amountPen}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

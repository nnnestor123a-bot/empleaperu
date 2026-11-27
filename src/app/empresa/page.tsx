import Link from "next/link";
import { BadgeCheck, Briefcase, CreditCard, Kanban, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { APPLICATION_STATUS_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmpresaDashboardPage() {
  const user = await getCurrentUser();
  const companyId = user?.primaryCompanyId;

  const company = companyId
    ? await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          jobs: {
            include: { _count: { select: { applications: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null;

  if (!company) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm">
        No tienes una empresa asociada a tu usuario.
      </div>
    );
  }

  const recentApps = await prisma.application.findMany({
    where: { job: { companyId: company.id } },
    include: {
      job: { select: { title: true } },
      candidate: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const activeJobs = company.jobs.filter((j) => j.status === "PUBLISHED").length;
  const totalApps = company.jobs.reduce((acc, j) => acc + j._count.applications, 0);
  const plan = company.subscriptions[0]?.plan;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#12336B] p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold">
                {company.sector}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-3 py-0.5 text-xs font-semibold text-emerald-200">
                <BadgeCheck className="h-3.5 w-3.5" />
                {company.verificationStatus === "VERIFIED" ? "Empresa verificada" : "Verificación pendiente"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold">{company.tradeName}</h1>
            <p className="text-xs text-blue-200">RUC {company.ruc} · {company.department}</p>
          </div>

          <Link
            href="/empresa/vacantes"
            className="rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            + Publicar nueva vacante
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Briefcase className="h-5 w-5 text-[#2563EB]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums">
            {activeJobs} <span className="text-xs font-normal text-slate-500">/ {plan?.maxActiveJobs ?? 3}</span>
          </p>
          <p className="text-xs text-slate-500">Vacantes activas en tu plan</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Users className="h-5 w-5 text-[#16A34A]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{totalApps}</p>
          <p className="text-xs text-slate-500">Postulaciones recibidas</p>
        </div>
        <Link href="/empresa/planes" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900">
          <CreditCard className="h-5 w-5 text-[#2563EB]" />
          <p className="mt-2 text-lg font-extrabold">{plan?.name || "Plan Gratuito"}</p>
          <p className="text-xs text-slate-500">Gestionar plan (simulado) →</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
            <Kanban className="h-5 w-5 text-[#2563EB]" /> Postulaciones recientes
          </h2>
          <Link href="/empresa/ats" className="text-xs font-semibold text-[#2563EB] hover:underline">
            Abrir ATS Kanban completo →
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {recentApps.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold">{a.candidate.user.name}</p>
                <p className="text-xs text-slate-500">{a.job.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#16A34A]">
                  {a.compatibilityScore}%
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563EB]">
                  {APPLICATION_STATUS_LABELS[a.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

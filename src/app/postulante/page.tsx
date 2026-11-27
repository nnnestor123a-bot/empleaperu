import Link from "next/link";
import { Briefcase, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRecentPublishedJobsCached } from "@/lib/public-cache";
import {
  calculateCompatibility,
  estimateExperienceYears,
  inferHighestEducation,
} from "@/lib/compatibility";
import { APPLICATION_STATUS_LABELS, formatSalaryRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PostulanteDashboardPage() {
  const user = await getCurrentUser();
  if (!user?.candidateProfileId) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        Perfil de postulante no encontrado.
      </div>
    );
  }

  const [profile, applications, jobs, favCount] = await Promise.all([
    prisma.candidateProfile.findUnique({
      where: { id: user.candidateProfileId },
      select: {
        headline: true,
        department: true,
        preferredModality: true,
        expectedSalaryPen: true,
        completionPct: true,
        skills: { select: { skill: { select: { name: true } } } },
        experiences: { select: { startDate: true, endDate: true, isCurrent: true } },
        educations: { select: { degree: true } },
        _count: { select: { resumes: true } },
      },
    }),
    prisma.application.findMany({
      where: { candidateId: user.candidateProfileId },
      select: {
        id: true,
        status: true,
        job: { select: { title: true, company: { select: { tradeName: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    getRecentPublishedJobsCached(),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  const candInput = profile
    ? {
        skills: profile.skills.map((s) => s.skill.name),
        experienceYears: estimateExperienceYears(profile.experiences),
        highestEducation: inferHighestEducation(profile.educations),
        department: profile.department,
        preferredModality: profile.preferredModality,
        expectedSalaryPen: profile.expectedSalaryPen,
      }
    : null;

  const recommended = candInput
    ? jobs
        .map((j) => ({
          job: j,
          match: calculateCompatibility(candInput, {
            skills: j.skills.map((s) => s.skill.name),
            experienceLevel: j.experienceLevel,
            educationLevel: j.educationLevel,
            department: j.department,
            modality: j.modality,
            salaryMinPen: j.salaryMinPen,
            salaryMaxPen: j.salaryMaxPen,
          }),
        }))
        .sort((a, b) => b.match.totalScore - a.match.totalScore)
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-6">
      {/* Completion & KPIs */}
      <div className="rounded-3xl bg-gradient-to-r from-[#12336B] to-[#2563EB] p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Hola, {user.name}</h1>
            <p className="mt-1 text-sm text-blue-100">
              {profile?.headline || "Completa tu perfil profesional para aumentar tus coincidencias."}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
            <p className="text-xs text-blue-100">Completitud del perfil</p>
            <p className="text-2xl font-extrabold tabular-nums">{profile?.completionPct ?? 25}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${profile?.completionPct ?? 25}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/postulante/postulaciones" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900">
          <Briefcase className="h-5 w-5 text-[#2563EB]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{applications.length}</p>
          <p className="text-xs text-slate-500">Postulaciones recientes</p>
        </Link>
        <Link href="/postulante/cv" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900">
          <FileText className="h-5 w-5 text-[#16A34A]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{profile?._count.resumes ?? 0}</p>
          <p className="text-xs text-slate-500">CVs privados cargados</p>
        </Link>
        <Link href="/postulante/favoritos" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="h-5 w-5 text-[#2563EB]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{favCount}</p>
          <p className="text-xs text-slate-500">Vacantes guardadas</p>
        </Link>
      </div>

      {/* Recommended Jobs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
            <Sparkles className="h-5 w-5 text-[#16A34A]" /> Vacantes recomendadas (Compatibilidad explicable)
          </h2>
          <Link href="/empleos" className="text-xs font-semibold text-[#2563EB] hover:underline">
            Explorar todas →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {recommended.map(({ job, match }) => (
            <Link
              key={job.id}
              href={`/empleos/${job.slug}`}
              className="rounded-xl border border-slate-200 p-4 hover:border-[#2563EB] dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900 dark:text-white">{job.title}</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-extrabold text-[#16A34A]">
                  {match.totalScore}%
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {job.company.tradeName} · {job.department} · {formatSalaryRange(job.salaryMinPen, job.salaryMaxPen, job.salaryVisible)}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">{match.breakdown.skills.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Applications */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#12336B] dark:text-white">Últimas postulaciones</h2>
          <Link href="/postulante/postulaciones" className="text-xs font-semibold text-[#2563EB] hover:underline">
            Ver timeline completo →
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {applications.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold">{a.job.title}</p>
                <p className="text-xs text-slate-500">{a.job.company.tradeName}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">
                {APPLICATION_STATUS_LABELS[a.status] || a.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

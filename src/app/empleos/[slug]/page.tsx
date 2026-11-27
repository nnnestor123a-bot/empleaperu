import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Briefcase, MapPin, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateCompatibility,
  estimateExperienceYears,
  inferHighestEducation,
} from "@/lib/compatibility";
import {
  CONTRACT_LABELS,
  EXPERIENCE_LABELS,
  formatSalaryRange,
  MODALITY_LABELS,
  relativeDateEs,
} from "@/lib/utils";
import { JobDetailActions } from "@/components/JobDetailActions";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await prisma.job.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      company: true,
      category: true,
      skills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  const user = await getCurrentUser();
  let hasApplied = false;
  let isFavorite = false;
  let compatibility = null;

  if (user?.candidateProfileId) {
    const [profile, app, fav] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { id: user.candidateProfileId },
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          educations: true,
        },
      }),
      prisma.application.findUnique({
        where: { jobId_candidateId: { jobId: job.id, candidateId: user.candidateProfileId } },
      }),
      prisma.favorite.findUnique({
        where: { userId_jobId: { userId: user.id, jobId: job.id } },
      }),
    ]);
    hasApplied = Boolean(app);
    isFavorite = Boolean(fav);
    if (profile) {
      compatibility = calculateCompatibility(
        {
          skills: profile.skills.map((s) => s.skill.name),
          experienceYears: estimateExperienceYears(profile.experiences),
          highestEducation: inferHighestEducation(profile.educations),
          department: profile.department,
          preferredModality: profile.preferredModality,
          expectedSalaryPen: profile.expectedSalaryPen,
        },
        {
          skills: job.skills.map((s) => s.skill.name),
          experienceLevel: job.experienceLevel,
          educationLevel: job.educationLevel,
          department: job.department,
          modality: job.modality,
          salaryMinPen: job.salaryMinPen,
          salaryMaxPen: job.salaryMaxPen,
        }
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/empleos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver al buscador de empleos
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#2563EB]">
              <Link href={`/empresas/${job.company.id}`} className="hover:underline">
                {job.company.tradeName}
              </Link>
              {job.company.verificationStatus === "VERIFIED" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs">
                  <BadgeCheck className="h-3.5 w-3.5" /> Empresa verificada
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {job.category.name}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold text-[#12336B] sm:text-3xl dark:text-white">
              {job.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#2563EB]" /> {job.department}
                {job.district ? `, ${job.district}` : ""}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-4 w-4 text-[#2563EB]" /> {MODALITY_LABELS[job.modality]} · {CONTRACT_LABELS[job.contractType]}
              </span>
              <span className="font-bold text-[#16A34A] tabular-nums">
                {formatSalaryRange(job.salaryMinPen, job.salaryMaxPen, job.salaryVisible)}
              </span>
            </div>
          </div>

          {compatibility && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  <Sparkles className="h-4 w-4 text-[#16A34A]" /> Compatibilidad explicable
                </span>
                <span className="text-xl font-extrabold text-[#16A34A]">{compatibility.totalScore}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {compatibility.breakdown.skills.note} {compatibility.breakdown.experience.note}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{compatibility.disclaimer}</p>
            </div>
          )}

          <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="font-bold text-[#12336B] dark:text-white">Descripción</h2>
              <p className="mt-1 whitespace-pre-line">{job.description}</p>
            </section>
            <section>
              <h2 className="font-bold text-[#12336B] dark:text-white">Responsabilidades</h2>
              <p className="mt-1 whitespace-pre-line">{job.responsibilities}</p>
            </section>
            <section>
              <h2 className="font-bold text-[#12336B] dark:text-white">Requisitos</h2>
              <p className="mt-1 whitespace-pre-line">{job.requirements}</p>
            </section>
            {job.benefits && (
              <section>
                <h2 className="font-bold text-[#12336B] dark:text-white">Beneficios</h2>
                <p className="mt-1 whitespace-pre-line">{job.benefits}</p>
              </section>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Postular ahora</h2>
            <p className="mt-1 text-xs text-slate-500">
              Publicado {job.publishedAt ? relativeDateEs(job.publishedAt) : "recientemente"} ·{" "}
              {EXPERIENCE_LABELS[job.experienceLevel]} · {job._count.applications} postulaciones
            </p>
            <div className="mt-4">
              <JobDetailActions
                jobId={job.id}
                initialApplied={hasApplied}
                initialFavorite={isFavorite}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-[#12336B] dark:text-white">Sobre {job.company.tradeName}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {job.company.sector} · RUC {job.company.ruc} · {job.company.department}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {job.company.description}
            </p>
            <Link
              href={`/empresas/${job.company.id}`}
              className="mt-4 inline-block text-xs font-bold text-[#2563EB] hover:underline"
            >
              Ver perfil público y reseñas de la empresa →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

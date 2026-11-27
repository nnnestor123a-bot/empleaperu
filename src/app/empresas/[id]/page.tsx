import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, MapPin, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatSalaryRange, MODALITY_LABELS } from "@/lib/utils";
import { CompanyReviewForm } from "@/components/CompanyReviewForm";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      jobs: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) notFound();

  const avg =
    company.reviews.length > 0
      ? (
          company.reviews.reduce(
            (s, r) =>
              s +
              (r.environmentRating +
                r.growthRating +
                r.selectionRating +
                r.communicationRating +
                r.benefitsRating) /
                5,
            0
          ) / company.reviews.length
        ).toFixed(1)
      : "Sin reseñas";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="rounded-3xl bg-[#12336B] p-8 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold">
                {company.sector}
              </span>
              {company.verificationStatus === "VERIFIED" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-3 py-0.5 text-xs font-semibold text-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> Empresa verificada manualmente
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold">{company.tradeName}</h1>
            <p className="text-sm text-blue-200">{company.legalName} · RUC {company.ruc} (formato validado localmente)</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-blue-100">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {company.department}, {company.district}
              </span>
              {company.website && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> {company.website}
                </span>
              )}
              <span>Tamaño: {company.size}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 text-center">
            <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
            <p className="mt-1 text-xl font-extrabold">{avg}</p>
            <p className="text-[11px] text-blue-200">{company.reviews.length} reseñas aprobadas</p>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-blue-100">{company.description}</p>
      </div>

      {/* Open Vacancies */}
      <section>
        <h2 className="text-xl font-bold text-[#12336B] dark:text-white">
          Vacantes abiertas ({company.jobs.length})
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {company.jobs.map((job) => (
            <Link
              key={job.id}
              href={`/empleos/${job.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-bold text-slate-900 dark:text-white">{job.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {job.department} · {MODALITY_LABELS[job.modality]}
              </p>
              <p className="mt-2 text-sm font-bold text-[#16A34A]">
                {formatSalaryRange(job.salaryMinPen, job.salaryMaxPen, job.salaryVisible)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Reputation Reviews */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#12336B] dark:text-white">
            Reputación y valoraciones ({company.reviews.length})
          </h2>
          {company.reviews.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay valoraciones aprobadas para esta empresa.</p>
          ) : (
            company.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Ambiente: <strong>{r.environmentRating}/5</strong></span>
                  <span>Crecimiento: <strong>{r.growthRating}/5</strong></span>
                  <span>Selección: <strong>{r.selectionRating}/5</strong></span>
                  <span>Comunicación: <strong>{r.communicationRating}/5</strong></span>
                  <span>Beneficios: <strong>{r.benefitsRating}/5</strong></span>
                </div>
                <p className="mt-3"><strong className="text-emerald-700">Lo positivo:</strong> {r.pros}</p>
                <p className="mt-1"><strong className="text-amber-700">Por mejorar:</strong> {r.cons}</p>
              </div>
            ))
          )}
        </div>

        <CompanyReviewForm companyId={company.id} />
      </section>
    </div>
  );
}

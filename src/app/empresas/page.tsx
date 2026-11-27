import Link from "next/link";
import { BadgeCheck, Building2, MapPin, Star } from "lucide-react";
import { getCompaniesDirectoryCached } from "@/lib/public-cache";

export const revalidate = 60;

export default async function EmpresasPage() {
  const companies = await getCompaniesDirectoryCached();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#12336B] dark:text-white">
            Directorio de Empresas en Perú
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Conoce el perfil público, estado de verificación manual, valoraciones moderadas y vacantes abiertas.
          </p>
        </div>
        <Link
          href="/registro?role=COMPANY"
          className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#12336B]"
        >
          Registrar mi empresa
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => {
          const avg =
            c.reviews.length > 0
              ? (
                  c.reviews.reduce(
                    (s, r) =>
                      s +
                      (r.environmentRating +
                        r.growthRating +
                        r.selectionRating +
                        r.communicationRating +
                        r.benefitsRating) /
                        5,
                    0
                  ) / c.reviews.length
                ).toFixed(1)
              : null;

          return (
            <Link
              key={c.id}
              href={`/empresas/${c.id}`}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#2563EB] hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#12336B] dark:bg-blue-950 dark:text-blue-200">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      c.verificationStatus === "VERIFIED"
                        ? "bg-blue-50 text-[#2563EB]"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {c.verificationStatus === "VERIFIED" && <BadgeCheck className="h-3.5 w-3.5" />}
                    {c.verificationStatus === "VERIFIED" ? "Verificada" : "En verificación"}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{c.tradeName}</h2>
                <p className="text-xs text-slate-500">{c.sector} · RUC {c.ruc}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {c.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {c.department}
                </span>
                <div className="flex items-center gap-3">
                  {avg && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {avg}
                    </span>
                  )}
                  <span className="font-bold text-[#16A34A]">{c._count.jobs} vacantes</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

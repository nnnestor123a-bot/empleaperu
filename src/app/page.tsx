import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  FileSearch,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { formatSalaryRange, MODALITY_LABELS, relativeDateEs } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    activeJobsCount,
    companiesCount,
    candidatesCount,
    applicationsCount,
    categories,
    featuredJobs,
    latestJobs,
    featuredCompanies,
    deptCounts,
  ] = await Promise.all([
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.company.count(),
    prisma.candidateProfile.count(),
    prisma.application.count(),
    prisma.jobCategory.findMany({
      include: { _count: { select: { jobs: { where: { status: "PUBLISHED" } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: {
        company: { select: { id: true, tradeName: true, verificationStatus: true } },
        category: { select: { name: true } },
        skills: { include: { skill: true }, take: 4 },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      include: {
        company: { select: { id: true, tradeName: true, verificationStatus: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.company.findMany({
      where: { verificationStatus: "VERIFIED" },
      include: { _count: { select: { jobs: { where: { status: "PUBLISHED" } } } } },
      orderBy: [{ isFeatured: "desc" }, { tradeName: "asc" }],
      take: 6,
    }),
    prisma.job.groupBy({
      by: ["department"],
      where: { status: "PUBLISHED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
  ]);

  const suggestions = Array.from(
    new Set([
      ...featuredJobs.map((j) => j.title),
      ...latestJobs.map((j) => j.title),
      ...featuredCompanies.map((c) => c.tradeName),
    ])
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#12336B] via-[#173f82] to-[#2563EB] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-100 ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              Portal laboral peruano con compatibilidad explicable y ATS transparente
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Encuentra tu próximo empleo formal en todo el Perú
            </h1>
            <p className="mt-4 text-base text-blue-100 sm:text-lg">
              Explora vacantes verificadas con salarios en soles, evalúa tu CV ATS al instante y
              sigue cada etapa de tu postulación en tiempo real.
            </p>
          </div>

          <HomeSearchBar suggestions={suggestions} />

          {/* Quick filter hubs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
            <span className="text-blue-200">Accesos rápidos:</span>
            <Link href="/empleos?modality=REMOTO" className="rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25">
              100% Remoto
            </Link>
            <Link href="/practicas" className="rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25">
              Prácticas y Egresados
            </Link>
            <Link href="/empleos?category=tecnologia-sistemas" className="rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25">
              Tecnología TI
            </Link>
            <Link href="/empleos?experience=SEMI_SENIOR" className="rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25">
              Técnicos y Profesionales
            </Link>
            <Link href="/salarios" className="rounded-full bg-emerald-500/25 px-3 py-1.5 text-emerald-100 hover:bg-emerald-500/40">
              Explorador de Salarios PEN
            </Link>
          </div>

          {/* Real DB stats */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Vacantes publicadas", value: activeJobsCount, icon: Briefcase },
              { label: "Empresas registradas", value: companiesCount, icon: Building2 },
              { label: "Talento registrado", value: candidatesCount, icon: Users },
              { label: "Postulaciones activas", value: applicationsCount, icon: CheckCircle2 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm ring-1 ring-white/15"
              >
                <stat.icon className="mx-auto h-5 w-5 text-emerald-300" />
                <p className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">
                  {stat.value.toLocaleString("es-PE")}
                </p>
                <p className="text-xs text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#12336B] dark:text-white">
              Explora empleos por categoría
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sectores con mayor demanda laboral en nuestra base local actualizada.
            </p>
          </div>
          <Link href="/empleos" className="hidden text-sm font-semibold text-[#2563EB] hover:underline sm:inline-flex items-center gap-1">
            Ver todas las ofertas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/empleos?category=${cat.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#2563EB] hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 group-hover:text-[#2563EB] dark:text-white">
                  {cat.name}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#2563EB] dark:bg-blue-950 dark:text-blue-300">
                  {cat._count.jobs}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="bg-white py-14 dark:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
                Oportunidades destacadas
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#12336B] dark:text-white">
                Vacantes destacadas de la semana
              </h2>
            </div>
            <Link href="/empleos?featured=true" className="text-sm font-semibold text-[#2563EB] hover:underline">
              Ver destacadas →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/empleos/${job.slug}`}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {job.company.tradeName}
                      {job.company.verificationStatus === "VERIFIED" && (
                        <BadgeCheck className="h-3.5 w-3.5 text-[#2563EB]" />
                      )}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A] dark:bg-emerald-950/60">
                      {MODALITY_LABELS[job.modality]}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">
                    {job.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.department}
                      {job.district ? `, ${job.district}` : ""}
                    </span>
                    <span className="font-semibold text-[#12336B] tabular-nums dark:text-blue-300">
                      {formatSalaryRange(job.salaryMinPen, job.salaryMaxPen, job.salaryVisible)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {s.skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                  <span>{job.publishedAt ? relativeDateEs(job.publishedAt) : "Reciente"}</span>
                  <span className="font-semibold text-[#2563EB]">Ver detalle y postular →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Offers + Departments */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#12336B] dark:text-white">Últimas ofertas publicadas</h2>
              <Link href="/empleos" className="text-sm font-semibold text-[#2563EB] hover:underline">
                Ir al buscador completo
              </Link>
            </div>
            <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {latestJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/empleos/${job.slug}`}
                  className="flex flex-col justify-between gap-2 p-4 hover:bg-blue-50/40 sm:flex-row sm:items-center dark:hover:bg-slate-800/60"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{job.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {job.company.tradeName} · {job.department} · {MODALITY_LABELS[job.modality]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#16A34A] tabular-nums">
                      {formatSalaryRange(job.salaryMinPen, job.salaryMaxPen, job.salaryVisible)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {job.publishedAt ? relativeDateEs(job.publishedAt) : "Hoy"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#12336B] dark:text-white">Empleos por departamento</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {deptCounts.map((d) => (
                <Link
                  key={d.department}
                  href={`/empleos?department=${encodeURIComponent(d.department)}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="truncate">{d.department}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-[#12336B] dark:bg-slate-800 dark:text-blue-300">
                    {d._count.id}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[#12336B] p-5 text-white">
              <div className="flex items-center gap-2 text-emerald-300">
                <Wifi className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">Hubs especializados</span>
              </div>
              <p className="mt-2 text-sm text-blue-100">
                Explora vacantes en el mapa interactivo o compara bandas salariales en soles por cargo.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/mapa" className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#12336B]">
                  Mapa Perú
                </Link>
                <Link href="/salarios" className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white">
                  Salarios PEN
                </Link>
                <Link href="/ferias" className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  Ferias
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="bg-white py-14 dark:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#12336B] dark:text-white">
                Empresas verificadas contratando hoy
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Organizaciones revisadas manualmente en EmpleaPerú con procesos transparentes.
              </p>
            </div>
            <Link href="/empresas" className="text-sm font-semibold text-[#2563EB] hover:underline">
              Ver directorio →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/empresas/${c.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-extrabold text-[#12336B] dark:bg-blue-950 dark:text-blue-200">
                    {c.tradeName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB] dark:bg-blue-950 dark:text-blue-300">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{c.tradeName}</h3>
                <p className="text-xs text-slate-500">{c.sector} · {c.department}</p>
                <p className="mt-3 text-xs font-semibold text-[#16A34A]">
                  {c._count.jobs} vacantes activas
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Differentials */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[#12336B] dark:text-white">
            Innovación real para postulantes y equipos de reclutamiento
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Diseñado desde cero con transparencia algorítmica, privacidad de datos y herramientas prácticas.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Compass,
              title: "Compatibilidad Explicable",
              desc: "Fórmula local transparente (Habilidades 40%, Experiencia 25%, Formación 15%, Ubicación 10%, Salario 10%) sin sesgos ni rechazos automáticos.",
              href: "/empleos",
            },
            {
              icon: FileSearch,
              title: "Analizador & Generador CV",
              desc: "Extrae texto real de tu PDF/DOCX, calcula un puntaje ATS orientativo 0–100 o diseña tu CV desde cero con exportación a PDF.",
              href: "/postulante/cv",
            },
            {
              icon: ShieldCheck,
              title: "Protección Antifraude",
              desc: "Reglas explicables que alertan sobre cobros indebidos o enlaces sospechosos para revisión humana, cuidando a cada postulante.",
              href: "/ayuda",
            },
            {
              icon: BarChart3,
              title: "ATS Kanban & Analítica",
              desc: "Empresas gestionan etapas, entrevistas, evaluaciones, notas internas y exportación CSV con aislamiento estricto entre organizaciones.",
              href: "/servicios",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Dual CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-[#2563EB] p-8 text-white">
            <GraduationCap className="h-8 w-8 text-blue-200" />
            <h3 className="mt-4 text-2xl font-bold">¿Buscas empleo o prácticas?</h3>
            <p className="mt-2 text-sm text-blue-100">
              Crea tu perfil gratis, analiza tu CV, practica entrevistas y postula con total
              visibilidad de cada etapa.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/registro" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#12336B]">
                Crear cuenta postulante
              </Link>
              <Link href="/login" className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">
                Ingresar con cuenta demo
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-[#12336B] p-8 text-white">
            <Building2 className="h-8 w-8 text-emerald-300" />
            <h3 className="mt-4 text-2xl font-bold">¿Reclutas talento para tu empresa?</h3>
            <p className="mt-2 text-sm text-blue-100">
              Publica vacantes en minutos, compara postulantes en el tablero ATS Kanban y agenda
              entrevistas desde un solo lugar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/registro?role=COMPANY" className="rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-bold text-white">
                Registrar empresa
              </Link>
              <Link href="/servicios" className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">
                Ver planes (simulados)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

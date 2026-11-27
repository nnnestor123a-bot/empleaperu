import { notFound } from "next/navigation";
import { Award, Briefcase, ExternalLink, FolderGit2, GraduationCap, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await prisma.candidateProfile.findUnique({
    where: { portfolioSlug: slug },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      experiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startYear: "desc" } },
      certifications: { orderBy: { issueYear: "desc" } },
      skills: { include: { skill: true } },
      portfolioItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile || !profile.portfolioPublic) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="rounded-3xl bg-[#12336B] p-8 text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          Portafolio Público · EmpleaPerú
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">{profile.user.name}</h1>
        <p className="mt-1 text-base text-blue-200">{profile.headline}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-blue-100">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {profile.department}, {profile.district}
          </span>
          {profile.showEmail && <span>{profile.user.email}</span>}
          {profile.showPhone && profile.user.phone && <span>{profile.user.phone}</span>}
        </div>
        <p className="mt-4 max-w-3xl text-sm text-blue-100">{profile.bio}</p>
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-bold text-[#12336B] dark:text-white">Habilidades</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span key={s.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#12336B] dark:bg-blue-950 dark:text-blue-200">
              {s.skill.name} · {s.level}
            </span>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
          <FolderGit2 className="h-5 w-5 text-[#2563EB]" /> Proyectos y Evidencias
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {profile.portfolioItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase text-[#2563EB]">{item.category}</span>
              <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#2563EB]">
                {item.projectUrl && (
                  <a href={item.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                    Demo <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {item.repoUrl && (
                  <a href={item.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                    Repositorio <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience & Education */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
            <Briefcase className="h-4 w-4 text-[#2563EB]" /> Experiencia
          </h2>
          <div className="mt-3 space-y-3">
            {profile.experiences.map((e) => (
              <div key={e.id} className="border-l-2 border-[#2563EB] pl-3 text-sm">
                <p className="font-bold">{e.title}</p>
                <p className="text-xs text-slate-500">{e.company} · {e.startDate} – {e.isCurrent ? "Actualidad" : e.endDate}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{e.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
              <GraduationCap className="h-4 w-4 text-[#2563EB]" /> Formación
            </h2>
            <div className="mt-3 space-y-2">
              {profile.educations.map((ed) => (
                <div key={ed.id} className="text-sm">
                  <p className="font-bold">{ed.degree} — {ed.fieldOfStudy}</p>
                  <p className="text-xs text-slate-500">{ed.institution} ({ed.startYear}–{ed.inProgress ? "En curso" : ed.endYear})</p>
                </div>
              ))}
            </div>
          </div>
          {profile.certifications.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
                <Award className="h-4 w-4 text-[#16A34A]" /> Certificaciones
              </h2>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {profile.certifications.map((c) => (
                  <li key={c.id}><strong>{c.name}</strong> — {c.issuer} ({c.issueYear})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

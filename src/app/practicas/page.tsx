import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { JobBoardClient } from "@/components/JobBoardClient";

export const dynamic = "force-dynamic";

export default async function PracticasPage() {
  const categories = await prisma.jobCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="bg-gradient-to-r from-[#12336B] to-[#2563EB] py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <GraduationCap className="h-4 w-4 text-emerald-300" />
            Talento Joven · Estudiantes Universitarios, Técnicos y Egresados
          </div>
          <h1 className="mt-3 text-3xl font-extrabold">
            Prácticas Preprofesionales, Profesionales y Primer Empleo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Encuentra convenios de prácticas formales con subvención en soles, horarios flexibles
            para estudiantes y programas trainee sin experiencia previa obligatoria.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando prácticas...</div>}>
        <JobBoardClient categories={categories} initialInternshipOnly />
      </Suspense>
    </div>
  );
}

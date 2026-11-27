import { Suspense } from "react";
import { getCategoriesCached } from "@/lib/public-cache";
import { JobBoardClient } from "@/components/JobBoardClient";

export const revalidate = 60;

export default async function EmpleosPage() {
  const categories = await getCategoriesCached();

  return (
    <div>
      <div className="border-b border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold text-[#12336B] dark:text-white">
            Buscador de Empleos en Perú
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Filtra por departamento, salario PEN, modalidad, categoría y experiencia. Haz clic en
            cualquier oferta para ver detalle y postular.
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando vacantes...</div>}>
        <JobBoardClient categories={categories} />
      </Suspense>
    </div>
  );
}

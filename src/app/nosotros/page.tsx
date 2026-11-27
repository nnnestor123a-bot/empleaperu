import Link from "next/link";
import { ShieldCheck, Target, Users } from "lucide-react";

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="rounded-3xl bg-[#12336B] p-8 text-white">
        <h1 className="text-3xl font-extrabold">Sobre EmpleaPerú</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-blue-100">
          EmpleaPerú es una plataforma peruana diseñada para conectar talento formal y empresas responsables en todo el país, combinando búsqueda intuitiva, transparencia de procesos, compatibilidad explicable y herramientas prácticas de empleabilidad.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          {
            icon: Target,
            title: "Misión",
            text: "Reducir la opacidad en los procesos de selección del mercado laboral peruano mediante trazabilidad clara, datos salariales transparentes y herramientas accesibles.",
          },
          {
            icon: ShieldCheck,
            title: "Ética y Seguridad",
            text: "Ningún candidato es rechazado automáticamente por algoritmos. Protegemos los CVs privados, aplicamos aislamiento entre empresas y respetamos principios de la Ley 29733.",
          },
          {
            icon: Users,
            title: "Alcance Nacional",
            text: "Desde Lima hasta Arequipa, Trujillo, Piura, Cusco, Junín y Loreto: conectamos empleos presenciales, híbridos, remotos, técnicos y prácticas preprofesionales.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <item.icon className="h-6 w-6 text-[#2563EB]" />
            <h2 className="mt-3 font-bold text-[#12336B] dark:text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/contacto" className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white">
          Contactar al equipo →
        </Link>
      </div>
    </div>
  );
}

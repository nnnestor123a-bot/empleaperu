import Link from "next/link";
import { Briefcase, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="no-print border-t border-slate-200 bg-[#12336B] text-slate-200 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-lg font-extrabold text-white">EmpleaPerú</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Plataforma peruana de empleo, reclutamiento transparente, compatibilidad explicable y
              desarrollo profesional para todo el país.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Demo local · Protección de datos (Ley 29733)
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Postulantes</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link href="/empleos" className="hover:text-white">Buscar empleos</Link></li>
              <li><Link href="/practicas" className="hover:text-white">Prácticas y egresados</Link></li>
              <li><Link href="/salarios" className="hover:text-white">Explorador de salarios PEN</Link></li>
              <li><Link href="/mapa" className="hover:text-white">Mapa de empleos Perú</Link></li>
              <li><Link href="/ferias" className="hover:text-white">Ferias laborales</Link></li>
              <li><Link href="/postulante/cv" className="hover:text-white">Analizador y Generador CV ATS</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Empresas</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link href="/registro?role=COMPANY" className="hover:text-white">Publicar vacantes</Link></li>
              <li><Link href="/empresa/ats" className="hover:text-white">ATS y tablero Kanban</Link></li>
              <li><Link href="/servicios" className="hover:text-white">Planes y servicios</Link></li>
              <li><Link href="/empresas" className="hover:text-white">Directorio de empresas</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Institucional</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link href="/nosotros" className="hover:text-white">Nosotros</Link></li>
              <li><Link href="/ayuda" className="hover:text-white">Centro de ayuda y FAQ</Link></li>
              <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
              <li><Link href="/privacidad" className="hover:text-white">Privacidad (Ley 29733)</Link></li>
              <li><Link href="/terminos" className="hover:text-white">Términos de uso</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-slate-300 sm:flex-row">
          <p>© {new Date().getFullYear()} EmpleaPerú — Proyecto integral de plataforma laboral local.</p>
          <p>Datos semilla ficticios · Compatibilidad heurística explicable · Sin pagos reales.</p>
        </div>
      </div>
    </footer>
  );
}

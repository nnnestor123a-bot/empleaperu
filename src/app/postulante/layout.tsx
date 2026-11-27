import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  Bookmark,
  Briefcase,
  Compass,
  FileText,
  FolderGit2,
  LayoutDashboard,
  MessageCircle,
  User,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const LINKS = [
  { href: "/postulante", label: "Resumen", icon: LayoutDashboard },
  { href: "/postulante/perfil", label: "Mi Perfil y Privacidad", icon: User },
  { href: "/postulante/cv", label: "Analizador y Generador CV", icon: FileText },
  { href: "/postulante/postulaciones", label: "Mis Postulaciones", icon: Briefcase },
  { href: "/postulante/favoritos", label: "Favoritos", icon: Bookmark },
  { href: "/postulante/entrevistas", label: "Entrevistas y Simulador", icon: MessageCircle },
  { href: "/postulante/carrera", label: "Ruta de Carrera", icon: Compass },
  { href: "/postulante/evaluaciones", label: "Evaluaciones Técnicas", icon: Award },
  { href: "/postulante/portafolio", label: "Portafolio Público", icon: FolderGit2 },
];

export default async function PostulanteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CANDIDATE" && user.role !== "ADMIN") {
    redirect(user.role === "COMPANY" ? "/empresa" : "/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="no-print lg:col-span-3">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Portal Postulante
            </p>
            <p className="mt-1 px-3 text-sm font-bold text-[#12336B] dark:text-white truncate">
              {user.name}
            </p>
            <nav className="mt-3 space-y-1">
              {LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}

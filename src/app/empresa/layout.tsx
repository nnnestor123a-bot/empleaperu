import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Building2,
  CreditCard,
  Kanban,
  LayoutDashboard,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const LINKS = [
  { href: "/empresa", label: "Dashboard Empresa", icon: LayoutDashboard },
  { href: "/empresa/vacantes", label: "Gestión de Vacantes", icon: Briefcase },
  { href: "/empresa/ats", label: "ATS Kanban y Candidatos", icon: Kanban },
  { href: "/empresa/perfil", label: "Perfil y Equipo", icon: Building2 },
  { href: "/empresa/planes", label: "Planes (Simulación)", icon: CreditCard },
];

export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    redirect("/postulante");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="no-print lg:col-span-3">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Portal Empresa &amp; ATS
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

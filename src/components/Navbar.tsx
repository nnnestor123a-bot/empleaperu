"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface NavbarProps {
  initialUser?: SessionUser | null;
  initialUnread?: number;
}

const PUBLIC_LINKS = [
  { href: "/empleos", label: "Empleos" },
  { href: "/empresas", label: "Empresas" },
  { href: "/practicas", label: "Prácticas" },
  { href: "/salarios", label: "Salarios" },
  { href: "/mapa", label: "Mapa" },
  { href: "/ferias", label: "Ferias" },
  { href: "/servicios", label: "Servicios" },
];

export function Navbar({ initialUser = null, initialUnread = 0 }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [unread, setUnread] = useState(initialUnread);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let active = true;
    async function syncSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setUser(data.user ?? null);
        setUnread(typeof data.unreadNotifications === "number" ? data.unreadNotifications : 0);
      } catch {
        // Silent background session check
      }
    }

    syncSession();
    const onAuthChanged = () => {
      syncSession();
    };
    window.addEventListener("empleaperu-auth", onAuthChanged);
    return () => {
      active = false;
      window.removeEventListener("empleaperu-auth", onAuthChanged);
    };
  }, [pathname]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("empleaperu_theme") : null;
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("empleaperu_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("empleaperu_theme", "light");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUnread(0);
    setMenuOpen(false);
    window.dispatchEvent(new Event("empleaperu-auth"));
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "COMPANY"
      ? "/empresa"
      : "/postulante";

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#12336B] to-[#2563EB] text-white shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-[#12336B] dark:text-white">
              Emplea<span className="text-[#2563EB]">Perú</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Talento &amp; ATS
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1">
          {PUBLIC_LINKS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-700 hover:bg-slate-100 hover:text-[#12336B] dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                href="/mensajes"
                aria-label="Mensajes"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link
                href="/notificaciones"
                aria-label="Notificaciones"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#16A34A] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#12336B] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors"
              >
                {user.role === "ADMIN" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : user.role === "COMPANY" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#12336B] transition-colors"
              >
                Registrarse
              </Link>
              <Link
                href="/registro?role=COMPANY"
                className="hidden xl:inline-flex items-center rounded-lg border border-[#16A34A] px-3 py-2 text-sm font-semibold text-[#16A34A] hover:bg-green-50 dark:hover:bg-green-950/30"
              >
                Publicar empleo
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-slate-200 dark:border-slate-800" />
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-[#12336B] px-3 py-2 text-sm font-semibold text-white"
                >
                  Mi Panel ({user.role})
                </Link>
                <Link
                  href="/mensajes"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Mensajes
                </Link>
                <Link
                  href="/notificaciones"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Notificaciones {unread > 0 ? `(${unread})` : ""}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold dark:border-slate-700"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-[#2563EB] px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Crear cuenta gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

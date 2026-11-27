import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EmpleaBotWidget } from "@/components/EmpleaBotWidget";
import { PwaRegister } from "@/components/PwaRegister";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "EmpleaPerú — Empleos, Reclutamiento ATS y Crecimiento Profesional en el Perú",
  description:
    "Plataforma peruana de empleo, reclutamiento transparente, compatibilidad explicable, analizador de CV ATS, salarios en soles y desarrollo profesional.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#12336B",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const unreadCount = user
    ? await prisma.notification.count({ where: { userId: user.id, isRead: false } })
    : 0;

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[#2563EB] focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido principal
        </a>
        <Navbar initialUser={user} initialUnread={unreadCount} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <EmpleaBotWidget />
        <PwaRegister />
      </body>
    </html>
  );
}

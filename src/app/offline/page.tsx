import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <WifiOff className="mx-auto h-12 w-12 text-[#2563EB]" />
      <h1 className="mt-4 text-2xl font-extrabold text-[#12336B] dark:text-white">Sin conexión</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        No fue posible conectar con el servidor local de EmpleaPerú. Por seguridad, tus datos privados y CVs nunca se almacenan en caché offline.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white">
        Reintentar
      </Link>
    </div>
  );
}

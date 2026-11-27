import Link from "next/link";
import { HelpCircle, ShieldAlert } from "lucide-react";

const FAQS = [
  {
    q: "¿Cómo se calcula el porcentaje de compatibilidad con una vacante?",
    a: "EmpleaPerú utiliza un motor heurístico local 100% explicable: Habilidades (40%), Experiencia (25%), Formación (15%), Ubicación/Modalidad (10%) y Salario (10%). No es IA entrenada, no utiliza atributos protegidos y jamás genera rechazos automáticos.",
  },
  {
    q: "¿Quién puede ver o descargar mi CV?",
    a: "Tu CV se almacena fuera de la carpeta pública con nombre aleatorio. Solo tú, los reclutadores de empresas a las que postulaste y el administrador pueden descargarlo bajo verificación en servidor.",
  },
  {
    q: "¿La validación de RUC consulta directamente a SUNAT?",
    a: "No. Validamos matemáticamente el formato oficial de 11 dígitos (prefijo y dígito verificador módulo 11) y realizamos verificación manual administrativa. No afirmamos consulta en línea a SUNAT.",
  },
  {
    q: "¿Qué hago si veo una oferta que pide dinero o parece fraudulenta?",
    a: "Nunca realices pagos por entrevista, exámenes o trámites. Usa el botón 'Reportar aviso' en la oferta para enviarla inmediatamente a revisión humana.",
  },
  {
    q: "¿Cómo funcionan los planes empresariales en esta versión?",
    a: "Los planes Gratuito, Profesional y Empresarial aplican límites reales en la plataforma y utilizan una simulación explícita de suscripción local sin cobros ni tarjetas reales.",
  },
];

export default function AyudaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#12336B] dark:text-white">Centro de Ayuda y Preguntas Frecuentes</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Respuestas claras sobre postulaciones, privacidad, compatibilidad y seguridad antifraude.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((item) => (
          <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 font-bold text-[#12336B] dark:text-white">
              <HelpCircle className="h-4 w-4 text-[#2563EB]" /> {item.q}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="flex items-center gap-2 font-bold">
          <ShieldAlert className="h-4 w-4" /> Consejos antifraude para postulantes
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-xs">
          <li>Ninguna empresa formal debe exigir depósitos previos por Yape, Plin o transferencia para postular.</li>
          <li>Desconfía de promesas de altos ingresos diarios sin experiencia ni contrato formal.</li>
          <li>Prioriza empresas con insignia de verificación manual y utiliza la mensajería interna de EmpleaPerú.</li>
        </ul>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        ¿Necesitas más ayuda? Usa <strong>EmpleaBot</strong> en la esquina inferior derecha o{" "}
        <Link href="/contacto" className="font-semibold text-[#2563EB] hover:underline">
          escríbenos desde Contacto
        </Link>
        .
      </p>
    </div>
  );
}

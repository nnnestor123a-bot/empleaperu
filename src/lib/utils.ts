import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPen(amount?: number | null): string {
  if (amount == null) return "A convenir";
  return `S/ ${amount.toLocaleString("es-PE")}`;
}

export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  visible = true
): string {
  if (!visible) return "Confidencial";
  if (min && max) return `S/ ${min.toLocaleString("es-PE")} – S/ ${max.toLocaleString("es-PE")}`;
  if (min) return `Desde S/ ${min.toLocaleString("es-PE")}`;
  if (max) return `Hasta S/ ${max.toLocaleString("es-PE")}`;
  return "A convenir";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function relativeDateEs(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return "Hace minutos";
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 30) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const MODALITY_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  HIBRIDO: "Híbrido",
  REMOTO: "Remoto",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  PRACTICANTE: "Practicante / Sin exp.",
  JUNIOR: "Junior (1–2 años)",
  SEMI_SENIOR: "Semi-Senior (2–4 años)",
  SENIOR: "Senior (5+ años)",
  LIDER: "Líder / Jefatura",
};

export const CONTRACT_LABELS: Record<string, string> = {
  PLANILLA: "Planilla (indefinido)",
  LOCACION: "Locación de servicios",
  PRACTICAS: "Convenio de prácticas",
  TEMPORAL: "Plazo fijo / Temporal",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  ENVIADA: "Enviada",
  REVISION: "En revisión",
  PRESELECCION: "Preseleccionado",
  ENTREVISTA: "Entrevista",
  EVALUACION: "Evaluación",
  SELECCIONADO: "Seleccionado",
  NO_SELECCIONADO: "No seleccionado",
  RETIRADO: "Retirado",
};

export const APPLICATION_STATUS_ORDER = [
  "ENVIADA",
  "REVISION",
  "PRESELECCION",
  "ENTREVISTA",
  "EVALUACION",
  "SELECCIONADO",
  "NO_SELECCIONADO",
] as const;

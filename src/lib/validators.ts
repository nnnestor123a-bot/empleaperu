import { z } from "zod";

/**
 * Valida formato local de RUC peruano (11 dígitos, prefijo válido y dígito verificador módulo 11).
 * IMPORTANTE: Esta validación comprueba únicamente el formato matemático del RUC.
 * No realiza consultas en línea a SUNAT ni certifica estado activo/habido.
 */
export function validatePeruvianRucFormat(ruc: string): {
  valid: boolean;
  reason?: string;
} {
  const clean = ruc.trim();
  if (!/^\d{11}$/.test(clean)) {
    return { valid: false, reason: "El RUC debe tener exactamente 11 dígitos numéricos." };
  }
  const validPrefixes = ["10", "15", "16", "17", "20"];
  if (!validPrefixes.includes(clean.slice(0, 2))) {
    return {
      valid: false,
      reason: "Prefijo de RUC inválido (debe iniciar con 10, 15, 16, 17 o 20).",
    };
  }
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(clean[i]) * weights[i];
  }
  const remainder = sum % 11;
  const check = 11 - remainder;
  const expectedDigit = check === 10 ? 0 : check === 11 ? 1 : check;
  if (Number(clean[10]) !== expectedDigit) {
    return {
      valid: false,
      reason: "El dígito verificador del RUC no coincide con la fórmula estándar (validación local de formato).",
    };
  }
  return { valid: true };
}

export const registerSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre completo").max(100),
  email: z.string().email("Correo electrónico inválido").toLowerCase(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
  role: z.enum(["CANDIDATE", "COMPANY"]),
  phone: z.string().max(25).optional().default(""),
  consentAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Debes aceptar el consentimiento de tratamiento de datos (Ley 29733).",
    }),
  }),
  companyName: z.string().max(120).optional(),
  ruc: z.string().max(11).optional(),
  sector: z.string().max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Correo inválido").toLowerCase(),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const jobInputSchema = z.object({
  title: z.string().min(4, "Título mínimo de 4 caracteres").max(120),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().min(30, "Describe el puesto con al menos 30 caracteres").max(5000),
  responsibilities: z.string().min(15, "Indica las responsabilidades principales").max(3000),
  requirements: z.string().min(15, "Indica los requisitos del puesto").max(3000),
  benefits: z.string().max(2000).optional().default(""),
  department: z.string().min(2),
  province: z.string().optional().default(""),
  district: z.string().optional().default(""),
  salaryMinPen: z.coerce.number().int().min(0).max(100000).nullable().optional(),
  salaryMaxPen: z.coerce.number().int().min(0).max(150000).nullable().optional(),
  salaryVisible: z.boolean().optional().default(true),
  modality: z.enum(["PRESENCIAL", "HIBRIDO", "REMOTO"]),
  contractType: z.enum(["PLANILLA", "LOCACION", "PRACTICAS", "TEMPORAL"]),
  scheduleType: z.enum(["TIEMPO_COMPLETO", "MEDIO_TIEMPO", "POR_HORAS"]),
  experienceLevel: z.enum(["PRACTICANTE", "JUNIOR", "SEMI_SENIOR", "SENIOR", "LIDER"]),
  educationLevel: z.enum(["SECUNDARIA", "TECNICO", "UNIVERSITARIO", "POSGRADO"]),
  vacanciesCount: z.coerce.number().int().min(1).max(200).optional().default(1),
  isInternship: z.boolean().optional().default(false),
  internshipCareer: z.string().max(120).nullable().optional(),
  internshipCycle: z.string().max(60).nullable().optional(),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "ARCHIVED"]).optional().default("PUBLISHED"),
  skillNames: z.array(z.string().min(1).max(60)).optional().default([]),
});

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  resumeId: z.string().nullable().optional(),
  coverLetter: z.string().max(2000).optional().default(""),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(150),
  message: z.string().min(10).max(3000),
});

export const reviewSchema = z.object({
  companyId: z.string().min(1),
  environmentRating: z.coerce.number().int().min(1).max(5),
  growthRating: z.coerce.number().int().min(1).max(5),
  selectionRating: z.coerce.number().int().min(1).max(5),
  communicationRating: z.coerce.number().int().min(1).max(5),
  benefitsRating: z.coerce.number().int().min(1).max(5),
  pros: z.string().min(10, "Comparte al menos 10 caracteres en aspectos positivos").max(1000),
  cons: z.string().min(5, "Comparte oportunidades de mejora").max(1000),
});

export const reportSchema = z.object({
  targetType: z.enum(["JOB", "COMPANY", "REVIEW", "MESSAGE"]),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(120),
  details: z.string().max(1500).optional().default(""),
});

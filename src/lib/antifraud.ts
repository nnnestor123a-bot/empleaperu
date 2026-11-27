/**
 * Motor heurístico explicable antifraude.
 * Detecta señales de alerta para revisión humana; nunca realiza acusaciones automáticas.
 */

export interface AntifraudFlag {
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  advice: string;
}

export interface AntifraudAssessment {
  riskScore: number; // 0..100
  level: "BAJO" | "MEDIO" | "ALTO";
  requiresHumanReview: boolean;
  flags: AntifraudFlag[];
  disclaimer: string;
}

const MONEY_PATTERNS = [
  /dep[oó]sito\s+previo/i,
  /pago\s+por\s+(capacitaci[oó]n|inscripci[oó]n|examen|tr[aá]mite|uniforme|carnet)/i,
  /yape|plin\s+para\s+postular/i,
  /transferencia\s+para\s+(activar|reservar|ingresar)/i,
  /inversi[oó]n\s+inicial/i,
  /cuota\s+de\s+ingreso/i,
];

const SUSPICIOUS_LINK_PATTERNS = [
  /bit\.ly|tinyurl\.com|t\.me\/|wa\.me\/\d+.*pago/i,
  /gana\s+\d+\s*(soles|d[oó]lares)\s+al\s+d[ií]a\s+sin\s+experiencia/i,
  /trabajo\s+desde\s+casa\s+dando\s+likes/i,
];

export function evaluateJobAntifraud(input: {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  salaryMinPen?: number | null;
  salaryMaxPen?: number | null;
  companyVerified: boolean;
  isDuplicateTitleInCompany?: boolean;
}): AntifraudAssessment {
  const flags: AntifraudFlag[] = [];
  let riskScore = 0;
  const fullText = `${input.title} ${input.description} ${input.responsibilities} ${input.requirements}`;

  // 1. Money requests
  if (MONEY_PATTERNS.some((rx) => rx.test(fullText))) {
    riskScore += 45;
    flags.push({
      code: "SOLICITUD_DINERO",
      severity: "HIGH",
      message: "Se detectaron frases asociadas a posibles cobros previos o depósitos para postular.",
      advice: "Ninguna empresa formal debe exigir pagos por entrevista, examen o inscripción.",
    });
  }

  // 2. Suspicious links / unreal earnings claims
  if (SUSPICIOUS_LINK_PATTERNS.some((rx) => rx.test(fullText))) {
    riskScore += 35;
    flags.push({
      code: "ENLACE_O_PROMESA_SOSPECHOSA",
      severity: "HIGH",
      message: "Contiene enlaces acortados o promesas de ingresos rápidos fuera de mercado.",
      advice: "Verifica siempre el canal oficial de la empresa antes de compartir documentos.",
    });
  }

  // 3. Unverified company
  if (!input.companyVerified) {
    riskScore += 15;
    flags.push({
      code: "EMPRESA_NO_VERIFICADA",
      severity: "LOW",
      message: "La empresa aún se encuentra pendiente de verificación manual en EmpleaPerú.",
      advice: "Revisa el RUC, sitio web y perfil público antes de acudir a entrevistas presenciales.",
    });
  }

  // 4. Insufficient detail
  if (input.description.trim().length < 60 || input.requirements.trim().length < 25) {
    riskScore += 15;
    flags.push({
      code: "INFORMACION_INSUFICIENTE",
      severity: "MEDIUM",
      message: "La descripción o los requisitos del puesto son muy breves.",
      advice: "Solicita claridad sobre funciones, modalidad de contrato y razón social.",
    });
  }

  // 5. Duplicate title
  if (input.isDuplicateTitleInCompany) {
    riskScore += 15;
    flags.push({
      code: "POSIBLE_DUPLICADO",
      severity: "MEDIUM",
      message: "Existe otra vacante activa con el mismo título en esta empresa.",
      advice: "Confirma si se trata de una nueva convocatoria o un aviso duplicado.",
    });
  }

  // 6. Salary anomaly
  if (
    input.salaryMinPen &&
    input.salaryMaxPen &&
    input.salaryMaxPen > input.salaryMinPen * 4 &&
    input.salaryMaxPen > 15000
  ) {
    riskScore += 15;
    flags.push({
      code: "RANGO_SALARIAL_ATIPICO",
      severity: "LOW",
      message: "La banda salarial publicada tiene una amplitud inusualmente alta.",
      advice: "Confirma en entrevista si incluye comisiones variables o metas.",
    });
  }

  const clamped = Math.min(100, riskScore);
  const level = clamped >= 50 ? "ALTO" : clamped >= 25 ? "MEDIO" : "BAJO";

  return {
    riskScore: clamped,
    level,
    requiresHumanReview: clamped >= 35,
    flags,
    disclaimer:
      "Evaluación heurística orientativa para prevención de riesgos. Las alertas se envían a revisión humana y no constituyen una acusación automática.",
  };
}

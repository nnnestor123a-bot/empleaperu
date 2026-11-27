/**
 * Motor local explicable de compatibilidad candidato-vacante.
 * Reglas heurísticas deterministas (NO es IA entrenada ni rechaza automáticamente).
 * Jamás usa atributos protegidos (edad, género, etnia, estado civil, salud, etc.).
 *
 * Ponderaciones oficiales:
 * - Habilidades: 40%
 * - Experiencia: 25%
 * - Formación: 15%
 * - Ubicación / Modalidad: 10%
 * - Expectativa salarial: 10%
 */

export interface CandidateMatchInput {
  skills: string[];
  experienceYears: number;
  highestEducation: "SECUNDARIA" | "TECNICO" | "UNIVERSITARIO" | "POSGRADO" | null;
  department: string | null;
  preferredModality: string | null;
  expectedSalaryPen: number | null;
}

export interface JobMatchInput {
  skills: string[];
  experienceLevel: string;
  educationLevel: string;
  department: string;
  modality: string;
  salaryMinPen: number | null;
  salaryMaxPen: number | null;
}

export interface CompatibilityResult {
  totalScore: number; // 0..100
  engineType: "HEURISTICO_LOCAL_EXPLICABLE";
  disclaimer: string;
  breakdown: {
    skills: { score: number; max: 40; matched: string[]; missing: string[]; note: string };
    experience: { score: number; max: 25; note: string };
    education: { score: number; max: 15; note: string };
    locationModality: { score: number; max: 10; note: string };
    salary: { score: number; max: 10; note: string };
  };
  recommendations: string[];
}

const EXP_REQUIRED_YEARS: Record<string, number> = {
  PRACTICANTE: 0,
  JUNIOR: 1,
  SEMI_SENIOR: 2.5,
  SENIOR: 5,
  LIDER: 7,
};

const EDU_RANK: Record<string, number> = {
  SECUNDARIA: 1,
  TECNICO: 2,
  UNIVERSITARIO: 3,
  POSGRADO: 4,
};

function normalizeSkill(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function calculateCompatibility(
  candidate: CandidateMatchInput,
  job: JobMatchInput
): CompatibilityResult {
  const recommendations: string[] = [];

  // 1. Skills (40 pts)
  const candSkillsNorm = new Set(candidate.skills.map(normalizeSkill));
  const matched: string[] = [];
  const missing: string[] = [];

  let skillsScore = 24; // neutral baseline when job lists no specific skills
  let skillsNote = "La vacante no especificó habilidades estructuradas; se asignó puntaje neutral (60%).";

  if (job.skills.length > 0) {
    for (const js of job.skills) {
      if (candSkillsNorm.has(normalizeSkill(js))) {
        matched.push(js);
      } else {
        missing.push(js);
      }
    }
    if (candidate.skills.length === 0) {
      skillsScore = 10;
      skillsNote = "Aún no registras habilidades en tu perfil. Agrégalas para calcular coincidencias exactas.";
      recommendations.push("Completa tus habilidades técnicas y blandas en tu perfil para mejorar el emparejamiento.");
    } else {
      const ratio = matched.length / job.skills.length;
      skillsScore = Math.round(ratio * 40);
      skillsNote = `Coincides en ${matched.length} de ${job.skills.length} habilidades solicitadas.`;
      if (missing.length > 0) {
        recommendations.push(
          `Fortalece o agrega evidencia de: ${missing.slice(0, 4).join(", ")}.`
        );
      }
    }
  }

  // 2. Experience (25 pts)
  const reqYears = EXP_REQUIRED_YEARS[job.experienceLevel] ?? 2;
  let expScore = 25;
  let expNote = "";
  if (reqYears === 0) {
    expScore = 25;
    expNote = "Puesto orientado a practicantes o sin experiencia previa obligatoria.";
  } else if (candidate.experienceYears >= reqYears) {
    expScore = 25;
    expNote = `Tu experiencia estimada (${candidate.experienceYears.toFixed(1)} años) cumple el nivel requerido (${job.experienceLevel}).`;
  } else if (candidate.experienceYears === 0) {
    expScore = 8;
    expNote = `No registras experiencia laboral previa frente a ~${reqYears} años sugeridos.`;
    recommendations.push("Registra prácticas, proyectos académicos o experiencia freelance relevante.");
  } else {
    const ratio = Math.min(1, candidate.experienceYears / reqYears);
    expScore = Math.max(8, Math.round(ratio * 25));
    expNote = `Experiencia estimada (${candidate.experienceYears.toFixed(1)} años) parcialmente cercana al nivel ${job.experienceLevel} (~${reqYears} años).`;
  }

  // 3. Education (15 pts)
  const reqEduRank = EDU_RANK[job.educationLevel] ?? 2;
  const candEduRank = candidate.highestEducation ? EDU_RANK[candidate.highestEducation] ?? 0 : 0;
  let eduScore = 9;
  let eduNote = "";
  if (candEduRank === 0) {
    eduScore = 8;
    eduNote = "Sin formación registrada en el perfil (puntaje neutral por dato faltante).";
    recommendations.push("Añade tu formación técnica, universitaria o certificaciones en tu perfil.");
  } else if (candEduRank >= reqEduRank) {
    eduScore = 15;
    eduNote = `Tu formación (${candidate.highestEducation}) cumple o supera el nivel solicitado (${job.educationLevel}).`;
  } else {
    eduScore = Math.max(6, Math.round((candEduRank / reqEduRank) * 15));
    eduNote = `Formación registrada (${candidate.highestEducation}) por debajo del nivel preferido (${job.educationLevel}), evaluable según experiencia.`;
  }

  // 4. Location / Modality (10 pts)
  let locScore = 6;
  let locNote = "";
  if (job.modality === "REMOTO") {
    locScore = 10;
    locNote = "Vacante 100% remota, compatible desde cualquier departamento del Perú.";
  } else if (!candidate.department) {
    locScore = 6;
    locNote = "No indicaste tu departamento en el perfil (puntaje neutral).";
  } else if (candidate.department.toLowerCase() === job.department.toLowerCase()) {
    locScore =
      !candidate.preferredModality || candidate.preferredModality === job.modality ? 10 : 8;
    locNote = `Ubicación coincidente en ${job.department} (${job.modality}).`;
  } else {
    locScore = job.modality === "HIBRIDO" ? 5 : 3;
    locNote = `La vacante es ${job.modality.toLowerCase()} en ${job.department} y tu perfil indica ${candidate.department}.`;
  }

  // 5. Salary (10 pts)
  let salScore = 7;
  let salNote = "";
  if (!candidate.expectedSalaryPen || (!job.salaryMinPen && !job.salaryMaxPen)) {
    salScore = 7;
    salNote = "Expectativa o banda salarial no especificada; se asigna puntaje neutral (7/10).";
  } else {
    const min = job.salaryMinPen ?? job.salaryMaxPen ?? 0;
    const max = job.salaryMaxPen ?? Math.round(min * 1.25);
    if (candidate.expectedSalaryPen >= min && candidate.expectedSalaryPen <= max) {
      salScore = 10;
      salNote = `Tu expectativa (S/ ${candidate.expectedSalaryPen}) está dentro del rango ofrecido.`;
    } else if (candidate.expectedSalaryPen < min) {
      salScore = 10;
      salNote = `El rango ofrecido supera tu expectativa salarial (S/ ${candidate.expectedSalaryPen}).`;
    } else {
      const diffRatio = (candidate.expectedSalaryPen - max) / Math.max(1, max);
      salScore = diffRatio <= 0.15 ? 7 : diffRatio <= 0.35 ? 4 : 2;
      salNote = `Tu expectativa (S/ ${candidate.expectedSalaryPen}) supera el tope publicado (S/ ${max}).`;
    }
  }

  const totalScore = Math.min(
    100,
    Math.max(0, skillsScore + expScore + eduScore + locScore + salScore)
  );

  if (recommendations.length === 0) {
    recommendations.push("Tu perfil muestra una alineación sólida. Personaliza tu carta de presentación destacando logros medibles.");
  }

  return {
    totalScore,
    engineType: "HEURISTICO_LOCAL_EXPLICABLE",
    disclaimer:
      "Puntaje orientativo calculado por reglas locales ponderadas (no es IA entrenada ni genera rechazo automático; la decisión siempre es humana).",
    breakdown: {
      skills: { score: skillsScore, max: 40, matched, missing, note: skillsNote },
      experience: { score: expScore, max: 25, note: expNote },
      education: { score: eduScore, max: 15, note: eduNote },
      locationModality: { score: locScore, max: 10, note: locNote },
      salary: { score: salScore, max: 10, note: salNote },
    },
    recommendations,
  };
}

export function estimateExperienceYears(
  experiences: Array<{ startDate: string; endDate?: string | null; isCurrent?: boolean }>
): number {
  let totalMonths = 0;
  const now = new Date();
  for (const exp of experiences) {
    const start = new Date(exp.startDate.length === 7 ? `${exp.startDate}-01` : exp.startDate);
    if (Number.isNaN(start.getTime())) continue;
    const end =
      exp.isCurrent || !exp.endDate
        ? now
        : new Date(exp.endDate.length === 7 ? `${exp.endDate}-01` : exp.endDate);
    if (Number.isNaN(end.getTime())) continue;
    const months = Math.max(
      1,
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    );
    totalMonths += months;
  }
  return Math.round((totalMonths / 12) * 10) / 10;
}

export function inferHighestEducation(
  educations: Array<{ degree: string }>
): "SECUNDARIA" | "TECNICO" | "UNIVERSITARIO" | "POSGRADO" | null {
  if (educations.length === 0) return null;
  let maxRank = 0;
  let result: "SECUNDARIA" | "TECNICO" | "UNIVERSITARIO" | "POSGRADO" = "SECUNDARIA";
  for (const ed of educations) {
    const d = ed.degree.toLowerCase();
    let cur: "SECUNDARIA" | "TECNICO" | "UNIVERSITARIO" | "POSGRADO" = "SECUNDARIA";
    if (d.includes("maestr") || d.includes("posgrado") || d.includes("doctor") || d.includes("mba")) {
      cur = "POSGRADO";
    } else if (
      d.includes("bachiller") ||
      d.includes("ingenier") ||
      d.includes("licenciad") ||
      d.includes("universit") ||
      d.includes("titulad")
    ) {
      cur = "UNIVERSITARIO";
    } else if (d.includes("técnic") || d.includes("tecnic") || d.includes("instituto")) {
      cur = "TECNICO";
    }
    if (EDU_RANK[cur] > maxRank) {
      maxRank = EDU_RANK[cur];
      result = cur;
    }
  }
  return result;
}

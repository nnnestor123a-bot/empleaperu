export interface InterviewQuestion {
  id: string;
  role: string;
  sector: string;
  level: "PRACTICANTE" | "JUNIOR" | "SEMI_SENIOR" | "SENIOR";
  type: "TECNICA" | "CONDUCTUAL" | "SITUACIONAL";
  difficulty: "FACIL" | "MEDIA" | "ALTA";
  question: string;
  keyCriteria: string[];
  sampleOutline: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "iq-1",
    role: "Desarrollador Full Stack",
    sector: "Tecnología y Software",
    level: "SEMI_SENIOR",
    type: "TECNICA",
    difficulty: "MEDIA",
    question:
      "¿Cómo diseñarías una API REST segura y paginada para un portal con miles de vacantes concurrentes evitando consultas N+1?",
    keyCriteria: ["paginación", "índices", "validación", "autorización", "rendimiento"],
    sampleOutline:
      "Explica paginación por cursor o take/skip, índices compuestos en BD, consultas con include/select acotado, validación con Zod y verificación de permisos en servidor.",
  },
  {
    id: "iq-2",
    role: "Desarrollador Full Stack",
    sector: "Tecnología y Software",
    level: "JUNIOR",
    type: "CONDUCTUAL",
    difficulty: "FACIL",
    question:
      "Cuéntame sobre un error complejo que encontraste en un proyecto web y cómo lograste diagnosticarlo y resolverlo.",
    keyCriteria: ["situación", "diagnóstico", "acción", "resultado", "aprendizaje"],
    sampleOutline:
      "Usa el método STAR: describe el síntoma, cómo reprodujiste y aislaste el bug (logs, pruebas), el cambio aplicado y la métrica o prevención final.",
  },
  {
    id: "iq-3",
    role: "Analista de Datos / BI",
    sector: "Banca, Finanzas y Seguros",
    level: "SEMI_SENIOR",
    type: "TECNICA",
    difficulty: "MEDIA",
    question:
      "Si gerencia detecta una caída repentina del 18% en conversión comercial en un tablero de Power BI, ¿qué pasos seguirías para validar el dato y encontrar la causa raíz?",
    keyCriteria: ["calidad de datos", "segmentación", "sql", "hipótesis", "comunicación"],
    sampleOutline:
      "Verifica primero integridad del ETL/fuentes en SQL, segmenta por canal/región/producto, formula hipótesis contrastables y presenta hallazgos con recomendaciones claras.",
  },
  {
    id: "iq-4",
    role: "Ingeniero de Ciberseguridad",
    sector: "Tecnología y Software",
    level: "SENIOR",
    type: "SITUACIONAL",
    difficulty: "ALTA",
    question:
      "Un reclutador reporta que pudo descargar un CV de otra empresa cambiando un ID en la URL. ¿Cómo contienes el incidente y qué controles definitivos implementas?",
    keyCriteria: ["idor", "contención", "rbac", "auditoría", "pruebas"],
    sampleOutline:
      "Identifica el fallo como IDOR (OWASP A01), revoca accesos/sesiones comprometidas, implementa validación de pertenencia empresa-vacante en servidor, agrega pruebas automatizadas de aislamiento y registra el incidente.",
  },
  {
    id: "iq-5",
    role: "Analista de Administración y Finanzas",
    sector: "Retail y Consumo Masivo",
    level: "JUNIOR",
    type: "SITUACIONAL",
    difficulty: "MEDIA",
    question:
      "Al cierre de mes encuentras diferencias entre el registro de compras y las facturas electrónicas reportadas. ¿Cómo priorizas y resuelves el desfase?",
    keyCriteria: ["conciliación", "prioridad", "documentación", "sunat", "coordinación"],
    sampleOutline:
      "Ordena por materialidad, cruza comprobantes con proveedores y contabilidad, documenta cada ajuste y propone un control preventivo para el siguiente cierre.",
  },
  {
    id: "iq-6",
    role: "Técnico de Electricidad y Automatización",
    sector: "Minería y Energía",
    level: "SEMI_SENIOR",
    type: "TECNICA",
    difficulty: "MEDIA",
    question:
      "Describe tu protocolo de seguridad y diagnóstico ante la parada inesperada de un tablero con PLC en una línea de producción.",
    keyCriteria: ["bloqueo", "loto", "seguridad", "diagnóstico", "plc"],
    sampleOutline:
      "Aplica bloqueo y etiquetado (LOTO), verifica ausencia de tensión, revisa alarmas/entradas del PLC, inspecciona sensores/protecciones y documenta el restablecimiento.",
  },
  {
    id: "iq-7",
    role: "Practicante Preprofesional",
    sector: "Educación y Capacitación",
    level: "PRACTICANTE",
    type: "CONDUCTUAL",
    difficulty: "FACIL",
    question:
      "Cuando recibes dos tareas urgentes de distintas áreas con fechas cercanas y todavía estás aprendiendo el proceso, ¿cómo te organizas?",
    keyCriteria: ["priorización", "comunicación", "plazos", "iniciativa", "aprendizaje"],
    sampleOutline:
      "Valida el impacto y fecha real con tu supervisor, comunica expectativas a tiempo, divide las tareas en pasos concretos y pide retroalimentación temprana.",
  },
  {
    id: "iq-8",
    role: "Ejecutivo Comercial B2B",
    sector: "Telecomunicaciones",
    level: "SEMI_SENIOR",
    type: "SITUACIONAL",
    difficulty: "MEDIA",
    question:
      "Un cliente corporativo te dice que el servicio de la competencia cuesta 15% menos. ¿Cómo conduces la negociación sin recortar margen de inmediato?",
    keyCriteria: ["valor", "necesidades", "roi", "escucha", "propuesta"],
    sampleOutline:
      "Indaga el costo total de propiedad (soporte, SLA, tiempos), cuantifica el valor diferencial para su negocio y presenta opciones estructuradas antes de discutir descuentos.",
  },
];

export function evaluateInterviewAnswer(
  question: InterviewQuestion,
  answer: string
): {
  score: number;
  matchedCriteria: string[];
  missingCriteria: string[];
  feedback: string[];
  disclaimer: string;
} {
  const clean = answer.trim();
  const lower = clean
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const words = clean.split(/\s+/).filter(Boolean).length;

  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];

  for (const c of question.keyCriteria) {
    const norm = c
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(norm) || norm.split(" ").some((w) => w.length > 4 && lower.includes(w))) {
      matchedCriteria.push(c);
    } else {
      missingCriteria.push(c);
    }
  }

  let score = 0;
  // Criteria coverage (55%)
  score += Math.round((matchedCriteria.length / Math.max(1, question.keyCriteria.length)) * 55);
  // Structure & depth (30%)
  if (words >= 45 && words <= 260) score += 30;
  else if (words >= 20) score += 18;
  else score += 6;
  // Concrete action/result signals (15%)
  if (/\d+%?|logr[eé]|reduj|implement|verifiqu|med[ií]|primero|luego|finalmente/i.test(clean)) {
    score += 15;
  } else {
    score += 5;
  }

  const feedback: string[] = [];
  if (words < 25) {
    feedback.push("Tu respuesta es muy corta. Amplía con contexto, acciones específicas y el resultado obtenido.");
  } else {
    feedback.push(`Buena extensión (${words} palabras), fácil de seguir en una entrevista real.`);
  }
  if (matchedCriteria.length > 0) {
    feedback.push(`Cubriste conceptos clave esperados: ${matchedCriteria.join(", ")}.`);
  }
  if (missingCriteria.length > 0) {
    feedback.push(`Para fortalecer tu respuesta, aborda también: ${missingCriteria.join(", ")}.`);
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    matchedCriteria,
    missingCriteria,
    feedback,
    disclaimer:
      "Retroalimentación generada por criterios heurísticos locales (sin IA generativa externa activa).",
  };
}

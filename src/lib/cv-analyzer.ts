import mammoth from "mammoth";

export interface CvAnalysisResult {
  score: number; // 0..100
  readable: boolean;
  warning?: string;
  wordCount: number;
  detectedSections: string[];
  missingSections: string[];
  detectedSkills: string[];
  detectedEmails: string[];
  detectedPhones: string[];
  recommendations: string[];
  methodologyNote: string;
}

const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Docker",
  "AWS",
  "Azure",
  "Git",
  "HTML",
  "CSS",
  "Tailwind",
  "Excel",
  "Power BI",
  "SAP",
  "AutoCAD",
  "Scrum",
  "Agile",
  "Figma",
  "Inglés",
  "Ciberseguridad",
  "Redes",
  "Linux",
  "Contabilidad",
  "Ventas",
  "Marketing Digital",
  "SEO",
  "Atención al Cliente",
  "Liderazgo",
  "Trabajo en Equipo",
  "Comunicación",
  "Gestión de Proyectos",
  "PLC",
  "Electricidad Industrial",
];

export function sanitizeUtf8Text(input: string): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFD]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrae texto de PDF de forma local sin ejecutar contenido incrustado.
 * Si es un PDF escaneado (solo imagen), informa claramente que no es legible.
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];

  // Extract parenthesized literal strings inside BT...ET text blocks
  const textMatches = raw.match(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g) || [];
  for (const m of textMatches) {
    const inner = m
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .replace(/\u0000/g, "");
    if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]{2,}/.test(inner)) {
      chunks.push(inner);
    }
  }

  return sanitizeUtf8Text(chunks.join(" "));
}

export async function extractResumeText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ text: string; readable: boolean; warning?: string }> {
  const lower = fileName.toLowerCase();

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const res = await mammoth.extractRawText({ buffer });
      const text = (res.value || "").trim();
      if (text.length < 30) {
        return {
          text,
          readable: false,
          warning: "El archivo DOCX contiene muy poco texto legible. Verifica que no esté vacío o compuesto solo por imágenes.",
        };
      }
      return { text, readable: true };
    } catch {
      return {
        text: "",
        readable: false,
        warning: "No fue posible extraer texto del archivo DOCX. Verifica que no esté dañado.",
      };
    }
  }

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const text = extractTextFromPdfBuffer(buffer);
    if (text.length < 40) {
      return {
        text,
        readable: false,
        warning:
          "Este PDF parece estar escaneado como imagen o comprimido sin texto extraíble localmente. No inventamos contenido: súbelo como PDF con texto seleccionable, DOCX o usa nuestro Generador de CV ATS.",
      };
    }
    return { text, readable: true };
  }

  if (mimeType === "text/plain" || lower.endsWith(".txt")) {
    const text = buffer.toString("utf-8").trim();
    return { text, readable: text.length >= 20 };
  }

  return {
    text: "",
    readable: false,
    warning: "Formato no soportado para análisis automático. Usa PDF o DOCX.",
  };
}

export function analyzeCvText(text: string, readable = true, warning?: string): CvAnalysisResult {
  if (!readable || text.trim().length < 20) {
    return {
      score: 0,
      readable: false,
      warning:
        warning ||
        "No se pudo leer texto suficiente del CV. Si es un PDF escaneado, exporta tu documento con texto seleccionable o créalo con el Generador CV ATS.",
      wordCount: 0,
      detectedSections: [],
      missingSections: ["Resumen profesional", "Experiencia", "Formación", "Habilidades", "Contacto"],
      detectedSkills: [],
      detectedEmails: [],
      detectedPhones: [],
      recommendations: [
        "Exporta tu CV desde Word, Google Docs o el Generador CV ATS de EmpleaPerú para garantizar legibilidad ATS.",
      ],
      methodologyNote: "Análisis heurístico local (no ejecuta archivos ni inventa datos ausentes).",
    };
  }

  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const sectionRules: Array<{ name: string; pattern: RegExp }> = [
    { name: "Resumen profesional", pattern: /resumen|perfil|sobre m[ií]|objetivo/i },
    { name: "Experiencia", pattern: /experiencia|trayectoria|laboral|empleos|cargos/i },
    { name: "Formación", pattern: /educaci[oó]n|formaci[oó]n|estudios|universidad|instituto|bachiller/i },
    { name: "Habilidades", pattern: /habilidades|skills|competencias|tecnolog[ií]as|herramientas/i },
    { name: "Certificaciones", pattern: /certificaci[oó]n|certificados|cursos|diplomado/i },
    { name: "Idiomas", pattern: /idiomas|ingl[eé]s|quechua|portugu[eé]s/i },
  ];

  const detectedSections: string[] = [];
  const missingSections: string[] = [];
  for (const rule of sectionRules) {
    if (rule.pattern.test(text)) detectedSections.push(rule.name);
    else missingSections.push(rule.name);
  }

  const detectedSkills = KNOWN_SKILLS.filter((sk) =>
    lower.includes(sk.toLowerCase())
  );

  const detectedEmails = Array.from(
    new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
  );
  const detectedPhones = Array.from(
    new Set(text.match(/(?:\+?51\s?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}/g) || [])
  );

  // Quantified achievements check
  const hasMetrics = /\d+%|\bS\/\s?\d+|\+\d+|\d+\s*(años|meses|proyectos|clientes|usuarios)/i.test(text);

  let score = 0;
  // Structure (35 pts)
  score += Math.min(35, Math.round((detectedSections.length / sectionRules.length) * 35));
  // Contact info (15 pts)
  if (detectedEmails.length > 0) score += 10;
  if (detectedPhones.length > 0) score += 5;
  // Skills & keywords (25 pts)
  score += Math.min(25, detectedSkills.length * 4);
  // Length & readability (15 pts)
  if (wordCount >= 180 && wordCount <= 900) score += 15;
  else if (wordCount >= 80) score += 9;
  else score += 4;
  // Metrics & impact (10 pts)
  if (hasMetrics) score += 10;

  const recommendations: string[] = [];
  if (detectedEmails.length === 0) {
    recommendations.push("Agrega un correo electrónico profesional visible en el encabezado.");
  }
  if (detectedPhones.length === 0) {
    recommendations.push("Incluye un teléfono de contacto en formato peruano (+51 9XX XXX XXX).");
  }
  if (missingSections.length > 0) {
    recommendations.push(
      `Considera incorporar las secciones faltantes: ${missingSections.slice(0, 3).join(", ")}.`
    );
  }
  if (detectedSkills.length < 5) {
    recommendations.push("Incluye palabras clave técnicas y blandas explícitas acordes al puesto objetivo.");
  }
  if (!hasMetrics) {
    recommendations.push("Cuantifica logros con porcentajes, tiempos o resultados (ej. 'Reduje tiempos de respuesta en 25%').");
  }
  if (wordCount < 150) {
    recommendations.push("Tu CV es muy breve; detalla tus responsabilidades y logros clave en cada experiencia.");
  } else if (wordCount > 1000) {
    recommendations.push("Sintetiza tu CV para mantenerlo idealmente en 1 a 2 páginas escaneables por ATS.");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    readable: true,
    wordCount,
    detectedSections,
    missingSections,
    detectedSkills,
    detectedEmails,
    detectedPhones,
    recommendations,
    methodologyNote:
      "Puntaje orientativo 0–100 basado en estructura ATS (35%), palabras clave/habilidades (25%), contacto (15%), extensión (15%) y logros cuantificados (10%). Motor local determinista.",
  };
}

import { prisma } from "./prisma";

export interface BotReply {
  answer: string;
  mode: "REGLAS_LOCALES";
  suggestions: string[];
  links?: Array<{ label: string; href: string }>;
}

/**
 * EmpleaBot — Asistente local basado en reglas y consultas seguras a la BD.
 * Adaptador opcional Ollama/API desactivado por defecto (AI_ADAPTER_ENABLED=false).
 */
export async function handleEmpleaBotQuery(
  message: string,
  user?: { id: string; role: string; name: string; candidateProfileId?: string } | null
): Promise<BotReply> {
  const q = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Application status for logged-in candidate
  if ((q.includes("postulacion") || q.includes("estado") || q.includes("mis procesos")) && user?.candidateProfileId) {
    const apps = await prisma.application.findMany({
      where: { candidateId: user.candidateProfileId },
      include: { job: { select: { title: true, company: { select: { tradeName: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    });
    if (apps.length === 0) {
      return {
        answer: "Aún no tienes postulaciones registradas. Explora el buscador de empleos y postula con tu CV actualizado.",
        mode: "REGLAS_LOCALES",
        suggestions: ["Ver empleos remotos", "Analizar mi CV", "Explorar salarios"],
        links: [{ label: "Explorar empleos", href: "/empleos" }],
      };
    }
    const lines = apps
      .map((a) => `• ${a.job.title} (${a.job.company.tradeName}): ${a.status} — Compatibilidad ${a.compatibilityScore}%`)
      .join("\n");
    return {
      answer: `Aquí tienes el estado más reciente de tus postulaciones:\n${lines}`,
      mode: "REGLAS_LOCALES",
      suggestions: ["Preparar entrevista", "Mejorar mi perfil", "Ver ruta de carrera"],
      links: [{ label: "Ver timeline completo", href: "/postulante/postulaciones" }],
    };
  }

  // 2. Job search / remote / internships
  if (q.includes("empleo") || q.includes("vacante") || q.includes("trabajo") || q.includes("remoto") || q.includes("practica")) {
    const isRemote = q.includes("remoto");
    const isIntern = q.includes("practica");
    const jobs = await prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        ...(isRemote ? { modality: "REMOTO" } : {}),
        ...(isIntern ? { isInternship: true } : {}),
      },
      include: { company: { select: { tradeName: true } } },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 4,
    });
    const list = jobs
      .map((j) => `• ${j.title} en ${j.company.tradeName} (${j.department} · ${j.modality})`)
      .join("\n");
    return {
      answer: `Encontré estas vacantes activas en nuestra base local:\n${list || "Sin resultados exactos en este filtro."}\nPuedes filtrar por departamento, salario PEN y modalidad en el buscador.`,
      mode: "REGLAS_LOCALES",
      suggestions: ["¿Cómo funciona la compatibilidad?", "Simular entrevista", "Ver salarios en Perú"],
      links: [
        { label: isIntern ? "Ir al Hub de Prácticas" : "Abrir Buscador de Empleos", href: isIntern ? "/practicas" : "/empleos" },
      ],
    };
  }

  // 3. CV / Resume help
  if (q.includes("cv") || q.includes("curriculum") || q.includes("hoja de vida")) {
    return {
      answer:
        "En EmpleaPerú cuentas con dos herramientas locales para tu CV: (1) Analizador de CV (PDF/DOCX) que evalúa estructura ATS, palabras clave y logros en una escala explicable 0–100, y (2) Generador de CV ATS con plantillas limpias, importación desde tu perfil y exportación a PDF.",
      mode: "REGLAS_LOCALES",
      suggestions: ["¿Cómo mejorar mi compatibilidad?", "Practicar entrevista", "Evaluaciones técnicas"],
      links: [{ label: "Ir a mi Analizador y Generador de CV", href: "/postulante/cv" }],
    };
  }

  // 4. Interviews
  if (q.includes("entrevista") || q.includes("pregunta")) {
    return {
      answer:
        "Te recomiendo practicar en nuestro Simulador de Entrevistas con preguntas técnicas, conductuales y situacionales por puesto y nivel. Usa el método STAR (Situación, Tarea, Acción, Resultado) y cuantifica logros reales.",
      mode: "REGLAS_LOCALES",
      suggestions: ["Analizar mi CV", "Ver ruta de carrera", "Ver empleos activos"],
      links: [{ label: "Abrir Simulador de Entrevistas", href: "/postulante/entrevistas" }],
    };
  }

  // 5. Salaries
  if (q.includes("salario") || q.includes("sueldo") || q.includes("remuneracion")) {
    return {
      answer:
        "En el Explorador de Salarios calculamos promedios, medianas, rangos y tamaño de muestra directamente desde las vacantes en soles (PEN) de nuestra base de datos local, filtrable por departamento, experiencia y modalidad.",
      mode: "REGLAS_LOCALES",
      suggestions: ["Ver empleos en Lima", "Prácticas preprofesionales", "Mapa de empleos"],
      links: [{ label: "Ver Explorador de Salarios", href: "/salarios" }],
    };
  }

  // 6. Employers / publishing jobs / ATS / plans
  if (q.includes("publicar") || q.includes("empresa") || q.includes("ats") || q.includes("plan") || q.includes("reclut")) {
    return {
      answer:
        "Si representas a una empresa, crea una cuenta con rol Empresa (validamos formato de RUC de 11 dígitos), publica vacantes con verificación antifraude automática y gestiona candidatos en el ATS con tablero Kanban, notas internas, entrevistas y exportación CSV. Los planes (Gratuito, Profesional y Empresarial) cuentan con simulación explícita local.",
      mode: "REGLAS_LOCALES",
      suggestions: ["Ver planes empresariales", "Ir al panel de empresa", "Seguridad antifraude"],
      links: [
        { label: "Panel Empresa", href: "/empresa" },
        { label: "Ver Servicios y Planes", href: "/servicios" },
      ],
    };
  }

  // 7. Compatibility & fraud safety
  if (q.includes("compatibilidad") || q.includes("match") || q.includes("fraude") || q.includes("segur")) {
    return {
      answer:
        "Nuestra compatibilidad usa una fórmula local transparente: Habilidades 40%, Experiencia 25%, Formación 15%, Ubicación/Modalidad 10% y Salario 10%. Nunca usa atributos protegidos ni rechaza candidatos automáticamente. Además, el módulo antifraude alerta sobre cobros sospechosos o enlaces riesgosos para revisión humana.",
      mode: "REGLAS_LOCALES",
      suggestions: ["Ver empleos destacados", "Analizar mi CV", "Ver política de privacidad"],
      links: [
        { label: "Explorar empleos", href: "/empleos" },
        { label: "Privacidad (Ley 29733)", href: "/privacidad" },
      ],
    };
  }

  // Default welcome & navigation
  return {
    answer: `Hola${user?.name ? ` ${user.name.split(" ")[0]}` : ""}. Soy EmpleaBot (asistente local basado en reglas estructuradas). Puedo ayudarte a encontrar vacantes, revisar tu estado de postulación, mejorar tu CV ATS, preparar entrevistas, consultar salarios en soles o guiar la publicación de empleos para tu empresa.`,
    mode: "REGLAS_LOCALES",
    suggestions: [
      "Buscar empleos remotos",
      "¿Cómo mejorar mi CV?",
      "Ver salarios en Perú",
      "Publicar vacante como empresa",
    ],
    links: [
      { label: "Empleos", href: "/empleos" },
      { label: "Salarios", href: "/salarios" },
      { label: "Centro de ayuda", href: "/ayuda" },
    ],
  };
}

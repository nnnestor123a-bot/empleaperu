export interface CareerStep {
  id: string;
  title: string;
  priority: "ALTA" | "MEDIA" | "COMPLEMENTARIA";
  estimatedWeeks: number;
  skillsCovered: string[];
  description: string;
  suggestedAction: string;
}

export interface CareerRolePath {
  role: string;
  sector: string;
  targetSkills: string[];
  steps: CareerStep[];
}

export const CAREER_PATHS: CareerRolePath[] = [
  {
    role: "Desarrollador Full Stack",
    sector: "Tecnología y Software",
    targetSkills: ["TypeScript", "React", "Next.js", "Node.js", "SQL", "Git", "Docker", "AWS"],
    steps: [
      {
        id: "fs-1",
        title: "Fundamentos sólidos de TypeScript y React moderno",
        priority: "ALTA",
        estimatedWeeks: 4,
        skillsCovered: ["TypeScript", "React"],
        description: "Tipado estricto, manejo de estado, formularios accesibles y consumo de APIs.",
        suggestedAction: "Construye un proyecto CRUD completo y súbelo a tu Portafolio en EmpleaPerú.",
      },
      {
        id: "fs-2",
        title: "Backend seguro, SQL y modelado relacional",
        priority: "ALTA",
        estimatedWeeks: 4,
        skillsCovered: ["Node.js", "SQL", "Next.js"],
        description: "Autenticación, RBAC, validación con esquemas, índices y consultas optimizadas.",
        suggestedAction: "Aprueba la evaluación de Programación en el módulo de Evaluaciones.",
      },
      {
        id: "fs-3",
        title: "Contenedores, CI/CD y despliegue en nube",
        priority: "MEDIA",
        estimatedWeeks: 3,
        skillsCovered: ["Git", "Docker", "AWS"],
        description: "Flujos Git colaborativos, contenedores reproducibles y observabilidad básica.",
        suggestedAction: "Documenta la arquitectura y despliega una demo en tu repositorio público.",
      },
    ],
  },
  {
    role: "Analista de Datos & BI",
    sector: "Banca, Finanzas y Seguros",
    targetSkills: ["SQL", "Python", "Power BI", "Excel", "Comunicación", "Gestión de Proyectos"],
    steps: [
      {
        id: "bi-1",
        title: "Consultas analíticas avanzadas en SQL y Excel",
        priority: "ALTA",
        estimatedWeeks: 3,
        skillsCovered: ["SQL", "Excel"],
        description: "Joins, CTEs, funciones de ventana, tablas dinámicas y limpieza de datos.",
        suggestedAction: "Resuelve casos de KPI comerciales y añade métricas en tu CV.",
      },
      {
        id: "bi-2",
        title: "Visualización ejecutiva en Power BI y Python",
        priority: "ALTA",
        estimatedWeeks: 4,
        skillsCovered: ["Power BI", "Python"],
        description: "Modelado estrella, DAX, automatización de reportes y análisis exploratorio.",
        suggestedAction: "Publica un tablero de ejemplo en tu Portafolio profesional.",
      },
      {
        id: "bi-3",
        title: "Storytelling de datos para toma de decisiones",
        priority: "COMPLEMENTARIA",
        estimatedWeeks: 2,
        skillsCovered: ["Comunicación", "Gestión de Proyectos"],
        description: "Presentación clara de hallazgos, supuestos y recomendaciones a gerencia.",
        suggestedAction: "Practica preguntas situacionales de BI en el Simulador de Entrevistas.",
      },
    ],
  },
  {
    role: "Especialista en Ciberseguridad",
    sector: "Tecnología y Software",
    targetSkills: ["Ciberseguridad", "Redes", "Linux", "Python", "SQL", "Inglés"],
    steps: [
      {
        id: "sec-1",
        title: "Redes TCP/IP y administración de sistemas Linux",
        priority: "ALTA",
        estimatedWeeks: 4,
        skillsCovered: ["Redes", "Linux"],
        description: "Segmentación, firewalls, hardening, permisos y análisis de registros.",
        suggestedAction: "Completa la evaluación de Redes y Ciberseguridad en la plataforma.",
      },
      {
        id: "sec-2",
        title: "Seguridad de aplicaciones web (OWASP Top 10)",
        priority: "ALTA",
        estimatedWeeks: 4,
        skillsCovered: ["Ciberseguridad", "SQL"],
        description: "Prevención de IDOR, XSS, SQLi, gestión segura de sesiones y auditoría.",
        suggestedAction: "Documenta un informe de auditoría en entorno de laboratorio local.",
      },
      {
        id: "sec-3",
        title: "Automatización con Python e inglés técnico",
        priority: "MEDIA",
        estimatedWeeks: 3,
        skillsCovered: ["Python", "Inglés"],
        description: "Scripts de verificación, lectura de CVE y estándares internacionales.",
        suggestedAction: "Actualiza tus certificaciones y proyectos en tu perfil.",
      },
    ],
  },
  {
    role: "Ingeniero / Técnico de Automatización Industrial",
    sector: "Minería y Energía",
    targetSkills: ["PLC", "Electricidad Industrial", "AutoCAD", "Seguridad", "Excel", "Inglés"],
    steps: [
      {
        id: "aut-1",
        title: "Electricidad industrial y lectura de planos",
        priority: "ALTA",
        estimatedWeeks: 4,
        skillsCovered: ["Electricidad Industrial", "AutoCAD"],
        description: "Tableros de fuerza y control, normativas de seguridad eléctrica y LOTO.",
        suggestedAction: "Realiza la evaluación de Electricidad y Automatización.",
      },
      {
        id: "aut-2",
        title: "Programación PLC y diagnóstico de fallas",
        priority: "ALTA",
        estimatedWeeks: 5,
        skillsCovered: ["PLC", "Seguridad"],
        description: "Lógica ladder, sensores industriales, variadores y mantenimiento preventivo.",
        suggestedAction: "Registra tus prácticas o proyectos técnicos en tu Portafolio.",
      },
      {
        id: "aut-3",
        title: "Reportabilidad técnica e inglés operativo",
        priority: "COMPLEMENTARIA",
        estimatedWeeks: 3,
        skillsCovered: ["Excel", "Inglés"],
        description: "Indicadores MTBF/MTTR, manuales técnicos de fabricantes y reportes de turno.",
        suggestedAction: "Practica respuestas técnicas en el Simulador de Entrevistas.",
      },
    ],
  },
];

import { describe, expect, it } from "vitest";
import { validatePeruvianRucFormat } from "@/lib/validators";
import { calculateCompatibility, estimateExperienceYears, inferHighestEducation } from "@/lib/compatibility";
import { evaluateJobAntifraud } from "@/lib/antifraud";
import { analyzeCvText } from "@/lib/cv-analyzer";
import { evaluateInterviewAnswer, INTERVIEW_QUESTIONS } from "@/lib/interview-bank";
import { haversineKm } from "@/lib/peru-data";
import { getStorageBackend } from "@/lib/storage";

describe("Validación local de formato RUC peruano", () => {
  it("acepta RUCs con formato y dígito verificador válidos", () => {
    expect(validatePeruvianRucFormat("20100047218").valid).toBe(true); // BCP format check
    expect(validatePeruvianRucFormat("20601234514").valid).toBe(true);
  });

  it("rechaza RUCs con longitud, prefijo o dígito verificador incorrecto", () => {
    expect(validatePeruvianRucFormat("12345").valid).toBe(false);
    expect(validatePeruvianRucFormat("99100047218").valid).toBe(false);
    expect(validatePeruvianRucFormat("20100047219").valid).toBe(false);
  });
});

describe("Motor local explicable de compatibilidad (40/25/15/10/10)", () => {
  it("calcula puntaje alto cuando perfil y vacante coinciden plenamente", () => {
    const res = calculateCompatibility(
      {
        skills: ["TypeScript", "React", "SQL", "Node.js"],
        experienceYears: 4,
        highestEducation: "UNIVERSITARIO",
        department: "Lima",
        preferredModality: "HIBRIDO",
        expectedSalaryPen: 6000,
      },
      {
        skills: ["TypeScript", "React", "SQL"],
        experienceLevel: "SEMI_SENIOR",
        educationLevel: "UNIVERSITARIO",
        department: "Lima",
        modality: "HIBRIDO",
        salaryMinPen: 5500,
        salaryMaxPen: 7500,
      }
    );

    expect(res.totalScore).toBe(100);
    expect(res.breakdown.skills.score).toBe(40);
    expect(res.breakdown.skills.missing).toHaveLength(0);
    expect(res.engineType).toBe("HEURISTICO_LOCAL_EXPLICABLE");
  });

  it("maneja datos faltantes sin fallar ni generar rechazo automático", () => {
    const res = calculateCompatibility(
      {
        skills: [],
        experienceYears: 0,
        highestEducation: null,
        department: null,
        preferredModality: null,
        expectedSalaryPen: null,
      },
      {
        skills: ["Python", "SQL"],
        experienceLevel: "JUNIOR",
        educationLevel: "UNIVERSITARIO",
        department: "Arequipa",
        modality: "REMOTO",
        salaryMinPen: 3000,
        salaryMaxPen: 4500,
      }
    );

    expect(res.totalScore).toBeGreaterThan(0);
    expect(res.breakdown.locationModality.score).toBe(10); // remoto compatible
    expect(res.recommendations.length).toBeGreaterThan(0);
  });

  it("estima experiencia y nivel educativo correctamente", () => {
    const yrs = estimateExperienceYears([
      { startDate: "2022-01", endDate: "2024-01", isCurrent: false },
    ]);
    expect(yrs).toBe(2);
    expect(inferHighestEducation([{ degree: "Bachiller en Ingeniería" }])).toBe("UNIVERSITARIO");
    expect(inferHighestEducation([{ degree: "Maestría en Finanzas" }])).toBe("POSGRADO");
  });
});

describe("Motor antifraude explicable", () => {
  it("marca riesgo alto ante solicitud de pago previo o enlaces sospechosos", () => {
    const res = evaluateJobAntifraud({
      title: "Trabajo desde casa dando likes",
      description: "Gana 300 soles al día sin experiencia, realiza un depósito previo por inscripción en bit.ly/oferta.",
      responsibilities: "Corto",
      requirements: "Ninguno",
      companyVerified: false,
    });

    expect(res.level).toBe("ALTO");
    expect(res.requiresHumanReview).toBe(true);
    expect(res.flags.some((f) => f.code === "SOLICITUD_DINERO")).toBe(true);
  });

  it("asigna riesgo bajo a vacante formal verificada", () => {
    const res = evaluateJobAntifraud({
      title: "Desarrollador Full Stack Senior",
      description: "Buscamos ingeniero de software con experiencia en arquitecturas web modernas, pruebas automatizadas y despliegue continuo en nube.",
      responsibilities: "Diseñar APIs seguras, revisar código y mentorizar al equipo.",
      requirements: "Bachiller en Sistemas, 4 años en TypeScript, React y SQL.",
      salaryMinPen: 7000,
      salaryMaxPen: 9500,
      companyVerified: true,
    });

    expect(res.level).toBe("BAJO");
    expect(res.riskScore).toBe(0);
  });
});

describe("Analizador local de CV", () => {
  it("evalúa estructura ATS, habilidades y logros cuantificados", () => {
    const sample = `
      Camila Rojas | camila.rojas@example.pe | +51 987 654 321
      RESUMEN PROFESIONAL
      Ingeniera de software enfocada en sistemas web seguros.
      EXPERIENCIA LABORAL
      Desarrolladora Full Stack (3 años): Reduje los tiempos de respuesta API en 35% usando Next.js, TypeScript, React, Node.js, SQL y Docker.
      FORMACIÓN ACADÉMICA
      Universidad Nacional de Ingeniería - Bachiller en Ingeniería de Sistemas.
      HABILIDADES
      TypeScript, React, Next.js, Node.js, SQL, Git, Docker, Inglés, Scrum.
      CERTIFICACIONES
      Certificación en Seguridad Web.
    `;
    const res = analyzeCvText(sample, true);
    expect(res.readable).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.detectedEmails).toContain("camila.rojas@example.pe");
    expect(res.detectedSkills).toContain("TypeScript");
  });

  it("informa claramente cuando un PDF escaneado no es legible sin inventar datos", () => {
    const res = analyzeCvText("", false, "PDF escaneado sin texto.");
    expect(res.readable).toBe(false);
    expect(res.score).toBe(0);
    expect(res.warning).toContain("escaneado");
  });
});

describe("Simulador de entrevistas y geolocalización", () => {
  it("evalúa respuesta con criterios heurísticos", () => {
    const q = INTERVIEW_QUESTIONS[0];
    const res = evaluateInterviewAnswer(
      q,
      "Primero implementaría paginación por cursor e índices compuestos en SQL para mejorar el rendimiento, validación estricta con Zod y autorización RBAC en el servidor."
    );
    expect(res.score).toBeGreaterThanOrEqual(60);
    expect(res.matchedCriteria.length).toBeGreaterThan(2);
  });

  it("calcula distancia aproximada entre Lima y Arequipa", () => {
    const km = haversineKm(-12.0464, -77.0428, -16.409, -71.5375);
    expect(km).toBeGreaterThan(700);
    expect(km).toBeLessThan(900);
  });

  it("selecciona almacenamiento local o Supabase Storage según variables de entorno", () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(getStorageBackend()).toBe("LOCAL_DISK");

    process.env.SUPABASE_URL = "https://demo.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    expect(getStorageBackend()).toBe("SUPABASE_STORAGE");

    if (prevUrl) process.env.SUPABASE_URL = prevUrl;
    else delete process.env.SUPABASE_URL;
    if (prevKey) process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });
});

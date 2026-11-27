import { describe, expect, it, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { handleEmpleaBotQuery } from "@/lib/empleabot";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./dev.db" } },
});

describe("Integración con Base de Datos SQLite y EmpleaBot local", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("contiene el volumen mínimo de datos ficticios semilla", async () => {
    const [admins, companies, candidates, jobs, apps, assessments, fairs, plans] =
      await Promise.all([
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.company.count(),
        prisma.candidateProfile.count(),
        prisma.job.count(),
        prisma.application.count(),
        prisma.assessment.count(),
        prisma.jobFair.count(),
        prisma.plan.count(),
      ]);

    expect(admins).toBeGreaterThanOrEqual(1);
    expect(companies).toBeGreaterThanOrEqual(10);
    expect(candidates).toBeGreaterThanOrEqual(20);
    expect(jobs).toBeGreaterThanOrEqual(50);
    expect(apps).toBeGreaterThanOrEqual(100);
    expect(assessments).toBeGreaterThanOrEqual(9);
    expect(fairs).toBeGreaterThanOrEqual(3);
    expect(plans).toBe(3);
  });

  it("EmpleaBot responde consultas en modo reglas locales con datos reales de BD", async () => {
    const reply = await handleEmpleaBotQuery("Buscar empleos remotos en Perú");
    expect(reply.mode).toBe("REGLAS_LOCALES");
    expect(reply.answer.length).toBeGreaterThan(30);
    expect(reply.links?.some((l) => l.href === "/empleos")).toBe(true);
  });
});

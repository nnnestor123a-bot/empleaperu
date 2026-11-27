import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateCompatibility } from "../src/lib/compatibility";
import { evaluateJobAntifraud } from "../src/lib/antifraud";
import { getDepartmentCoords } from "../src/lib/peru-data";

const prisma = new PrismaClient();

function makeValidRuc(base10: string): string {
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(base10[i]) * weights[i];
  const check = 11 - (sum % 11);
  const digit = check === 10 ? 0 : check === 11 ? 1 : check;
  return `${base10}${digit}`;
}

async function main() {
  console.log("Sembrando base de datos local de EmpleaPerú (idempotente)...");

  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@empleaperu.local" },
  });
  if (existingAdmin) {
    const jobCount = await prisma.job.count();
    if (jobCount >= 50) {
      console.log("La base de datos ya cuenta con los datos iniciales completos. Seed omitido (idempotente).");
      return;
    }
  }

  const adminPassHash = await bcrypt.hash(
    process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_USER_PASSWORD || "Emplea2026!",
    10
  );
  const companyPassHash = await bcrypt.hash(
    process.env.DEMO_COMPANY_PASSWORD || process.env.DEMO_USER_PASSWORD || "Emplea2026!",
    10
  );
  const candidatePassHash = await bcrypt.hash(
    process.env.DEMO_CANDIDATE_PASSWORD || process.env.DEMO_USER_PASSWORD || "Emplea2026!",
    10
  );

  // 1. Plans
  const plansData = [
    {
      code: "FREE",
      name: "Plan Gratuito",
      pricePenMonthly: 0,
      maxActiveJobs: 3,
      maxFeaturedJobs: 0,
      maxRecruiters: 1,
      featuresJson: JSON.stringify([
        "Hasta 3 vacantes activas simultáneas",
        "1 reclutador autorizado",
        "ATS básico con gestión de estados",
        "Verificación manual de empresa",
      ]),
    },
    {
      code: "PRO",
      name: "Plan Profesional",
      pricePenMonthly: 199,
      maxActiveJobs: 15,
      maxFeaturedJobs: 3,
      maxRecruiters: 5,
      featuresJson: JSON.stringify([
        "Hasta 15 vacantes activas y 3 destacadas",
        "Hasta 5 reclutadores en equipo",
        "ATS Kanban completo, evaluaciones y exportación CSV",
        "Estadísticas avanzadas por vacante y canal",
      ]),
    },
    {
      code: "ENTERPRISE",
      name: "Plan Empresarial",
      pricePenMonthly: 499,
      maxActiveJobs: 100,
      maxFeaturedJobs: 15,
      maxRecruiters: 25,
      featuresJson: JSON.stringify([
        "Hasta 100 vacantes activas y 15 destacadas",
        "Hasta 25 reclutadores multiusuario",
        "Evaluaciones técnicas personalizadas + Ferias de empleo",
        "Soporte prioritario y reportes ejecutivos de conversión",
      ]),
    },
  ];

  const plans: Record<string, string> = {};
  for (const p of plansData) {
    const upserted = await prisma.plan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
    plans[p.code] = upserted.id;
  }

  // 2. Categories
  const categoriesData = [
    { name: "Tecnología y Sistemas", slug: "tecnologia-sistemas", icon: "Code2", description: "Desarrollo de software, cloud, datos y soporte TI." },
    { name: "Ingeniería y Minería", slug: "ingenieria-mineria", icon: "HardHat", description: "Ingeniería industrial, civil, minera, eléctrica y automatización." },
    { name: "Administración y Finanzas", slug: "administracion-finanzas", icon: "Calculator", description: "Contabilidad, finanzas corporativas, tesorería y gestión." },
    { name: "Ventas y Comercial", slug: "ventas-comercial", icon: "TrendingUp", description: "Ejecutivos B2B, cuentas clave, retail y expansión." },
    { name: "Marketing y Diseño", slug: "marketing-diseno", icon: "Palette", description: "UX/UI, marketing digital, branding y comunicación." },
    { name: "Logística y Operaciones", slug: "logistica-operaciones", icon: "Truck", description: "Cadena de suministro, almacenes, comercio exterior y despacho." },
    { name: "Salud y Bienestar", slug: "salud-bienestar", icon: "HeartPulse", description: "Enfermería, farmacia, nutrición y gestión clínica." },
    { name: "Prácticas y Egresados", slug: "practicas-egresados", icon: "GraduationCap", description: "Programas preprofesionales, profesionales y trainee." },
  ];

  const categoryIds: Record<string, string> = {};
  for (const c of categoriesData) {
    const row = await prisma.jobCategory.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    categoryIds[c.slug] = row.id;
  }

  // 3. Skills catalog
  const skillCatalog: Array<[string, string]> = [
    ["TypeScript", "TECHNICAL"], ["React", "TECHNICAL"], ["Next.js", "TECHNICAL"], ["Node.js", "TECHNICAL"],
    ["Python", "TECHNICAL"], ["SQL", "TECHNICAL"], ["Power BI", "TECHNICAL"], ["Excel", "TECHNICAL"],
    ["AWS", "TECHNICAL"], ["Docker", "TECHNICAL"], ["Git", "TECHNICAL"], ["Ciberseguridad", "TECHNICAL"],
    ["Redes", "TECHNICAL"], ["Linux", "TECHNICAL"], ["SAP", "TECHNICAL"], ["AutoCAD", "TECHNICAL"],
    ["PLC", "TECHNICAL"], ["Electricidad Industrial", "TECHNICAL"], ["Figma", "TECHNICAL"],
    ["Marketing Digital", "TECHNICAL"], ["Contabilidad", "TECHNICAL"], ["Ventas B2B", "TECHNICAL"],
    ["Logística", "TECHNICAL"], ["Scrum", "TECHNICAL"], ["Inglés", "LANGUAGE"],
    ["Comunicación", "SOFT"], ["Liderazgo", "SOFT"], ["Trabajo en Equipo", "SOFT"],
  ];

  const skillIds: Record<string, string> = {};
  for (const [name, category] of skillCatalog) {
    const row = await prisma.skill.upsert({
      where: { name },
      update: { category },
      create: { name, category },
    });
    skillIds[name] = row.id;
  }

  // 4. Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@empleaperu.local" },
    update: {},
    create: {
      email: "admin@empleaperu.local",
      passwordHash: adminPassHash,
      role: "ADMIN",
      name: "Administrador EmpleaPerú",
      phone: "+51 999 000 100",
      consentAcceptedAt: new Date(),
    },
  });

  // 5. 10 Peruvian Companies + 10 Recruiter Owners
  const companiesSpec = [
    {
      tradeName: "AndesCloud Tech",
      legalName: "AndesCloud Tecnologías S.A.C.",
      rucBase: "2060123451",
      sector: "Tecnología y Software",
      dept: "Lima",
      prov: "Lima",
      dist: "Miraflores",
      size: "MEDIANA",
      verified: true,
      featured: true,
      plan: "ENTERPRISE",
      email: "talento@andescloud.pe",
      website: "https://andescloud.example.pe",
      desc: "Consultora peruana de ingeniería de software, arquitectura cloud y productos digitales para banca y retail en Latinoamérica.",
    },
    {
      tradeName: "Banco Pacífico Digital",
      legalName: "Banco Pacífico Digital del Perú S.A.",
      rucBase: "2050442211",
      sector: "Banca, Finanzas y Seguros",
      dept: "Lima",
      prov: "Lima",
      dist: "San Isidro",
      size: "GRANDE",
      verified: true,
      featured: true,
      plan: "ENTERPRISE",
      email: "seleccion@bancopacifico.example.pe",
      website: "https://bancopacifico.example.pe",
      desc: "Entidad financiera orientada a inclusión digital, analítica avanzada y medios de pago inmediatos en todo el Perú.",
    },
    {
      tradeName: "Minera Sierra Sur",
      legalName: "Compañía Minera Sierra Sur S.A.A.",
      rucBase: "2040778891",
      sector: "Minería y Energía",
      dept: "Arequipa",
      prov: "Arequipa",
      dist: "Yanahuara",
      size: "GRANDE",
      verified: true,
      featured: true,
      plan: "PRO",
      email: "rrhh@sierrasur.example.pe",
      website: "https://sierrasur.example.pe",
      desc: "Operación minera responsable en el sur del país con enfoque en seguridad industrial, automatización y talento regional.",
    },
    {
      tradeName: "AgroNorte Export",
      legalName: "Agroindustrias del Norte Exportador S.A.C.",
      rucBase: "2055331122",
      sector: "Agroindustria",
      dept: "La Libertad",
      prov: "Trujillo",
      dist: "Trujillo",
      size: "GRANDE",
      verified: true,
      featured: true,
      plan: "PRO",
      email: "talento@agronorte.example.pe",
      website: "https://agronorte.example.pe",
      desc: "Producción y exportación de arándanos, paltas y espárragos con plantas certificadas en La Libertad y Piura.",
    },
    {
      tradeName: "LogiPerú Express",
      legalName: "Operador Logístico LogiPerú S.A.C.",
      rucBase: "2060887744",
      sector: "Logística y Transporte",
      dept: "Lima",
      prov: "Callao",
      dist: "Lima Cercado",
      size: "MEDIANA",
      verified: true,
      featured: false,
      plan: "PRO",
      email: "gestion@logiperu.example.pe",
      website: "https://logiperu.example.pe",
      desc: "Distribución nacional de última milla, almacenamiento inteligente y comercio exterior desde el Callao.",
    },
    {
      tradeName: "Kuska Retail Group",
      legalName: "Kuska Comercializadora S.A.",
      rucBase: "2051996633",
      sector: "Retail y Consumo Masivo",
      dept: "Lima",
      prov: "Lima",
      dist: "Santiago de Surco",
      size: "GRANDE",
      verified: true,
      featured: true,
      plan: "PRO",
      email: "empleos@kuskaretail.example.pe",
      website: "https://kuskaretail.example.pe",
      desc: "Cadena peruana omnicanal de mejoramiento del hogar y consumo con tiendas en 10 departamentos.",
    },
    {
      tradeName: "InkaSalud Clínicas",
      legalName: "Red de Salud InkaSalud S.A.C.",
      rucBase: "2054112299",
      sector: "Salud y Farmacéutica",
      dept: "Cusco",
      prov: "Cusco",
      dist: "Wanchaq",
      size: "MEDIANA",
      verified: true,
      featured: false,
      plan: "FREE",
      email: "talento@inkasalud.example.pe",
      website: "https://inkasalud.example.pe",
      desc: "Red de policlínicos y laboratorios clínicos con historia clínica electrónica en Cusco y sur andino.",
    },
    {
      tradeName: "NorteTel Conectividad",
      legalName: "NorteTel Telecomunicaciones S.A.C.",
      rucBase: "2060554433",
      sector: "Telecomunicaciones",
      dept: "Piura",
      prov: "Piura",
      dist: "Piura",
      size: "MEDIANA",
      verified: true,
      featured: false,
      plan: "PRO",
      email: "seleccion@nortetel.example.pe",
      website: "https://nortetel.example.pe",
      desc: "Despliegue de fibra óptica empresarial y soluciones de redes gestionadas para el norte del Perú.",
    },
    {
      tradeName: "Taller Creativo Qori",
      legalName: "Qori Diseño y Experiencia Digital E.I.R.L.",
      rucBase: "2060991188",
      sector: "Tecnología y Software",
      dept: "Lima",
      prov: "Lima",
      dist: "Barranco",
      size: "PEQUENA",
      verified: false,
      featured: false,
      plan: "FREE",
      email: "hola@qoricreativo.example.pe",
      website: "https://qoricreativo.example.pe",
      desc: "Estudio independiente de diseño de producto, sistemas de diseño y campañas digitales.",
    },
    {
      tradeName: "Constructora Valle Andino",
      legalName: "Constructora e Ingeniería Valle Andino S.A.C.",
      rucBase: "2053774466",
      sector: "Construcción e Ingeniería",
      dept: "Junín",
      prov: "Huancayo",
      dist: "El Tambo",
      size: "MEDIANA",
      verified: false,
      featured: false,
      plan: "FREE",
      email: "obras@valleandino.example.pe",
      website: "https://valleandino.example.pe",
      desc: "Infraestructura vial, edificaciones educativas y saneamiento en la sierra central del Perú.",
    },
  ];

  const createdCompanies: Array<{ id: string; tradeName: string; ownerUserId: string; dept: string; verified: boolean }> = [];

  for (let i = 0; i < companiesSpec.length; i++) {
    const spec = companiesSpec[i];
    const ruc = makeValidRuc(spec.rucBase);
    const ownerEmail = i === 0 ? "empresa@empleaperu.local" : `empresa${i + 1}@empleaperu.local`;

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        passwordHash: companyPassHash,
        role: "COMPANY",
        name: `Reclutador ${spec.tradeName}`,
        phone: `+51 987 100 ${String(100 + i)}`,
        consentAcceptedAt: new Date(),
      },
    });

    const company = await prisma.company.upsert({
      where: { ruc },
      update: {},
      create: {
        legalName: spec.legalName,
        tradeName: spec.tradeName,
        ruc,
        sector: spec.sector,
        description: spec.desc,
        department: spec.dept,
        province: spec.prov,
        district: spec.dist,
        website: spec.website,
        contactEmail: spec.email,
        contactPhone: `+51 01 440-${2000 + i}`,
        size: spec.size,
        verificationStatus: spec.verified ? "VERIFIED" : "PENDING",
        verifiedAt: spec.verified ? new Date() : null,
        isFeatured: spec.featured,
      },
    });

    await prisma.companyMember.upsert({
      where: { companyId_userId: { companyId: company.id, userId: owner.id } },
      update: {},
      create: { companyId: company.id, userId: owner.id, role: "OWNER" },
    });

    const existingSub = await prisma.subscription.findFirst({ where: { companyId: company.id } });
    if (!existingSub) {
      const sub = await prisma.subscription.create({
        data: {
          companyId: company.id,
          planId: plans[spec.plan],
          status: "ACTIVE",
        },
      });
      if (spec.plan !== "FREE") {
        const planRow = plansData.find((p) => p.code === spec.plan)!;
        await prisma.paymentSimulation.create({
          data: {
            subscriptionId: sub.id,
            companyId: company.id,
            amountPen: planRow.pricePenMonthly,
            method: "SIMULACION_LOCAL",
            referenceCode: `SIM-2026-${String(i + 1).padStart(4, "0")}`,
            status: "SIMULATED_PAID",
            isSimulated: true,
          },
        });
      }
    }

    createdCompanies.push({
      id: company.id,
      tradeName: company.tradeName,
      ownerUserId: owner.id,
      dept: spec.dept,
      verified: spec.verified,
    });
  }

  // 6. 20 Peruvian Candidates
  const candidateNames = [
    ["Camila Rojas Paredes", "Desarrolladora Full Stack TypeScript & React", "Lima", "Miraflores", 5800, "HIBRIDO", ["TypeScript", "React", "Next.js", "Node.js", "SQL", "Git", "Inglés"]],
    ["Mateo Quispe Huamán", "Analista de Datos & Business Intelligence", "Arequipa", "Yanahuara", 4800, "REMOTO", ["SQL", "Python", "Power BI", "Excel", "Comunicación"]],
    ["Valeria Torres Mendoza", "Diseñadora UX/UI & Design Systems", "Lima", "Barranco", 5200, "REMOTO", ["Figma", "React", "Comunicación", "Scrum", "Inglés"]],
    ["Diego Chávez Salazar", "Ingeniero de Ciberseguridad Junior", "Lima", "San Borja", 6200, "HIBRIDO", ["Ciberseguridad", "Redes", "Linux", "Python", "SQL"]],
    ["Lucía Fernández Vargas", "Contadora Pública & Analista Financiera", "La Libertad", "Trujillo", 4200, "PRESENCIAL", ["Contabilidad", "Excel", "SAP", "Power BI", "Comunicación"]],
    ["Sebastián Morales Cruz", "Técnico de Electricidad y Automatización PLC", "Arequipa", "Cayma", 3900, "PRESENCIAL", ["PLC", "Electricidad Industrial", "AutoCAD", "Trabajo en Equipo"]],
    ["Sofía Castillo Navarro", "Practicante de Ingeniería de Software (8vo ciclo)", "Lima", "Jesús María", 1600, "HIBRIDO", ["TypeScript", "React", "Git", "SQL", "Trabajo en Equipo"]],
    ["Gabriel Flores Aguilar", "Especialista en Logística y Cadena de Suministro", "Lima", "San Miguel", 4600, "PRESENCIAL", ["Logística", "SAP", "Excel", "Liderazgo"]],
    ["Andrea Gutiérrez Ramos", "Ejecutiva Comercial B2B Senior", "Lima", "Santiago de Surco", 5500, "HIBRIDO", ["Ventas B2B", "Comunicación", "Liderazgo", "Excel"]],
    ["Rodrigo Díaz León", "Ingeniero DevOps & Cloud AWS", "Lima", "San Isidro", 8200, "REMOTO", ["AWS", "Docker", "Linux", "Node.js", "Git", "Inglés"]],
    ["Fernanda Herrera Silva", "Analista de Marketing Digital y Performance", "Piura", "Piura", 3600, "REMOTO", ["Marketing Digital", "Excel", "Comunicación", "Figma"]],
    ["Joaquín Romero Vega", "Practicante de Administración y Finanzas", "Cusco", "Wanchaq", 1400, "PRESENCIAL", ["Excel", "Contabilidad", "Comunicación", "Trabajo en Equipo"]],
    ["Paula Medina Ortiz", "Desarrolladora Backend Node.js & Python", "Lima", "Lince", 6500, "REMOTO", ["Node.js", "Python", "SQL", "Docker", "Git"]],
    ["Alejandro Soto Pinedo", "Ingeniero de Redes y Telecomunicaciones", "Piura", "Castilla", 4900, "PRESENCIAL", ["Redes", "Linux", "Ciberseguridad", "Inglés"]],
    ["Daniela Campos Quispe", "Coordinadora de Operaciones Agroindustriales", "La Libertad", "Víctor Larco Herrera", 5100, "PRESENCIAL", ["Logística", "Excel", "Liderazgo", "Trabajo en Equipo"]],
    ["Martín Navarro Bravo", "Ingeniero Civil Residente de Obra", "Junín", "El Tambo", 6000, "PRESENCIAL", ["AutoCAD", "Liderazgo", "Excel", "Comunicación"]],
    ["Gabriela Espinoza Luna", "Enfermera Ocupacional & Gestión Clínica", "Cusco", "Cusco", 3800, "PRESENCIAL", ["Comunicación", "Trabajo en Equipo", "Excel"]],
    ["Renato Salazar Ponce", "Scrum Master & Project Manager TI", "Lima", "La Molina", 7500, "HIBRIDO", ["Scrum", "Liderazgo", "Comunicación", "Inglés", "SQL"]],
    ["Fiorella Benites Córdova", "Practicante de Diseño Gráfico y UX", "Lambayeque", "Chiclayo", 1500, "REMOTO", ["Figma", "Marketing Digital", "Comunicación"]],
    ["Luis Enrique Huerta", "Técnico de Soporte TI y Mesa de Ayuda", "Lima", "Los Olivos", 2600, "PRESENCIAL", ["Redes", "Linux", "Excel", "Comunicación"]],
  ] as const;

  const createdCandidates: Array<{
    userId: string;
    profileId: string;
    name: string;
    dept: string;
    modality: string;
    salary: number;
    skills: string[];
  }> = [];

  for (let i = 0; i < candidateNames.length; i++) {
    const [name, headline, dept, district, expectedSalary, modality, skills] = candidateNames[i];
    const email = i === 0 ? "postulante@empleaperu.local" : `postulante${i + 1}@empleaperu.local`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: candidatePassHash,
        role: "CANDIDATE",
        name,
        phone: `+51 945 200 ${String(100 + i)}`,
        consentAcceptedAt: new Date(),
      },
    });

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        headline,
        bio: `Profesional peruano enfocado en resultados medibles, aprendizaje continuo y colaboración multidisciplinaria en ${dept}.`,
        department: dept,
        province: dept,
        district,
        availability: i % 3 === 0 ? "INMEDIATA" : "15_DIAS",
        expectedSalaryPen: expectedSalary,
        preferredModality: modality,
        portfolioSlug: `perfil-${i + 1}-${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`,
        portfolioPublic: i < 8,
        completionPct: 85 + (i % 15),
        showEmail: true,
        showPhone: i % 2 === 0,
      },
    });

    for (const skName of skills) {
      const skId = skillIds[skName];
      if (skId) {
        await prisma.candidateSkill.upsert({
          where: { candidateId_skillId: { candidateId: profile.id, skillId: skId } },
          update: {},
          create: {
            candidateId: profile.id,
            skillId: skId,
            level: i % 2 === 0 ? "ADVANCED" : "INTERMEDIATE",
          },
        });
      }
    }

    const expCount = await prisma.workExperience.count({ where: { candidateId: profile.id } });
    if (expCount === 0) {
      await prisma.workExperience.create({
        data: {
          candidateId: profile.id,
          company: i % 2 === 0 ? "Soluciones Digitales Lima S.A.C." : "Corporación Andina de Servicios",
          title: headline.split("&")[0].trim(),
          startDate: i % 4 === 0 ? "2023-03" : "2021-06",
          isCurrent: true,
          description: "Participación en proyectos clave con mejoras documentadas de eficiencia y calidad de servicio.",
        },
      });
      await prisma.education.create({
        data: {
          candidateId: profile.id,
          institution:
            dept === "Arequipa"
              ? "Universidad Nacional de San Agustín (UNSA)"
              : dept === "La Libertad"
              ? "Universidad Nacional de Trujillo (UNT)"
              : i % 3 === 0
              ? "TECSUP"
              : "Universidad Nacional de Ingeniería (UNI)",
          degree: headline.includes("Técnico")
            ? "Técnico Titulado"
            : headline.includes("Practicante")
            ? "Estudiante Universitario"
            : "Bachiller Universitario",
          fieldOfStudy: headline.split(" ")[0] === "Contadora" ? "Contabilidad" : "Ingeniería y Tecnología",
          startYear: 2018,
          endYear: headline.includes("Practicante") ? null : 2023,
          inProgress: headline.includes("Practicante"),
        },
      });
      await prisma.portfolioItem.create({
        data: {
          candidateId: profile.id,
          title: `Proyecto destacado de ${headline.split(" ")[0]}`,
          description: "Caso práctico documentado con objetivos, arquitectura, resultados cuantificables y lecciones aprendidas.",
          category: "Proyecto Profesional",
          projectUrl: "https://empleaperu.local/demo-proyecto",
          repoUrl: "https://github.com/example/proyecto-demo",
          tags: skills.slice(0, 3).join(", "),
        },
      });
    }

    createdCandidates.push({
      userId: user.id,
      profileId: profile.id,
      name,
      dept,
      modality,
      salary: expectedSalary,
      skills: [...skills],
    });
  }

  // 7. 50 Diverse Peruvian Jobs
  const jobTemplates: Array<{
    title: string;
    cat: string;
    companyIdx: number;
    dept: string;
    dist: string;
    min: number;
    max: number;
    mod: "PRESENCIAL" | "HIBRIDO" | "REMOTO";
    contract: "PLANILLA" | "LOCACION" | "PRACTICAS" | "TEMPORAL";
    exp: "PRACTICANTE" | "JUNIOR" | "SEMI_SENIOR" | "SENIOR" | "LIDER";
    edu: "SECUNDARIA" | "TECNICO" | "UNIVERSITARIO" | "POSGRADO";
    skills: string[];
    featured?: boolean;
    intern?: boolean;
    career?: string;
    cycle?: string;
  }> = [
    { title: "Desarrollador Full Stack Next.js & TypeScript", cat: "tecnologia-sistemas", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 5500, max: 8000, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["TypeScript", "React", "Next.js", "Node.js", "SQL", "Git"], featured: true },
    { title: "Ingeniero de Datos Senior (Python & Cloud)", cat: "tecnologia-sistemas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 8500, max: 11500, mod: "HIBRIDO", contract: "PLANILLA", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["Python", "SQL", "AWS", "Power BI"], featured: true },
    { title: "Analista de Ciberseguridad SOC", cat: "tecnologia-sistemas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 6500, max: 9000, mod: "REMOTO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Ciberseguridad", "Redes", "Linux", "Python"], featured: true },
    { title: "Diseñador UX/UI de Producto Digital", cat: "marketing-diseno", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 4800, max: 6800, mod: "REMOTO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Figma", "Comunicación", "Scrum"], featured: true },
    { title: "Supervisor de Automatización y PLC", cat: "ingenieria-mineria", companyIdx: 2, dept: "Arequipa", dist: "Yanahuara", min: 6200, max: 8500, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["PLC", "Electricidad Industrial", "AutoCAD", "Liderazgo"], featured: true },
    { title: "Técnico de Mantenimiento Eléctrico Industrial", cat: "ingenieria-mineria", companyIdx: 2, dept: "Arequipa", dist: "Cerro Colorado", min: 3400, max: 4600, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "TECNICO", skills: ["Electricidad Industrial", "PLC", "Trabajo en Equipo"] },
    { title: "Practicante Preprofesional de Ingeniería de Sistemas", cat: "practicas-egresados", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 1300, max: 1700, mod: "HIBRIDO", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "UNIVERSITARIO", skills: ["TypeScript", "React", "Git", "SQL"], intern: true, career: "Ingeniería de Sistemas / Software", cycle: "7mo a 10mo ciclo", featured: true },
    { title: "Practicante Profesional de Business Intelligence", cat: "practicas-egresados", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 1800, max: 2300, mod: "HIBRIDO", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "UNIVERSITARIO", skills: ["SQL", "Power BI", "Excel"], intern: true, career: "Ingeniería Industrial / Estadística", cycle: "Egresado" },
    { title: "Jefe de Cadena de Suministro y Exportaciones", cat: "logistica-operaciones", companyIdx: 3, dept: "La Libertad", dist: "Trujillo", min: 6800, max: 9200, mod: "PRESENCIAL", contract: "PLANILLA", exp: "LIDER", edu: "UNIVERSITARIO", skills: ["Logística", "SAP", "Excel", "Liderazgo", "Inglés"], featured: true },
    { title: "Analista Contable Senior NIIF", cat: "administracion-finanzas", companyIdx: 5, dept: "Lima", dist: "Santiago de Surco", min: 4500, max: 6000, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Contabilidad", "SAP", "Excel"] },
    { title: "Desarrollador Frontend React (100% Remoto)", cat: "tecnologia-sistemas", companyIdx: 8, dept: "Lima", dist: "Barranco", min: 4200, max: 6000, mod: "REMOTO", contract: "PLANILLA", exp: "JUNIOR", edu: "TECNICO", skills: ["React", "TypeScript", "Git", "Figma"] },
    { title: "Arquitecto Cloud AWS & DevOps", cat: "tecnologia-sistemas", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 9500, max: 13000, mod: "REMOTO", contract: "PLANILLA", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["AWS", "Docker", "Linux", "Git", "Inglés"], featured: true },
    { title: "Ejecutivo de Ventas Corporativas B2B", cat: "ventas-comercial", companyIdx: 7, dept: "Piura", dist: "Piura", min: 3500, max: 5500, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Ventas B2B", "Comunicación", "Excel"] },
    { title: "Ingeniero de Redes y Fibra Óptica", cat: "tecnologia-sistemas", companyIdx: 7, dept: "Piura", dist: "Castilla", min: 4400, max: 5800, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Redes", "Linux", "Ciberseguridad"] },
    { title: "Coordinador de Distribución Nacional", cat: "logistica-operaciones", companyIdx: 4, dept: "Lima", dist: "Lima Cercado", min: 4000, max: 5400, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Logística", "Excel", "Liderazgo"] },
    { title: "Especialista en Marketing Digital & SEO", cat: "marketing-diseno", companyIdx: 5, dept: "Lima", dist: "Santiago de Surco", min: 3800, max: 5200, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Marketing Digital", "Excel", "Comunicación"] },
    { title: "Enfermero(a) de Salud Ocupacional", cat: "salud-bienestar", companyIdx: 6, dept: "Cusco", dist: "Wanchaq", min: 3200, max: 4200, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "UNIVERSITARIO", skills: ["Comunicación", "Trabajo en Equipo", "Excel"] },
    { title: "Ingeniero Civil Residente de Infraestructura", cat: "ingenieria-mineria", companyIdx: 9, dept: "Junín", dist: "El Tambo", min: 5800, max: 7800, mod: "PRESENCIAL", contract: "TEMPORAL", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["AutoCAD", "Liderazgo", "Excel"] },
    { title: "Scrum Master para Tribus Digitales", cat: "tecnologia-sistemas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 7000, max: 9500, mod: "HIBRIDO", contract: "PLANILLA", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["Scrum", "Liderazgo", "Comunicación", "Inglés"] },
    { title: "Analista de Tesorería y Flujo de Caja", cat: "administracion-finanzas", companyIdx: 3, dept: "La Libertad", dist: "Trujillo", min: 3600, max: 4800, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "UNIVERSITARIO", skills: ["Contabilidad", "Excel", "SAP"] },
    { title: "Practicante de Diseño UX/UI (Remoto)", cat: "practicas-egresados", companyIdx: 8, dept: "Lima", dist: "Barranco", min: 1200, max: 1500, mod: "REMOTO", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "TECNICO", skills: ["Figma", "Marketing Digital", "Comunicación"], intern: true, career: "Diseño Gráfico / Comunicaciones", cycle: "Últimos ciclos" },
    { title: "Practicante de Ingeniería Industrial - Operaciones", cat: "practicas-egresados", companyIdx: 4, dept: "Lima", dist: "Lima Cercado", min: 1300, max: 1650, mod: "PRESENCIAL", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "UNIVERSITARIO", skills: ["Excel", "Logística", "Power BI"], intern: true, career: "Ingeniería Industrial", cycle: "8vo a 10mo ciclo" },
    { title: "Desarrollador Backend Python / FastAPI", cat: "tecnologia-sistemas", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 6000, max: 8400, mod: "REMOTO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Python", "SQL", "Docker", "Git"] },
    { title: "Analista de Planeamiento Financiero FP&A", cat: "administracion-finanzas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 5500, max: 7200, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Excel", "Power BI", "Contabilidad", "SQL"] },
    { title: "Jefe de Tienda Retail Omnicanal", cat: "ventas-comercial", companyIdx: 5, dept: "Arequipa", dist: "Cayma", min: 4200, max: 5600, mod: "PRESENCIAL", contract: "PLANILLA", exp: "LIDER", edu: "UNIVERSITARIO", skills: ["Ventas B2B", "Liderazgo", "Excel"] },
    { title: "Técnico de Soporte TI y Redes", cat: "tecnologia-sistemas", companyIdx: 6, dept: "Cusco", dist: "Cusco", min: 2400, max: 3200, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "TECNICO", skills: ["Redes", "Linux", "Comunicación"] },
    { title: "Ingeniero de Seguridad y Salud en el Trabajo (SSOMA)", cat: "ingenieria-mineria", companyIdx: 2, dept: "Arequipa", dist: "Yanahuara", min: 5200, max: 7000, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Liderazgo", "Comunicación", "Excel"] },
    { title: "Especialista en Compras y Abastecimiento", cat: "logistica-operaciones", companyIdx: 5, dept: "Lima", dist: "Santiago de Surco", min: 4300, max: 5700, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Logística", "SAP", "Excel", "Comunicación"] },
    { title: "Desarrollador Node.js & Microservicios", cat: "tecnologia-sistemas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 7000, max: 9500, mod: "REMOTO", contract: "PLANILLA", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["Node.js", "TypeScript", "Docker", "AWS", "SQL"] },
    { title: "Analista de Calidad de Software (QA Automation)", cat: "tecnologia-sistemas", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 4600, max: 6400, mod: "REMOTO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["TypeScript", "Git", "SQL", "Scrum"] },
    { title: "Practicante de Contabilidad y Tributación", cat: "practicas-egresados", companyIdx: 3, dept: "La Libertad", dist: "Trujillo", min: 1150, max: 1450, mod: "PRESENCIAL", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "UNIVERSITARIO", skills: ["Contabilidad", "Excel"], intern: true, career: "Contabilidad", cycle: "7mo a 10mo ciclo" },
    { title: "Practicante de Electricidad Industrial", cat: "practicas-egresados", companyIdx: 2, dept: "Arequipa", dist: "Arequipa", min: 1400, max: 1800, mod: "PRESENCIAL", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "TECNICO", skills: ["Electricidad Industrial", "PLC", "AutoCAD"], intern: true, career: "Electrotecnia / Automatización", cycle: "Egresado técnico" },
    { title: "Key Account Manager - Telecomunicaciones", cat: "ventas-comercial", companyIdx: 7, dept: "Lambayeque", dist: "Chiclayo", min: 4500, max: 6500, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Ventas B2B", "Comunicación", "Liderazgo"] },
    { title: "Coordinador de Almacén e Inventarios", cat: "logistica-operaciones", companyIdx: 4, dept: "Ica", dist: "Pisco", min: 3300, max: 4300, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "TECNICO", skills: ["Logística", "Excel", "SAP"] },
    { title: "Químico Farmacéutico Regente", cat: "salud-bienestar", companyIdx: 6, dept: "Cusco", dist: "Wanchaq", min: 3800, max: 5000, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Liderazgo", "Comunicación", "Excel"] },
    { title: "Analista BI & Reportería Comercial", cat: "administracion-finanzas", companyIdx: 5, dept: "Lima", dist: "Santiago de Surco", min: 4400, max: 6000, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Power BI", "SQL", "Excel"] },
    { title: "Ingeniero de Planta Agroindustrial", cat: "ingenieria-mineria", companyIdx: 3, dept: "Piura", dist: "Sullana", min: 5000, max: 6800, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Liderazgo", "Excel", "Trabajo en Equipo"] },
    { title: "Administrador de Base de Datos SQL & Linux", cat: "tecnologia-sistemas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 6500, max: 8800, mod: "HIBRIDO", contract: "PLANILLA", exp: "SENIOR", edu: "UNIVERSITARIO", skills: ["SQL", "Linux", "AWS", "Ciberseguridad"] },
    { title: "Asistente Administrativo y Facturación", cat: "administracion-finanzas", companyIdx: 9, dept: "Junín", dist: "Huancayo", min: 2000, max: 2700, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "TECNICO", skills: ["Excel", "Contabilidad", "Comunicación"] },
    { title: "Community Manager & Contenidos", cat: "marketing-diseno", companyIdx: 8, dept: "Lima", dist: "Barranco", min: 2600, max: 3600, mod: "REMOTO", contract: "LOCACION", exp: "JUNIOR", edu: "UNIVERSITARIO", skills: ["Marketing Digital", "Figma", "Comunicación"] },
    { title: "Ingeniero de Costos y Presupuestos", cat: "ingenieria-mineria", companyIdx: 9, dept: "Áncash", dist: "Huaraz", min: 4800, max: 6400, mod: "PRESENCIAL", contract: "TEMPORAL", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["AutoCAD", "Excel", "Comunicación"] },
    { title: "Asesor Comercial de Campo - Norte", cat: "ventas-comercial", companyIdx: 3, dept: "Cajamarca", dist: "Cajamarca", min: 2500, max: 3800, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "TECNICO", skills: ["Ventas B2B", "Comunicación", "Trabajo en Equipo"] },
    { title: "Practicante de Marketing Digital", cat: "practicas-egresados", companyIdx: 5, dept: "Lima", dist: "Santiago de Surco", min: 1200, max: 1500, mod: "HIBRIDO", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "UNIVERSITARIO", skills: ["Marketing Digital", "Excel", "Comunicación"], intern: true, career: "Marketing / Administración", cycle: "8vo a 10mo ciclo" },
    { title: "Practicante de Redes y Soporte TI", cat: "practicas-egresados", companyIdx: 7, dept: "Piura", dist: "Piura", min: 1200, max: 1500, mod: "PRESENCIAL", contract: "PRACTICAS", exp: "PRACTICANTE", edu: "TECNICO", skills: ["Redes", "Linux"], intern: true, career: "Redes y Comunicaciones", cycle: "5to a 6to ciclo" },
    { title: "Especialista en Comercio Exterior y Aduanas", cat: "logistica-operaciones", companyIdx: 4, dept: "Tacna", dist: "Tacna", min: 3800, max: 5100, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Logística", "Excel", "Inglés"] },
    { title: "Product Manager Digital", cat: "tecnologia-sistemas", companyIdx: 0, dept: "Lima", dist: "Miraflores", min: 8000, max: 11000, mod: "HIBRIDO", contract: "PLANILLA", exp: "LIDER", edu: "UNIVERSITARIO", skills: ["Scrum", "Liderazgo", "Comunicación", "SQL", "Figma"] },
    { title: "Técnico de Laboratorio Clínico", cat: "salud-bienestar", companyIdx: 6, dept: "Loreto", dist: "Iquitos", min: 2600, max: 3500, mod: "PRESENCIAL", contract: "PLANILLA", exp: "JUNIOR", edu: "TECNICO", skills: ["Trabajo en Equipo", "Comunicación"] },
    { title: "Desarrollador Full Stack Junior (React/Node)", cat: "tecnologia-sistemas", companyIdx: 0, dept: "Arequipa", dist: "Arequipa", min: 3500, max: 4800, mod: "REMOTO", contract: "PLANILLA", exp: "JUNIOR", edu: "UNIVERSITARIO", skills: ["React", "Node.js", "TypeScript", "Git", "SQL"] },
    { title: "Analista de Riesgos Operacionales", cat: "administracion-finanzas", companyIdx: 1, dept: "Lima", dist: "San Isidro", min: 5200, max: 6900, mod: "HIBRIDO", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "UNIVERSITARIO", skills: ["Excel", "Power BI", "SQL", "Comunicación"] },
    { title: "Supervisor de Seguridad Electrónica y Redes", cat: "ingenieria-mineria", companyIdx: 2, dept: "Cusco", dist: "San Sebastián", min: 4300, max: 5700, mod: "PRESENCIAL", contract: "PLANILLA", exp: "SEMI_SENIOR", edu: "TECNICO", skills: ["Redes", "Electricidad Industrial", "Liderazgo"] },
  ];

  const createdJobs: Array<{
    id: string;
    title: string;
    companyId: string;
    dept: string;
    modality: string;
    exp: string;
    edu: string;
    min: number;
    max: number;
    skills: string[];
  }> = [];

  for (let i = 0; i < jobTemplates.length; i++) {
    const jt = jobTemplates[i];
    const company = createdCompanies[jt.companyIdx];
    const slug = `vacante-${i + 1}-${jt.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;

    const coords = getDepartmentCoords(jt.dept);
    const description = `En ${company.tradeName} buscamos un(a) ${jt.title} para fortalecer nuestro equipo en ${jt.dept} bajo modalidad ${jt.mod.toLowerCase()}. Ofrecemos un entorno profesional colaborativo, retos reales y línea de carrera.`;
    const responsibilities = `• Ejecutar y optimizar procesos clave del rol de ${jt.title}.\n• Coordinar entregables con equipos multidisciplinarios asegurando estándares de calidad.\n• Reportar indicadores de desempeño y proponer mejoras continuas documentadas.`;
    const requirements = `• Formación acorde al nivel ${jt.edu.toLowerCase()} y experiencia nivel ${jt.exp.toLowerCase()}.\n• Manejo comprobable de: ${jt.skills.join(", ")}.\n• Orientación a resultados, comunicación clara y ética profesional.`;
    const benefits = `• Ingreso formal bajo ${jt.contract.toLowerCase()} con beneficios de ley.\n• Capacitación continua y evaluaciones periódicas de desempeño.\n• Seguro complementario y bono por cumplimiento de objetivos.`;

    const fraud = evaluateJobAntifraud({
      title: jt.title,
      description,
      responsibilities,
      requirements,
      salaryMinPen: jt.min,
      salaryMaxPen: jt.max,
      companyVerified: company.verified,
    });

    const publishedAt = new Date(Date.now() - (i % 25) * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + (30 + (i % 30)) * 24 * 60 * 60 * 1000);

    const job = await prisma.job.upsert({
      where: { slug },
      update: {},
      create: {
        companyId: company.id,
        categoryId: categoryIds[jt.cat],
        title: jt.title,
        slug,
        description,
        responsibilities,
        requirements,
        benefits,
        department: jt.dept,
        province: jt.dept,
        district: jt.dist,
        latitude: coords.lat + ((i % 7) - 3) * 0.012,
        longitude: coords.lng + ((i % 5) - 2) * 0.012,
        salaryMinPen: jt.min,
        salaryMaxPen: jt.max,
        salaryVisible: true,
        modality: jt.mod,
        contractType: jt.contract,
        scheduleType: jt.intern ? "MEDIO_TIEMPO" : "TIEMPO_COMPLETO",
        experienceLevel: jt.exp,
        educationLevel: jt.edu,
        vacanciesCount: (i % 3) + 1,
        isInternship: Boolean(jt.intern),
        internshipCareer: jt.career ?? null,
        internshipCycle: jt.cycle ?? null,
        isFeatured: Boolean(jt.featured),
        status: "PUBLISHED",
        fraudRiskScore: fraud.riskScore,
        fraudFlagsJson: JSON.stringify(fraud.flags),
        publishedAt,
        expiresAt,
      },
    });

    for (const skName of jt.skills) {
      const skId = skillIds[skName];
      if (skId) {
        await prisma.jobSkill.upsert({
          where: { jobId_skillId: { jobId: job.id, skillId: skId } },
          update: {},
          create: { jobId: job.id, skillId: skId, required: true, weight: 1 },
        });
      }
    }

    createdJobs.push({
      id: job.id,
      title: job.title,
      companyId: company.id,
      dept: jt.dept,
      modality: jt.mod,
      exp: jt.exp,
      edu: jt.edu,
      min: jt.min,
      max: jt.max,
      skills: jt.skills,
    });
  }

  // 8. 100 Applications with history, compatibility scores, interviews & messages
  const statuses = [
    "ENVIADA",
    "REVISION",
    "PRESELECCION",
    "ENTREVISTA",
    "EVALUACION",
    "SELECCIONADO",
    "NO_SELECCIONADO",
  ];

  const existingApps = await prisma.application.count();
  if (existingApps < 100) {
    let createdAppCount = existingApps;
    for (let cIdx = 0; cIdx < createdCandidates.length && createdAppCount < 100; cIdx++) {
      const cand = createdCandidates[cIdx];
      for (let offset = 0; offset < 5 && createdAppCount < 100; offset++) {
        const jIdx = (cIdx * 2 + offset * 3) % createdJobs.length;
        const job = createdJobs[jIdx];
        const exists = await prisma.application.findUnique({
          where: { jobId_candidateId: { jobId: job.id, candidateId: cand.profileId } },
        });
        if (exists) continue;

        const compat = calculateCompatibility(
          {
            skills: cand.skills,
            experienceYears: cIdx % 4 === 0 ? 1.5 : 3.5,
            highestEducation: "UNIVERSITARIO",
            department: cand.dept,
            preferredModality: cand.modality,
            expectedSalaryPen: cand.salary,
          },
          {
            skills: job.skills,
            experienceLevel: job.exp,
            educationLevel: job.edu,
            department: job.dept,
            modality: job.modality,
            salaryMinPen: job.min,
            salaryMaxPen: job.max,
          }
        );

        const targetStatus = statuses[(createdAppCount + offset) % statuses.length];
        const createdAt = new Date(Date.now() - (createdAppCount % 60) * 24 * 60 * 60 * 1000);

        const app = await prisma.application.create({
          data: {
            jobId: job.id,
            candidateId: cand.profileId,
            coverLetter: `Estimado equipo, me entusiasma postular a ${job.title}. Cuento con experiencia relevante en ${cand.skills.slice(0, 3).join(", ")} y disponibilidad inmediata para aportar valor.`,
            status: targetStatus,
            compatibilityScore: compat.totalScore,
            compatibilityBreakdownJson: JSON.stringify(compat),
            internalNotes: targetStatus === "PRESELECCION" || targetStatus === "ENTREVISTA" ? "Perfil alineado a los requisitos técnicos del área." : "",
            recruiterRating: targetStatus === "SELECCIONADO" ? 5 : targetStatus === "ENTREVISTA" ? 4 : null,
            createdAt,
          },
        });

        await prisma.applicationHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: null,
            toStatus: "ENVIADA",
            note: "Postulación registrada en EmpleaPerú.",
            actorId: cand.userId,
            createdAt,
          },
        });

        if (targetStatus !== "ENVIADA") {
          await prisma.applicationHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: "ENVIADA",
              toStatus: targetStatus,
              note: `Actualización de etapa a ${targetStatus} por equipo de selección.`,
              actorId: admin.id,
              createdAt: new Date(createdAt.getTime() + 48 * 3600 * 1000),
            },
          });
        }

        if (targetStatus === "ENTREVISTA" || targetStatus === "EVALUACION" || targetStatus === "SELECCIONADO") {
          await prisma.interview.create({
            data: {
              applicationId: app.id,
              scheduledAt: new Date(Date.now() + ((createdAppCount % 7) + 1) * 24 * 3600 * 1000),
              durationMin: 45,
              modality: "VIRTUAL",
              locationOrLink: "https://meet.empleaperu.local/sala-entrevista",
              notes: "Entrevista técnica y revisión de experiencia práctica.",
              status: targetStatus === "SELECCIONADO" ? "COMPLETADA" : "PROGRAMADA",
            },
          });
        }

        // Seed some conversations & notifications
        if (createdAppCount < 12) {
          const comp = createdCompanies.find((c) => c.id === job.companyId)!;
          const conv = await prisma.conversation.create({
            data: {
              applicationId: app.id,
              candidateId: cand.profileId,
              companyId: job.companyId,
            },
          });
          await prisma.message.createMany({
            data: [
              {
                conversationId: conv.id,
                senderId: comp.ownerUserId,
                content: `Hola ${cand.name.split(" ")[0]}, recibimos tu postulación para ${job.title}. ¿Tienes disponibilidad esta semana para una breve entrevista?`,
              },
              {
                conversationId: conv.id,
                senderId: cand.userId,
                content: "Hola, muchas gracias por escribirme. Sí, tengo disponibilidad en horario de mañana o tarde.",
              },
            ],
          });

          await prisma.notification.create({
            data: {
              userId: cand.userId,
              type: "STATUS",
              title: `Actualización en ${job.title}`,
              body: `Tu postulación avanzó al estado ${targetStatus}. Revisa tu línea de tiempo de transparencia.`,
              link: "/postulante/postulaciones",
            },
          });
        }

        createdAppCount++;
      }
    }
  }

  // 9. Company Reviews (moderated / approved)
  const reviewCount = await prisma.companyReview.count();
  if (reviewCount === 0) {
    for (let i = 0; i < 6; i++) {
      await prisma.companyReview.create({
        data: {
          companyId: createdCompanies[i].id,
          authorId: createdCandidates[i].userId,
          environmentRating: 4 + (i % 2),
          growthRating: 4,
          selectionRating: 5 - (i % 2),
          communicationRating: 4,
          benefitsRating: 4 + (i % 2),
          pros: "Proceso de selección claro, equipo técnico colaborativo y respeto por horarios.",
          cons: "Algunas aprobaciones internas podrían ser más ágiles en picos de proyectos.",
          status: "APPROVED",
        },
      });
    }
  }

  // 10. Technical Assessments (all 9 areas from Section 41)
  const existingAssessments = await prisma.assessment.count();
  if (existingAssessments === 0) {
    const assessmentsSeed = [
      {
        title: "Fundamentos de Programación & Web",
        area: "PROGRAMACION",
        difficulty: "INTERMEDIO",
        durationMin: 10,
        description: "Evalúa estructuras de datos, APIs REST, TypeScript y buenas prácticas de desarrollo web.",
        questions: [
          { id: "q1", prompt: "¿Qué código HTTP corresponde cuando un usuario autenticado no tiene permisos sobre un recurso?", options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "422 Unprocessable Entity"], answerIdx: 1, explanation: "403 Forbidden indica que el cliente está autenticado pero carece de autorización." },
          { id: "q2", prompt: "¿Cuál es la complejidad temporal promedio de búsqueda en un HashMap / Map?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], answerIdx: 2, explanation: "El acceso promedio por clave hash es constante O(1)." },
          { id: "q3", prompt: "¿Qué ventaja principal aporta un índice compuesto en SQL para filtros frecuentes?", options: ["Cifra la tabla", "Reduce escaneos completos de tabla", "Elimina llaves foráneas", "Duplica el almacenamiento sin beneficio"], answerIdx: 1, explanation: "Permite resolver filtros y ordenamientos sin full table scan." },
        ],
      },
      {
        title: "Seguridad Web y OWASP Top 10",
        area: "CIBERSEGURIDAD",
        difficulty: "INTERMEDIO",
        durationMin: 10,
        description: "Cubre control de acceso (IDOR), inyección SQL, manejo seguro de contraseñas y sesiones.",
        questions: [
          { id: "q1", prompt: "¿Cómo se previene principalmente una vulnerabilidad IDOR al descargar un CV privado?", options: ["Ocultando el botón en CSS", "Verificando pertenencia y rol en el servidor", "Usando IDs secuenciales", "Guardando el CV en /public"], answerIdx: 1, explanation: "Toda autorización debe validarse en el servidor verificando propiedad y aislamiento." },
          { id: "q2", prompt: "¿Cuál es la práctica adecuada para almacenar contraseñas?", options: ["Texto plano", "MD5 simple", "Hash lento con salt como bcrypt o Argon2", "Base64"], answerIdx: 2, explanation: "bcrypt/Argon2 resisten ataques de fuerza bruta y tablas arcoíris." },
          { id: "q3", prompt: "¿Qué atributo de cookie impide que JavaScript del navegador lea el token de sesión?", options: ["HttpOnly", "Max-Age", "Path", "Domain"], answerIdx: 0, explanation: "HttpOnly protege la cookie frente a robo mediante XSS." },
        ],
      },
      {
        title: "Redes TCP/IP y Conectividad",
        area: "REDES",
        difficulty: "BASICO",
        durationMin: 10,
        description: "Conceptos esenciales de direccionamiento IP, DNS, VLAN y diagnóstico de conectividad.",
        questions: [
          { id: "q1", prompt: "¿Qué protocolo asigna automáticamente direcciones IP en una red local?", options: ["DNS", "DHCP", "SSH", "SMTP"], answerIdx: 1, explanation: "DHCP configura dinámicamente IP, máscara y puerta de enlace." },
          { id: "q2", prompt: "¿Qué puerto estándar utiliza HTTPS?", options: ["80", "22", "443", "53"], answerIdx: 2, explanation: "HTTPS opera sobre TLS en el puerto 443 por defecto." },
          { id: "q3", prompt: "¿Para qué sirve segmentar una red empresarial mediante VLANs?", options: ["Aumentar el consumo eléctrico", "Aislar dominios de broadcast y mejorar seguridad", "Eliminar switches", "Reemplazar el cifrado TLS"], answerIdx: 1, explanation: "Las VLANs separan tráfico lógico y reducen superficie de exposición." },
        ],
      },
      {
        title: "Electricidad Industrial y Seguridad LOTO",
        area: "ELECTRICIDAD",
        difficulty: "INTERMEDIO",
        durationMin: 10,
        description: "Normas de seguridad eléctrica, circuitos trifásicos y bloqueo/etiquetado.",
        questions: [
          { id: "q1", prompt: "¿Cuál es el primer principio antes de intervenir un tablero eléctrico desenergizado?", options: ["Trabajar rápido", "Aplicar bloqueo, etiquetado (LOTO) y verificar ausencia de tensión", "Usar solo guantes de tela", "Aumentar la carga"], answerIdx: 1, explanation: "LOTO y verificación de tensión cero son obligatorios para evitar electrocución." },
          { id: "q2", prompt: "¿Qué instrumento mide resistencia de aislamiento en motores?", options: ["Megóhmetro", "Tacómetro", "Manómetro", "Calibrador Vernier"], answerIdx: 0, explanation: "El megóhmetro evalúa la integridad del aislamiento eléctrico." },
        ],
      },
      {
        title: "Automatización y PLC Básico",
        area: "AUTOMATIZACION",
        difficulty: "INTERMEDIO",
        durationMin: 10,
        description: "Lógica ladder, sensores industriales y diagnóstico en planta.",
        questions: [
          { id: "q1", prompt: "¿Qué lenguaje gráfico se asemeja a diagramas eléctricos de relés en PLC?", options: ["Ladder (LD)", "HTML", "CSS", "SQL"], answerIdx: 0, explanation: "Ladder Diagram representa contactos y bobinas familiares para técnicos eléctricos." },
          { id: "q2", prompt: "¿Qué tipo de sensor detecta objetos metálicos sin contacto físico?", options: ["Sensor inductivo", "Termopar", "Flujómetro", "Barómetro"], answerIdx: 0, explanation: "Los sensores inductivos detectan metales mediante variación de campo electromagnético." },
        ],
      },
      {
        title: "Administración, KPI y Gestión Financiera",
        area: "ADMINISTRACION",
        difficulty: "BASICO",
        durationMin: 10,
        description: "Indicadores de gestión, presupuestos y control interno empresarial.",
        questions: [
          { id: "q1", prompt: "¿Qué mide principalmente el flujo de caja operativo?", options: ["Solo activos fijos", "Entradas y salidas reales de efectivo de la operación", "Número de seguidores", "Valor nominal de acciones"], answerIdx: 1, explanation: "Refleja la liquidez real generada por las operaciones del negocio." },
          { id: "q2", prompt: "¿Qué característica debe cumplir un KPI bien definido?", options: ["Ser ambiguo", "Ser medible, trazable y vinculado a un objetivo", "No tener período", "Inventarse manualmente"], answerIdx: 1, explanation: "Un KPI efectivo es cuantificable, auditable y accionable." },
        ],
      },
      {
        title: "Ofimática y Excel Analítico",
        area: "OFIMATICA",
        difficulty: "BASICO",
        durationMin: 8,
        description: "Tablas dinámicas, búsqueda de datos y automatización básica en hojas de cálculo.",
        questions: [
          { id: "q1", prompt: "¿Qué función moderna de Excel reemplaza con mayor flexibilidad a BUSCARV?", options: ["BUSCARX / XLOOKUP", "CONTAR.BLANCO", "AHORA", "ALEATORIO"], answerIdx: 0, explanation: "BUSCARX permite búsquedas bidireccionales y manejo nativo de valores no encontrados." },
          { id: "q2", prompt: "¿Para qué sirve una tabla dinámica?", options: ["Editar imágenes", "Resumir, agrupar y cruzar grandes volúmenes de datos", "Compilar C++", "Enviar correos masivos"], answerIdx: 1, explanation: "Permite analizar rápidamente métricas por categorías y periodos." },
        ],
      },
      {
        title: "Inglés Profesional para Entorno Laboral",
        area: "IDIOMAS",
        difficulty: "INTERMEDIO",
        durationMin: 8,
        description: "Comprensión lectora laboral, correos corporativos y vocabulario técnico.",
        questions: [
          { id: "q1", prompt: "Choose the most professional closing for a cover letter:", options: ["See ya soon", "Best regards,", "Bye bye!", "Whatever works"], answerIdx: 1, explanation: "'Best regards,' or 'Sincerely,' are standard professional closings." },
          { id: "q2", prompt: "What does 'deadline' mean in project management?", options: ["A broken cable", "The final date/time by which a task must be completed", "A meeting room", "A salary bonus"], answerIdx: 1, explanation: "Deadline refers to the due date for a deliverable." },
        ],
      },
      {
        title: "Razonamiento Lógico y Resolución de Problemas",
        area: "LOGICA",
        difficulty: "BASICO",
        durationMin: 10,
        description: "Secuencias, deducción lógica y análisis estructurado.",
        questions: [
          { id: "q1", prompt: "Si todas las vacantes verificadas pasan auditoría y la vacante X está verificada, entonces:", options: ["La vacante X pasó auditoría", "Ninguna vacante pasa auditoría", "La vacante X es gratuita", "No se puede concluir nada"], answerIdx: 0, explanation: "Por silogismo deductivo válido (Modus Ponens)." },
          { id: "q2", prompt: "¿Qué número continúa la secuencia: 3, 6, 12, 24, ...?", options: ["36", "42", "48", "50"], answerIdx: 2, explanation: "Cada término se duplica respecto al anterior (24 × 2 = 48)." },
        ],
      },
    ];

    for (const a of assessmentsSeed) {
      await prisma.assessment.create({
        data: {
          title: a.title,
          area: a.area,
          difficulty: a.difficulty,
          durationMin: a.durationMin,
          description: a.description,
          questionsJson: JSON.stringify(a.questions),
        },
      });
    }
  }

  // 11. Job Fairs (Section 43)
  const fairsCount = await prisma.jobFair.count();
  if (fairsCount === 0) {
    const fair1 = await prisma.jobFair.create({
      data: {
        title: "Feria Nacional de Talento Digital Perú 2026",
        slug: "feria-talento-digital-peru-2026",
        description: "Encuentro virtual con charlas técnicas, revisión de CV en vivo y más de 25 vacantes abiertas en tecnología, datos y ciberseguridad.",
        startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        endsAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        modality: "VIRTUAL",
        locationOrLink: "https://ferias.empleaperu.local/talento-digital-2026",
        organizer: "EmpleaPerú & Red Tecnológica",
        status: "ACTIVA",
      },
    });

    const fair2 = await prisma.jobFair.create({
      data: {
        title: "Expo Prácticas & Primer Empleo — Lima y Regiones",
        slug: "expo-practicas-primer-empleo-2026",
        description: "Dirigida a estudiantes universitarios, técnicos y egresados recientes buscando convenios de prácticas formales y programas trainee.",
        startsAt: new Date(Date.now() + 18 * 24 * 3600 * 1000),
        endsAt: new Date(Date.now() + 20 * 24 * 3600 * 1000),
        modality: "HIBRIDO",
        locationOrLink: "Centro de Convenciones Lima + Transmisión Virtual",
        organizer: "Alianza Universitaria EmpleaPerú",
        status: "PROXIMA",
      },
    });

    const fair3 = await prisma.jobFair.create({
      data: {
        title: "Feria Industrial, Minería y Energía Sur del Perú",
        slug: "feria-industrial-mineria-sur-2026",
        description: "Convocatorias técnicas y de ingeniería en Arequipa, Cusco, Moquegua y Tacna.",
        startsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        endsAt: new Date(Date.now() + 32 * 24 * 3600 * 1000),
        modality: "PRESENCIAL",
        locationOrLink: "Campo Ferial Cerro Juli, Arequipa",
        organizer: "Clúster Productivo del Sur",
        status: "PROXIMA",
      },
    });

    for (const c of createdCompanies.slice(0, 5)) {
      await prisma.jobFairCompany.create({ data: { fairId: fair1.id, companyId: c.id } });
    }
    for (const c of createdCompanies.slice(2, 8)) {
      await prisma.jobFairCompany.create({ data: { fairId: fair2.id, companyId: c.id } });
    }
    for (const c of [createdCompanies[2], createdCompanies[3], createdCompanies[6], createdCompanies[9]]) {
      await prisma.jobFairCompany.create({ data: { fairId: fair3.id, companyId: c.id } });
    }
  }

  // 12. Sample favorites & audit log
  await prisma.favorite.upsert({
    where: {
      userId_jobId: {
        userId: createdCandidates[0].userId,
        jobId: createdJobs[0].id,
      },
    },
    update: {},
    create: {
      userId: createdCandidates[0].userId,
      jobId: createdJobs[0].id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED_INITIALIZED",
      entityType: "SYSTEM",
      metadataJson: JSON.stringify({
        companies: createdCompanies.length,
        candidates: createdCandidates.length,
        jobs: createdJobs.length,
      }),
    },
  });

  console.log("Seed completado con éxito: 1 admin, 10 empresas, 20 postulantes, 50 vacantes, 100 postulaciones, evaluaciones y ferias.");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

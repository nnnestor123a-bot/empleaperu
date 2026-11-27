import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { analyzeCvText, extractResumeText, sanitizeUtf8Text } from "@/lib/cv-analyzer";
import { deletePrivateResumeFile, savePrivateResumeFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTS = [".pdf", ".docx"];

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (ext === ".pdf") {
    return buffer.subarray(0, 1024).toString("latin1").includes("%PDF-");
  }
  if (ext === ".docx") {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  return false;
}

async function ensureCandidateProfileId(userId: string, name: string): Promise<string> {
  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const slugBase =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "postulante";

  const created = await prisma.candidateProfile.create({
    data: {
      userId,
      headline: "Profesional en búsqueda activa",
      portfolioSlug: `${slugBase}-${userId.slice(-5)}`,
      completionPct: 25,
    },
    select: { id: true },
  });
  return created.id;
}

async function recomputeProfileCompletion(candidateId: string): Promise<void> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    select: {
      headline: true,
      bio: true,
      department: true,
      expectedSalaryPen: true,
      _count: {
        select: { experiences: true, educations: true, skills: true, resumes: true },
      },
    },
  });
  if (!profile) return;
  let pct = 15;
  if (profile.headline.trim().length > 5) pct += 15;
  if (profile.bio.trim().length > 20) pct += 10;
  if (profile.department) pct += 5;
  if (profile.expectedSalaryPen) pct += 5;
  if (profile._count.experiences > 0) pct += 15;
  if (profile._count.educations > 0) pct += 15;
  if (profile._count.skills >= 3) pct += 10;
  if (profile._count.resumes > 0) pct += 10;
  await prisma.candidateProfile.update({
    where: { id: candidateId },
    data: { completionPct: Math.min(100, pct) },
  });
}

export async function GET() {
  const auth = await requireRole(["CANDIDATE", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const candidateId =
    auth.user.candidateProfileId ||
    (auth.user.role === "CANDIDATE"
      ? await ensureCandidateProfileId(auth.user.id, auth.user.name)
      : null);

  if (!candidateId) {
    return NextResponse.json(
      { resumes: [], versions: [] },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const [resumes, versions, avgMatch] = await Promise.all([
    prisma.resume.findMany({
      where: { candidateId },
      select: {
        id: true,
        originalName: true,
        storedName: true,
        mimeType: true,
        sizeBytes: true,
        analysisJson: true,
        isPrimary: true,
        createdAt: true,
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    }),
    prisma.resumeVersion.findMany({
      where: { candidateId },
      select: {
        id: true,
        title: true,
        template: true,
        accentColor: true,
        fontFamily: true,
        dataJson: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.application.aggregate({
      where: { candidateId },
      _avg: { compatibilityScore: true },
    }),
  ]);

  const avgCompatibility = Math.round(avgMatch._avg.compatibilityScore ?? 0);

  return NextResponse.json(
    {
      resumes: resumes.map((r) => {
        let parsedAnalysis: Record<string, unknown> = {};
        try {
          parsedAnalysis = JSON.parse(r.analysisJson || "{}");
        } catch {
          parsedAnalysis = {};
        }
        return {
          ...r,
          analysis: parsedAnalysis,
          estimatedCompatibility: avgCompatibility || Number(parsedAnalysis.score || 0),
        };
      }),
      versions: versions.map((v) => {
        let parsedData: Record<string, unknown> = {};
        try {
          parsedData = JSON.parse(v.dataJson || "{}");
        } catch {
          parsedData = {};
        }
        return { ...v, data: parsedData };
      }),
    },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const candidateId =
      auth.user.candidateProfileId ||
      (await ensureCandidateProfileId(auth.user.id, auth.user.name));

    const contentType = req.headers.get("content-type") || "";

    // JSON payload = Save/Update generated CV version (Generador CV ATS)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const title = sanitizeUtf8Text(String(body.title || "Mi CV ATS")).slice(0, 120) || "Mi CV ATS";
      const template = String(body.template || "CLASSIC_ATS");
      const accentColor = String(body.accentColor || "#2563EB");
      const fontFamily = String(body.fontFamily || "Inter");
      const sectionsOrderJson = JSON.stringify(
        body.sectionsOrder || ["summary", "experience", "education", "skills", "certifications"]
      );
      const dataJson = sanitizeUtf8Text(JSON.stringify(body.data || {}));

      let version;
      if (body.id) {
        const owned = await prisma.resumeVersion.findFirst({
          where: { id: String(body.id), candidateId },
          select: { id: true },
        });
        if (!owned) {
          return NextResponse.json({ error: "Versión de CV no encontrada." }, { status: 404 });
        }
        version = await prisma.resumeVersion.update({
          where: { id: owned.id },
          data: { title, template, accentColor, fontFamily, sectionsOrderJson, dataJson },
        });
      } else {
        version = await prisma.resumeVersion.create({
          data: {
            candidateId,
            title,
            template,
            accentColor,
            fontFamily,
            sectionsOrderJson,
            dataJson,
          },
        });
      }

      revalidatePath("/postulante/cv");
      return NextResponse.json({ version, message: "Versión de CV ATS guardada en tu cuenta." }, { status: 201 });
    }

    // Multipart upload = Private CV file stored in Supabase Storage / local private disk
    const formData = await req.formData();
    const file = formData.get("file");
    const replaceId = formData.get("replaceId") ? String(formData.get("replaceId")) : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes adjuntar un archivo PDF o DOCX." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "El archivo debe pesar entre 1 byte y 5 MB." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: "Solo se permiten archivos PDF (.pdf) o Word (.docx)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { error: "El contenido real del archivo no corresponde a un PDF o DOCX válido." },
        { status: 400 }
      );
    }

    const mimeType =
      ext === ".pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const storedName = `${candidateId}-${crypto.randomUUID()}${ext}`;

    await savePrivateResumeFile(storedName, buffer, mimeType);

    const extracted = await extractResumeText(buffer, file.type, file.name);
    const cleanExtractedText = sanitizeUtf8Text(extracted.text).slice(0, 15000);
    const analysis = analyzeCvText(cleanExtractedText, extracted.readable, extracted.warning);
    const cleanOriginalName = sanitizeUtf8Text(file.name).slice(0, 160) || `cv${ext}`;

    // If replacing an existing resume, remove old file after saving new one
    if (replaceId) {
      const old = await prisma.resume.findFirst({
        where: { id: replaceId, candidateId },
        select: { id: true, storedName: true },
      });
      if (old) {
        const updated = await prisma.resume.update({
          where: { id: old.id },
          data: {
            originalName: cleanOriginalName,
            storedName,
            mimeType,
            sizeBytes: file.size,
            extractedText: cleanExtractedText,
            analysisJson: sanitizeUtf8Text(JSON.stringify(analysis)),
            isPrimary: true,
          },
        });
        await deletePrivateResumeFile(old.storedName);
        await recomputeProfileCompletion(candidateId);
        revalidatePath("/postulante");
        revalidatePath("/postulante/cv");
        await logAudit({
          actorId: auth.user.id,
          action: "RESUME_REPLACED",
          entityType: "RESUME",
          entityId: updated.id,
          metadata: { sizeBytes: file.size, ext, score: analysis.score },
        });
        return NextResponse.json({ resume: updated, analysis }, { status: 200 });
      }
    }

    await prisma.resume.updateMany({
      where: { candidateId },
      data: { isPrimary: false },
    });

    const resume = await prisma.resume.create({
      data: {
        candidateId,
        originalName: cleanOriginalName,
        storedName,
        mimeType,
        sizeBytes: file.size,
        extractedText: cleanExtractedText,
        analysisJson: sanitizeUtf8Text(JSON.stringify(analysis)),
        isPrimary: true,
      },
    });

    await recomputeProfileCompletion(candidateId);
    revalidatePath("/postulante");
    revalidatePath("/postulante/cv");

    await logAudit({
      actorId: auth.user.id,
      action: "RESUME_UPLOADED",
      entityType: "RESUME",
      entityId: resume.id,
      metadata: { sizeBytes: file.size, ext, score: analysis.score },
    });

    return NextResponse.json({ resume, analysis }, { status: 201 });
  } catch (err) {
    console.error("POST /api/resumes error:", err);
    const detail = err instanceof Error ? err.message : "Error inesperado al guardar el CV.";
    return NextResponse.json(
      { error: `No se pudo guardar tu CV: ${detail.slice(0, 180)}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const versionId = req.nextUrl.searchParams.get("versionId");
  if (!versionId || !auth.user.candidateProfileId) {
    return NextResponse.json({ error: "versionId requerido." }, { status: 400 });
  }

  await prisma.resumeVersion.deleteMany({
    where: { id: versionId, candidateId: auth.user.candidateProfileId },
  });
  revalidatePath("/postulante/cv");
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { analyzeCvText, extractResumeText } from "@/lib/cv-analyzer";
import { logAudit } from "@/lib/audit";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTS = [".pdf", ".docx"];

function getPrivateStorageDir(): string {
  return path.resolve(process.cwd(), process.env.STORAGE_DIR || "./storage/private", "resumes");
}

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (ext === ".pdf") {
    return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  }
  if (ext === ".docx") {
    // ZIP signature PK\x03\x04
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  return false;
}

export async function GET() {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user.candidateProfileId) return NextResponse.json({ resumes: [], versions: [] });

  const [resumes, versions] = await Promise.all([
    prisma.resume.findMany({
      where: { candidateId: auth.user.candidateProfileId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.resumeVersion.findMany({
      where: { candidateId: auth.user.candidateProfileId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    resumes: resumes.map((r) => ({ ...r, analysis: JSON.parse(r.analysisJson || "{}") })),
    versions,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user.candidateProfileId) {
    return NextResponse.json({ error: "Perfil de postulante no encontrado." }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";

  // JSON payload = Save generated CV version (Generador CV ATS)
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const version = await prisma.resumeVersion.create({
      data: {
        candidateId: auth.user.candidateProfileId,
        title: String(body.title || "Mi CV ATS"),
        template: String(body.template || "CLASSIC_ATS"),
        accentColor: String(body.accentColor || "#2563EB"),
        fontFamily: String(body.fontFamily || "Inter"),
        sectionsOrderJson: JSON.stringify(
          body.sectionsOrder || ["summary", "experience", "education", "skills", "certifications"]
        ),
        dataJson: JSON.stringify(body.data || {}),
      },
    });
    return NextResponse.json({ version }, { status: 201 });
  }

  // Multipart upload = Private CV file outside public/
  const formData = await req.formData();
  const file = formData.get("file");
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

  const dir = getPrivateStorageDir();
  await fs.mkdir(dir, { recursive: true });
  const storedName = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, storedName), buffer);

  const extracted = await extractResumeText(buffer, file.type, file.name);
  const analysis = analyzeCvText(extracted.text, extracted.readable, extracted.warning);

  await prisma.resume.updateMany({
    where: { candidateId: auth.user.candidateProfileId },
    data: { isPrimary: false },
  });

  const resume = await prisma.resume.create({
    data: {
      candidateId: auth.user.candidateProfileId,
      originalName: file.name.slice(0, 160),
      storedName,
      mimeType:
        ext === ".pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: file.size,
      extractedText: extracted.text.slice(0, 15000),
      analysisJson: JSON.stringify(analysis),
      isPrimary: true,
    },
  });

  await logAudit({
    actorId: auth.user.id,
    action: "RESUME_UPLOADED",
    entityType: "RESUME",
    entityId: resume.id,
    metadata: { sizeBytes: file.size, ext, score: analysis.score },
  });

  return NextResponse.json({ resume, analysis }, { status: 201 });
}

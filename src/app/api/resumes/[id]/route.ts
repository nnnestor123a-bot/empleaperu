import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  createSignedResumeUrl,
  deletePrivateResumeFile,
  readPrivateResumeFile,
} from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Descarga segura de CV privado (Supabase Storage con URL firmada de corta duración / disco local).
 * Solo permite:
 * - El candidato propietario del CV
 * - Una empresa a la que ese candidato haya postulado (aislamiento estricto anti-IDOR)
 * - Un administrador
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { candidate: { select: { id: true, userId: true } } },
  });

  if (!resume) {
    return NextResponse.json({ error: "CV no encontrado." }, { status: 404 });
  }

  let authorized = false;
  if (auth.user.role === "ADMIN") {
    authorized = true;
  } else if (auth.user.role === "CANDIDATE" && resume.candidate.userId === auth.user.id) {
    authorized = true;
  } else if (auth.user.role === "COMPANY") {
    const appExists = await prisma.application.findFirst({
      where: {
        candidateId: resume.candidateId,
        job: { companyId: { in: auth.user.companyIds } },
      },
      select: { id: true },
    });
    authorized = Boolean(appExists);
  }

  if (!authorized) {
    await logAudit({
      actorId: auth.user.id,
      action: "RESUME_UNAUTHORIZED_ACCESS_BLOCKED",
      entityType: "RESUME",
      entityId: id,
    });
    return NextResponse.json({ error: "Acceso denegado a este CV privado." }, { status: 403 });
  }

  // Short-lived signed URL (60s) for Supabase Storage when requested
  if (req.nextUrl.searchParams.get("signed") === "true") {
    const signedUrl = await createSignedResumeUrl(resume.storedName, 60);
    if (signedUrl) {
      return NextResponse.json(
        { url: signedUrl, expiresInSeconds: 60 },
        { headers: { "Cache-Control": "no-store, private" } }
      );
    }
    return NextResponse.json(
      { url: `/api/resumes/${resume.id}`, expiresInSeconds: 0 },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  }

  try {
    const fileBuf = await readPrivateResumeFile(resume.storedName);
    return new NextResponse(new Uint8Array(fileBuf), {
      status: 200,
      headers: {
        "Content-Type": resume.mimeType,
        "Content-Disposition": `attachment; filename="${resume.originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible en almacenamiento seguro." }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["CANDIDATE", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { candidate: { select: { id: true, userId: true } } },
  });
  if (!resume) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  if (auth.user.role !== "ADMIN" && resume.candidate.userId !== auth.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await prisma.resume.delete({ where: { id } });
  await deletePrivateResumeFile(resume.storedName);
  revalidatePath("/postulante");
  revalidatePath("/postulante/cv");

  return NextResponse.json({ ok: true });
}

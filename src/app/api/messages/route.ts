import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessCompany, requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const where =
    auth.user.role === "CANDIDATE"
      ? { candidateId: auth.user.candidateProfileId || "__none__" }
      : auth.user.role === "COMPANY"
      ? { companyId: { in: auth.user.companyIds } }
      : {};

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      company: { select: { id: true, tradeName: true } },
      candidate: { include: { user: { select: { id: true, name: true } } } },
      application: { include: { job: { select: { title: true } } } },
      messages: {
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["CANDIDATE", "COMPANY", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content || content.length > 2000) {
    return NextResponse.json({ error: "El mensaje debe tener entre 1 y 2000 caracteres." }, { status: 400 });
  }

  let conversationId = body.conversationId as string | undefined;

  if (!conversationId && body.applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: body.applicationId },
      include: { job: true, candidate: true },
    });
    if (!app) return NextResponse.json({ error: "Postulación no encontrada." }, { status: 404 });

    const isParticipant =
      auth.user.role === "ADMIN" ||
      app.candidate.userId === auth.user.id ||
      canAccessCompany(auth.user, app.job.companyId);

    if (!isParticipant) {
      return NextResponse.json({ error: "No autorizado para iniciar esta conversación." }, { status: 403 });
    }

    const existing = await prisma.conversation.findFirst({
      where: { applicationId: app.id },
    });
    if (existing) {
      conversationId = existing.id;
    } else {
      const created = await prisma.conversation.create({
        data: {
          applicationId: app.id,
          candidateId: app.candidateId,
          companyId: app.job.companyId,
        },
      });
      conversationId = created.id;
    }
  }

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId o applicationId requerido." }, { status: 400 });
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      candidate: { select: { userId: true } },
      company: { include: { members: true } },
    },
  });
  if (!conv) return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });

  const allowed =
    auth.user.role === "ADMIN" ||
    conv.candidate.userId === auth.user.id ||
    canAccessCompany(auth.user, conv.companyId);

  if (!allowed) {
    return NextResponse.json({ error: "Solo los participantes pueden enviar mensajes." }, { status: 403 });
  }

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId: auth.user.id,
      content,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Notify recipient
  if (auth.user.role === "CANDIDATE") {
    for (const m of conv.company.members) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          type: "MESSAGE",
          title: `Nuevo mensaje de ${auth.user.name}`,
          body: content.slice(0, 120),
          link: "/mensajes",
        },
      });
    }
  } else {
    await prisma.notification.create({
      data: {
        userId: conv.candidate.userId,
        type: "MESSAGE",
        title: `Mensaje de ${conv.company.tradeName}`,
        body: content.slice(0, 120),
        link: "/mensajes",
      },
    });
  }

  return NextResponse.json({ message: msg, conversationId }, { status: 201 });
}

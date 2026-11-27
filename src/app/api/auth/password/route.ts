import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// POST: Request password reset token (local dev email simulation clearly labeled)
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!checkRateLimit(`pwreset:${ip}`, 10, 60_000).allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Ingresa tu correo electrónico." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({
      message: "Si el correo existe en nuestra base local, se generó un código temporal de recuperación.",
      devNotice: "Modo desarrollo local: no se envían correos externos reales.",
    });
  }

  const token = crypto.randomBytes(16).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  await logAudit({
    actorId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "USER",
    entityId: user.id,
    ip,
  });

  const allowDevToken =
    process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_RESET_TOKEN === "true";

  if (allowDevToken) {
    return NextResponse.json({
      message: "Código de recuperación generado en modo desarrollo local (sin servidor SMTP externo).",
      devResetToken: token,
      devNotice: "Este token se muestra únicamente porque la plataforma corre en modo desarrollo local.",
    });
  }

  return NextResponse.json({
    message:
      "Si el correo existe en la plataforma, se registró la solicitud de recuperación. En este entorno demostrativo sin SMTP configurado, contacta al administrador para restablecer el acceso.",
  });
}

// PUT: Reset password with token OR change password while authenticated
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número." },
      { status: 400 }
    );
  }

  if (body.token) {
    const reset = await prisma.passwordResetToken.findUnique({
      where: { token: String(body.token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "El código de recuperación es inválido o ha expirado." }, { status: 400 });
    }
    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);
    await logAudit({
      actorId: reset.userId,
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "USER",
      entityId: reset.userId,
    });
    return NextResponse.json({ ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticación requerida." }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(String(body.currentPassword || ""), dbUser.passwordHash))) {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await logAudit({
    actorId: user.id,
    action: "PASSWORD_CHANGED",
    entityType: "USER",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente." });
}

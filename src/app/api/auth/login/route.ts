import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!checkRateLimit(`login:${ip}`, 25, 60_000).allowed) {
    return NextResponse.json({ error: "Demasiados intentos de inicio de sesión. Intenta en 1 minuto." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Correo o contraseña inválidos." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Tu cuenta se encuentra suspendida. Contacta al administrador." }, { status: 403 });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      await logAudit({
        actorId: user.id,
        action: "LOGIN_FAILED",
        entityType: "USER",
        entityId: user.id,
        ip,
      });
      return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

    await createSession(user, {
      userAgent: req.headers.get("user-agent") || undefined,
      ip,
    });

    await logAudit({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "USER",
      entityId: user.id,
      metadata: { role: user.role },
      ip,
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Error interno al iniciar sesión." }, { status: 500 });
  }
}

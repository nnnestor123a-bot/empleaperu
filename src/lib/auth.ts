import { cache } from "react";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "empleaperu_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const envSecret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!envSecret || envSecret.length < 32 || envSecret.includes("change-in-production")) {
      throw new Error("AUTH_SECRET inválido o demasiado corto para producción.");
    }
    return new TextEncoder().encode(envSecret);
  }
  const secret = envSecret || "empleaperu-local-dev-secret-change-in-production-2026";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  user: { id: string; email: string; role: string; name: string },
  meta?: { userAgent?: string; ip?: string }
): Promise<string> {
  const jti = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: meta?.userAgent?.slice(0, 200),
      ip: meta?.ip?.slice(0, 64),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "CANDIDATE" | "COMPANY" | "ADMIN";
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  candidateProfileId?: string;
  companyIds: string[];
  primaryCompanyId?: string;
}

const fetchCurrentUserUncached = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub) return null;

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            candidateProfile: { select: { id: true } },
            companyMemberships: { select: { companyId: true } },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null;
    }

    const companyIds = session.user.companyMemberships.map((m) => m.companyId);
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as SessionUser["role"],
      phone: session.user.phone,
      avatarUrl: session.user.avatarUrl,
      isActive: session.user.isActive,
      candidateProfileId: session.user.candidateProfile?.id,
      companyIds,
      primaryCompanyId: companyIds[0],
    };
  } catch {
    return null;
  }
};

// Deduplica consultas de sesión dentro de un mismo render en Server Components
export const getCurrentUser = cache(fetchCurrentUserUncached);

export async function requireRole(
  roles: Array<"CANDIDATE" | "COMPANY" | "ADMIN">
): Promise<{ user: SessionUser } | { error: string; status: number }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Autenticación requerida. Inicia sesión para continuar.", status: 401 };
  }
  if (!roles.includes(user.role)) {
    return { error: "No tienes permisos para acceder a este recurso.", status: 403 };
  }
  return { user };
}

export function canAccessCompany(user: SessionUser, companyId: string): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "COMPANY" && user.companyIds.includes(companyId);
}

// Simple in-memory rate limiter for sensitive endpoints (login, register, contact, reports)
const rateBucket = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateBucket.get(key);
  if (!entry || entry.resetAt < now) {
    rateBucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}

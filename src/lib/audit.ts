import { prisma } from "./prisma";

const SENSITIVE_KEYS = ["password", "passwordHash", "token", "secret", "authorization", "cookie"];

function sanitizeMetadata(meta?: Record<string, unknown>): string {
  if (!meta) return "{}";
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.some((sk) => k.toLowerCase().includes(sk))) {
      clean[k] = "[REDACTED]";
    } else {
      clean[k] = v;
    }
  }
  return JSON.stringify(clean);
}

export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadataJson: sanitizeMetadata(params.metadata),
        ip: params.ip ?? null,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

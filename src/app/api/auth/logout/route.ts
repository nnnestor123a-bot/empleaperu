import { NextRequest, NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await logAudit({
      actorId: user.id,
      action: "LOGOUT",
      entityType: "USER",
      entityId: user.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });
  }
  return NextResponse.json({ ok: true });
}

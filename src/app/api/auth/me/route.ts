import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { user: null, unreadNotifications: 0 },
      { headers: { "Cache-Control": "no-store, private" } }
    );
  }
  const unreadNotifications = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
  return NextResponse.json(
    { user, unreadNotifications },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}

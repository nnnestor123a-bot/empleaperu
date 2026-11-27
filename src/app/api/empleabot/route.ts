import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleEmpleaBotQuery } from "@/lib/empleabot";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const text = String(message || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Escribe una consulta para EmpleaBot." }, { status: 400 });
  }
  const user = await getCurrentUser();
  const reply = await handleEmpleaBotQuery(text, user);
  return NextResponse.json(reply);
}

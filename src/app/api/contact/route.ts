import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/auth";
import { contactSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!checkRateLimit(`contact:${ip}`, 10, 60_000).allowed) {
    return NextResponse.json({ error: "Demasiados mensajes enviados. Intenta en un minuto." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Completa todos los campos correctamente." },
      { status: 400 }
    );
  }

  const saved = await prisma.contactMessage.create({ data: parsed.data });
  return NextResponse.json({
    contact: saved,
    message: "Tu mensaje fue registrado en nuestra base local. Gracias por escribirnos.",
  }, { status: 201 });
}

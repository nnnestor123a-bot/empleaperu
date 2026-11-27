import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageBackend } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [jobs, companies, users] = await Promise.all([
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.company.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      storageBackend: getStorageBackend(),
      counts: { jobs, companies, users },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "No se pudo verificar la conexión a la base de datos." },
      { status: 503 }
    );
  }
}

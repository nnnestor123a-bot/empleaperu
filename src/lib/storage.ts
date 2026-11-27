import fs from "fs/promises";
import path from "path";

export type StorageBackend = "SUPABASE_STORAGE" | "LOCAL_DISK";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "resumes";
  if (url && serviceRoleKey) {
    return { url, serviceRoleKey, bucket };
  }
  return null;
}

export function getStorageBackend(): StorageBackend {
  return getSupabaseConfig() ? "SUPABASE_STORAGE" : "LOCAL_DISK";
}

function getLocalResumesDir(): string {
  return path.resolve(process.cwd(), process.env.STORAGE_DIR || "./storage/private", "resumes");
}

export async function savePrivateResumeFile(
  storedName: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const safeName = path.basename(storedName);
  const supa = getSupabaseConfig();

  if (supa) {
    const res = await fetch(`${supa.url}/storage/v1/object/${supa.bucket}/${safeName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supa.serviceRoleKey}`,
        apikey: supa.serviceRoleKey,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Error al guardar CV en Supabase Storage (${res.status}): ${errText}`);
    }
    return;
  }

  const dir = getLocalResumesDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safeName), buffer);
}

export async function createSignedResumeUrl(
  storedName: string,
  expiresInSeconds = 60
): Promise<string | null> {
  const safeName = path.basename(storedName);
  const supa = getSupabaseConfig();
  if (!supa) return null;

  const res = await fetch(`${supa.url}/storage/v1/object/sign/${supa.bucket}/${safeName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supa.serviceRoleKey}`,
      apikey: supa.serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { signedURL?: string };
  if (!data.signedURL) return null;
  return data.signedURL.startsWith("http")
    ? data.signedURL
    : `${supa.url}/storage/v1${data.signedURL.startsWith("/") ? "" : "/"}${data.signedURL}`;
}

export async function readPrivateResumeFile(storedName: string): Promise<Buffer> {
  const safeName = path.basename(storedName);
  const supa = getSupabaseConfig();

  if (supa) {
    const res = await fetch(`${supa.url}/storage/v1/object/${supa.bucket}/${safeName}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${supa.serviceRoleKey}`,
        apikey: supa.serviceRoleKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`CV no disponible en Supabase Storage (${res.status})`);
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }

  const filePath = path.join(getLocalResumesDir(), safeName);
  return fs.readFile(filePath);
}

export async function deletePrivateResumeFile(storedName: string): Promise<void> {
  const safeName = path.basename(storedName);
  const supa = getSupabaseConfig();

  if (supa) {
    await fetch(`${supa.url}/storage/v1/object/${supa.bucket}/${safeName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${supa.serviceRoleKey}`,
        apikey: supa.serviceRoleKey,
      },
    }).catch(() => {});
    return;
  }

  const filePath = path.join(getLocalResumesDir(), safeName);
  await fs.unlink(filePath).catch(() => {});
}

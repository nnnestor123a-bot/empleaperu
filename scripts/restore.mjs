import fs from "fs";
import path from "path";
import crypto from "crypto";

const args = process.argv.slice(2);
const backupDir = args.find((a) => !a.startsWith("--"));
const isolatedMode = args.includes("--isolated");
const forceLive = args.includes("--confirm-overwrite");

if (!backupDir) {
  console.error("Uso: node scripts/restore.mjs <ruta-backup> [--isolated | --confirm-overwrite]");
  process.exit(1);
}

const manifestPath = path.join(backupDir, "manifest.json");
const dbSource = path.join(backupDir, "dev.db");
if (!fs.existsSync(manifestPath) || !fs.existsSync(dbSource)) {
  console.error("Respaldo incompleto: falta manifest.json o dev.db.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const actualHash = crypto.createHash("sha256").update(fs.readFileSync(dbSource)).digest("hex");
if (actualHash !== manifest.dbSha256) {
  console.error("ERROR DE INTEGRIDAD: El hash SHA-256 de dev.db no coincide con manifest.json.");
  process.exit(1);
}

if (isolatedMode) {
  const testDir = path.join(process.cwd(), "backups", "restore-test-isolated");
  fs.mkdirSync(testDir, { recursive: true });
  fs.copyFileSync(dbSource, path.join(testDir, "dev.db"));
  console.log(`Restauración de prueba exitosa en copia aislada: ${testDir}`);
  console.log(`Integridad SHA-256 verificada: ${actualHash}`);
  process.exit(0);
}

if (!forceLive) {
  console.error("Seguridad: para sobrescribir prisma/dev.db debes pasar explícitamente --confirm-overwrite (o usa --isolated para probar sin afectar datos actuales).");
  process.exit(1);
}

fs.copyFileSync(dbSource, path.join(process.cwd(), "prisma", "dev.db"));
console.log("Restauración aplicada sobre prisma/dev.db con integridad SHA-256 verificada.");

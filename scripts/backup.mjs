import fs from "fs";
import path from "path";
import crypto from "crypto";

const root = process.cwd();
const dbFile = path.join(root, "prisma", "dev.db");
const storageDir = path.join(root, "storage", "private");
const backupsRoot = path.join(root, "backups");

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dst, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) count += copyDir(s, d);
    else {
      fs.copyFileSync(s, d);
      count++;
    }
  }
  return count;
}

if (!fs.existsSync(dbFile)) {
  console.error("No se encontró prisma/dev.db para respaldar.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(backupsRoot, `backup-${stamp}`);
fs.mkdirSync(outDir, { recursive: true });

const dbTarget = path.join(outDir, "dev.db");
fs.copyFileSync(dbFile, dbTarget);
const dbHash = sha256(dbTarget);
const privateFilesCount = copyDir(storageDir, path.join(outDir, "private"));

const manifest = {
  createdAt: new Date().toISOString(),
  dbFile: "dev.db",
  dbSha256: dbHash,
  dbSizeBytes: fs.statSync(dbTarget).size,
  privateFilesCount,
};

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Respaldo completado en: ${outDir}`);
console.log(`SHA-256 BD: ${dbHash} | Archivos privados: ${privateFilesCount}`);

# Manual de Instalación y Ejecución en Windows — EmpleaPerú

## 1. Requisitos Previos
- **Sistema operativo:** Windows 10 / 11
- **Node.js LTS:** v20 o superior (probado en Node v24.16.0 y npm 11.13.0)
- **Navegador moderno:** Chrome, Edge o Firefox
- *Solo la primera instalación requiere Internet para descargar dependencias npm y el motor de Prisma.*

## 2. Inicio Rápido con un Clic (Recomendado)
1. Abre la carpeta del proyecto `EmpleaPeru`.
2. Haz doble clic en **`INICIAR_PROYECTO.bat`**.
3. El script verificará Node.js, creará `.env` si falta, instalará dependencias si faltan, sincronizará la base de datos SQLite local (`prisma/dev.db`), sembrará los datos ficticios y abrirá **`http://localhost:3000`** (`127.0.0.1:3000`).

## 3. Comandos Manuales (PowerShell / CMD)
```powershell
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## 4. Comandos de Calidad y Respaldo
```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run backup
node scripts/restore.mjs backups\<carpeta-backup> --isolated
```

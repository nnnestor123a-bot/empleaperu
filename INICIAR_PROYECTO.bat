@echo off
chcp 65001 >nul
title EmpleaPeru - Servidor Local (http://localhost:3000)
echo ============================================================
echo   EmpleaPeru - Plataforma Peruana de Empleo y ATS Local
echo ============================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] Node.js no esta instalado o no esta en el PATH.
  echo Instala Node.js LTS (v20 o superior) desde https://nodejs.org/
  pause
  exit /b 1
)

if not exist ".env" (
  echo [INFO] Creando .env local para SQLite...
  (
    echo DATABASE_URL="file:./dev.db"
    echo AUTH_SECRET="empleaperu-local-dev-secret-change-in-production-2026"
    echo NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
    echo STORAGE_DIR="./storage/private"
    echo NEXT_PUBLIC_SHOW_DEMO_HELPER="true"
    echo ALLOW_DEV_RESET_TOKEN="true"
  ) > .env
)

if not exist "node_modules" (
  echo [INFO] Instalando dependencias por primera vez...
  call npm install --no-audit --no-fund
  if %errorlevel% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
  )
)

echo [INFO] Verificando cliente Prisma (SQLite local) y datos iniciales...
call npx prisma generate --schema prisma/schema.sqlite.prisma
call npx prisma db push --schema prisma/schema.sqlite.prisma --skip-generate
call npm run db:local:seed

echo.
echo [OK] Iniciando EmpleaPeru en http://127.0.0.1:3000 (http://localhost:3000)
echo.
start "" "http://localhost:3000"
call npm run dev
pause

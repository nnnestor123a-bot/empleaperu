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
  echo [INFO] Creando .env desde .env.example...
  copy /Y ".env.example" ".env" >nul
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

echo [INFO] Verificando cliente Prisma y base de datos SQLite local...
call npx prisma generate
call npx prisma db push --skip-generate
call npm run db:seed

echo.
echo [OK] Iniciando EmpleaPeru en http://127.0.0.1:3000 (http://localhost:3000)
echo     Cuentas demo (clave: Emplea2026!):
echo       - Postulante: postulante@empleaperu.local
echo       - Empresa:    empresa@empleaperu.local
echo       - Admin:      admin@empleaperu.local
echo.
start "" "http://localhost:3000"
call npm run dev
pause

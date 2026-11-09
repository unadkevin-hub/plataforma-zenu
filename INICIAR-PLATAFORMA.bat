@echo off
chcp 65001 >nul
title Ruta Digital Zenu
cd /d "%~dp0"
echo.
echo  ============================================
echo    RUTA DIGITAL ZENU - Iniciando la plataforma
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  No se encontro Node.js. Instale la version LTS desde https://nodejs.org
  echo  y vuelva a abrir este archivo.
  start "" https://nodejs.org
  pause
  exit /b
)

if not exist node_modules (
  echo  [1/4] Instalando dependencias. La primera vez tarda unos minutos...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo  Algo salio mal. Tome una captura de esta ventana y enviela al grupo.
    pause
    exit /b
  )
) else (
  echo  [1/4] Dependencias listas.
)

if not exist .env (
  echo  [2/4] Creando el archivo de configuracion .env para XAMPP...
  powershell -NoProfile -Command "(Get-Content .env.example) -replace '^DB_USER=.*','DB_USER=root' -replace '^DB_PASSWORD=.*','DB_PASSWORD=' | Set-Content .env -Encoding ASCII"
) else (
  echo  [2/4] Configuracion .env lista.
)

echo  [3/4] Revisando MySQL...
call node scripts\verificar-db.js
if errorlevel 1 (
  pause
  exit /b
)

if not exist .base-creada (
  echo  Creando la base de datos con los modulos y las cuentas iniciales...
  call npm run db:init
  if errorlevel 1 (
    echo  Algo salio mal. Tome una captura de esta ventana y enviela al grupo.
    pause
    exit /b
  )
  echo creada> .base-creada
)

echo  [4/4] Encendiendo la plataforma...
echo.
echo  En este computador:  http://localhost:3000
echo  En los celulares conectados a la misma red o hotspot, abra:
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { $_.IPAddress }"`) do echo      http://%%i:3000
echo.
echo  Cuentas: facilitador / Facilitador-Zenu-2026    admin / Admin-Zenu-2026
echo  NO CIERRE ESTA VENTANA mientras use la plataforma.
echo.
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000"
call npm start
pause

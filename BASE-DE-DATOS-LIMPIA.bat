@echo off
chcp 65001 >nul
title Ruta Digital Zenu - Base de datos limpia
cd /d "%~dp0"
echo.
echo  ATENCION: esto BORRA todos los usuarios, respuestas y progreso de la plataforma
echo  y deja la base como nueva (3 modulos, cuentas admin y facilitador).
echo  Uselo solo antes de una sesion o despues de hacer pruebas.
echo.
set /p OK=Escriba SI para continuar: 
if /i not "%OK%"=="SI" exit /b
call node scripts\verificar-db.js
if errorlevel 1 (
  pause
  exit /b
)
call npm run db:init
echo creada> .base-creada
echo.
echo  Listo. Ahora abra INICIAR-PLATAFORMA.bat
pause

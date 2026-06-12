@echo off
REM ============================================================
REM  SPACE MOUNT - Lanzador de un clic
REM  Abre el juego con Electron (ventana nativa)
REM ============================================================

cd /d "%~dp0"

REM Verificar si npm existe
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo Iniciando Space Mount con Electron...
    call npm start
) else (
    echo Error: Node.js no está instalado.
    echo Descargue Node.js desde: https://nodejs.org/
    echo Luego instale dependencias con: npm install
    pause
)

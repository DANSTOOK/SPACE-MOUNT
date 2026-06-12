@echo off
REM ============================================================
REM  SPACE MOUNT - Lanzador de un clic
REM  Abre el juego directamente sin necesidad de servidor
REM ============================================================

cd /d "%~dp0"

REM Obtener la ruta completa al archivo
set GAME_FILE=%~dp0standalone.html

REM Abrir el archivo en el navegador predeterminado
start "" "%GAME_FILE%"

echo Juego abierto en tu navegador...
echo Esperando 5 segundos...
timeout /t 5 /nobreak

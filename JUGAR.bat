@echo off
REM ============================================================
REM  SPACE MOUNT - Lanzador de un clic
REM  Arranca un servidor local y abre el juego en el navegador.
REM  (Los modulos ES NO funcionan abriendo index.html directo:
REM   por eso hay que servirlo por HTTP con esto.)
REM  Deja esta ventana ABIERTA mientras juegas. Cierrala para salir.
REM ============================================================
cd /d "%~dp0"
echo Iniciando Space Mount en http://localhost:8778 ...
start "" "http://localhost:8778"
python dev-server.py 8778
pause

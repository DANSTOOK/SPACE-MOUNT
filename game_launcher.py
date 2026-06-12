#!/usr/bin/env python3
"""
Space Mount Game Launcher
Abre un servidor HTTP local y carga el juego automáticamente en el navegador
"""

import os
import sys
import webbrowser
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading

class GameHTTPHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Evitar caching para que siempre cargue versión nueva
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def log_message(self, format, *args):
        # Suprime logs verbosos
        pass

def start_server(port=8778):
    """Inicia servidor HTTP en el puerto especificado"""
    handler = GameHTTPHandler
    server = HTTPServer(('127.0.0.1', port), handler)
    print(f"🎮 Servidor iniciado en http://localhost:{port}")

    # Ejecutar servidor en thread separado
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    return server

def main():
    # Cambiar a la carpeta del script
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)

    # Verificar que standalone.html existe
    if not (script_dir / 'standalone.html').exists():
        print("❌ Error: No se encontró standalone.html")
        print(f"   Ubicación esperada: {script_dir / 'standalone.html'}")
        input("Presiona Enter para salir...")
        sys.exit(1)

    port = 8778

    try:
        # Iniciar servidor
        server = start_server(port)

        # Esperar un moment para que el servidor se inicialice
        time.sleep(1)

        # Abrir el navegador
        print(f"🎮 Abriendo Space Mount...")
        webbrowser.open(f'http://localhost:{port}')

        print("\n═══════════════════════════════════════════")
        print("🎮 Space Mount está corriendo")
        print("═══════════════════════════════════════════")
        print(f"URL: http://localhost:{port}")
        print("\nCierra esta ventana para detener el juego")
        print("═══════════════════════════════════════════\n")

        # Mantener el servidor activo
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\n👋 Juego cerrado")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        input("Presiona Enter para salir...")
        sys.exit(1)

if __name__ == '__main__':
    main()

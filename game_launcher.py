#!/usr/bin/env python3
"""
Space Mount Game Launcher
Abre el juego en una ventana/tab limpia
"""

import os
import sys
import webbrowser
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import socket

class GameHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Servir standalone.html en cualquier ruta
        if self.path == '/' or self.path == '':
            self.path = '/standalone.html'
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        pass

def find_free_port():
    """Encontrar un puerto disponible"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def main():
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)

    if not (script_dir / 'standalone.html').exists():
        print("❌ Error: standalone.html no encontrado")
        input("Presiona Enter para salir...")
        sys.exit(1)

    port = find_free_port()

    try:
        # Iniciar servidor
        server = HTTPServer(('127.0.0.1', port), GameHandler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        time.sleep(0.5)

        # Abrir navegador
        url = f'http://localhost:{port}'
        print(f"🎮 Abriendo Space Mount...")
        webbrowser.open(url)

        print(f"\n✅ Juego iniciado en {url}")
        print("Cierra esta ventana para detener\n")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n👋 Juego cerrado")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Presiona Enter para salir...")
        sys.exit(1)

if __name__ == '__main__':
    main()

# Servidor de desarrollo para Space Mount.
# Igual que `python -m http.server` pero añade Cache-Control: no-store
# a cada respuesta, para que el navegador nunca sirva módulos ES viejos
# al recargar tras editar. Solo para desarrollo local.
import os
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Carpeta del juego = donde vive este script (independiente del CWD).
ROOT = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8778
    handler = partial(NoCacheHandler, directory=ROOT)
    HTTPServer(('', port), handler).serve_forever()

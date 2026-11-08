"""Servidor local para usar WEX MolForge Pro sin internet (solo biblioteca estándar de Python)."""
import http.server, os, threading, webbrowser
RAIZ = os.path.dirname(os.path.abspath(__file__))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=RAIZ, **k)
    def log_message(s, *a): pass
if __name__ == '__main__':
    srv = None
    for puerto in range(8000, 8020):
        try: srv = http.server.ThreadingHTTPServer(('127.0.0.1', puerto), H); break
        except OSError: continue
    url = f'http://localhost:{puerto}/'
    print('WEX MolForge Pro funcionando en', url, '\nDeja esta ventana abierta. Cierra con Ctrl+C.')
    threading.Timer(1, lambda: webbrowser.open(url)).start()
    try: srv.serve_forever()
    except KeyboardInterrupt: pass

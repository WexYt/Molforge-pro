"""Servidor local para usar WEX MolForge Pro sin internet (solo biblioteca estándar de Python)."""
import http.server, os, sys, webbrowser, threading
RAIZ = os.path.dirname(os.path.abspath(__file__)); PFX = '/Molforge-pro'; PUERTO = 8000
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=RAIZ, **k)
    def do_GET(s):
        p = s.path.split('?')[0].split('#')[0]
        if p in ('', '/'): s.send_response(302); s.send_header('Location', PFX + '/'); s.end_headers(); return
        if p.startswith(PFX):
            p = p[len(PFX):] or '/'
            if not os.path.exists(os.path.join(RAIZ, p.lstrip('/'))) or p.endswith('/') and not os.path.exists(os.path.join(RAIZ, p.lstrip('/'), 'index.html')):
                p = '/index.html'          # rutas internas (/forja, /biblioteca)
            s.path = p
        super().do_GET()
    def log_message(s, *a): pass
if __name__ == '__main__':
    for puerto in range(PUERTO, PUERTO + 20):
        try: srv = http.server.ThreadingHTTPServer(('127.0.0.1', puerto), H); break
        except OSError: continue
    url = f'http://localhost:{puerto}{PFX}/'
    print('WEX MolForge Pro funcionando en', url, '\nDeja esta ventana abierta. Cierra con Ctrl+C.')
    threading.Timer(1, lambda: webbrowser.open(url)).start()
    try: srv.serve_forever()
    except KeyboardInterrupt: pass

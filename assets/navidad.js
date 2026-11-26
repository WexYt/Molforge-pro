/* WEX MolForge Pro · navidad.js — decoración navideña ligera (MIT)
   NAVIDAD — quitar en enero: basta borrar este archivo, su <script> en
   index.html, las clases .xmas-tree / .xmas-greet y el bloque "NAVIDAD" de
   app.css (que incluye la guirnalda, el saludo y el arbolito en los
   encabezados). Sin dependencias. No toca nada de la v0.8. */
(function () {
  var KEY = 'wex-navidad';
  function stored() { try { var v = localStorage.getItem(KEY); return v === null ? null : JSON.parse(v); } catch (e) { return null; } }
  // Prendida por defecto solo en diciembre (mes 11); el resto del año, apagada.
  // La preferencia guardada por el usuario manda siempre sobre el defecto.
  function defaultOn() { return new Date().getMonth() === 11; }
  function isOn() { var s = stored(); return s === null ? defaultOn() : !!s; }

  var snowEl = null;
  function buildSnow() {
    if (snowEl) return;
    snowEl = document.createElement('div');
    snowEl.id = 'xmas-snow';
    snowEl.setAttribute('aria-hidden', 'true');
    var n = 24, i, f, size;
    for (i = 0; i < n; i++) {
      f = document.createElement('i');
      f.style.left = (Math.random() * 100).toFixed(2) + '%';
      size = 4 + Math.random() * 7;
      f.style.width = size.toFixed(1) + 'px';
      f.style.height = size.toFixed(1) + 'px';
      f.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + 's';
      f.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
      f.style.opacity = (0.25 + Math.random() * 0.45).toFixed(2);
      snowEl.appendChild(f);
    }
    document.body.appendChild(snowEl);
  }
  // Guirnalda de luces en el borde superior: 18 focos de colores que
  // cuelgan en curva y parpadean suave. Ligera: un solo div, sin canvas.
  var garEl = null;
  var BULBS = ['#ff5b5b', '#ffd166', '#7ee787', '#5eb1ff', '#c084fc'];
  function buildGarland() {
    if (garEl) return;
    garEl = document.createElement('div');
    garEl.id = 'xmas-garland';
    garEl.setAttribute('aria-hidden', 'true');
    var n = 18, i, b;
    for (i = 0; i < n; i++) {
      b = document.createElement('i');
      b.style.left = (i / (n - 1) * 100).toFixed(2) + '%';
      b.style.top = (3 + 11 * Math.sin(Math.PI * i / (n - 1))).toFixed(1) + 'px';
      b.style.background = BULBS[i % BULBS.length];
      b.style.color = BULBS[i % BULBS.length];
      b.style.animationDelay = (Math.random() * 1.4).toFixed(2) + 's';
      garEl.appendChild(b);
    }
    document.body.appendChild(garEl);
  }
  function set(on) {
    document.documentElement.classList.toggle('xmas', !!on);
    if (on) { buildSnow(); buildGarland(); }
    else {
      if (snowEl) { snowEl.remove(); snowEl = null; }
      if (garEl) { garEl.remove(); garEl = null; }
    }
  }
  set(isOn());
  window.__xmas = { isOn: isOn, set: set, defaultOn: defaultOn };
})();

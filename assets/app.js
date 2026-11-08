/* WEX MolForge Pro v0.5 beta · app.js — interfaz móvil (MIT) */
(function () {
  const C = Chem, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], EL = C.EL;
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const S = { lib: [], cats: [], byCanon: new Map(), cat: 'Todas', q: '', list: [], shown: 0, meta: null, undo: [], redo: [], pc: store.get('wex-pc', true), haptic: store.get('wex-haptic', true), opts: Object.assign({ showH: true, labels: false, spin: false, elastic: true }, store.get('wex-opts', {})), tool: 'move' };
  const t0 = performance.now(), PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

  // ---------- utilidades ----------
  let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
  const tick = () => { if (S.haptic && navigator.vibrate) navigator.vibrate(8); };
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'molecula';
  const online = () => navigator.onLine !== false;
  function splash(p, msg) { $('#splash-bar').style.width = p + '%'; if (msg) $('#splash-msg').textContent = msg; }
  function lev1(a, b) { if (Math.abs(a.length - b.length) > 1) return false; let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; } else { if (++d > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } } } return d + (a.length - i) + (b.length - j) <= 1; }
  const dotsOf = e => { const c = {}; e.a.forEach(x => c[x] = (c[x] || 0) + 1); const k = Object.keys(c).sort((a, b) => c[b] - c[a]); if (e.f.includes('H') && !c.H) k.push('H'); return k.slice(0, 4); };

  // ---------- navegación ----------
  function go(name) {
    $$('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + name)); $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.go === name));
    if (name === 'lab') requestAnimationFrame(() => V.resize());
  }
  $$('#tabbar button').forEach(b => b.onclick = () => { go(b.dataset.go); tick(); });

  // ---------- biblioteca y buscador ----------
  function indexLib(d) {
    S.cats = d.cats; S.lib = d.mols.map(e => { e.nk = norm(e.n); e.words = e.nk.split(/[\s\-()]+/).filter(Boolean); e.fk = e.f.toLowerCase(); e.ck = norm(e.c); e.dots = dotsOf(e); return e; });
    S.lib.forEach(e => { const m = { atoms: e.a.map(el => ({ el, x: 0, y: 0, z: 0 })), bonds: e.b }; S.byCanon.set(C.canon(m), e); });
    $('#count').textContent = S.lib.length + ' compuestos · funciona sin conexión';
  }
  function renderChips() {
    const cnt = c => S.lib.filter(e => e.c === c).length, all = [['Todas', S.lib.length]].concat(S.cats.map(c => [c, cnt(c)]));
    $('#chips').innerHTML = all.map(([c, n]) => '<button role="tab" aria-selected="' + (c === S.cat) + '" data-c="' + c + '">' + c + ' <small>' + n + '</small></button>').join('');
    $$('#chips button').forEach(b => b.onclick = () => { S.cat = b.dataset.c; renderChips(); renderList(true); tick(); b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); });
  }
  function filtered() {
    const q = norm(S.q.trim()), qf = q.replace(/\s/g, ''); let L = S.cat === 'Todas' ? S.lib : S.lib.filter(e => e.c === S.cat); if (!q) return L;
    const sc = e => e.nk === q ? 100 : e.fk === qf ? 95 : e.nk.startsWith(q) ? 80 : e.words.some(w => w.startsWith(q)) ? 60 : e.nk.includes(q) ? 40 : e.ck.includes(q) || e.fk.includes(qf) ? 20 : 0;
    let r = L.map(e => [sc(e), e]).filter(x => x[0]);
    if (!r.length && q.length >= 3) r = L.filter(e => e.words.some(w => lev1(w, q) || lev1(w.slice(0, q.length), q))).map(e => [10, e]);
    return r.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n, 'es')).map(x => x[1]);
  }
  function rowHTML(e, i, anim) {
    return '<button class="item' + (anim ? ' in' : '') + '" style="--i:' + i + '" data-s="' + e.s + '"><span class="dots">' + e.dots.map(x => '<i style="background:' + EL[x][5] + '"></i>').join('') + '</span><span class="t"><b>' + e.n + '</b><small>' + e.f + ' · ' + e.c + '</small></span><svg class="ic chev"><use href="#i-chev"/></svg></button>';
  }
  function pcRow() {
    const q = S.q.trim(); if (q.length < 3) return '';
    return '<button class="item" id="pc-row"' + (online() ? '' : ' disabled') + '><span class="dots"><svg class="ic"><use href="#i-globe"/></svg></span><span class="t"><b>Buscar «' + q.replace(/</g, '&lt;') + '» en PubChem</b><small>' + (online() ? 'Descarga la estructura 3D de cualquier compuesto' : 'Sin conexión: solo la biblioteca local') + '</small></span><svg class="ic chev"><use href="#i-chev"/></svg></button>';
  }
  function renderList(reset) {
    const box = $('#list'); if (reset) { S.list = filtered(); S.shown = 0; box.innerHTML = ''; }
    const next = S.list.slice(S.shown, S.shown + 30); box.insertAdjacentHTML('beforeend', next.map((e, i) => rowHTML(e, i, reset && S.shown === 0 && i < 12)).join('')); S.shown += next.length;
    $$('#list .pc-tmp').forEach(n => n.remove());
    if (S.shown >= S.list.length && !$('#pc-row')) { box.insertAdjacentHTML('beforeend', pcRow()); }
    if (!S.list.length && !S.q.trim()) box.innerHTML = '<p class="empty">Sin resultados</p>';
    else if (!S.list.length) box.insertAdjacentHTML('afterbegin', '<p class="empty">No hay coincidencias en la biblioteca local.</p>');
    $$('#list .item[data-s]').forEach(b => b.onclick = b.onclick || (() => openEntry(S.lib.find(e => e.s === b.dataset.s))));
    const pc = $('#pc-row'); if (pc) pc.onclick = () => fromPubChem(S.q.trim());
  }
  new IntersectionObserver(en => { if (en[0].isIntersecting && S.shown < S.list.length) renderList(false); }, { rootMargin: '300px' }).observe($('#sentinel'));
  let qT; $('#q').addEventListener('input', e => { S.q = e.target.value; $('#qclear').hidden = !S.q; clearTimeout(qT); qT = setTimeout(() => renderList(true), 120); });
  $('#qclear').onclick = () => { $('#q').value = ''; S.q = ''; $('#qclear').hidden = true; renderList(true); $('#q').focus(); };

  // ---------- laboratorio ----------
  const cb = {
    snap() { S.undo.push(C.clone(V.getMol())); if (S.undo.length > 80) S.undo.shift(); S.redo = []; btns(); },
    change(r) { btns(); clearTimeout(cb.t); cb.t = setTimeout(info, ['atom', 'bond', 'del', 'el'].includes(r) ? 30 : 220); },
    live() {}, select() {}, toast, tick
  };
  const V = View($('#cv'), cb);
  V.setOpts(S.opts);
  const btns = () => { $('#btn-undo').disabled = !S.undo.length; $('#btn-redo').disabled = !S.redo.length; };
  function undo() { if (!S.undo.length) return; S.redo.push(C.clone(V.getMol())); V.setMol(S.undo.pop(), { keepView: true }); btns(); info(); tick(); }
  function redo() { if (!S.redo.length) return; S.undo.push(C.clone(V.getMol())); V.setMol(S.redo.pop(), { keepView: true }); btns(); info(); tick(); }
  $('#btn-undo').onclick = undo; $('#btn-redo').onclick = redo; $('#btn-auto').onclick = () => { V.autoShape(); tick(); toast('Acomodando la forma…'); };
  $('#btn-center').onclick = () => { V.fit(); tick(); };

  function setMolecule(m, meta) { V.setMol(m, { appear: true, noOrient: !m.atoms.length }); S.undo = []; S.redo = []; S.meta = meta || null; btns(); info(); }
  const LAYOUTS = new Map();
  function openEntry(e) {
    go('lab'); setName('Armando ' + e.n + '…', ''); $('#mchips').innerHTML = '';
    setTimeout(() => {
      let m = LAYOUTS.get(e.s); if (!m) { m = { atoms: e.a.map(el => ({ el, x: 0, y: 0, z: 0 })), bonds: e.b.map(b => b.slice()) }; C.layout(m); LAYOUTS.set(e.s, m); }
      setMolecule(C.clone(m), { name: e.n, cat: e.c }); hintOnce('move');
    }, 30);
  }
  $('#newcard').onclick = () => { go('lab'); setMolecule({ atoms: [], bonds: [] }, null); selectTool('atom'); tick(); };

  // nombre, elementos y datos
  let nameLook = 0; const cache = new Map();
  function setName(n, sub) { const h = $('#mname'); if (h.textContent !== n) { h.textContent = n; h.classList.remove('flip'); void h.offsetWidth; h.classList.add('flip'); } $('#mmeta').textContent = sub || ''; }
  function info() {
    const m = V.getMol(); nameLook++;
    if (!m.atoms.length) { setName('Lienzo vacío', 'Toca el lienzo para colocar tu primer átomo'); $('#mchips').innerHTML = ''; $('#mspin').hidden = true; return; }
    const d = C.descr(m), ks = Object.keys(d.counts).sort((a, b) => a === 'C' ? -1 : b === 'C' ? 1 : a === 'H' ? -1 : b === 'H' ? 1 : a.localeCompare(b));
    $('#mchips').innerHTML = ks.map(k => '<span title="' + EL[k][0] + '"><i style="background:' + EL[k][5] + '"></i>' + k + ' ' + d.counts[k] + '</span>').join('');
    const meta = d.formula + ' · ' + d.mw.toFixed(2) + ' g/mol · ' + d.total + ' átomos', key = C.canon(m), hit = S.byCanon.get(key);
    if (hit) { $('#mspin').hidden = true; return setName(hit.n, hit.c + ' · ' + meta); }
    if (S.meta && S.meta.key === key) { $('#mspin').hidden = true; return setName(S.meta.name, meta); }
    if (S.meta && S.meta.name && !S.meta.key) { S.meta.key = key; $('#mspin').hidden = true; return setName(S.meta.name, meta); }
    setName('Molécula nueva', meta); lookup(m, meta, nameLook);
  }
  async function lookup(m, meta, id) {
    $('#mspin').hidden = true; if (!S.pc || !online() || m.atoms.length > 70) return;
    let smi; try { smi = C.toSmiles(m); } catch (e) { return; }
    $('#mspin').hidden = false;
    try {
      let nm = cache.get(smi);
      if (nm === undefined) {
        const r = await fetch(PUG + '/compound/smiles/cids/JSON', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'smiles=' + encodeURIComponent(smi) }); const j = await r.json(), cid = j.IdentifierList && j.IdentifierList.CID[0];
        if (!r.ok || !cid) nm = null; else { const p = await (await fetch(PUG + '/compound/cid/' + cid + '/property/Title/JSON')).json(); nm = p.PropertyTable.Properties[0].Title; nm = nm.charAt(0).toUpperCase() + nm.slice(1); }
        cache.set(smi, nm);
      }
      if (id === nameLook && nm) setName(nm, 'PubChem · ' + meta);
    } catch (e) { /* sin red: se queda el nombre genérico */ }
    if (id === nameLook) $('#mspin').hidden = true;
  }

  // herramientas
  const HINTS = { move: 'Arrastra un átomo para darle forma · arrastra el fondo para girar', atom: 'Toca el lienzo para colocar un átomo o toca uno para añadir otro unido', bond: 'Arrastra de un átomo a otro para unirlos · toca un enlace para cambiar su orden', erase: 'Toca un átomo o un enlace para borrarlo' };
  let hT; const seen = new Set();
  function hintOnce(t) { if (seen.has(t)) return; seen.add(t); const h = $('#hint'); h.textContent = HINTS[t]; h.hidden = false; clearTimeout(hT); hT = setTimeout(() => h.hidden = true, 4200); }
  function selectTool(t) { S.tool = t; V.setTool(t); $$('[data-tool]').forEach(b => b.setAttribute('aria-checked', b.dataset.tool === t)); hintOnce(t); }
  $$('[data-tool]').forEach(b => b.onclick = () => { selectTool(b.dataset.tool); tick(); });
  $$('[data-order]').forEach(b => b.onclick = () => { V.setOrder(+b.dataset.order); $$('[data-order]').forEach(x => x.setAttribute('aria-checked', x === b)); if (S.tool === 'move' || S.tool === 'erase') selectTool('bond'); tick(); });
  $('#palette').innerHTML = C.PALETTE.map(e => '<button role="radio" data-el="' + e + '" aria-checked="' + (e === 'C') + '" title="' + EL[e][0] + '"><i style="background:' + EL[e][5] + '"></i>' + e + '</button>').join('');
  $$('#palette button').forEach(b => b.onclick = () => {
    const e = b.dataset.el; $$('#palette button').forEach(x => x.setAttribute('aria-checked', x === b)); V.setElement(e);
    if (S.tool === 'move' && V.getSel() >= 0) V.replaceElement(V.getSel(), e); else if (S.tool !== 'atom' && S.tool !== 'bond') selectTool('atom'); tick();
  });

  // ---------- hojas inferiores ----------
  const sheet = $('#sheet'), scrim = $('#scrim');
  function openSheet(html) { $('#sheet-body').innerHTML = html; scrim.hidden = false; sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); sheet.style.transform = ''; }
  function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); sheet.style.transform = ''; scrim.hidden = true; }
  scrim.onclick = closeSheet; document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  (function () { let y0 = null; const g = sheet; g.addEventListener('pointerdown', e => { if (e.target.closest('.grab') || (sheet.scrollTop === 0 && e.target === sheet)) { y0 = e.clientY; g.setPointerCapture(e.pointerId); sheet.style.transition = 'none'; } });
    g.addEventListener('pointermove', e => { if (y0 !== null) sheet.style.transform = 'translateY(' + Math.max(0, e.clientY - y0) + 'px)'; });
    const up = e => { if (y0 === null) return; const d = e.clientY - y0; y0 = null; sheet.style.transition = ''; if (d > 90) closeSheet(); else sheet.style.transform = ''; }; g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up); })();
  const nameNow = () => slug($('#mname').textContent.replace(/^Armando |…$/g, ''));
  function save(fn, data, mime) { const b = data instanceof Blob ? data : new Blob([data], { type: mime }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('Descargado: ' + fn); }
  function sheetData() {
    const m = V.getMol(); if (!m.atoms.length) return openSheet('<h3>Datos</h3><p class="muted">Coloca algunos átomos para ver sus datos.</p>');
    const d = C.descr(m), T = (b, s) => '<div class="tile"><b>' + b + '</b><small>' + s + '</small></div>';
    openSheet('<h3>' + $('#mname').textContent + '</h3><div class="tiles">' + T(d.formula, 'Fórmula') + T(d.mw.toFixed(2), 'g/mol') + T(d.total, 'Átomos') + T(d.bonds, 'Enlaces') + T(d.rings, 'Anillos') + T(d.rot, 'Rotables') + T(d.hbd, 'Donadores H') + T(d.hba, 'Aceptores H') + T(d.heavy, 'Átomos pesados') + '</div><div class="banner' + (d.lipinski ? '' : ' no') + '">Regla de Lipinski: <b>' + (d.lipinski ? 'cumple' : 'no cumple') + '</b> (masa ≤ 500 · donadores ≤ 5 · aceptores ≤ 10 · rotables ≤ 10)</div>');
  }
  function sheetDown() {
    const m = V.getMol(); if (!m.atoms.length) return openSheet('<h3>Descargar</h3><p class="muted">Crea o abre una molécula primero.</p>');
    const can = navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.sdf', { type: 'chemical/x-mdl-sdfile' })] });
    openSheet('<h3>Descargar</h3><div class="dl"><button data-f="sdf">SDF<small>Estándar de química (3D)</small></button><button data-f="mol">MOL<small>Molfile V2000</small></button><button data-f="xyz">XYZ<small>Coordenadas en texto</small></button><button data-f="json">JSON<small>Átomos, enlaces y datos</small></button><button data-f="png">PNG<small>Imagen de la vista</small></button>' + (can ? '<button data-f="share">Compartir…<small>Enviar por apps</small></button>' : '') + '</div>');
    $$('#sheet-body [data-f]').forEach(b => b.onclick = () => {
      const n = nameNow(), name = $('#mname').textContent, f = b.dataset.f;
      if (f === 'sdf') save(n + '.sdf', C.toSDF(m, name), 'chemical/x-mdl-sdfile'); else if (f === 'mol') save(n + '.mol', C.toMol(m, name), 'chemical/x-mdl-molfile'); else if (f === 'xyz') save(n + '.xyz', C.toXYZ(m, name), 'chemical/x-xyz');
      else if (f === 'json') { const d = C.descr(m); delete d.counts; save(n + '.json', JSON.stringify({ nombre: name, smiles: C.toSmiles(m), datos: d, atomos: m.atoms.map(a => ({ el: a.el, x: +a.x.toFixed(4), y: +a.y.toFixed(4), z: +a.z.toFixed(4) })), enlaces: m.bonds }, null, 1), 'application/json'); }
      else if (f === 'png') V.png('#0d1526', blob => save(n + '.png', blob));
      else navigator.share({ files: [new File([C.toSDF(m, name)], n + '.sdf', { type: 'chemical/x-mdl-sdfile' })], title: name }).catch(() => {});
      tick();
    });
  }
  function sheetOpts() {
    const row = (id, t, s) => '<label class="sw-row"><span>' + t + '<small>' + s + '</small></span><input type="checkbox" id="' + id + '"' + (S.opts[{ 'o-h': 'showH', 'o-l': 'labels', 'o-s': 'spin', 'o-e': 'elastic' }[id]] ? ' checked' : '') + '></label>';
    openSheet('<h3>Opciones</h3><div class="card list-s">' + row('o-e', 'Arrastre elástico', 'Al mover un átomo, los demás lo siguen.') + row('o-h', 'Mostrar hidrógenos', 'Se completan solos según la valencia.') + row('o-l', 'Etiquetas de elemento', 'Símbolo sobre cada átomo.') + row('o-s', 'Rotación automática', 'Gira despacio cuando no la tocas.') + '</div><div class="stack" style="margin-top:12px"><button class="sheet-btn" id="o-re">Reorganizar desde cero</button><button class="sheet-btn danger" id="o-clr">Limpiar lienzo</button></div>');
    const map = { 'o-h': 'showH', 'o-l': 'labels', 'o-s': 'spin', 'o-e': 'elastic' };
    Object.keys(map).forEach(id => $('#' + id).onchange = e => { S.opts[map[id]] = e.target.checked; V.setOpts(S.opts); store.set('wex-opts', S.opts); tick(); });
    $('#o-re').onclick = () => { cb.snap(); V.reorganize(); closeSheet(); };
    $('#o-clr').onclick = () => { const prev = C.clone(V.getMol()); setMolecule({ atoms: [], bonds: [] }, null); S.undo = [prev]; btns(); closeSheet(); };
  }
  $$('.fab[data-sheet]').forEach(b => b.onclick = () => { tick(); ({ data: sheetData, down: sheetDown, opts: sheetOpts })[b.dataset.sheet](); });

  // ---------- PubChem ----------
  async function fromPubChem(q) {
    if (!online()) return toast('Sin conexión');
    go('lab'); setName('Buscando «' + q + '» en PubChem…', ''); $('#mchips').innerHTML = ''; $('#mspin').hidden = false;
    try {
      const j = await (await fetch(PUG + '/compound/name/' + encodeURIComponent(q) + '/cids/JSON')).json(), cid = j.IdentifierList.CID[0]; let sdf;
      try { const r = await fetch(PUG + '/compound/cid/' + cid + '/SDF?record_type=3d'); if (!r.ok) throw 0; sdf = await r.text(); } catch (e) { sdf = await (await fetch(PUG + '/compound/cid/' + cid + '/SDF')).text(); }
      const m = C.parseSDF(sdf); if (m.atoms.length > 90) throw new Error('Molécula demasiado grande para el editor (' + m.atoms.length + ' átomos pesados)');
      if (m.atoms.every(a => Math.abs(a.z) < 1e-6)) C.layout(m);
      const nm = q.charAt(0).toUpperCase() + q.slice(1); setMolecule(m, { name: nm, key: C.canon(m) }); $('#mspin').hidden = true; toast('Cargado desde PubChem · CID ' + cid);
    } catch (e) { $('#mspin').hidden = true; setName('Lienzo vacío', ''); toast(e.message && !/JSON|fetch|Failed/i.test(e.message) ? e.message : 'No se encontró «' + q + '»'); }
  }

  // ---------- ajustes ----------
  const THEME_COLOR = { claro: '#eef3f8', oscuro: '#0a111f', cristal: '#140f33' };
  function applyTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('wex-theme', t); } catch (e) {} $$('[data-th]').forEach(b => b.setAttribute('aria-checked', b.dataset.th === t)); $('meta[name=theme-color]').content = THEME_COLOR[t]; }
  $$('[data-th]').forEach(b => b.onclick = e => {
    const t = b.dataset.th; if (t === document.documentElement.dataset.theme) return; tick();
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return applyTheme(t);
    const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)), tr = document.startViewTransition(() => applyTheme(t));
    tr.ready.then(() => document.documentElement.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  });
  $('#st-online').checked = S.pc; $('#st-online').onchange = e => { S.pc = e.target.checked; store.set('wex-pc', S.pc); };
  $('#st-haptic').checked = S.haptic; $('#st-haptic').onchange = e => { S.haptic = e.target.checked; store.set('wex-haptic', S.haptic); };
  let deferred; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#btn-install').hidden = false; });
  $('#btn-install').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btn-install').hidden = true; };
  function offlineState() {
    const el = $('#offline-state'), ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!('serviceWorker' in navigator)) return el.textContent = 'Este navegador no permite usar la app sin conexión.';
    navigator.serviceWorker.ready.then(() => { el.textContent = '✓ Lista para usar sin internet. La biblioteca de ' + S.lib.length + ' moléculas y el editor están guardados en tu dispositivo.' + (ios ? ' Para instalarla en iPhone/iPad: Compartir → «Agregar a pantalla de inicio».' : ''); });
  }
  addEventListener('online', () => { toast('Conexión recuperada'); renderList(true); }); addEventListener('offline', () => { toast('Sin conexión · la biblioteca sigue disponible'); renderList(true); });

  // ---------- arranque ----------
  (async function init() {
    applyTheme(document.documentElement.dataset.theme || 'oscuro'); splash(18, 'Cargando biblioteca…');
    try {
      const d = await (await fetch('assets/biblioteca.json')).json(); splash(55, 'Indexando ' + d.mols.length + ' compuestos…');
      await new Promise(r => setTimeout(r, 30)); indexLib(d); renderChips(); renderList(true); splash(85, 'Preparando el laboratorio…');
    } catch (e) { $('#list').innerHTML = '<p class="empty">No se pudo cargar la biblioteca. Abre la app con internet una vez.</p>'; }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); offlineState();
    V.setMol({ atoms: [], bonds: [] }); info(); selectTool('move'); seen.clear(); splash(100, 'Listo');
    setTimeout(() => { const s = $('#splash'); s.classList.add('out'); setTimeout(() => s.remove(), 600); }, Math.max(0, 900 - (performance.now() - t0)));
  })();
  window.__wex = { S, V, openEntry, setMolecule, info };
})();

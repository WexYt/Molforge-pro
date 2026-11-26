/* WEX MolForge Pro v0.8.2 beta · app.js — interfaz móvil, tableta y escritorio (MIT) */
(function () {
  const C = Chem, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], EL = C.EL;
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  const t0 = performance.now(), PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug', uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const S = { lib: [], cats: [], byCanon: new Map(), cat: 'Todas', q: '', list: [], shown: 0, sub: 'lib', fam: 'frec', undo: [], redo: [], tool: 'move', cur: { name: '', formula: '' }, sess: { id: uid(), kind: 'crea' },
    pc: store.get('wex-pc', true), haptic: store.get('wex-haptic', true), opts: Object.assign({ showH: true, labels: false, spin: false, elastic: true }, store.get('wex-opts', {})),
    hist: store.get('wex-hist', []), mine: store.get('wex-mine', []),
    sug: store.get('wex-sugerencias', []), comm: { ts: 0, items: null },
    // Fondo del PNG al descargar (punto 2 v0.8.2): color CSS o 'transparent'.
    pngBg: store.get('wex-pngbg', '#0d1526') };
  const P = Object.assign({ xp: 0, done: {}, c: {}, f: {}, disc: {}, opened: {}, themes: {}, fams: {} }, store.get('wex-prog', {}));
  const saveP = () => store.set('wex-prog', P), wide = () => matchMedia('(min-width:720px)').matches, desk = () => matchMedia('(min-width:1000px)').matches;

  // ---------- utilidades ----------
  let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800); }
  const tick = () => { if (S.haptic && navigator.vibrate) navigator.vibrate(8); };
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'molecula';
  const online = () => navigator.onLine !== false;
  const splash = (p, msg) => { $('#splash-bar').style.width = p + '%'; if (msg) $('#splash-msg').textContent = msg; };
  function lev1(a, b) { if (Math.abs(a.length - b.length) > 1) return false; let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; } else { if (++d > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } } } return d + (a.length - i) + (b.length - j) <= 1; }
  const dotsOf = e => { const c = {}; e.a.forEach(x => c[x] = (c[x] || 0) + 1); const k = Object.keys(c).sort((a, b) => c[b] - c[a]); if (e.f.includes('H') && !c.H) k.push('H'); return k.slice(0, 4); };
  const dotsHTML = els => '<span class="dots">' + els.map(x => '<i style="background:' + EL[x][5] + '"></i>').join('') + '</span>';
  const pack = m => ({ a: m.atoms.map(a => [a.el, +a.x.toFixed(3), +a.y.toFixed(3), +a.z.toFixed(3)]), b: m.bonds });
  const unpack = p => ({ atoms: p.a.map(a => ({ el: a[0], x: a[1], y: a[2], z: a[3] })), bonds: p.b.map(b => b.slice()) });
  const KIND = { crea: ['Creada por ti', 'i-atom'], mod: ['Modificada', 'i-wand'], bib: ['Biblioteca', 'i-explore'], pub: ['Buscada en PubChem', 'i-globe'], imp: ['Importada', 'i-up'], mine: ['Guardada', 'i-save'] };
  const badge = (k, extra) => '<span class="badge ' + (k === 'mine' ? 'bib' : k) + '"><svg class="ic"><use href="#' + KIND[k][1] + '"/></svg>' + KIND[k][0] + (extra || '') + '</span>';
  const fmtTime = ts => new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), fmtDate = ts => new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  function dayLabel(ts) { const d = new Date(ts), n = new Date(), y = new Date(Date.now() - 864e5); return d.toDateString() === n.toDateString() ? 'Hoy' : d.toDateString() === y.toDateString() ? 'Ayer' : fmtDate(ts); }

  // ---------- retos y progreso ----------
  const LV = ['Aprendiz', 'Explorador', 'Alquimista', 'Químico', 'Maestro', 'Arquitecto molecular', 'Leyenda'];
  // Umbrales fijos de nivel (ADR-004): el nivel 7 es exactamente 950 XP, la suma
  // de los 16 retos. No hay nivel 8.
  const LVXP = [0, 100, 250, 420, 620, 800, 950];
  // Emblemas de nivel (SVG en línea, uno por nivel).
  const EMBLEMS = [
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#2f6fed"/><path d="M28 12h8v14l9 15a7 7 0 0 1-6 10H25a7 7 0 0 1-6-10l9-15z" fill="#fff"/><path d="M25 36h14l3 5a3 3 0 0 1-2.6 4.5H24.6A3 3 0 0 1 22 41z" fill="#7dd3fc"/></svg>',
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#0ea5a4"/><circle cx="32" cy="32" r="16" fill="none" stroke="#fff" stroke-width="3"/><path d="M32 16l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#fff"/></svg>',
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#8b5cf6"/><path d="M32 12l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="#fff"/></svg>',
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#059669"/><path d="M32 14l15 9v18l-15 9-15-9V23z" fill="none" stroke="#fff" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#fff"/><circle cx="32" cy="23" r="3" fill="#fff"/><circle cx="24" cy="36.5" r="3" fill="#fff"/><circle cx="40" cy="36.5" r="3" fill="#fff"/></svg>',
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#d97706"/><circle cx="32" cy="32" r="7" fill="#fff"/><ellipse cx="32" cy="32" rx="22" ry="9" fill="none" stroke="#fff" stroke-width="2.5" transform="rotate(-25 32 32)"/><ellipse cx="32" cy="32" rx="22" ry="9" fill="none" stroke="#fff" stroke-width="2.5" transform="rotate(25 32 32)"/></svg>',
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#db2777"/><circle cx="22" cy="24" r="5" fill="#fff"/><circle cx="42" cy="22" r="5" fill="#fff"/><circle cx="32" cy="44" r="5" fill="#fff"/><path d="M22 24l20-2M22 24l10 20M42 22l-10 22" stroke="#fff" stroke-width="2.5"/></svg>',
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#f59e0b"/><path d="M14 44l-3-12 10 4 7-12 4 10 6-8 4 12 10-4-3 12a8 8 0 0 1-8 6H22a8 8 0 0 1-8-6z" fill="#fff"/><circle cx="32" cy="52" r="2.5" fill="#fff"/></svg>'
  ];
  const emblem = l => EMBLEMS[Math.min(EMBLEMS.length - 1, Math.max(0, l - 1))];
  const level = () => { let l = 1; for (let i = 1; i < LVXP.length; i++) if (P.xp >= LVXP[i]) l = i + 1; return l; };
  const lvName = l => LV[Math.min(LV.length - 1, l - 1)];
  // Logro final: se desbloquea al completar los 16 retos o al llegar a 950 XP.
  const finalUnlocked = () => MIS.every(m => P.done[m.id]) || P.xp >= 950;
  // Repara partidas guardadas: el XP nunca puede ser menor que la suma de los
  // retos cumplidos (+15 por cada descubrimiento).
  function repairXP() {
    const expected = MIS.reduce((t, m) => t + (P.done[m.id] ? m.xp : 0), 0) + 15 * Object.keys(P.disc).length;
    if (P.xp < expected) { P.xp = expected; saveP(); }
    return expected;
  }
  const MIS = [
    { id: 'primer-atomo', t: 'Primer átomo', d: 'Coloca un átomo en el lienzo.', goal: 1, xp: 40, get: () => P.c.atoms || 0 },
    { id: 'primera-molecula', t: 'Primera molécula', d: 'Crea desde cero una molécula de 3 o más átomos.', goal: 1, xp: 60, get: () => P.f.mol3 ? 1 : 0 },
    { id: 'doble-enlace', t: 'Doble enlace', d: 'Construye un enlace doble.', goal: 1, xp: 50, get: () => P.f.dbl ? 1 : 0 },
    { id: 'triple-enlace', t: 'Triple enlace', d: 'Construye un enlace triple.', goal: 1, xp: 50, get: () => P.f.tri ? 1 : 0 },
    { id: 'anillo', t: 'Cierra un anillo', d: 'Crea una molécula con un anillo.', goal: 1, xp: 70, get: () => P.f.ring ? 1 : 0 },
    { id: 'elementos-5', t: 'Cinco elementos', d: 'Usa 5 elementos distintos en una misma molécula.', goal: 5, xp: 80, get: () => P.c.maxEl || 0 },
    { id: 'explorador', t: 'Explorador', d: 'Abre 10 moléculas distintas de la biblioteca.', goal: 10, xp: 60, get: () => Object.keys(P.opened).length },
    { id: 'descubre-3', t: 'Descubridor', d: 'Construye tú mismo 3 moléculas de la biblioteca (la app las reconoce).', goal: 3, xp: 100, get: () => Object.keys(P.disc).length },
    { id: 'guardar-3', t: 'Coleccionista', d: 'Guarda 3 moléculas en tu dispositivo.', goal: 3, xp: 60, get: () => P.c.saved || 0 },
    { id: 'forma-10', t: 'Escultor', d: 'Arrastra átomos 10 veces para darles forma.', goal: 10, xp: 60, get: () => P.c.drags || 0 },
    { id: 'pubchem-1', t: 'Explorador de PubChem', d: 'Busca un compuesto en PubChem (necesita internet).', goal: 1, xp: 50, get: () => P.c.pub || 0 },
    { id: 'temas-3', t: 'Camaleón', d: 'Prueba los tres temas visuales.', goal: 3, xp: 40, get: () => Object.keys(P.themes).length },
    { id: 'tabla-5', t: 'Tabla periódica', d: 'Elige elementos de 5 familias distintas.', goal: 5, xp: 80, get: () => Object.keys(P.fams).length },
    { id: 'reglas-3', t: 'Farmacéutico', d: 'Consulta las reglas de fármaco 3 veces.', goal: 3, xp: 60, get: () => P.c.rules || 0 },
    { id: 'historial-5', t: 'Cronista', d: 'Acumula 5 moléculas en tu historial.', goal: 5, xp: 50, get: () => S.hist.length },
    { id: 'descargar-1', t: 'Exportador', d: 'Descarga una molécula (SDF, MOL, XYZ, JSON o PNG).', goal: 1, xp: 40, get: () => P.c.dl || 0 }];
  const isLocked = e => !!e.u && !P.done[e.u], rewardOf = id => S.lib.find(e => e.u === id), misOf = id => MIS.find(m => m.id === id);
  function renderRetos() {
    const l = level(), done = MIS.filter(m => P.done[m.id]).length, base = LVXP[l - 1], next = l < LVXP.length ? LVXP[l] : null;
    const into = P.xp - base, span = next === null ? 0 : next - base;
    $('#retos-sub').textContent = done + ' de ' + MIS.length + ' retos · ' + P.xp + ' XP';
    $('#lvl').innerHTML = '<div class="lv-emblem">' + emblem(l) + '</div><div class="bdg">' + l + '</div><div class="t"><b>' + lvName(l) + '</b><small>' + (next === null ? 'Nivel máximo · ' + P.xp + ' XP' : into + ' / ' + span + ' XP para el nivel ' + (l + 1)) + '</small><div class="meter"><i style="width:' + (next === null ? 100 : Math.round(into / span * 100)) + '%"></i></div></div>';
    $('#missions').innerHTML = MIS.map(m => {
      const g = Math.min(m.get(), m.goal), ok = !!P.done[m.id], r = rewardOf(m.id);
      return '<div class="mis' + (ok ? ' done' : '') + (S.popId === m.id ? ' pop' : '') + '"><span class="st">' + (ok ? '<svg class="ic" style="width:18px;height:18px"><use href="#i-check"/></svg>' : g + '/' + m.goal) + '</span><div><b>' + m.t + '</b><small>' + m.d + '</small><div class="rw">' + (ok ? 'Desbloqueaste: ' + (r ? r.n : '') : 'Premio: un compuesto misterioso · +' + m.xp + ' XP') + '</div></div></div>';
    }).join(''); S.popId = null;
    $('#unlocks').innerHTML = S.lib.filter(e => e.u).map(e => isLocked(e) ? '<div class="utile"><svg class="ic"><use href="#i-lock"/></svg><b>???</b><small>' + misOf(e.u).t + '</small></div>' : '<button class="utile on" data-s="' + e.s + '">' + dotsHTML(e.dots) + '<b>' + e.n + '</b><small>' + e.f + '</small></button>').join('');
    $$('#unlocks .utile[data-s]').forEach(b => b.onclick = () => openEntry(S.lib.find(e => e.s === b.dataset.s)));
    $('#disc').innerHTML = '<b style="color:var(--fg)">' + Object.keys(P.disc).length + ' de ' + S.lib.length + '</b> compuestos descubiertos. Cuentan cuando construyes tú mismo una molécula y la app la reconoce (abrirla de la biblioteca o buscarla en PubChem no cuenta).';
    const fu = finalUnlocked(), fb = $('#final-unlock');
    fb.innerHTML = fu
      ? '<div class="final-top"><div class="lv-emblem">' + emblem(7) + '</div><div><b>Logro final desbloqueado</b><small>Capas de electrones y orbitales 3D s, p, d y f</small></div></div><button class="sheet-btn" id="fu-go">Ver orbitales</button>'
      : '<div class="final-top"><svg class="ic" style="width:26px;height:26px;flex:none"><use href="#i-lock"/></svg><div><b>Logro final: orbitales 3D</b><small>Completa los 16 retos (' + done + '/16) o llega a 950 XP (' + P.xp + '/950)</small></div></div>';
    const gob = $('#fu-go'); if (gob) gob.onclick = () => { go('orbitales'); tick(); };
  }
  // Celebración de nivel/logro: se ve ~2.6 s; si llega otra, se pone en cola.
  let celebQ = [], celebBusy = false;
  function showCelebration(title, sub, svg) { celebQ.push([title, sub, svg]); if (!celebBusy) nextCeleb(); }
  function nextCeleb() { const c = celebQ.shift(); if (!c) { celebBusy = false; return; } celebBusy = true; const el = $('#celebrate'); el.innerHTML = '<div class="cel-emblem">' + c[2] + '</div><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span>'; el.classList.add('show'); tick(); if (navigator.vibrate && S.haptic) navigator.vibrate([20, 60, 30]); setTimeout(() => { el.classList.remove('show'); setTimeout(nextCeleb, 350); }, 2600); }
  function addXP(n) { const a = level(); P.xp += n; if (level() > a) { const l = level(); setTimeout(() => showCelebration('¡Nivel ' + l + '!', lvName(l), emblem(l)), 600); } }
  function evaluate() {
    let any = false;
    MIS.forEach(m => { if (!P.done[m.id] && m.get() >= m.goal) { P.done[m.id] = Date.now(); addXP(m.xp); any = true; const r = rewardOf(m.id); toast('Reto cumplido: ' + m.t + (r ? ' · ¡' + r.n + ' desbloqueado!' : '') + ' +' + m.xp + ' XP'); if (navigator.vibrate && S.haptic) navigator.vibrate([10, 40, 14]); S.popId = m.id; } });
    if (any) { saveP(); if (S.lib.length) { buildChips(); renderList(true); } if ($('#tab-retos').classList.contains('on')) renderRetos(); }
    if (finalUnlocked() && !P.f.orb) { P.f.orb = 1; saveP(); showCelebration('¡Logro final!', 'Orbitales 3D desbloqueados', emblem(7)); toast('¡Logro final! Ya puedes ver las capas de electrones y los orbitales 3D'); if ($('#tab-orbitales').classList.contains('on')) renderOrbitales(); }
  }
  const bump = (k, n) => { P.c[k] = (P.c[k] || 0) + (n || 1); saveP(); evaluate(); };
  function discover(e) { if (P.disc[e.s]) return; P.disc[e.s] = Date.now(); addXP(15); saveP(); toast('¡Descubriste ' + e.n + '! +15 XP'); evaluate(); }

  // ---------- navegación ----------
  function go(name) {
    if (wide() && name === 'lab') { requestAnimationFrame(() => V.resize()); return; }
    $$('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + name)); $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.go === name));
    if (name === 'retos') renderRetos(); if (name === 'orbitales') renderOrbitales(); if (name === 'ajustes') { renderSug(); loadCommunity(false); } if (name === 'lab') requestAnimationFrame(() => V.resize());
  }
  $$('#tabbar button').forEach(b => b.onclick = () => { go(b.dataset.go); tick(); });
  function setSub(s) {
    S.sub = s; ['lib', 'mine', 'hist'].forEach(k => $('#sub-' + k).hidden = k !== s); $$('#seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.sub === s));
    $('#exp-title').textContent = { lib: 'Biblioteca', mine: 'Mis moléculas', hist: 'Historial' }[s]; if (s === 'mine') renderMine(); if (s === 'hist') renderHist();
  }
  $$('#seg button').forEach(b => b.onclick = () => { setSub(b.dataset.sub); tick(); });
  const fixWide = () => { if (wide() && $('#tab-lab').classList.contains('on')) go('explorar'); setTimeout(() => V.resize(), 60); }; addEventListener('resize', fixWide);

  // ---------- orbitales 3D (logro final) ----------
  function renderOrbitales() {
    const fu = finalUnlocked(), done = MIS.filter(m => P.done[m.id]).length;
    $('#orb-locked').hidden = fu; $('#orb-unlocked').hidden = !fu;
    if (!fu) { $('#orb-locked-txt').textContent = 'Completa los 16 retos (' + done + '/16) o llega a 950 XP (' + P.xp + '/950) para desbloquear las capas de electrones y los orbitales 3D.'; return; }
    if (!window.Orb) { $('#orb-cfg').textContent = 'No se pudo cargar el módulo de orbitales.'; return; }
    const sel = $('#orb-el');
    if (!sel.options.length) sel.innerHTML = C.ZORDER.map(e => '<option value="' + EL[e][6] + '">' + EL[e][6] + ' · ' + EL[e][0] + ' (' + e + ')</option>').join('');
    if (!S.orbZ) { const m = V.getMol(), first = m.atoms.find(a => a.el !== 'H'); S.orbZ = first ? EL[first.el][6] : 26; }
    sel.value = String(S.orbZ);
    if (!S.orbView) S.orbView = Orb.OrbView($('#orb-cv'));
    const draw = () => {
      const z = +sel.value; S.orbZ = z; S.orbMode = S.orbMode || 'shells';
      const cfg = Orb.configString(z), sh = Orb.shells(z).filter(Boolean);
      $('#orb-cfg').innerHTML = '<b>' + EL[C.ZORDER[z - 1]][0] + ' (' + C.ZORDER[z - 1] + ') · Z ' + z + '</b><br>Configuración: ' + cfg + '<br>Capas K L M N O P Q: ' + sh.join(' · ') + ' electrones<br>Electrones de valencia: ' + Orb.valence(z);
      const subs = Object.keys(Orb.config(z)).map(k => k[1]).filter((v, i, a) => a.indexOf(v) === i);
      $('#orb-modes').innerHTML = '<button data-m="shells" class="' + (S.orbMode === 'shells' ? 'on' : '') + '">Capas 3D</button>' + subs.map(l => '<button data-m="' + l + '" class="' + (S.orbMode === l ? 'on' : '') + '">Orbital ' + l + '</button>').join('');
      $$('#orb-modes button').forEach(b => b.onclick = () => { S.orbMode = b.dataset.m; S.orbVar = 'all'; draw(); tick(); });
      const mode = S.orbMode;
      if (mode === 'shells') { $('#orb-vars').innerHTML = '<span class="muted small">Arrastra para girar · pellizca o usa la rueda para acercar.</span>'; S.orbView.setMode('shells'); }
      else {
        const vs = Orb.FN[mode];
        if (vs.length === 1) S.orbVar = 0; // 's' solo tiene una variante: 'Todos' sería el mismo botón
        $('#orb-vars').innerHTML = (vs.length > 1 ? '<button data-v="all" class="' + (S.orbVar === 'all' ? 'on' : '') + '">Todos</button>' : '') + vs.map((v, i) => '<button data-v="' + i + '" class="' + (String(S.orbVar) === String(i) ? 'on' : '') + '">' + v[0] + '</button>').join('');
        $$('#orb-vars button').forEach(b => b.onclick = () => { S.orbVar = b.dataset.v === 'all' ? 'all' : +b.dataset.v; draw(); tick(); });
        S.orbView.setMode(mode, S.orbVar === undefined ? 'all' : S.orbVar);
      }
      S.orbView.setElement(z);
      requestAnimationFrame(() => S.orbView && S.orbView.resize());
    };
    sel.onchange = () => { S.orbMode = 'shells'; S.orbVar = 'all'; draw(); tick(); };
    draw();
  }
  $('#orb-goto-retos').onclick = () => { go('retos'); tick(); };

  // ---------- biblioteca y buscador ----------
  function indexLib(d) {
    S.cats = d.cats; S.lib = d.mols.map(e => { e.nk = norm(e.n); e.words = e.nk.split(/[\s\-()]+/).filter(Boolean); e.fk = e.f.toLowerCase(); e.ck = norm(e.c); e.dots = dotsOf(e); return e; });
    S.lib.forEach(e => S.byCanon.set(C.canon({ atoms: e.a.map(el => ({ el, x: 0, y: 0, z: 0 })), bonds: e.b }), e));
  }
  function countText() { const lk = S.lib.filter(isLocked).length; $('#count').textContent = (S.lib.length - lk) + ' compuestos' + (lk ? ' · ' + lk + ' por desbloquear' : '') + ' · sin conexión'; }
  function buildChips() {
    countText(); const vis = S.lib.filter(e => !isLocked(e)), cnt = c => c === 'Desbloqueables' ? S.lib.filter(e => e.c === c).length : vis.filter(e => e.c === c).length, all = [['Todas', vis.length]].concat(S.cats.map(c => [c, cnt(c)]));
    $('#chips').innerHTML = all.map(([c, n]) => '<button role="tab" aria-selected="' + (c === S.cat) + '" data-c="' + c + '">' + (c === 'Desbloqueables' ? '🔒 ' : '') + c + ' <small>' + n + '</small></button>').join('');
    $$('#chips button').forEach(b => b.onclick = () => { S.cat = b.dataset.c; buildChips(); renderList(true); tick(); b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); });
  }
  function filtered() {
    const q = norm(S.q.trim()), qf = q.replace(/\s/g, ''); let L = S.cat === 'Todas' ? S.lib.filter(e => !isLocked(e)) : S.lib.filter(e => e.c === S.cat); if (!q) return L;
    const sc = e => e.nk === q ? 100 : e.fk === qf ? 95 : e.nk.startsWith(q) ? 80 : e.words.some(w => w.startsWith(q)) ? 60 : e.nk.includes(q) ? 40 : e.ck.includes(q) || e.fk.includes(qf) ? 20 : 0;
    L = L.filter(e => !isLocked(e)); let r = L.map(e => [sc(e), e]).filter(x => x[0]);
    if (!r.length && q.length >= 3) r = L.filter(e => e.words.some(w => lev1(w, q) || lev1(w.slice(0, q.length), q))).map(e => [10, e]);
    return r.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n, 'es')).map(x => x[1]);
  }
  function rowHTML(e, i, anim) {
    if (isLocked(e)) return '<button class="item locked' + (anim ? ' in' : '') + '" style="--i:' + i + '" data-lock="' + e.u + '"><span class="dots"><svg class="ic" style="width:24px;height:24px"><use href="#i-lock"/></svg></span><span class="t"><b>Compuesto bloqueado</b><small>Reto: ' + misOf(e.u).t + '</small></span><svg class="ic chev"><use href="#i-chev"/></svg></button>';
    return '<button class="item' + (anim ? ' in' : '') + '" style="--i:' + i + '" data-s="' + e.s + '">' + dotsHTML(e.dots) + '<span class="t"><b>' + e.n + (P.disc[e.s] ? '<svg class="ic check" aria-label="Descubierta"><use href="#i-check"/></svg>' : '') + '</b><small>' + e.f + ' · ' + e.c + '</small></span><svg class="ic chev"><use href="#i-chev"/></svg></button>';
  }
  function pcRow() {
    const q = S.q.trim(); if (q.length < 3) return '';
    return '<button class="item" id="pc-row"' + (online() ? '' : ' disabled') + '><span class="dots"><svg class="ic"><use href="#i-globe"/></svg></span><span class="t"><b>Buscar «' + esc(q) + '» en PubChem</b><small>' + (online() ? 'Se marcará en tu historial como buscada, no creada' : 'Sin conexión: solo la biblioteca local') + '</small></span><svg class="ic chev"><use href="#i-chev"/></svg></button>';
  }
  function renderList(reset) {
    const box = $('#list'); if (reset) { S.list = filtered(); S.shown = 0; box.innerHTML = ''; }
    const next = S.list.slice(S.shown, S.shown + 30); box.insertAdjacentHTML('beforeend', next.map((e, i) => rowHTML(e, i, reset && S.shown === 0 && i < 12)).join('')); S.shown += next.length;
    if (S.shown >= S.list.length && !$('#pc-row') && S.cat !== 'Desbloqueables') box.insertAdjacentHTML('beforeend', pcRow());
    if (!S.list.length && S.q.trim()) box.insertAdjacentHTML('afterbegin', '<p class="empty">No hay coincidencias en la biblioteca local.</p>');
    $$('#list .item[data-s]').forEach(b => b.onclick = b.onclick || (() => openEntry(S.lib.find(e => e.s === b.dataset.s))));
    $$('#list .item[data-lock]').forEach(b => b.onclick = b.onclick || (() => { const m = misOf(b.dataset.lock); toast('Reto «' + m.t + '»: ' + m.d); go('retos'); }));
    const pc = $('#pc-row'); if (pc) pc.onclick = () => fromPubChem(S.q.trim());
  }
  new IntersectionObserver(en => { if (en[0].isIntersecting && S.shown < S.list.length) renderList(false); }, { rootMargin: '300px' }).observe($('#sentinel'));
  let qT; $('#q').addEventListener('input', e => { S.q = e.target.value; $('#qclear').hidden = !S.q; clearTimeout(qT); qT = setTimeout(() => renderList(true), 120); });
  $('#qclear').onclick = () => { $('#q').value = ''; S.q = ''; $('#qclear').hidden = true; renderList(true); $('#q').focus(); };

  // ---------- historial ----------
  function logNow(forceName) {
    const m = V.getMol(); if (!m.atoms.length || (m.atoms.length < 2 && !forceName)) return;
    const s = S.sess, name = forceName || S.cur.name || 'Molécula nueva', d = C.descr(m), i = S.hist.findIndex(h => h.id === s.id);
    const rec = { id: s.id, ts: Date.now(), name, f: d.formula, k: s.kind, cid: s.cid || 0, base: s.base || '', m: pack(m) };
    if (i >= 0) S.hist[i] = rec; else S.hist.unshift(rec);
    S.hist = S.hist.slice(0, 80); if (!store.set('wex-hist', S.hist)) { S.hist = S.hist.slice(0, 30); store.set('wex-hist', S.hist); }
    if (S.sub === 'hist') renderHist(); evaluate();
  }
  const logSoon = () => { clearTimeout(S.lt); S.lt = setTimeout(() => logNow(), 3500); };
  function renderHist() {
    const box = $('#hist-list'); if (!S.hist.length) return box.innerHTML = '<p class="empty">Aún no hay moléculas en el historial.<br>Abre, crea o busca una y aparecerá aquí.</p>';
    let day = '', html = '';
    S.hist.forEach(h => { const dl = dayLabel(h.ts); if (dl !== day) { day = dl; html += '<div class="day">' + dl + '</div>'; }
      html += '<button class="item" data-h="' + h.id + '"><span class="t"><b>' + esc(h.name) + '</b><small>' + h.f + ' · ' + badge(h.k, h.k === 'pub' && h.cid ? ' · CID ' + h.cid : h.k === 'mod' && h.base ? ' · base: ' + esc(h.base) : '') + '</small></span><span class="time">' + fmtTime(h.ts) + '<br>' + fmtDate(h.ts) + '</span></button>'; });
    html += '<button class="sheet-btn danger" id="hist-clear" style="margin-top:10px">Borrar historial</button>'; box.innerHTML = html;
    $$('#hist-list [data-h]').forEach(b => b.onclick = () => openRecord(S.hist.find(h => h.id === b.dataset.h)));
    $('#hist-clear').onclick = clearHist;
  }
  function clearHist() { openSheet('<h3>¿Borrar el historial?</h3><p class="muted small">Se borran los registros de este dispositivo. Tus moléculas guardadas y tus retos no se tocan.</p><div class="stack"><button class="sheet-btn danger" id="y">Borrar</button><button class="sheet-btn" id="n">Cancelar</button></div>'); $('#n').onclick = closeSheet; $('#y').onclick = () => { S.hist = []; store.set('wex-hist', []); closeSheet(); renderHist(); toast('Historial borrado'); }; }
  $('#st-clear-hist').onclick = clearHist;

  // ---------- Mis moléculas (biblioteca del dispositivo) ----------
  const saveMine = () => { if (!store.set('wex-mine', S.mine)) toast('No hay espacio para guardar más en este dispositivo'); $('#n-mine').textContent = S.mine.length ? S.mine.length : ''; };
  function renderMine() {
    const box = $('#mine-list'); if (!S.mine.length) return box.innerHTML = '<p class="empty">Todavía no guardas moléculas.<br>En el laboratorio toca el botón de marcador para guardar la actual.</p>';
    box.innerHTML = S.mine.map(r => '<div class="item" data-m="' + r.id + '" role="button" tabindex="0"><span class="t"><b>' + esc(r.name) + '</b><small>' + r.f + ' · ' + badge(r.k, r.k === 'pub' && r.cid ? ' · CID ' + r.cid : '') + '</small></span><span class="time">' + fmtTime(r.ts) + '<br>' + fmtDate(r.ts) + '</span><button class="more" data-more="' + r.id + '" aria-label="Opciones"><svg class="ic"><use href="#i-dots"/></svg></button></div>').join('');
    $$('#mine-list [data-m]').forEach(b => b.onclick = e => { if (e.target.closest('.more')) return; openRecord(S.mine.find(r => r.id === b.dataset.m), 'mine'); });
    $$('#mine-list [data-more]').forEach(b => b.onclick = () => sheetMineItem(S.mine.find(r => r.id === b.dataset.more)));
  }
  function sheetSave() {
    const m = V.getMol(); if (!m.atoms.length) return openSheet('<h3>Guardar</h3><p class="muted">Crea o abre una molécula primero.</p>');
    const dn = S.cur.name && S.cur.name !== 'Molécula nueva' ? S.cur.name : '', pub = S.sess.kind === 'pub';
    openSheet('<h3>Guardar en este dispositivo</h3>' + (pub ? '<div class="banner" style="margin:0 0 12px">Esta molécula viene de <b>PubChem</b> (buscada, no creada). Se guardará marcada así.</div>' : '') + '<input class="sheet-in" id="sv-name" maxlength="60" placeholder="Nombre de la molécula" value="' + esc(dn) + '"><div class="stack"><button class="sheet-btn" id="sv-ok" style="justify-content:center;background:var(--primary);color:var(--on);border-color:transparent">Guardar</button></div>');
    $('#sv-ok').onclick = () => {
      const name = ($('#sv-name').value || '').trim() || 'Molécula sin nombre', d = C.descr(m);
      S.mine.unshift({ id: uid(), ts: Date.now(), name, f: d.formula, k: S.sess.kind, cid: S.sess.cid || 0, m: pack(m) }); saveMine(); closeSheet(); toast('Guardada en tu dispositivo'); tick(); bump('saved');
    };
  }
  function sheetMineItem(r) {
    openSheet('<h3>' + esc(r.name) + '</h3><div class="stack"><button class="sheet-btn" id="a-open">Abrir en el laboratorio</button><button class="sheet-btn" id="a-ren">Cambiar nombre</button><button class="sheet-btn" id="a-sdf">Descargar SDF</button><button class="sheet-btn danger" id="a-del">Eliminar</button></div>');
    $('#a-open').onclick = () => { closeSheet(); openRecord(r, 'mine'); };
    $('#a-ren').onclick = () => { openSheet('<h3>Cambiar nombre</h3><input class="sheet-in" id="rn" maxlength="60" value="' + esc(r.name) + '"><button class="sheet-btn" id="rn-ok" style="justify-content:center;background:var(--primary);color:var(--on);border-color:transparent">Guardar nombre</button>'); $('#rn-ok').onclick = () => { r.name = ($('#rn').value || '').trim() || r.name; saveMine(); closeSheet(); renderMine(); }; };
    $('#a-sdf').onclick = () => { save(slug(r.name) + '.sdf', C.toSDF(unpack(r.m), r.name), 'chemical/x-mdl-sdfile'); closeSheet(); };
    $('#a-del').onclick = () => { S.mine = S.mine.filter(x => x.id !== r.id); saveMine(); closeSheet(); renderMine(); toast('Eliminada'); };
  }
  $('#mine-export').onclick = () => { if (!S.mine.length) return toast('No hay nada que respaldar'); save('wex-mis-moleculas.json', JSON.stringify({ app: 'wex-molforge', v: 1, mine: S.mine }), 'application/json'); };
  $('#mine-import').onclick = () => $('#file').click();
  $('#file').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const txt = await f.text();
      if (/\.json$/i.test(f.name)) {
        const j = JSON.parse(txt);
        if (j.mine) { const have = new Set(S.mine.map(x => x.id)); const add = j.mine.filter(x => x.id && x.m && !have.has(x.id)); S.mine = add.concat(S.mine); saveMine(); setSub('mine'); return toast(add.length + ' moléculas importadas'); }
        if (j.atomos) { const m = { atoms: j.atomos.map(a => ({ el: a.el, x: a.x, y: a.y, z: a.z })), bonds: j.enlaces }; setMolecule(m, { name: j.nombre || f.name, kind: 'imp' }); go('lab'); return toast('Importada. Guárdala si quieres conservarla.'); }
        throw new Error('Formato JSON no reconocido');
      }
      const m = C.parseSDF(txt); if (m.atoms.length > 120) throw new Error('Molécula demasiado grande para el editor'); if (m.atoms.every(a => Math.abs(a.z) < 1e-6)) C.layout(m);
      setMolecule(m, { name: f.name.replace(/\.[^.]+$/, ''), kind: 'imp' }); go('lab'); toast('Importada. Guárdala si quieres conservarla.');
    } catch (err) { toast('No se pudo importar: ' + err.message); }
  });

  // ---------- laboratorio ----------
  const cb = {
    snap() { S.undo.push(C.clone(V.getMol())); if (S.undo.length > 80) S.undo.shift(); S.redo = []; btns(); },
    change(r) { btns(); if (['atom', 'bond', 'del', 'el', 'mover', 'forma'].includes(r)) onEdit(r); clearTimeout(cb.t); cb.t = setTimeout(info, ['atom', 'bond', 'del', 'el'].includes(r) ? 30 : 220); },
    live() {}, select() {}, toast, tick
  };
  const V = View($('#cv'), cb); V.setOpts(S.opts);
  const btns = () => { $('#btn-undo').disabled = !S.undo.length; $('#btn-redo').disabled = !S.redo.length; };
  function undo() { if (!S.undo.length) return; S.redo.push(C.clone(V.getMol())); V.setMol(S.undo.pop(), { keepView: true }); btns(); info(); tick(); }
  function redo() { if (!S.redo.length) return; S.undo.push(C.clone(V.getMol())); V.setMol(S.redo.pop(), { keepView: true }); btns(); info(); tick(); }
  $('#btn-undo').onclick = undo; $('#btn-redo').onclick = redo; $('#btn-auto').onclick = () => { V.autoShape(); tick(); toast('Acomodando la forma…'); }; $('#btn-center').onclick = () => { V.fit(); tick(); };

  function onEdit(r) {
    const s = S.sess; if (['bib', 'pub', 'imp', 'mine'].includes(s.kind) && r !== 'forma') S.sess = { id: uid(), kind: 'mod', base: s.base, cid: s.kind === 'pub' ? s.cid : 0, from: s.kind };
    if (r === 'atom') bump('atoms'); if (r === 'mover') bump('drags'); updateOrigin(); logSoon();
  }
  function updateOrigin() {
    const el = $('#origin'), s = S.sess, has = V.getMol().atoms.length > 0; if (!has) return el.hidden = true;
    const extra = s.kind === 'pub' && s.cid ? ' · CID ' + s.cid : s.kind === 'mod' && s.base ? ' · base: ' + esc(s.base) + (s.from === 'pub' ? ' (PubChem)' : '') : '';
    el.className = 'origin ' + (s.kind === 'mine' ? 'bib' : s.kind); el.innerHTML = '<svg class="ic"><use href="#' + KIND[s.kind][1] + '"/></svg>' + KIND[s.kind][0] + extra; el.hidden = false;
  }
  function setMolecule(m, meta) {
    meta = meta || {}; clearTimeout(S.lt); S.sess = { id: uid(), kind: meta.kind || 'crea', base: meta.base || meta.name || '', cid: meta.cid || 0 }; S.meta = meta.name ? { name: meta.name, key: meta.key || '' } : null;
    V.setMol(m, { appear: true, noOrient: !m.atoms.length }); S.undo = []; S.redo = []; btns(); info(); updateOrigin();
    if (meta.kind && meta.kind !== 'crea' && m.atoms.length) { S.cur.name = meta.name || S.cur.name; logNow(S.cur.name); }
  }
  const LAYOUTS = new Map();
  function openEntry(e) {
    if (isLocked(e)) { const m = misOf(e.u); toast('Reto «' + m.t + '»: ' + m.d); return go('retos'); }
    go('lab'); setName('Armando ' + e.n + '…', ''); $('#mchips').innerHTML = '';
    setTimeout(() => {
      let m = LAYOUTS.get(e.s); if (!m) { m = { atoms: e.a.map(el => ({ el, x: 0, y: 0, z: 0 })), bonds: e.b.map(b => b.slice()) }; C.layout(m); LAYOUTS.set(e.s, m); }
      P.opened[e.s] = 1; saveP(); setMolecule(C.clone(m), { name: e.n, kind: 'bib', cid: e.i }); hintOnce('move'); evaluate();
    }, 30);
  }
  function openRecord(r, kind) {
    if (!r) return; go('lab'); const m = unpack(r.m);
    setMolecule(m, { name: r.name, kind: kind || (['pub', 'imp', 'crea', 'mod'].includes(r.k) ? r.k : 'bib'), cid: r.cid, base: r.base, key: C.canon(m) });
    if (!kind && (r.k === 'crea' || r.k === 'mod')) { S.sess.kind = r.k; S.sess.base = r.base; } updateOrigin();
  }
  $('#newcard').onclick = () => { go('lab'); setMolecule({ atoms: [], bonds: [] }); selectTool('atom'); tick(); };

  // nombre, elementos, datos y reglas
  let nameLook = 0; const cache = new Map();
  function setName(n, sub) { const h = $('#mname'); if (h.textContent !== n) { h.textContent = n; h.classList.remove('flip'); void h.offsetWidth; h.classList.add('flip'); } $('#mmeta').textContent = sub || ''; }
  const tilesHTML = d => { const T = (b, s) => '<div class="tile"><b>' + b + '</b><small>' + s + '</small></div>'; return '<div class="tiles">' + T(d.formula, 'Fórmula') + T(d.mw.toFixed(2), 'g/mol') + T(d.total, 'Átomos') + T(d.bonds, 'Enlaces') + T(d.rings, 'Anillos') + T(d.rot, 'Rotables') + T(d.hbd, 'Donadores H') + T(d.hba, 'Aceptores H') + T(d.tpsa.toFixed(0), 'TPSA Å² (aprox.)') + T(d.logp === null || d.logp === undefined ? '—' : d.logp.toFixed(2), 'logP (Moriguchi, est.)') + '</div>'; };
  const rulesHTML = d => '<div class="rules">' + C.rules(d).map(r => '<details class="' + (r.ok ? '' : 'no') + '"><summary><span class="rs"><svg class="ic"><use href="#' + (r.ok ? 'i-check' : 'i-x') + '"/></svg></span>' + r.name + '</summary><div class="cn">' + r.cond.map(c => '<span class="' + (c[2] ? '' : 'bad') + '">' + c[0] + ' · ' + c[1] + '</span>').join('') + '</div><p class="nt">' + r.note + '</p></details>').join('') + '</div>';
  function info() {
    const m = V.getMol(); nameLook++;
    if (!m.atoms.length) { setName('Lienzo vacío', 'Toca el lienzo para colocar tu primer átomo'); $('#mchips').innerHTML = ''; $('#mspin').hidden = true; S.cur = { name: '', formula: '' }; $('#origin').hidden = true; $('#insp-name').textContent = ''; $('#insp-data').innerHTML = '<p class="muted small">Crea o abre una molécula para ver sus datos.</p>'; $('#insp-rules').innerHTML = ''; return; }
    const d = C.descr(m), ks = Object.keys(d.counts).sort((a, b) => a === 'C' ? -1 : b === 'C' ? 1 : a === 'H' ? -1 : b === 'H' ? 1 : a.localeCompare(b));
    $('#mchips').innerHTML = ks.map(k => '<span title="' + EL[k][0] + '"><i style="background:' + EL[k][5] + '"></i>' + k + ' ' + d.counts[k] + '</span>').join('');
    const meta = d.formula + ' · ' + d.mw.toFixed(2) + ' g/mol · ' + d.total + ' átomos', key = C.canon(m), hit = S.byCanon.get(key), kd = S.sess.kind; let nm = '';
    if (hit) { nm = hit.n; $('#mspin').hidden = true; setName(nm, hit.c + ' · ' + meta); if (kd === 'crea' || kd === 'mod') discover(hit); }
    else if (S.meta && (S.meta.key === key || !S.meta.key)) { S.meta.key = key; nm = S.meta.name; $('#mspin').hidden = true; setName(nm, meta); }
    else { nm = 'Molécula nueva'; setName(nm, meta); lookup(m, meta, nameLook); }
    S.cur = { name: nm, formula: d.formula };
    if (kd === 'crea' || kd === 'mod') { if (d.heavy >= 3) P.f.mol3 = 1; if (m.bonds.some(b => b[2] === 2)) P.f.dbl = 1; if (m.bonds.some(b => b[2] === 3)) P.f.tri = 1; if (d.rings >= 1) P.f.ring = 1; P.c.maxEl = Math.max(P.c.maxEl || 0, ks.length); saveP(); evaluate(); }
    $('#insp-name').textContent = nm; if (desk()) { $('#insp-data').innerHTML = tilesHTML(d); $('#insp-rules').innerHTML = rulesHTML(d); }
  }
  async function lookup(m, meta, id) {
    $('#mspin').hidden = true; if (!S.pc || !online() || m.atoms.length > 70) return;
    let smi; try { smi = C.toSmiles(m); } catch (e) { return; } $('#mspin').hidden = false;
    try {
      let nm = cache.get(smi);
      if (nm === undefined) {
        const r = await fetch(PUG + '/compound/smiles/cids/JSON', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'smiles=' + encodeURIComponent(smi) }); const j = await r.json(), cid = j.IdentifierList && j.IdentifierList.CID[0];
        if (!r.ok || !cid) nm = null; else { const p = await (await fetch(PUG + '/compound/cid/' + cid + '/property/Title/JSON')).json(); nm = p.PropertyTable.Properties[0].Title; nm = nm.charAt(0).toUpperCase() + nm.slice(1); }
        cache.set(smi, nm);
      }
      if (id === nameLook && nm) { setName(nm, 'PubChem · ' + meta); S.cur.name = nm; $('#insp-name').textContent = nm; }
    } catch (e) { /* sin red */ }
    if (id === nameLook) $('#mspin').hidden = true;
  }

  // herramientas, enlaces y elementos
  const HINTS = { move: 'Arrastra un átomo para darle forma · arrastra el fondo para girar', atom: 'Toca el lienzo para colocar un átomo o toca uno para añadir otro unido', bond: 'Arrastra de un átomo a otro para unirlos · toca un enlace para cambiar su orden', erase: 'Toca un átomo o un enlace para borrarlo' };
  let hT; const seen = new Set();
  function hintOnce(t) { if (seen.has(t)) return; seen.add(t); const h = $('#hint'); h.textContent = HINTS[t]; h.hidden = false; clearTimeout(hT); hT = setTimeout(() => h.hidden = true, 4200); }
  function selectTool(t) { S.tool = t; V.setTool(t); $$('[data-tool]').forEach(b => b.setAttribute('aria-checked', b.dataset.tool === t)); hintOnce(t); }
  $$('[data-tool]').forEach(b => b.onclick = () => { selectTool(b.dataset.tool); tick(); });
  $$('[data-order]').forEach(b => b.onclick = () => { V.setOrder(+b.dataset.order); $$('[data-order]').forEach(x => x.setAttribute('aria-checked', x === b)); if (S.tool === 'move' || S.tool === 'erase') selectTool('bond'); tick(); });
  const FAM = C.FAMILIES, famOf = e => EL[e][7];
  function drawFams() { $('#fams').innerHTML = FAM.map(f => '<button role="tab" data-f="' + f[0] + '" aria-selected="' + (f[0] === S.fam) + '">' + f[1] + '</button>').join(''); $$('#fams button').forEach(b => b.onclick = () => { S.fam = b.dataset.f; drawFams(); drawPalette(); tick(); b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }); }
  function drawPalette() {
    const cur = V.getElement(), els = FAM.find(f => f[0] === S.fam)[2];
    $('#palette').innerHTML = els.map(e => '<button role="radio" data-el="' + e + '" aria-checked="' + (e === cur) + '" title="' + EL[e][0] + '"><i style="background:' + EL[e][5] + '"></i>' + e + '<small>' + EL[e][6] + '</small></button>').join('');
    $$('#palette button').forEach(b => b.onclick = () => pick(b.dataset.el));
  }
  function pick(e) {
    V.setElement(e); P.fams[famOf(e)] = 1; saveP(); drawPalette();
    if (S.tool === 'move' && V.getSel() >= 0) V.replaceElement(V.getSel(), e); else if (S.tool !== 'atom' && S.tool !== 'bond') selectTool('atom'); tick(); evaluate();
  }

  // ---------- hojas inferiores ----------
  const sheet = $('#sheet'), scrim = $('#scrim');
  function openSheet(html) { $('#sheet-body').innerHTML = html; scrim.hidden = false; sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); sheet.style.transform = ''; sheet.scrollTop = 0; }
  function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); sheet.style.transform = ''; scrim.hidden = true; }
  scrim.onclick = closeSheet; document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  (function () { let y0 = null; sheet.addEventListener('pointerdown', e => { if (!desk() && (e.target.closest('.grab') || (sheet.scrollTop === 0 && e.target === sheet))) { y0 = e.clientY; sheet.setPointerCapture(e.pointerId); sheet.style.transition = 'none'; } });
    sheet.addEventListener('pointermove', e => { if (y0 !== null) sheet.style.transform = 'translateY(' + Math.max(0, e.clientY - y0) + 'px)'; });
    const up = e => { if (y0 === null) return; const d = e.clientY - y0; y0 = null; sheet.style.transition = ''; if (d > 90) closeSheet(); else sheet.style.transform = ''; }; sheet.addEventListener('pointerup', up); sheet.addEventListener('pointercancel', up); })();
  document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS' && e.target.open && e.target.closest('.rules')) bump('rules'); }, true);
  const nameNow = () => slug(S.cur.name || 'molecula');
  function save(fn, data, mime) { const b = data instanceof Blob ? data : new Blob([data], { type: mime }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('Descargado: ' + fn); }
  function sheetData() {
    const m = V.getMol(); if (!m.atoms.length) return openSheet('<h3>Datos y reglas</h3><p class="muted">Coloca algunos átomos para ver sus datos.</p>');
    const d = C.descr(m); openSheet('<h3>' + esc(S.cur.name) + '</h3>' + tilesHTML(d) + '<h3 style="margin-top:16px;font-size:1rem">Reglas de fármaco</h3>' + rulesHTML(d) + '<p class="muted small" style="margin-top:8px">Calculadas a partir de la estructura. El logP es una estimación por el método de Moriguchi (1984/1992): sirve para comparar, no es un valor medido. Toca una regla para ver sus criterios.</p>');
  }
  function sheetDown() {
    const m = V.getMol(); if (!m.atoms.length) return openSheet('<h3>Descargar</h3><p class="muted">Crea o abre una molécula primero.</p>');
    const can = navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.sdf', { type: 'chemical/x-mdl-sdfile' })] });
    // Fondo del PNG: paleta lista (oscuro, claro, vivos, transparente) +
    // color propio + vista previa pequeña (se genera con el visor real).
    const PRESETS = [['transparent', 'Transparente'], ['#0d1526', 'Oscuro'], ['#ffffff', 'Blanco'], ['#000000', 'Negro'], ['#1e3a8a', 'Azul'], ['#14532d', 'Verde'], ['#7f1d1d', 'Rojo'], ['#be185d', 'Rosa'], ['#4c1d95', 'Morado'], ['#92400e', 'Dorado']];
    const bgBtn = ([c, n]) => '<button data-bg="' + c + '" class="bg-sw' + (S.pngBg === c ? ' on' : '') + '" style="background:' + (c === 'transparent' ? 'conic-gradient(#cbd5e1 25%,#fff 0 50%,#cbd5e1 0 75%,#fff 0);background-size:12px 12px' : c) + '" title="' + n + '" aria-label="Fondo ' + n + '"></button>';
    openSheet('<h3>Descargar</h3><div class="dl"><button data-f="sdf">SDF<small>Estándar de química (3D)</small></button><button data-f="mol">MOL<small>Molfile V2000</small></button><button data-f="xyz">XYZ<small>Coordenadas en texto</small></button><button data-f="json">JSON<small>Átomos, enlaces y datos</small></button><button data-f="png">PNG<small>Imagen de la vista</small></button>' + (can ? '<button data-f="share">Compartir…<small>Enviar por apps</small></button>' : '') + '</div>' +
      '<h3 style="margin-top:16px;font-size:1rem">Fondo de la imagen (PNG)</h3><p class="muted small">Elige el fondo con el que se guarda el PNG. «Transparente» guarda la molécula sin fondo.</p><div class="bgpick" id="bgpick">' + PRESETS.map(bgBtn).join('') + '</div><label class="bg-custom">Color propio <input type="color" id="bg-custom" value="' + (S.pngBg === 'transparent' || !/^#[0-9a-fA-F]{6}$/.test(S.pngBg) ? '#0d1526' : S.pngBg) + '" aria-label="Elegir color de fondo propio"></label><div class="bgprev"><img id="bg-prev" alt="Vista previa del PNG con el fondo elegido"></div>');
    let prevT;
    const updPrev = () => { clearTimeout(prevT); prevT = setTimeout(() => { const img = $('#bg-prev'); if (!img) return; V.png(S.pngBg === 'transparent' ? null : S.pngBg, blob => { if (!blob || !document.body.contains(img)) return; if (img.dataset.u) URL.revokeObjectURL(img.dataset.u); img.dataset.u = URL.createObjectURL(blob); img.src = img.dataset.u; }); }, 150); };
    const setBg = bg => { S.pngBg = bg; store.set('wex-pngbg', bg); $$('#bgpick .bg-sw').forEach(b => b.classList.toggle('on', b.dataset.bg === bg)); const ci = $('#bg-custom'); if (ci && /^#[0-9a-fA-F]{6}$/.test(bg)) ci.value = bg; updPrev(); tick(); };
    $$('#bgpick .bg-sw').forEach(b => b.onclick = () => setBg(b.dataset.bg));
    $('#bg-custom').oninput = e => setBg(e.target.value);
    updPrev();
    $$('#sheet-body [data-f]').forEach(b => b.onclick = () => {
      const n = nameNow(), name = S.cur.name || 'WEX', f = b.dataset.f; bump('dl');
      if (f === 'sdf') save(n + '.sdf', C.toSDF(m, name), 'chemical/x-mdl-sdfile'); else if (f === 'mol') save(n + '.mol', C.toMol(m, name), 'chemical/x-mdl-molfile'); else if (f === 'xyz') save(n + '.xyz', C.toXYZ(m, name), 'chemical/x-xyz');
      else if (f === 'json') { const d = C.descr(m); delete d.counts; save(n + '.json', JSON.stringify({ nombre: name, origen: KIND[S.sess.kind][0], smiles: C.toSmiles(m), datos: d, atomos: m.atoms.map(a => ({ el: a.el, x: +a.x.toFixed(4), y: +a.y.toFixed(4), z: +a.z.toFixed(4) })), enlaces: m.bonds }, null, 1), 'application/json'); }
      else if (f === 'png') V.png(S.pngBg === 'transparent' ? null : S.pngBg, blob => save(n + '.png', blob));
      else navigator.share({ files: [new File([C.toSDF(m, name)], n + '.sdf', { type: 'chemical/x-mdl-sdfile' })], title: name }).catch(() => {});
      tick();
    });
  }
  function sheetOpts() {
    const map = { 'o-h': 'showH', 'o-l': 'labels', 'o-s': 'spin', 'o-e': 'elastic' }, row = (id, t, s) => '<label class="sw-row"><span>' + t + '<small>' + s + '</small></span><input type="checkbox" id="' + id + '"' + (S.opts[map[id]] ? ' checked' : '') + (id === 'o-h' && S.manualH ? ' disabled' : '') + '></label>';
    openSheet('<h3>Opciones</h3><div class="card list-s">' + row('o-e', 'Arrastre elástico', 'Al mover un átomo, los demás lo siguen.') + row('o-h', 'Mostrar hidrógenos', S.manualH ? 'Sin efecto: hidrógeno manual activado en Ajustes.' : 'Se completan solos según la valencia.') + row('o-l', 'Etiquetas de elemento', 'Símbolo sobre cada átomo.') + row('o-s', 'Rotación automática', 'Gira despacio cuando no la tocas.') + '</div>' + (S.manualH ? '<p class="muted small" style="margin-top:8px">Hidrógeno manual activado (Ajustes): los H solo se añaden a mano, así que «Mostrar hidrógenos» no tiene efecto.</p>' : '') + '<div class="stack" style="margin-top:12px"><button class="sheet-btn" id="o-re">Reorganizar desde cero</button><button class="sheet-btn danger" id="o-clr">Limpiar lienzo</button></div>');
    Object.keys(map).forEach(id => $('#' + id).onchange = e => { S.opts[map[id]] = e.target.checked; V.setOpts(S.opts); store.set('wex-opts', S.opts); tick(); });
    $('#o-re').onclick = () => { cb.snap(); V.reorganize(); closeSheet(); };
    $('#o-clr').onclick = () => { const prev = C.clone(V.getMol()); setMolecule({ atoms: [], bonds: [] }); S.undo = [prev]; btns(); closeSheet(); };
  }
  function ptPos(z) {
    if (z <= 2) return [1, z === 1 ? 1 : 18]; if (z <= 10) return [2, z <= 4 ? z - 2 : z + 8]; if (z <= 18) return [3, z <= 12 ? z - 10 : z]; if (z <= 36) return [4, z - 18]; if (z <= 54) return [5, z - 36];
    if (z <= 56) return [6, z - 54]; if (z <= 71) return [9, z - 54]; if (z <= 86) return [6, z - 68]; if (z <= 88) return [7, z - 86]; if (z <= 103) return [10, z - 86]; return [7, z - 100];
  }
  const FNAME = { nometal: 'No metal', halogeno: 'Halógeno', noble: 'Gas noble', alcalino: 'Metal alcalino', alcalinoterreo: 'Alcalinotérreo', metaloide: 'Metaloide', transicion: 'Metal de transición', postransicion: 'Metal post-transición', lantanido: 'Lantánido', actinido: 'Actínido' };
  function sheetTable() {
    const cur = V.getElement(), info = e => '<b>' + EL[e][0] + ' (' + e + ')</b> · Z ' + EL[e][6] + ' · ' + EL[e][1] + ' u<br><span class="muted">' + FNAME[EL[e][7]] + ' · valencia típica ' + (EL[e][4] || '—') + ' · radio covalente ' + EL[e][2] + ' Å</span>';
    let cells = C.ZORDER.map(e => { const [r, c] = ptPos(EL[e][6]); return '<button class="pt f-' + EL[e][7] + '" data-el="' + e + '" aria-checked="' + (e === cur) + '" title="' + EL[e][0] + '" style="grid-row:' + r + ';grid-column:' + c + '"><small>' + EL[e][6] + '</small>' + e + '</button>'; }).join('');
    cells += '<div class="pt ph" style="grid-row:6;grid-column:3">57–71</div><div class="pt ph" style="grid-row:7;grid-column:3">89–103</div>';
    openSheet('<h3>Tabla periódica</h3><div class="elinfo" id="elinfo">' + info(cur) + '</div><div class="ptwrap"><div class="ptable">' + cells + '</div></div><div class="legend">' + Object.keys(FNAME).map(k => '<span class="f-' + k + '">' + FNAME[k] + '</span>').join('') + '</div><p class="muted small" style="margin-top:10px">Toca un elemento para elegirlo; tócalo de nuevo para cerrar. Las valencias y los radios de elementos pesados son aproximados.</p>');
    $$('.pt[data-el]').forEach(b => b.onclick = () => { const e = b.dataset.el; if (b.dataset.seen && b.getAttribute('aria-checked') === 'true') return closeSheet(); b.dataset.seen = 1; $$('.pt[data-el]').forEach(x => x.setAttribute('aria-checked', x === b)); $('#elinfo').innerHTML = info(e); S.fam = FAM.slice(1).find(f => f[2].includes(e))[0]; drawFams(); pick(e); });
  }
  $$('.fab[data-sheet]').forEach(b => b.onclick = () => { tick(); ({ data: () => { bump('rules'); sheetData(); }, save: sheetSave, down: sheetDown, opts: sheetOpts })[b.dataset.sheet](); });
  $('#btn-table').onclick = () => { tick(); sheetTable(); };

  // ---------- PubChem ----------
  async function fromPubChem(q) {
    if (!online()) return toast('Sin conexión'); go('lab'); setName('Buscando «' + q + '» en PubChem…', ''); $('#mchips').innerHTML = ''; $('#mspin').hidden = false; $('#origin').hidden = true;
    try {
      const j = await (await fetch(PUG + '/compound/name/' + encodeURIComponent(q) + '/cids/JSON')).json(), cid = j.IdentifierList.CID[0]; let sdf;
      try { const r = await fetch(PUG + '/compound/cid/' + cid + '/SDF?record_type=3d'); if (!r.ok) throw 0; sdf = await r.text(); } catch (e) { sdf = await (await fetch(PUG + '/compound/cid/' + cid + '/SDF')).text(); }
      const m = C.parseSDF(sdf); if (m.atoms.length > 90) throw new Error('Molécula demasiado grande para el editor (' + m.atoms.length + ' átomos pesados)');
      if (m.atoms.every(a => Math.abs(a.z) < 1e-6)) C.layout(m);
      const nm = q.charAt(0).toUpperCase() + q.slice(1); setMolecule(m, { name: nm, key: C.canon(m), kind: 'pub', cid }); $('#mspin').hidden = true; toast('Buscada en PubChem · CID ' + cid + ' (se marca en tu historial)'); bump('pub');
    } catch (e) { $('#mspin').hidden = true; setName('Lienzo vacío', ''); toast(e.message && !/JSON|fetch|Failed/i.test(e.message) ? e.message : 'No se encontró «' + q + '»'); }
  }

  // ---------- vidrio líquido (liquid-glass.js, solo en el tema Cristal) ----------
  const GL = { list: [], sel: '#tabbar,.dock,.labtop,.fab,.hero,.search,.seg,#sheet',
    on() { if (!window.liquidGlass || GL.list.length) return; $$(GL.sel).forEach(el => { if (el.offsetWidth > 800 || el.offsetHeight > 800) return; el.classList.add('lg'); GL.list.push([el, liquidGlass(el, { scale: -64, chroma: 4, blur: 5, saturate: 1.5, fallbackBlur: 16 })]); }); },
    off() { GL.list.forEach(([el, g]) => { g.destroy(); el.classList.remove('lg'); }); GL.list = []; },
    sync() { document.documentElement.dataset.theme === 'cristal' ? GL.on() : GL.off(); } };

  // ---------- ajustes ----------
  const THEME_COLOR = { claro: '#eef3f8', oscuro: '#0a111f', cristal: '#140f33' };
  function applyTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('wex-theme', t); } catch (e) {} $$('[data-th]').forEach(b => b.setAttribute('aria-checked', b.dataset.th === t)); $('meta[name=theme-color]').content = THEME_COLOR[t]; P.themes[t] = 1; GL.sync(); saveP(); evaluate(); }
  $$('[data-th]').forEach(b => b.onclick = e => {
    const t = b.dataset.th; if (t === document.documentElement.dataset.theme) return; tick();
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return applyTheme(t);
    const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)), tr = document.startViewTransition(() => applyTheme(t));
    tr.ready.then(() => document.documentElement.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  });
  $('#st-online').checked = S.pc; $('#st-online').onchange = e => { S.pc = e.target.checked; store.set('wex-pc', S.pc); };
  $('#st-haptic').checked = S.haptic; $('#st-haptic').onchange = e => { S.haptic = e.target.checked; store.set('wex-haptic', S.haptic); };
  S.manualH = store.get('wex-manual-h', false); C.setAutoH(!S.manualH);
  $('#st-manual-h').checked = S.manualH; $('#st-manual-h').onchange = e => { setManualH(e.target.checked); tick(); };
  // Navidad (assets/navidad.js): la preferencia guardada manda; por defecto,
  // prendida solo en diciembre. El interruptor prende/apaga al instante.
  const stNav = $('#st-navidad');
  if (stNav) {
    const navPref = store.get('wex-navidad', null), navOn = navPref === null ? (window.__xmas ? window.__xmas.isOn() : new Date().getMonth() === 11) : !!navPref;
    stNav.checked = navOn;
    stNav.onchange = e => { const on = e.target.checked; store.set('wex-navidad', on); if (window.__xmas) window.__xmas.set(on); tick(); toast(on ? 'Decoración navideña prendida 🎄' : 'Decoración navideña apagada'); };
  }
  $('#prof-share').onclick = () => { shareAchievements(); tick(); };
  $('#prof-view').onclick = () => { viewShareCode(); tick(); };
  $('#prof-export').onclick = () => { exportAll(); tick(); };
  $('#prof-import').onclick = () => $('#file-profile').click();
  $('#file-profile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importAll(f); });
  $('#prof-rename').onclick = () => {
    const p = getProfile();
    openSheet('<h3>Tu nombre en MolForge</h3><p class="muted small">Se muestra cuando compartes tus logros. Tu código único no cambia.</p><input class="sheet-in" id="pf-name" maxlength="30" value="' + esc(p.name) + '"><div class="stack"><button class="sheet-btn" id="pf-ok" style="justify-content:center;background:var(--primary);color:var(--on);border-color:transparent">Guardar nombre</button></div>');
    $('#pf-ok').onclick = () => { const n = ($('#pf-name').value || '').trim(); if (n) { p.name = n; store.set('wex-profile', p); renderProfile(); } closeSheet(); toast('Nombre guardado'); };
  };
  $('#st-reset').onclick = () => { openSheet('<h3>¿Reiniciar retos?</h3><p class="muted small">Se borran tus XP, retos cumplidos y descubrimientos, y los compuestos desbloqueables vuelven a bloquearse. Tu historial y tus moléculas guardadas no se tocan.</p><div class="stack"><button class="sheet-btn danger" id="y">Reiniciar</button><button class="sheet-btn" id="n">Cancelar</button></div>'); $('#n').onclick = closeSheet; $('#y').onclick = () => { Object.assign(P, { xp: 0, done: {}, c: {}, f: {}, disc: {}, opened: {}, themes: {}, fams: {} }); saveP(); closeSheet(); buildChips(); renderList(true); renderRetos(); toast('Retos reiniciados'); }; };
  let deferred; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#btn-install').hidden = false; });
  $('#btn-install').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btn-install').hidden = true; };
  function offlineState() {
    const el = $('#offline-state'), ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!('serviceWorker' in navigator)) return el.textContent = 'Este navegador no permite usar la app sin conexión.';
    navigator.serviceWorker.ready.then(() => { el.textContent = '✓ Lista para usar sin internet. La biblioteca y el editor están guardados en tu dispositivo.' + (ios ? ' Para instalarla en iPhone/iPad: Compartir → «Agregar a pantalla de inicio».' : ''); });
  }
  addEventListener('online', () => { toast('Conexión recuperada'); renderList(true); }); addEventListener('offline', () => { toast('Sin conexión · la biblioteca sigue disponible'); renderList(true); });

  // ---------- perfil (Ajustes): usuario único, compartir logros, traspaso de datos ----------
  // Sin servidor: el usuario y su código se generan en el dispositivo. El código
  // es informativo (sin servidor no se puede garantizar que sea único en el mundo).
  const CODE_ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const randCode = n => { let s = ''; const a = new Uint8Array(n); crypto.getRandomValues(a); a.forEach(v => s += CODE_ALPH[v % CODE_ALPH.length]); return s; };
  const b64u = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  function getProfile() {
    let p = store.get('wex-profile', null);
    if (!p || !p.code) { p = { name: 'Químico ' + randCode(3), code: randCode(6), created: Date.now() }; store.set('wex-profile', p); }
    return p;
  }
  function renderProfile() {
    const p = getProfile();
    $('#prof-name').textContent = p.name;
    $('#prof-code').textContent = '#' + p.code;
    $('#prof-xp').textContent = P.xp + ' XP · nivel ' + level() + ' (' + lvName(level()) + ') · ' + MIS.filter(m => P.done[m.id]).length + '/' + MIS.length + ' retos';
    // Avatar: foto redonda si hay una; si no, la inicial del nombre.
    const av = $('#prof-avatar');
    if (av) {
      if (p.photo) av.innerHTML = '<img src="' + p.photo + '" alt="Foto de perfil de ' + esc(p.name) + '">';
      else av.innerHTML = '<span id="prof-initial">' + esc((p.name || '?').trim().charAt(0).toUpperCase()) + '</span>';
    }
    const bp = $('#prof-photo'); if (bp) bp.textContent = p.photo ? 'Cambiar foto de perfil' : 'Poner foto de perfil';
    const del = $('#prof-photo-del'); if (del) del.hidden = !p.photo;
  }
  // Foto de perfil (v0.8.2): se elige de la galería o la cámara, se comprime
  // en el dispositivo (máx. 512 px, JPEG) y se guarda solo en localStorage
  // (clave wex-profile, campo photo). Nunca se sube a ningún servidor: solo
  // sale del dispositivo si el usuario exporta sus datos (el respaldo la
  // incluye y pesa un poco más). Sin foto, se mantiene el avatar de inicial.
  const PHOTO_MAX = 512;
  $('#prof-photo').onclick = () => $('#file-photo').click();
  $('#prof-photo-del').onclick = () => { const p = getProfile(); delete p.photo; store.set('wex-profile', p); renderProfile(); toast('Foto quitada'); tick(); };
  $('#file-photo').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (!f.type || !f.type.startsWith('image/')) return toast('Elige una imagen');
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, PHOTO_MAX / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      cv.toBlob(b => {
        if (!b) return toast('No se pudo procesar la foto');
        const rd = new FileReader();
        rd.onload = () => {
          const p = getProfile(), old = p.photo; p.photo = rd.result;
          if (!store.set('wex-profile', p)) { p.photo = old; if (!old) delete p.photo; renderProfile(); return toast('La foto no cabe en el almacenamiento de este dispositivo'); }
          renderProfile(); toast('Foto guardada en este dispositivo · ' + Math.round(b.size / 1024) + ' KB');
        };
        rd.readAsDataURL(b);
      }, 'image/jpeg', .85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('No se pudo leer esa imagen'); };
    img.src = url;
  });
  function shareAchievements() {
    const p = getProfile();
    const payload = { v: 1, u: p.name, c: p.code, xp: P.xp, lvl: level(), done: MIS.filter(m => P.done[m.id]).map(m => m.id), disc: Object.keys(P.disc).length };
    const code = 'WEX1.' + b64u(payload);
    const av = p.photo ? '<img class="avatar sm" src="' + p.photo + '" alt="">' : '<span class="avatar sm">' + esc((p.name || '?').trim().charAt(0).toUpperCase()) + '</span>';
    openSheet('<h3>Compartir mis logros</h3><div class="prof-share-top">' + av + '<div><b>' + esc(p.name) + ' · #' + esc(p.code) + '</b><br><span class="muted small">' + P.xp + ' XP · nivel ' + level() + ' · ' + MIS.filter(m => P.done[m.id]).length + '/16 retos</span></div></div><p class="muted small">Este código dice quién eres y cuántos retos llevas. No lleva tus moléculas ni tu historial. Quien lo reciba puede ver tus logros pegándolo en Ajustes → Ver logros de un código.</p><textarea class="sheet-in" id="sh-code" readonly rows="3" style="font-size:.8rem">' + code + '</textarea><div class="stack"><button class="sheet-btn" id="sh-copy" style="justify-content:center;background:var(--primary);color:var(--on);border-color:transparent">Copiar código</button></div>');
    $('#sh-copy').onclick = async () => { try { await navigator.clipboard.writeText(code); toast('Código copiado'); } catch (e) { $('#sh-code').select(); document.execCommand('copy'); toast('Código copiado'); } };
  }
  function viewShareCode() {
    openSheet('<h3>Ver logros de un código</h3><p class="muted small">Pega un código WEX1. de otra persona para ver sus logros (solo lectura).</p><textarea class="sheet-in" id="vw-code" rows="3" placeholder="WEX1.…"></textarea><div class="stack"><button class="sheet-btn" id="vw-ok" style="justify-content:center;background:var(--primary);color:var(--on);border-color:transparent">Ver logros</button></div><div id="vw-out" style="margin-top:10px"></div>');
    $('#vw-ok').onclick = () => {
      const raw = ($('#vw-code').value || '').trim();
      try {
        if (!raw.startsWith('WEX1.')) throw new Error('El código debe empezar por WEX1.');
        const j = unb64u(raw.slice(5));
        if (j.v !== 1 || !j.u || !j.c) throw new Error('Código no válido');
        $('#vw-out').innerHTML = '<div class="card list-s"><b>' + esc(j.u) + ' · #' + esc(j.c) + '</b><br><span class="muted small">' + (j.xp || 0) + ' XP · nivel ' + (j.lvl || 1) + ' · ' + (j.done ? j.done.length : 0) + '/16 retos · ' + (j.disc || 0) + ' descubrimientos</span></div>';
      } catch (e) { $('#vw-out').innerHTML = '<p class="muted small">No se pudo leer ese código: ' + esc(e.message) + '</p>'; }
    };
  }
  function exportAll() {
    const data = { app: 'wex-molforge', v: 1, exported: new Date().toISOString(), profile: getProfile(), prog: P, hist: S.hist, mine: S.mine, opts: S.opts, manualH: S.manualH, sugerencias: S.sug };
    save('wex-molforge-respaldo.json', JSON.stringify(data, null, 1), 'application/json');
  }
  function importAll(file) {
    const rd = new FileReader();
    rd.onload = () => {
      let j; try { j = JSON.parse(rd.result); } catch (e) { return toast('Archivo no válido'); }
      if (j.app !== 'wex-molforge' || !j.prog) return toast('Ese archivo no es un respaldo de MolForge');
      openSheet('<h3>Importar respaldo</h3><p class="muted small">Respaldo de <b>' + esc((j.profile && j.profile.name) || '?') + '</b> · ' + (j.prog.xp || 0) + ' XP · ' + (j.mine ? j.mine.length : 0) + ' moléculas guardadas · ' + (j.sugerencias ? j.sugerencias.length : 0) + ' sugerencias' + (j.profile && j.profile.photo ? ' · con foto de perfil' : '') + '.</p><div class="stack"><button class="sheet-btn" id="im-merge">Fusionar con lo que tengo</button><button class="sheet-btn" id="im-repl">Reemplazar todo lo mío</button><button class="sheet-btn" id="im-no">Cancelar</button></div><p class="muted small">«Reemplazar» cambia también tu nombre, tu código y tu foto por los del respaldo; «Fusionar» conserva los tuyos (si no tienes foto y el respaldo trae una, se trae).</p>');
      $('#im-no').onclick = closeSheet;
      const apply = merge => {
        if (merge) {
          P.xp = Math.max(P.xp, j.prog.xp || 0);
          Object.assign(P.done, j.prog.done || {}); Object.assign(P.disc, j.prog.disc || {}); Object.assign(P.opened, j.prog.opened || {});
          Object.keys(j.prog.c || {}).forEach(k => P.c[k] = Math.max(P.c[k] || 0, j.prog.c[k]));
          Object.assign(P.f, j.prog.f || {}); Object.assign(P.themes, j.prog.themes || {}); Object.assign(P.fams, j.prog.fams || {});
          const haveM = new Set(S.mine.map(x => x.id)); (j.mine || []).forEach(x => { if (x.id && x.m && !haveM.has(x.id)) S.mine.push(x); });
          const haveH = new Set(S.hist.map(x => x.id)); (j.hist || []).forEach(x => { if (x.id && !haveH.has(x.id)) S.hist.push(x); });
          const haveS = new Set(S.sug.map(x => x.id)); (j.sugerencias || []).forEach(x => { if (x.id && x.titulo && !haveS.has(x.id)) S.sug.push(x); });
          // Foto de perfil: al fusionar, solo se trae si aquí no hay ninguna.
          if (j.profile && j.profile.photo && !getProfile().photo) { const p = getProfile(); p.photo = j.profile.photo; store.set('wex-profile', p); }
          S.hist.sort((a, b) => b.ts - a.ts); S.hist = S.hist.slice(0, 80);
        } else {
          Object.assign(P, { xp: j.prog.xp || 0, done: j.prog.done || {}, c: j.prog.c || {}, f: j.prog.f || {}, disc: j.prog.disc || {}, opened: j.prog.opened || {}, themes: j.prog.themes || {}, fams: j.prog.fams || {} });
          S.mine = j.mine || []; S.hist = j.hist || []; S.sug = Array.isArray(j.sugerencias) ? j.sugerencias : [];
          if (j.profile) store.set('wex-profile', j.profile);
        }
        repairXP(); saveP(); saveMine(); store.set('wex-hist', S.hist); saveSug(); renderSug();
        if (j.manualH !== undefined) setManualH(!!j.manualH);
        closeSheet(); buildChips(); renderList(true); renderRetos(); renderProfile(); toast(merge ? 'Respaldo fusionado' : 'Respaldo importado');
      };
      $('#im-merge').onclick = () => apply(true);
      $('#im-repl').onclick = () => apply(false);
    };
    rd.readAsText(file);
  }
  function setManualH(on) {
    if (on === S.manualH) return;
    cb.snap();
    if (on) V.setMol(C.explicitize(V.getMol()), { keepView: true });
    else V.setMol(C.collapseH(V.getMol()), { keepView: true });
    S.manualH = on; C.setAutoH(!on); store.set('wex-manual-h', on);
    const sw = $('#st-manual-h'); if (sw) sw.checked = on;
    const oh = $('#o-h'); if (oh) oh.disabled = on;
    info(); toast(on ? 'Hidrógeno manual: añade los H a mano' : 'Hidrógeno automático: se completan solos');
  }

  // ---------- buzón de sugerencias (Ajustes) ----------
  // Sin servidor: las sugerencias viven en este dispositivo (localStorage,
  // clave wex-sugerencias) y viajan con la exportación/importación de datos.
  // Los votos y comentarios locales NO se comparten con nadie: un voto por
  // dispositivo, se puede quitar tocando la estrella de nuevo. Los votos y
  // comentarios de verdad se hacen en GitHub (Issues del repo, solo lectura
  // aquí, vía API pública sin token).
  const SUG_REPO = 'https://github.com/WexYt/Molforge-pro';
  const saveSug = () => store.set('wex-sugerencias', S.sug);
  const sugById = id => S.sug.find(x => x.id === id);
  function sugText(s) { return '💡 Sugerencia para MolForge Pro: ' + s.titulo + '\n\n' + s.texto + '\n— ' + s.autor; }
  function sugIssueUrl(s) { return SUG_REPO + '/issues/new?title=' + encodeURIComponent('[Sugerencia] ' + s.titulo) + '&body=' + encodeURIComponent(s.texto + '\n\nPropuesta desde MolForge Pro v0.8.2 · por ' + s.autor); }
  function renderSug() {
    const box = $('#sug-local-list'); if (!box) return;
    if (!S.sug.length) { box.innerHTML = '<p class="sug-empty">Aún no hay sugerencias en este dispositivo.<br>¡Escribe la primera idea arriba! Si la publicas en GitHub, la verá toda la comunidad.</p>'; return; }
    box.innerHTML = S.sug.map(s => '<article class="sug-item" data-id="' + esc(s.id) + '"><b>' + esc(s.titulo) + '</b><p>' + esc(s.texto) + '</p><div class="meta">' + esc(s.autor) + ' · ' + fmtDate(s.fecha) + ' ' + fmtTime(s.fecha) + '</div><div class="sug-actions"><button data-act="star" aria-pressed="' + !!s.votado + '" aria-label="Votar con una estrella">⭐ ' + (s.votos || 0) + '</button><button data-act="share">Compartir</button><button data-act="gh">Publicar en GitHub</button></div>' +
      '<div class="sug-comments">' + (s.comentarios || []).map(c => '<div class="c">' + esc(c.texto) + '<small>' + esc(c.autor) + ' · ' + fmtDate(c.fecha) + ' ' + fmtTime(c.fecha) + '</small></div>').join('') + '</div>' +
      '<div class="sug-cform"><input maxlength="300" placeholder="Escribe un comentario para apoyar esta idea…" aria-label="Escribir un comentario"><button data-act="comment">Comentar</button></div></article>').join('');
  }
  async function shareSug(s) {
    const text = sugText(s);
    try {
      if (navigator.share) { await navigator.share({ title: 'Sugerencia para MolForge Pro', text }); return; }
      throw 0;
    } catch (e) { /* sin Web Share: copiar al portapapeles */ }
    try { await navigator.clipboard.writeText(text); toast('Sugerencia copiada al portapapeles'); }
    catch (e2) { openSheet('<h3>Compartir sugerencia</h3><textarea class="sheet-in" readonly rows="6">' + esc(text) + '</textarea><p class="muted small">Copia el texto de arriba para compartirlo donde quieras.</p>'); }
  }
  function renderCommunity(items) {
    const list = $('#sug-comm-list'); if (!list) return;
    if (!items.length) { list.innerHTML = '<p class="sug-empty">No hay Issues abiertos en GitHub por ahora.</p>'; return; }
    list.innerHTML = items.map(x => '<article class="sug-item comm"><b><a href="' + esc(x.html_url) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a></b><div class="meta">' + esc(x.user ? x.user.login : '?') + ' · 👍 ' + (x.reactions ? x.reactions.total_count : 0) + ' reacciones · 💬 ' + (x.comments || 0) + ' comentarios</div></article>').join('');
  }
  async function loadCommunity(force) {
    const note = $('#sug-comm-note'), list = $('#sug-comm-list');
    if (!note || !list) return;
    const now = Date.now();
    if (!force && S.comm.items && now - S.comm.ts < 5 * 60 * 1000) { renderCommunity(S.comm.items); note.textContent = 'Sugerencias abiertas en GitHub (solo lectura). Para votar o comentar, abre el Issue en GitHub.'; return; }
    if (!online()) { note.textContent = 'Sin conexión: ves solo tus sugerencias guardadas en este dispositivo. Las de la comunidad necesitan internet.'; list.innerHTML = ''; return; }
    note.textContent = 'Cargando sugerencias de la comunidad…';
    try {
      const r = await fetch('https://api.github.com/repos/WexYt/Molforge-pro/issues?state=open&per_page=20');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(), items = (Array.isArray(j) ? j : []).filter(x => !x.pull_request);
      S.comm = { ts: now, items };
      renderCommunity(items);
      note.textContent = items.length ? 'Sugerencias abiertas en GitHub (solo lectura). Para votar o comentar, abre el Issue en GitHub.' : 'No hay Issues abiertos en GitHub por ahora.';
    } catch (e) {
      note.textContent = 'Sin conexión: ves solo tus sugerencias guardadas en este dispositivo. Las de la comunidad necesitan internet.';
      list.innerHTML = '';
    }
  }
  (function initSug() {
    const form = $('#sug-form'); if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const t = ($('#sug-title').value || '').trim(), x = ($('#sug-text').value || '').trim();
      if (!t || !x) return toast('Escribe un título y tu idea');
      S.sug.unshift({ id: uid(), titulo: t.slice(0, 80), texto: x.slice(0, 500), fecha: Date.now(), autor: getProfile().name || 'Anónimo', votos: 0, votado: false, comentarios: [] });
      saveSug(); renderSug(); form.reset(); toast('Sugerencia guardada en este dispositivo');
    });
    $('#sug-local-list').addEventListener('click', e => {
      const btn = e.target.closest('[data-act]'); if (!btn) return;
      const item = btn.closest('.sug-item'), s = item && sugById(item.dataset.id); if (!s) return;
      const act = btn.dataset.act;
      if (act === 'star') { s.votado = !s.votado; s.votos = Math.max(0, (s.votos || 0) + (s.votado ? 1 : -1)); saveSug(); renderSug(); tick(); }
      else if (act === 'share') shareSug(s);
      else if (act === 'gh') window.open(sugIssueUrl(s), '_blank', 'noopener');
      else if (act === 'comment') {
        const inp = item.querySelector('.sug-cform input'), txt = (inp.value || '').trim();
        if (!txt) return toast('Escribe un comentario primero');
        (s.comentarios = s.comentarios || []).push({ texto: txt.slice(0, 300), fecha: Date.now(), autor: getProfile().name || 'Anónimo' });
        saveSug(); renderSug(); toast('Comentario añadido');
      }
    });
    $('#sug-comm-open').onclick = () => window.open(SUG_REPO + '/issues', '_blank', 'noopener');
    $('#sug-comm-refresh').onclick = () => { loadCommunity(true); tick(); };
    renderSug();
  })();

  // ---------- arranque ----------
  (async function init() {
    applyTheme(document.documentElement.dataset.theme || 'oscuro'); splash(18, 'Cargando biblioteca…');
    try {
      const d = await (await fetch('assets/biblioteca.json')).json(); splash(55, 'Indexando ' + d.mols.length + ' compuestos…');
      await new Promise(r => setTimeout(r, 30)); indexLib(d); buildChips(); renderList(true); splash(85, 'Preparando el laboratorio…');
    } catch (e) { $('#list').innerHTML = '<p class="empty">No se pudo cargar la biblioteca. Abre la app con internet una vez.</p>'; }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); offlineState();
    repairXP(); renderProfile();
    drawFams(); drawPalette(); saveMine(); V.setMol({ atoms: [], bonds: [] }); info(); selectTool('move'); seen.clear(); fixWide(); splash(100, 'Listo');
    setTimeout(() => { const s = $('#splash'); s.classList.add('out'); setTimeout(() => { s.remove(); GL.sync(); }, 600); }, Math.max(0, 900 - (performance.now() - t0)));
  })();
  window.__wex = { S, P, V, openEntry, setMolecule, info, evaluate, GL, level, lvName, repairXP, finalUnlocked, getProfile, renderProfile, setManualH, renderOrbitales, showCelebration, MIS, renderSug, loadCommunity, pngBg: () => S.pngBg };
})();

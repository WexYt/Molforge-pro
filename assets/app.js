/* WEX MolForge Pro v0.6 beta · app.js — interfaz móvil, tableta y escritorio (MIT) */
(function () {
  const C = Chem, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], EL = C.EL;
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  const t0 = performance.now(), PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug', uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const S = { lib: [], cats: [], byCanon: new Map(), cat: 'Todas', q: '', list: [], shown: 0, sub: 'lib', fam: 'frec', undo: [], redo: [], tool: 'move', cur: { name: '', formula: '' }, sess: { id: uid(), kind: 'crea' },
    pc: store.get('wex-pc', true), haptic: store.get('wex-haptic', true), opts: Object.assign({ showH: true, labels: false, spin: false, elastic: true }, store.get('wex-opts', {})),
    hist: store.get('wex-hist', []), mine: store.get('wex-mine', []) };
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
  const LV = ['Aprendiz', 'Explorador', 'Alquimista', 'Químico', 'Maestro', 'Arquitecto molecular', 'Leyenda'], XPL = 150;
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
  const level = () => 1 + Math.floor(P.xp / XPL), lvName = l => LV[Math.min(LV.length - 1, l - 1)];
  const isLocked = e => !!e.u && !P.done[e.u], rewardOf = id => S.lib.find(e => e.u === id), misOf = id => MIS.find(m => m.id === id);
  function addXP(n) { const a = level(); P.xp += n; if (level() > a) setTimeout(() => toast('¡Nivel ' + level() + '! ' + lvName(level())), 1200); }
  function evaluate() {
    let any = false;
    MIS.forEach(m => { if (!P.done[m.id] && m.get() >= m.goal) { P.done[m.id] = Date.now(); addXP(m.xp); any = true; const r = rewardOf(m.id); toast('Reto cumplido: ' + m.t + (r ? ' · ¡' + r.n + ' desbloqueado!' : '') + ' +' + m.xp + ' XP'); if (navigator.vibrate && S.haptic) navigator.vibrate([10, 40, 14]); S.popId = m.id; } });
    if (any) { saveP(); if (S.lib.length) { buildChips(); renderList(true); } if ($('#tab-retos').classList.contains('on')) renderRetos(); }
  }
  const bump = (k, n) => { P.c[k] = (P.c[k] || 0) + (n || 1); saveP(); evaluate(); };
  function discover(e) { if (P.disc[e.s]) return; P.disc[e.s] = Date.now(); addXP(15); saveP(); toast('¡Descubriste ' + e.n + '! +15 XP'); evaluate(); }
  function renderRetos() {
    const l = level(), into = P.xp % XPL, done = MIS.filter(m => P.done[m.id]).length;
    $('#retos-sub').textContent = done + ' de ' + MIS.length + ' retos · ' + P.xp + ' XP';
    $('#lvl').innerHTML = '<div class="bdg">' + l + '</div><div class="t"><b>' + lvName(l) + '</b><small>' + into + ' / ' + XPL + ' XP para el nivel ' + (l + 1) + '</small><div class="meter"><i style="width:' + Math.round(into / XPL * 100) + '%"></i></div></div>';
    $('#missions').innerHTML = MIS.map(m => {
      const g = Math.min(m.get(), m.goal), ok = !!P.done[m.id], r = rewardOf(m.id);
      return '<div class="mis' + (ok ? ' done' : '') + (S.popId === m.id ? ' pop' : '') + '"><span class="st">' + (ok ? '<svg class="ic" style="width:18px;height:18px"><use href="#i-check"/></svg>' : g + '/' + m.goal) + '</span><div><b>' + m.t + '</b><small>' + m.d + '</small><div class="rw">' + (ok ? 'Desbloqueaste: ' + (r ? r.n : '') : 'Premio: un compuesto misterioso · +' + m.xp + ' XP') + '</div></div></div>';
    }).join(''); S.popId = null;
    $('#unlocks').innerHTML = S.lib.filter(e => e.u).map(e => isLocked(e) ? '<div class="utile"><svg class="ic"><use href="#i-lock"/></svg><b>???</b><small>' + misOf(e.u).t + '</small></div>' : '<button class="utile on" data-s="' + e.s + '">' + dotsHTML(e.dots) + '<b>' + e.n + '</b><small>' + e.f + '</small></button>').join('');
    $$('#unlocks .utile[data-s]').forEach(b => b.onclick = () => openEntry(S.lib.find(e => e.s === b.dataset.s)));
    $('#disc').innerHTML = '<b style="color:var(--fg)">' + Object.keys(P.disc).length + ' de ' + S.lib.length + '</b> compuestos descubiertos. Cuentan cuando construyes tú mismo una molécula y la app la reconoce (abrirla de la biblioteca o buscarla en PubChem no cuenta).';
  }

  // ---------- navegación ----------
  function go(name) {
    if (wide() && name === 'lab') { requestAnimationFrame(() => V.resize()); return; }
    $$('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + name)); $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.go === name));
    if (name === 'retos') renderRetos(); if (name === 'lab') requestAnimationFrame(() => V.resize());
  }
  $$('#tabbar button').forEach(b => b.onclick = () => { go(b.dataset.go); tick(); });
  function setSub(s) {
    S.sub = s; ['lib', 'mine', 'hist'].forEach(k => $('#sub-' + k).hidden = k !== s); $$('#seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.sub === s));
    $('#exp-title').textContent = { lib: 'Biblioteca', mine: 'Mis moléculas', hist: 'Historial' }[s]; if (s === 'mine') renderMine(); if (s === 'hist') renderHist();
  }
  $$('#seg button').forEach(b => b.onclick = () => { setSub(b.dataset.sub); tick(); });
  const fixWide = () => { if (wide() && $('#tab-lab').classList.contains('on')) go('explorar'); setTimeout(() => V.resize(), 60); }; addEventListener('resize', fixWide);

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
  const tilesHTML = d => { const T = (b, s) => '<div class="tile"><b>' + b + '</b><small>' + s + '</small></div>'; return '<div class="tiles">' + T(d.formula, 'Fórmula') + T(d.mw.toFixed(2), 'g/mol') + T(d.total, 'Átomos') + T(d.bonds, 'Enlaces') + T(d.rings, 'Anillos') + T(d.rot, 'Rotables') + T(d.hbd, 'Donadores H') + T(d.hba, 'Aceptores H') + T(d.tpsa.toFixed(0), 'TPSA Å² (aprox.)') + '</div>'; };
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
    const d = C.descr(m); openSheet('<h3>' + esc(S.cur.name) + '</h3>' + tilesHTML(d) + '<h3 style="margin-top:16px;font-size:1rem">Reglas de fármaco</h3>' + rulesHTML(d) + '<p class="muted small" style="margin-top:8px">Calculadas a partir de la estructura; sin logP. Toca una regla para ver sus criterios.</p>');
  }
  function sheetDown() {
    const m = V.getMol(); if (!m.atoms.length) return openSheet('<h3>Descargar</h3><p class="muted">Crea o abre una molécula primero.</p>');
    const can = navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.sdf', { type: 'chemical/x-mdl-sdfile' })] });
    openSheet('<h3>Descargar</h3><div class="dl"><button data-f="sdf">SDF<small>Estándar de química (3D)</small></button><button data-f="mol">MOL<small>Molfile V2000</small></button><button data-f="xyz">XYZ<small>Coordenadas en texto</small></button><button data-f="json">JSON<small>Átomos, enlaces y datos</small></button><button data-f="png">PNG<small>Imagen de la vista</small></button>' + (can ? '<button data-f="share">Compartir…<small>Enviar por apps</small></button>' : '') + '</div>');
    $$('#sheet-body [data-f]').forEach(b => b.onclick = () => {
      const n = nameNow(), name = S.cur.name || 'WEX', f = b.dataset.f; bump('dl');
      if (f === 'sdf') save(n + '.sdf', C.toSDF(m, name), 'chemical/x-mdl-sdfile'); else if (f === 'mol') save(n + '.mol', C.toMol(m, name), 'chemical/x-mdl-molfile'); else if (f === 'xyz') save(n + '.xyz', C.toXYZ(m, name), 'chemical/x-xyz');
      else if (f === 'json') { const d = C.descr(m); delete d.counts; save(n + '.json', JSON.stringify({ nombre: name, origen: KIND[S.sess.kind][0], smiles: C.toSmiles(m), datos: d, atomos: m.atoms.map(a => ({ el: a.el, x: +a.x.toFixed(4), y: +a.y.toFixed(4), z: +a.z.toFixed(4) })), enlaces: m.bonds }, null, 1), 'application/json'); }
      else if (f === 'png') V.png('#0d1526', blob => save(n + '.png', blob));
      else navigator.share({ files: [new File([C.toSDF(m, name)], n + '.sdf', { type: 'chemical/x-mdl-sdfile' })], title: name }).catch(() => {});
      tick();
    });
  }
  function sheetOpts() {
    const map = { 'o-h': 'showH', 'o-l': 'labels', 'o-s': 'spin', 'o-e': 'elastic' }, row = (id, t, s) => '<label class="sw-row"><span>' + t + '<small>' + s + '</small></span><input type="checkbox" id="' + id + '"' + (S.opts[map[id]] ? ' checked' : '') + '></label>';
    openSheet('<h3>Opciones</h3><div class="card list-s">' + row('o-e', 'Arrastre elástico', 'Al mover un átomo, los demás lo siguen.') + row('o-h', 'Mostrar hidrógenos', 'Se completan solos según la valencia.') + row('o-l', 'Etiquetas de elemento', 'Símbolo sobre cada átomo.') + row('o-s', 'Rotación automática', 'Gira despacio cuando no la tocas.') + '</div><div class="stack" style="margin-top:12px"><button class="sheet-btn" id="o-re">Reorganizar desde cero</button><button class="sheet-btn danger" id="o-clr">Limpiar lienzo</button></div>');
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
  $('#st-reset').onclick = () => { openSheet('<h3>¿Reiniciar retos?</h3><p class="muted small">Se borran tus XP, retos cumplidos y descubrimientos, y los compuestos desbloqueables vuelven a bloquearse. Tu historial y tus moléculas guardadas no se tocan.</p><div class="stack"><button class="sheet-btn danger" id="y">Reiniciar</button><button class="sheet-btn" id="n">Cancelar</button></div>'); $('#n').onclick = closeSheet; $('#y').onclick = () => { Object.assign(P, { xp: 0, done: {}, c: {}, f: {}, disc: {}, opened: {}, themes: {}, fams: {} }); saveP(); closeSheet(); buildChips(); renderList(true); renderRetos(); toast('Retos reiniciados'); }; };
  let deferred; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#btn-install').hidden = false; });
  $('#btn-install').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#btn-install').hidden = true; };
  function offlineState() {
    const el = $('#offline-state'), ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!('serviceWorker' in navigator)) return el.textContent = 'Este navegador no permite usar la app sin conexión.';
    navigator.serviceWorker.ready.then(() => { el.textContent = '✓ Lista para usar sin internet. La biblioteca y el editor están guardados en tu dispositivo.' + (ios ? ' Para instalarla en iPhone/iPad: Compartir → «Agregar a pantalla de inicio».' : ''); });
  }
  addEventListener('online', () => { toast('Conexión recuperada'); renderList(true); }); addEventListener('offline', () => { toast('Sin conexión · la biblioteca sigue disponible'); renderList(true); });

  // ---------- arranque ----------
  (async function init() {
    applyTheme(document.documentElement.dataset.theme || 'oscuro'); splash(18, 'Cargando biblioteca…');
    try {
      const d = await (await fetch('assets/biblioteca.json')).json(); splash(55, 'Indexando ' + d.mols.length + ' compuestos…');
      await new Promise(r => setTimeout(r, 30)); indexLib(d); buildChips(); renderList(true); splash(85, 'Preparando el laboratorio…');
    } catch (e) { $('#list').innerHTML = '<p class="empty">No se pudo cargar la biblioteca. Abre la app con internet una vez.</p>'; }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); offlineState();
    drawFams(); drawPalette(); saveMine(); V.setMol({ atoms: [], bonds: [] }); info(); selectTool('move'); seen.clear(); fixWide(); splash(100, 'Listo');
    setTimeout(() => { const s = $('#splash'); s.classList.add('out'); setTimeout(() => { s.remove(); GL.sync(); }, 600); }, Math.max(0, 900 - (performance.now() - t0)));
  })();
  window.__wex = { S, P, V, openEntry, setMolecule, info, evaluate, GL };
})();

/* WEX MolForge Pro · view.js — visor/editor 3D en canvas con gestos táctiles (MIT) */
(function (g) {
  const C = g.Chem, EL = C.EL;
  const MAXV = { C: 4, H: 1, F: 1, Cl: 1, Br: 1, I: 1, N: 5, O: 3, B: 3, Si: 4, Al: 3, Li: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Zn: 2, Fe: 3, Cu: 2, Se: 6, S: 6, P: 5, As: 5, He: 0, Ne: 0, Ar: 0, Kr: 0, Xe: 0 };
  const BOND = 'rgba(214,222,236,.92)';
  const mix = (hex, t) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, f = t < 0 ? 0 : 255, k = Math.abs(t); return 'rgb(' + Math.round(r + (f - r) * k) + ',' + Math.round(gg + (f - gg) * k) + ',' + Math.round(b + (f - b) * k) + ')'; };
  const mm = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));

  function View(cv, cb) {
    const ctx = cv.getContext('2d'), ptrs = new Map();
    let mol = { atoms: [], bonds: [] }, H = [], R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], cen = [0, 0, 0], base = 40, zoom = 1, pan = [0, 0], W = 300, Ht = 300, dpr = 1;
    let sel = -1, tool = 'move', el = 'C', order = 1, elastic = true, showH = true, labels = false, spin = false, dirty = true, appear = 0, anim = 0, st = null, pre = null;
    const P3 = a => [a.x, a.y, a.z], reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const proj = p => {
      const d = [p[0] - cen[0], p[1] - cen[1], p[2] - cen[2]], q = [R[0][0] * d[0] + R[0][1] * d[1] + R[0][2] * d[2], R[1][0] * d[0] + R[1][1] * d[1] + R[1][2] * d[2], R[2][0] * d[0] + R[2][1] * d[1] + R[2][2] * d[2]];
      const f = 1 / (1 - q[2] * .03), k = base * zoom * f; return { x: W / 2 + pan[0] + q[0] * k, y: Ht / 2 + pan[1] - q[1] * k, z: q[2], f, k };
    };
    const unproj = (sx, sy, qz) => {
      const f = 1 / (1 - qz * .03), k = base * zoom * f, qx = (sx - W / 2 - pan[0]) / k, qy = -(sy - Ht / 2 - pan[1]) / k;
      return [R[0][0] * qx + R[1][0] * qy + R[2][0] * qz + cen[0], R[0][1] * qx + R[1][1] * qy + R[2][1] * qz + cen[1], R[0][2] * qx + R[1][2] * qy + R[2][2] * qz + cen[2]];
    };
    function rotate(dx, dy) {
      const ay = dx * .009, ax = dy * .009, cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      R = mm([[1, 0, 0], [0, cx, -sx], [0, sx, cx]], mm([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], R)); dirty = true;
    }
    const refreshH = () => { H = C.hyd(mol); };
    function orient() { // coloca la molécula con su plano principal de cara a la pantalla, con una ligera inclinación
      R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; if (mol.atoms.length < 2) return; const c = C.center(mol), M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      mol.atoms.forEach(a => { const d = [a.x - c[0], a.y - c[1], a.z - c[2]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M[i][j] += d[i] * d[j]; });
      const E = C.eig3(M), idx = [0, 1, 2].sort((a, b) => E.val[b] - E.val[a]), e1 = E.vec[idx[0]], e2 = E.vec[idx[1]];
      R = [e1, e2, [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]]; rotate(30, -24);
    }
    function fit() {
      if (!mol.atoms.length) { cen = [0, 0, 0]; base = Math.min(W, Ht) / 7; }
      else { cen = C.center(mol); let ex = 1; mol.atoms.forEach(a => { ex = Math.max(ex, Math.hypot(a.x - cen[0], a.y - cen[1], a.z - cen[2])); }); base = Math.min(W, Ht) * .42 / (ex + 1.3); }
      zoom = 1; pan = [0, 0]; dirty = true;
    }
    function resize() {
      const r = cv.getBoundingClientRect(); if (!r.width) return; dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; Ht = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(Ht * dpr); dirty = true;
    }
    let lw = 0, lh = 0; new ResizeObserver(() => { const r = cv.getBoundingClientRect(); if (!r.width || (Math.abs(r.width - lw) < 2 && Math.abs(r.height - lh) < 2)) return; lw = r.width; lh = r.height; resize(); if (mol.atoms.length) fit(); else base = Math.min(W, Ht) / 7; }).observe(cv);

    // ---------- dibujo ----------
    function bond(it, sc) {
      const a = it.a, b = it.b, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, k = (a.k + b.k) / 2, w = Math.max(2, .12 * k * (it.h ? .75 : 1));
      const offs = it.o === 1 ? [0] : it.o === 2 ? [-.6, .6] : [-1.15, 0, 1.15]; ctx.lineCap = 'round'; ctx.strokeStyle = BOND; ctx.lineWidth = it.o === 1 ? w : it.o === 2 ? w * .62 : w * .5; ctx.globalAlpha = sc;
      for (const f of offs) { ctx.beginPath(); ctx.moveTo(a.x + nx * f * w, a.y + ny * f * w); ctx.lineTo(b.x + nx * f * w, b.y + ny * f * w); ctx.stroke(); } ctx.globalAlpha = 1;
    }
    function atom(it, sc) {
      const e = EL[it.el], r = (e[2] * .38 + .12) * it.p.k * sc, col = e[5]; if (r < .5) return;
      const gr = ctx.createRadialGradient(it.p.x - r * .35, it.p.y - r * .38, r * .1, it.p.x, it.p.y, r); gr.addColorStop(0, mix(col, .6)); gr.addColorStop(.5, col); gr.addColorStop(1, mix(col, -.55));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(it.p.x, it.p.y, r, 0, 6.2832); ctx.fill();
      if (it.i === sel) { ctx.strokeStyle = '#5eeaff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(it.p.x, it.p.y, r + 4, 0, 6.2832); ctx.stroke(); }
      if (labels && !it.h && sc > .8) { ctx.font = '700 ' + Math.max(10, r * .95) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = it.el === 'H' || it.el === 'S' || it.el === 'F' ? '#10202c' : '#fff'; ctx.fillText(it.el, it.p.x, it.p.y + .5); }
    }
    function draw(bg) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Ht); } else ctx.clearRect(0, 0, W, Ht);
      const A = mol.atoms; if (!A.length) return;
      const t = appear && !reduce ? Math.min(1, (performance.now() - appear) / 520) : 1, sc = t < 1 ? 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2) : 1, fa = Math.min(1, t * 1.6);
      const P = A.map(a => proj(P3(a))), PH = showH ? H.map(h => proj([h.x, h.y, h.z])) : [], items = [];
      mol.bonds.forEach(([a, b, o]) => items.push({ z: (P[a].z + P[b].z) / 2 - .01, t: 0, a: P[a], b: P[b], o }));
      PH.forEach((p, k) => items.push({ z: (p.z + P[H[k].p].z) / 2 - .01, t: 0, a: P[H[k].p], b: p, o: 1, h: 1 }));
      A.forEach((a, i) => items.push({ z: P[i].z, t: 1, p: P[i], el: a.el, i }));
      PH.forEach(p => items.push({ z: p.z, t: 1, p, el: 'H', h: 1 }));
      items.sort((x, y) => x.z - y.z);
      for (const it of items) it.t ? atom(it, Math.max(.01, sc)) : bond(it, fa);
      if (st && st.m === 'bond' && st.moved) { const s = P[st.ai]; ctx.strokeStyle = '#5eeaff'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(st.x, st.y); ctx.stroke(); ctx.setLineDash([]); }
    }
    function loop() {
      if (anim > 0) { C.relax(mol, { iters: 30 }); refreshH(); anim--; dirty = true; if (!anim) cb.change('forma'); }
      if (spin && !st && !anim && !reduce) rotate(.5, 0);
      if (appear && performance.now() - appear < 560) dirty = true;
      if (dirty) { dirty = false; draw(); } requestAnimationFrame(loop);
    }

    // ---------- edición ----------
    const okVal = (i, d) => mol.bonds.reduce((s, b) => s + (b[0] === i || b[1] === i ? b[2] : 0), d) <= MAXV[mol.atoms[i].el];
    const after = r => { refreshH(); dirty = true; cb.change(r); cb.tick(); };
    function freeDir(i) { // prefiere direcciones libres que se vean en la pantalla (no hacia el ojo)
      const a = mol.atoms[i], ax = [R[0][2], R[1][2], R[2][2]], c = H.filter(x => x.p === i).map(h => C.unit([h.x - a.x, h.y - a.y, h.z - a.z]));
      if (c.length) { c.sort((u, v) => Math.abs(C.dot(u, ax)) - Math.abs(C.dot(v, ax))); return c[0]; }
      const t = Math.random() * 6.2832, cs = Math.cos(t), sn = Math.sin(t); return [R[0][0] * cs + R[1][0] * sn, R[0][1] * cs + R[1][1] * sn, R[0][2] * cs + R[1][2] * sn];
    }
    function addAtom(e, p) { mol.atoms.push({ el: e, x: p[0], y: p[1], z: p[2] }); return mol.atoms.length - 1; }
    function attach(i) {
      const a = mol.atoms[i]; if (!okVal(i, order) || MAXV[el] < order) return cb.toast('Ese átomo no tiene valencia libre');
      cb.snap(); const d = freeDir(i), L = (EL[a.el][2] + EL[el][2]) * (order === 2 ? .9 : order === 3 ? .82 : 1), old = mol.atoms.map((_, k) => k);
      const j = addAtom(el, [a.x + d[0] * L, a.y + d[1] * L, a.z + d[2] * L]); mol.bonds.push([i, j, order]); C.relax(mol, { pin: old, iters: 40 }); sel = j; after('atom');
    }
    function setBond(a, b, o) {
      const k = mol.bonds.findIndex(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)), cur = k < 0 ? 0 : mol.bonds[k][2];
      if (cur === o) return; if (!okVal(a, o - cur) || !okVal(b, o - cur)) return cb.toast('Valencia excedida');
      cb.snap(); if (k < 0) mol.bonds.push([a, b, o]); else mol.bonds[k][2] = o; after('bond');
    }
    function cycleBond(bi) {
      const b = mol.bonds[bi], o = b[2] % 3 + 1; if (!okVal(b[0], o - b[2]) || !okVal(b[1], o - b[2])) return cb.toast('Valencia excedida');
      cb.snap(); b[2] = o; after('bond');
    }
    function delAtom(i) {
      cb.snap(); mol.atoms.splice(i, 1); mol.bonds = mol.bonds.filter(b => b[0] !== i && b[1] !== i).map(b => [b[0] > i ? b[0] - 1 : b[0], b[1] > i ? b[1] - 1 : b[1], b[2]]); sel = -1; after('del');
    }
    function delBond(bi) { cb.snap(); mol.bonds.splice(bi, 1); after('del'); }
    function finishBond(from, to, x, y) {
      if (to >= 0 && to !== from) return setBond(from, to, order);
      if (to < 0) {
        if (!okVal(from, order) || MAXV[el] < order) return cb.toast('Ese átomo no tiene valencia libre');
        cb.snap(); const q = proj(P3(mol.atoms[from])), w = unproj(x, y, q.z), j = addAtom(el, w); mol.bonds.push([from, j, order]); sel = j; after('atom');
      }
    }
    function tap(s) {
      if (tool === 'move') { sel = s.ai; cb.select(sel); return; }
      if (tool === 'atom') {
        if (s.ai >= 0) return attach(s.ai);
        cb.snap(); const w = unproj(s.x0, s.y0, 0); sel = addAtom(el, w); if (mol.atoms.length === 1) { appear = performance.now(); } return after('atom');
      }
      if (tool === 'bond') { if (s.bi >= 0) return cycleBond(s.bi); if (s.ai >= 0) return cb.toast('Arrastra de un átomo a otro para unirlos'); }
      if (tool === 'erase') { if (s.ai >= 0) return delAtom(s.ai); if (s.bi >= 0) return delBond(s.bi); }
    }

    // ---------- gestos ----------
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    function hitAtom(x, y) { let best = -1, bz = -1e9; mol.atoms.forEach((a, i) => { const p = proj(P3(a)), r = Math.max(22, (EL[a.el][2] * .38 + .12) * p.k); if (Math.hypot(p.x - x, p.y - y) <= r && p.z > bz) { bz = p.z; best = i; } }); return best; }
    function hitBond(x, y) {
      let best = -1, bd = 16; mol.bonds.forEach(([a, b], i) => { const p = proj(P3(mol.atoms[a])), q = proj(P3(mol.atoms[b])), dx = q.x - p.x, dy = q.y - p.y, t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / (dx * dx + dy * dy || 1))), d = Math.hypot(p.x + t * dx - x, p.y + t * dy - y); if (d < bd) { bd = d; best = i; } }); return best;
    }
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); ptrs.set(e.pointerId, { x, y }); spinPause();
      if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; st = { m: 'pinch', d: Math.hypot(p.x - q.x, p.y - q.y) || 1, z: zoom, mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2, pan: pan.slice() }; return; }
      const ai = hitAtom(x, y), bi = ai < 0 ? hitBond(x, y) : -1; st = { m: 'tap', x, y, x0: x, y0: y, ai, bi, moved: false };
      if (tool === 'move' && ai >= 0) { st.m = 'drag'; sel = ai; cb.select(ai); } else if (tool === 'bond' && ai >= 0) st.m = 'bond'; dirty = true;
    });
    cv.addEventListener('pointermove', e => {
      const pv = ptrs.get(e.pointerId); if (!pv) return; const [x, y] = pos(e), dx = x - pv.x, dy = y - pv.y; ptrs.set(e.pointerId, { x, y }); if (!st) return;
      if (st.m === 'pinch') { const [p, q] = [...ptrs.values()]; if (!q) return; const d = Math.hypot(p.x - q.x, p.y - q.y); zoom = Math.max(.3, Math.min(6, st.z * d / st.d)); pan = [st.pan[0] + (p.x + q.x) / 2 - st.mx, st.pan[1] + (p.y + q.y) / 2 - st.my]; dirty = true; return; }
      st.x = x; st.y = y; if (Math.hypot(x - st.x0, y - st.y0) > 6) st.moved = true; if (!st.moved) return;
      if (st.m === 'drag') {
        if (!st.snap) { cb.snap(); st.snap = 1; }
        const a = mol.atoms[st.ai], w = unproj(x, y, proj(P3(a)).z); a.x = w[0]; a.y = w[1]; a.z = w[2];
        if (elastic) C.relax(mol, { pin: [st.ai], iters: 6 }); refreshH(); cb.live(); dirty = true;
      } else if (st.m === 'bond') dirty = true; else rotate(dx, dy);
    });
    const end = e => {
      ptrs.delete(e.pointerId); if (!st) return; const s = st; if (s.m === 'pinch') { if (!ptrs.size) st = null; return; } st = null;
      const [x, y] = pos(e);
      if (s.m === 'drag') { s.moved ? cb.change('mover') : tap(s); } else if (s.m === 'bond') { if (s.moved) finishBond(s.ai, hitAtom(x, y), x, y); else tap(s); } else if (!s.moved) tap(s);
      dirty = true;
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); st = null; dirty = true; });
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.3, Math.min(6, zoom * (e.deltaY < 0 ? 1.1 : .91))); dirty = true; }, { passive: false });
    let sp = 0; const spinPause = () => { sp = performance.now(); };

    resize(); requestAnimationFrame(loop);
    return {
      setMol(m, o) { mol = m; sel = -1; refreshH(); if (!(o && o.keepView)) { if (!(o && o.noOrient)) orient(); fit(); } if (o && o.appear) appear = performance.now(); dirty = true; },
      getMol: () => mol, fit, refreshH, redraw() { dirty = true; },
      setTool(t) { tool = t; pre = null; dirty = true; }, setElement(e) { el = e; }, getElement: () => el, setOrder(o) { order = o; },
      setOpts(o) { if ('elastic' in o) elastic = o.elastic; if ('showH' in o) showH = o.showH; if ('labels' in o) labels = o.labels; if ('spin' in o) spin = o.spin; dirty = true; },
      getSel: () => sel, replaceElement(i, e) {
        if (i < 0 || !mol.atoms[i]) return; const was = mol.atoms[i].el; mol.atoms[i].el = e;
        if (!okVal(i, 0)) { mol.atoms[i].el = was; return cb.toast('Ese elemento no admite tantos enlaces'); } cb.snap(); mol.atoms[i].el = was; mol.atoms[i].el = e; after('el');
      },
      autoShape() { if (mol.atoms.length > 1) { anim = reduce ? 1 : 14; if (reduce) { C.relax(mol, { iters: 300 }); refreshH(); anim = 0; cb.change('forma'); } } },
      reorganize() { if (!mol.atoms.length) return; C.layout(mol); refreshH(); orient(); fit(); appear = performance.now(); cb.change('forma'); },
      png(bg, done) { draw(bg); cv.toBlob(b => { dirty = true; done(b); }, 'image/png'); },
      screen(i) { const a = mol.atoms[i], p = proj(P3(a)); return [p.x, p.y]; },
      resize
    };
  }
  g.View = View;
})(window);

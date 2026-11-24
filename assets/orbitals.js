/* WEX MolForge Pro · orbitals.js — configuración electrónica, capas y orbitales s, p, d, f en 3D (MIT)
   Formas angulares: armónicos esféricos reales (conjunto cúbico para f). Configuración: Aufbau (Madelung) con excepciones conocidas. */
(function (g) {
  const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'], CAP = { s: 2, p: 6, d: 10, f: 14 };
  const EXC = { 24: { '4s': 1, '3d': 5 }, 29: { '4s': 1, '3d': 10 }, 41: { '5s': 1, '4d': 4 }, 42: { '5s': 1, '4d': 5 }, 44: { '5s': 1, '4d': 7 }, 45: { '5s': 1, '4d': 8 }, 46: { '5s': 0, '4d': 10 }, 47: { '5s': 1, '4d': 10 }, 57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 }, 64: { '4f': 7, '5d': 1 }, 78: { '6s': 1, '5d': 9 }, 79: { '6s': 1, '5d': 10 }, 89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 }, 91: { '5f': 2, '6d': 1 }, 92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 }, 96: { '5f': 7, '6d': 1 }, 103: { '6d': 0, '7p': 1 } };
  const NOBLE = [2, 10, 18, 36, 54, 86, 118], NSYM = { 2: 'He', 10: 'Ne', 18: 'Ar', 36: 'Kr', 54: 'Xe', 86: 'Rn' }, SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', LCOL = { s: [96, 165, 250], p: [251, 191, 36], d: [52, 211, 153], f: [244, 114, 182] }, SHELL = 'KLMNOPQ';
  const sup = n => String(n).split('').map(c => SUP[+c]).join('');
  function config(Z) {
    let left = Z; const c = {}; for (const sub of ORDER) { if (left <= 0) break; const k = Math.min(CAP[sub[1]], left); c[sub] = k; left -= k; }
    const ex = EXC[Z]; if (ex) Object.assign(c, ex); Object.keys(c).forEach(k => { if (!c[k]) delete c[k]; }); return c;
  }
  const sortSub = (a, b) => (+a[0] - +b[0]) || 'spdf'.indexOf(a[1]) - 'spdf'.indexOf(b[1]);
  function configString(Z) {
    const c = config(Z); let core = 0; NOBLE.forEach(z => { if (z < Z) core = z; });
    if (!core) return Object.keys(c).sort(sortSub).map(k => k + sup(c[k])).join(' ');
    const cc = config(core), rest = Object.keys(c).filter(k => c[k] !== cc[k]).sort((a, b) => (ORDER.indexOf(a) - ORDER.indexOf(b)));
    return '[' + NSYM[core] + '] ' + rest.sort(sortSub).map(k => k + sup(c[k])).join(' ');
  }
  function shells(Z) { const c = config(Z), r = []; Object.keys(c).forEach(k => { r[+k[0] - 1] = (r[+k[0] - 1] || 0) + c[k]; }); return Array.from(r, v => v || 0); }
  const valence = Z => { const c = config(Z), n = Math.max(...Object.keys(c).map(k => +k[0])); return Object.keys(c).filter(k => +k[0] === n).reduce((t, k) => t + c[k], 0); };

  // ---- armónicos esféricos reales (sin normalizar; se normalizan numéricamente a |Y| máx = 1) ----
  const FN = {
    s: [['s', (x, y, z) => 1]],
    p: [['pₓ', (x, y, z) => x], ['p_y', (x, y, z) => y], ['p_z', (x, y, z) => z]],
    d: [['d_z²', (x, y, z) => (3 * z * z - 1) / 2], ['d_xz', (x, y, z) => x * z], ['d_yz', (x, y, z) => y * z], ['d_xy', (x, y, z) => x * y], ['d_x²−y²', (x, y, z) => x * x - y * y]],
    f: [['f_z³', (x, y, z) => z * (5 * z * z - 3) / 2], ['f_xz²', (x, y, z) => x * (5 * z * z - 1)], ['f_yz²', (x, y, z) => y * (5 * z * z - 1)], ['f_xyz', (x, y, z) => x * y * z], ['f_z(x²−y²)', (x, y, z) => z * (x * x - y * y)], ['f_x(x²−3y²)', (x, y, z) => x * (x * x - 3 * y * y)], ['f_y(3x²−y²)', (x, y, z) => y * (3 * x * x - y * y)]]
  };
  const DIRS = (() => { const N = 2600, a = []; for (let i = 0; i < N; i++) { const z = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - z * z), t = i * 2.399963; a.push([r * Math.cos(t), r * Math.sin(t), z]); } return a; })();
  Object.keys(FN).forEach(l => FN[l].forEach(o => { let m = 0; DIRS.forEach(d => { m = Math.max(m, Math.abs(o[1](d[0], d[1], d[2]))); }); o.push(1 / (m || 1)); }));
  function cloud(l, i, seed) { // puntos sobre la superficie del lóbulo + signo (fase)
    const f = FN[l][i], sc = f[2], P = [], S = []; let q = seed || 7; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
    DIRS.forEach(d => { const y = f[1](d[0], d[1], d[2]) * sc, a = Math.abs(y); if (a < .03) return; for (let k = 0; k < 2; k++) { const r = a * (.94 + .06 * rnd()); P.push(d[0] * r, d[1] * r, d[2] * r); S.push(y >= 0 ? 1 : 0); } });
    return { P: new Float32Array(P), S: Uint8Array.from(S) };
  }

  function OrbView(cv) {
    const ctx = cv.getContext('2d'); let W = 300, H = 300, dpr = 1, R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], zoom = 1, Z = 6, mode = 'shells', variant = 'all', spin = true, t0 = performance.now(), dirty = true, drag = null, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cache = {}, mm = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
    const rot = (dx, dy) => { const ay = dx * .009, ax = dy * .009, cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax); R = mm([[1, 0, 0], [0, cx, -sx], [0, sx, cx]], mm([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], R)); dirty = true; };
    rot(40, -30);
    const prj = (x, y, z, k, ox, oy) => { const a = R[0][0] * x + R[0][1] * y + R[0][2] * z, b = R[1][0] * x + R[1][1] * y + R[1][2] * z, c = R[2][0] * x + R[2][1] * y + R[2][2] * z, f = 1 / (1 - c * .12); return [(ox === undefined ? W / 2 : ox) + a * k * f, (oy === undefined ? H / 2 : oy) - b * k * f, c, f]; };
    function resize() { const r = cv.getBoundingClientRect(); if (!r.width) return; dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); dirty = true; }
    new ResizeObserver(resize).observe(cv);
    function drawShells(t) {
      const c = config(Z), subs = Object.keys(c).sort(sortSub), nmax = Math.max(...subs.map(k => +k[0])), unit = Math.min(W, H) * .44 / (nmax + .6) * zoom;
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, unit * .9); g.addColorStop(0, 'rgba(255,220,150,.95)'); g.addColorStop(.35, 'rgba(255,150,60,.45)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, unit * .9, 0, 6.2832); ctx.fill();
      const el = [];
      subs.forEach((k, si) => {
        const n = +k[0], l = k[1], li = 'spdf'.indexOf(l), rad = (n + .35 + li * .08) * unit, col = LCOL[l], tilt = li * .62 + n * .37, ct = Math.cos(tilt), st = Math.sin(tilt), cnt = c[k];
        ctx.strokeStyle = 'rgba(' + col + ',.22)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let a = 0; a <= 64; a++) { const th = a / 64 * 6.2832, x = Math.cos(th) * rad, y = Math.sin(th) * rad * ct, z = Math.sin(th) * rad * st, p = prj(x / unit, y / unit, z / unit, unit); a ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
        for (let e = 0; e < cnt; e++) { const th = e / cnt * 6.2832 + (reduce ? 0 : t * (.9 / Math.pow(n, 1.25)) * (si % 2 ? -1 : 1)) + si, x = Math.cos(th) * rad, y = Math.sin(th) * rad * ct, z = Math.sin(th) * rad * st, p = prj(x / unit, y / unit, z / unit, unit); el.push([p, col]); }
      });
      el.sort((a, b) => a[0][2] - b[0][2]);
      ctx.globalCompositeOperation = 'source-over';
      el.forEach(([p, col]) => { const r = 3.2 * p[3] * Math.min(1.6, Math.max(.8, zoom)); const gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3); gg.addColorStop(0, 'rgba(' + col + ',.85)'); gg.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p[0], p[1], r * 3, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(' + col + ')'; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.2832); ctx.fill(); });
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 11px system-ui,sans-serif'; ctx.textAlign = 'left';
      shells(Z).forEach((n, i) => { if (n) ctx.fillText(SHELL[i] + ' · ' + n + ' e⁻', 12, H - 12 - (shells(Z).filter(Boolean).length - 1 - i) * 15); });
    }
    function drawOrbitals(t) {
      const n = FN[mode].length, all = variant === 'all' && n > 1, list = all ? FN[mode].map((_, i) => i) : [variant], cols = all ? (n <= 3 ? n : n <= 5 ? 3 : 4) : 1, rows = all ? Math.ceil(n / cols) : 1, cw = W / cols, ch = H / rows;
      const unit = (all ? Math.min(cw, ch) * .43 : Math.min(W, H) * .36) * zoom, sz = all ? Math.max(1.4, 1.6 * Math.sqrt(zoom)) : Math.max(1.8, 2.2 * Math.sqrt(zoom));
      list.forEach((i, idx) => {
        const row = Math.floor(idx / cols), len = Math.min(cols, n - row * cols), ox = all ? ((idx % cols) + .5 + (cols - len) / 2) * cw : W / 2, oy = all ? (row + .5) * ch - 8 : H / 2, key = mode + i, cl = cache[key] || (cache[key] = cloud(mode, i, 13 + i * 7));
        ctx.globalCompositeOperation = 'lighter';
        for (let sgn = 1; sgn >= 0; sgn--) { ctx.fillStyle = sgn ? 'rgba(255,165,60,.5)' : 'rgba(80,170,255,.5)'; const P = cl.P, S = cl.S; for (let k = 0, m = S.length; k < m; k++) { if (S[k] !== sgn) continue; const p = prj(P[3 * k], P[3 * k + 1], P[3 * k + 2], unit, ox, oy); ctx.fillRect(p[0], p[1], sz, sz); } }
        ctx.globalCompositeOperation = 'source-over'; const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 8); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, 8, 0, 6.2832); ctx.fill();
        if (all) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '600 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(FN[mode][i][0], ox, oy + unit * 1.05 + 6); }
      });
      if (!all) { ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.textAlign = 'left'; [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((a, i) => { const p = prj(a[0] * 1.05, a[1] * 1.05, a[2] * 1.05, unit), q = prj(-a[0] * 1.05, -a[1] * 1.05, -a[2] * 1.05, unit); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '600 11px system-ui'; ctx.fillText('xyz'[i], p[0] + 4, p[1] - 4); }); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '600 13px system-ui,sans-serif'; ctx.fillText(FN[mode][variant === 'all' ? 0 : variant][0], 14, 22); }
    }
    function frame(now) {
      const t = (now - t0) / 1000;
      if (spin && !drag && !reduce) { rot(.35, 0); } if (mode === 'shells' && !reduce) dirty = true;
      if (dirty) { dirty = false; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); mode === 'shells' ? drawShells(t) : drawOrbitals(t); }
      requestAnimationFrame(frame);
    }
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener('pointermove', e => { if (!drag) return; rot(e.clientX - drag.x, e.clientY - drag.y); drag = { x: e.clientX, y: e.clientY }; });
    const up = () => { drag = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.5, Math.min(3, zoom * (e.deltaY < 0 ? 1.1 : .91))); dirty = true; }, { passive: false });
    let pinch = null; cv.addEventListener('touchmove', e => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) { zoom = Math.max(.5, Math.min(3, zoom * d / pinch)); dirty = true; } pinch = d; e.preventDefault(); } }, { passive: false }); cv.addEventListener('touchend', () => { pinch = null; });
    resize(); requestAnimationFrame(frame);
    return { setElement(z) { Z = z; dirty = true; }, setMode(m, v) { mode = m; variant = v === undefined ? 'all' : v; dirty = true; }, setSpin(v) { spin = v; }, resize, getState: () => ({ Z, mode, variant }) };
  }
  g.Orb = { config, configString, shells, valence, FN, OrbView, sup };
  if (typeof module !== 'undefined') module.exports = g.Orb;
})(typeof window !== 'undefined' ? window : globalThis);

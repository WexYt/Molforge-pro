/* WEX MolForge Pro · chem.js — motor químico sin dependencias (MIT)
   Modelo: {atoms:[{el,x,y,z}], bonds:[[a,b,orden]]}.
   Hidrógenos: por defecto se completan solos por valencia (AUTO_H); con
   setAutoH(false) son átomos reales que el usuario añade a mano.
   logP: estimador de Moriguchi (MLOGP, 1992) — es una estimación, no un valor medido. */
(function (g) {
  // Tabla periódica completa: viene de elementos.js (generado). [nombre, masa, r.cov, r.vdW, valencia, color, Z, familia, valencia máx.]
  const _W = typeof module !== 'undefined' ? require('./elementos.js') : g.WEX_ELEMENTS, EL = _W.E, FAMILIES = _W.F, ZORDER = _W.Z, maxv = e => EL[e][8];
  let AUTO_H = true; // true = los H se completan solos por valencia; false = H manual (átomos reales)
  const rad = d => d * Math.PI / 180;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
  const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const P3 = a => [a.x, a.y, a.z];
  const clone = m => ({ atoms: m.atoms.map(a => ({ el: a.el, x: a.x, y: a.y, z: a.z })), bonds: m.bonds.map(b => b.slice()) });

  function nbrs(m) { const n = m.atoms.map(() => []); m.bonds.forEach(([a, b, o], bi) => { n[a].push([b, o, bi]); n[b].push([a, o, bi]); }); return n; }
  function hcountImp(m, i, nb) { nb = nb || nbrs(m); return Math.max(0, EL[m.atoms[i].el][4] - nb[i].reduce((t, x) => t + x[1], 0)); }
  // H implícitos de un átomo en la molécula tal como se ve: 0 en modo manual.
  function hcount(m, i, nb) { return AUTO_H ? hcountImp(m, i, nb) : 0; }
  // H totales de un átomo: H reales unidos a él + H implícitos por valencia.
  // Es lo que usan fórmula, reconocimiento, reglas y logP, igual en los dos modos.
  function hTot(m, i, nb) { nb = nb || nbrs(m); return nb[i].filter(([j]) => m.atoms[j].el === 'H').length + hcount(m, i, nb); }
  // Convierte los H implícitos en átomos H reales (con enlace a su átomo padre).
  function explicitize(m) {
    const prev = AUTO_H; AUTO_H = true; const H = hyd(m); AUTO_H = prev;
    const out = clone(m);
    H.forEach(h => { const j = out.atoms.length; out.atoms.push({ el: 'H', x: h.x, y: h.y, z: h.z }); out.bonds.push([h.p, j, 1]); });
    return out;
  }
  // Quita los átomos H reales (y sus enlaces): la molécula "colapsada" de átomos pesados.
  function collapseH(m) {
    const keep = m.atoms.map(a => a.el !== 'H'), map = [], atoms = [];
    m.atoms.forEach((a, i) => { if (keep[i]) { map[i] = atoms.length; atoms.push({ el: a.el, x: a.x, y: a.y, z: a.z }); } });
    return { atoms, bonds: m.bonds.filter(b => keep[b[0]] && keep[b[1]]).map(b => [map[b[0]], map[b[1]], b[2]]) };
  }
  function setAutoH(v) { AUTO_H = !!v; return AUTO_H; }
  function counts(m) {
    const nb = nbrs(m), c = {};
    m.atoms.forEach((a, i) => { c[a.el] = (c[a.el] || 0) + 1; const h = hcount(m, i, nb); if (h) c.H = (c.H || 0) + h; });
    return c;
  }
  function formula(m, c) {
    c = c || counts(m);
    const ks = Object.keys(c).sort(), order = c.C ? ['C', 'H'].filter(k => c[k]).concat(ks.filter(k => k !== 'C' && k !== 'H')) : ks;
    return order.map(k => k + (c[k] > 1 ? c[k] : '')).join('');
  }
  const mass = (m, c) => { c = c || counts(m); return Object.keys(c).reduce((t, k) => t + EL[k][1] * c[k], 0); };

  // Huella canónica (refinamiento tipo Weisfeiler-Lehman) para reconocer moléculas de la biblioteca
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function canon(m) {
    // Huella sobre el grafo de átomos pesados; la etiqueta de cada átomo lleva
    // sus H totales (reales + implícitos), así el reconocimiento es el mismo
    // en modo automático y en modo manual.
    const nb0 = nbrs(m), hT = m.atoms.map((a, i) => hTot(m, i, nb0));
    const keep = m.atoms.map(a => a.el !== 'H'), map = [], atoms = [], inv = [];
    m.atoms.forEach((a, i) => { if (keep[i]) { map[i] = atoms.length; inv.push(i); atoms.push(a.el); } });
    const cm = { atoms: atoms.map(el => ({ el, x: 0, y: 0, z: 0 })), bonds: m.bonds.filter(b => keep[b[0]] && keep[b[1]]).map(b => [map[b[0]], map[b[1]], b[2]]) };
    const hC = inv.map(i => hT[i]);
    if (!cm.atoms.length) return '';
    const nb = nbrs(cm); let L = cm.atoms.map((a, i) => hash(a.el + hC[i]));
    for (let k = 0; k < 6; k++) L = L.map((l, i) => hash(l + '(' + nb[i].map(([j, o]) => o + L[j]).sort().join(',') + ')'));
    return formula(m) + '|' + cm.bonds.length + '|' + L.slice().sort().join('.');
  }

  // ---------- geometría ----------
  // Autovalores/autovectores de una matriz simétrica 3x3 (Jacobi). Devuelve {val:[..], vec:[columnas]}
  function eig3(M) {
    M = M.map(r => r.slice()); const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let it = 0; it < 30; it++) {
      let p = 0, q = 1, m = Math.abs(M[0][1]); if (Math.abs(M[0][2]) > m) { p = 0; q = 2; m = Math.abs(M[0][2]); } if (Math.abs(M[1][2]) > m) { p = 1; q = 2; m = Math.abs(M[1][2]); } if (m < 1e-12) break;
      const th = (M[q][q] - M[p][p]) / (2 * M[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 3; k++) { const a = M[k][p], b = M[k][q]; M[k][p] = c * a - s * b; M[k][q] = s * a + c * b; }
      for (let k = 0; k < 3; k++) { const a = M[p][k], b = M[q][k]; M[p][k] = c * a - s * b; M[q][k] = s * a + c * b; }
      for (let k = 0; k < 3; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; }
    }
    return { val: [M[0][0], M[1][1], M[2][2]], vec: [0, 1, 2].map(i => [V[0][i], V[1][i], V[2][i]]) };
  }
  const bl = (m, a, b, o) => (EL[m.atoms[a].el][2] + EL[m.atoms[b].el][2]) * (o === 2 ? .9 : o === 3 ? .82 : 1);
  const unsat = (nb, j) => nb[j].some(x => x[1] >= 2);
  function angleTarget(m, i, nb) {
    const el = m.atoms[i].el, n = nb[i].length; if (n < 2) return 0;
    const dbl = nb[i].filter(x => x[1] === 2).length, tri = nb[i].some(x => x[1] === 3), conj = ['N', 'O'].includes(el) && !dbl && !tri && nb[i].some(x => unsat(nb, x[0]));
    if (conj) return n === 2 ? (el === 'O' ? 117 : 120) : 120;
    if (n === 2) {
      if (tri || dbl === 2 || ['Mg', 'Ca', 'Zn', 'Cu', 'Fe'].includes(el)) return 180;
      if (dbl === 1) return 120;
      return el === 'O' ? 104.5 : el === 'N' ? 107 : ['S', 'Se', 'P', 'As'].includes(el) ? 98 : 109.5;
    }
    if (n === 3) return dbl || tri || el === 'B' || el === 'Al' ? 120 : ['N', 'P', 'As'].includes(el) ? 107 : 109.5;
    return n === 4 ? 109.5 : 90;
  }
  function topoDist(nb) {
    const n = nb.length, D = [];
    for (let s = 0; s < n; s++) { const d = new Array(n).fill(99); d[s] = 0; const q = [s]; for (let h = 0; h < q.length; h++) { const u = q[h]; nb[u].forEach(([v]) => { if (d[v] === 99) { d[v] = d[u] + 1; q.push(v); } }); } D.push(d); }
    return D;
  }
  // Relajación elástica: enlaces, ángulos (1-3) y repulsión entre átomos no enlazados. pin = índices fijos.
  function relax(m, opt) {
    opt = opt || {}; const n = m.atoms.length; if (n < 2) return 0;
    const nb = nbrs(m), A = m.atoms, pin = opt.pin || [], iters = opt.iters || 300, C = [];
    m.bonds.forEach(([a, b, o]) => C.push([a, b, bl(m, a, b, o), 1]));
    for (let c = 0; c < n; c++) {
      const t = rad(angleTarget(m, c, nb)); if (!t) continue; const N = nb[c];
      for (let x = 0; x < N.length; x++) for (let y = x + 1; y < N.length; y++) {
        const la = bl(m, c, N[x][0], N[x][1]), lb = bl(m, c, N[y][0], N[y][1]);
        C.push([N[x][0], N[y][0], Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(t)), .5]);
      }
    }
    const D = topoDist(nb), R = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (D[i][j] >= 3) R.push([i, j, (EL[A[i].el][3] + EL[A[j].el][3]) * .72 - (D[i][j] === 3 ? .35 : 0)]);
    // grupos planos: centros sp2 (o N/O conjugados) conectados entre sí, con sus vecinos
    const planar = A.map((a, i) => nb[i].length >= 2 && nb[i].length <= 3 && (nb[i].some(x => x[1] >= 2) || (['N', 'O'].includes(a.el) && nb[i].some(x => unsat(nb, x[0])))));
    const groups = [], gs = new Array(n).fill(false);
    for (let s0 = 0; s0 < n; s0++) {
      if (!planar[s0] || gs[s0]) continue; const comp = [s0]; gs[s0] = true; const set = new Set([s0]);
      for (let h = 0; h < comp.length; h++) nb[comp[h]].forEach(([v]) => { set.add(v); if (planar[v] && !gs[v]) { gs[v] = true; comp.push(v); } });
      if (set.size >= 4) groups.push([...set]);
    }
    const flatten = () => {
      for (const g of groups) {
        const c = [0, 0, 0]; g.forEach(i => { c[0] += A[i].x; c[1] += A[i].y; c[2] += A[i].z; }); c[0] /= g.length; c[1] /= g.length; c[2] /= g.length;
        const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; g.forEach(i => { const d = [A[i].x - c[0], A[i].y - c[1], A[i].z - c[2]]; for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) M[r][q] += d[r] * d[q]; });
        const E = eig3(M), k = E.val.indexOf(Math.min(...E.val)), nr = E.vec[k];
        g.forEach(i => { if (pin.includes(i)) return; const d = (A[i].x - c[0]) * nr[0] + (A[i].y - c[1]) * nr[1] + (A[i].z - c[2]) * nr[2]; A[i].x -= nr[0] * d * .5; A[i].y -= nr[1] * d * .5; A[i].z -= nr[2] * d * .5; });
      }
    };
    let e = 0;
    for (let it = 0; it < iters; it++) {
      if (groups.length && it > iters * .4 && it % 3 === 2) flatten();
      const F = A.map(() => [0, 0, 0]); e = 0; const st = .1 * (1 - .6 * it / iters);
      for (const [i, j, d0, k] of C) {
        const dx = A[j].x - A[i].x, dy = A[j].y - A[i].y, dz = A[j].z - A[i].z, d = Math.hypot(dx, dy, dz) || 1e-6, f = k * (d - d0) / d; e += k * (d - d0) * (d - d0);
        F[i][0] += f * dx; F[i][1] += f * dy; F[i][2] += f * dz; F[j][0] -= f * dx; F[j][1] -= f * dy; F[j][2] -= f * dz;
      }
      for (const [i, j, d0] of R) {
        const dx = A[j].x - A[i].x, dy = A[j].y - A[i].y, dz = A[j].z - A[i].z, d = Math.hypot(dx, dy, dz) || 1e-6; if (d >= d0) continue;
        const f = .15 * (d - d0) / d; e += .15 * (d - d0) * (d - d0);
        F[i][0] += f * dx; F[i][1] += f * dy; F[i][2] += f * dz; F[j][0] -= f * dx; F[j][1] -= f * dy; F[j][2] -= f * dz;
      }
      for (let i = 0; i < n; i++) if (!pin.includes(i)) { A[i].x += F[i][0] * st; A[i].y += F[i][1] * st; A[i].z += F[i][2] * st; }
    }
    return e;
  }
  function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
  // Coloca átomos desde cero (árbol por BFS + relajación); elige el mejor de varios intentos.
  function layout(m, tries) {
    const n = m.atoms.length; if (!n) return m; const nb = nbrs(m); let best = null, bestE = 1e9;
    for (let t = 0; t < (tries || (n > 40 ? 4 : 7)); t++) {
      const r = rng(t + 3), M = clone(m), seen = new Array(n).fill(false); let comp = 0;
      for (let s = 0; s < n; s++) {
        if (seen[s]) continue; seen[s] = true; M.atoms[s].x = comp * 5; M.atoms[s].y = M.atoms[s].z = 0; comp++; const q = [s];
        for (let h = 0; h < q.length; h++) { const u = q[h]; nb[u].forEach(([v, o]) => { if (seen[v]) return; seen[v] = true; const d = unit([r() - .5, r() - .5, r() - .5]), L = bl(m, u, v, o); M.atoms[v].x = M.atoms[u].x + d[0] * L; M.atoms[v].y = M.atoms[u].y + d[1] * L; M.atoms[v].z = M.atoms[u].z + d[2] * L; q.push(v); }); }
      }
      let e = relax(M, { iters: 500 }); const D = topoDist(nb);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (D[i][j] >= 3) { const d = Math.hypot(M.atoms[i].x - M.atoms[j].x, M.atoms[i].y - M.atoms[j].y, M.atoms[i].z - M.atoms[j].z); if (d < 1.7) e += 60 * (1.7 - d) * (1.7 - d); }
      if (e < bestE) { bestE = e; best = M; }
    }
    m.atoms.forEach((a, i) => { a.x = best.atoms[i].x; a.y = best.atoms[i].y; a.z = best.atoms[i].z; });
    return m;
  }
  function center(m) { const n = m.atoms.length || 1, c = [0, 0, 0]; m.atoms.forEach(a => { c[0] += a.x; c[1] += a.y; c[2] += a.z; }); return [c[0] / n, c[1] / n, c[2] / n]; }

  // ---------- hidrógenos derivados (siguen a su átomo; no se editan) ----------
  // En modo manual no hay H derivados: los H son átomos reales de la molécula.
  function ortho(b) { const a = Math.abs(b[0]) < .8 ? [1, 0, 0] : [0, 1, 0]; return unit(sub(a, mul(b, dot(a, b)))); }
  function hyd(m) {
    if (!AUTO_H) return [];
    const nb = nbrs(m), H = [];
    m.atoms.forEach((a, i) => {
      const h = hcount(m, i, nb); if (!h) return;
      const p = P3(a), U = nb[i].map(([j]) => unit(sub(P3(m.atoms[j]), p))), bs = nb[i].reduce((t, x) => t + x[1], 0);
      const lp = ['N', 'P', 'As'].includes(a.el) && bs + h === 3 ? 1 : ['O', 'S', 'Se'].includes(a.el) && bs + h === 2 ? 2 : 0;
      const Lh = EL[a.el][2] + EL.H[2]; let dirs = null;
      if (U.length === 1 && h === 2 && !lp && nb[i][0][1] === 2) { // =CH2 plano con el resto de la molécula
        const j = nb[i][0][0], o = nb[j].find(x => x[0] !== i);
        if (o) { const ax = U[0], w = sub(P3(m.atoms[o[0]]), P3(m.atoms[j])), b = unit(sub(w, mul(ax, dot(w, ax)))); dirs = [add(mul(ax, -.5), mul(b, .866)), add(mul(ax, -.5), mul(b, -.866))]; }
      }
      if (!dirs) {
        const k = h + lp, base = U.length ? unit(mul(U.reduce((s, u) => add(s, u), [0, 0, 0]), -1)) : [0, 0, 1]; const o1 = ortho(base), o2 = [base[1] * o1[2] - base[2] * o1[1], base[2] * o1[0] - base[0] * o1[2], base[0] * o1[1] - base[1] * o1[0]];
        const F = []; for (let q = 0; q < k; q++) { const t = q * 2.4 + i; F.push(unit(add(add(mul(base, U.length ? 1 : Math.cos(q * 1.1)), mul(o1, .8 * Math.cos(t))), mul(o2, .8 * Math.sin(t))))); }
        for (let it = 0; it < 70; it++) F.forEach((v, q) => {
          let f = [0, 0, 0]; U.concat(F.filter((_, r) => r !== q)).forEach(o => { const d = sub(v, o), l = Math.pow(dot(d, d) + 1e-3, 1.5); f = add(f, mul(d, 1 / l)); });
          F[q] = unit(add(v, mul(f, .12)));
        });
        dirs = F.slice(0, h);
      }
      dirs.forEach(d => H.push({ p: i, x: p[0] + d[0] * Lh, y: p[1] + d[1] * Lh, z: p[2] + d[2] * Lh }));
    });
    return H;
  }

  // ---------- formatos ----------
  const f4 = x => x.toFixed(4).padStart(10);
  function toMol(m, name) {
    const H = hyd(m), at = m.atoms.map(a => [a.el, a.x, a.y, a.z]).concat(H.map(h => ['H', h.x, h.y, h.z])), bd = m.bonds.map(b => [b[0] + 1, b[1] + 1, b[2]]).concat(H.map((h, k) => [h.p + 1, m.atoms.length + k + 1, 1]));
    return (name || 'WEX') + '\n  WEXMolForge\n\n' + String(at.length).padStart(3) + String(bd.length).padStart(3) + '  0  0  0  0  0  0  0  0999 V2000\n' +
      at.map(a => f4(a[1]) + f4(a[2]) + f4(a[3]) + ' ' + a[0].padEnd(3) + ' 0  0  0  0  0  0  0  0  0  0  0  0\n').join('') +
      bd.map(b => String(b[0]).padStart(3) + String(b[1]).padStart(3) + String(b[2]).padStart(3) + '  0\n').join('') + 'M  END\n';
  }
  const toSDF = (m, name) => toMol(m, name) + '$$$$\n';
  function toXYZ(m, name) { const H = hyd(m), r = m.atoms.map(a => [a.el, a.x, a.y, a.z]).concat(H.map(h => ['H', h.x, h.y, h.z])); return r.length + '\n' + (name || 'WEX') + ' · ' + formula(m) + '\n' + r.map(a => a[0].padEnd(3) + [a[1], a[2], a[3]].map(v => v.toFixed(5).padStart(12)).join('')).join('\n') + '\n'; }
  function parseSDF(t) {
    const L = t.split(/\r?\n/), na = +L[3].substr(0, 3), nbnd = +L[3].substr(3, 3); if (!na) throw new Error('Archivo sin átomos');
    const raw = [], map = {};
    for (let i = 0; i < na; i++) { const s = L[4 + i], el = s.substr(31, 3).trim(); if (!EL[el]) throw new Error('Elemento no soportado: ' + el); raw.push({ el, x: +s.substr(0, 10), y: +s.substr(10, 10), z: +s.substr(20, 10) }); }
    const onlyH = raw.every(a => a.el === 'H'), atoms = [];
    raw.forEach((a, i) => { if (a.el !== 'H' || onlyH) { map[i] = atoms.length; atoms.push(a); } });
    const bonds = [];
    for (let i = 0; i < nbnd; i++) { const s = L[4 + na + i], a = +s.substr(0, 3) - 1, b = +s.substr(3, 3) - 1, o = Math.min(3, Math.max(1, +s.substr(6, 3) || 1)); if (map[a] !== undefined && map[b] !== undefined) bonds.push([map[a], map[b], o]); }
    return { atoms, bonds };
  }
  function toSmiles(m) {
    // Los H reales no se recorren como átomos: cuentan como H del átomo al que
    // están unidos (hTot), igual que los implícitos. Así el SMILES es el mismo
    // en modo automático y en modo manual.
    const nb0 = nbrs(m), hT = m.atoms.map((a, i) => hTot(m, i, nb0));
    const keep = m.atoms.map(a => a.el !== 'H'), map = [], inv = [];
    m.atoms.forEach((a, i) => { if (keep[i]) { map[i] = inv.length; inv.push(i); } });
    m = { atoms: inv.map(i => m.atoms[i]), bonds: m.bonds.filter(b => keep[b[0]] && keep[b[1]]).map(b => [map[b[0]], map[b[1]], b[2]]) };
    const n = m.atoms.length, nb = nbrs(m), vis = new Array(n).fill(0), tree = new Set(), back = {}, cl = m.atoms.map(() => []); let rid = 1;
    const key = (a, b) => a < b ? a + '_' + b : b + '_' + a;
    const dfs = (u, p) => { vis[u] = 1; nb[u].forEach(([v, o]) => { const k = key(u, v); if (!vis[v]) { tree.add(k); dfs(v, u); } else if (v !== p && !tree.has(k) && !back[k]) { back[k] = rid; cl[u].push([rid, o]); cl[v].push([rid, o]); rid++; } }); };
    const sym = o => o === 2 ? '=' : o === 3 ? '#' : '', ORG = { B: 3, C: 4, N: 3, O: 2, P: 3, S: 2, F: 1, Cl: 1, Br: 1, I: 1 }, done = new Set(), seen = new Array(n).fill(false);
    const atom = i => { const el = m.atoms[i].el, h = hT[inv[i]], s = nb[i].reduce((t, x) => t + x[1], 0); return ORG[el] && ORG[el] === s + h ? el : '[' + el + (h ? 'H' + (h > 1 ? h : '') : '') + ']'; };
    const gen = (u, p) => {
      seen[u] = true; let s = atom(u);
      cl[u].forEach(([id, o]) => { s += (done.has(id) ? '' : sym(o)) + (id > 9 ? '%' + id : id); done.add(id); });
      const ch = nb[u].filter(([v]) => v !== p && tree.has(key(u, v)) && !seen[v]);
      ch.forEach(([v, o], k) => { const t = sym(o) + gen(v, u); s += k < ch.length - 1 ? '(' + t + ')' : t; });
      return s;
    };
    const out = []; for (let i = 0; i < n; i++) if (!vis[i]) { dfs(i, -1); out.push(gen(i, -1)); }
    return out.join('.');
  }
  // Superficie polar topológica aproximada (contribuciones tipo Ertl solo de N y O)
  function tpsa(m, nb) {
    let t = 0;
    m.atoms.forEach((a, i) => {
      const h = hTot(m, i, nb), dbl = nb[i].some(x => x[1] === 2), tri = nb[i].some(x => x[1] === 3), conj = nb[i].some(x => unsat(nb, x[0]));
      if (a.el === 'N') t += tri ? 23.79 : dbl ? (h ? 23.85 : 12.36) : h >= 2 ? 26.02 : h === 1 ? (conj ? 15.79 : 12.03) : 3.24;
      else if (a.el === 'O') t += dbl ? 17.07 : h ? 20.23 : 9.23;
    });
    return t;
  }
  // ---------- logP estimado por Moriguchi (MLOGP, 1992) ----------
  // Moriguchi et al., Chem. Pharm. Bull. 1992, 40, 127-130; 1994, 42, 976-978.
  // Fórmula cerrada con 13 descriptores estructurales. Es una ESTIMACIÓN
  // (r² ≈ 0,91 en el trabajo original; error típico 0,5-1 unidad): no sustituye
  // un valor medido. Solo se usan C, H, N, O, S, P y halógenos; con otros
  // elementos el resultado es menos fiable y se marca como tal.
  function cyclesUpTo(m, nb, maxLen) { // ciclos simples hasta maxLen (cada uno una vez)
    const n = m.atoms.length, out = [], seen = new Set();
    const dfs = (s, u, path) => {
      if (path.length > maxLen || out.length > 400) return;
      for (const [v] of nb[u]) {
        if (v === s) { if (path.length >= 3) { const key = [...path].sort((a, b) => a - b).join(','); if (!seen.has(key)) { seen.add(key); out.push(path.slice()); } } continue; }
        if (v < s || path.includes(v)) continue;
        path.push(v); dfs(s, v, path); path.pop();
      }
    };
    for (let s = 0; s < n; s++) dfs(s, s, [s]);
    return out;
  }
  function logp(m) {
    // Trabaja sobre la molécula tal como está (los H reales cuentan como H del
    // átomo al que están unidos, igual que los implícitos).
    if (!m.atoms.length) return null;
    const nb = nbrs(m), el = i => m.atoms[i].el, osum = i => nb[i].reduce((t, x) => t + x[1], 0);
    const hasH = i => hTot(m, i, nb) > 0;
    const isCarbonyl = i => el(i) === 'C' && nb[i].some(([j, o]) => el(j) === 'O' && o === 2);
    const isCarboxyl = i => el(i) === 'C' && nb[i].some(([j, o]) => el(j) === 'O' && o === 2) && nb[i].some(([j, o]) => el(j) === 'O' && o === 1 && hasH(j));
    // CX: C y halógenos ponderados
    let CX = 0; m.atoms.forEach(a => { CX += { C: 1, F: .5, Cl: 1, Br: 1.5, I: 2 }[a.el] || 0; });
    // NO: número total de N y O
    let NO = 0; m.atoms.forEach(a => { if (a.el === 'N' || a.el === 'O') NO++; });
    // PRX: proximidad N/O (2 si están unidos, 1 si hay un C, S o P entre medias)
    const D = topoDist(nb), NOi = m.atoms.map((a, i) => (a.el === 'N' || a.el === 'O') ? i : -1).filter(i => i >= 0);
    let PRX = 0;
    for (let a = 0; a < NOi.length; a++) for (let b = a + 1; b < NOi.length; b++) {
      const d = D[NOi[a]][NOi[b]];
      if (d === 1) PRX += 2;
      else if (d === 2) { const mid = nb[NOi[a]].find(([j]) => D[j][NOi[b]] === 1); if (mid && ['C', 'S', 'P'].includes(el(mid[0]))) PRX += 1; }
    }
    m.atoms.forEach((a, i) => { // corrección -1 por amida (-CON<) y sulfonamida (-SO2N<)
      if (a.el !== 'N') return;
      nb[i].forEach(([j]) => {
        if (el(j) === 'C' && isCarbonyl(j)) PRX -= 1;
        if (el(j) === 'S' && nb[j].filter(([k, o]) => el(k) === 'O' && o === 2).length >= 2) PRX -= 1;
      });
    });
    // Grupos nitro: N con 2 o más O (al menos uno en doble enlace)
    const nitroN = new Set();
    m.atoms.forEach((a, i) => { if (a.el !== 'N') return; const oN = nb[i].filter(([j]) => el(j) === 'O'); if (oN.length >= 2 && oN.some(([, o]) => o === 2)) nitroN.add(i); });
    // UB: enlaces insaturados, sin contar los del grupo nitro
    let UB = 0;
    m.bonds.forEach(([a, b, o]) => { if (o < 2) return; if ((nitroN.has(a) && el(b) === 'O') || (nitroN.has(b) && el(a) === 'O')) return; UB += 1; });
    // Anillos: un ciclo es "aromático" si es de 6 con 3 dobles enlaces, o de 5 con
    // 2 dobles enlaces y un heteroátomo (furano, tiofeno, pirrol, imidazol...).
    const cyc = cyclesUpTo(m, nb, 7);
    const aromLike = c => {
      const dbl = c.reduce((t, v, k) => { const w = c[(k + 1) % c.length], e = nb[v].find(([j]) => j === w); return t + (e && e[1] === 2 ? 1 : 0); }, 0);
      if (c.length === 6 && dbl === 3) return true;
      if (c.length === 5 && dbl === 2 && c.some(v => el(v) !== 'C')) return true;
      return false;
    };
    const ringAtoms = new Set(); cyc.forEach(c => c.forEach(v => ringAtoms.add(v)));
    const RNG = cyc.some(c => !aromLike(c)) ? 1 : 0;
    // HB: puente de hidrógeno intramolecular (aprox.): -OH en un átomo de anillo
    // con un aceptor (C=O, -NH2 o -COOH, o N del anillo) en el átomo vecino del anillo.
    let HB = 0;
    const ohRing = new Set(), accRing = new Set();
    m.atoms.forEach((a, i) => {
      if (a.el === 'O' && hasH(i)) nb[i].forEach(([j]) => { if (ringAtoms.has(j)) ohRing.add(j); });
    });
    ringAtoms.forEach(r => {
      if (el(r) === 'N') accRing.add(r);
      nb[r].forEach(([j]) => {
        if (ringAtoms.has(j)) return;
        if (el(j) === 'N' && hasH(j)) accRing.add(r);
        if (isCarbonyl(j) || isCarboxyl(j)) accRing.add(r);
      });
    });
    ohRing.forEach(a => { nb[a].forEach(([b]) => { if (accRing.has(b)) HB = 1; }); });
    // POL: sustituyentes polares sobre anillos aromáticos (máx. 4)
    let POL = 0;
    cyc.filter(aromLike).forEach(c => c.forEach(v => nb[v].forEach(([j]) => { if (!c.includes(j) && ['N', 'O', 'S', 'F', 'Cl', 'Br', 'I'].includes(el(j))) POL += 1; })));
    POL = Math.min(4, POL);
    // AMP: anfótero (α-aminoácido = 1; ácido aminobenzoico o piridincarboxílico = 0,5)
    let AMP = 0;
    m.atoms.forEach((a, i) => {
      if (el(i) !== 'C') return;
      const hasN = nb[i].some(([j]) => el(j) === 'N'), hasCOOH = nb[i].some(([j]) => isCarboxyl(j));
      if (hasN && hasCOOH) AMP = 1;
    });
    if (!AMP) cyc.filter(aromLike).forEach(c => {
      let nh2 = false, cooh = false, ringN = c.some(v => el(v) === 'N');
      c.forEach(v => nb[v].forEach(([j]) => {
        if (c.includes(j)) return;
        if (el(j) === 'N' && hasH(j)) nh2 = true;
        if (isCarboxyl(j)) cooh = true;
      }));
      if ((nh2 && cooh) || (ringN && cooh)) AMP = .5;
    });
    // ALK: hidrocarburo con 0 o 1 doble enlace, o cadena de carbonos de 7 o más.
    // La cadena se mide solo por enlaces acíclicos C–C (el contorno de un anillo
    // no es una cadena).
    let ALK = 0;
    const hetero = m.atoms.some(a => !['C', 'H'].includes(a.el));
    if (!hetero && UB <= 1) ALK = 1;
    else {
      const ringBond = new Set();
      m.bonds.forEach(([a, b], bi) => {
        const seen = new Set([a]), q = [a];
        for (let h = 0; h < q.length; h++) nb[q[h]].forEach(([v, , oi]) => { if (oi !== bi && !seen.has(v)) { seen.add(v); q.push(v); } });
        if (seen.has(b)) ringBond.add(bi);
      });
      const cIdx = m.atoms.map((a, i) => a.el === 'C' ? i : -1).filter(i => i >= 0);
      let longest = 0;
      cIdx.forEach(s => { const d = new Array(m.atoms.length).fill(-1); d[s] = 0; const q = [s]; for (let h = 0; h < q.length; h++) nb[q[h]].forEach(([v, , oi]) => { if (el(v) === 'C' && !ringBond.has(oi) && d[v] < 0) { d[v] = d[q[h]] + 1; q.push(v); } }); longest = Math.max(longest, ...d.filter(x => x >= 0)); });
      if (longest + 1 >= 7) ALK = 1;
    }
    // QN: nitrógeno cuaternario (4 vecinos) = 1; N-óxido = 0,5
    let QN = 0;
    m.atoms.forEach((a, i) => {
      if (a.el !== 'N') return;
      if (nb[i].length >= 4) QN += 1;
      else if (nb[i].length === 3 && osum(i) === 4 && nb[i].some(([j, o]) => el(j) === 'O' && o === 2)) QN += .5;
    });
    // NCS: isotiocianato (-N=C=S) = 1; tiocianato (-S-C≡N) = 0,5
    let NCS = 0;
    m.bonds.forEach(([a, b, o]) => {
      if (o === 2 && ((el(a) === 'N' && el(b) === 'C') || (el(a) === 'C' && el(b) === 'N'))) {
        const c = el(a) === 'C' ? a : b;
        if (nb[c].some(([j, o2]) => el(j) === 'S' && o2 === 2)) NCS += 1;
      }
      if (o === 3 && ((el(a) === 'C' && el(b) === 'N') || (el(a) === 'N' && el(b) === 'C'))) {
        const c = el(a) === 'C' ? a : b;
        if (nb[c].some(([j, o2]) => el(j) === 'S' && o2 === 1)) NCS += .5;
      }
    });
    // BLM: β-lactama (anillo de 4 con N y C=O)
    let BLM = 0;
    cyc.filter(c => c.length === 4).forEach(c => {
      const hasN = c.some(v => el(v) === 'N'), hasCO = c.some(v => isCarbonyl(v));
      if (hasN && hasCO) BLM = 1;
    });
    const v = -1.041 + 1.244 * Math.pow(CX, .6) - 1.017 * Math.pow(NO, .9) + .406 * PRX - .145 * Math.pow(UB, .8)
      + .511 * HB + .268 * POL - 2.215 * AMP + .912 * ALK - .392 * RNG - 3.684 * QN
      + .474 * nitroN.size + 1.582 * NCS + .773 * BLM;
    const otherEl = m.atoms.some(a => !['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'].includes(a.el));
    return { v, d: { CX, NO, PRX, UB, HB, POL, AMP, ALK, RNG, QN, NO2: nitroN.size, NCS, BLM }, approx: otherEl };
  }
  // Reglas de "parecido a fármaco". El logP es el estimado de Moriguchi (ver logp).
  function rules(d) {
    const c = (k, v, ok) => [k, v, ok], f1 = x => +x.toFixed(1), f2 = x => +(Math.round(x * 100) / 100).toFixed(2), out = [];
    const add = (id, name, cond, note, tol) => { const bad = cond.filter(x => !x[2]).length; out.push({ id, name, ok: bad <= (tol || 0), bad, cond, note }); };
    const lp = d.logp == null ? null : f2(d.logp);
    add('lipinski', 'Lipinski (regla de 5)', [c('Masa ≤ 500', f1(d.mw), d.mw <= 500), c('Donadores H ≤ 5', d.hbd, d.hbd <= 5), c('Aceptores H ≤ 10', d.hba, d.hba <= 10), c('logP ≤ 5', lp, lp == null || lp <= 5)], 'Absorción oral. Se permite 1 violación. logP estimado (Moriguchi).', 1);
    add('veber', 'Veber', [c('Enlaces rotables ≤ 10', d.rot, d.rot <= 10), c('TPSA ≤ 140 Å²', f1(d.tpsa), d.tpsa <= 140)], 'Biodisponibilidad oral (TPSA aproximada).');
    add('egan', 'Egan', [c('TPSA ≤ 131,6 Å²', f1(d.tpsa), d.tpsa <= 131.6), c('logP ≤ 5,88', lp, lp == null || lp <= 5.88)], 'Absorción intestinal. logP estimado (Moriguchi).');
    add('muegge', 'Muegge', [c('Masa 200–600', f1(d.mw), d.mw >= 200 && d.mw <= 600), c('Anillos ≤ 7', d.rings, d.rings <= 7), c('Carbonos > 4', d.carbons, d.carbons > 4), c('Heteroátomos > 1', d.hetero, d.hetero > 1), c('Rotables ≤ 15', d.rot, d.rot <= 15), c('Aceptores H ≤ 10', d.hba, d.hba <= 10), c('Donadores H ≤ 5', d.hbd, d.hbd <= 5), c('TPSA ≤ 150 Å²', f1(d.tpsa), d.tpsa <= 150), c('logP −2 a 5', lp, lp == null || (lp >= -2 && lp <= 5))], 'Filtro de calidad de fármaco. logP estimado (Moriguchi).');
    add('lead', 'Parecido a cabeza de serie (Oprea)', [c('Masa 200–450', f1(d.mw), d.mw >= 200 && d.mw <= 450), c('Rotables ≤ 7', d.rot, d.rot <= 7), c('Anillos ≤ 4', d.rings, d.rings <= 4), c('logP ≤ 4,5', lp, lp == null || lp <= 4.5)], 'Buenos puntos de partida para optimizar. logP estimado (Moriguchi).');
    add('rule3', 'Regla de 3 (fragmentos)', [c('Masa ≤ 300', f1(d.mw), d.mw <= 300), c('Donadores H ≤ 3', d.hbd, d.hbd <= 3), c('Aceptores H ≤ 3', d.hba, d.hba <= 3), c('Rotables ≤ 3', d.rot, d.rot <= 3), c('TPSA ≤ 60 Å²', f1(d.tpsa), d.tpsa <= 60), c('logP ≤ 3', lp, lp == null || lp <= 3)], 'Moléculas pequeñas para construir fármacos. logP estimado (Moriguchi).');
    add('ghose', 'Ghose', [c('Masa 160–480', f1(d.mw), d.mw >= 160 && d.mw <= 480), c('Átomos totales 20–70', d.total, d.total >= 20 && d.total <= 70), c('logP −0,4 a 5,6', lp, lp == null || (lp >= -0.4 && lp <= 5.6))], 'Sin el criterio de refractividad molar. logP estimado (Moriguchi).');
    add('pfizer', 'Pfizer 3/75', [c('No (logP > 3 y TPSA < 75)', lp == null ? '—' : (lp > 3 && d.tpsa < 75 ? 'riesgo' : 'bien'), lp == null || !(lp > 3 && d.tpsa < 75))], 'Combinar logP alto con TPSA baja multiplica el riesgo de toxicidad in vivo. logP estimado (Moriguchi).');
    return out;
  }
  function descr(m) {
    // Datos de la molécula tal como está dibujada (en modo manual los H son
    // solo los que el usuario añadió; en automático se completan por valencia).
    const n = m.atoms.length, nb = nbrs(m), c = counts(m); let comp = 0; const seen = new Array(n).fill(false);
    for (let s = 0; s < n; s++) if (!seen[s]) { comp++; const q = [s]; seen[s] = true; for (let h = 0; h < q.length; h++) nb[q[h]].forEach(([v]) => { if (!seen[v]) { seen[v] = true; q.push(v); } }); }
    const inRing = (a, b) => { const q = [a], s = new Set([a]); for (let h = 0; h < q.length; h++) for (const [v] of nb[q[h]]) { if (q[h] === a && v === b) continue; if (v === b) return true; if (!s.has(v)) { s.add(v); q.push(v); } } return false; };
    let hbd = 0, hba = 0, rot = 0;
    m.atoms.forEach((a, i) => { if (a.el === 'N' || a.el === 'O') { hba++; hbd += hTot(m, i, nb) ? 1 : 0; } });
    m.bonds.forEach(([a, b, o]) => { if (o === 1 && nb[a].length > 1 && nb[b].length > 1 && !inRing(a, b)) rot++; });
    const mw = mass(m, c), heavy = m.atoms.filter(a => a.el !== 'H').length, total = Object.values(c).reduce((t, x) => t + x, 0);
    let cn = 0, csp3 = 0; m.atoms.forEach((a, i) => { if (a.el === 'C') { cn++; if (!nb[i].some(x => x[1] >= 2)) csp3++; } });
    const hetero = Object.keys(c).filter(k => k !== 'C' && k !== 'H').reduce((t, k) => t + c[k], 0), tp = tpsa(m, nb), lp = logp(m);
    return { formula: formula(m, c), mw, heavy, total, bonds: m.bonds.length, rings: Math.max(0, m.bonds.length - n + comp), hbd, hba, rot, tpsa: tp, fsp3: cn ? csp3 / cn : 0, carbons: cn, hetero, logp: lp ? lp.v : null, logpDesc: lp ? lp.d : null, logpApprox: lp ? lp.approx : false, lipinski: mw <= 500 && hbd <= 5 && hba <= 10 && (lp == null || lp.v <= 5), counts: c };
  }
  const API = { eig3, EL, FAMILIES, ZORDER, maxv, nbrs, hcount, hcountImp, counts, formula, mass, canon, relax, layout, center, hyd, toMol, toSDF, toXYZ, parseSDF, toSmiles, descr, rules, logp, clone, unit, sub, add, mul, dot, len, setAutoH, autoH: () => AUTO_H, explicitize, collapseH };
  if (typeof module !== 'undefined') module.exports = API; else g.Chem = API;
})(typeof window !== 'undefined' ? window : globalThis);

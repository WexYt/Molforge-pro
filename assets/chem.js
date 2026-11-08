/* WEX MolForge Pro · chem.js — motor químico sin dependencias (MIT)
   Modelo: {atoms:[{el,x,y,z}], bonds:[[a,b,orden]]}. Los hidrógenos se completan solos por valencia. */
(function (g) {
  // símbolo: [nombre, masa, radio covalente, radio vdW, valencia, color]
  const EL = {
    H: ['Hidrógeno', 1.008, .31, 1.2, 1, '#f2f4f8'], C: ['Carbono', 12.011, .76, 1.7, 4, '#5b6270'], N: ['Nitrógeno', 14.007, .71, 1.55, 3, '#4f7cff'],
    O: ['Oxígeno', 15.999, .66, 1.52, 2, '#ff4d4d'], F: ['Flúor', 18.998, .57, 1.47, 1, '#8ee05a'], P: ['Fósforo', 30.974, 1.07, 1.8, 3, '#ff9a3c'],
    S: ['Azufre', 32.06, 1.05, 1.8, 2, '#ffe14d'], Cl: ['Cloro', 35.45, 1.02, 1.75, 1, '#3fe05a'], Br: ['Bromo', 79.904, 1.2, 1.85, 1, '#b5453a'],
    I: ['Yodo', 126.904, 1.39, 1.98, 1, '#a23ad1'], B: ['Boro', 10.81, .84, 1.92, 3, '#f2a6a6'], Si: ['Silicio', 28.085, 1.11, 2.1, 4, '#c9a27e'],
    Se: ['Selenio', 78.971, 1.2, 1.9, 2, '#ffa100'], As: ['Arsénico', 74.922, 1.19, 1.85, 3, '#bd80e3'], Li: ['Litio', 6.94, 1.28, 1.82, 1, '#cc80ff'],
    Na: ['Sodio', 22.99, 1.66, 2.27, 1, '#ab5cf2'], K: ['Potasio', 39.098, 2.03, 2.75, 1, '#8f40d4'], Mg: ['Magnesio', 24.305, 1.41, 1.73, 2, '#8aff00'],
    Ca: ['Calcio', 40.078, 1.76, 2.31, 2, '#3dff00'], Al: ['Aluminio', 26.982, 1.21, 1.84, 3, '#bfa6a6'], Zn: ['Zinc', 65.38, 1.22, 1.39, 2, '#7d80b0'],
    Fe: ['Hierro', 55.845, 1.32, 2.04, 2, '#e06633'], Cu: ['Cobre', 63.546, 1.32, 1.4, 2, '#c88033'], He: ['Helio', 4.0026, .28, 1.4, 0, '#d9ffff'],
    Ne: ['Neón', 20.18, .58, 1.54, 0, '#b3e3f5'], Ar: ['Argón', 39.948, 1.06, 1.88, 0, '#80d1e3'], Kr: ['Kriptón', 83.798, 1.16, 2.02, 0, '#5cb8d1'],
    Xe: ['Xenón', 131.293, 1.4, 2.16, 0, '#429eb0']
  };
  const PALETTE = ['C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'H', 'B', 'Si', 'Se', 'As', 'Li', 'Na', 'K', 'Mg', 'Ca', 'Al', 'Zn', 'Fe', 'Cu', 'He', 'Ne', 'Ar', 'Kr', 'Xe'];
  const rad = d => d * Math.PI / 180;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(a[0], a[1], a[2]);
  const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const P3 = a => [a.x, a.y, a.z];
  const clone = m => ({ atoms: m.atoms.map(a => ({ el: a.el, x: a.x, y: a.y, z: a.z })), bonds: m.bonds.map(b => b.slice()) });

  function nbrs(m) { const n = m.atoms.map(() => []); m.bonds.forEach(([a, b, o]) => { n[a].push([b, o]); n[b].push([a, o]); }); return n; }
  function hcount(m, i, nb) { nb = nb || nbrs(m); return Math.max(0, EL[m.atoms[i].el][4] - nb[i].reduce((t, x) => t + x[1], 0)); }
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
    if (!m.atoms.length) return '';
    const nb = nbrs(m); let L = m.atoms.map((a, i) => hash(a.el + hcount(m, i, nb)));
    for (let k = 0; k < 6; k++) L = L.map((l, i) => hash(l + '(' + nb[i].map(([j, o]) => o + L[j]).sort().join(',') + ')'));
    return formula(m) + '|' + m.bonds.length + '|' + L.slice().sort().join('.');
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
  function ortho(b) { const a = Math.abs(b[0]) < .8 ? [1, 0, 0] : [0, 1, 0]; return unit(sub(a, mul(b, dot(a, b)))); }
  function hyd(m) {
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
    const n = m.atoms.length, nb = nbrs(m), vis = new Array(n).fill(0), tree = new Set(), back = {}, cl = m.atoms.map(() => []); let rid = 1;
    const key = (a, b) => a < b ? a + '_' + b : b + '_' + a;
    const dfs = (u, p) => { vis[u] = 1; nb[u].forEach(([v, o]) => { const k = key(u, v); if (!vis[v]) { tree.add(k); dfs(v, u); } else if (v !== p && !tree.has(k) && !back[k]) { back[k] = rid; cl[u].push([rid, o]); cl[v].push([rid, o]); rid++; } }); };
    const sym = o => o === 2 ? '=' : o === 3 ? '#' : '', ORG = { B: 3, C: 4, N: 3, O: 2, P: 3, S: 2, F: 1, Cl: 1, Br: 1, I: 1 }, done = new Set(), seen = new Array(n).fill(false);
    const atom = i => { const el = m.atoms[i].el, h = hcount(m, i, nb), s = nb[i].reduce((t, x) => t + x[1], 0); return ORG[el] && ORG[el] === s + h ? el : '[' + el + (h ? 'H' + (h > 1 ? h : '') : '') + ']'; };
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
  function descr(m) {
    const n = m.atoms.length, nb = nbrs(m), c = counts(m); let comp = 0; const seen = new Array(n).fill(false);
    for (let s = 0; s < n; s++) if (!seen[s]) { comp++; const q = [s]; seen[s] = true; for (let h = 0; h < q.length; h++) nb[q[h]].forEach(([v]) => { if (!seen[v]) { seen[v] = true; q.push(v); } }); }
    const inRing = (a, b) => { const q = [a], s = new Set([a]); for (let h = 0; h < q.length; h++) for (const [v] of nb[q[h]]) { if (q[h] === a && v === b) continue; if (v === b) return true; if (!s.has(v)) { s.add(v); q.push(v); } } return false; };
    let hbd = 0, hba = 0, rot = 0;
    m.atoms.forEach((a, i) => { if (a.el === 'N' || a.el === 'O') { hba++; hbd += hcount(m, i, nb) ? 1 : 0; } });
    m.bonds.forEach(([a, b, o]) => { if (o === 1 && nb[a].length > 1 && nb[b].length > 1 && !inRing(a, b)) rot++; });
    const mw = mass(m, c), heavy = n, total = Object.values(c).reduce((t, x) => t + x, 0);
    return { formula: formula(m, c), mw, heavy, total, bonds: m.bonds.length, rings: Math.max(0, m.bonds.length - n + comp), hbd, hba, rot, lipinski: mw <= 500 && hbd <= 5 && hba <= 10 && rot <= 10, counts: c };
  }
  const API = { eig3, EL, PALETTE, nbrs, hcount, counts, formula, mass, canon, relax, layout, center, hyd, toMol, toSDF, toXYZ, parseSDF, toSmiles, descr, clone, unit, sub, add, mul, dot, len };
  if (typeof module !== 'undefined') module.exports = API; else g.Chem = API;
})(typeof window !== 'undefined' ? window : globalThis);

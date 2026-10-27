export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Tween a number with an easing; returns a cancel function. */
export function tween(from, to, ms, onUpdate, ease = easeInOut, onDone) {
  const start = performance.now();
  let raf = 0; let dead = false;
  const step = (now) => {
    if (dead) return;
    const t = clamp((now - start) / Math.max(1, ms));
    onUpdate(lerp(from, to, ease(t)), t);
    if (t < 1) raf = requestAnimationFrame(step);
    else if (onDone) onDone();
  };
  raf = requestAnimationFrame(step);
  return () => { dead = true; cancelAnimationFrame(raf); };
}

/** Reveal-on-scroll for elements with .reveal or .doodle inside root. */
export function observeReveals(root) {
  if (!('IntersectionObserver' in window)) { $$('.reveal, .doodle, [data-reveal]', root).forEach((el) => el.classList.add('in-view')); return () => {}; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, [data-reveal]', root).forEach((el) => io.observe(el));
  $$('.doodle path', root).forEach((p) => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (e) { /* not rendered */ } });
  return () => io.disconnect();
}

/** CSS matrix3d that maps a w x h box onto a quadrilateral [[x,y] x4: TL, TR, BR, BL]. */
export function quadMatrix(w, h, q) {
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  const A = []; const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]; const [u, v] = q[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const s = solve(A, b);
  const [a, bb, c, d, e, f, g, hh] = s;
  return `matrix3d(${a},${d},0,${g},${bb},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
}

function solve(A, b) {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}

/** Simple value noise for organic motion. */
export function noise1(x) {
  const i = Math.floor(x); const f = x - i;
  const r = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  return lerp(r(i), r(i + 1), smooth(f)) * 2 - 1;
}

/** The CSP forbids inline style attributes; markup uses data-css="prop:value;..." and this applies them via CSSOM. */
export function applyCss(root) {
  const els = root.matches && root.matches('[data-css]') ? [root, ...root.querySelectorAll('[data-css]')] : root.querySelectorAll('[data-css]');
  els.forEach((el) => {
    el.getAttribute('data-css').split(';').forEach((decl) => {
      const i = decl.indexOf(':'); if (i < 0) return;
      const prop = decl.slice(0, i).trim(); const val = decl.slice(i + 1).trim();
      if (prop) el.style.setProperty(prop, val);
    });
    el.removeAttribute('data-css');
  });
}

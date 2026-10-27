// Small live demos for the expo booth screens (canvas 2D, no libraries).
// They illustrate what each project does; numbers shown come from the resume.

function fit(cv) {
  const r = cv.getBoundingClientRect(); const d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(10, Math.round(r.width * d)); cv.height = Math.max(10, Math.round(r.height * d));
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  return { c, w: r.width, h: r.height };
}
const font = (px, w = 500, fam = 'Inter') => `${w} ${px}px ${fam}, system-ui, sans-serif`;
const mono = (px) => `${px}px "Desk Mono", ui-monospace, monospace`;

const DEMOS = {
  varwix(cv) {
    let { c, w, h } = fit(cv); let t = 0; const hist = []; let price = 100;
    for (let i = 0; i < 90; i++) { price *= Math.exp((Math.random() - 0.48) * 0.03); hist.push(price); }
    const paths = Array.from({ length: 38 }, () => { const p = [hist[hist.length - 1]]; for (let i = 0; i < 40; i++) p.push(p[i] * Math.exp((Math.random() - 0.5) * 0.045 + 0.0008)); return p; });
    const finals = paths.map((p) => p[p.length - 1]).sort((a, b) => a - b); const varLine = finals[Math.floor(finals.length * 0.05)];
    return (dt) => {
      t += dt;
      c.clearRect(0, 0, w, h);
      const all = hist.concat(...paths); const lo = Math.min(...all) * 0.98; const hi = Math.max(...all) * 1.02;
      const X = (i) => 14 + (i / 130) * (w - 28); const Y = (v) => h - 30 - ((v - lo) / (hi - lo)) * (h - 66);
      c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 1;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(14, 36 + i * (h - 66) / 5); c.lineTo(w - 14, 36 + i * (h - 66) / 5); c.stroke(); }
      const k = Math.min(1, (t % 7) / 4);
      paths.forEach((p, j) => {
        c.strokeStyle = `hsla(${32 + j * 2},90%,62%,.22)`; c.beginPath();
        const n = Math.floor(k * (p.length - 1));
        for (let i = 0; i <= n; i++) { const x = X(89 + i); const y = Y(p[i]); i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
      });
      c.strokeStyle = '#f6c77e'; c.lineWidth = 2; c.beginPath();
      hist.forEach((v, i) => { i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)); }); c.stroke();
      if (k > 0.98) { c.setLineDash([5, 4]); c.strokeStyle = '#ff5a4a'; c.beginPath(); c.moveTo(X(89), Y(varLine)); c.lineTo(w - 14, Y(varLine)); c.stroke(); c.setLineDash([]); c.fillStyle = '#ff8a7a'; c.font = font(11, 600); c.fillText('VaR 95%', w - 70, Y(varLine) - 6); }
      c.fillStyle = '#efe6d8'; c.font = font(12, 600); c.fillText('Monte Carlo GBM · 10,000 paths (38 drawn)', 14, 20);
      c.fillStyle = 'rgba(239,230,216,.6)'; c.font = font(11); c.fillText('p95 analytics: 1.8 s → 320 ms', 14, h - 10);
    };
  },
  ideociety(cv) {
    let { c, w, h } = fit(cv); let t = 0;
    const cams = Array.from({ length: 24 }, (_, i) => ({ gx: i % 6, gy: Math.floor(i / 6), ph: Math.random() * 6 }));
    const iso = (gx, gy, z = 0) => [w / 2 + (gx - gy) * (w / 15), 46 + (gx + gy) * (h / 17) - z];
    return (dt) => {
      t += dt; c.clearRect(0, 0, w, h);
      for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 6; gx++) {
        const [x, y] = iso(gx, gy); const hgt = 14 + ((gx * 7 + gy * 3) % 5) * 9;
        c.fillStyle = 'rgba(80,190,255,.08)'; c.strokeStyle = 'rgba(120,210,255,.35)';
        c.beginPath(); c.moveTo(x, y - hgt); c.lineTo(x + w / 15, y + h / 17 - hgt); c.lineTo(x, y + 2 * h / 17 - hgt); c.lineTo(x - w / 15, y + h / 17 - hgt); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - w / 15, y + h / 17 - hgt); c.lineTo(x - w / 15, y + h / 17); c.moveTo(x + w / 15, y + h / 17 - hgt); c.lineTo(x + w / 15, y + h / 17); c.moveTo(x, y + 2 * h / 17 - hgt); c.lineTo(x, y + 2 * h / 17); c.stroke();
      }
      cams.forEach((cm) => { const [x, y] = iso(cm.gx - 0.5, cm.gy - 0.5); const a = (Math.sin(t * 2 + cm.ph) + 1) / 2; c.fillStyle = `rgba(80,255,170,${0.4 + a * 0.6})`; c.beginPath(); c.arc(x, y, 2.6, 0, 6.28); c.fill(); c.strokeStyle = `rgba(80,255,170,${0.35 * (1 - a)})`; c.beginPath(); c.arc(x, y, 3 + a * 9, 0, 6.28); c.stroke(); });
      const bx = w - 132; const by = h - 50; c.strokeStyle = '#ffd25a'; c.lineWidth = 1.5; c.strokeRect(bx, by, 118, 30); c.fillStyle = '#ffd25a'; c.font = mono(11); c.fillText(t % 3 < 1.5 ? 'PLATE ▓▓ ▓▓ ▓▓▓▓' : 'GATE OPEN ✓', bx + 8, by + 19);
      c.fillStyle = '#e6f6ff'; c.font = font(12, 600); c.fillText('3D society map · 24 live CCTV pointers', 14, 20);
      c.fillStyle = 'rgba(230,246,255,.6)'; c.font = font(11); c.fillText('YOLOv8 + OCR plates: 96% · 15 FPS', 14, h - 10);
    };
  },
  grabito(cv) {
    let { c, w, h } = fit(cv); let t = 0;
    const route = [[0.12, 0.78], [0.3, 0.78], [0.3, 0.46], [0.56, 0.46], [0.56, 0.22], [0.86, 0.22]];
    const seg = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1])); const total = seg.reduce((a, b) => a + b, 0);
    return (dt) => {
      t += dt; c.clearRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(i * w / 11, 30); c.lineTo(i * w / 11, h); c.stroke(); c.beginPath(); c.moveTo(0, 30 + i * h / 11); c.lineTo(w, 30 + i * h / 11); c.stroke(); }
      c.strokeStyle = 'rgba(255,140,60,.35)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); route.forEach(([x, y], i) => (i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h))); c.stroke();
      const k = ((t * 0.12) % 1) * total; let acc = 0; let pos = route[0];
      for (let i = 0; i < seg.length; i++) { if (acc + seg[i] >= k) { const f = (k - acc) / seg[i]; pos = [route[i][0] + (route[i + 1][0] - route[i][0]) * f, route[i][1] + (route[i + 1][1] - route[i][1]) * f]; break; } acc += seg[i]; }
      c.fillStyle = '#ff8c3c'; c.beginPath(); c.arc(route[0][0] * w, route[0][1] * h, 7, 0, 6.28); c.fill();
      c.fillStyle = '#7ee787'; c.beginPath(); c.arc(route[5][0] * w, route[5][1] * h, 7, 0, 6.28); c.fill();
      c.fillStyle = '#fff'; c.shadowColor = '#ffb36b'; c.shadowBlur = 14; c.beginPath(); c.arc(pos[0] * w, pos[1] * h, 5.5, 0, 6.28); c.fill(); c.shadowBlur = 0;
      const eta = Math.max(1, Math.round((1 - k / total) * 18));
      c.fillStyle = '#fff1e2'; c.font = font(12, 600); c.fillText('Live order tracking over WebSockets', 14, 20);
      c.fillStyle = '#ffb36b'; c.font = font(20, 700, 'Inter Display'); c.fillText(`${eta} min`, w - 80, h - 14);
      c.fillStyle = 'rgba(255,241,226,.6)'; c.font = font(11); c.fillText('location updates < 200 ms · 5,000 events/s', 14, h - 10);
    };
  },
  nerf(cv) {
    let { c, w, h } = fit(cv); let t = 0;
    const pts = []; for (let i = 0; i < 520; i++) { const u = Math.random() * 6.283; const v = Math.random() * 6.283; const R = 1; const r = 0.42; pts.push([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v) * 1.2, (R + r * Math.cos(v)) * Math.sin(u)]); }
    return (dt) => {
      t += dt; c.clearRect(0, 0, w, h);
      const a = t * 0.6; const cs = Math.cos(a); const sn = Math.sin(a); const tilt = 0.5;
      const proj = pts.map(([x, y, z]) => { const X = x * cs - z * sn; const Z = x * sn + z * cs; const Y = y * Math.cos(tilt) - Z * Math.sin(tilt); const Z2 = y * Math.sin(tilt) + Z * Math.cos(tilt); const s = 1 / (3 + Z2); return [w / 2 + X * s * w * 0.95, h / 2 + 10 + Y * s * w * 0.95, s]; });
      proj.sort((p, q) => p[2] - q[2]).forEach(([x, y, s]) => { c.fillStyle = `rgba(160,140,255,${Math.min(1, s * 2.2)})`; c.fillRect(x, y, 2, 2); });
      [0, 2.1, 4.2].forEach((k) => { const ang = k; const x = w / 2 + Math.cos(ang + a * 0.2) * w * 0.4; const y = h / 2 - 10 + Math.sin(ang + a * 0.2) * h * 0.25; c.strokeStyle = 'rgba(255,214,120,.8)'; c.strokeRect(x - 8, y - 6, 16, 12); c.beginPath(); c.moveTo(x, y); c.lineTo(w / 2, h / 2); c.strokeStyle = 'rgba(255,214,120,.15)'; c.stroke(); });
      c.fillStyle = '#ece8ff'; c.font = font(12, 600); c.fillText('3 input views → novel view (FreeNeRF, nerfstudio)', 14, 20);
      c.fillStyle = 'rgba(236,232,255,.6)'; c.font = font(11); c.fillText('+2.1 dB PSNR over vanilla NeRF at 3 views', 14, h - 10);
    };
  },
  churn(cv) {
    let { c, w, h } = fit(cv); let t = 0;
    return (dt) => {
      t += dt; c.clearRect(0, 0, w, h);
      const L = 40; const B = h - 30; const R = w - 20; const T = 34; const k = Math.min(1, (t % 6) / 3);
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B); c.stroke();
      c.setLineDash([4, 4]); c.beginPath(); c.moveTo(L, B); c.lineTo(R, T); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#7ee787'; c.lineWidth = 2.2; c.beginPath();
      for (let i = 0; i <= 60 * k; i++) { const x = i / 60; const y = 1 - Math.pow(1 - x, 4.4); const px = L + x * (R - L); const py = B - y * (B - T); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke(); c.lineWidth = 1;
      c.fillStyle = '#7ee787'; c.font = font(22, 700, 'Inter Display'); c.fillText('AUC 0.91', R - 104, B - 16);
      c.fillStyle = '#e8ffe9'; c.font = font(12, 600); c.fillText('Churn and credit-risk · XGBoost + Random Forest', 14, 20);
      c.fillStyle = 'rgba(232,255,233,.55)'; c.font = font(10); c.fillText('false positive rate →', R - 110, h - 10);
    };
  },
  sql(cv) {
    let { c, w, h } = fit(cv); let t = 0;
    const q = 'SELECT sector, COUNT(*) AS startups\n  FROM startups s JOIN funding f\n    ON s.id = f.startup_id\n GROUP BY sector\n ORDER BY startups DESC;';
    const rows = ['Fintech', 'Edtech', 'Healthtech', 'SaaS', 'D2C'];
    return (dt) => {
      t += dt; c.clearRect(0, 0, w, h);
      const n = Math.min(q.length, Math.floor((t % 9) * 22));
      c.fillStyle = '#9ecbff'; c.font = mono(12);
      q.slice(0, n).split('\n').forEach((line, i) => c.fillText(line, 14, 24 + i * 16));
      if (n >= q.length) rows.forEach((r, i) => { const bw = (w - 150) * (1 - i * 0.15) * Math.min(1, (t % 9 - q.length / 22) * 1.5); c.fillStyle = 'rgba(158,203,255,.18)'; c.fillRect(110, 112 + i * 20, Math.max(0, bw), 13); c.fillStyle = '#d8e9ff'; c.font = font(11); c.fillText(r, 14, 123 + i * 20); });
      c.fillStyle = 'rgba(216,233,255,.5)'; c.font = font(10); c.fillText('illustrative rows · normalised MySQL schema', 14, h - 8);
    };
  },
};

export function startDemo(cv, type) {
  const make = DEMOS[type]; if (!make) return () => {};
  let draw = make(cv); let raf = 0; let last = performance.now(); let visible = true;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
  if (io) io.observe(cv);
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!visible) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(dt); };
  raf = requestAnimationFrame(loop);
  const onResize = () => { draw = make(cv); };
  window.addEventListener('resize', onResize);
  return () => { cancelAnimationFrame(raf); if (io) io.disconnect(); window.removeEventListener('resize', onResize); };
}

// The desk: midnight to 5 AM, seen from Waris's chair.
import { DeskGL } from './desk-gl.js';
import { Rope } from './rope.js';
import { LaptopScreen, screenMarkup } from './desk-screen.js';
import { $, $$, clamp, lerp, tween, easeInOut, easeOut, smoother, esc, quadMatrix, noise1, REDUCED, wait, applyCss } from './util.js';

const IW = 1586; const IH = 992;
const BASE = 'assets/desk/';
const STEPS = ['lamp', 'laptop', 'id', 'photo', 'poster', 'notebook', 'sketch'];
const STEP_NAMES = { lamp: 'Lamp', laptop: 'Laptop', id: 'TEDx card', photo: 'Team photo', poster: 'Posters', notebook: 'Notebook', sketch: 'Sketchbook' };
const HINTS = {
  lamp: 'Pull the lamp chain. Drag it down, or click.',
  laptop: 'Wake the laptop and log in.',
  id: 'The TEDxTIET card on the wall has a story.',
  photo: 'Look at the team photo, or one of the pinned polaroids.',
  poster: 'Read one of the posters.',
  notebook: 'Open the notebook, or pick up the pen.',
  sketch: 'Flip through the sketchbook.',
};
const SCREEN_Q = [[583, 318], [1118, 304], [1162, 645], [606, 692]];
const CUP = { 1: [494, 611, 76, 17], 2: [529, 619, 88, 21], 3: [526, 620, 88, 21], 4: [522, 617, 88, 21] };
const PEN_TIP = [1426, 679];
const TICKS = [[1316, 647], [1334, 670]];
const PIVOT = 0.35;
const PX = 8; const PY = 5; // parallax amplitude in photo pixels (matches desk-gl.js)

const POLAROIDS = [
  { x: 380, y: 300, r: -6, i: 0 },
  { x: 482, y: 300, r: 4, i: 3 },
  { x: 1022, y: 222, r: 5, i: 1 },
  { x: 1362, y: 182, r: -4, i: 2 },
];

// hotspots: key, label, box [x0, y0, x1, y1] in photo pixels, depth
const HOT = [
  { k: 'screen', label: 'Laptop', box: [583, 304, 1162, 692], d: 0.46 },
  { k: 'cup', label: 'Take a sip', box: [355, 575, 600, 800], d: 0.62 },
  { k: 'pen', label: 'Pick up the pen', box: [552, 808, 728, 968], d: 0.86 },
  { k: 'notebook', label: 'Notebook', box: [1205, 535, 1565, 728], d: 0.5 },
  { k: 'sketch', label: 'Sketchbook', box: [0, 655, 478, 992], d: 0.85 },
  { k: 'poster', label: 'Poster', box: [425, 0, 745, 240], d: 0.1, idx: 0 },
  { k: 'poster', label: 'Poster', box: [750, 0, 1075, 175], d: 0.1, idx: 1 },
  { k: 'poster', label: 'Poster', box: [1085, 0, 1300, 140], d: 0.1, idx: 2 },
  { k: 'id', label: 'TEDxTIET card', box: [1442, 140, 1586, 412], d: 0.15 },
  { k: 'photo', label: 'Team photo', box: [1172, 328, 1436, 528], d: 0.36 },
  { k: 'books', label: 'Bookshelf of skills', box: [212, 382, 478, 634], d: 0.38 },
  { k: 'plant', label: 'Plant', box: [0, 232, 210, 530], d: 0.34 },
  { k: 'plant', label: 'Plant', box: [1450, 388, 1586, 520], d: 0.42 },
];

function minutesLabel(min) {
  const h = Math.floor(min / 60); const m = Math.floor(min % 60);
  return { hm: `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`, ampm: 'AM' };
}

export default {
  title: 'The desk',
  async mount(el, ctx) {
    const { data, audio, go, toast, tip } = ctx;
    const S = {
      frameA: 1, frameB: 1, morph: 0, busy: false,
      mx: 0, my: 0, tmx: 0, tmy: 0, lastMove: 0,
      lamp: 0, lampOn: false, dawn: 0, window: 0, curtainOpen: false,
      typing: 1, sway: 1, flutter: 0.4, grain: 1,
      coffee: 1, heat: 1, done: {}, dawnStarted: false, ticks: 0, writing: false,
      time: 0, t0: performance.now(), lastInteract: performance.now(), zooming: false,
      intro: 0, draw: 0, revealX: 0.55, revealY: 0.55, introOn: true,
      hover: 0, hoverT: 0, hoverX: 0, hoverY: 0, hoverR: 120, hoverBox: null,
    };
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    // ---------- markup ----------
    const polaroids = POLAROIDS.map((p, n) => {
      const ph = data.photos[p.i];
      return `<button class="polaroid hot" type="button" data-hot="polaroid" data-i="${p.i}" aria-label="Pinned photo: ${esc(ph.caption)}"
        data-css="--x:${(p.x - 46) / IW * 100}%;--y:${(p.y - 55) / IH * 100}%;--r:${p.r}deg;--delay:${-n * 1.7}s">
        <span class="pin" aria-hidden="true"></span><img src="${ph.img}" alt="" loading="lazy"><span class="cap">${esc(ph.caption)}</span></button>`;
    }).join('');
    const hotBtns = HOT.map((h, i) => {
      const [x0, y0, x1, y1] = h.box;
      return `<button class="hot hot-zone hz-${h.k}" type="button" data-hot="${h.k}" data-i="${i}" ${h.idx != null ? `data-idx="${h.idx}"` : ''} aria-label="${esc(h.label)}"
        data-css="left:${x0 / IW * 100}%;top:${y0 / IH * 100}%;width:${(x1 - x0) / IW * 100}%;height:${(y1 - y0) / IH * 100}%"></button>`;
    }).join('');

    el.innerHTML = `
    <section class="desk" id="desk" aria-label="Interactive desk, midnight to 5 AM">
      <div class="desk-stage" id="stage">
        <canvas class="desk-gl" id="deskGL" aria-hidden="true"></canvas>
        <img class="desk-fallback" id="deskFallback" src="${BASE}f1.jpg" alt="Waris's desk at night: lamp, laptop, coffee, sketchbook, notebook, posters and a TEDxTIET card." hidden>

        <div class="plane" data-d="0.12" id="wallPlane">
          <svg class="lights" viewBox="0 0 ${IW} ${IH}" preserveAspectRatio="none" aria-hidden="true">
            <defs><radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffd59a" stop-opacity=".55"/><stop offset=".35" stop-color="#ffb866" stop-opacity=".22"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient></defs><path class="string" d="M420 6 C 700 74, 1150 70, 1440 10" />
            ${Array.from({ length: 15 }, (_, i) => { const t = (i + 0.5) / 15; const x = 420 + 1020 * t; const y = 6 + 4 * t + 260 * t * (1 - t) * 0.92; return `<g class="bulb" data-css="--d:${(i * 0.37) % 2.4}s"><circle cx="${x.toFixed(1)}" cy="${(y + 7).toFixed(1)}" r="22" class="halo"/><circle cx="${x.toFixed(1)}" cy="${(y + 7).toFixed(1)}" r="2.6" class="core"/></g>`; }).join('')}
          </svg>
          ${polaroids}
          <div class="idcard-face" aria-hidden="true">
            <span class="ic-top">TED<b>x</b>TIET</span>
            <span class="ic-photo"><img src="assets/people/id-portrait.png" alt=""></span>
            <span class="ic-name">WARIS</span>
            <span class="ic-role">Executive Committee Lead</span>
            <span class="ic-dept">Creativity &amp; Logistics</span>
          </div>
          <div class="sticky s1" aria-hidden="true">LeetCode<br>700+ <em>✓</em></div>
          <div class="sticky s2" aria-hidden="true">sleep is a<br>feature, not<br>a bug</div>
        </div>

        <div class="plane" data-d="0.36"><div class="frame-photo" aria-hidden="true"><img src="assets/people/team-photo.jpg" alt=""></div></div>

        <div class="plane" data-d="0.46" id="lidPlane">
          <div class="screen-map" id="screenMap">${screenMarkup()}</div>
        </div>

        <svg class="overlay-svg" id="ovl" viewBox="0 0 ${IW} ${IH}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="brass" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2c2"/><stop offset=".35" stop-color="#e2b25a"/><stop offset=".8" stop-color="#7a5320"/><stop offset="1" stop-color="#3d2a10"/></radialGradient>
            <radialGradient id="steel" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b9bcc4"/><stop offset="1" stop-color="#4a4d55"/></radialGradient>
            <radialGradient id="crema" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#b5733f"/><stop offset=".6" stop-color="#7a4422"/><stop offset="1" stop-color="#4a2511"/></radialGradient>
            <linearGradient id="cupIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1513"/><stop offset=".55" stop-color="#2d2420"/><stop offset="1" stop-color="#0d0a09"/></linearGradient>
            <clipPath id="mouthClip"><ellipse id="mouthClipE" cx="494" cy="611" rx="76" ry="17"/></clipPath>
          </defs>
          <g class="g-cup" data-d="0.62" id="cupG" opacity="0">
            <g clip-path="url(#mouthClip)">
              <ellipse id="cupInner" cx="494" cy="611" rx="76" ry="17" fill="url(#cupIn)"/>
              <ellipse id="cupRing" cx="494" cy="611" rx="74" ry="16" fill="none" stroke="#5b3a22" stroke-opacity=".55" stroke-width="1.4"/>
              <ellipse id="coffee" cx="494" cy="611" rx="76" ry="17" fill="url(#crema)"/>
              <ellipse id="coffeeShine" cx="470" cy="606" rx="22" ry="4" fill="#fff" opacity=".12"/>
            </g>
          </g>
          <g class="g-ticks" data-d="0.48" id="tickG">
            <path class="tick" d="M${TICKS[0][0]} ${TICKS[0][1] + 7} l5 6 l11 -14"/>
            <path class="tick" d="M${TICKS[1][0]} ${TICKS[1][1] + 7} l5 6 l11 -14"/>
          </g>
          <g class="g-ink" data-d="0.52" id="inkG"><path class="ink" id="inkPath" d="M${PEN_TIP[0] - 44} ${PEN_TIP[1] + 4} c 8 -6, 14 6, 22 0 s 12 -8, 20 -1"/></g>
          <g class="g-chain" data-d="0.32" id="chainG">
            <g id="chainBalls"></g>
            <g id="pullBead"><path d="M0 -9 C 7 -9, 9 4, 0 15 C -9 4, -7 -9, 0 -9 Z" fill="url(#brass)" stroke="#3d2a10" stroke-width=".8"/><ellipse cx="-2.5" cy="-2" rx="2" ry="3.5" fill="#fff" opacity=".55"/></g>
            <circle id="chainHit" r="26" fill="transparent" class="chain-hit"/>
          </g>
          <g class="g-keys" data-d="0.40" id="keysG">
            <g id="keyChain1"></g><g id="keyChain2"></g>
            <g id="panda" class="charm">
              <circle r="15" cy="16" fill="#f7f4ee" stroke="#1d1b1a" stroke-width="1.2"/>
              <circle cx="-11" cy="4" r="5.4" fill="#151414"/><circle cx="11" cy="4" r="5.4" fill="#151414"/>
              <ellipse cx="-6" cy="16" rx="4.2" ry="5.4" fill="#151414" transform="rotate(-22 -6 16)"/><ellipse cx="6" cy="16" rx="4.2" ry="5.4" fill="#151414" transform="rotate(22 6 16)"/>
              <circle cx="-5.6" cy="15.4" r="1.5" fill="#fff"/><circle cx="6.2" cy="15.4" r="1.5" fill="#fff"/>
              <ellipse cx="0" cy="22" rx="2.6" ry="1.8" fill="#151414"/><path d="M-3 25 Q0 27.5 3 25" stroke="#151414" stroke-width="1" fill="none"/>
              <ellipse cx="-11" cy="21" rx="3" ry="1.6" fill="#f2a0a0" opacity=".55"/><ellipse cx="11" cy="21" rx="3" ry="1.6" fill="#f2a0a0" opacity=".55"/>
              <circle cx="0" cy="-1" r="2.6" fill="none" stroke="url(#steel)" stroke-width="1.6"/>
            </g>
            <g id="tag" class="charm">
              <rect x="-11" y="0" width="22" height="30" rx="4" fill="#15120d" stroke="#d6a95a" stroke-width="1.3"/>
              <image href="assets/brand/varwix-mark.png" x="-8" y="5" width="16" height="16"/>
              <text x="0" y="26" text-anchor="middle" class="tag-text">VARWIX</text>
              <circle cx="0" cy="-1" r="2.4" fill="none" stroke="url(#steel)" stroke-width="1.5"/>
            </g>
            <circle id="keysHit" cx="533" cy="505" r="34" fill="transparent" class="keys-hit"/>
          </g>
        </svg>

        <canvas class="desk-fx" id="deskFX" aria-hidden="true"></canvas>
        <div class="curtain" id="curtain" aria-hidden="true"><span class="rod"></span></div>
        <div class="hot-layer" id="hotLayer">${hotBtns}<button class="hot hot-zone hz-curtain" type="button" data-hot="curtain" aria-label="Open the curtain"></button>
          <button class="visually-hidden" type="button" data-hot="lamp">Pull the lamp chain</button></div>
        <div class="desk-focus" id="deskFocus" aria-hidden="true"></div>
      </div>

      <div class="desk-hud">
        <div class="hud-left">
          <div class="hud-clock" aria-live="polite"><span class="hc-time" id="hcTime">12:00</span><span class="hc-ampm">AM</span></div>
          <div class="hud-place">Thapar Institute, Patiala · <span id="hcPhase">midnight</span></div>
          <ol class="hud-steps" id="hudSteps" aria-label="Progress through the night">${STEPS.map((s) => `<li data-step="${s}" title="${STEP_NAMES[s]}"><span>${STEP_NAMES[s]}</span></li>`).join('')}</ol>
        </div>
        <div class="hud-right">
          <button class="hud-btn" id="deskSound" type="button" aria-pressed="false"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="lbl">Sound off</span></button>
          <button class="hud-btn" type="button" data-act="sunrise">Skip to 5 AM</button>
          <button class="hud-btn primary" type="button" data-act="enter">Enter the masterclass <span aria-hidden="true">→</span></button>
        </div>
        <p class="hud-hint" id="hudHint">${HINTS.lamp}</p>
      </div>

      <div class="desk-sheet" id="sheet" hidden><div class="sheet-back" data-close></div><div class="sheet-panel" id="sheetPanel" role="dialog" aria-modal="true" aria-labelledby="sheetTitle"></div></div>

      <div class="finale" id="finale" hidden>
        <p class="kicker">5:00 AM</p>
        <h2>Built in the <em>quiet hours.</em></h2>
        <p class="finale-sub">Waris: Computer Science at Thapar, Executive Committee Lead at TEDxTIET, the builder behind VARWIX, and a portrait artist since 2018.</p>
        <div class="finale-row"><a class="btn" href="#/masterclass">Enter the masterclass <span class="arr">→</span></a><a class="btn ghost" href="#/gallery">Walk the gallery</a><a class="btn ghost" href="#/expo">Visit the expo</a></div>
      </div>

      <div class="intro" id="intro">
        <div class="intro-inner">
          <p class="kicker intro-kicker">12:00 AM · Thapar Institute, Patiala</p>
          <svg class="intro-sign" viewBox="0 0 640 200" role="img" aria-label="Waris">
            <text x="320" y="150" text-anchor="middle">Waris</text>
          </svg>
          <p class="intro-line">Built in the <em>quiet hours.</em></p>
          <p class="intro-note"><span class="brush-ico" aria-hidden="true"></span>Paint over the sketch with your cursor. Then bring the night to life.</p>
          <div class="intro-row">
            <button class="btn" type="button" data-intro="sound">Bring it to life <span class="arr">♪</span></button>
            <button class="btn ghost" type="button" data-intro="quiet">Without sound</button>
          </div>
        </div>
      </div>
      <div class="rotate-tip" aria-hidden="true">Turn your phone sideways for the full desk.</div>
    </section>`;

    applyCss(el);
    const stage = $('#stage', el);
    (function angleScreenHit() {
      const b = HOT[0].box; const w = b[2] - b[0]; const h = b[3] - b[1];
      const poly = SCREEN_Q.map(([x, y]) => `${((x - b[0]) / w * 100).toFixed(2)}% ${((y - b[1]) / h * 100).toFixed(2)}%`).join(', ');
      const hz = el.querySelector('.hz-screen'); if (hz) hz.style.clipPath = `polygon(${poly})`;
    }());
    const canvas = $('#deskGL', el);
    const fx = $('#deskFX', el);
    const fctx = fx.getContext('2d');
    const planes = $$('.plane', el).map((p) => ({ el: p, d: parseFloat(p.dataset.d) }));
    const svgGroups = $$('#ovl [data-d]', el).map((g) => ({ el: g, d: parseFloat(g.dataset.d) }));
    const screen = new LaptopScreen($('#lap', el), { onState: (s) => { if (s === 'desktop') { complete('laptop'); stage.classList.add('lap-open'); tip.hide(); } } });
    const screenMap = $('#screenMap', el);
    const hint = $('#hudHint', el);

    // ---------- paint mask for the opening (cursor reveals colour under the sketch) ----------
    const paintCv = document.createElement('canvas'); paintCv.width = 400; paintCv.height = 250;
    const pctx = paintCv.getContext('2d'); pctx.fillStyle = '#000'; pctx.fillRect(0, 0, 400, 250);
    let paintDirty = true; let lastPaint = null;
    function paintAt(u, v) {
      const x = u * 400; const y = v * 250;
      const pts = lastPaint ? Math.max(1, Math.ceil(Math.hypot(x - lastPaint[0], y - lastPaint[1]) / 4)) : 1;
      for (let i = 1; i <= pts; i++) {
        const px = lastPaint ? lerp(lastPaint[0], x, i / pts) : x; const py = lastPaint ? lerp(lastPaint[1], y, i / pts) : y;
        const g = pctx.createRadialGradient(px, py, 0, px, py, 26);
        g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        pctx.fillStyle = g; pctx.beginPath(); pctx.arc(px, py, 26, 0, 6.283); pctx.fill();
      }
      lastPaint = [x, y]; paintDirty = true;
    }

    // ---------- renderer ----------
    let gl = null;
    try {
      gl = new DeskGL(canvas);
      await gl.load(BASE);
      gl.updateTex('paint', paintCv);
    } catch (e) {
      console.warn('Desk renderer fallback:', e.message);
      gl = null; canvas.hidden = true; $('#deskFallback', el).hidden = false;
    }

    // ---------- layout: the photo always covers the viewport ----------
    let sc = 1; let stageW = 0; let stageH = 0; let offX = 0; let offY = 0;
    function layout() {
      const vw = window.innerWidth; const vh = window.innerHeight;
      const over = 1.045; // overscan so parallax never shows an edge
      stageW = Math.max(vw, vh * IW / IH) * over; stageH = stageW * IH / IW;
      sc = stageW / IW;
      const focusX = vw < vh ? 870 : IW / 2;
      offX = clamp(vw / 2 - focusX * sc, vw - stageW, 0);
      offY = (vh - stageH) / 2;
      stage.style.width = stageW + 'px'; stage.style.height = stageH + 'px';
      stage.style.left = offX + 'px'; stage.style.top = offY + 'px';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (gl) gl.resize(stageW, stageH, Math.min(dpr, 3172 / stageW));
      fx.width = Math.round(stageW * Math.min(dpr, 1.25)); fx.height = Math.round(stageH * Math.min(dpr, 1.25));
      const q = SCREEN_Q.map(([x, y]) => [x * sc, y * sc]);
      $('#lap', el).style.transform = quadMatrix(1280, 800, q);
      stage.style.setProperty('--sc', sc);
    }
    layout();
    window.addEventListener('resize', layout);

    // ---------- pointer: look around ----------
    function toImg(e) { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / (r.width / IW), (e.clientY - r.top) / (r.height / IH)]; }
    function onMove(e) {
      if (e.pointerType === 'touch') return;
      S.tmx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
      S.tmy = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
      S.lastMove = performance.now(); S.lastInteract = S.lastMove;
      if (S.introOn && S.intro < 0.01) { const [ix, iy] = toImg(e); paintAt(clamp(ix / IW), clamp(iy / IH)); }
      if (dragging) { const [x, y] = toImg(e); chain.grab = [clamp(x, CHAIN_A[0] - 50, CHAIN_A[0] + 50), clamp(y, chainRestEnd() - 10, chainRestEnd() + 46)]; }
      tip.move(e.clientX, e.clientY);
    }
    window.addEventListener('pointermove', onMove);

    // ---------- lamp chain ----------
    const CHAIN_A = [314, 214];
    const chain = new Rope(CHAIN_A[0], CHAIN_A[1], 12, 9.4, { gravity: 1500, damping: 0.988 });
    const chainRestEnd = () => CHAIN_A[1] + 12 * 9.4;
    let dragging = false; let dragStart = null; let pulled = 0;
    const keys1 = new Rope(530, 466, 4, 7.5, { gravity: 1300, damping: 0.982 });
    const keys2 = new Rope(538, 467, 3, 7, { gravity: 1300, damping: 0.982 });
    const chainHit = $('#chainHit', el);
    chainHit.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; dragStart = toImg(e); pulled = 0;
      chainHit.setPointerCapture(e.pointerId); stage.classList.add('grabbing'); audio.sfx('chain');
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false; stage.classList.remove('grabbing');
      const end = chain.grab; chain.grab = null;
      const moved = dragStart && e ? Math.hypot(toImg(e)[0] - dragStart[0], toImg(e)[1] - dragStart[1]) : 0;
      if (end && end[1] - chainRestEnd() > 16) { toggleLamp(); chain.impulse(0, -6); }
      else if (moved < 6) tug();
    };
    chainHit.addEventListener('pointerup', release);
    chainHit.addEventListener('pointercancel', () => { dragging = false; chain.grab = null; });
    chainHit.addEventListener('pointerenter', (e) => { tip.show(S.lampOn ? 'Pull to switch off' : 'Pull the chain', e.clientX, e.clientY); });
    chainHit.addEventListener('pointerleave', () => tip.hide());

    function tug() {
      if (S.tugging) return; S.tugging = true;
      audio.sfx('chain');
      const end = chain.end();
      tween(0, 1, 160, (v) => { chain.grab = [lerp(end[0], CHAIN_A[0] + 2, v), chainRestEnd() + 26 * v]; }, easeOut, () => {
        toggleLamp();
        later(() => { chain.grab = null; chain.impulse(1.5, -7); S.tugging = false; }, 60);
      });
    }

    function toggleLamp(force) {
      const on = force == null ? !S.lampOn : force;
      if (on === S.lampOn) return;
      S.lampOn = on;
      audio.sfx('lampClick');
      if (S.lampAnim) S.lampAnim();
      if (on) {
        // filament warm-up: a quick stutter, then an eased rise
        const keys = [[0, 0], [0.06, 0.5], [0.12, 0.12], [0.2, 0.72], [0.27, 0.45], [0.36, 0.82], [1, 1]];
        S.lampAnim = tween(0, 1, REDUCED ? 1 : 1100, (_, t) => {
          let k = 1; while (k < keys.length - 1 && keys[k][0] < t) k++;
          const [t0, v0] = keys[k - 1]; const [t1, v1] = keys[k];
          S.lamp = lerp(v0, v1, smoother(clamp((t - t0) / (t1 - t0))));
        }, (t) => t);
        complete('lamp');
      } else {
        const from = S.lamp;
        S.lampAnim = tween(from, 0, REDUCED ? 1 : 650, (v) => { S.lamp = v; }, easeOut);
      }
      stage.classList.toggle('lamp-on', on);
      ambienceFor();
    }

    // ---------- gestures (hand frames morphing) ----------
    function morphTo(n, ms) {
      return new Promise((res) => {
        if (S.frameB === n && S.morph === 0 && S.frameA === n) { res(); return; }
        const from = S.frameA === S.frameB ? S.frameA : S.frameB;
        S.frameA = from; S.frameB = n; S.morph = 0;
        tween(0, 1, REDUCED ? 1 : ms, (v) => { S.morph = v; }, (t) => 0.5 - 0.5 * Math.cos(Math.PI * t), () => { S.frameA = n; S.frameB = n; S.morph = 0; res(); });
      });
    }

    async function sip() {
      if (S.busy || S.dawnStarted && S.coffee <= 0.02) return;
      if (S.coffee <= 0.02) { toast('Empty. Another cup? Click the mug again to refill.'); S.refill = true; return; }
      S.busy = true; S.lastInteract = performance.now();
      await morphTo(2, 1150);
      audio.sfx('sip');
      await tweenP(S.coffee, Math.max(0, S.coffee - 0.16), 1300, (v) => { S.coffee = v; });
      await wait(300);
      await morphTo(1, 1150);
      audio.sfx('clink');
      S.busy = false;
    }
    function refill() {
      S.refill = false; audio.sfx('sip');
      tween(S.coffee, 1, 1600, (v) => { S.coffee = v; S.heat = Math.max(S.heat, v); });
      toast('Fresh coffee. The night continues.');
    }
    const tweenP = (a, b, ms, fn) => new Promise((r) => tween(a, b, ms, fn, easeInOut, r));

    async function write() {
      if (S.busy) return;
      S.busy = true; S.lastInteract = performance.now();
      await morphTo(4, 1050);
      await wait(300);
      audio.sfx('page');
      await morphTo(3, 950);
      S.writing = true; audio.sfx('scratch');
      const ink = $('#inkPath', el); ink.classList.remove('drawn'); void ink.getBBox(); ink.classList.add('drawn');
      await wait(2300);
      S.writing = false;
      await morphTo(4, 950);
      audio.sfx('page');
      await morphTo(1, 1100);
      if (S.ticks < 2) { S.ticks++; paintTicks(); toast(S.ticks === 1 ? 'Ticked: Revision.' : 'Ticked: Gym. Somehow.'); }
      complete('notebook');
      S.busy = false;
    }
    function paintTicks() { $$('#tickG .tick', el).forEach((t, i) => t.classList.toggle('drawn', i < S.ticks)); }

    // ---------- step progress, clock, coffee ----------
    function minutes() { return S.dawnStarted ? 300 : STEPS.filter((s) => S.done[s]).length * (300 / STEPS.length); }
    function complete(step) {
      if (S.done[step]) return;
      S.done[step] = true;
      const li = $(`#hudSteps [data-step="${step}"]`, el); if (li) li.classList.add('done');
      audio.sfx('chime');
      const m = minutes();
      S.coffee = Math.min(S.coffee, Math.max(0.08, 1 - m / 300 * 0.75));
      paintClock();
      updateHint();
      if (STEPS.every((s) => S.done[s])) later(startDawn, 1600);
    }
    function paintClock() {
      const lab = minutesLabel(minutes());
      $('#hcTime', el).textContent = lab.hm;
      screen.setClock(lab.hm + ' AM');
      const m = minutes();
      $('#hcPhase', el).textContent = m < 60 ? 'midnight' : m < 180 ? 'deep night' : m < 280 ? 'before dawn' : 'sunrise';
    }
    function nextStep() { return STEPS.find((s) => !S.done[s]); }
    function updateHint() {
      if (S.dawnStarted) { hint.textContent = 'Sunrise. The night was worth it.'; markNext(null); return; }
      const n = nextStep();
      hint.textContent = HINTS[n] || '';
      markNext(n);
    }
    function markNext(step) {
      $$('.hot-layer .hot, .polaroid', el).forEach((b) => b.classList.remove('next'));
      stage.classList.toggle('chain-next', step === 'lamp');
      const map = { laptop: '.hz-screen', id: '.hz-id', photo: '.hz-photo', poster: '.hz-poster', notebook: '.hz-notebook', sketch: '.hz-sketch' };
      if (map[step]) $$(map[step], el).forEach((b) => b.classList.add('next'));
    }

    // ---------- curtain and dawn ----------
    function setCurtain(open) {
      S.curtainOpen = open;
      $('#curtain', el).classList.toggle('open', open);
      $('.hz-curtain', el).setAttribute('aria-label', open ? 'Close the curtain' : 'Open the curtain');
      tween(S.window, open ? 1 : 0, 1600, (v) => { S.window = v; }, easeInOut);
      S.flutter = open ? 1 : 0.4;
      audio.sfx('whoosh');
    }
    async function startDawn() {
      if (S.dawnStarted) return;
      S.dawnStarted = true;
      closeSheet();
      ['lamp', 'laptop', 'id', 'photo', 'poster', 'notebook', 'sketch'].forEach((s) => { S.done[s] = true; const li = $(`#hudSteps [data-step="${s}"]`, el); if (li) li.classList.add('done'); });
      paintClock(); updateHint();
      if (!S.curtainOpen) setCurtain(true);
      later(() => { if (S.lampOn) tug(); }, 900);
      stage.classList.add('dawn');
      tween(0, 1, REDUCED ? 1 : 5200, (v) => { S.dawn = v; }, easeInOut);
      tween(S.coffee, 0, 3000, (v) => { S.coffee = v; });
      ambienceFor();
      later(() => { const f = $('#finale', el); f.hidden = false; requestAnimationFrame(() => f.classList.add('show')); }, REDUCED ? 0 : 3600);
    }

    function ambienceFor() {
      if (!audio.isOn()) return;
      audio.ambience('room', 1);
      audio.ambience('rain', S.dawnStarted ? 0 : 1);
      audio.ambience('birds', S.dawnStarted ? 1 : 0);
    }
    const offSound = audio.onChange((on) => { paintDeskSound(on); if (on) ambienceFor(); else audio.stopAll(); });
    const deskSound = $('#deskSound', el);
    function paintDeskSound(on) {
      deskSound.setAttribute('aria-pressed', on ? 'true' : 'false');
      deskSound.querySelector('.lbl').textContent = on ? 'Sound on' : 'Sound off';
    }
    paintDeskSound(audio.isOn());
    deskSound.addEventListener('click', () => audio.setOn(!audio.isOn()));

    // ---------- the laptop: camera push into the screen ----------
    async function zoomInto(hash) {
      if (S.zooming) return; S.zooming = true;
      closeSheet();
      const cx = 870 * sc + offX; const cy = 500 * sc + offY;
      const k = Math.min(window.innerWidth / (560 * sc), window.innerHeight / (380 * sc)) * 1.05;
      stage.style.transformOrigin = `${870 * sc}px ${500 * sc}px`;
      stage.classList.add('zooming');
      stage.style.transform = `translate(${window.innerWidth / 2 - cx}px, ${window.innerHeight / 2 - cy}px) scale(${k})`;
      audio.sfx('whoosh');
      await wait(REDUCED ? 0 : 1050);
      go(hash);
    }

    // ---------- sheets (close-ups) ----------
    const sheet = $('#sheet', el); const panel = $('#sheetPanel', el);
    let lastFocus = null;
    function openSheet(kind, html) {
      lastFocus = document.activeElement;
      panel.className = 'sheet-panel sheet-' + kind;
      panel.innerHTML = `<button class="sheet-close" type="button" data-close aria-label="Close">✕</button>${html}`;
      applyCss(panel);
      sheet.hidden = false; stage.classList.add('focused');
      requestAnimationFrame(() => sheet.classList.add('show'));
      audio.sfx('page');
      const f = panel.querySelector('.sheet-close'); if (f) f.focus({ preventScroll: true });
    }
    function closeSheet() {
      if (sheet.hidden) return;
      sheet.classList.remove('show'); stage.classList.remove('focused');
      later(() => { sheet.hidden = true; panel.innerHTML = ''; }, 380);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); const g = e.target.closest('[data-go]'); if (g) { closeSheet(); go(g.dataset.go); } const w = e.target.closest('[data-write]'); if (w) { closeSheet(); later(write, 380); } });

    function journeySheet() {
      const st = data.leadership.stages;
      return `<p class="kicker">TEDxTIET</p><h2 id="sheetTitle">From the core team to the board</h2>
        <ol class="j-steps">${st.map((s, i) => `<li class="j-${s.state}"><span class="j-dot">${i + 1}</span><div><b>${esc(s.title)}</b><small>${esc(s.when)}</small><p>${esc(s.lines[0])}</p></div></li>`).join('')}</ol>
        <div class="sheet-row"><button class="btn" type="button" data-go="#/stage">Take the stage <span class="arr">→</span></button></div>`;
    }
    function posterSheet(i) {
      const q = data.quotes[i];
      const box = [[425, 0, 745, 360], [745, 0, 1075, 290], [1088, 0, 1425, 330]][i];
      const bw = box[2] - box[0]; const bh = box[3] - box[1];
      return `<div class="poster-view"><div class="poster-crop" data-css="aspect-ratio:${bw}/${bh};background-image:url(${BASE}f1.jpg);background-size:${IW / bw * 100}% auto;background-position:${box[0] / (IW - bw) * 100}% ${box[1] / Math.max(1, IH - bh) * 100}%"></div>
        <figure class="poster-quote"><blockquote id="sheetTitle">“${esc(q.text)}”</blockquote><figcaption>${esc(q.who)} · <a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.source)}</a></figcaption>
        <p class="poster-why">Why it is on my wall: the same discipline that wins a chase wins a deadline. Every poster here is a promise I make again at 2 AM.</p></figure></div>`;
    }
    function notebookSheet() {
      const c = data.checklist;
      return `<div class="paper"><h2 id="sheetTitle" class="hand">Tasks</h2>
        <ul class="paper-list">${c.done.map((t) => `<li class="ok"><span class="box">✓</span><b>${esc(t.title)}</b> <span>${esc(t.detail.split('.')[0])}</span></li>`).join('')}
        ${c.pending.map((t) => `<li><span class="box"></span><b>${esc(t.title)}</b> <span>${esc(t.detail)}</span></li>`).join('')}</ul>
        <p class="paper-foot">Ticked tonight: ${S.ticks} of 2 on the desk page.</p>
        <div class="sheet-row"><button class="btn" type="button" data-write>Pick up the pen <span class="arr">✎</span></button></div></div>`;
    }
    function sketchSheet() {
      const art = data.art;
      return `<div class="book" id="book" data-page="0">
          <div class="book-spread">
            <div class="book-page left"><img id="bookL" src="${art[0].img}" alt="${esc(art[0].title)}"><span class="book-cap" id="bookLc">${esc(art[0].title)} · ${esc(art[0].medium)}</span></div>
            <div class="book-page right"><img id="bookR" src="${art[1].img}" alt="${esc(art[1].title)}"><span class="book-cap" id="bookRc">${esc(art[1].title)} · ${esc(art[1].medium)}</span></div>
            <div class="book-flip" id="bookFlip"><div class="bf-front"></div><div class="bf-back"></div></div>
          </div>
          <div class="book-nav"><button class="btn ghost" type="button" data-book="-1">← Back</button><span id="bookNo">1–2 of ${art.length}</span><button class="btn ghost" type="button" data-book="1">Turn the page →</button></div>
          <div class="sheet-row"><button class="btn" type="button" data-go="#/gallery">Walk the full gallery <span class="arr">→</span></button></div>
        </div><h2 id="sheetTitle" class="visually-hidden">Sketchbook</h2>`;
    }
    function booksSheet() {
      const sk = data.skills;
      return `<p class="kicker">The shelf</p><h2 id="sheetTitle">What the books taught</h2>
        <div class="shelf">${Object.entries(sk).map(([k, v], i) => `<details class="spine sp${i}"><summary>${esc(k)}</summary><div>${v.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></details>`).join('')}</div>`;
    }
    function photoSheet(img, caption, linkStage) {
      return `<figure class="photo-view"><img src="${img}" alt="${esc(caption)}"><figcaption id="sheetTitle">${esc(caption)}</figcaption></figure>
        ${linkStage ? '<div class="sheet-row"><button class="btn" type="button" data-go="#/stage">The TEDx story <span class="arr">→</span></button></div>' : ''}`;
    }
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-book]'); if (!b) return;
      const book = $('#book', panel); const dir = parseInt(b.dataset.book, 10);
      const art = data.art; let p = parseInt(book.dataset.page, 10) + dir * 2;
      if (p < 0 || p >= art.length) return;
      book.dataset.page = p;
      const flip = $('#bookFlip', panel);
      flip.className = 'book-flip ' + (dir > 0 ? 'fwd' : 'back');
      audio.sfx('page');
      later(() => {
        const L = art[p]; const R = art[p + 1];
        $('#bookL', panel).src = L.img; $('#bookLc', panel).textContent = `${L.title} · ${L.medium}`;
        if (R) { $('#bookR', panel).src = R.img; $('#bookRc', panel).textContent = `${R.title} · ${R.medium}`; }
        $('#bookNo', panel).textContent = `${p + 1}–${Math.min(p + 2, art.length)} of ${art.length}`;
      }, 380);
      later(() => { flip.className = 'book-flip'; }, 800);
    });

    // ---------- hotspot actions ----------
    const hotLayer = $('#hotLayer', el);
    function act(kind, btn) {
      S.lastInteract = performance.now();
      if (S.zooming) return;
      if (kind === 'lamp') { tug(); return; }
      if (kind === 'curtain') { setCurtain(!S.curtainOpen); return; }
      if (kind === 'screen') {
        if (screen.state === 'lock') { tip.hide(); screen.login(); audio.sfx('type'); return; }
        if (screen.state === 'desktop') { zoomInto('#/os'); }
        return;
      }
      if (kind === 'cup') { if (S.refill) refill(); else sip(); return; }
      if (kind === 'pen') { write(); return; }
      if (kind === 'notebook') { openSheet('notebook', notebookSheet()); complete('notebook'); return; }
      if (kind === 'sketch') { openSheet('sketch', sketchSheet()); complete('sketch'); return; }
      if (kind === 'poster') { openSheet('poster', posterSheet(parseInt(btn.dataset.idx, 10) || 0)); complete('poster'); return; }
      if (kind === 'id') { openSheet('journey', journeySheet()); complete('id'); return; }
      if (kind === 'photo') { openSheet('photo', photoSheet('assets/people/team-photo.jpg', 'TEDxTIET: the team behind the red letters', true)); complete('photo'); return; }
      if (kind === 'polaroid') { const ph = data.photos[parseInt(btn.dataset.i, 10)]; openSheet('photo', photoSheet(ph.img, ph.caption, ph.img.includes('tedx'))); complete('photo'); return; }
      if (kind === 'books') { openSheet('books', booksSheet()); return; }
      if (kind === 'plant') { S.sway = 3.2; tween(3.2, 1, 2200, (v) => { S.sway = v; }, easeOut); audio.sfx('page'); }
    }
    hotLayer.addEventListener('click', (e) => { const b = e.target.closest('[data-hot]'); if (b) act(b.dataset.hot, b); });
    $('#wallPlane', el).addEventListener('click', (e) => { const b = e.target.closest('[data-hot]'); if (b) act(b.dataset.hot, b); });
    function glowOn(btn) {
      const i = btn.dataset.i; const h = i != null ? HOT[parseInt(i, 10)] : null;
      if (!h) { S.hoverT = 0; return; }
      const [x0, y0, x1, y1] = h.box; S.hoverX = (x0 + x1) / 2; S.hoverY = (y0 + y1) / 2; S.hoverR = Math.max(x1 - x0, y1 - y0) * 0.55; S.hoverT = 1;
    }
    el.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.hot'); if (!b || e.pointerType === 'touch') return;
      glowOn(b);
      let label = b.getAttribute('aria-label') || '';
      if (b.dataset.hot === 'screen') label = screen.state === 'lock' ? 'Wake the laptop and log in' : 'Open the laptop full screen';
      if (b.dataset.hot === 'cup') label = S.refill ? 'Refill the coffee' : 'Take a sip';
      tip.show(label, e.clientX, e.clientY);
    });
    el.addEventListener('pointerout', (e) => { if (e.target.closest('.hot')) { tip.hide(); S.hoverT = 0; } });
    $('#keysHit', el).addEventListener('click', () => { keys1.impulse(9, -4); keys2.impulse(-7, -3); audio.sfx('chain'); toast('Panda says: one more commit.'); });

    screenMap.addEventListener('click', (e) => {
      if (screen.state !== 'desktop') return;
      const app = e.target.closest('[data-go]');
      e.stopPropagation();
      zoomInto(app ? app.dataset.go : '#/os');
    });
    screenMap.addEventListener('pointerover', (e) => { const app = e.target.closest('[data-go]'); if (app && e.pointerType !== 'touch') tip.show('Open ' + app.getAttribute('aria-label'), e.clientX, e.clientY); });
    screenMap.addEventListener('pointerout', (e) => { if (e.target.closest('[data-go]')) tip.hide(); });

    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'sunrise') startDawn();
      if (a.dataset.act === 'enter') zoomInto('#/masterclass');
    });
    el.querySelector('.intro').addEventListener('click', (e) => {
      const b = e.target.closest('[data-intro]'); if (!b) return;
      if (b.dataset.intro === 'sound') audio.setOn(true);
      const [ix, iy] = toImg(e); S.revealX = clamp(ix / IW, 0.15, 0.85); S.revealY = clamp(iy / IH, 0.2, 0.85);
      dismissIntro();
    });
    function finishIntro() {
      S.introOn = false; S.intro = 1; S.draw = 1;
      const intro = $('#intro', el); intro.hidden = true; intro.classList.add('gone');
      $('#desk', el).classList.remove('intro-on');
    }
    function dismissIntro() {
      const intro = $('#intro', el);
      if (!intro || intro.classList.contains('gone')) return;
      intro.classList.add('gone');
      try { sessionStorage.setItem('waris-intro', '1'); } catch (e) { /* storage blocked */ }
      audio.sfx('whoosh');
      tween(S.draw, 1, 400, (v) => { S.draw = v; });
      S.lamp = 0.9; // the painting blooms in warm light, then the lights go down to midnight
      later(() => { if (!S.lampOn) S.lampAnim = tween(S.lamp, 0, REDUCED ? 1 : 2200, (v) => { if (!S.lampOn) S.lamp = v; }, (t) => t * t * (3 - 2 * t)); }, REDUCED ? 0 : 2700);
      tween(0, 1, REDUCED ? 1 : 2600, (v) => { S.intro = v; }, (t) => 1 - Math.pow(1 - t, 2.2), () => finishIntro());
      later(() => $('#desk', el).classList.remove('intro-on'), REDUCED ? 0 : 1500);
      ambienceFor();
    }
    let seen = false; try { seen = sessionStorage.getItem('waris-intro') === '1'; } catch (e) { /* storage blocked */ }
    if (seen) finishIntro();
    else {
      $('#desk', el).classList.add('intro-on');
      // the sketch draws itself
      later(() => tween(0, 1, REDUCED ? 1 : 2800, (v) => { if (S.introOn) S.draw = Math.max(S.draw, v); }, (t) => 1 - Math.pow(1 - t, 3)), 250);
      later(() => audio.sfx('scratch'), 400);
    }

    const onKey = (e) => {
      if (e.key === 'Escape') closeSheet();
      if (e.key === 'l' && !e.target.closest('input, textarea')) tug();
    };
    document.addEventListener('keydown', onKey);
    paintClock(); updateHint();

    // ---------- steam and dust (2D canvas over the photo) ----------
    const steam = []; const dust = []; const flies = [];
    for (let i = 0; i < 46; i++) flies.push({ x: Math.random() * IW, y: Math.random() * IH, r: 1.5 + Math.random() * 3.5, p: Math.random() * 6.28, s: 0.3 + Math.random() * 0.8, h: Math.random() < 0.7 ? 38 : 330 });
    const puff = document.createElement('canvas'); puff.width = puff.height = 64;
    (() => { const c = puff.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,244,228,1)'); g.addColorStop(0.5, 'rgba(255,244,228,.35)'); g.addColorStop(1, 'rgba(255,244,228,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); })();
    const glow = document.createElement('canvas'); glow.width = glow.height = 64;
    (() => { const c = glow.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); })();
    for (let i = 0; i < 70; i++) dust.push({ x: Math.random(), y: Math.random(), s: Math.random(), p: Math.random() * 6.28 });
    function cupNow() {
      const A = CUP[S.frameA]; const B = CUP[S.frameB]; const m = easeInOut(S.morph);
      return A.map((v, i) => lerp(v, B[i], m));
    }
    function drawFx(dt) {
      const W = fx.width; const H = fx.height; const k = W / IW;
      fctx.clearRect(0, 0, W, H);
      const [cx, cy, rx] = cupNow();
      const dcup = (0.62 - PIVOT); const ox = -S.mx * dcup * PX; const oy = -S.my * dcup * PY;
      const heat = clamp(S.heat) * (S.coffee > 0.04 ? 1 : 0);
      if (heat > 0.02 && Math.random() < 0.55 * heat + 0.15) {
        steam.push({ x: cx + (Math.random() - 0.5) * rx * 1.1, y: cy - 4, vx: (Math.random() - 0.5) * 6, vy: -(18 + Math.random() * 16), life: 0, max: 2.8 + Math.random() * 1.8, r: 10 + Math.random() * 10, seed: Math.random() * 100 });
      }
      fctx.globalCompositeOperation = 'screen';
      for (let i = steam.length - 1; i >= 0; i--) {
        const p = steam[i]; p.life += dt;
        if (p.life > p.max) { steam.splice(i, 1); continue; }
        const t = p.life / p.max;
        p.x += (p.vx + noise1(p.seed + p.life * 0.9) * 22) * dt; p.y += p.vy * dt; p.r += 9 * dt;
        const a = Math.sin(Math.PI * t) * 0.075 * (0.5 + heat * 0.5) * (0.65 + S.lamp * 0.35 + S.dawn * 0.5) * S.intro;
        const rr = p.r * k;
        fctx.globalAlpha = a; fctx.drawImage(puff, (p.x + ox) * k - rr, (p.y + oy) * k - rr, rr * 2, rr * 2);
      }
      // dust in the lamp cone and in the sunbeams
      const lampDust = S.lamp; const sunDust = Math.max(S.dawn, S.window * 0.5);
      if (lampDust + sunDust > 0.02) {
        for (const d of dust) {
          d.p += dt * (0.3 + d.s * 0.5);
          d.y += dt * 0.004 * (0.5 + d.s); if (d.y > 1) d.y = 0;
          const x = d.x + Math.sin(d.p) * 0.01; const y = d.y;
          const ix = x * IW; const iy = y * IH;
          const inCone = Math.max(0, 1 - Math.abs((ix - 330) + (iy - 210) * 0.12) / (Math.max(0, iy - 200) * 0.7 + 60)) * (iy > 210 && iy < 760 ? 1 : 0);
          const inSun = (1 - clamp((ix + iy * 0.28 - 300) / 800)) * (((iy + ix * 0.42) / 26) % 1 > 0.25 && ((iy + ix * 0.42) / 26) % 1 < 0.65 ? 1 : 0.15);
          const a = (inCone * lampDust * 0.55 + inSun * sunDust * 0.45) * (0.4 + 0.6 * Math.sin(d.p * 2) ** 2);
          if (a < 0.02) continue;
          fctx.fillStyle = `rgba(255,226,170,${a})`;
          fctx.beginPath(); fctx.arc((ix - S.mx * 0.1 * PX) * k, (iy - S.my * 0.1 * PY) * k, (0.7 + d.s * 1.3) * k, 0, 6.283); fctx.fill();
        }
      }
      fctx.globalAlpha = 1;
      // fireflies drift over the sketch during the opening
      const fa = S.introOn ? 1 - S.intro : 0;
      if (fa > 0.01) {
        for (const f of flies) {
          f.p += dt * f.s; f.x += Math.cos(f.p * 0.7) * 14 * dt; f.y -= (6 + f.s * 10) * dt; if (f.y < -10) { f.y = IH + 10; f.x = Math.random() * IW; }
          const tw = 0.35 + 0.65 * Math.pow(Math.sin(f.p * 2.2) * 0.5 + 0.5, 2);
          const rr = f.r * k * 4;
          fctx.globalAlpha = fa * tw * 0.7;
          fctx.filter = 'none';
          fctx.drawImage(glow, f.x * k - rr, f.y * k - rr, rr * 2, rr * 2);
        }
        fctx.globalAlpha = 1;
      }
      fctx.globalCompositeOperation = 'source-over';
    }

    // ---------- SVG overlays: chain, keychains, coffee ----------
    const chainBalls = $('#chainBalls', el); const pullBead = $('#pullBead', el);
    const panda = $('#panda', el); const tag = $('#tag', el);
    const NS = 'http://www.w3.org/2000/svg';
    const balls = Array.from({ length: (chain.n - 1) * 2 }, () => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '1.9'); chainBalls.appendChild(c); return c; });
    const kp1 = document.createElementNS(NS, 'path'); kp1.setAttribute('class', 'kchain'); $('#keyChain1', el).appendChild(kp1);
    const kp2 = document.createElementNS(NS, 'path'); kp2.setAttribute('class', 'kchain'); $('#keyChain2', el).appendChild(kp2);
    function drawChain() {
      const pts = chain.p; let n = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
        for (let s = 0; s < 2; s++) { const t = s / 2; balls[n].setAttribute('cx', (x0 + (x1 - x0) * t).toFixed(1)); balls[n].setAttribute('cy', (y0 + (y1 - y0) * t).toFixed(1)); n++; }
      }
      const [ex, ey] = chain.end(); const ang = chain.endAngle() * 57.3;
      pullBead.setAttribute('transform', `translate(${ex.toFixed(1)} ${(ey + 8).toFixed(1)}) rotate(${(-ang).toFixed(1)})`);
      chainHit.setAttribute('cx', ex.toFixed(1)); chainHit.setAttribute('cy', (ey + 6).toFixed(1));
    }
    function drawKeys() {
      const line = (rope) => rope.p.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
      kp1.setAttribute('d', line(keys1)); kp2.setAttribute('d', line(keys2));
      const [ax, ay] = keys1.end(); const [bx, by] = keys2.end();
      panda.setAttribute('transform', `translate(${ax.toFixed(1)} ${ay.toFixed(1)}) rotate(${(-keys1.endAngle() * 57.3).toFixed(1)}) scale(.92)`);
      tag.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${(-keys2.endAngle() * 57.3).toFixed(1)}) scale(.82)`);
    }
    const cupG = $('#cupG', el); const coffee = $('#coffee', el); const inner = $('#cupInner', el);
    const ring = $('#cupRing', el); const clipE = $('#mouthClipE', el); const shine = $('#coffeeShine', el);
    function drawCup() {
      const [cx, cy, rx, ry] = cupNow();
      const level = clamp(S.coffee);
      cupG.setAttribute('opacity', level > 0.985 ? '0' : '1');
      [clipE, inner].forEach((e) => { e.setAttribute('cx', cx); e.setAttribute('cy', cy); e.setAttribute('rx', rx); e.setAttribute('ry', ry); });
      const drop = (1 - level) * ry * 2.6;
      ring.setAttribute('cx', cx); ring.setAttribute('cy', cy + 1.5); ring.setAttribute('rx', rx * 0.97); ring.setAttribute('ry', ry * 0.92);
      coffee.setAttribute('cx', cx); coffee.setAttribute('cy', cy + drop);
      coffee.setAttribute('rx', rx * (1 - (1 - level) * 0.14)); coffee.setAttribute('ry', ry * (1 - (1 - level) * 0.12));
      coffee.setAttribute('opacity', level < 0.03 ? 0 : 1);
      shine.setAttribute('cx', cx - rx * 0.3); shine.setAttribute('cy', cy + drop - ry * 0.3);
    }

    // ---------- main loop ----------
    let raf = 0; let last = performance.now(); let keyTimer = 0; let idleSipAt = performance.now() + 26000;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      S.time = (now - S.t0) / 1000;
      // camera: follow the mouse, breathe a little when idle
      const idle = now - S.lastMove > 2500;
      const drift = REDUCED ? 0 : 0.18;
      const tx = (idle ? noise1(S.time * 0.13) * drift : S.tmx); const ty = (idle ? noise1(S.time * 0.11 + 9) * drift * 0.7 : S.tmy);
      const pmx = S.mx; const pmy = S.my;
      S.mx += (tx - S.mx) * Math.min(1, dt * 3.2); S.my += (ty - S.my) * Math.min(1, dt * 3.2);
      // planes follow the same parallax as the shader
      for (const p of planes) { const k = (p.d - PIVOT); p.el.style.transform = `translate3d(${(-S.mx * k * PX * sc).toFixed(2)}px, ${(-S.my * k * PY * sc).toFixed(2)}px, 0)`; }
      for (const g of svgGroups) { const k = (g.d - PIVOT); g.el.setAttribute('transform', `translate(${(-S.mx * k * PX).toFixed(2)} ${(-S.my * k * PY).toFixed(2)})`); }
      // the chain's anchor moves with the lamp; the chain swings from that motion
      chain.anchor = [CHAIN_A[0], CHAIN_A[1]];
      if (Math.abs(S.mx - pmx) > 0.004) chain.impulse((S.mx - pmx) * 3.5, 0);
      chain.step(dt); keys1.step(dt); keys2.step(dt);
      // a faint draught moves the chain and keys
      if (Math.random() < 0.02) { chain.impulse(noise1(S.time) * 0.6, 0); keys1.impulse(noise1(S.time + 3) * 0.5, 0); }
      drawChain(); drawKeys(); drawCup();
      stage.style.setProperty('--lamp', S.lamp.toFixed(3)); stage.style.setProperty('--dawn', S.dawn.toFixed(3));
      const fr = S.frameA === S.frameB ? String(S.frameA) : '0'; if (stage.dataset.frame !== fr) stage.dataset.frame = fr;
      // heat falls through the night
      S.heat = clamp(Math.min(S.heat, 1.05 - minutes() / 300 * 0.8));
      // typing: in bursts while the hands rest on the keyboard
      const atKeys = S.frameA === 1 && S.frameB === 1 && !S.busy;
      const burst = noise1(S.time * 0.35) > -0.25 ? 1 : 0;
      S.typing += ((atKeys ? burst : 0) - S.typing) * Math.min(1, dt * 6);
      if (S.typing > 0.6 && audio.isOn() && now > keyTimer) { audio.sfx('key'); keyTimer = now + 70 + Math.random() * 160; }
      // now and then he takes a sip on his own
      if (!S.busy && !S.introOn && !S.dawnStarted && now > idleSipAt && now - S.lastInteract > 15000 && sheet.hidden && S.coffee > 0.1) { idleSipAt = now + 32000; sip(); }
      // hover glow: the hovered object, otherwise a slow pulse on the next thing to try
      if (S.hoverT === 0 && !S.introOn) {
        const nk = { laptop: 'screen', id: 'id', photo: 'photo', poster: 'poster', notebook: 'notebook', sketch: 'sketch' }[nextStep()];
        const h = nk ? HOT.find((x) => x.k === nk) : null;
        if (h && sheet.hidden) { const [x0, y0, x1, y1] = h.box; S.hoverX += ((x0 + x1) / 2 - S.hoverX) * 0.2; S.hoverY += ((y0 + y1) / 2 - S.hoverY) * 0.2; S.hoverR = Math.max(x1 - x0, y1 - y0) * 0.55; }
        const pulse = h && sheet.hidden ? 0.35 + 0.35 * Math.sin(S.time * 2.2) : 0;
        S.hover += (pulse - S.hover) * Math.min(1, dt * 4);
      } else S.hover += (S.hoverT - S.hover) * Math.min(1, dt * 8);
      if (gl && paintDirty && S.introOn) { gl.updateTex('paint', paintCv); paintDirty = false; }
      if (gl) gl.render({ frameA: S.frameA, frameB: S.frameB, morph: S.morph, mx: S.mx, my: S.my, time: S.time, lamp: S.lamp, dawn: S.dawn, window: S.window, typing: S.typing, sway: S.sway, flutter: S.flutter, intro: S.intro, draw: S.draw, revealX: S.revealX, revealY: S.revealY, hover: S.hover, hoverX: S.hoverX, hoverY: S.hoverY, hoverR: S.hoverR });
      else $('#deskFallback', el).style.filter = `brightness(${0.45 + S.lamp * 0.55 + S.dawn * 0.3})`;
      drawFx(dt);
    }
    raf = requestAnimationFrame(frame);
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', onVis);
    stage.classList.add('ready');

    // debug / calibration: index.html?hotspots=1#/
    if (/[?&]hotspots=1\b/.test(location.search)) stage.classList.add('debug');
    // test hooks
    window.__desk = { S, gl, startDawn, toggleLamp, sip, write, setCurtain, complete };

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      screen.destroy();
      offSound();
      window.removeEventListener('resize', layout);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
      if (S.lampAnim) S.lampAnim();
      delete window.__desk;
    };
  },
};

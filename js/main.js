import { $, $$, wait, REDUCED } from './util.js';
import * as audio from './audio.js';

const ROUTES = [
  { re: /^\/?$/, mod: () => import('./desk.js'), kicker: 'Midnight', title: 'The desk' },
  { re: /^\/masterclass$/, mod: () => import('./pages/masterclass.js'), kicker: 'Waris teaches', title: 'Building in the quiet hours' },
  { re: /^\/groundwork$/, mod: () => import('./pages/groundwork.js'), kicker: 'Chapter 02', title: 'The groundwork' },
  { re: /^\/stage$/, mod: () => import('./pages/stage.js'), kicker: 'Chapter 03', title: 'On the red circle' },
  { re: /^\/expo(?:\/([a-z0-9-]+))?$/, mod: () => import('./pages/expo.js'), kicker: 'Chapter 04', title: 'The tech expo' },
  { re: /^\/gallery(?:\/([a-z0-9-]+))?$/, mod: () => import('./pages/gallery.js'), kicker: 'Chapter 05', title: 'The VARWIX gallery' },
  { re: /^\/os$/, mod: () => import('./pages/os.js'), kicker: 'Chapter 06', title: 'The shell' },
  { re: /^\/contact$/, mod: () => import('./pages/contact.js'), kicker: 'Chapter 07', title: 'Sunrise' },
];

const app = $('#app');
const film = $('#film');
const state = { data: null, cleanup: null, route: null, first: true, busy: false, pending: null };

// ---------- shared UI ----------
const tipEl = $('#cursorTip');
export const tip = {
  show(text, x, y) { tipEl.textContent = text; tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; tipEl.classList.add('show'); },
  move(x, y) { tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; },
  hide() { tipEl.classList.remove('show'); },
};
let toastTimer = 0;
export function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
export function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

const soundBtn = $('#soundBtn');
function paintSound(on) {
  soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  soundBtn.querySelector('.sound-label').textContent = on ? 'Sound on' : 'Sound off';
}
audio.onChange(paintSound);
soundBtn.addEventListener('click', () => audio.setOn(!audio.isOn()));

const menuBtn = $('#menuBtn'); const nav = $('#nav');
menuBtn.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

// ---------- data ----------
async function loadData() {
  if (state.data) return state.data;
  const r = await fetch('data/content.json', { cache: 'no-cache' });
  state.data = await r.json();
  return state.data;
}

// ---------- routing with a film-cut transition ----------
function match(path) {
  for (const r of ROUTES) { const m = path.match(r.re); if (m) return { r, m }; }
  return null;
}

async function route() {
  const path = '/' + (location.hash || '').replace(/^#\/?/, '');
  if (state.busy) { state.pending = path; return; }
  state.busy = true;
  const found = match(path) || { r: ROUTES[1], m: [] };
  const sameModule = state.route && state.route.r === found.r;
  try {
    const [data, mod] = await Promise.all([loadData(), found.r.mod()]);
    if (sameModule && mod.default.handlesParams) { state.route = found; return; }
    const cut = !state.first && !sameModule && !REDUCED;
    if (cut) {
      $('#slateKicker').textContent = found.r.kicker; $('#slateTitle').textContent = found.r.title;
      film.classList.remove('opening'); film.classList.add('closing');
      audio.sfx('whoosh');
      await wait(560);
    }
    if (state.cleanup) { try { state.cleanup(); } catch (e) { console.error(e); } state.cleanup = null; }
    audio.stopAll();
    tip.hide();
    app.innerHTML = '';
    document.body.classList.toggle('on-desk', found.r === ROUTES[0]);
    document.body.dataset.route = path.split('/')[1] || 'desk';
    $$('.nav a').forEach((a) => {
      const href = a.getAttribute('href').slice(1);
      if (href !== '/' && path.startsWith(href)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const ctx = { data, go, toast, tip, audio, params: found.m.slice(1), path };
    // each chapter mounts into a fresh element so its listeners die with it
    const host = document.createElement('div');
    host.className = 'route-host';
    app.appendChild(host);
    state.cleanup = (await mod.default.mount(host, ctx)) || null;
    document.title = (mod.default.title ? mod.default.title + ' | ' : '') + 'Waris';
    if (!sameModule) window.scrollTo(0, 0);
    if (cut) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); film.classList.remove('closing'); film.classList.add('opening'); }
    state.route = found;
    state.first = false;
  } catch (e) {
    console.error(e);
    film.classList.remove('closing');
    app.innerHTML = '<section class="page-error"><h1>Something went wrong.</h1><p>Reload the page, or email warismittal40@gmail.com.</p></section>';
  } finally {
    state.busy = false;
    if (state.pending) { state.pending = null; route(); }
  }
}

window.addEventListener('hashchange', route);
document.addEventListener('keydown', (e) => { if (e.key === 'm' && !e.target.closest('input, textarea')) audio.setOn(!audio.isOn()); });
route();

// warm the cache for every chapter once the first one is on screen, so later cuts are instant
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
idle(() => ROUTES.forEach((r) => r.mod().catch(() => {})));

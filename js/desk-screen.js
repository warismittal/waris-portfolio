// The laptop's live screen: a 1280 x 800 page mapped onto the photographed display.
import { esc } from './util.js';

export const APPS = [
  { id: 'masterclass', label: 'Masterclass', go: '#/masterclass', glyph: '<path d="M9 6 L19 12 L9 18 Z"/>', bg: 'linear-gradient(140deg,#f6c77e,#c4562a)' },
  { id: 'expo', label: 'Tech Expo', go: '#/expo', glyph: '<path d="M4 18 V9 L12 4 L20 9 V18 M8 18 V12 H16 V18"/>', bg: 'linear-gradient(140deg,#4cc3ff,#3b2ccf)' },
  { id: 'gallery', label: 'Gallery', go: '#/gallery', glyph: '<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M5 16 L10 11 L14 15 L16 13 L19 16"/>', bg: 'linear-gradient(140deg,#e9d8b8,#8b6a3e)' },
  { id: 'tedx', label: 'TEDx Stage', go: '#/stage', glyph: '<path d="M7 7 L17 17 M17 7 L7 17"/>', bg: 'linear-gradient(140deg,#ff4a3a,#7a0d10)' },
  { id: 'shell', label: 'Shell', go: '#/os', glyph: '<path d="M6 8 L10 12 L6 16 M12 16 H18"/>', bg: 'linear-gradient(140deg,#2b2f3a,#0b0d12)' },
  { id: 'groundwork', label: 'Groundwork', go: '#/groundwork', glyph: '<path d="M4 9 L12 5 L20 9 L12 13 Z M7 11 V15 C9 17 15 17 17 15 V11"/>', bg: 'linear-gradient(140deg,#9be38f,#1f6b43)' },
  { id: 'mail', label: 'Contact', go: '#/contact', glyph: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 8 L12 13 L20 8"/>', bg: 'linear-gradient(140deg,#ffd38a,#f08a3c)' },
];

const SCRIPT = [
  ['cmd', 'cd ~/varwix && git pull'],
  ['out', 'Already up to date.'],
  ['cmd', 'python risk/monte_carlo.py --paths 10000 --horizon 10d'],
  ['out', 'simulating 10,000 GBM paths  ▕████████████▏ done'],
  ['out', 'VaR 95%  ·  CVaR 95%  ·  report saved to out/risk.html'],
  ['cmd', 'git commit -am "cache analytics in redis, index hot tables"'],
  ['out', '[main 4f2c1a9] cache analytics in redis, index hot tables'],
  ['cmd', 'git push origin main'],
  ['out', 'To origin   main -> main'],
  ['cmd', 'echo "one more commit, then sleep"'],
  ['out', 'one more commit, then sleep'],
];

export function screenMarkup() {
  const dock = APPS.map((a) => `<button class="dock-app" type="button" data-go="${a.go}" aria-label="${esc(a.label)}"><span class="ico ico-${a.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${a.glyph}</svg></span><span class="dock-label">${esc(a.label)}</span></button>`).join('');
  return `
  <div class="lap" id="lap" data-state="lock">
    <div class="lap-wall" aria-hidden="true">
      <svg viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120d24"/><stop offset=".45" stop-color="#3a1a3f"/><stop offset=".72" stop-color="#b4485a"/><stop offset=".9" stop-color="#f08a52"/></linearGradient>
          <linearGradient id="lm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2340"/><stop offset="1" stop-color="#140c1a"/></linearGradient>
          <linearGradient id="lm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#21142a"/><stop offset="1" stop-color="#07050b"/></linearGradient>
          <radialGradient id="lsun" cx=".62" cy=".86" r=".3"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".95"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1280" height="800" fill="url(#lsky)"/>
        <rect width="1280" height="800" fill="url(#lsun)"/>
        <g class="stars">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 197) % 1280}" cy="${(i * 89) % 330}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity="${0.25 + (i % 5) * 0.12}"/>`).join('')}</g>
        <path d="M0 640 L120 560 L210 600 L330 500 L420 570 L560 470 L650 540 L760 455 L880 545 L990 480 L1110 560 L1280 500 V800 H0Z" fill="url(#lm1)"/>
        <path d="M0 700 L150 640 L260 690 L400 610 L520 675 L700 600 L820 680 L960 625 L1100 690 L1280 640 V800 H0Z" fill="url(#lm2)"/>
      </svg>
    </div>
    <div class="lap-bar"><span class="lap-apple">W</span><b>Waris</b><span>File</span><span>View</span><span>Go</span><span class="lap-spacer"></span><span class="lap-wifi" aria-hidden="true">◠</span><span class="lap-batt" aria-hidden="true"><i></i></span><span class="lap-clock">12:00 AM</span></div>

    <div class="lap-lock">
      <div class="lap-fp" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M20 6 C12 6 7 12 7 19 M33 19 C33 12 28 6 20 6 M12 22 C12 15 15 11 20 11 C25 11 28 15 28 21 C28 26 27 30 25 33 M16 33 C17 29 17 26 17 22 C17 19 18 16 20 16 C22 16 23 18 23 21 C23 26 22 30 20 34 M11 28 C12 26 12 24 12 22"/></svg></div>
      <div class="lap-name">WARIS</div>
      <div class="lap-sub">Welcome to my Portfolio</div>
      <div class="lap-pw" aria-hidden="true"><span class="lap-dots"></span><span class="lap-caret"></span></div>
      <div class="lap-cta">Explore <span>→</span></div>
      <div class="lap-links"><span>Projects</span><span>About</span><span>Resume</span></div>
    </div>

    <div class="lap-desk">
      <div class="lap-win lap-term">
        <div class="lap-win-bar"><i></i><i></i><i></i><span>waris — zsh — 96×24</span></div>
        <pre class="lap-term-body" id="lapTerm"></pre>
      </div>
      <div class="lap-win lap-note">
        <div class="lap-win-bar"><i></i><i></i><i></i><span>tonight.md</span></div>
        <div class="lap-note-body">
          <b>Tonight</b>
          <span class="ok">✓ ship VARWIX risk report</span>
          <span class="ok">✓ TEDx vendor sheet</span>
          <span>□ one portrait sketch</span>
          <span>□ sleep (eventually)</span>
        </div>
      </div>
      <div class="lap-hello">Pick an app. <em>Everything opens full screen.</em></div>
      <nav class="lap-dock" aria-label="Laptop apps">${dock}</nav>
    </div>
  </div>`;
}

export class LaptopScreen {
  constructor(root, { onState } = {}) {
    this.root = root;
    this.term = root.querySelector('#lapTerm');
    this.dots = root.querySelector('.lap-dots');
    this.clock = root.querySelector('.lap-clock');
    this.onState = onState || (() => {});
    this.timers = [];
    this.line = 0; this.char = 0; this.buffer = '';
  }

  get state() { return this.root.dataset.state; }

  set(state) {
    this.root.dataset.state = state;
    this.onState(state);
    if (state === 'desktop') this.startTerminal();
  }

  /** Lock screen: type the password, scan the fingerprint, unlock. */
  login() {
    if (this.state !== 'lock') return Promise.resolve();
    this.root.dataset.state = 'login';
    return new Promise((resolve) => {
      let n = 0;
      const t = setInterval(() => {
        n++; this.dots.textContent = '•'.repeat(n);
        if (n >= 9) { clearInterval(t); this.later(() => { this.root.classList.add('unlocked'); this.later(() => { this.set('desktop'); resolve(); }, 650); }, 450); }
      }, 95);
      this.timers.push(t);
    });
  }

  startTerminal() {
    if (this.termStarted) return;
    this.termStarted = true;
    const tick = () => {
      if (this.line >= SCRIPT.length) { this.later(() => { this.line = 0; this.buffer = ''; tick(); }, 6000); return; }
      const [kind, text] = SCRIPT[this.line];
      if (kind === 'out') {
        this.buffer += `<span class="o">${esc(text)}</span>\n`;
        this.line++; this.render(); this.later(tick, 380);
        return;
      }
      if (this.char === 0) this.buffer += '<span class="p">waris@quiet-hours</span> <span class="d">~</span> % ';
      this.buffer += esc(text[this.char]);
      this.char++;
      this.render(true);
      if (this.char >= text.length) { this.buffer += '\n'; this.char = 0; this.line++; this.later(tick, 520); }
      else this.later(tick, 40 + Math.random() * 70);
    };
    tick();
  }

  render(caret) {
    const lines = this.buffer.split('\n');
    const view = lines.slice(-13).join('\n');
    this.term.innerHTML = view + (caret ? '<span class="c">▋</span>' : '');
  }

  setClock(label) { this.clock.textContent = label; }
  later(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); return t; }
  destroy() { this.timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); }
}

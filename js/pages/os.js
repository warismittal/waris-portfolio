import { esc, applyCss } from '../util.js';
import { APPS } from '../desk-screen.js';

export default {
  title: 'The shell',
  mount(el, { data, go, audio }) {
    const P = data.profile;
    const dock = APPS.map((a) => `<button class="dock-app" type="button" data-app="${a.id}" data-go="${a.go}" aria-label="${esc(a.label)}"><span class="ico ico-${a.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${a.glyph}</svg></span><span class="dock-label">${esc(a.label)}</span></button>`).join('');
    el.innerHTML = `
    <div class="os" id="os">
      <div class="os-wall" aria-hidden="true"></div>
      <div class="os-bar"><span class="lap-apple">W</span><b>Waris</b><span>Terminal</span><span>Shell</span><span>Window</span><span class="lap-spacer"></span><span id="osClock"></span></div>
      <h1 class="visually-hidden">The shell: Waris's laptop</h1>

      <section class="os-win os-term" data-win="term" data-css="left:4vw;top:84px;z-index:3" aria-label="Terminal">
        <div class="os-win-bar" data-drag><i data-close></i><i></i><i></i><span>waris@quiet-hours: ~ (zsh)</span></div>
        <div class="os-term-out" id="out" role="log" aria-live="polite"></div>
        <form class="os-term-in" id="termForm" autocomplete="off"><label for="cmd" class="p">waris@quiet-hours ~ %</label><input id="cmd" spellcheck="false" autocapitalize="off" aria-label="Type a command, for example help"></form>
      </section>

      <section class="os-win os-gh" data-win="gh" data-css="right:4vw;top:110px;z-index:2" aria-label="GitHub profile">
        <div class="os-win-bar" data-drag><i data-close></i><i></i><i></i><span>github.com/warismittal</span></div>
        <div class="os-gh-body">
          <div class="os-gh-head"><img src="assets/people/id-portrait.png" alt=""><div><b>Waris</b><span>warismittal</span></div></div>
          <p class="os-readme"><span class="kicker">README.md</span>Hi, I'm Waris. I build full-stack systems with Spring Boot, React and Python, lead logistics at TEDxTIET, and draw portraits when the code is compiling.</p>
          <ul class="os-repos">${data.projects.map((p) => `<li><a href="#/expo/${p.slug}"><b>${esc(p.slug)}</b><span>${esc(p.subtitle)}</span><em>${esc(p.stack.slice(0, 3).join(' · '))}</em></a></li>`).join('')}</ul>
          <a class="btn ghost" href="${esc(P.github)}" target="_blank" rel="noopener">Open the real profile</a>
        </div>
      </section>

      <section class="os-win os-note" data-win="note" data-css="left:46vw;bottom:150px;z-index:1" aria-label="Notes">
        <div class="os-win-bar" data-drag><i data-close></i><i></i><i></i><span>tonight.md</span></div>
        <div class="lap-note-body"><b>Tonight</b><span class="ok">✓ ship the risk report</span><span class="ok">✓ TEDx vendor sheet</span><span>□ one portrait sketch</span><span>□ sleep (eventually)</span></div>
      </section>

      <nav class="lap-dock os-dock" aria-label="Apps">${dock}</nav>
    </div>`;
    applyCss(el);

    // ---------- clock ----------
    const clock = el.querySelector('#osClock');
    const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
    tick(); const clockT = setInterval(tick, 15000);

    // ---------- windows: drag, focus, close ----------
    let z = 10;
    el.addEventListener('pointerdown', (e) => {
      const win = e.target.closest('.os-win'); if (!win) return;
      win.style.zIndex = ++z;
      const bar = e.target.closest('[data-drag]'); if (!bar || e.target.closest('[data-close]')) return;
      const r = win.getBoundingClientRect(); const ox = e.clientX - r.left; const oy = e.clientY - r.top;
      win.style.right = 'auto'; win.style.bottom = 'auto'; win.style.left = r.left + 'px'; win.style.top = r.top + 'px';
      const move = (ev) => { win.style.left = Math.max(-r.width + 80, Math.min(window.innerWidth - 80, ev.clientX - ox)) + 'px'; win.style.top = Math.max(30, Math.min(window.innerHeight - 60, ev.clientY - oy)) + 'px'; };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-close]'); if (c) { c.closest('.os-win').classList.add('closed'); audio.sfx('click'); return; }
      const a = e.target.closest('[data-app]');
      if (a) {
        if (a.dataset.app === 'shell') { el.querySelectorAll('.os-win').forEach((w) => w.classList.remove('closed')); input.focus(); return; }
        go(a.dataset.go);
      }
    });

    // ---------- terminal ----------
    const out = el.querySelector('#out'); const input = el.querySelector('#cmd');
    const hist = []; let hi = 0;
    const print = (html, cls = '') => { const d = document.createElement('div'); d.className = 'ln ' + cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; };
    const link = (label, href) => `<a href="${href}">${esc(label)}</a>`;
    const CMDS = {
      help: () => print(`commands: <b>whoami</b>, <b>about</b>, <b>ls</b>, <b>projects</b>, <b>open</b> &lt;project&gt;, <b>skills</b>, <b>education</b>, <b>tedx</b>, <b>art</b>, <b>achievements</b>, <b>resume</b>, <b>contact</b>, <b>neofetch</b>, <b>desk</b>, <b>clear</b>`),
      whoami: () => print(`${esc(P.name)}: ${esc(P.headline)}`),
      about: () => print(esc(P.vision)),
      ls: () => print('about.md  education/  projects/  tedx/  art/  resume.pdf  tonight.md'),
      projects: () => print(data.projects.map((p) => `<span class="c1">${esc(p.slug.padEnd(16, ' '))}</span>${esc(p.subtitle)}`).join('<br>') + '<br><span class="dim">type</span> open varwix'),
      open: (arg) => { const p = data.projects.find((x) => x.slug === arg || x.title.toLowerCase() === (arg || '').toLowerCase()); if (!p) { print(`usage: open &lt;${data.projects.map((x) => x.slug).join('|')}&gt;`); return; } print(`opening ${esc(p.title)}…`); setTimeout(() => go('#/expo/' + p.slug), 400); },
      skills: () => print(Object.entries(data.skills).map(([k, v]) => `<span class="c1">${esc(k)}</span>: ${esc(v.join(', '))}`).join('<br>')),
      education: () => print(data.education.map((e) => `<span class="c1">${esc(e.institution)}</span><br>  ${esc(e.degree)} · ${esc(e.period)} · ${esc(e.detail)}`).join('<br>')),
      tedx: () => { print(data.leadership.stages.map((s) => `<span class="c1">${esc(s.title)}</span> · ${esc(s.when)}`).join('<br>')); print(link('→ take the stage', '#/stage')); },
      art: () => { print(`${data.art.length} works on paper. ` + link('→ walk the VARWIX gallery', '#/gallery')); },
      achievements: () => print(data.achievements.map((a) => `· ${esc(a.title)}`).join('<br>')),
      resume: () => { print('opening resume.pdf'); window.open('assets/resume.pdf', '_blank', 'noopener'); },
      contact: () => print(`${link(P.email, 'mailto:' + P.email)} · ${link('GitHub', P.github)} · ${link('LinkedIn', P.linkedin)} · ${link('contact form', '#/contact')}`),
      neofetch: () => print(`<pre class="neo"><span class="c1"> __      __ </span>  <b>waris</b>@quiet-hours
<span class="c1"> \\ \\ /\\ / / </span>  ---------------
<span class="c1">  \\ V  V /  </span>  OS: Built in the Quiet Hours
<span class="c1">   \\_/\\_/   </span>  Uni: Thapar Institute (TIET), CSE '28
              Shell: zsh + coffee
              Roles: TEDxTIET EC Lead · Class Rep
              Art: graphite, ink, colour pencil</pre>`),
      desk: () => { print('back to midnight…'); setTimeout(() => go('#/'), 400); },
      clear: () => { out.innerHTML = ''; },
      sudo: (arg) => print(arg && arg.startsWith('hire') ? `<span class="c2">permission granted.</span> ${link('Send the offer letter →', '#/contact')}` : 'sudo: nice try.'),
      date: () => print(new Date().toString()),
      echo: (arg) => print(esc(arg || '')),
      exit: () => go('#/masterclass'),
    };
    el.querySelector('#termForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim(); input.value = '';
      print(`<span class="p">waris@quiet-hours ~ %</span> ${esc(raw)}`, 'cmd');
      if (!raw) return;
      hist.push(raw); hi = hist.length;
      const [c, ...rest] = raw.split(/\s+/);
      const fn = CMDS[c.toLowerCase()];
      audio.sfx('key');
      if (fn) fn(rest.join(' ')); else print(`zsh: command not found: ${esc(c)}. Try <b>help</b>.`, 'err');
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && hist.length) { hi = Math.max(0, hi - 1); input.value = hist[hi]; e.preventDefault(); }
      if (e.key === 'ArrowDown' && hist.length) { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; e.preventDefault(); }
      if (e.key === 'Tab') { e.preventDefault(); const m = Object.keys(CMDS).find((k) => k.startsWith(input.value)); if (m) input.value = m; }
      if (e.key.length === 1) audio.sfx('key');
    });
    // a greeting typed in for you
    const greet = ['Last login: tonight, on the desk', 'Type <b>help</b> to see what this laptop can do. Try <b>neofetch</b> or <b>open varwix</b>.'];
    greet.forEach((g, i) => setTimeout(() => print(g, 'dim'), 250 + i * 350));
    setTimeout(() => input.focus({ preventScroll: true }), 700);

    return () => { clearInterval(clockT); };
  },
};

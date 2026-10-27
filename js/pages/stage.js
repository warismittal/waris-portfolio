import { esc, observeReveals, applyCss, clamp, lerp } from '../util.js';

// A TEDx stage you scroll through. The camera pushes in, the LED wall changes slides,
// the speaker talks, captions appear word by word, and the house reacts.
export default {
  title: 'TEDx stage',
  mount(el, { data, audio }) {
    const [core, ec, eb] = data.leadership.stages;
    const ACTS = [
      { key: 'house', from: 0, to: 0.1, rail: -1, tint: '255,214,170',
        wall: { kicker: 'TEDxTIET · Thapar Institute', title: 'Ideas worth spreading', sub: 'Tonight: one journey, three roles.' },
        cc: 'Ladies and gentlemen, please welcome to the red circle…' },
      { key: 'core', from: 0.1, to: 0.34, rail: 0, tint: '210,226,255', photo: 'assets/photos/tedx-team-lanyards.jpg',
        wall: { kicker: 'Act I · ' + (/confirm/i.test(core.when) ? 'The beginning' : core.when), title: core.title, sub: 'Learning what a show needs before it needs it.', lines: core.lines },
        cc: 'I started on the core team. Before you can lead a show, you learn what it needs before it needs it.' },
      { key: 'ec', from: 0.34, to: 0.7, rail: 1, tint: '255,120,90', photo: 'assets/photos/tedx-team-props.jpg',
        wall: { kicker: 'Act II · ' + ec.when, title: 'Executive Committee Lead', sub: 'Creativity and Logistics', stats: [['500+', 'attendees'], ['25+', 'vendors'], ['40+', 'tasks tracked'], ['2', 'keynotes hosted']], lines: ec.lines },
        cc: 'Then they handed me the logistics. Five hundred people, twenty-five vendors, and every cable, chair and cue in between.' },
      { key: 'eb', from: 0.7, to: 0.9, rail: 2, tint: '255,206,120', photo: 'assets/photos/tedx-creativity.jpg',
        wall: { kicker: 'Act III · Next', title: 'Executive Board', sub: 'The next chapter is still being written.', lines: [eb.lines[0]] },
        cc: 'The next chapter is the board. I will tell you about it when it is written.' },
      { key: 'bow', from: 0.9, to: 1.01, rail: 3, tint: '255,236,210', photo: 'assets/people/team-photo.jpg',
        wall: { kicker: 'Curtain call', title: 'Thank you.', sub: 'Ideas worth spreading. Logistics worth sweating.' },
        cc: 'Thank you.' },
    ];
    const heads = Array.from({ length: 34 }, (_, i) => {
      const x = (i / 33) * 1700 - 50 + ((i * 37) % 23) - 11; const s = 0.82 + ((i * 53) % 17) / 40; const row = i % 2;
      const phone = i % 7 === 3;
      return `<g class="hd${phone ? ' ph' : ''}" transform="translate(${x.toFixed(0)} ${row ? 34 : 0}) scale(${s.toFixed(2)})">
        <ellipse cx="0" cy="-60" rx="21" ry="25"/><path d="M-50 44 C -48 -8, -30 -27, 0 -29 C 30 -27, 48 -8, 50 44 Z"/>
        ${phone ? '<rect class="phone" x="10" y="-112" width="16" height="27" rx="3"/>' : ''}</g>`;
    }).join('');
    const beams = Array.from({ length: 6 }, (_, i) => `<span class="mh" data-css="--x:${8 + i * 16.8}%;--d:${(i * 0.9).toFixed(1)}s;--a:${i % 2 ? 1 : -1}"></span>`).join('');

    el.innerHTML = `
    <div class="tx">
      <section class="tx-run" id="run" aria-label="The TEDxTIET journey, told on stage. Scroll to advance.">
        <div class="tx-sticky">
          <div class="tx-cam" id="cam">
            <div class="tx-house" id="house" data-act="house">
              <div class="tx-drape l" aria-hidden="true"></div><div class="tx-drape r" aria-hidden="true"></div>
              <div class="tx-back" aria-hidden="true"></div>
              <div class="tx-truss" aria-hidden="true"><span class="bar"></span>${beams}</div>

              <div class="tx-led" id="led">
                <div class="led-frame">
                  <div class="led-photo" aria-hidden="true">${ACTS.filter((a) => a.photo).map((a) => `<img data-k="${a.key}" src="${a.photo}" alt="">`).join('')}</div>
                  <div class="led-copy" id="ledCopy"></div>
                  <span class="led-px" aria-hidden="true"></span>
                </div>
              </div>

              <div class="tx-deck" aria-hidden="true">
                <div class="deck-top"><div class="deck-reflect"></div><div class="tx-circle"><span class="spot"></span></div></div>
                <div class="deck-face"><span class="strip"></span></div>
              </div>

              <div class="tx-letters" aria-hidden="true">
                <span class="ted">TED</span><span class="x">x</span><span class="tiet">TIET</span>
                <span class="letters-glow"></span>
              </div>

              <svg class="tx-speaker" id="speaker" viewBox="0 0 140 330" aria-hidden="true">
                <defs>
                  <linearGradient id="rimL" x1="0" x2="1"><stop offset="0" stop-color="#ffb08a" stop-opacity=".95"/><stop offset=".18" stop-color="#ffb08a" stop-opacity="0"/></linearGradient>
                  <linearGradient id="rimR" x1="1" x2="0"><stop offset="0" stop-color="#ffe2b8" stop-opacity=".95"/><stop offset=".2" stop-color="#ffe2b8" stop-opacity="0"/></linearGradient>
                </defs>
                <g class="sp">
                  <g class="sp-head"><path d="M70 12 C 84 12, 92 24, 91 38 C 90 52, 81 62, 70 62 C 59 62, 50 52, 49 38 C 48 24, 56 12, 70 12 Z"/><path d="M52 30 C 54 14, 70 6, 84 14 C 90 18, 92 26, 91 32 C 84 22, 66 20, 52 30 Z" class="hair"/></g>
                  <path class="torso" d="M40 74 C 46 66, 58 64, 70 64 C 82 64, 94 66, 100 74 L 108 176 L 32 176 Z"/>
                  <path class="lapel" d="M62 66 L 70 96 L 78 66" />
                  <g class="arm-l"><path d="M42 78 C 30 108, 26 140, 30 172 L 40 172 C 40 146, 44 116, 50 92 Z"/></g>
                  <g class="arm-r"><path d="M98 78 C 112 98, 120 116, 118 136 L 108 138 C 108 120, 100 104, 90 90 Z"/><rect x="108" y="128" width="8" height="24" rx="3" class="mic"/></g>
                  <path class="leg" d="M36 176 L 66 176 L 63 318 L 44 318 Z"/><path class="leg" d="M74 176 L 104 176 L 96 318 L 77 318 Z"/>
                  <path d="M40 74 C 46 66, 58 64, 70 64 C 82 64, 94 66, 100 74 L 108 176 L 32 176 Z" fill="url(#rimL)"/>
                  <path d="M40 74 C 46 66, 58 64, 70 64 C 82 64, 94 66, 100 74 L 108 176 L 32 176 Z" fill="url(#rimR)"/>
                </g>
              </svg>

              <div class="tx-haze" aria-hidden="true"><span></span><span></span></div>
              <svg class="tx-crowd" viewBox="0 0 1600 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g transform="translate(0 112)">${heads}</g></svg>
              <div class="tx-flash" id="flash" aria-hidden="true"></div>
            </div>
          </div>

          <ol class="tx-rail" aria-label="Journey">
            <li data-r="0"><i></i><span>Core Member</span></li>
            <li data-r="1"><i></i><span>Executive Committee Lead</span></li>
            <li data-r="2"><i></i><span>Executive Board</span></li>
            <span class="rail-dot" id="railDot" aria-hidden="true"></span>
          </ol>
          <div class="tx-cc" aria-live="polite"><span class="cc-tag">CC</span><p id="cc"></p></div>
          <p class="tx-hint" id="txHint">Scroll · the house lights go down</p>
        </div>
      </section>

      <section class="tx-after" aria-labelledby="afterT">
        <div class="gw-sec-head reveal"><p class="kicker">Backstage</p><h2 id="afterT">The work behind the red letters.</h2></div>
        <ol class="tx-timeline">
          ${data.leadership.stages.map((s, i) => `<li class="reveal tl-${s.state}"><span class="tl-n">0${i + 1}</span><div><p class="tl-when">${esc(s.when)}</p><h3>${esc(s.title)}</h3><ul>${s.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div></li>`).join('')}
        </ol>
        <div class="st-mosaic">
          ${data.photos.slice(1).map((ph, i) => `<figure class="reveal m${i}"><img src="${ph.img}" alt="${esc(ph.caption)}" loading="lazy"><figcaption>${esc(ph.caption)}</figcaption></figure>`).join('')}
          <figure class="reveal m3"><img src="assets/people/team-photo.jpg" alt="The TEDxTIET team" loading="lazy"><figcaption>The team that built it</figcaption></figure>
        </div>
      </section>
      <nav class="next-ch reveal" aria-label="Next chapter"><span class="kicker">Next</span><a href="#/expo">Chapter 04 · The tech expo <span aria-hidden="true">→</span></a></nav>
    </div>`;
    applyCss(el);

    const run = el.querySelector('#run'); const house = el.querySelector('#house'); const cam = el.querySelector('#cam');
    const copy = el.querySelector('#ledCopy'); const cc = el.querySelector('#cc'); const dot = el.querySelector('#railDot');
    const rails = [...el.querySelectorAll('.tx-rail li')]; const photos = [...el.querySelectorAll('.led-photo img')];
    const flash = el.querySelector('#flash');
    let current = null; let ccWords = []; let applause = {};

    function slide(a) {
      const w = a.wall;
      copy.innerHTML = `<p class="lc-k">${esc(w.kicker)}</p><h2 class="lc-t">${esc(w.title)}</h2>${w.sub ? `<p class="lc-s">${esc(w.sub)}</p>` : ''}
        ${w.stats ? `<div class="lc-stats">${w.stats.map(([n, l]) => `<div class="lc-st"><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
        ${w.lines ? `<ul class="lc-lines">${w.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}`;
      copy.classList.remove('in'); void copy.offsetWidth; copy.classList.add('in');
      ccWords = a.cc.split(' ');
      cc.innerHTML = ccWords.map((w2) => `<span>${esc(w2)}</span>`).join(' ');
    }
    function setAct(a) {
      if (current === a.key) return;
      current = a.key;
      house.dataset.act = a.key;
      house.style.setProperty('--tint', a.tint);
      photos.forEach((im) => im.classList.toggle('on', im.dataset.k === a.key));
      rails.forEach((li) => { const r = parseInt(li.dataset.r, 10); li.classList.toggle('done', r < a.rail); li.classList.toggle('on', r === a.rail); });
      slide(a);
      if (a.key === 'core') audio.sfx('mic');
      if ((a.key === 'eb' || a.key === 'bow') && !applause[a.key]) { applause[a.key] = true; audio.sfx('applause'); flash.classList.remove('pop'); void flash.offsetWidth; flash.classList.add('pop'); }
    }
    let target = 0; let shown = 0; let raf = 0; let last = performance.now();
    function onScroll() {
      const r = run.getBoundingClientRect();
      target = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.25, ((now || performance.now()) - last) / 1000); last = now || performance.now();
      shown += (target - shown) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - shown) < 0.0005) shown = target;
      const p = shown;
      house.style.setProperty('--p', p.toFixed(4));
      house.classList.toggle('lit', p > 0.02);
      house.classList.toggle('on-stage', p > 0.07);
      el.querySelector('#txHint').classList.toggle('gone', p > 0.03);
      // camera: slow push towards the circle, a slight drift
      const push = 1 + Math.min(p, 0.8) * (window.innerWidth < 900 ? 0.02 : 0.09);
      cam.style.transform = `scale(${push.toFixed(4)})`;
      const a = ACTS.find((x) => p >= x.from && p < x.to) || ACTS[ACTS.length - 1];
      setAct(a);
      const sub = clamp((p - a.from) / (a.to - a.from));
      // LED wall lines and captions follow the scroll
      const lines = copy.querySelectorAll('.lc-lines li, .lc-st');
      lines.forEach((li, i) => li.classList.toggle('on', sub > (i + 0.4) / (lines.length + 1.2)));
      const n = cc.children.length; const k = Math.ceil(clamp(sub * 1.35) * n);
      for (let i = 0; i < n; i++) cc.children[i].classList.toggle('on', i < k);
      cc.parentElement.classList.toggle('empty', k === 0);
      // progress dot along the rail
      const rp = clamp((p - 0.1) / 0.8);
      dot.style.setProperty('--r', rp.toFixed(4));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); raf = requestAnimationFrame(frame);
    if (audio.isOn()) audio.ambience('crowd', 1);
    const offSound = audio.onChange((on) => { if (on) audio.ambience('crowd', 1); });
    const stopReveal = observeReveals(el);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); offSound(); stopReveal(); };
  },
};

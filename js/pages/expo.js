import { esc, observeReveals, applyCss, clamp, $$ } from '../util.js';
import { startDemo } from './expo-demos.js';

export default {
  title: 'Tech expo',
  handlesParams: true,
  mount(el, { data, params, go, audio }) {
    const projects = data.projects.map((p) => ({ ...p, ...(data.expo[p.slug] || {}) }));
    const flagship = projects.find((p) => p.slug === 'varwix');
    const rest = projects.filter((p) => p.slug !== 'varwix');
    const booth = (p, i) => `
      <article class="booth b${i % 4}" data-slug="${p.slug}">
        <div class="booth-roof"><span>${esc(p.title)}</span><small>${esc(p.booth || 'Hall B')} · ${esc(p.tag || '')}</small></div>
        <div class="booth-back">
          <div class="booth-monitor"><canvas data-demo="${esc(p.demo)}" aria-label="Live illustration of ${esc(p.title)}"></canvas><span class="mon-stand" aria-hidden="true"></span></div>
          <p class="booth-sub">${esc(p.subtitle)}</p>
        </div>
        <div class="booth-counter">
          <div class="booth-stack">${p.stack.slice(0, 5).map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>
          <a class="btn" href="#/expo/${p.slug}">Step into the booth <span class="arr">→</span></a>
        </div>
        <span class="booth-light l1" aria-hidden="true"></span><span class="booth-light l2" aria-hidden="true"></span>
      </article>`;

    el.innerHTML = `
    <div class="ex">
      <header class="ex-hero">
        <div class="ex-floor" aria-hidden="true"></div>
        <div class="ex-banner reveal" aria-hidden="true"><span>WARIS TECH EXPO</span><span>BUILT AFTER MIDNIGHT</span><span>WARIS TECH EXPO</span><span>BUILT AFTER MIDNIGHT</span></div>
        <p class="kicker reveal">Chapter 04</p>
        <h1 class="reveal">The tech <em>expo.</em></h1>
        <p class="ex-lede reveal">Every project gets a booth, a live screen and someone happy to explain it. Start at the main hall.</p>
      </header>

      <section class="ex-lobby reveal" aria-labelledby="lobbyT">
        <div class="lobby-wall">
          <img class="lobby-logo" src="assets/brand/varwix-logo.png" alt="VARWIX logo">
          <span class="lobby-glow" aria-hidden="true"></span>
        </div>
        <div class="lobby-info">
          <p class="kicker">Main hall · Flagship</p>
          <h2 id="lobbyT">${esc(flagship.title)}</h2>
          <p class="lobby-sub">${esc(flagship.subtitle)}</p>
          <p>${esc(flagship.summary)}</p>
          <ul class="lobby-hl">${flagship.highlights.slice(0, 4).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
          <div class="lobby-screen"><canvas data-demo="varwix" aria-label="Live Monte Carlo illustration"></canvas></div>
          <div class="sheet-row"><a class="btn" href="#/expo/varwix">Step into the VARWIX booth <span class="arr">→</span></a></div>
        </div>
      </section>

      <section class="ex-hall" id="hall" aria-label="Booths">
        <div class="ex-hall-sticky">
          <div class="ex-hall-head"><p class="kicker">Hall B and the research row</p><h2>Walk the booths <span class="serif-i">→</span></h2></div>
          <div class="ex-track" id="track">${rest.map(booth).join('')}</div>
          <div class="ex-progress" aria-hidden="true"><i id="exProg"></i></div>
        </div>
      </section>

      <section class="ex-gh" aria-labelledby="ghT">
        <div class="gh-window reveal">
          <div class="gh-bar"><i></i><i></i><i></i><span>github.com/warismittal</span></div>
          <div class="gh-body">
            <aside class="gh-profile"><img src="assets/people/id-portrait.png" alt=""><h2 id="ghT">Waris</h2><p class="gh-handle">warismittal</p><p>${esc(data.profile.headline)}</p><a class="btn ghost" href="${esc(data.profile.github)}" target="_blank" rel="noopener">Open GitHub</a></aside>
            <div class="gh-main">
              <div class="gh-tabs"><span class="on">Overview</span><span>Repositories</span><span>Projects</span></div>
              <p class="gh-label">Pinned</p>
              <div class="gh-pins">${projects.map((p) => `<a class="gh-pin" href="#/expo/${p.slug}"><span class="gh-repo">▢ ${esc(p.slug)}</span><p>${esc(p.summary)}</p><span class="gh-lang"><i class="lang-${esc((p.stack[0] || '').toLowerCase().replace(/[^a-z]/g, ''))}"></i>${esc(p.stack[0] || '')}</span></a>`).join('')}</div>
            </div>
          </div>
        </div>
      </section>
      <nav class="next-ch reveal" aria-label="Next chapter"><span class="kicker">Next</span><a href="#/gallery">Chapter 05 · The VARWIX gallery <span aria-hidden="true">→</span></a></nav>

      <div class="booth-detail" id="detail" hidden></div>
    </div>`;
    applyCss(el);

    const stops = $$('canvas[data-demo]', el).map((cv) => startDemo(cv, cv.dataset.demo));
    const hall = el.querySelector('#hall'); const track = el.querySelector('#track'); const prog = el.querySelector('#exProg');
    function onScroll() {
      const r = hall.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
      const max = Math.max(0, track.scrollWidth - window.innerWidth + 80);
      track.style.transform = `translate3d(${-p * max}px,0,0)`;
      prog.style.transform = `scaleX(${p})`;
      $$('.booth', track).forEach((b) => { const br = b.getBoundingClientRect(); const c = (br.left + br.width / 2) / window.innerWidth - 0.5; b.style.setProperty('--tilt', (c * -14).toFixed(2) + 'deg'); b.classList.toggle('near', Math.abs(c) < 0.28); });
    }
    function sizeHall() { const max = Math.max(0, track.scrollWidth - window.innerWidth + 80); hall.style.height = `calc(100vh + ${max}px)`; onScroll(); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sizeHall);
    requestAnimationFrame(sizeHall);

    // booth detail as a route (#/expo/<slug>)
    const detail = el.querySelector('#detail'); let detailStop = null;
    function openDetail(slug) {
      const p = projects.find((x) => x.slug === slug); if (!p) return;
      detail.innerHTML = `
        <div class="bd-back" data-close></div>
        <article class="bd-panel" role="dialog" aria-modal="true" aria-labelledby="bdT">
          <a class="sheet-close" href="#/expo" aria-label="Back to the hall">✕</a>
          <div class="bd-top">
            <div><p class="kicker">${esc(p.booth || 'Booth')} · ${esc(p.tag || '')}</p><h2 id="bdT">${esc(p.title)}</h2><p class="bd-sub">${esc(p.subtitle)}</p></div>
            ${p.slug === 'varwix' ? '<img class="bd-logo" src="assets/brand/varwix-mark.png" alt="VARWIX mark">' : ''}
          </div>
          <div class="bd-grid">
            <div class="bd-screen"><canvas data-demo="${esc(p.demo)}" aria-label="Live illustration"></canvas></div>
            <div><h3>What it is</h3><p>${esc(p.summary)}</p><h3>Built with</h3><div class="booth-stack">${p.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>
          </div>
          <h3>What I did and what it measured</h3>
          <ol class="bd-hl">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ol>
          <div class="bd-arch" aria-label="Architecture sketch">${p.stack.slice(0, 4).map((s, i) => `<span class="arch-box">${esc(s)}</span>${i < Math.min(3, p.stack.length - 1) ? '<span class="arch-arrow" aria-hidden="true">→</span>' : ''}`).join('')}</div>
          <pre class="bd-term"><span class="p">waris@quiet-hours</span> ~ % git clone ${esc(p.repo || 'github.com/warismittal')} ${esc(p.slug)}\n<span class="o">${p.repo ? 'Cloning…' : 'Repository link coming soon. Ask me for a walkthrough.'}</span></pre>
          <div class="sheet-row"><a class="btn" href="#/contact">Ask me about ${esc(p.title)} <span class="arr">→</span></a><a class="btn ghost" href="#/expo">Back to the hall</a></div>
        </article>`;
      detail.hidden = false; requestAnimationFrame(() => detail.classList.add('show'));
      const cv = detail.querySelector('canvas'); detailStop = startDemo(cv, cv.dataset.demo);
      document.body.classList.add('no-scroll');
      audio.sfx('whoosh');
    }
    function closeDetail() {
      if (detail.hidden) return;
      detail.classList.remove('show'); document.body.classList.remove('no-scroll');
      if (detailStop) { detailStop(); detailStop = null; }
      setTimeout(() => { detail.hidden = true; detail.innerHTML = ''; }, 350);
    }
    detail.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) go('#/expo'); });
    const onKey = (e) => { if (e.key === 'Escape' && !detail.hidden) go('#/expo'); };
    document.addEventListener('keydown', onKey);
    const onHash = () => { const m = location.hash.match(/^#\/?expo\/([a-z0-9-]+)$/); if (m) openDetail(m[1]); else closeDetail(); };
    window.addEventListener('hashchange', onHash);
    if (params[0]) openDetail(params[0]);

    const stopReveal = observeReveals(el);
    return () => {
      stops.forEach((s) => s()); closeDetail(); stopReveal();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', sizeHall);
      window.removeEventListener('hashchange', onHash); document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  },
};

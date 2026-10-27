import { esc, observeReveals, applyCss, clamp, REDUCED } from '../util.js';

const CW = 1300;   // corridor width
const CH = 780;    // corridor height
const Z0 = 900;    // first artwork depth
const GAP = 560;   // depth between artworks (alternating walls)

export default {
  title: 'VARWIX gallery',
  handlesParams: true,
  mount(el, { data, params, go, audio }) {
    const art = data.art;
    const LZ = Z0 + art.length * GAP + 900;
    const items = art.map((a, i) => {
      const side = i % 2 ? 'right' : 'left';
      const z = Z0 + i * GAP;
      return { ...a, i, side, z };
    });
    const piece = (a) => {
      const w = 340; const pos = a.side === 'left' ? a.z - w / 2 : LZ - a.z - w / 2;
      return `<div class="g-piece" data-css="left:${pos}px;width:${w}px">
          <span class="g-wash" aria-hidden="true"></span>
          <button class="g-frame" type="button" data-slug="${a.slug}" aria-label="Look closer: ${esc(a.title)}"><span class="g-mat"><img src="${a.img}" alt="${esc(a.title)}, ${esc(a.medium)}" loading="lazy"></span></button>
          <span class="g-placard"><b>${esc(a.title)}</b><span>${esc(a.medium)}${a.year ? ' · ' + esc(a.year) : ''}</span><span>Waris</span></span>
        </div>`;
    };
    el.innerHTML = `
    <div class="gl">
      <section class="gl-lobby" aria-labelledby="lobbyTitle">
        <div class="gl-lobby-wall" aria-hidden="true"></div>
        <div class="gl-lobby-spot" aria-hidden="true"></div>
        <img class="gl-logo reveal" src="assets/brand/varwix-logo.png" alt="VARWIX">
        <h1 id="lobbyTitle" class="gl-title reveal"><span class="kicker">Chapter 05 · The VARWIX gallery</span>The Quiet Hours <em>Collection</em></h1>
        <p class="gl-sub reveal">Ten works on paper by Waris. Graphite, ink and colour pencil, made between commissions, classes and code.</p>
        <div class="gl-desk reveal" aria-hidden="true"><span>Reception</span></div>
        <p class="gl-begin reveal">Scroll to walk in <span aria-hidden="true">↓</span></p>
      </section>

      <section class="gl-walk" id="walk" aria-label="Walk the corridor. Scroll to move forward." data-css="height:calc(100vh + ${LZ - 600}px)">
        <div class="gl-sticky">
          <div class="gl-view" id="view">
            <div class="gl-world" id="world">
              <div class="gl-wall left" data-css="width:${LZ}px;height:${CH}px;transform:translate3d(${-CW / 2}px, ${-CH / 2}px, 0) rotateY(90deg)">${items.filter((a) => a.side === 'left').map(piece).join('')}</div>
              <div class="gl-wall right" data-css="width:${LZ}px;height:${CH}px;transform:translate3d(${CW / 2 - LZ}px, ${-CH / 2}px, 0) rotateY(-90deg)">${items.filter((a) => a.side === 'right').map(piece).join('')}</div>
              <div class="gl-floor" data-css="width:${CW}px;height:${LZ}px;transform:translate3d(${-CW / 2}px, ${CH / 2}px, 0) rotateX(-90deg)"></div>
              <div class="gl-ceiling" data-css="width:${CW}px;height:${LZ}px;transform:translate3d(${-CW / 2}px, ${-CH / 2}px, 0) rotateX(-90deg)">${items.map((a) => `<span class="track-light ${a.side}" data-css="top:${a.z}px"></span>`).join('')}</div>
              <div class="gl-end" data-css="width:${CW}px;height:${CH}px;transform:translate3d(${-CW / 2}px, ${-CH / 2}px, ${-LZ}px)">
                <img src="assets/brand/varwix-mark.png" alt="">
                <p class="serif-i">Thank you for walking through.</p>
                <a class="btn" href="#/os">Next: the shell <span class="arr">→</span></a>
              </div>
            </div>
          </div>
          <div class="gl-hud"><span id="glCount">Entering</span><span class="gl-bar"><i id="glBar"></i></span><span class="gl-keys">Scroll or use ↑ ↓ to walk · click a work to look closer</span></div>
        </div>
      </section>

      <section class="gl-index" aria-labelledby="idxT">
        <div class="gw-sec-head reveal"><p class="kicker">Catalogue</p><h2 id="idxT">Every work on the walls.</h2><p class="muted">Titles and years are working titles; final ones to be confirmed.</p></div>
        <div class="gl-grid">${art.map((a) => `<button class="gl-card reveal" type="button" data-slug="${a.slug}"><img src="${a.img}" alt="" loading="lazy"><span><b>${esc(a.title)}</b>${esc(a.medium)}</span></button>`).join('')}</div>
      </section>
      <nav class="next-ch reveal" aria-label="Next chapter"><span class="kicker">Next</span><a href="#/os">Chapter 06 · The shell <span aria-hidden="true">→</span></a></nav>

      <div class="g-focus" id="focus" hidden></div>
    </div>`;
    applyCss(el);

    const walk = el.querySelector('#walk'); const world = el.querySelector('#world');
    const bar = el.querySelector('#glBar'); const count = el.querySelector('#glCount');
    let cam = 0; let target = 0; let lastStep = 0; let raf = 0; let sway = 0;
    function onScroll() {
      const r = walk.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
      target = p * (LZ - 700);
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      const prev = cam;
      cam += (target - cam) * (REDUCED ? 1 : 0.09);
      const moving = Math.abs(cam - prev);
      sway += moving * 0.012;
      const bob = REDUCED ? 0 : Math.sin(sway * 2) * Math.min(4, moving * 0.4);
      const look = REDUCED ? 0 : Math.sin(sway) * Math.min(0.6, moving * 0.05);
      world.style.transform = `translate3d(0, ${bob.toFixed(2)}px, ${cam.toFixed(1)}px) rotateY(${look.toFixed(3)}deg)`;
      if (Math.abs(cam - lastStep) > 170) { lastStep = cam; audio.sfx('step'); }
      bar.style.transform = `scaleX(${clamp(cam / (LZ - 700)).toFixed(4)})`;
      const near = items.reduce((b, a) => (Math.abs(a.z - cam - 420) < Math.abs(b.z - cam - 420) ? a : b), items[0]);
      count.textContent = cam < Z0 - 500 ? 'Entering the corridor' : `${near.i + 1} / ${items.length} · ${near.title}`;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); raf = requestAnimationFrame(frame);
    const onKey = (e) => {
      if (!focus.hidden) { if (e.key === 'Escape') go('#/gallery'); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); return; }
      if (e.target.closest('input, textarea')) return;
      const r = walk.getBoundingClientRect(); if (r.top > 0 || r.bottom < window.innerHeight) return;
      if (e.key === 'ArrowDown') { window.scrollBy({ top: GAP, behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowUp') { window.scrollBy({ top: -GAP, behavior: 'smooth' }); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey);

    // look closer (#/gallery/<slug>)
    const focus = el.querySelector('#focus');
    function openFocus(slug) {
      const a = art.find((x) => x.slug === slug); if (!a) return;
      const i = art.indexOf(a);
      focus.innerHTML = `<div class="gf-back" data-close></div>
        <figure class="gf-panel" role="dialog" aria-modal="true" aria-labelledby="gfT">
          <a class="sheet-close" href="#/gallery" aria-label="Back to the corridor">✕</a>
          <div class="gf-wall"><span class="gf-light" aria-hidden="true"></span><div class="gf-frame"><img src="${a.img}" alt="${esc(a.title)}"></div></div>
          <figcaption class="gf-card"><p class="kicker">${i + 1} of ${art.length}</p><h2 id="gfT">${esc(a.title)}</h2><p class="gf-med">${esc(a.medium)}${a.year ? ' · ' + esc(a.year) : ''}</p><p>${esc(a.note)}</p>
            <div class="gf-nav"><button class="btn ghost" type="button" data-step="-1">← Previous</button><button class="btn ghost" type="button" data-step="1">Next →</button></div>
            <a class="btn" href="#/contact">Commission a portrait <span class="arr">→</span></a></figcaption>
        </figure>`;
      focus.hidden = false; requestAnimationFrame(() => focus.classList.add('show'));
      document.body.classList.add('no-scroll');
      audio.sfx('whoosh');
    }
    function closeFocus() {
      if (focus.hidden) return;
      focus.classList.remove('show'); document.body.classList.remove('no-scroll');
      setTimeout(() => { focus.hidden = true; focus.innerHTML = ''; }, 350);
    }
    function step(d) {
      const m = location.hash.match(/^#\/?gallery\/([a-z0-9-]+)$/); if (!m) return;
      const i = art.findIndex((a) => a.slug === m[1]); const n = art[(i + d + art.length) % art.length];
      go('#/gallery/' + n.slug);
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slug]'); if (b) { go('#/gallery/' + b.dataset.slug); return; }
      const s = e.target.closest('[data-step]'); if (s) { step(parseInt(s.dataset.step, 10)); return; }
      if (e.target.closest('[data-close]')) go('#/gallery');
    });
    const onHash = () => { const m = location.hash.match(/^#\/?gallery\/([a-z0-9-]+)$/); if (m) { closeFocusNow(); openFocus(m[1]); } else closeFocus(); };
    function closeFocusNow() { focus.hidden = true; focus.classList.remove('show'); focus.innerHTML = ''; }
    window.addEventListener('hashchange', onHash);
    if (params[0]) openFocus(params[0]);

    const stopReveal = observeReveals(el);
    return () => {
      cancelAnimationFrame(raf); stopReveal();
      window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash);
      document.body.classList.remove('no-scroll');
    };
  },
};

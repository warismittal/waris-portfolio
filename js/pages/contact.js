import { esc, observeReveals, clamp } from '../util.js';

export default {
  title: 'Sunrise',
  mount(el, { data, audio, toast }) {
    const P = data.profile;
    el.innerHTML = `
    <div class="ct" id="ct">
      <div class="ct-sky" aria-hidden="true"><span class="ct-sun" id="sun"></span><span class="ct-hills h1"></span><span class="ct-hills h2"></span><span class="ct-hills h3"></span></div>
      <section class="ct-hero">
        <p class="kicker reveal">Chapter 07 · 5:00 AM</p>
        <h1 class="reveal">Let's build something <em>at sunrise.</em></h1>
        <p class="ct-lede reveal">${esc(data.contact.availability)}</p>
        <div class="ct-links reveal">
          <a class="ct-link" href="mailto:${esc(P.email)}"><span>Email</span><b>${esc(P.email)}</b></a>
          <a class="ct-link" href="${esc(P.github)}" target="_blank" rel="noopener"><span>GitHub</span><b>warismittal</b></a>
          <a class="ct-link" href="${esc(P.linkedin)}" target="_blank" rel="noopener"><span>LinkedIn</span><b>waris-mittal</b></a>
          <a class="ct-link" href="assets/resume.pdf" target="_blank" rel="noopener"><span>Resume</span><b>PDF, one page</b></a>
        </div>
      </section>

      <section class="ct-form-wrap reveal" aria-labelledby="formT">
        <form class="ct-form" id="form" novalidate>
          <h2 id="formT">Leave a note on the desk</h2>
          <div class="field"><label for="fName">Your name</label><input id="fName" name="name" autocomplete="name" required maxlength="100"><span class="err" id="fNameE"></span></div>
          <div class="field"><label for="fEmail">Email</label><input id="fEmail" name="email" type="email" autocomplete="email" required maxlength="160"><span class="err" id="fEmailE"></span></div>
          <div class="field"><label for="fMsg">Message</label><textarea id="fMsg" name="message" rows="5" required maxlength="2000" placeholder="An internship, a portrait commission, a project…"></textarea><span class="err" id="fMsgE"></span></div>
          <div class="hp" aria-hidden="true"><label for="fSite">Website</label><input id="fSite" name="website" tabindex="-1" autocomplete="off"></div>
          <button class="btn" type="submit" id="send">Send <span class="arr">→</span></button>
          <p class="ct-status" id="status" role="status"></p>
        </form>
      </section>

      <footer class="ct-foot reveal"><a class="btn ghost" href="#/">Back to the desk at midnight</a><p>Designed, coded and drawn by Waris, in the quiet hours.</p></footer>
    </div>`;

    const sun = el.querySelector('#sun');
    const onScroll = () => { const p = clamp(window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)); sun.style.transform = `translate(-50%, ${(1 - p) * 40}vh)`; el.querySelector('#ct').style.setProperty('--p', p.toFixed(3)); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (audio.isOn()) audio.ambience('birds', 0.6);

    const form = el.querySelector('#form'); const status = el.querySelector('#status'); const send = el.querySelector('#send');
    const setErr = (id, msg) => { el.querySelector('#' + id + 'E').textContent = msg; el.querySelector('#' + id).setAttribute('aria-invalid', msg ? 'true' : 'false'); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = { name: form.name.value.trim(), email: form.email.value.trim(), message: form.message.value.trim(), website: form.website.value };
      let ok = true;
      if (!v.name) { setErr('fName', 'Please add your name.'); ok = false; } else setErr('fName', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { setErr('fEmail', 'That email does not look right.'); ok = false; } else setErr('fEmail', '');
      if (v.message.length < 10) { setErr('fMsg', 'A few more words, please (10 characters or more).'); ok = false; } else setErr('fMsg', '');
      if (!ok) { status.textContent = 'Please fix the highlighted fields.'; status.className = 'ct-status err'; return; }
      send.disabled = true; status.textContent = 'Sending…'; status.className = 'ct-status';
      try {
        const r = await fetch('/api/v1/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(v), credentials: 'omit' });
        if (r.status === 201 || r.status === 202) { form.reset(); status.textContent = 'Received. I will reply by email.'; status.className = 'ct-status ok'; audio.sfx('chime'); toast('Note left on the desk.'); }
        else if (r.status === 429) { status.textContent = 'Too many messages from this network. Please try again later.'; status.className = 'ct-status err'; }
        else if (r.status === 400) { const b = await r.json().catch(() => ({})); const er = b.errors || {}; if (er.name) setErr('fName', er.name); if (er.email) setErr('fEmail', er.email); if (er.message) setErr('fMsg', er.message); status.textContent = 'Some fields need attention.'; status.className = 'ct-status err'; }
        else throw new Error('status ' + r.status);
      } catch (err) {
        const body = encodeURIComponent(v.message + '\n\n' + v.name);
        status.innerHTML = `The form backend is not connected on this host yet. <a href="mailto:${esc(P.email)}?subject=${encodeURIComponent('Hello from your portfolio')}&body=${body}">Send it by email instead</a>.`;
        status.className = 'ct-status err';
      } finally { send.disabled = false; }
    });
    const stopReveal = observeReveals(el);
    return () => { window.removeEventListener('scroll', onScroll); stopReveal(); };
  },
};

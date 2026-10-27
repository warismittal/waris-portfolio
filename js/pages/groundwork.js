import { esc, observeReveals, applyCss } from '../util.js';

export default {
  title: 'The groundwork',
  mount(el, { data }) {
    const [tiet, school] = data.education;
    const lead = data.leadership.other;
    const olympiad = data.achievements.find((a) => a.group === 'Olympiads');
    const certs = data.achievements.filter((a) => a.group === 'Certifications');
    const svc = data.groundwork.service;
    el.innerHTML = `
    <div class="gw">
      <header class="gw-hero">
        <p class="kicker reveal">Chapter 02</p>
        <h1 class="reveal">The <em>groundwork.</em></h1>
        <p class="gw-lede reveal">Before the projects and the stage, there was a timetable. This is the part of the story that happened in classrooms, on parade grounds and in committee rooms.</p>
        <span class="gw-scroll reveal" aria-hidden="true">scroll</span>
      </header>

      <section class="gw-card tiet reveal" aria-labelledby="tietT">
        <span class="tape t1" aria-hidden="true"></span><span class="tape t2" aria-hidden="true"></span>
        <div class="gw-card-head"><p class="kicker">Now · ${esc(tiet.period)}</p><h2 id="tietT">${esc(tiet.institution)}</h2><p class="gw-degree">${esc(tiet.degree)}</p></div>
        <div class="gw-cgpa">
          <svg viewBox="0 0 200 200" class="ring" aria-hidden="true"><circle cx="100" cy="100" r="84" class="ring-bg"/><circle cx="100" cy="100" r="84" class="ring-fg" data-css="--p:${(9.11 / 10).toFixed(3)}"/></svg>
          <div class="ring-num"><b>9.11</b><span>CGPA / 10</span></div>
        </div>
        <ul class="gw-facts">
          <li><b>Up to semester 4</b> and counting.</li>
          <li><b>Merit-3 Scholarship</b> holder.</li>
          <li><b>Class Representative</b>, CSE batch 2024 to 2028.</li>
        </ul>
        <p class="margin-note">margin note: the 9.11 is a running total, not a finish line.</p>
      </section>

      <section class="gw-school reveal" aria-labelledby="schoolT">
        <div class="gw-school-head"><p class="kicker">Before Thapar</p><h2 id="schoolT">${esc(school.institution)}</h2></div>
        <div class="bars">
          <div class="bar-row"><span class="bar-label">CBSE Class XII (PCM) · 2023</span><span class="bar"><i data-css="--w:91.4%"></i></span><b>91.4%</b></div>
          <div class="bar-row"><span class="bar-label">CBSE Class X · 2021</span><span class="bar"><i data-css="--w:94.8%"></i></span><b>94.8%</b></div>
        </div>
        ${olympiad ? `<div class="medal-row"><span class="medal" aria-hidden="true"><svg viewBox="0 0 60 80"><path d="M18 0 L30 26 L42 0" fill="none" stroke="#c4562a" stroke-width="6"/><circle cx="30" cy="50" r="22" fill="url(#gold)"/><defs><radialGradient id="gold" cx=".35" cy=".3"><stop offset="0" stop-color="#fff2c2"/><stop offset=".6" stop-color="#e2b25a"/><stop offset="1" stop-color="#7a5320"/></radialGradient></defs><text x="30" y="56" text-anchor="middle" font-size="16" font-weight="700" fill="#5a3a10">1</text></svg></span><p><b>${esc(olympiad.title)}</b><br><span class="muted">Mathematics, Physics and Chemistry. Year to confirm.</span></p></div>` : ''}
      </section>

      <section class="gw-beyond" aria-labelledby="beyondT">
        <div class="gw-sec-head reveal"><p class="kicker">Outside the timetable</p><h2 id="beyondT">Discipline, debate, delegation.</h2></div>
        <div class="beyond-grid">
          <article class="bcard ncc reveal">
            <svg class="bc-ico" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4 L54 14 V30 C54 44 44 54 32 60 C20 54 10 44 10 30 V14 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 32 L29 39 L43 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>
            <h3>${esc(svc[0].title)}</h3><p>${esc(svc[0].line)}</p><span class="stamp">'A' CERT</span>
          </article>
          <article class="bcard mun reveal">
            <svg class="bc-ico" viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="20" width="44" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 46 V58 M22 58 H42" stroke="currentColor" stroke-width="3"/><text x="32" y="38" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">USA</text></svg>
            <h3>${esc(svc[1].title)}</h3><p>${esc(svc[1].line)}</p><span class="stamp gold">BEST DELEGATE</span>
          </article>
          <article class="bcard debate reveal">
            <svg class="bc-ico" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 14 H38 V34 H20 L12 42 V34 H8 Z M26 38 H50 V50 H56 L48 58 V50 H26 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>
            <h3>${esc(svc[2].title)}</h3><p>${esc(svc[2].line)}</p>
          </article>
        </div>
      </section>

      <section class="gw-roles" aria-labelledby="rolesT">
        <div class="gw-sec-head reveal"><p class="kicker">Roles I hold</p><h2 id="rolesT">People trust you with small things first.</h2></div>
        <ol class="roles">${lead.map((r) => `<li class="reveal"><span class="r-when">${esc(r.when)}</span><b>${esc(r.title)}</b><p>${esc(r.lines[0])}</p></li>`).join('')}</ol>
      </section>

      <section class="gw-certs reveal" aria-labelledby="certT">
        <p class="kicker">Self-taught, then certified</p><h2 id="certT">The certificate drawer.</h2>
        <div class="cert-drawer">${certs.map((c, i) => `<span class="cert" data-css="--r:${(i % 2 ? 1 : -1) * (1 + i % 3)}deg">${esc(c.title)}</span>`).join('')}</div>
      </section>

      <nav class="next-ch reveal" aria-label="Next chapter"><span class="kicker">Next</span><a href="#/stage">Chapter 03 · On the red circle <span aria-hidden="true">→</span></a></nav>
    </div>`;
    applyCss(el);
    return observeReveals(el);
  },
};

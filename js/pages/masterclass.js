import { esc, observeReveals, applyCss } from '../util.js';

const CHAPTERS = [
  { n: '01', go: '#/', title: 'The Desk', line: 'Midnight to 5 AM, from my chair. Pull the lamp chain and use everything on the table.', min: '6 min', thumb: 'th-desk' },
  { n: '02', go: '#/groundwork', title: 'The Groundwork', line: 'Thapar, a 9.11 CGPA, school results, NCC, MUN and the roles I hold on campus.', min: '4 min', thumb: 'th-ground' },
  { n: '03', go: '#/stage', title: 'On the Red Circle', line: 'TEDxTIET, from the core team to Executive Committee Lead, told from the stage.', min: '5 min', thumb: 'th-stage' },
  { n: '04', go: '#/expo', title: 'The Tech Expo', line: 'Walk the booths: VARWIX, Ideociety, Grabito, NeRF Vision and more, each with a live demo.', min: '8 min', thumb: 'th-expo' },
  { n: '05', go: '#/gallery', title: 'The VARWIX Gallery', line: 'A walk through ten of my drawings, hung under their own lights.', min: '6 min', thumb: 'th-gallery' },
  { n: '06', go: '#/os', title: 'The Shell', line: 'My laptop, full screen. Type help into the terminal.', min: '3 min', thumb: 'th-shell' },
  { n: '07', go: '#/contact', title: 'Sunrise', line: 'Where to find me, and how to start a conversation.', min: '2 min', thumb: 'th-dawn' },
];

export default {
  title: 'Masterclass',
  mount(el, { data }) {
    const p = data.profile; const edu = data.education[0];
    const ach = data.achievements;
    const wins = ach.filter((a) => a.group === 'Hackathons' || a.group === 'Problem solving' || a.group === 'Model United Nations');
    el.innerHTML = `
    <div class="mc">
      <section class="mc-hero">
        <div class="mc-hero-bg" aria-hidden="true"></div>
        <div class="mc-hero-inner">
          <div class="mc-instructor reveal"><img src="assets/people/id-portrait.png" alt="Portrait of Waris"><div><b>Waris teaches</b><span>Computer Science, Thapar Institute · Class of 2028</span></div></div>
          <h1 class="mc-title reveal">Building in the<br><em>Quiet Hours</em><svg class="doodle mc-ul" viewBox="0 0 520 40" aria-hidden="true"><path d="M6 26 C 120 8, 260 34, 360 18 S 480 10, 512 22"/></svg></h1>
          <p class="mc-lede reveal">${esc(p.vision)}</p>
          <div class="mc-meta reveal"><span>7 chapters</span><span>Engineer</span><span>TEDxTIET EC Lead</span><span>Artist since 2018</span></div>
          <div class="mc-cta reveal"><a class="btn" href="#/groundwork">Start chapter 02 <span class="arr">→</span></a><a class="btn ghost" href="#/">Back to the desk</a><a class="btn ghost" href="assets/resume.pdf" target="_blank" rel="noopener">Resume (PDF)</a></div>
        </div>
        <a class="mc-trailer reveal" href="#/" aria-label="Replay the desk scene">
          <span class="tr-img" aria-hidden="true"></span>
          <span class="tr-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5 L19 12 L8 19 Z"/></svg></span>
          <span class="tr-cap">Trailer · <em>12:00 AM to 5:00 AM</em></span>
        </a>
      </section>

      <section class="mc-lessons" aria-labelledby="lessonsT">
        <div class="mc-head reveal"><p class="kicker">The course</p><h2 id="lessonsT">Seven chapters, one night.</h2></div>
        <ol class="lesson-grid">
          ${CHAPTERS.map((c, i) => `<li class="reveal" data-css="transition-delay:${i * 60}ms"><a class="lesson" href="${c.go}">
            <span class="ls-thumb ${c.thumb}" aria-hidden="true"><span class="ls-n">${c.n}</span></span>
            <span class="ls-body"><span class="ls-min">Chapter ${c.n} · ${c.min}</span><b>${esc(c.title)}</b><span class="ls-line">${esc(c.line)}</span></span>
          </a></li>`).join('')}
        </ol>
      </section>

      <section class="mc-three" aria-labelledby="threeT">
        <div class="mc-head reveal"><p class="kicker">What this course is about</p><h2 id="threeT">Three people at one desk.</h2></div>
        <div class="three-grid">
          <article class="three reveal"><span class="three-num">9.11</span><span class="three-unit">CGPA at Thapar, up to semester 4</span><h3>The engineer</h3><p>Spring Boot, React and Python services; a risk engine running 10,000-path Monte Carlo simulations; 700+ DSA problems and a 365-day LeetCode streak.</p></article>
          <article class="three reveal"><span class="three-num">500+</span><span class="three-unit">attendees at the TEDx event I ran logistics for</span><h3>The organiser</h3><p>Executive Committee Lead for Creativity and Logistics at TEDxTIET, Class Representative for 150+ students, Vice Proctor for 900+ hostel residents.</p></article>
          <article class="three reveal"><span class="three-num">2018</span><span class="three-unit">the year I started taking portrait commissions</span><h3>The artist</h3><p>Graphite, ink and colour pencil. The same patience that finishes a portrait finishes a pull request.</p></article>
        </div>
      </section>

      <section class="mc-wins" aria-labelledby="winsT">
        <div class="mc-head reveal"><p class="kicker">On the record</p><h2 id="winsT">Things I can point to.</h2></div>
        <ul class="wins">${wins.map((a) => `<li class="reveal"><span class="w-group">${esc(a.group)}</span><span class="w-title">${esc(a.title)}</span></li>`).join('')}</ul>
        <div class="certs reveal">${ach.filter((a) => a.group === 'Certifications').map((a) => `<span class="chip">${esc(a.title)}</span>`).join('')}</div>
      </section>

      <section class="mc-skills" aria-labelledby="skillsT">
        <div class="mc-head reveal"><p class="kicker">Toolbox</p><h2 id="skillsT">What I build with.</h2></div>
        <div class="skill-rows">${Object.entries(data.skills).map(([k, v]) => `<div class="skill-row reveal"><b>${esc(k)}</b><div>${v.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>`).join('')}</div>
      </section>

      <section class="mc-end reveal">
        <p class="serif-i">“${esc(data.quotes[0].text)}”</p>
        <p class="mc-end-who">${esc(data.quotes[0].who)} · ${esc(data.quotes[0].source)} · on the wall above my desk</p>
        <a class="btn" href="#/groundwork">Begin with the groundwork <span class="arr">→</span></a>
      </section>
    </div>`;
    applyCss(el);
    return observeReveals(el);
  },
};

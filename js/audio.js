// All sound is synthesised with the Web Audio API: no audio files, nothing to license.
// Sound stays off until the visitor turns it on (browser autoplay rules).

let ctx = null;
let master = null;
let on = false;
let noiseBuf = null;
const loops = new Map();
const listeners = new Set();

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export function isOn() { return on; }
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setOn(v) {
  if (!ensure()) return;
  on = !!v;
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.25);
  try { localStorage.setItem('waris-sound', on ? '1' : '0'); } catch (e) { /* storage blocked */ }
  listeners.forEach((fn) => fn(on));
}

function noise(dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.005, decay, when = 0, sweepTo } = {}) {
  if (!on || !ensure()) return;
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (decay || dur));
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

function tone(freq, dur, { type = 'sine', gain = 0.2, when = 0, attack = 0.004, to } = {}) {
  if (!on || !ensure()) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

const SFX = {
  lampClick() {           // pull-chain switch: two-part click
    noise(0.05, { freq: 3200, q: 4, gain: 0.5, decay: 0.04 });
    tone(1800, 0.05, { type: 'square', gain: 0.05 });
    noise(0.06, { freq: 2100, q: 6, gain: 0.35, decay: 0.05, when: 0.09 });
  },
  chain() { for (let i = 0; i < 4; i++) tone(4200 + Math.random() * 1800, 0.08, { gain: 0.025, when: i * 0.035 }); },
  key() { noise(0.035, { freq: 1700 + Math.random() * 1600, q: 2.5, gain: 0.06 + Math.random() * 0.05, decay: 0.03 }); },
  sip() { noise(0.55, { freq: 700, q: 1.4, gain: 0.08, attack: 0.08, decay: 0.5, sweepTo: 1600 }); },
  clink() { tone(2480, 0.5, { gain: 0.06 }); tone(3710, 0.35, { gain: 0.03 }); noise(0.04, { freq: 5000, q: 3, gain: 0.08 }); },
  scratch() { for (let i = 0; i < 9; i++) noise(0.09, { freq: 5200 + Math.random() * 2000, q: 1.2, gain: 0.05, when: i * 0.13 + Math.random() * 0.04 }); },
  page() { noise(0.45, { type: 'highpass', freq: 1800, q: 0.7, gain: 0.12, attack: 0.04, decay: 0.42, sweepTo: 5200 }); },
  whoosh() { noise(0.9, { freq: 300, q: 0.8, gain: 0.16, attack: 0.25, decay: 0.85, sweepTo: 2600 }); },
  projector() { for (let i = 0; i < 6; i++) noise(0.03, { freq: 2600, q: 3, gain: 0.08, when: i * 0.06 }); },
  chime() { tone(1318, 1.2, { gain: 0.05 }); tone(1976, 1.4, { gain: 0.035, when: 0.08 }); tone(2637, 1.6, { gain: 0.02, when: 0.16 }); },
  click() { noise(0.03, { freq: 4200, q: 3, gain: 0.12 }); },
  mic() { tone(70, 0.35, { gain: 0.25, to: 45 }); noise(0.2, { type: 'lowpass', freq: 400, gain: 0.15 }); },
  step() { noise(0.12, { type: 'lowpass', freq: 380, q: 0.9, gain: 0.22, attack: 0.004, decay: 0.11 }); noise(0.05, { freq: 2600, q: 2, gain: 0.03, when: 0.01 }); },
  applause() {
    for (let i = 0; i < 140; i++) noise(0.05, { freq: 1200 + Math.random() * 2200, q: 1.5, gain: 0.05 + Math.random() * 0.05, when: Math.random() * 2.6 * Math.pow(Math.random(), 0.4) });
  },
  bird() {
    const base = 2400 + Math.random() * 1600;
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) tone(base, 0.09, { gain: 0.03, when: i * 0.12, to: base * (1.25 + Math.random() * 0.3) });
  },
  type() { for (let i = 0; i < 5; i++) setTimeout(() => SFX.key(), i * (60 + Math.random() * 70)); },
};

export function sfx(name) { if (on && SFX[name]) SFX[name](); }

// --- ambience loops ---
function startLoop(name) {
  if (!ensure() || loops.has(name)) return;
  const nodes = { gain: ctx.createGain(), timers: [] };
  nodes.gain.gain.value = 0.0001;
  nodes.gain.connect(master);
  if (name === 'rain' || name === 'room') {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = name === 'rain' ? 'bandpass' : 'lowpass';
    f.frequency.value = name === 'rain' ? 1400 : 220; f.Q.value = name === 'rain' ? 0.4 : 0.7;
    src.connect(f).connect(nodes.gain); src.start(); nodes.src = src;
    if (name === 'rain') nodes.timers.push(setInterval(() => noise(0.03, { freq: 2600 + Math.random() * 3000, q: 4, gain: 0.02 + Math.random() * 0.03 }), 90));
  }
  if (name === 'birds') nodes.timers.push(setInterval(() => { if (Math.random() < 0.55) SFX.bird(); }, 1300));
  if (name === 'crowd') {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.6;
    src.connect(f).connect(nodes.gain); src.start(); nodes.src = src;
  }
  loops.set(name, nodes);
}

export function ambience(name, level) {
  if (!ensure()) return;
  if (level > 0) startLoop(name);
  const n = loops.get(name);
  if (!n) return;
  const target = { rain: 0.11, room: 0.18, birds: 1, crowd: 0.05 }[name] * level;
  n.gain.gain.setTargetAtTime(Math.max(0.0001, target), ctx.currentTime, 0.8);
  if (level > 0 && n.stopTimer) { clearTimeout(n.stopTimer); n.stopTimer = null; }
  if (level <= 0 && !n.stopTimer) {
    n.stopTimer = setTimeout(() => {
      const m = loops.get(name);
      if (!m || m !== n) return;
      m.timers.forEach(clearInterval);
      try { m.src && m.src.stop(); } catch (e) { /* already stopped */ }
      m.gain.disconnect(); loops.delete(name);
    }, 3200);
  }
}

export function stopAll() { [...loops.keys()].forEach((k) => ambience(k, 0)); }

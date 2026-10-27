// WebGL renderer for the desk photograph (v2).
// Gestures are a masked "motion dissolve": only the hand region changes, the old pose slides
// down and fades, the new pose rises in, with a short motion blur. No optical-flow warping.
// Also: the pencil-sketch opening (draws itself, then watercolour reveals the photo), gentle depth
// parallax, swaying leaves, typing fingers, lamp light with eased on/off, a warm sheen on the
// wood, moonlight or sunlight through blinds, a soft hover glow and a vignette.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA, uB, uMask, uAux1, uAux2, uSketch, uPaint;
uniform vec2 uRes, uMouse, uHoverC, uRevealC;
uniform float uMorph, uPair, uTime, uLamp, uDawn, uWindow, uTyping, uSway, uFlutter, uHover, uHoverR;
uniform float uIntro, uDraw;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }

vec3 frameA(vec2 uv) { return texture2D(uA, uv).rgb; }
vec3 frameB(vec2 uv) { return texture2D(uB, uv).rgb; }

void main() {
  vec2 px = 1.0 / uRes;
  vec2 uv = vUv;
  vec4 a1 = texture2D(uAux1, uv);
  // gentle depth parallax (kept small so nothing stretches)
  uv += uMouse * (a1.r - 0.35) * vec2(8.0, 5.0) * px;
  vec4 a2 = texture2D(uAux2, uv);
  float lf = a2.r * uSway;
  uv += lf * vec2(sin(uTime * 1.1 + uv.y * 9.0) * 1.6 + sin(uTime * 2.3 + uv.x * 13.0) * 0.5, sin(uTime * 1.4 + uv.x * 7.0) * 0.8) * px;
  uv.y -= a2.b * uFlutter * (sin(uTime * 2.0 + uv.x * 24.0) * 0.5 + 0.5) * 1.6 * px.y;
  float lane = floor(uv.x * uRes.x / 34.0);
  float tap = pow(max(0.0, sin(uTime * 11.0 + lane * 2.1 + sin(lane * 7.3) * 3.0)), 6.0);
  uv.y -= a2.g * uTyping * tap * 2.0 * px.y;

  // --- gesture: masked motion dissolve ---
  float m0 = uMorph;
  vec3 mk = m0 > 0.001 ? texture2D(uMask, uv).rgb : vec3(0.0);
  float region = uPair < 0.5 ? mk.r : (uPair < 1.5 ? mk.g : mk.b);
  float m = uMorph;
  float blend = smoothstep(0.36, 0.64, m);       // short overlap: one motion, not a double image
  float vel = sin(3.14159 * m);                  // fastest mid-way
  float outShift = 44.0 * m * m;                 // old pose drops toward the viewer
  float inShift = 44.0 * (1.0 - m) * (1.0 - m);  // new pose rises into place
  vec3 col;
  if (m > 0.001 && region > 0.002) {
    vec3 ca = vec3(0.0); vec3 cb = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float t = (float(i) / 5.0 - 0.5) * 26.0 * vel * region;
      ca += frameA(uv - vec2(0.0, (outShift * region + t) * px.y));
      cb += frameB(uv + vec2(0.0, (inShift * region + t) * px.y));
    }
    col = mix(ca / 6.0, cb / 6.0, blend);
  } else {
    col = m > 0.001 ? mix(frameA(uv), frameB(uv), blend) : frameA(uv);
  }

  vec2 p = uv * uRes;
  float L = a1.g, emis = a1.b, bulb = a1.a;

  // lamp off: screen glow and a cool ambient only
  vec3 night = col * (0.40 - 0.24 * L) * vec3(0.70, 0.78, 1.0);
  night = mix(night, col * vec3(0.92, 0.94, 1.0), emis * 0.9);
  night = mix(night, col * vec3(0.16, 0.15, 0.15), bulb);

  // lamp on: the photograph plus a soft cone, a warm sheen on the wood, glints on books and leaves
  vec3 lit = col;
  vec2 q = p - vec2(340.0, 205.0);
  float cone = smoothstep(0.0, 70.0, q.y) * (1.0 - smoothstep(q.y * 0.55 + 110.0, q.y * 0.95 + 190.0, abs(q.x + q.y * 0.12))) * exp(-q.y / 520.0);
  lit += vec3(1.0, 0.78, 0.5) * cone * 0.06;
  float wood = smoothstep(560.0, 640.0, p.y) * smoothstep(0.05, 0.25, col.r - col.b) * (1.0 - smoothstep(0.55, 0.8, dot(col, vec3(0.33))));
  vec2 hs = (p - vec2(420.0 - uMouse.x * 90.0, 700.0 - uMouse.y * 30.0)) / vec2(420.0, 120.0);
  float sheen = exp(-dot(hs, hs)) * wood;
  lit += vec3(1.0, 0.80, 0.55) * sheen * 0.16;
  float glint = a2.a * pow(max(0.0, sin(p.x * 0.022 - uTime * 0.5 + p.y * 0.01)), 22.0);
  lit += vec3(1.0, 0.86, 0.62) * glint * 0.2;
  lit += vec3(1.0, 0.85, 0.6) * bulb * 0.16;

  vec3 c = mix(night, lit, uLamp);

  // light through window blinds: moonlight at night, sunlight at dawn
  float fb = fract((p.y + p.x * 0.42) / 34.0);
  float blinds = 0.35 + 0.65 * smoothstep(0.10, 0.34, fb) * (1.0 - smoothstep(0.58, 0.82, fb));
  float reach = (1.0 - smoothstep(260.0, 1100.0, p.x + p.y * 0.32)) * (1.0 - 0.55 * smoothstep(560.0, 990.0, p.y));
  float amt = max(uWindow * 0.65, uDawn);
  vec3 wc = mix(vec3(0.42, 0.56, 1.0) * 0.55, vec3(1.0, 0.74, 0.46) * 0.95, uDawn);
  c += col * wc * blinds * reach * amt * 0.75;
  vec3 warm = max(c, col * (0.66 - 0.30 * L) * vec3(1.06, 0.92, 0.80));
  c = mix(c, warm * vec3(1.04, 0.98, 0.90), uDawn * 0.9);
  c += wc * blinds * reach * 0.02 * amt;

  // soft glow on whatever the cursor is over
  vec2 hd = (p - uHoverC) / max(uHoverR, 1.0);
  c += col * vec3(1.0, 0.86, 0.66) * exp(-dot(hd, hd) * 1.6) * uHover * 0.22;

  // --- opening: pencil sketch draws itself, then watercolour brings the photo to life ---
  if (uIntro < 0.999) {
    vec3 paper = vec3(0.955, 0.925, 0.865) + (vnoise(vUv * uRes * 0.35) - 0.5) * 0.03;
    vec3 sk = texture2D(uSketch, vUv).rgb;
    float n = fbm(vUv * vec2(6.0, 4.0));
    float rd = length((vUv - vec2(0.55, 0.55)) * vec2(1.6, 1.0));
    float drawT = uDraw * 1.35 - (rd * 0.55 + n * 0.45);
    vec3 sheet = mix(paper, sk, smoothstep(0.0, 0.18, drawT));
    float paint = texture2D(uPaint, vUv).r;
    float wn = fbm(vUv * vec2(9.0, 6.0) + uTime * 0.03);
    float rr = length((vUv - uRevealC) * vec2(1.6, 1.0));
    float reveal = clamp(paint * 1.25 + (uIntro * 2.4 - rr * 1.4) - wn * 0.55, 0.0, 1.0);
    float edge = smoothstep(0.0, 0.3, reveal) * (1.0 - smoothstep(0.3, 0.7, reveal));
    vec3 pigment = mix(sheet * vec3(1.0, 0.86, 0.7), c, 0.55);   // warm pigment blooms at the wet edge
    vec3 photo = mix(c, pigment, edge * 0.8);
    float wet = smoothstep(0.08, 0.6, reveal + (fbm(vUv * 22.0) - 0.5) * 0.18);
    c = mix(sheet, photo, wet);
  }

  vec2 vv = (vUv - 0.5) * vec2(1.0, 1.25);
  c *= mix(1.0, 1.0 - dot(vv, vv) * 0.85, 0.75);
  float g = hash(vUv * uRes + fract(uTime) * 61.0);
  c += (g - 0.5) * 0.012;
  gl_FragColor = vec4(c, 1.0);
}`;

export class DeskGL {
  constructor(canvas) {
    this.canvas = canvas;
    const opts = { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    const gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.prog = this.program(VERT, FRAG);
    gl.useProgram(this.prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    ['uA', 'uB', 'uMask', 'uAux1', 'uAux2', 'uSketch', 'uPaint', 'uRes', 'uMouse', 'uHoverC', 'uRevealC', 'uMorph', 'uPair', 'uTime',
      'uLamp', 'uDawn', 'uWindow', 'uTyping', 'uSway', 'uFlutter', 'uHover', 'uHoverR', 'uIntro', 'uDraw'].forEach((n) => { this.u[n] = gl.getUniformLocation(this.prog, n); });
    this.tex = {};
    this.blank = this.makeTex(null);
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  makeTex(src) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    return t;
  }

  updateTex(name, src) {
    const gl = this.gl;
    if (!this.tex[name]) { this.tex[name] = this.makeTex(src); return; }
    gl.bindTexture(gl.TEXTURE_2D, this.tex[name]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }

  static loadImage(src) {
    return new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('Missing ' + src)); im.src = src; });
  }

  /** First paint needs the sketch, frame 1 and the maps; the other hand frames stream in after. */
  async load(base, onRest) {
    const first = { sketch: 'sketch.jpg', f1: 'f1.jpg', aux1: 'aux1.png', aux2: 'aux2.png', mask: 'masks.png' };
    const got = await Promise.all(Object.entries(first).map(async ([k, f]) => [k, await DeskGL.loadImage(base + f)]));
    got.forEach(([k, im]) => { this.tex[k] = this.makeTex(im); });
    ['f2', 'f3', 'f4'].forEach((k) => { this.tex[k] = this.tex.f1; });
    Promise.all(['f2', 'f3', 'f4'].map(async (k) => [k, await DeskGL.loadImage(base + k + '.jpg')]))
      .then((rest) => { rest.forEach(([k, im]) => { this.tex[k] = this.makeTex(im); }); if (onRest) onRest(); })
      .catch((e) => console.warn(e.message));
  }

  resize(w, h, dpr) {
    const W = Math.round(w * dpr); const H = Math.round(h * dpr);
    if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; }
    this.gl.viewport(0, 0, W, H);
  }

  bind(unit, name, tex) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex || this.blank);
    gl.uniform1i(this.u[name], unit);
  }

  render(s) {
    const gl = this.gl; const u = this.u; const T = this.tex;
    const pairOf = (a, b) => { const k = [a, b].sort().join(''); return k === '12' ? 0 : k === '14' ? 1 : 2; };
    this.bind(0, 'uA', T['f' + s.frameA]);
    this.bind(1, 'uB', T['f' + s.frameB]);
    this.bind(2, 'uMask', T.mask);
    this.bind(3, 'uAux1', T.aux1);
    this.bind(4, 'uAux2', T.aux2);
    this.bind(5, 'uSketch', T.sketch);
    this.bind(6, 'uPaint', T.paint);
    gl.uniform2f(u.uRes, 1586, 992);
    gl.uniform2f(u.uMouse, s.mx, s.my);
    gl.uniform2f(u.uHoverC, s.hoverX, s.hoverY);
    gl.uniform2f(u.uRevealC, s.revealX, s.revealY);
    gl.uniform1f(u.uHoverR, s.hoverR);
    gl.uniform1f(u.uHover, s.hover);
    gl.uniform1f(u.uMorph, s.frameA === s.frameB ? 0 : s.morph);
    gl.uniform1f(u.uPair, s.frameA === s.frameB ? 0 : pairOf(s.frameA, s.frameB));
    gl.uniform1f(u.uTime, s.time);
    gl.uniform1f(u.uLamp, s.lamp);
    gl.uniform1f(u.uDawn, s.dawn);
    gl.uniform1f(u.uWindow, s.window);
    gl.uniform1f(u.uTyping, s.typing);
    gl.uniform1f(u.uSway, s.sway);
    gl.uniform1f(u.uFlutter, s.flutter);
    gl.uniform1f(u.uIntro, s.intro);
    gl.uniform1f(u.uDraw, s.draw);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

// Small Verlet rope used for the lamp's pull chain and the keychains.
export class Rope {
  constructor(x, y, segments, segLen, { gravity = 1400, damping = 0.985, stiffness = 6 } = {}) {
    this.n = segments + 1;
    this.len = segLen;
    this.g = gravity; this.damp = damping; this.iter = stiffness;
    this.p = []; this.o = [];
    for (let i = 0; i < this.n; i++) { this.p.push([x, y + i * segLen]); this.o.push([x, y + i * segLen]); }
    this.anchor = [x, y];
    this.grab = null;      // [x, y] when the last point is held
    this.maxStretch = 1.35;
  }

  impulse(vx, vy, from = 1) {
    for (let i = from; i < this.n; i++) { const k = i / (this.n - 1); this.o[i][0] -= vx * k; this.o[i][1] -= vy * k; }
  }

  step(dt) {
    dt = Math.min(dt, 1 / 30);
    const { p, o } = this;
    p[0][0] = this.anchor[0]; p[0][1] = this.anchor[1];
    for (let i = 1; i < this.n; i++) {
      const vx = (p[i][0] - o[i][0]) * this.damp; const vy = (p[i][1] - o[i][1]) * this.damp;
      o[i][0] = p[i][0]; o[i][1] = p[i][1];
      p[i][0] += vx; p[i][1] += vy + this.g * dt * dt;
    }
    if (this.grab) { const l = this.n - 1; p[l][0] = this.grab[0]; p[l][1] = this.grab[1]; }
    for (let k = 0; k < this.iter; k++) {
      for (let i = 0; i < this.n - 1; i++) {
        const a = p[i]; const b = p[i + 1];
        const dx = b[0] - a[0]; const dy = b[1] - a[1];
        const d = Math.hypot(dx, dy) || 1e-4;
        const rest = this.grab ? this.len * Math.min(this.maxStretch, Math.max(1, this.stretchFor(d))) : this.len;
        const diff = (d - rest) / d;
        const fixedA = i === 0; const fixedB = this.grab && i + 1 === this.n - 1;
        if (fixedA && fixedB) continue;
        if (fixedA) { b[0] -= dx * diff; b[1] -= dy * diff; }
        else if (fixedB) { a[0] += dx * diff; a[1] += dy * diff; }
        else { a[0] += dx * diff * 0.5; a[1] += dy * diff * 0.5; b[0] -= dx * diff * 0.5; b[1] -= dy * diff * 0.5; }
      }
      p[0][0] = this.anchor[0]; p[0][1] = this.anchor[1];
    }
  }

  stretchFor() {
    if (!this.grab) return 1;
    const total = Math.hypot(this.grab[0] - this.anchor[0], this.grab[1] - this.anchor[1]);
    return total / (this.len * (this.n - 1));
  }

  end() { return this.p[this.n - 1]; }
  /** angle of the last segment, radians, 0 = hanging straight down */
  endAngle() { const a = this.p[this.n - 2]; const b = this.p[this.n - 1]; return Math.atan2(-(b[0] - a[0]), b[1] - a[1]); }
}

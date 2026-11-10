// Can You Trust AI?: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// Timing is in beats (u, 0.5 s each at 120 bpm); docs/shotlist.md is the plan this file follows.
// Everything on screen is type and shapes drawn in code. One accent colour: acid.
import * as M from './lib/motion.js';

const { W, H, FORMAT, E, prog, lerp, clamp, springU, springKeys, SPRING, wobble, ring, font, layout, glyph, text, fill, rrect, shake, hash01, noise1, mulberry32, mix, TAU } = M;

const C = { bg: '#0A0A0B', ink: '#EDEBE6', acc: '#C8FF2E', dim: '#5E5D59', line: '#1E1E21' };
const D = (s) => font(s, 900, 'Display');
const MONO = (s) => font(s, 700, 'UI');
const S = FORMAT.safe;            // 9x16: x 72, y 250, w 858, h 1240
const X0 = S.x + 6;

// ---------------------------------------------------------------- hits (picture + sound share this)
const HITS = [
  [0, 'YOU', 'impact'], [1, 'ALREADY', 'thud', { pitch: 110 }], [2, 'TRUST', 'thud', { pitch: 90 }], [2.5, 'AI.', 'pop', { pitch: 'D6' }],
  [3.5, 'every single day', 'type', { len: 1.3 }],
  [7.5, 'hook out', 'whoosh', { len: 0.4 }],
  [8, 'FEED', 'thud+click'], [9.5, 'MAPS', 'thud+click', { pan: -0.2 }], [11, 'BANK', 'thud+click', { pan: 0.2 }],
  [12.5, 'SHOULD', 'click'], [13.5, 'YOU?', 'pop', { pitch: 'A5' }],
  [16, 'DROP: the meter', 'impact', { len: 2 }],
  [16, 'into drop', 'riser', { len: 2 }],
  [17, 'calculating', 'type', { len: 2.5 }],
  [24, 'needle snaps / FOR', 'whoosh+thud', { len: 0.4 }],
  [31.5, 'push through O', 'whoosh', { len: 0.5, from: 500, to: 3000 }],
  [32, '01 health', 'click'],
  [33.1, 'pulse', 'blip', { pitch: 'D6' }], [34.7, 'pulse', 'blip', { pitch: 'D6' }], [36.3, 'pulse flagged', 'blip+pop', { pitch: 'A6' }], [37.9, 'pulse', 'blip', { pitch: 'D6' }],
  [40, '02 money', 'click'], [40.2, 'rows', 'type', { len: 1.9, gain: 0.15 }], [44, 'row locks', 'thud'], [44.5, 'FLAGGED', 'bell', { pitch: 'D6' }],
  [48, 'TRANSLATES', 'pop', { pitch: 'D5' }], [49, 'TUTORS', 'pop', { pitch: 'F5' }], [50, 'NEVER SLEEPS', 'pop', { pitch: 'A5' }],
  [52, 'AGAINST: slam', 'impact'],
  [60, '04 made up', 'click'], [61, 'question', 'type', { len: 1.4 }], [63, 'answer', 'type', { len: 1.8 }],
  [65, 'strike', 'thud', { pitch: 140 }], [65.5, 'strike', 'thud', { pitch: 120 }], [66, 'strike', 'thud', { pitch: 100 }],
  [66.5, 'CONFIDENTLY stamp', 'impact', { gain: 0.5 }],
  [68, '05 bias', 'click'], [70, 'model copies tilt', 'boing', { pitch: 300, to: 180 }],
  [72, 'A VOICE', 'whoosh', { len: 0.35 }], [74, 'A FACE', 'whoosh', { len: 0.35, pan: -0.3 }], [76, 'A WHOLE VIDEO', 'whoosh+sub', { len: 0.5, pan: 0.3 }],
  [80, 'attention', 'click'], [83.5, 'eye shuts', 'thud', { pitch: 70 }],
  [84, 'into verdict', 'riser', { len: 1.5 }], [84, 'VERDICT', 'impact'],
  [92, 'BLINDLY', 'whoosh+thud', { len: 0.35, pan: -0.4 }], [96, 'EITHER', 'whoosh+thud', { len: 0.35, pan: 0.4 }],
  [100, 'intern', 'click'], [102, 'fast', 'tick'], [103.5, 'tireless', 'tick'], [105, 'you check', 'bell', { pitch: 'A5' }],
  [108, 'ASK', 'thud'], [109, 'who built it', 'type', { len: 1.2 }], [112, 'when its wrong', 'type', { len: 1.6 }],
  [116, 'END: TRUST.', 'impact'], [116, 'into end', 'riser', { len: 1 }], [117, 'BUT', 'tick'], [117.5, 'VERIFY.', 'thud+bell', { pitch: 'D6' }],
];

// ---------------------------------------------------------------- type helpers
const sizeCache = new Map();
function fitGroup(ctx, lines, max, w = S.w - 12, f = 'Display', wt = 900, track = -0.035) {
  const k = lines.join('|') + max + w + f;
  if (sizeCache.has(k)) return sizeCache.get(k);
  const s = Math.min(...lines.map((l) => M.fitSize(ctx, l, wt, f, w, max, track)));
  sizeCache.set(k, s); return s;
}
// Per-glyph drop with overshoot. Returns the layout.
function slam(ctx, str, x, y, size, color, u, u0, o = {}) {
  const { stagger = 0.035, from = 150, cfg = SPRING.bouncy, align = 'left', track = -0.035 } = o;
  const f = D(size), L = layout(ctx, str, f, track * size);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * stagger, cfg);
    if (k <= 0.001) return;
    ctx.globalAlpha = clamp(k * 4);
    glyph(ctx, g.ch, x0 + g.cx, y - (1 - k) * from, f, color, 1, clamp(0.55 + 0.45 * k, 0, 1.25));
  });
  ctx.globalAlpha = 1;
  return L;
}
// Glyphs rise into place from behind a mask at the baseline.
function rise(ctx, str, x, y, size, color, u, u0, o = {}) {
  const { stagger = 0.04, track = -0.035, align = 'left', cfg = SPRING.snappy } = o;
  const f = D(size), L = layout(ctx, str, f, track * size);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.2, W, size * 1.2 + size * 0.24); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * stagger, cfg);
    if (k <= 0.001) return;
    glyph(ctx, g.ch, x0 + g.cx, y + (1 - k) * size * 1.15, f, color);
  });
  ctx.restore();
  return L;
}
// Mono typing with a block cursor.
function typed(ctx, str, x, y, size, color, u, u0, u1, o = {}) {
  const { cursor = true, cursorUntil = Infinity } = o;
  if (u < u0) return 0;
  const n = Math.floor(prog(u, u0, u1) * str.length + 1e-6);
  const f = MONO(size);
  ctx.font = f;
  const s = str.slice(0, n);
  text(ctx, s, x, y, f, color);
  const w = ctx.measureText(s).width;
  const typing = u < u1;
  if (cursor && u < cursorUntil && (typing || Math.floor(u * 2) % 2 === 0)) {
    ctx.fillStyle = C.acc; ctx.fillRect(x + w + 4, y - size * 0.8, size * 0.55, size * 0.95);
  }
  return w;
}
// Section label: "01 / HEALTH" with a bar that draws on.
function label(ctx, str, u, u0, y = S.y + 70) {
  const k = E.outExpo(prog(u, u0 - 0.3, u0 + 0.4));
  ctx.fillStyle = C.acc; ctx.fillRect(X0, y - 30, 52 * k, 30);
  typed(ctx, str, X0 + 70, y, 40, C.acc, u, u0 - 0.3, u0 + 0.2, { cursor: false });
}
const headTop = S.y + 120;

// ---------------------------------------------------------------- the trust meter
const HERO = [540, 1130, 390], SMALL = [540, 1468, 112];
function needle(u) {
  let v = springKeys(u, [[0, 0], [23.8, 0.32], [32, 0.45], [40, 0.62], [48, 0.88], [52, -0.5], [60, -0.62], [68, -0.76], [72, -0.86], [80, -0.97], [84, 0]], SPRING.wobbly);
  v += 0.6 * noise1(u * 1.7, 5) * prog(u, 16.3, 17.5) * (1 - prog(u, 22, 23.8));
  v += 0.75 * ring(u - 84, 0.32, 0.38);
  return clamp(v, -1.05, 1.05);
}
function meterGeom(u) {
  return springKeys(u, [[0, HERO], [23.4, SMALL], [52, HERO], [60, SMALL], [84, HERO]], SPRING.gentle);
}
function meterVis(u) {
  if (u < 15.75 || u >= 92) return 0;
  return springU(u, 15.75, SPRING.bouncy) * (1 - E.inBack(prog(u, 91.4, 92), 2));
}
function drawMeter(ctx, cx, cy, R, v, vis, col = { ink: C.ink, acc: C.acc, dim: C.dim, bg: C.bg }, readout = true) {
  if (vis <= 0.001) return;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(vis, vis);
  const a = v * Math.PI * 0.46;                // 0 = straight up
  // track
  ctx.lineCap = 'butt';
  ctx.lineWidth = Math.max(6, R * 0.055);
  ctx.strokeStyle = col.dim; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.arc(0, 0, R, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
  ctx.globalAlpha = 1;
  // filled segment from centre to the needle: acid toward TRUST, ink toward DON'T
  const up = -Math.PI / 2;
  ctx.strokeStyle = v >= 0 ? col.acc : col.ink;
  ctx.beginPath();
  if (v >= 0) ctx.arc(0, 0, R, up, up + a); else ctx.arc(0, 0, R, up + a, up);
  ctx.stroke();
  // ticks
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = -Math.PI * 0.46 + (i / n) * Math.PI * 0.92 + up;
    const major = i % 10 === 0;
    const r0 = R * (major ? 0.8 : 0.86), r1 = R * 0.92;
    ctx.strokeStyle = major ? col.ink : col.dim; ctx.lineWidth = major ? Math.max(2, R * 0.012) : Math.max(1, R * 0.006);
    ctx.beginPath(); ctx.moveTo(Math.cos(t) * r0, Math.sin(t) * r0); ctx.lineTo(Math.cos(t) * r1, Math.sin(t) * r1); ctx.stroke();
  }
  // labels
  const ls = Math.max(22, R * 0.085);
  text(ctx, "DON'T", -R, ls * 1.5, MONO(ls), v < -0.15 ? col.ink : col.dim, 'center');
  text(ctx, 'TRUST', R, ls * 1.5, MONO(ls), v > 0.15 ? col.acc : col.dim, 'center');
  // needle
  ctx.rotate(a);
  ctx.fillStyle = col.ink;
  ctx.beginPath(); ctx.moveTo(-R * 0.025, 0); ctx.lineTo(0, -R * 0.97); ctx.lineTo(R * 0.025, 0); ctx.closePath(); ctx.fill();
  ctx.rotate(-a);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.07, 0, TAU); ctx.fillStyle = col.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.03, 0, TAU); ctx.fillStyle = col.bg; ctx.fill();
  if (readout && R > 200) {
    const pct = Math.round(clamp((v + 1) / 2) * 100);
    text(ctx, `TRUST LEVEL ${String(pct).padStart(2, '0')}%`, 0, R * 0.32, MONO(R * 0.09), col.ink, 'center');
  }
  ctx.restore();
}

// ---------------------------------------------------------------- scenes
// S1 hook (0..8)
function sHook(ctx, u) {
  const lines = ['YOU', 'ALREADY', 'TRUST AI.'];
  const size = fitGroup(ctx, lines, 250);
  const lh = size * 0.9;
  const out = E.inBack(prog(u, 7.4, 8), 1.6) * -H * 0.9;
  ctx.save(); ctx.translate(0, out);
  const y0 = H * 0.36;
  slam(ctx, 'YOU', X0, y0, size, C.ink, u, -0.3, { from: 80 });
  slam(ctx, 'ALREADY', X0, y0 + lh, size, C.ink, u, 1 - 0.15, { from: 80 });
  const L = slam(ctx, 'TRUST ', X0, y0 + lh * 2, size, C.ink, u, 2 - 0.15, { from: 80 });
  slam(ctx, 'AI.', X0 + L.width, y0 + lh * 2, size, C.acc, u, 2.5 - 0.15, { from: 80 });
  typed(ctx, '> every single day.', X0, y0 + lh * 2 + 150, 60, C.ink, u, 3.5, 5.6);
  ctx.restore();
}
// S2 feed / maps / bank (8..12.5), should you? (12.5..16)
const EVERY = [
  [8, 'FEED', 'recommended for you'],
  [9.5, 'MAPS', 'turn left in 300 m'],
  [11, 'BANK', 'payment approved'],
];
function sEveryday(ctx, u) {
  if (u < 12.5) {
    const i = u < 9.5 ? 0 : u < 11 ? 1 : 2;
    const [u0, w, sub] = EVERY[i];
    const size = fitGroup(ctx, ['FEED', 'MAPS', 'BANK'], 420);
    const p = prog(u, u0, u0 + 1.5);
    const z = 1.0 * (1.1 / 1.0) ** p;
    const cy = H * 0.52;
    ctx.save(); M.zoomAbout(ctx, z, W / 2, cy);
    text(ctx, 'YOUR', X0, cy - size * 0.86, MONO(56), C.acc);
    const f = D(size), L = layout(ctx, w, f, -0.04 * size);
    const kin = springU(u, u0, SPRING.snappy);
    ctx.save(); ctx.translate((1 - kin) * 120, 0);
    text(ctx, w, X0 - 4, cy, f, C.ink, 'left', -0.04 * size);
    ctx.restore();
    const bw = E.outExpo(prog(u, u0 + 0.15, u0 + 0.9)) * L.width;
    ctx.fillStyle = C.acc; ctx.fillRect(X0, cy + 34, bw, 22);
    typed(ctx, `> ${sub}`, X0, cy + 140, 44, C.dim, u, u0 + 0.3, u0 + 1.2, { cursorUntil: u0 + 1.5 });
    ctx.restore();
    return;
  }
  const size = fitGroup(ctx, ['SHOULD', 'YOU?'], 300);
  const y0 = H * 0.46;
  const out = E.inBack(prog(u, 15.4, 15.85), 1.6) * -H * 0.7;
  ctx.save(); ctx.translate(0, out);
  text(ctx, 'SO...', X0, y0 - size * 0.95, MONO(56), C.dim);
  slam(ctx, 'SHOULD', X0, y0, size, C.ink, u, 12.5 - 0.15);
  const L = slam(ctx, 'YOU', X0, y0 + size * 0.92, size, C.ink, u, 13.5 - 0.15);
  slam(ctx, '?', X0 + L.width + size * 0.02, y0 + size * 0.92, size, C.acc, u, 13.75, { cfg: SPRING.wobbly });
  ctx.restore();
}
// S3 the drop: meter hero (16..24)
function sDrop(ctx, u) {
  const size = fitGroup(ctx, ['TRUST AI?'], 170);
  rise(ctx, 'TRUST AI?', X0, headTop + size, size, C.ink, u, 15.8);
  typed(ctx, '// calculating...', X0, headTop + size + 90, 40, C.dim, u, 17, 19.5);
}
// S4 the case FOR (24..32)
function sFor(ctx, u) {
  const size = fitGroup(ctx, ['FOR.'], 480);
  const y = S.y + 330 + size * 0.75;
  const f = D(size), L = layout(ctx, 'FOR.', f, -0.035 * size);
  // push-through the counter of the O
  const o = L.glyphs[1];
  const pz = prog(u, 31.3, 32);
  const z = 1 * 40 ** E.inCubic(pz);
  ctx.save(); M.zoomAbout(ctx, z, X0 + o.cx, y - size * 0.36);
  typed(ctx, 'THE CASE', X0, S.y + 150, 64, C.ink, u, 23.75, 24.2, { cursor: false });
  rise(ctx, 'FOR.', X0, y, size, C.acc, u, 23.85);
  typed(ctx, '3 reasons it earns trust:', X0, y + 120, 40, C.dim, u, 27, 29.5, { cursorUntil: 31.3 });
  ctx.restore();
}
// S5 health: ECG with a scan bar (32..40)
function ecgY(p) {
  let y = 0;
  [0.12, 0.37, 0.62, 0.87].forEach((c, i) => {
    const d = (p - c) * 70;
    const a = i === 2 ? 1.35 : 1;
    y += -a * Math.exp(-(d * d) * 3) + 0.35 * a * Math.exp(-((d - 0.7) ** 2) * 5) + 0.18 * Math.exp(-((d + 2.2) ** 2) * 1.2) - 0.12 * Math.exp(-((d - 3) ** 2));
  });
  return y;
}
function sHealth(ctx, u) {
  label(ctx, '01 / HEALTH', u, 32);
  const lines = ['IT HELPS DOCTORS', 'CATCH DISEASE', 'EARLIER.'];
  const size = fitGroup(ctx, lines, 140);
  lines.forEach((l, i) => rise(ctx, l, X0, headTop + size * (1 + i * 0.95), size, i === 2 ? C.acc : C.ink, u, 31.8 + i * 0.35));
  // ECG strip
  const top = 920, h = 300, base = top + h * 0.6, x0 = S.x, w = S.w;
  ctx.strokeStyle = C.line; ctx.lineWidth = 2;
  for (let gx = 0; gx <= 12; gx++) { ctx.beginPath(); ctx.moveTo(x0 + gx * w / 12, top); ctx.lineTo(x0 + gx * w / 12, top + h); ctx.stroke(); }
  for (let gy = 0; gy <= 4; gy++) { ctx.beginPath(); ctx.moveTo(x0, top + gy * h / 4); ctx.lineTo(x0 + w, top + gy * h / 4); ctx.stroke(); }
  const scan = prog(u, 32.5, 39);
  ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink;
  ctx.beginPath();
  const N = 400;
  for (let i = 0; i <= N * scan; i++) {
    const p = i / N, y = base + ecgY(p) * h * 0.5;
    if (i === 0) ctx.moveTo(x0 + p * w, y); else ctx.lineTo(x0 + p * w, y);
  }
  ctx.stroke();
  // scan bar
  if (scan < 1) {
    const sx = x0 + scan * w;
    ctx.fillStyle = C.acc; ctx.fillRect(sx - 3, top - 20, 6, h + 40);
  }
  // the flagged pulse
  const fp = 0.62, fx = x0 + fp * w;
  const fk = springU(u, 32.5 + fp * 6.5, SPRING.bouncy);
  if (fk > 0) {
    ctx.save(); ctx.translate(fx, top + h * 0.1);
    ctx.strokeStyle = C.acc; ctx.lineWidth = 5;
    const bw = 150 * fk, bh = 260 * fk;
    ctx.strokeRect(-bw / 2, -10, bw, bh);
    ctx.restore();
    ctx.globalAlpha = clamp(fk);
    text(ctx, 'EARLY SIGN', fx, top - 40, MONO(36), C.acc, 'center');
    ctx.globalAlpha = 1;
  }
}
// S6 money: transactions scroll then lock on fraud (40..48)
const MERCH = ['COFFEE', 'GROCERY', 'TRANSIT', 'STREAMING', 'PHARMACY', 'BAKERY', 'FUEL', 'BOOKS', 'GYM', 'TAXI', 'LUNCH', 'PHONE'];
function sMoney(ctx, u) {
  label(ctx, '02 / MONEY', u, 40);
  const lines = ['IT FLAGS FRAUD', 'IN MILLISECONDS.'];
  const size = fitGroup(ctx, lines, 140);
  lines.forEach((l, i) => rise(ctx, l, X0, headTop + size * (1 + i * 0.95), size, i === 1 ? C.acc : C.ink, u, 39.8 + i * 0.35));
  const top = 760, bot = 1300, rh = 84;
  const FL = 18;                                 // flagged row index
  const target = FL * rh - ((bot - top) / 2 - rh / 2);
  const scroll = target * (0.0 + E.outCubic(prog(u, 40, 44)));
  const lockK = springU(u, 44, SPRING.bouncy);
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip();
  for (let i = 0; i < 26; i++) {
    const y = top + i * rh - scroll + (i === FL ? 0 : 0);
    if (y < top - rh || y > bot) continue;
    const flagged = i === FL && u >= 44;
    if (flagged) {
      ctx.fillStyle = C.acc;
      const ex = 1 + 0.06 * wobble((u - 44) * 0.5, 2.4, 5);
      ctx.save(); ctx.translate(W / 2, y + rh / 2); ctx.scale(ex * lockK, ex); ctx.translate(-W / 2, -(y + rh / 2));
      rrect(ctx, S.x - 10, y + 6, S.w + 20, rh - 12, 10); ctx.fill(); ctx.restore();
    }
    const col = flagged ? C.bg : C.ink;
    const amt = i === FL ? '$4,999.00' : `$${(4 + hash01(i, 7) * 90).toFixed(2)}`;
    const m = i === FL ? 'WIRE ??? ' : MERCH[i % MERCH.length];
    text(ctx, m, S.x + 20, y + rh * 0.62, MONO(38), col);
    text(ctx, amt, S.x + S.w - 20, y + rh * 0.62, MONO(38), flagged ? C.bg : C.dim, 'right');
    if (!flagged) { ctx.fillStyle = C.line; ctx.fillRect(S.x, y + rh - 2, S.w, 2); }
  }
  ctx.restore();
  const tk = springU(u, 44.5, SPRING.bouncy);
  if (tk > 0) {
    const y = top + FL * rh - scroll;
    ctx.save(); ctx.translate(S.x + S.w - 10, y - 10); ctx.scale(tk, tk);
    rrect(ctx, -330, -58, 330, 60, 8); ctx.fillStyle = C.ink; ctx.fill();
    text(ctx, 'FLAGGED 0.003s', -165, -16, MONO(34), C.bg, 'center');
    ctx.restore();
  }
}
// S7 always on (48..52)
function sAlways(ctx, u) {
  label(ctx, '03 / ALWAYS ON', u, 48);
  const words = ['TRANSLATES.', 'TUTORS.', 'NEVER SLEEPS.'];
  const size = fitGroup(ctx, words, 150);
  words.forEach((w, i) => rise(ctx, w, X0, headTop + size * (1 + i * 0.95), size, i === 2 ? C.acc : C.ink, u, 48 + i - 0.25));
  // 24h ring
  const cx = 540, cy = 1060, R = 210;
  const spin = (u - 48) * 0.9;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU - Math.PI / 2;
    const lit = ((i / 24 - (spin % 1)) % 1 + 1) % 1;
    ctx.strokeStyle = lit < 0.3 ? mix(C.acc, C.dim, lit / 0.3) : C.dim; ctx.lineWidth = i % 6 === 0 ? 8 : 4;
    const r0 = i % 6 === 0 ? R * 0.78 : R * 0.86;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin * TAU);
  ctx.fillStyle = C.acc; ctx.fillRect(-4, -R * 0.7, 8, R * 0.7);
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin * TAU / 12);
  ctx.fillStyle = C.ink; ctx.fillRect(-6, -R * 0.45, 12, R * 0.45);
  ctx.restore();
  text(ctx, '24/7', cx, cy + 90, MONO(44), C.ink, 'center');
}
// S8 the case AGAINST (52..60): meter hero, glitch handled in post
function sAgainst(ctx, u) {
  const size = fitGroup(ctx, ['AGAINST.'], 260);
  typed(ctx, 'THE CASE', X0, S.y + 110, 64, C.ink, u, 51.75, 52.1, { cursor: false });
  const y = S.y + 150 + size;
  const g = Math.exp(-(u - 52) / 1.2);
  // acid ghost offset (cheap chromatic split)
  ctx.globalAlpha = 0.85;
  slam(ctx, 'AGAINST.', X0 + 14 * g + 4, y + 4, size, C.acc, u, 52 - 0.1, { stagger: 0.02, from: 260 });
  ctx.globalAlpha = 1;
  slam(ctx, 'AGAINST.', X0, y, size, C.ink, u, 52 - 0.1, { stagger: 0.02, from: 260 });
}
// S9 hallucination (60..68)
function sMadeUp(ctx, u) {
  label(ctx, '04 / MADE UP', u, 60);
  const lines = ['IT MAKES', 'THINGS UP.'];
  const size = fitGroup(ctx, lines, 170);
  lines.forEach((l, i) => rise(ctx, l, X0, headTop + size * (1 + i * 0.95), size, C.ink, u, 59.8 + i * 0.35));
  const bx = S.x, by = 700, bw = S.w, bh = 450;
  const k = springU(u, 60.2, SPRING.snappy);
  ctx.save(); ctx.translate(0, (1 - k) * 80); ctx.globalAlpha = clamp(k * 2);
  rrect(ctx, bx, by, bw, bh, 22); ctx.fillStyle = '#141416'; ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
  const fs = 40, lx = bx + 36;
  typed(ctx, '> who won the 1987', lx, by + 80, fs, C.dim, u, 61, 61.8, { cursorUntil: 62.6 });
  typed(ctx, '  moon olympics?', lx, by + 130, fs, C.dim, u, 61.8, 62.4, { cursorUntil: 62.9 });
  const ans = ['AI: Great question!', 'Brazil took gold in', '1987, winning 4-2.'];
  ans.forEach((a, i) => {
    const a0 = 63 + i * 0.6;
    const w = typed(ctx, a, lx, by + 230 + i * 62, fs, C.ink, u, a0, a0 + 0.55, { cursorUntil: i === 2 ? 64.8 : a0 + 0.6 });
    const sk = E.outExpo(prog(u, 65 + i * 0.5, 65.3 + i * 0.5));
    if (sk > 0) { ctx.fillStyle = C.acc; ctx.fillRect(lx - 8, by + 230 + i * 62 - 20, (w + 16) * sk, 12); }
  });
  ctx.restore();
  // stamp
  const sk = springU(u, 66.5, SPRING.bouncy);
  if (sk > 0) {
    const ss = fitGroup(ctx, ['CONFIDENTLY.'], 130, S.w - 60);
    const sc = lerp(1.8, 1, clamp(sk, 0, 1.3));
    ctx.save(); ctx.translate(540, 1280); ctx.rotate(-0.06); ctx.scale(sc, sc); ctx.globalAlpha = clamp(sk * 3);
    const L = layout(ctx, 'CONFIDENTLY.', D(ss), -0.03 * ss);
    ctx.strokeStyle = C.acc; ctx.lineWidth = 8;
    ctx.strokeRect(-L.width / 2 - 24, -ss * 0.85, L.width + 48, ss * 1.05);
    text(ctx, 'CONFIDENTLY.', -L.width / 2, 0, D(ss), C.acc, 'left', -0.03 * ss);
    ctx.restore();
  }
}
// S10 bias (68..72): the model copies the tilt in its data
function dotGrid(ctx, cx, cy, tilt, color, k) {
  const cols = 5, rows = 6, g = 58;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = cx + (c - (cols - 1) / 2) * g + (r - (rows - 1) / 2) * g * tilt;
    const y = cy + (r - (rows - 1) / 2) * g;
    const hot = c >= cols - 2 && tilt > 0.1;
    ctx.beginPath(); ctx.arc(x, y, 14 * k, 0, TAU); ctx.fillStyle = hot ? C.acc : color; ctx.fill();
  }
}
function sBias(ctx, u) {
  label(ctx, '05 / BIAS', u, 68);
  const lines = ['IT COPIES', 'OUR BIASES.'];
  const size = fitGroup(ctx, lines, 170);
  lines.forEach((l, i) => rise(ctx, l, X0, headTop + size * (1 + i * 0.95), size, i === 1 ? C.acc : C.ink, u, 67.8 + i * 0.35));
  const k1 = springU(u, 67.9, SPRING.bouncy), k2 = springU(u, 68.4, SPRING.bouncy);
  dotGrid(ctx, 290, 1060, 0.55, C.ink, k1);
  const t2 = 0.55 * springU(u, 70, SPRING.wobbly);
  dotGrid(ctx, 790, 1060, t2, C.ink, k2);
  text(ctx, 'OUR DATA', 290, 1290, MONO(34), C.dim, 'center');
  text(ctx, 'THE AI', 790, 1290, MONO(34), C.dim, 'center');
  const ak = E.outExpo(prog(u, 69.6, 70.4));
  ctx.fillStyle = C.dim; ctx.fillRect(450, 1058, 90 * ak, 4);
}
// S11 fakes (72..80): a voice, a face, a whole video
function faceLines(ctx, cx, cy, rx, ry, color, dx, jit, u) {
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  for (let y = -ry; y <= ry; y += 18) {
    const w = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
    if (w < 6) continue;
    const off = jit * noise1(y * 0.05 + u * 6, 3) * 40;
    ctx.beginPath();
    for (let x = -w; x <= w; x += 12) {
      let z = 0;
      const eye = (ex) => Math.exp(-(((x - ex) / 40) ** 2) - (((y + ry * 0.18) / 22) ** 2));
      z += 16 * (eye(-rx * 0.38) + eye(rx * 0.38));
      z += -14 * Math.exp(-((x / 26) ** 2) - (((y - ry * 0.05) / 60) ** 2));              // nose
      z += 12 * Math.exp(-((x / 90) ** 2) - (((y - ry * 0.42) / 14) ** 2));               // mouth
      const X = cx + x + dx + off, Y = cy + y + z;
      if (x === -w) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
}
function sFakes(ctx, u) {
  label(ctx, '06 / FAKES', u, 72);
  const words = ['A VOICE.', 'A FACE.', 'A WHOLE VIDEO.'];
  const size = fitGroup(ctx, words, 140);
  words.forEach((w, i) => rise(ctx, w, X0, headTop + size * (1 + i * 0.95), size, i === 2 ? C.acc : C.ink, u, 72 + i * 2 - 0.25));
  const cx = 540, cy = 1060;
  if (u < 74) {
    // a voice: waveform, real and fake copies
    const k = springU(u, 71.8, SPRING.snappy);
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? C.acc : C.ink; ctx.globalAlpha = pass ? 0.9 : 1;
      for (let i = 0; i < 34; i++) {
        const x = S.x + 20 + i * 24 + (pass ? 10 + 6 * Math.sin(u * 9) : 0);
        const a = (0.25 + 0.75 * Math.abs(noise1(i * 0.6 + u * 3, 11))) * 220 * k;
        ctx.fillRect(x, cy - a / 2 + (pass ? 8 : 0), 12, a);
      }
    }
    ctx.globalAlpha = 1;
    return;
  }
  const split = 8 + 70 * E.outCubic(prog(u, 76, 77.2)) * (1 - E.inCubic(prog(u, 79.3, 80)));
  const jit = u >= 76 ? 0.15 + 0.2 * Math.abs(noise1(u * 2, 4)) : 0.05;
  const k = springU(u, 74, SPRING.gentle);
  ctx.save(); M.zoomAbout(ctx, lerp(0.85, 1, k), cx, cy); ctx.globalAlpha = clamp(k * 2);
  faceLines(ctx, cx, cy, 200, 250, C.ink, -split, jit * 0.3, u);
  ctx.globalAlpha = clamp(k * 2) * 0.9;
  faceLines(ctx, cx, cy, 200, 250, C.acc, split, jit, u);
  ctx.restore();
  if (u >= 76) {
    const rk = Math.floor(u * 2) % 2 === 0;
    if (rk) { ctx.beginPath(); ctx.arc(S.x + 30, 760, 14, 0, TAU); ctx.fillStyle = C.acc; ctx.fill(); }
    text(ctx, 'REC  00:00:0' + Math.floor((u - 76) / 2), S.x + 60, 772, MONO(34), C.ink);
  }
}
// S12 attention (80..84): an eye tracks an endless feed, then shuts
function sAttention(ctx, u) {
  const lines = ['BUILT BY COMPANIES', 'CHASING YOUR', 'ATTENTION.'];
  const size = fitGroup(ctx, lines, 130);
  lines.forEach((l, i) => rise(ctx, l, X0, headTop + size * (0.6 + i * 0.95), size, i === 2 ? C.acc : C.ink, u, 79.75 + i * 0.3));
  // feed cards scrolling behind
  const top = 760, bot = 1300, speed = 260 * (u - 80) ** 1.6;
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip();
  for (let i = 0; i < 40; i++) {
    const y = top + i * 150 - speed;
    if (y < top - 150 || y > bot) continue;
    rrect(ctx, S.x + 470, y, S.w - 470, 120, 14); ctx.fillStyle = '#17171A'; ctx.fill();
    ctx.fillStyle = C.line; ctx.fillRect(S.x + 490, y + 30, 200, 16); ctx.fillRect(S.x + 490, y + 64, 280, 12);
  }
  ctx.restore();
  // the eye
  const ex = S.x + 220, ey = 1030, ew = 200, eh = 110;
  const shut = E.inCubic(prog(u, 83.2, 83.6));
  const open = springU(u, 79.8, SPRING.snappy) * (1 - shut);
  ctx.save(); ctx.translate(ex, ey);
  ctx.beginPath();
  ctx.moveTo(-ew, 0); ctx.quadraticCurveTo(0, -eh * 2 * open, ew, 0); ctx.quadraticCurveTo(0, eh * 2 * open, -ew, 0); ctx.closePath();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke();
  ctx.save(); ctx.clip();
  const px = 60 + 30 * Math.sin(u * 5), py = -20 + 50 * Math.sin(u * 3.1);
  ctx.beginPath(); ctx.arc(px, py, 70, 0, TAU); ctx.fillStyle = C.acc; ctx.fill();
  ctx.beginPath(); ctx.arc(px, py, 30, 0, TAU); ctx.fillStyle = C.bg; ctx.fill();
  ctx.restore();
  ctx.restore();
}
// S13 verdict (84..92)
function sVerdict(ctx, u) {
  const size = fitGroup(ctx, ['VERDICT?'], 260);
  typed(ctx, 'SO, THE', X0, S.y + 110, 64, C.ink, u, 83.75, 84.1, { cursor: false });
  slam(ctx, 'VERDICT?', X0, S.y + 150 + size, size, C.ink, u, 83.85, { stagger: 0.04, from: 120 });
}
// S14 blindly / either (92..100)
function sBalance(ctx, u) {
  const mid = H * 0.5;
  const lA = ["DON'T TRUST IT", 'BLINDLY.'], lB = ["DON'T FEAR IT", 'EITHER.'];
  const size = fitGroup(ctx, [...lA, ...lB], 150);
  const kA = springU(u, 91.75, SPRING.snappy), kB = springU(u, 95.75, SPRING.snappy);
  const rk = E.outExpo(prog(u, 92, 93));
  ctx.fillStyle = C.dim; ctx.fillRect(W / 2 - (W / 2) * rk, mid, W * rk, 3);
  ctx.save(); ctx.translate(-(1 - kA) * W, 0);
  text(ctx, 'NO.', X0, mid - size * 2.2 - 30, MONO(40), C.acc);
  lA.forEach((l, i) => text(ctx, l, X0, mid - 60 - size * 0.95 * (1 - i), D(size), i === 1 ? C.ink : C.ink, 'left', -0.035 * size));
  ctx.restore();
  if (u >= 95.75) {
    ctx.save(); ctx.translate((1 - kB) * W, 0);
    text(ctx, 'ALSO NO.', X0, mid + 90, MONO(40), C.acc);
    lB.forEach((l, i) => text(ctx, l, X0, mid + 110 + size * (1 + 0.95 * i), D(size), C.ink, 'left', -0.035 * size));
    ctx.restore();
  }
}
// S15 intern (100..108)
function sIntern(ctx, u) {
  label(ctx, 'THE MOVE', u, 100);
  const lines = ['TREAT IT LIKE A', 'BRILLIANT INTERN.'];
  const size = fitGroup(ctx, lines, 140);
  lines.forEach((l, i) => rise(ctx, l, X0, headTop + size * (1 + i * 0.95), size, i === 1 ? C.acc : C.ink, u, 99.8 + i * 0.35));
  const items = [[102, 'fast'], [103.5, 'tireless'], [105, 'YOU check its work']];
  items.forEach(([u0, s], i) => {
    const y = 1000 + i * 170;
    const k = springU(u, u0 - 1, SPRING.snappy);
    if (k <= 0) return;
    ctx.save(); ctx.translate((1 - k) * 200, 0); ctx.globalAlpha = clamp(k * 2);
    const last = i === 2;
    ctx.strokeStyle = last ? C.acc : C.ink; ctx.lineWidth = 6;
    ctx.strokeRect(X0, y - 56, 66, 66);
    const ck = E.outCubic(prog(u, u0, u0 + 0.35));
    if (ck > 0) {
      ctx.strokeStyle = C.acc; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X0 + 12, y - 24);
      const p1 = clamp(ck / 0.4), p2 = clamp((ck - 0.4) / 0.6);
      ctx.lineTo(X0 + 12 + 18 * p1, y - 24 + 20 * p1);
      if (p2 > 0) ctx.lineTo(X0 + 30 + 34 * p2, y - 4 - 50 * p2);
      ctx.stroke(); ctx.lineCap = 'butt';
    }
    text(ctx, s, X0 + 110, y, last ? D(72) : MONO(64), last ? C.acc : C.ink, 'left', last ? -2 : 0);
    ctx.restore();
  });
}
// S16 ask (108..116): the questions, typed as a prompt; the cursor grows into the end card
function sAsk(ctx, u) {
  const size = fitGroup(ctx, ['ASK:'], 300);
  slam(ctx, 'ASK:', X0, S.y + 200 + size, size, C.ink, u, 108 - 0.25, { from: 100 });
  const y1 = S.y + 200 + size + 220;
  typed(ctx, '> who built it?', X0, y1, 66, C.ink, u, 109, 110.2, { cursorUntil: 111.6 });
  typed(ctx, '> what happens', X0, y1 + 130, 66, C.ink, u, 112, 113.2, { cursorUntil: 113.3 });
  const w = typed(ctx, "  when it's wrong?", X0, y1 + 220, 66, C.ink, u, 113.2, 114.8, { cursor: false });
  // the cursor that becomes the end card
  if (u >= 114.8) {
    const g = E.inExpo(prog(u, 115.2, 116));
    const cx0 = X0 + w + 4, cy0 = y1 + 220 - 66 * 0.8, cw = 66 * 0.55, ch = 66 * 0.95;
    const x = lerp(cx0, 0, g), y = lerp(cy0, 0, g), ww = lerp(cw, W, g), hh = lerp(ch, H, g);
    if (g > 0 || Math.floor(u * 2) % 2 === 0) { ctx.fillStyle = C.acc; ctx.fillRect(x, y, ww, hh); }
  }
}
// S17 end card (116..120)
function sEnd(ctx, u) {
  fill(ctx, C.acc);
  const size = fitGroup(ctx, ['TRUST.', 'VERIFY.'], 330);
  const y0 = S.y + 120 + size;
  slam(ctx, 'TRUST.', X0, y0, size, C.bg, u, 116 - 0.2, { from: 220 });
  typed(ctx, 'BUT', X0 + 4, y0 + 120, 72, C.bg, u, 117, 117.3, { cursor: false });
  slam(ctx, 'VERIFY.', X0, y0 + 130 + size * 0.9, size, C.bg, u, 117.5 - 0.15, { from: 220 });
  const mk = springU(u, 118, SPRING.bouncy);
  drawMeter(ctx, 540, 1420, 120, 0.04 * Math.sin(u * 2.2), mk, { ink: C.bg, acc: C.bg, dim: '#7A8F2A', bg: C.acc }, false);
}

const SCENES = [
  [0, 8, sHook], [8, 16, sEveryday], [16, 24, sDrop], [24, 32, sFor], [32, 40, sHealth], [40, 48, sMoney],
  [48, 52, sAlways], [52, 60, sAgainst], [60, 68, sMadeUp], [68, 72, sBias], [72, 80, sFakes], [80, 84, sAttention],
  [84, 92, sVerdict], [92, 100, sBalance], [100, 108, sIntern], [108, 116, sAsk], [116, 999, sEnd],
];
const SHAKES = [[0, 18], [16, 34], [52, 46], [66.5, 22], [84, 30], [116, 30]];

// ---------------------------------------------------------------- post: glitch, grain, vignette
const GL = [[52, 1.0, 0.9], [53, 0.4, 0.4], [54.5, 0.35, 0.4], [60, 0.25, 0.3], [66.5, 0.5, 0.4], [72, 0.3, 0.3], [74, 0.3, 0.3], [76, 0.55, 0.5], [83.5, 0.4, 0.4]];
function glitchAmt(u) {
  let g = 0;
  for (const [u0, a, d] of GL) if (u >= u0) g += a * Math.exp(-(u - u0) / d) * (u - u0 < d * 4 ? 1 : 0);
  return g;
}
let NOISE = null;
function makeNoise() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); const im = x.createImageData(256, 256); const r = mulberry32(99);
  for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}

M.film({
  fonts: [D(100), MONO(40)],
  hits: HITS,
  samples: 12,
  init() { NOISE = makeNoise(); },
  draw(ctx, u) {
    fill(ctx, C.bg);
    ctx.save();
    for (const [u0, a] of SHAKES) shake(ctx, u, u0, a);
    const sc = SCENES.find(([a, b]) => u >= a && u < b) || SCENES[0];
    sc[2](ctx, u);
    const [cx, cy, R] = meterGeom(u);
    drawMeter(ctx, cx, cy, R, needle(u), meterVis(u));
    ctx.restore();
  },
  post(ctx, u, t) {
    const g = glitchAmt(u);
    if (g > 0.03) {
      const fr = Math.floor(t * 30);
      const n = 10 + Math.floor(hash01(fr, 3) * 10);
      for (let i = 0; i < n; i++) {
        if (hash01(fr * 31 + i, 5) > 0.55 + 0.4 * (1 - Math.min(1, g))) continue;
        const y = Math.floor(hash01(fr * 17 + i, 8) * H), h = 8 + Math.floor(hash01(fr * 13 + i, 9) * 90);
        const dx = (hash01(fr * 7 + i, 10) - 0.5) * 220 * g;
        ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
        if (hash01(fr * 5 + i, 12) > 0.8) { ctx.globalAlpha = 0.5 * Math.min(1, g); ctx.fillStyle = C.acc; ctx.fillRect(0, y, W, 3); ctx.globalAlpha = 1; }
      }
    }
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // grain
    if (NOISE) {
      const fr = Math.floor(t * 24);
      ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
      const ox = Math.floor(hash01(fr, 21) * 256), oy = Math.floor(hash01(fr, 22) * 256);
      ctx.fillStyle = ctx.createPattern(NOISE, 'repeat');
      ctx.translate(-ox, -oy); ctx.fillRect(0, 0, W + 256, H + 256); ctx.translate(ox, oy);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  },
});

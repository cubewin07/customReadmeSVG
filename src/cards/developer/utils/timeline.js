/**
 * Master Timeline (36s) Animation Utilities for SMIL
 * Pure SVG vector animation helpers without JavaScript or external dependencies.
 *
 * Loop schedule:
 *   0.0 -  3.4  INTRO   arcade boot / player-one scoreboard
 *   3.4 - 15.4  ACT 1   SHIP    (desk + hologram)
 *  15.4 - 21.4  ACT 2   RUN     (contribution platformer)
 *  21.4 - 27.4  ACT 3   BUILD   (voxel city)
 *  27.4 - 32.8  ACT 4   ORBIT   (language universe)
 *  32.8 - 36.0  OUTRO   continue? countdown + sign-off
 */

export const T = 36.0;
export const W = 1150;
export const H = 370;
export const SW = 584;
export const SH = 366;
export const SX = 566;
export const SY = 4;

/** Master-timeline start of each segment (seconds). */
export const ACT = {
  intro: 0,
  ship: 3.4,
  run: 15.4,
  build: 21.4,
  orbit: 27.4,
  outro: 32.8,
};

/**
 * Render-time offset (seconds) added to every keyframe time produced by norm().
 * Legacy acts are authored in act-local time (0..24); wrapping their render in
 * withShift(ACT.ship, ...) places them on the master timeline without rewriting
 * every keyframe. Rendering is synchronous, so a module-level value is safe.
 */
let SHIFT = 0;

export function withShift(seconds, fn) {
  const prev = SHIFT;
  SHIFT = seconds;
  try {
    return fn();
  } finally {
    SHIFT = prev;
  }
}

/** Fraction (0..1) of the master timeline for an act-local time under the current shift. */
export function frac(t) {
  return Math.min(1, Math.max(0, (t + SHIFT) / T));
}

/**
 * Normalizes an array of [time, ...values] pairs so that:
 * 0. Every time is offset by the active render shift (see withShift).
 * 1. It is sorted chronologically.
 * 2. It begins at t = 0 (cloned from first keyframe if needed).
 * 3. It terminates at t = T (cloned from last keyframe if needed).
 * 4. Duplicate timestamps within 1e-6 are merged.
 */
export function norm(pairs) {
  const shifted = SHIFT === 0 ? pairs : pairs.map((p) => [Math.min(T, p[0] + SHIFT), ...p.slice(1)]);
  const sorted = [...shifted].sort((a, b) => a[0] - b[0]);
  let list = sorted;
  if (list.length === 0) return [[0, 0], [T, 0]];
  if (list[0][0] > 0) {
    list = [[0, ...list[0].slice(1)], ...list];
  }
  if (list[list.length - 1][0] < T) {
    list = [...list, [T, ...list[list.length - 1].slice(1)]];
  }
  const dedup = [];
  for (const p of list) {
    if (dedup.length && Math.abs(dedup[dedup.length - 1][0] - p[0]) < 1e-5) {
      dedup[dedup.length - 1] = p;
    } else {
      dedup.push(p);
    }
  }
  if (dedup.length <= 2) return dedup;
  const sig = (p) => p.slice(1).map(fmt).join(',');
  const out = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i++) {
    if (sig(out[out.length - 1]) === sig(dedup[i]) && sig(dedup[i]) === sig(dedup[i + 1])) {
      continue;
    }
    out.push(dedup[i]);
  }
  out.push(dedup[dedup.length - 1]);
  return out;
}

/**
 * Formats numbers compactly for SVG attributes.
 */
export function fmt(v) {
  if (typeof v === 'number') {
    const s = v.toFixed(2);
    return s.replace(/\.?0+$/, '');
  }
  return String(v);
}

/**
 * Formats keyTimes string normalized to [0, 1].
 */
export function kt(ps) {
  return ps.map(p => {
    const s = (p[0] / T).toFixed(3).replace(/\.?0+$/, '');
    return s === '' ? '0' : s;
  }).join(';');
}

/**
 * Generates an SVG SMIL <animate> tag on the 24s master timeline.
 */
export function anim(attr, pairs) {
  const ps = norm(pairs);
  const values = ps.map(p => fmt(p[1])).join(';');
  return `<animate attributeName="${attr}" dur="${T}s" repeatCount="indefinite" keyTimes="${kt(ps)}" values="${values}"/>`;
}

/**
 * Generates an SVG SMIL <animateTransform type="translate"> tag on the 24s master timeline.
 */
export function tr(pairs) {
  const ps = norm(pairs);
  const values = ps.map(p => `${fmt(p[1])} ${fmt(p[2])}`).join(';');
  return `<animateTransform attributeName="transform" type="translate" dur="${T}s" repeatCount="indefinite" keyTimes="${kt(ps)}" values="${values}"/>`;
}

/**
 * Generates an SVG SMIL <animateTransform type="rotate"> tag on the 24s master timeline.
 */
export function rot(pairs, cx, cy, add = false) {
  const ps = norm(pairs);
  const a = add ? ' additive="sum"' : '';
  const values = ps.map(p => `${fmt(p[1])} ${cx} ${cy}`).join(';');
  return `<animateTransform attributeName="transform" type="rotate" dur="${T}s" repeatCount="indefinite" keyTimes="${kt(ps)}" values="${values}"${a}/>`;
}

/**
 * Generates an SVG SMIL <animateTransform type="scale"> tag on the 24s master timeline.
 */
export function sc(pairs) {
  const ps = norm(pairs);
  const values = ps.map(p => `${fmt(p[1])} ${fmt(p[2])}`).join(';');
  return `<animateTransform attributeName="transform" type="scale" dur="${T}s" repeatCount="indefinite" keyTimes="${kt(ps)}" values="${values}"/>`;
}

/**
 * Generates a short repeating sub-loop transform (e.g. idle typing, running leg cycles, flame flicker).
 */
export function sl(kind, vals, dur, begin = 0, add = false) {
  const a = add ? ' additive="sum"' : '';
  return `<animateTransform attributeName="transform" type="${kind}" values="${vals.join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"${a}/>`;
}

/**
 * Generates a short repeating sub-loop attribute animation (e.g. blinking, steam fade).
 */
export function sla(attr, vals, dur, begin = 0) {
  return `<animate attributeName="${attr}" values="${vals.join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;
}

/**
 * Opacity keyframe generator: element is visible strictly between timestamps a and b, with fade window f.
 */
export function pulse(a, b, f = 0.2) {
  return [[0, 0], [a, 0], [a + f, 1], [b, 1], [b + f, 0]];
}

/**
 * Opacity keyframes for slot `i` of `n` equal slots across the whole loop (cross-fading).
 * With n === 1 the element is always visible.
 */
export function rotate(n, i, f = 0.35) {
  if (n <= 1) return [[0, 1], [T, 1]];
  const slot = T / n;
  const a = i * slot;
  const b = (i + 1) * slot;
  const pairs = [[0, i === 0 ? 1 : 0]];
  if (i > 0) pairs.push([a, 0], [a + f, 1]);
  pairs.push([b - f, 1], [b, 0]);
  return pairs;
}

/**
 * Night-time opacity curve across 24s (active during dawn/night hours 18s-24s and 0s-3.6s).
 */
export const NIGHT = [
  [0, 1],
  [3.6, 0.5],
  [8.4, 0],
  [13.2, 0],
  [16.8, 0.5],
  [20.4, 1],
  [24, 1],
];

export function nightPairs(k = 1.0) {
  return NIGHT.map(([t, v]) => [t, parseFloat((v * k).toFixed(2))]);
}

/**
 * Generates points string for a 5-pointed star.
 */
export function star(cx, cy, r, ri = null) {
  const innerR = ri || r * 0.45;
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 === 0 ? r : innerR;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/**
 * Darkens or lightens a hex color by factor k (e.g. 0.6 for shadow face, 0.8 for mid face).
 */
export function shade(hex, k) {
  let h = (hex || '#4c8dff').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  const r2 = Math.min(255, Math.max(0, Math.floor(r * k)));
  const g2 = Math.min(255, Math.max(0, Math.floor(g * k)));
  const b2 = Math.min(255, Math.max(0, Math.floor(b * k)));
  return `#${r2.toString(16).padStart(2, '0')}${g2.toString(16).padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`;
}

/**
 * Renders a mechanical slot-machine rolling odometer digit counter for stats.
 */
export function rollCounter(x, y, val, color = '#e6edf3') {
  const str = String(val);
  const cid = `rc${x}_${y}`;
  let out = `<clipPath id="${cid}"><rect width="14" height="24"/></clipPath>`;
  for (let k = 0; k < str.length; k++) {
    const ch = str[k];
    const digit = parseInt(ch, 10);
    if (isNaN(digit)) {
      out += `<text class="t" x="${x + 13 * k + 6}" y="${y + 18}" text-anchor="middle" font-size="21" font-weight="800" fill="${color}">${ch}</text>`;
      continue;
    }
    const steps = 10 + digit;
    const tgt = steps * 24;
    let strip = '';
    for (let n = 0; n <= steps; n++) {
      strip += `<text x="7" y="${18 + n * 24}">${n % 10}</text>`;
    }
    out += `<g transform="translate(${x + 13 * k},${y})"><g clip-path="url(#${cid})"><g transform="translate(0, -${tgt})" class="t" text-anchor="middle" font-size="21" font-weight="800" fill="${color}"><animateTransform attributeName="transform" type="translate" dur="${T}s" repeatCount="indefinite" keyTimes="0;0.01;0.075;1" values="0 0;0 0;0 -${tgt};0 -${tgt}"/>${strip}</g></g></g>`;
  }
  return out;
}

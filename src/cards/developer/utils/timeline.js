/**
 * Master Timeline (24s) Animation Utilities for SMIL
 * Pure SVG vector animation helpers without JavaScript or external dependencies.
 */

export const T = 24.0;
export const W = 1150;
export const H = 370;
export const SW = 584;
export const SH = 366;
export const SX = 566;
export const SY = 4;

/**
 * Normalizes an array of [time, ...values] pairs so that:
 * 1. It is sorted chronologically.
 * 2. It begins at t = 0 (cloned from first keyframe if needed).
 * 3. It terminates at t = T (cloned from last keyframe if needed).
 * 4. Duplicate timestamps within 1e-6 are merged.
 */
export function norm(pairs) {
  const sorted = [...pairs].sort((a, b) => a[0] - b[0]);
  let list = sorted;
  if (list.length === 0) return [[0, 0], [T, 0]];
  if (list[0][0] > 0) {
    list = [[0, ...list[0].slice(1)], ...list];
  }
  if (list[list.length - 1][0] < T) {
    list = [...list, [T, ...list[list.length - 1].slice(1)]];
  }
  const out = [];
  for (const p of list) {
    if (out.length && Math.abs(out[out.length - 1][0] - p[0]) < 1e-5) {
      out[out.length - 1] = p;
    } else {
      out.push(p);
    }
  }
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
  return ps.map(p => (p[0] / T).toFixed(4)).join(';');
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
  let out = '';
  for (let k = 0; k < str.length; k++) {
    const ch = str[k];
    const digit = parseInt(ch, 10);
    if (isNaN(digit)) {
      out += `<text class="t" x="${x + 13 * k + 6}" y="${y + 18}" text-anchor="middle" font-size="21" font-weight="800" fill="${color}">${ch}</text>`;
      continue;
    }
    const tgt = (10 + digit) * 24;
    let strip = '';
    for (let n = 0; n < 20; n++) {
      strip += `<tspan x="6.5" dy="${n === 0 ? 0 : 24}">${n % 10}</tspan>`;
    }
    out += `<svg x="${x + 13 * k}" y="${y}" width="13" height="24" overflow="hidden">
      <g transform="translate(0, -${tgt})">
        <animateTransform attributeName="transform" type="translate" dur="${T}s" repeatCount="indefinite"
          keyTimes="0;0.0083;0.075;1" values="0 0;0 0;0 -${tgt};0 -${tgt}" calcMode="spline" keySplines="0 0 1 1;0.16 0.8 0.3 1;0 0 1 1"/>
        <text class="t" y="18" text-anchor="middle" font-size="21" font-weight="800" fill="${color}">${strip}</text>
      </g>
    </svg>`;
  }
  return out;
}

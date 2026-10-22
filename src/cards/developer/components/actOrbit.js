import { escapeXml } from '../../../svg/escape.js';
import { anim, tr, sc, sl, pulse, shade } from '../utils/timeline.js';
import { orbitChips } from '../utils/insights.js';
import { BRAND_COLORS } from './sharedDefs.js';

const DEFAULT_MOONS = [
  { name: 'JavaScript', color: '#f7df1e', pct: 68 },
  { name: 'TypeScript', color: '#3178c6', pct: 18 },
  { name: 'Python', color: '#4584b6', pct: 9 },
  { name: 'HTML', color: '#e34c26', pct: 5 },
];

/**
 * Renders Act 4: Polyglot Language Universe (27.4s - 32.8s master / 0.0s - 5.4s local).
 * - Central fusion reactor displaying dominant language share & polyglot telemetry.
 * - 3-4 glowing elliptical orbital tracks with orbiting language moons and upright labels.
 * - Bottom insight chips derived from real GitHub data (Top Language, Best Streak, Peak Day).
 */
export function renderActOrbit(profile = {}, theme = {}) {
  const accent = theme.accent || '#58a6ff';
  const isFallback = profile.source === 'fallback';

  let moons = [];
  if (Array.isArray(profile.langShares) && profile.langShares.length > 0) {
    moons = profile.langShares.slice(0, 4);
  } else if (Array.isArray(profile.tech) && profile.tech.length > 0) {
    moons = profile.tech.slice(0, 4).map((tname) => ({
      name: tname,
      color: BRAND_COLORS[String(tname).toLowerCase()] || accent,
      pct: null,
    }));
  } else if (!isFallback) {
    moons = DEFAULT_MOONS;
  }

  const CX = 292;
  const CY = 180;
  const orbits = [
    { rx: 112, ry: 38, r: 10, a0: -0.4, a1: 2.1 },
    { rx: 156, ry: 54, r: 9, a0: 2.4, a1: 4.9 },
    { rx: 198, ry: 70, r: 8, a0: -2.2, a1: 0.4 },
    { rx: 236, ry: 84, r: 7.5, a0: 0.7, a1: 3.2 },
  ];

  let ringsSvg = '';
  let moonsSvg = '';

  for (let i = 0; i < moons.length; i++) {
    const m = moons[i];
    const orb = orbits[i];
    const col = m.color || accent;
    const pts = [];
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const t = parseFloat(((s / steps) * 5.4).toFixed(2));
      const ang = orb.a0 + (orb.a1 - orb.a0) * (s / steps);
      const x = Math.round(CX + orb.rx * Math.cos(ang));
      const y = Math.round(CY + orb.ry * Math.sin(ang));
      pts.push([t, x, y]);
    }

    ringsSvg += `<ellipse cx="${CX}" cy="${CY}" rx="${orb.rx}" ry="${orb.ry}" fill="none" stroke="${col}" stroke-width="1" stroke-opacity="0.28" stroke-dasharray="4 6"/>`;

    const label = m.pct !== null && m.pct !== undefined
      ? `${escapeXml(m.name)} ${m.pct}%`
      : escapeXml(m.name);
    const pillW = Math.max(68, label.length * 6.5 + 16);

    moonsSvg += `<g>${tr(pts)}<circle r="${orb.r + 5}" fill="${col}" opacity="0.2"/><circle r="${orb.r}" fill="${col}" stroke="#fff" stroke-width="0.8" stroke-opacity="0.6"/><path d="M-${(orb.r * 0.6).toFixed(1)} -${(orb.r * 0.4).toFixed(1)} A${orb.r} ${orb.r} 0 0 1 ${(orb.r * 0.6).toFixed(1)} -${(orb.r * 0.4).toFixed(1)}" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.55"/><ellipse rx="${orb.r + 4}" ry="${(orb.r * 0.42).toFixed(1)}" fill="none" stroke="${shade(col, 1.15)}" stroke-width="1" opacity="0.7" transform="rotate(-18)"/><g transform="translate(0,${-(orb.r + 13)})"><rect x="${-Math.round(pillW / 2)}" y="-9" width="${Math.round(pillW)}" height="16" rx="8" fill="#09101b" fill-opacity="0.9" stroke="${col}" stroke-width="0.9"/><text class="m" x="0" y="2.5" text-anchor="middle" font-size="9.5" font-weight="700" fill="#e6edf3">${label}</text></g></g>`;
  }

  const top = moons[0];
  const coreHeadline = top
    ? (top.pct != null ? `${top.pct}%` : escapeXml(top.name.slice(0, 4).toUpperCase()))
    : '0L';
  const coreSub = top ? escapeXml(top.name.toUpperCase()) : 'OFFLINE';

  const chips = orbitChips(profile);
  let chipsSvg = '';
  if (chips.length > 0) {
    const chipW = 166;
    const gap = 12;
    const totalW = chips.length * chipW + (chips.length - 1) * gap;
    const startX = Math.round((584 - totalW) / 2);
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      const x = startX + i * (chipW + gap);
      chipsSvg += `<g transform="translate(${x},316)"><rect width="${chipW}" height="32" rx="8" fill="#090f1a" fill-opacity="0.9" stroke="#1f2d42"/><circle cx="13" cy="16" r="3.5" fill="${c.color || accent}"/><text class="m" x="23" y="13" font-size="8" font-weight="700" letter-spacing="0.8" fill="#7d8590">${escapeXml(c.label)}</text><text class="t" x="23" y="25" font-size="11" font-weight="800" fill="#e6edf3">${escapeXml(c.value)}</text></g>`;
    }
  }

  return `<!-- ============================= ACT 4: LANGUAGE UNIVERSE (27.4s - 32.8s) ============================= -->
  <g opacity="0">
    ${anim('opacity', pulse(0.0, 5.15, 0.25))}
    <circle cx="${CX}" cy="${CY}" r="145" fill="url(#glowGrad)"/>
    ${ringsSvg}
    <g transform="translate(${CX},${CY})">
      ${sc([[0, 0.7, 0.7], [0.4, 1, 1], [5.1, 1, 1], [5.4, 0.85, 0.85]])}
      <circle r="44" fill="url(#antiGravCore)"/>
      <circle r="34" fill="#09111e" stroke="${top?.color || accent}" stroke-width="1.8"/>
      <g>${sl('rotate', ['0', '360'], 9)}<circle r="28" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="6 5" opacity="0.75"/></g>
      <text class="t" x="0" y="1" text-anchor="middle" font-size="15" font-weight="800" fill="#e6edf3">${coreHeadline}</text>
      <text class="m" x="0" y="13" text-anchor="middle" font-size="7.5" font-weight="700" letter-spacing="0.7" fill="#38bdf8">${coreSub}</text>
    </g>
    ${moonsSvg}
    ${chipsSvg}
  </g>`;
}

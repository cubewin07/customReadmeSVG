import { escapeXml } from '../../../svg/escape.js';
import { measureText, fitText, wrapText } from '../../../svg/text.js';
import { shareStrip } from '../../../svg/kit.js';
import { rollCounter, anim, rotate, sla, ACT, T } from '../utils/timeline.js';
import { rankMessages, statusMessages, fmtInt } from '../utils/insights.js';
import { BRAND_COLORS } from './sharedDefs.js';

/**
 * Renders the left-hand identity and information panel (0 <= x <= 562).
 *
 * Flat and ruled like the other cards, so the animated scene stays the loudest thing on the card:
 *  - Name "types" in with a blinking terminal cursor at the start of every loop.
 *  - Status + rank lines rotate through REAL facts (member tenure, latest ship, peak day, weekday rhythm...).
 *  - Language shares are a strip of cells, keyed with each language's real byte-share.
 *  - Stats count up in stepped frames (final value is the static resting state).
 *  - Telemetry line tracks all six segments of the loop (boot, ship, run, build, orbit, continue).
 */
export function renderInfoPanel(data, theme) {
  const accent = theme.accent || '#58a6ff';
  const subtext = theme.secondaryText || '#8b949e';
  const rule = theme.subtleBorder || theme.border || '#232a35';
  const text = theme.text || '#c9d1d9';
  const left = 32;
  const right = 540;

  const rawName = data.name || 'Le Tan Thang';
  const nameFit = fitText(rawName, 34, 480);
  const name = escapeXml(nameFit);
  const nameW = Math.min(500, Math.ceil(measureText(nameFit, 34) * 1.12) + 6);
  const caretX = left + Math.min(500, Math.ceil(measureText(nameFit, 34) * 0.98) + 8);

  const rawHandle = data.handle || '@cubewin07';
  const handleW = Math.round(measureText(rawHandle, 15) * 1.08);
  const rawRole = data.role || 'Full-Stack Engineer & Creative Coder';
  const role = escapeXml(fitText(rawRole, 15, Math.max(120, right - left - handleW - 24)));
  const handle = escapeXml(fitText(rawHandle, 15, 300));

  const joinedYear = data.joinedYear || (data.createdAt ? new Date(data.createdAt).getFullYear() : 2024);
  const customStatus = data.customStatus
    ? data.customStatus.replace(/^:[a-z0-9_+-]+:\s*/, '')
    : null;

  // Focus lines (split or fallback, safely fitted to avoid scene overlap)
  let focus1 = 'Crafting interactive web apps & reactive UI systems';
  let focus2 = 'with dynamic, game-inspired SVG animation engines.';
  if (Array.isArray(data.focus) && data.focus.length > 0) {
    if (data.focus.length === 1 || !data.focus[1]) {
      const wrapped = wrapText(data.focus[0], 14, 490, 2);
      focus1 = wrapped[0] || focus1;
      focus2 = wrapped[1] || '';
    } else {
      focus1 = data.focus[0] || focus1;
      focus2 = data.focus[1] || '';
    }
  } else if (typeof data.focus === 'string') {
    const wrapped = wrapText(data.focus, 14, 490, 2);
    focus1 = wrapped[0] || focus1;
    focus2 = wrapped[1] || '';
  }
  focus1 = fitText(focus1, 14, 490);
  if (focus2) focus2 = fitText(focus2, 14, 490);

  // Developer activity (honest metrics only)
  const isFallback = data.source === 'fallback';
  const annualCommitsVal = data.annualCommits || (data.counts ? data.counts.reduce((a, b) => a + (b || 0), 0) : 0);
  const commitSha = data.commitSha || '–';
  const langCount = Array.isArray(data.langShares) && data.langShares.length > 0
    ? data.langShares.length
    : (Array.isArray(data.tech) ? data.tech.length : 0);

  // ---------- Rotating status line ----------
  const dotColor = isFallback ? (theme.negative || '#f85149') : accent;
  const statusMsgs = statusMessages({ ...data, source: data.source }, customStatus, joinedYear);
  const statusSvg = statusMsgs.map((m, i) => {
    const labelSpan = `<tspan fill="${subtext}">${escapeXml(m.label || '')}</tspan>`;
    const valueSpan = `<tspan fill="${text}" font-weight="700">${escapeXml(m.value || '')}</tspan>`;
    // value-first messages (label starts with a space, e.g. "702 DAYS ON GITHUB") put the value before the label
    const inner = m.plain !== undefined
      ? escapeXml(fitText(m.plain, 11, 220))
      : (m.label && m.label.startsWith(' ') ? valueSpan + labelSpan : labelSpan + valueSpan);
    return `<text class="m" x="${left + 16}" y="116" font-size="11" letter-spacing="0.5" fill="${text}" opacity="${i === 0 ? 1 : 0}">${statusMsgs.length > 1 ? anim('opacity', rotate(statusMsgs.length, i)) : ''}${inner}</text>`;
  }).join('');

  // ---------- Rotating rank line ----------
  const rankMsgs = rankMessages({ ...data, annualCommits: annualCommitsVal });
  const rankSvg = rankMsgs.map((msg, i) =>
    `<text class="m" x="${right}" y="116" text-anchor="end" font-size="11" letter-spacing="0.5" font-weight="700" fill="${text}" opacity="${i === 0 ? 1 : 0}">${rankMsgs.length > 1 ? anim('opacity', rotate(rankMsgs.length, i)) : ''}${escapeXml(msg)}</text>`
  ).join('');

  // ---------- Languages: real byte-shares as cells, other tech keyed beside them ----------
  const techList = Array.isArray(data.tech) && data.tech.length > 0
    ? data.tech
    : (isFallback ? ['Offline'] : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js']);
  const shares = Array.isArray(data.langShares) ? data.langShares : [];
  const shareByName = new Map(shares.map((s) => [s.name, s]));

  const strip = shares.length
    ? shareStrip({
        x: left,
        y: 232,
        width: right - left,
        size: 8,
        items: shares.map((s) => ({ color: s.color, percentage: s.pct })),
        theme,
        className: 'language-strip',
      })
    : '';

  const keyRows = shares.length ? [254, 274] : [240, 260];
  let techKey = '';
  let cx = left;
  let rowIndex = 0;
  for (const tname of techList) {
    const share = shareByName.get(tname);
    const label = share ? `${tname} ${share.pct}%` : tname;
    const w = Math.round(measureText(label, 11.5) * 1.08) + 13;
    if (cx + w > right) {
      rowIndex += 1;
      cx = left;
      if (rowIndex >= keyRows.length) break;
    }
    const y = keyRows[rowIndex];
    const color = share?.color || BRAND_COLORS[tname.toLowerCase()] || accent;
    techKey += `
      <rect x="${cx}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${color}"/>
      <text class="t" x="${cx + 13}" y="${y}" font-size="11.5" fill="${text}">${escapeXml(tname)}${share ? `<tspan fill="${subtext}"> ${share.pct}%</tspan>` : ''}</text>`;
    cx += w + 14;
  }

  // ---------- Stats ----------
  const statsList = Array.isArray(data.stats) && data.stats.length === 3
    ? data.stats
    : [
        { label: 'REPOSITORIES', value: data.stats?.repos ?? 0 },
        { label: 'TOTAL STARS', value: data.stats?.stars ?? 0 },
        { label: 'FOLLOWERS', value: data.stats?.followers ?? 0 },
      ];

  const cells = [left, left + 172, left + 344];
  let statsMarkup = '';
  for (let k = 0; k < 3; k++) {
    const { label, value } = statsList[k];
    const x = cells[k];
    statsMarkup += `
      <text class="t" x="${x}" y="312" font-size="11" fill="${subtext}">${escapeXml(String(label).charAt(0) + String(label).slice(1).toLowerCase())}</text>
      ${rollCounter(x, 317, value, text)}`;
  }

  // ---------- Six-segment telemetry line ----------
  const seg = (a, b, first = false, last = false) => {
    const pairs = [[0, first ? 1 : 0]];
    if (!first) pairs.push([a - 0.01, 0], [a + 0.15, 1]);
    pairs.push([b - 0.2, 1], [b, last ? 1 : 0]);
    return anim('opacity', pairs);
  };
  const telemetry = [
    { a: 0, b: ACT.ship, col: '#f59e0b', first: true, body: `<tspan fill="#f59e0b" font-weight="700">STATUS // BOOTING</tspan> • PLAYER 1` },
    { a: ACT.ship, b: ACT.run, col: accent, body: `<tspan fill="${accent}" font-weight="700">STATUS // SHIPPING</tspan> • main@${escapeXml(commitSha)}` },
    { a: ACT.run, b: ACT.build, col: '#3fb950', body: `<tspan fill="#3fb950" font-weight="700">STATUS // RUNNING</tspan> • ${fmtInt(data.streak || 0)}D STREAK` },
    { a: ACT.build, b: ACT.orbit, col: '#a78bfa', body: `<tspan fill="#a78bfa" font-weight="700">STATUS // BUILDING</tspan> • ${annualCommitsVal} COMMITS` },
    { a: ACT.orbit, b: ACT.outro, col: '#38bdf8', body: `<tspan fill="#38bdf8" font-weight="700">STATUS // ORBITING</tspan> • ${langCount} LANGUAGES` },
    { a: ACT.outro, b: T, col: '#ff7b72', last: true, body: `<tspan fill="#ff7b72" font-weight="700">STATUS // CONTINUE?</tspan> • PRESS START` },
  ].map((s) => `
      <g opacity="${s.first ? 1 : 0}">
        ${seg(s.a, s.b, s.first, s.last)}
        <text class="m" x="${right - left}" y="0" text-anchor="end" font-size="10.5" fill="${subtext}">${s.body}</text>
      </g>`).join('');

  return `<!-- ============================= LEFT PANEL ============================= -->
  <clipPath id="nameClip"><rect x="30" y="20" width="0" height="48">${anim('width', [[0, 0], [0.35, 0], [1.55, nameW], [T, nameW]])}</rect></clipPath>

  <!-- Name types in with a terminal cursor -->
  <text class="t" x="${left}" y="58" font-size="34" font-weight="700" letter-spacing="-0.3" fill="${text}" clip-path="url(#nameClip)">${name}</text>
  <rect x="${caretX}" y="30" width="3" height="32" rx="1" fill="${accent}">
    ${anim('x', [[0, left], [0.35, left], [1.55, caretX], [T, caretX]])}
    ${sla('opacity', ['1', '1', '0', '0'], 1.0)}
  </rect>

  <!-- Handle & Role Subtitle -->
  <text class="t" x="${left}" y="84" font-size="15" fill="${subtext}">
    <tspan fill="${text}" font-weight="600">${handle}</tspan>
    <tspan fill="${subtext}"> · ${role}</tspan>
  </text>

  <!-- Status & Rank Row: both lines rotate real facts -->
  <rect x="${left}" y="107.5" width="9" height="9" rx="2" fill="${dotColor}">${sla('opacity', ['1', '0.45', '1'], 2)}</rect>
  ${statusSvg}
  ${rankSvg}
  <line x1="${left}" y1="130" x2="${right}" y2="130" stroke="${rule}"/>

  <!-- Focus -->
  <text class="t" x="${left}" y="150" font-size="11" fill="${subtext}">Focus</text>
  <g class="left-act-telemetry" transform="translate(${left}, 150)">${telemetry}</g>
  <text class="t" x="${left}" y="171" font-size="14" fill="${text}">${escapeXml(focus1)}</text>
  ${focus2 ? `<text class="t" x="${left}" y="191" font-size="14" fill="${text}">${escapeXml(focus2)}</text>` : ''}
  <line x1="${left}" y1="204" x2="${right}" y2="204" stroke="${rule}"/>

  <!-- Languages -->
  <text class="t" x="${left}" y="223" font-size="11" fill="${subtext}">${shares.length ? 'Languages by code volume' : 'Tech'}</text>
  ${strip}
  ${techKey}
  <line x1="${left}" y1="290" x2="${right}" y2="290" stroke="${rule}"/>

  <!-- Stats -->
  ${statsMarkup}`;
}

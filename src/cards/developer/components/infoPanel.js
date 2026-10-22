import { escapeXml } from '../../../svg/escape.js';
import { measureText, fitText } from '../../../svg/text.js';
import { rollCounter, star, anim, pulse, rotate, sla, ACT, T } from '../utils/timeline.js';
import { rankMessages, statusMessages, fmtInt } from '../utils/insights.js';
import { BRAND_COLORS } from './sharedDefs.js';

/**
 * Renders the left-hand identity and information panel (0 <= x <= 562).
 *
 * Redesign highlights (36s master loop):
 *  - Name "types" in with a blinking terminal cursor at the start of every loop.
 *  - Status + rank pills rotate through REAL facts (member tenure, latest ship, peak day, weekday rhythm...).
 *  - Tech arsenal pills carry real language byte-shares and get a periodic glint sweep.
 *  - Stats count up in stepped frames (final value is the static resting state).
 *  - Telemetry strip tracks all six segments of the loop (boot, ship, run, build, orbit, continue).
 */
export function renderInfoPanel(data, theme, sceneAccent = null) {
  const accent = sceneAccent || theme.accent || '#58a6ff';
  const subtext = theme.subtext || '#8b949e';
  const cardBg = theme.cardBg || '#161b22';
  const border = theme.border || '#232a35';
  const text = theme.text || '#c9d1d9';
  const title = theme.title || '#e6edf3';
  const isLight = theme.cardBg === '#ffffff' || (theme.bg && theme.bg.toLowerCase().includes('fff'));
  const badgeBg = theme.badgeBg || (isLight ? '#f2f4f8' : '#1c222c');
  const badgeBorder = theme.badgeBorder || (isLight ? '#e1e4e8' : '#2b3340');

  const rawName = data.name || 'Le Tan Thang';
  const nameFit = fitText(rawName, 34, 500);
  const name = escapeXml(nameFit);
  const nameW = Math.min(500, Math.ceil(measureText(nameFit, 34) * 1.12) + 6);
  const handle = escapeXml(data.handle || '@cubewin07');
  const role = escapeXml(data.role || 'Full-Stack Engineer & Creative Coder');
  const joinedYear = data.joinedYear || (data.createdAt ? new Date(data.createdAt).getFullYear() : 2024);
  const customStatus = data.customStatus
    ? data.customStatus.replace(/^:[a-z0-9_+-]+:\s*/, '')
    : null;

  // Focus lines (split or fallback)
  let focus1 = 'Crafting interactive web apps & reactive UI systems';
  let focus2 = 'with dynamic, game-inspired SVG animation engines.';
  if (Array.isArray(data.focus) && data.focus.length > 0) {
    focus1 = data.focus[0] || focus1;
    focus2 = data.focus[1] || '';
  } else if (typeof data.focus === 'string') {
    const parts = data.focus.split('.');
    focus1 = parts[0] ? parts[0] + '.' : focus1;
    focus2 = parts.slice(1).join('.').trim();
  }

  // Developer activity (honest metrics only)
  const isFallback = data.source === 'fallback';
  const annualCommitsVal = data.annualCommits || (data.counts ? data.counts.reduce((a, b) => a + (b || 0), 0) : 0);
  const totalStarsVal = data.stats?.[1]?.value ?? data.stats?.stars ?? 0;
  const commitSha = data.commitSha || '–';
  const langCount = Array.isArray(data.langShares) && data.langShares.length > 0
    ? data.langShares.length
    : (Array.isArray(data.tech) ? data.tech.length : 0);

  // ---------- Rotating status pill ----------
  const dotColor = isFallback ? '#f85149' : '#3fb950';
  const statusFill = isLight ? (isFallback ? '#cf222e' : '#0969da') : (isFallback ? '#ff7b72' : '#dbe6f5');
  const statusMsgs = statusMessages({ ...data, source: data.source }, customStatus, joinedYear);
  const statusSvg = statusMsgs.map((m, i) => {
    const labelSpan = `<tspan fill="${subtext}" font-weight="700">${escapeXml(m.label || '')}</tspan>`;
    const valueSpan = `<tspan fill="${accent}" font-weight="800">${escapeXml(m.value || '')}</tspan>`;
    // value-first messages (label starts with a space, e.g. "702 DAYS ON GITHUB") put the value before the label
    const inner = m.plain !== undefined
      ? escapeXml(m.plain)
      : (m.label && m.label.startsWith(' ') ? valueSpan + labelSpan : labelSpan + valueSpan);
    return `<text class="t" x="62" y="119" font-size="11.5" font-weight="800" letter-spacing="0.8" fill="${statusFill}" opacity="${i === 0 ? 1 : 0}">${statusMsgs.length > 1 ? anim('opacity', rotate(statusMsgs.length, i)) : ''}${inner}</text>`;
  }).join('');

  // ---------- Rotating rank pill ----------
  const rankMsgs = rankMessages({ ...data, annualCommits: annualCommitsVal });
  const rankSvg = rankMsgs.map((msg, i) =>
    `<text class="t" x="32" y="18" font-size="11.5" font-weight="800" letter-spacing="0.8" fill="${title}" opacity="${i === 0 ? 1 : 0}">${rankMsgs.length > 1 ? anim('opacity', rotate(rankMsgs.length, i)) : ''}${escapeXml(msg)}</text>`
  ).join('');

  // ---------- Tech arsenal (real byte-shares when available) ----------
  const techList = Array.isArray(data.tech) && data.tech.length > 0
    ? data.tech
    : (isFallback ? ['Offline'] : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js']);
  const shareByName = new Map((data.langShares || []).map((s) => [s.name, s]));

  let techPills = '';
  const isMultiRow = techList.length > 4;
  const row1 = isMultiRow ? techList.slice(0, Math.ceil(techList.length / 2)) : techList;
  const row2 = isMultiRow ? techList.slice(Math.ceil(techList.length / 2)) : [];

  const rows = [
    { items: row1, cy: isMultiRow ? 236 : 246, h: isMultiRow ? 21 : 25 },
    { items: row2, cy: 261, h: 21 },
  ];

  for (const { items, cy, h } of rows) {
    if (!items || items.length === 0) continue;
    let cx = 48;
    for (const tname of items) {
      const share = shareByName.get(tname);
      const brandCol = share?.color || BRAND_COLORS[tname.toLowerCase()] || accent;
      const pctLabel = share ? ` ${share.pct}%` : '';
      const w = Math.round(measureText(tname + pctLabel, 11) * 1.12 + 30);
      if (cx + w > 526) break; // Hard safety boundary: never exceed card width

      techPills += `
        <g>
          <rect x="${cx}" y="${cy}" width="${w}" height="${h}" rx="6" fill="${badgeBg}" stroke="${badgeBorder}"/>
          <line x1="${cx + 3}" y1="${cy + 1}" x2="${cx + w - 3}" y2="${cy + 1}" stroke="#fff" stroke-opacity="0.12"/>
          <circle cx="${cx + 9}" cy="${cy + h / 2}" r="2.8" fill="${brandCol}"/>
          <text class="t" x="${cx + 17}" y="${cy + h / 2 + 4}" font-size="11" font-weight="600" fill="${text}">${escapeXml(tname)}${share ? `<tspan fill="${subtext}" font-weight="700" dx="4">${share.pct}%</tspan>` : ''}</text>
        </g>`;
      cx += w + 8;
    }
  }

  // ---------- Stats ----------
  const statsList = Array.isArray(data.stats) && data.stats.length === 3
    ? data.stats
    : [
        { label: 'REPOSITORIES', value: data.stats?.repos ?? 0 },
        { label: 'TOTAL STARS', value: data.stats?.stars ?? 0 },
        { label: 'FOLLOWERS', value: data.stats?.followers ?? 0 },
      ];

  const cells = [52, 222, 392];
  const starPath = star(0, 0, 9);

  let statsMarkup = '';
  for (let k = 0; k < 3; k++) {
    const { label, value } = statsList[k];
    const x = cells[k];
    let iconSvg;

    if (k === 0) {
      iconSvg = `
        <rect x="${x}" y="304" width="13" height="17" rx="2" fill="none" stroke="${accent}" stroke-width="2"/>
        <line x1="${x + 3}" y1="312" x2="${x + 10}" y2="312" stroke="${accent}" stroke-width="2"/>`;
    } else if (k === 1) {
      iconSvg = `<polygon points="${starPath}" fill="#e3b341" transform="translate(${x + 9},313)"/>`;
    } else {
      iconSvg = `
        <circle cx="${x + 8}" cy="309" r="4" fill="none" stroke="#3fb950" stroke-width="2"/>
        <path d="M${x} 322 a8 8 0 0 1 16 0" fill="none" stroke="#3fb950" stroke-width="2"/>`;
    }

    statsMarkup += `
      <rect x="${x - 10}" y="300" width="154" height="52" rx="7" fill="${isLight ? '#f6f8fa' : '#11151b'}" stroke="${border}" stroke-opacity="0.35"/>
      <line x1="${x - 9}" y1="301" x2="${x + 143}" y2="301" stroke="#fff" stroke-opacity="0.08"/>
      ${iconSvg}
      <text class="t" x="${x + 26}" y="314" font-size="10.5" font-weight="700" letter-spacing="1" fill="${subtext}">${label}</text>
      ${rollCounter(x + 26, 319, value, title)}`;
  }

  // ---------- Six-segment telemetry strip ----------
  const seg = (a, b, first = false, last = false) => {
    const pairs = [[0, first ? 1 : 0]];
    if (!first) pairs.push([a - 0.01, 0], [a + 0.15, 1]);
    pairs.push([b - 0.2, 1], [b, last ? 1 : 0]);
    return anim('opacity', pairs);
  };
  const telemetry = [
    { a: 0, b: ACT.ship, col: '#f59e0b', first: true, body: `<tspan fill="#f59e0b" font-weight="700">STATUS // BOOTING</tspan> • PLAYER 1` },
    { a: ACT.ship, b: ACT.run, col: accent, body: `<tspan fill="${accent}" font-weight="700">STATUS // SHIPPING</tspan> • main@<tspan fill="${accent}">${escapeXml(commitSha)}</tspan>` },
    { a: ACT.run, b: ACT.build, col: '#3fb950', body: `<tspan fill="#3fb950" font-weight="700">STATUS // RUNNING</tspan> • <tspan fill="${title}">${fmtInt(data.streak || 0)}D STREAK</tspan>` },
    { a: ACT.build, b: ACT.orbit, col: '#a78bfa', body: `<tspan fill="#a78bfa" font-weight="700">STATUS // BUILDING</tspan> • <tspan fill="${title}">${annualCommitsVal} COMMITS</tspan>` },
    { a: ACT.orbit, b: ACT.outro, col: '#38bdf8', body: `<tspan fill="#38bdf8" font-weight="700">STATUS // ORBITING</tspan> • <tspan fill="${title}">${langCount} LANGUAGES</tspan>` },
    { a: ACT.outro, b: T, col: '#ff7b72', last: true, body: `<tspan fill="#ff7b72" font-weight="700">STATUS // CONTINUE?</tspan> • <tspan fill="${title}">PRESS START</tspan>` },
  ].map((s) => `
      <g opacity="${s.first ? 1 : 0}">
        ${seg(s.a, s.b, s.first, s.last)}
        <circle cx="10" cy="10" r="2.5" fill="${s.col}"/>
        <text class="m" x="18" y="14" font-size="10.5" font-weight="600" fill="${subtext}">${s.body}</text>
      </g>`).join('');

  // Glint sweeps across the tech arsenal card (twice per loop)
  const glintPairs = [[0, -90], [9, -90], [10.6, 560], [10.61, -90], [29.4, -90], [31, 560], [31.01, -90]];

  return `<!-- ============================= LEFT PANEL ============================= -->
  <clipPath id="nameClip"><rect x="30" y="20" width="0" height="48">${anim('width', [[0, 0], [0.35, 0], [1.55, nameW], [T, nameW]])}</rect></clipPath>
  <clipPath id="arsClip"><rect x="32" y="214" width="508" height="72" rx="10"/></clipPath>

  <!-- Name types in with a terminal cursor -->
  <text class="t" x="32" y="58" font-size="34" font-weight="800" letter-spacing="-0.3" fill="url(#nameGrad)" clip-path="url(#nameClip)">${name}</text>
  <rect x="${32 + nameW}" y="30" width="3" height="32" rx="1" fill="${accent}">
    ${anim('x', [[0, 32], [0.35, 32], [1.55, 32 + nameW], [T, 32 + nameW]])}
    ${sla('opacity', ['1', '1', '0', '0'], 1.0)}
  </rect>

  <!-- Handle & Role Subtitle -->
  <text class="t" x="32" y="86" font-size="16">
    <tspan fill="${accent}" font-weight="600">${handle}</tspan>
    <tspan fill="${subtext}"> • ${role}</tspan>
  </text>

  <!-- Status & Rank Row (y=100): both pills rotate real facts -->
  <g>
    <rect x="32" y="100" width="248" height="28" rx="14" fill="${isLight ? '#ebf3ff' : '#0f1f38'}" stroke="${isLight ? '#b8d5ff' : '#1f3b66'}"/>
    <circle cx="48" cy="114" r="4.5" fill="${dotColor}"/>
    <circle cx="48" cy="114" r="4.5" fill="none" stroke="${dotColor}" stroke-width="1.5" opacity="0.6">
      <animate attributeName="r" values="4.5;13" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="48" cy="114" r="4.5" fill="none" stroke="${dotColor}" stroke-width="1" opacity="0.4">
      <animate attributeName="r" values="4.5;18" dur="2s" begin="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0" dur="2s" begin="0.6s" repeatCount="indefinite"/>
    </circle>
    ${statusSvg}

    <g transform="translate(290, 100)">
      <rect x="0" y="0" width="250" height="28" rx="14" fill="${isLight ? '#f6f8fa' : '#111724'}" stroke="${isLight ? '#d0d7de' : '#232f42'}"/>
      <rect x="1" y="1" width="248" height="26" rx="13" fill="url(#rankBadgeGrad)"/>
      <polygon points="17,6 25,10 25,19 17,23 9,19 9,10" fill="${accent}" opacity="0.25"/>
      <polygon points="17,8 23,11 23,18 17,21 11,18 11,11" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <text class="m" x="17" y="17.5" text-anchor="middle" font-size="7.5" font-weight="900" fill="#fff">★</text>
      ${rankSvg}
      <circle cx="236" cy="14" r="2.5" fill="#3fb950">${sla('opacity', ['1', '0.3', '1'], 1.6)}</circle>
    </g>
  </g>

  <!-- Core Focus Card -->
  <g>
    <rect x="32" y="136" width="508" height="68" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="137" x2="539" y2="137" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    <rect x="32" y="136" width="5" height="68" rx="2.5" fill="${accent}"/>
    <text class="t" x="52" y="156" font-size="13" font-weight="700" letter-spacing="1.4" fill="${accent}">CORE FOCUS</text>

    <!-- Synchronized Act Telemetry HUD Pill (Top-Right) -->
    <g class="left-act-telemetry" transform="translate(294, 142)">
      <rect x="0" y="0" width="236" height="20" rx="10" fill="${isLight ? '#eaeef2' : '#141c28'}" stroke="${border}" stroke-width="0.8"/>
      ${telemetry}
    </g>

    <text class="t" x="52" y="176" font-size="14.5" fill="${text}">${escapeXml(focus1)}</text>
    ${focus2 ? `<text class="t" x="52" y="196" font-size="14.5" fill="${text}">${escapeXml(focus2)}</text>` : ''}
  </g>

  <!-- Tech Arsenal Card -->
  <g>
    <rect x="32" y="214" width="508" height="72" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="215" x2="539" y2="215" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    <text class="t" x="48" y="233" font-size="13" font-weight="700" letter-spacing="1.4" fill="${subtext}">${Array.isArray(data.langShares) && data.langShares.length ? 'TECH ARSENAL · BY CODE VOLUME' : 'TECH ARSENAL'}</text>
    ${techPills}
    <g clip-path="url(#arsClip)">
      <rect x="-90" y="214" width="56" height="72" fill="url(#shimGrad)" fill-opacity="0.22" transform="skewX(-18)">
        ${anim('x', glintPairs)}
      </rect>
    </g>
  </g>

  <!-- Stats Card -->
  <g>
    <rect x="32" y="295" width="508" height="63" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="296" x2="539" y2="296" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    ${statsMarkup}
  </g>

  <!-- Vertical Divider Between Left & Right Columns -->
  <line x1="562" y1="22" x2="562" y2="348" stroke="${border}" stroke-dasharray="3 5" opacity="0.6"/>`;
}

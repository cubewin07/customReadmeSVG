import { escapeXml } from '../../../svg/escape.js';
import { rollCounter, star } from '../utils/timeline.js';
import { BRAND_COLORS } from './sharedDefs.js';

/**
 * Renders the left-hand identity and information panel (0 <= x <= 562).
 * Features glassmorphic bevel lines, branded tech badges, multi-ring radar status,
 * and tactile inset stat wells with mechanical rolling odometer counters.
 */
export function renderInfoPanel(data, theme) {
  const accent = theme.accent || '#58a6ff';
  const subtext = theme.subtext || '#8b949e';
  const cardBg = theme.cardBg || '#161b22';
  const border = theme.border || '#232a35';
  const text = theme.text || '#c9d1d9';
  const title = theme.title || '#e6edf3';
  const isLight = theme.cardBg === '#ffffff' || (theme.bg && theme.bg.toLowerCase().includes('fff'));
  const badgeBg = theme.badgeBg || (isLight ? '#f2f4f8' : '#1c222c');
  const badgeBorder = theme.badgeBorder || (isLight ? '#e1e4e8' : '#2b3340');

  const name = escapeXml(data.name || 'Le Tan Thang');
  const handle = escapeXml(data.handle || '@cubewin07');
  const role = escapeXml(data.role || 'Full-Stack Engineer & Creative Coder');
  const status = escapeXml(data.status || 'Building cool things 🚀');

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

  // Developer Activity Badge (honest metric)
  const annualCommitsVal = data.annualCommits || (data.counts ? data.counts.reduce((a, b) => a + (b || 0), 0) : 0);
  const totalStarsVal = data.stats?.[1]?.value ?? data.stats?.stars ?? 64;
  const devBadgeText = annualCommitsVal > 0 ? `${annualCommitsVal.toLocaleString()} COMMITS / YR` : `${totalStarsVal} TOTAL STARS`;

  // Deterministic commit SHA
  const commitSha = data.commitSha || 'ea77b7c';

  // Tech tags with branded glowing indicator dots
  const techList = Array.isArray(data.tech) && data.tech.length > 0
    ? data.tech
    : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js'];

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
      const brandCol = BRAND_COLORS[tname.toLowerCase()] || accent;
      const w = Math.round(tname.length * 6.8 + 24);
      if (cx + w > 526) break; // Hard safety boundary: never exceed card width

      techPills += `
        <g>
          <rect x="${cx}" y="${cy}" width="${w}" height="${h}" rx="6" fill="${badgeBg}" stroke="${badgeBorder}"/>
          <!-- Top Glass Bevel -->
          <line x1="${cx + 3}" y1="${cy + 1}" x2="${cx + w - 3}" y2="${cy + 1}" stroke="#fff" stroke-opacity="0.12"/>
          <!-- Brand Indicator Dot with Glow -->
          <circle cx="${cx + 9}" cy="${cy + h / 2}" r="2.8" fill="${brandCol}"/>
          <circle cx="${cx + 9}" cy="${cy + h / 2}" r="2.8" fill="${brandCol}" opacity="0.35"/>
          <text class="t" x="${cx + 17}" y="${cy + h / 2 + 4}" font-size="11" font-weight="600" fill="${text}">${escapeXml(tname)}</text>
        </g>`;
      cx += w + 8;
    }
  }

  // Stats setup
  const statsList = Array.isArray(data.stats) && data.stats.length === 3
    ? data.stats
    : [
        { label: 'REPOSITORIES', value: data.stats?.repos ?? 28 },
        { label: 'TOTAL STARS', value: data.stats?.stars ?? 64 },
        { label: 'FOLLOWERS', value: data.stats?.followers ?? 42 },
      ];

  const cells = [52, 222, 392];
  const starPath = star(0, 0, 9);

  let statsMarkup = '';
  for (let k = 0; k < 3; k++) {
    const { label, value } = statsList[k];
    const x = cells[k];
    let iconSvg;

    if (k === 0) {
      // Repos Folder Icon
      iconSvg = `
        <rect x="${x}" y="304" width="13" height="17" rx="2" fill="none" stroke="${accent}" stroke-width="2"/>
        <line x1="${x + 3}" y1="312" x2="${x + 10}" y2="312" stroke="${accent}" stroke-width="2"/>`;
    } else if (k === 1) {
      // Star Icon
      iconSvg = `<polygon points="${starPath}" fill="#e3b341" transform="translate(${x + 9},313)"/>`;
    } else {
      // Followers Icon
      iconSvg = `
        <circle cx="${x + 8}" cy="309" r="4" fill="none" stroke="#3fb950" stroke-width="2"/>
        <path d="M${x} 322 a8 8 0 0 1 16 0" fill="none" stroke="#3fb950" stroke-width="2"/>`;
    }

    statsMarkup += `
      <!-- Inset Well Background -->
      <rect x="${x - 10}" y="300" width="154" height="52" rx="7" fill="${isLight ? '#f6f8fa' : '#11151b'}" stroke="${border}" stroke-opacity="0.35"/>
      <line x1="${x - 9}" y1="301" x2="${x + 143}" y2="301" stroke="#fff" stroke-opacity="0.08"/>
      ${iconSvg}
      <text class="t" x="${x + 26}" y="314" font-size="10.5" font-weight="700" letter-spacing="1" fill="${subtext}">${label}</text>
      ${rollCounter(x + 26, 319, value, title)}`;
  }

  return `<!-- ============================= LEFT PANEL ============================= -->
  <!-- Name Header with Theme Gradient -->
  <text class="t" x="32" y="58" font-size="34" font-weight="800" letter-spacing="-0.3" fill="url(#nameGrad)">${name}</text>

  <!-- Handle & Role Subtitle -->
  <text class="t" x="32" y="86" font-size="16">
    <tspan fill="${accent}" font-weight="600">${handle}</tspan>
    <tspan fill="${subtext}"> • ${role}</tspan>
  </text>

  <!-- Status & Rank Row (y=100) -->
  <g>
    <!-- Pulsating Radar Status Pill -->
    <rect x="32" y="100" width="248" height="28" rx="14" fill="${isLight ? '#ebf3ff' : '#0f1f38'}" stroke="${isLight ? '#b8d5ff' : '#1f3b66'}"/>
    <!-- Radar Waves -->
    <circle cx="48" cy="114" r="4.5" fill="#3fb950"/>
    <circle cx="48" cy="114" r="4.5" fill="none" stroke="#3fb950" stroke-width="1.5" opacity="0.6">
      <animate attributeName="r" values="4.5;13" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="48" cy="114" r="4.5" fill="none" stroke="#3fb950" stroke-width="1" opacity="0.4">
      <animate attributeName="r" values="4.5;18" dur="2s" begin="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0" dur="2s" begin="0.6s" repeatCount="indefinite"/>
    </circle>
    <text class="t" x="62" y="119" font-size="12" font-weight="700" fill="${isLight ? '#0969da' : '#dbe6f5'}">${status}</text>

    <!-- Developer Rank & Tier Badge -->
    <g transform="translate(290, 100)">
      <rect x="0" y="0" width="250" height="28" rx="14" fill="${isLight ? '#f6f8fa' : '#111724'}" stroke="${isLight ? '#d0d7de' : '#232f42'}"/>
      <!-- Inner Glowing Tint -->
      <rect x="1" y="1" width="248" height="26" rx="13" fill="url(#rankBadgeGrad)"/>
      <!-- Level Icon Shield -->
      <polygon points="17,6 25,10 25,19 17,23 9,19 9,10" fill="${accent}" opacity="0.25"/>
      <polygon points="17,8 23,11 23,18 17,21 11,18 11,11" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <text class="m" x="17" y="17.5" text-anchor="middle" font-size="7.5" font-weight="900" fill="#fff">★</text>
      <!-- Rank Label -->
      <text class="t" x="32" y="18" font-size="11.5" font-weight="800" letter-spacing="0.8" fill="${title}">${devBadgeText}</text>
      <circle cx="236" cy="14" r="2.5" fill="#3fb950"/>
    </g>
  </g>

  <!-- Core Focus Card with Glassmorphic Highlight Line -->
  <g>
    <rect x="32" y="136" width="508" height="68" rx="10" fill="${cardBg}" stroke="${border}"/>
    <!-- Inner Top Glass Specular Line -->
    <line x1="33" y1="137" x2="539" y2="137" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    <!-- Left Accent Pill -->
    <rect x="32" y="136" width="5" height="68" rx="2.5" fill="${accent}"/>
    <text class="t" x="52" y="156" font-size="11" font-weight="700" letter-spacing="1.4" fill="${accent}">CORE FOCUS</text>
    
    <!-- Git Branch & SHA Badge (Top-Right) -->
    <g transform="translate(398, 142)">
      <rect x="0" y="0" width="132" height="20" rx="10" fill="${isLight ? '#eaeef2' : '#141c28'}" stroke="${border}" stroke-width="0.8"/>
      <!-- Git Branch Icon -->
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="20" cy="6.5" r="2.2" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <path d="M12 10 v-4 M12 8 a2 2 0 0 1 2 -2 h4" fill="none" stroke="${accent}" stroke-width="1.2"/>
      <text class="m" x="28" y="14" font-size="10.5" font-weight="600" fill="${subtext}">main@<tspan fill="${accent}">${commitSha}</tspan></text>
    </g>

    <text class="t" x="52" y="176" font-size="13.5" fill="${text}">${escapeXml(focus1)}</text>
    ${focus2 ? `<text class="t" x="52" y="194" font-size="13.5" fill="${text}">${escapeXml(focus2)}</text>` : ''}
  </g>

  <!-- Tech Arsenal Card with Glassmorphic Specular Line -->
  <g>
    <rect x="32" y="214" width="508" height="72" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="215" x2="539" y2="215" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    <text class="t" x="48" y="232" font-size="11" font-weight="700" letter-spacing="1.4" fill="${subtext}">TECH ARSENAL</text>
    ${techPills}
  </g>

  <!-- Stats Card with Inset Wells and Mechanical Rolling Counters -->
  <g>
    <rect x="32" y="295" width="508" height="63" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="296" x2="539" y2="296" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    ${statsMarkup}
  </g>

  <!-- Vertical Divider Between Left & Right Columns -->
  <line x1="562" y1="22" x2="562" y2="348" stroke="${border}" stroke-dasharray="3 5" opacity="0.6"/>`;
}

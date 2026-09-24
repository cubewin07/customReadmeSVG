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

  // Tech tags with branded glowing indicator dots
  const techList = Array.isArray(data.tech) && data.tech.length > 0
    ? data.tech
    : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js'];

  let techPills = '';
  let cx = 48;
  for (const tname of techList) {
    const brandCol = BRAND_COLORS[tname.toLowerCase()] || accent;
    const w = Math.round(tname.length * 7.4 + 28);
    techPills += `
      <g>
        <rect x="${cx}" y="246" width="${w}" height="26" rx="7" fill="${badgeBg}" stroke="${badgeBorder}"/>
        <!-- Top Glass Bevel -->
        <line x1="${cx + 4}" y1="247" x2="${cx + w - 4}" y2="247" stroke="#fff" stroke-opacity="0.12"/>
        <!-- Brand Indicator Dot with Glow -->
        <circle cx="${cx + 10}" cy="259" r="3.2" fill="${brandCol}"/>
        <circle cx="${cx + 10}" cy="259" r="3.2" fill="${brandCol}" opacity="0.35"/>
        <text class="t" x="${cx + 18}" y="263.5" font-size="12" font-weight="600" fill="${text}">${escapeXml(tname)}</text>
      </g>`;
    cx += w + 8;
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

  <!-- Pulsating Radar Status Pill -->
  <g>
    <rect x="32" y="100" width="254" height="28" rx="14" fill="${isLight ? '#ebf3ff' : '#0f1f38'}" stroke="${isLight ? '#b8d5ff' : '#1f3b66'}"/>
    <!-- Radar Waves -->
    <circle cx="50" cy="114" r="5" fill="#3fb950"/>
    <circle cx="50" cy="114" r="5" fill="none" stroke="#3fb950" stroke-width="1.5" opacity="0.6">
      <animate attributeName="r" values="5;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="50" cy="114" r="5" fill="none" stroke="#3fb950" stroke-width="1" opacity="0.4">
      <animate attributeName="r" values="5;19" dur="2s" begin="0.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0" dur="2s" begin="0.6s" repeatCount="indefinite"/>
    </circle>
    <text class="t" x="65" y="119" font-size="12.5" font-weight="700" fill="${isLight ? '#0969da' : '#dbe6f5'}">${status}</text>
  </g>

  <!-- Core Focus Card with Glassmorphic Highlight Line -->
  <g>
    <rect x="32" y="140" width="508" height="68" rx="10" fill="${cardBg}" stroke="${border}"/>
    <!-- Inner Top Glass Specular Line -->
    <line x1="33" y1="141" x2="539" y2="141" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    <!-- Left Accent Pill -->
    <rect x="32" y="140" width="5" height="68" rx="2.5" fill="${accent}"/>
    <text class="t" x="52" y="161" font-size="11" font-weight="700" letter-spacing="1.4" fill="${accent}">CORE FOCUS</text>
    <text class="t" x="52" y="181" font-size="13.5" fill="${text}">${escapeXml(focus1)}</text>
    ${focus2 ? `<text class="t" x="52" y="199" font-size="13.5" fill="${text}">${escapeXml(focus2)}</text>` : ''}
  </g>

  <!-- Tech Arsenal Card with Glassmorphic Specular Line -->
  <g>
    <rect x="32" y="218" width="508" height="66" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="219" x2="539" y2="219" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    <text class="t" x="48" y="238" font-size="11" font-weight="700" letter-spacing="1.4" fill="${subtext}">TECH ARSENAL</text>
    ${techPills}
  </g>

  <!-- Stats Card with Inset Wells and Mechanical Rolling Counters -->
  <g>
    <rect x="32" y="294" width="508" height="64" rx="10" fill="${cardBg}" stroke="${border}"/>
    <line x1="33" y1="295" x2="539" y2="295" stroke="#fff" stroke-opacity="0.12" stroke-linecap="round"/>
    ${statsMarkup}
  </g>

  <!-- Vertical Divider Between Left & Right Columns -->
  <line x1="562" y1="22" x2="562" y2="348" stroke="${border}" stroke-dasharray="3 5" opacity="0.6"/>`;
}

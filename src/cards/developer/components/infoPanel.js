import { escapeXml } from '../../../svg/escape.js';
import { rollCounter, star } from '../utils/timeline.js';

/**
 * Renders the left-hand identity and information panel (0 <= x <= 562).
 * Includes author header, live status pulse, Core Focus, Tech Arsenal,
 * and rolling mechanical slot-machine counters for verified metrics.
 */
export function renderInfoPanel(data, theme) {
  const accent = theme.accent || '#58a6ff';
  const subtext = theme.subtext || '#8b949e';
  const cardBg = theme.cardBg || '#161b22';
  const border = theme.border || '#232a35';
  const text = theme.text || '#c9d1d9';
  const title = theme.title || '#e6edf3';
  const badgeBg = theme.badgeBg || (theme.cardBg && theme.cardBg !== '#ffffff' ? '#1c2129' : '#f0f3f6');
  const badgeBorder = theme.badgeBorder || border;
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

  // Tech tags
  const techList = Array.isArray(data.tech) && data.tech.length > 0
    ? data.tech
    : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js'];

  let techPills = '';
  let cx = 48;
  for (const tname of techList) {
    const w = Math.round(tname.length * 7.2 + 20);
    techPills += `
      <rect x="${cx}" y="246" width="${w}" height="26" rx="7" fill="${badgeBg}" stroke="${badgeBorder}"/>
      <text class="t" x="${cx + w / 2}" y="263" text-anchor="middle" font-size="12.5" font-weight="600" fill="${text}">${escapeXml(tname)}</text>`;
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
      ${iconSvg}
      <text class="t" x="${x + 26}" y="314" font-size="11" font-weight="700" letter-spacing="1" fill="${subtext}">${label}</text>
      ${rollCounter(x + 26, 319, value, title)}`;
  }

  return `<!-- ============================= LEFT PANEL ============================= -->
  <!-- Name Header -->
  <text class="t" x="32" y="58" font-size="34" font-weight="800" letter-spacing="-0.3" fill="url(#nameGrad)">${name}</text>

  <!-- Handle & Role Subtitle -->
  <text class="t" x="32" y="86" font-size="16">
    <tspan fill="${accent}" font-weight="600">${handle}</tspan>
    <tspan fill="${subtext}"> • ${role}</tspan>
  </text>

  <!-- Pulsating Status Pill -->
  <rect x="32" y="100" width="254" height="28" rx="14" fill="#0f1f38" stroke="#1f3b66"/>
  <circle cx="50" cy="114" r="5" fill="#3fb950"/>
  <circle cx="50" cy="114" r="5" fill="#3fb950" opacity="0.5">
    <animate attributeName="r" values="5;11" dur="1.8s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.5;0" dur="1.8s" repeatCount="indefinite"/>
  </circle>
  <text class="t" x="64" y="119" font-size="13" font-weight="700" fill="#dbe6f5">${status}</text>

  <!-- Core Focus Card -->
  <rect x="32" y="140" width="508" height="68" rx="10" fill="${cardBg}" stroke="${border}"/>
  <rect x="32" y="140" width="5" height="68" rx="2.5" fill="${accent}"/>
  <text class="t" x="52" y="161" font-size="11" font-weight="700" letter-spacing="1.4" fill="${accent}">CORE FOCUS</text>
  <text class="t" x="52" y="181" font-size="14" fill="${text}">${escapeXml(focus1)}</text>
  ${focus2 ? `<text class="t" x="52" y="199" font-size="14" fill="${text}">${escapeXml(focus2)}</text>` : ''}

  <!-- Tech Arsenal Card -->
  <rect x="32" y="218" width="508" height="66" rx="10" fill="${cardBg}" stroke="${border}"/>
  <text class="t" x="48" y="238" font-size="11" font-weight="700" letter-spacing="1.4" fill="${subtext}">TECH ARSENAL</text>
  ${techPills}

  <!-- Stats Card with Mechanical Rolling Counters -->
  <rect x="32" y="294" width="508" height="64" rx="10" fill="${cardBg}" stroke="${border}"/>
  <line x1="210" y1="306" x2="210" y2="346" stroke="${border}"/>
  <line x1="380" y1="306" x2="380" y2="346" stroke="${border}"/>
  ${statsMarkup}

  <!-- Vertical Divider Between Left & Right Columns -->
  <line x1="562" y1="22" x2="562" y2="348" stroke="#2a313c" stroke-dasharray="3 5"/>`;
}

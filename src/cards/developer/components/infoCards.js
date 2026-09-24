import { escapeXml } from '../../../svg/escape.js';
import { icons } from '../../../svg/icons.js';

function splitTextIntoLines(str, maxCharsPerLine = 48) {
  if (!str) return [];
  const words = String(str).split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Info Cards Component
 * Renders the left-hand column:
 * 1. Prominent Header with Name, Handle, and pulsating Status pill
 * 2. Card 1: Role & Current Mission / Focus with multi-line auto-wrap
 * 3. Card 2: Tech Arsenal (interactive skill pills)
 * 4. Card 3: Live GitHub Milestones & Stats
 */
export function renderInfoCards(data, theme, options = {}) {
  const name = escapeXml(options.name || data?.name || 'Le Tan Thang');
  const login = escapeXml(data?.login || options.username || 'cubewin07');
  const handle = `@${login}`;
  const role = escapeXml(options.role || data?.role || 'Full-Stack Engineer & Creative Coder');
  const status = escapeXml(options.status || data?.status || 'Building cool things 🚀');
  const rawBio = options.bio || data?.bio || 'Crafting interactive web apps & reactive UI systems with dynamic, game-inspired SVG animation engines.';
  const bioLines = splitTextIntoLines(rawBio, 52);

  const skills = Array.isArray(data?.skills)
    ? data.skills
    : (options.skills ? options.skills.split(',').map(s => s.trim()) : ['React', 'TypeScript', 'Node.js', 'Python', 'Next.js', 'SVG / SMIL']);

  const repos = data?.repositories ?? data?.stats?.repos ?? 28;
  const stars = data?.totalStars ?? data?.stats?.stars ?? 64;
  const followers = data?.followers ?? data?.stats?.followers ?? 42;

  const accent = theme.accent || '#38bdf8';
  const titleColor = theme.title || '#58a6ff';
  const textColor = theme.text || '#c9d1d9';
  const secTextColor = theme.secondaryText || '#8b949e';
  const cardBg = theme.cardBg || '#161b22';
  const border = theme.subtleBorder || theme.border || '#30363d';

  return `
  <!-- ==================== LEFT COLUMN: ABOUT ME CARDS ==================== -->
  <g id="info-column" transform="translate(24, 18)">

    <!-- 1. Header Card: Name, Role, Pulsating Status -->
    <g id="card-header">
      <!-- Name with Accent Gradient -->
      <text x="0" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="url(#name-grad)" letter-spacing="-0.3px">${name}</text>
      
      <!-- Handle & Role Subtitle -->
      <text x="0" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="${titleColor}">${handle} <tspan font-weight="400" fill="${secTextColor}">•</tspan> <tspan font-weight="500" fill="${secTextColor}">${role}</tspan></text>

      <!-- Live Pulsating Status Pill -->
      <g transform="translate(0, 48)">
        <rect x="0" y="0" width="220" height="20" rx="10" fill="${theme.badgeBg || '#1f6feb26'}" stroke="${titleColor}" stroke-opacity="0.3" stroke-width="1" />
        <!-- Pulsing Green Radar Dot -->
        <circle cx="10" cy="10" r="3" fill="#10b981" />
        <circle cx="10" cy="10" r="5" fill="none" stroke="#10b981" stroke-width="1" opacity="0.7">
          <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="20" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="${textColor}">${status}</text>
      </g>
    </g>

    <!-- 2. Card: Current Mission / Focus Statement -->
    <g id="card-mission" transform="translate(0, 78)">
      <rect x="0" y="0" width="376" height="52" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1" />
      <!-- Left Accent Line -->
      <path d="M 0 6 Q 0 0 6 0 L 6 52 Q 0 52 0 46 Z" fill="${titleColor}" />
      
      <g transform="translate(14, 14)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="${titleColor}" letter-spacing="0.8px">CORE FOCUS</text>
        ${bioLines.slice(0, 2).map((line, idx) => `
          <text x="0" y="${15 + idx * 14}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="${textColor}">${escapeXml(line)}</text>
        `).join('')}
      </g>
    </g>

    <!-- 3. Card: Tech Arsenal Pills -->
    <g id="card-arsenal" transform="translate(0, 138)">
      <rect x="0" y="0" width="376" height="48" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1" />
      
      <g transform="translate(12, 14)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="${secTextColor}" letter-spacing="0.8px">TECH ARSENAL</text>
        
        <!-- Skill Pills Grid -->
        <g transform="translate(0, 8)">
          ${skills.slice(0, 6).map((skill, idx) => {
            const pillX = idx * 59;
            return `
            <g transform="translate(${pillX}, 0)">
              <rect x="0" y="0" width="55" height="18" rx="4" fill="${theme.bg}" stroke="${border}" stroke-width="0.9" />
              <text x="27.5" y="12.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="600" fill="${textColor}">${escapeXml(skill)}</text>
            </g>
            `;
          }).join('')}
        </g>
      </g>
    </g>

    <!-- 4. Card: GitHub Milestones & Stats Row -->
    <g id="card-stats" transform="translate(0, 194)">
      <rect x="0" y="0" width="376" height="52" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1" />
      
      <!-- 3 Stats Tiles Inside Card -->
      <g transform="translate(12, 12)">
        <!-- Stat 1: Repos -->
        <g transform="translate(0, 0)">
          <g transform="translate(0, 2)">${icons.repo(titleColor)}</g>
          <text x="18" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="${secTextColor}">REPOSITORIES</text>
          <text x="18" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="${textColor}">${Number(repos).toLocaleString()}</text>
        </g>

        <!-- Divider 1 -->
        <line x1="116" y1="2" x2="116" y2="28" stroke="${border}" stroke-width="1" />

        <!-- Stat 2: Total Stars -->
        <g transform="translate(128, 0)">
          <g transform="translate(0, 2)">${icons.star('#e3b341')}</g>
          <text x="18" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="${secTextColor}">TOTAL STARS</text>
          <text x="18" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="${textColor}">${Number(stars).toLocaleString()}</text>
        </g>

        <!-- Divider 2 -->
        <line x1="244" y1="2" x2="244" y2="28" stroke="${border}" stroke-width="1" />

        <!-- Stat 3: Community / Followers -->
        <g transform="translate(256, 0)">
          <g transform="translate(0, 2)">${icons.followers(accent)}</g>
          <text x="18" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="${secTextColor}">FOLLOWERS</text>
          <text x="18" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="${textColor}">${Number(followers).toLocaleString()}</text>
        </g>
      </g>
    </g>

  </g>
  `;
}

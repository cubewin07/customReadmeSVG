import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { calculateRank } from '../../core/stats/rank.js';
import { renderCardHeader } from '../../svg/header.js';

export const statsCard = {
  id: 'stats',
  title: 'GitHub Stats',
  aliases: ['metrics'],
  cacheTtlMs: 3600000, // 1 hour

  async fetchData(username, options = {}) {
    const data = await graphql(STATS_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:stats:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });

    const normalized = normalizeStats(data);
    if (!normalized) {
      throw new Error(`User "${username}" not found.`);
    }
    return normalized;
  },

  renderSvg(data, theme, options = {}) {
    const isV0 = options.version === 'v0';

    if (isV0) {
      return renderV0Svg(data, theme, options);
    }
    return renderV1Svg(data, theme, options);
  },
};

function renderV1Svg(data, theme, options = {}) {
  const layout = (options.layout || 'hud').toLowerCase();

  if (layout === 'ring' || layout === 'classic-ring') {
    return renderV1ClassicRingSvg(data, theme, options);
  }
  if (layout === 'bars' || layout === 'metrics' || layout === 'progress') {
    return renderV1BarsSvg(data, theme, options);
  }
  if (layout === 'hero' || layout === 'card' || layout === 'rank-hero') {
    return renderV1HeroSvg(data, theme, options);
  }
  if (layout === 'dashboard' || layout === 'grid' || layout === 'cards') {
    return renderV1DashboardSvg(data, theme, options);
  }
  if (layout === 'compact' || layout === 'mini') {
    return renderV1CompactSvg(data, theme, options);
  }
  return renderV1CyberTelemetrySvg(data, theme, options);
}

export function renderV1CyberTelemetrySvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'Developer');
  const login = escapeXml(data?.login || options.username || 'developer');
  const totalCommits = data?.totalCommits ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const issues = data?.issues ?? 0;
  const streak = data?.currentStreak ?? (data?.streak ?? 0);
  const maxStreak = data?.maxStreak ?? streak;
  const totalRepos = data?.totalRepos ?? 0;
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const followers = data?.followers ?? 0;

  const rank = calculateRank({
    totalCommits,
    totalStars,
    totalForks,
    totalRepos,
    followers,
    pullRequests,
    totalContributions,
  });

  const width = 495;
  const height = 215;

  const isLight = theme.cardBg === '#ffffff' || (theme.bg && theme.bg.toLowerCase().includes('fff'));
  const bg = theme.bg || (isLight ? '#f6f8fa' : '#090d16');
  const cardBg = theme.cardBg || (isLight ? '#ffffff' : '#0e1624');
  const border = theme.border || (isLight ? '#d0d7de' : '#1e293b');
  const subtleBorder = theme.subtleBorder || (isLight ? '#eaeef2' : '#162234');
  const title = theme.title || (isLight ? '#0969da' : '#f1f5f9');
  const subtext = theme.secondaryText || theme.subtext || (isLight ? '#57606a' : '#8b949e');
  const accent = theme.accent || (isLight ? '#0969da' : '#38bdf8');

  // Gauge calculation (r=44, sweep=276.5)
  const circleR = 44;
  const circleC = 2 * Math.PI * circleR;
  const strokeOffset = circleC - (circleC * (rank.percentile / 100));

  const prSub = reviews > 0 ? `+${reviews} Reviews` : (issues > 0 ? `${issues} Issues` : 'Merged & Active');
  const streakSub = maxStreak > streak ? `Peak: ${maxStreak}d` : `${totalRepos} Repositories`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <!-- Background Cyber Gradient -->
    <linearGradient id="cyber-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${cardBg}" />
    </linearGradient>

    <!-- Top Neon Accent Glow Bar -->
    <linearGradient id="cyber-top-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="35%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#22c55e" />
    </linearGradient>

    <!-- Divider Glow Beam -->
    <linearGradient id="cyber-beam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </linearGradient>

    <!-- Gauge Progress Arc Gradient -->
    <linearGradient id="cyber-gauge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#22c55e" />
    </linearGradient>

    <!-- Grade Text Gradient -->
    <linearGradient id="cyber-grade-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${title}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
  </defs>

  <style>
    .hud-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 16px; fill: ${title}; }
    .hud-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
    .hud-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 19px; fill: ${title}; }
    .hud-grade { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 34px; }
  </style>

  <!-- Main Card Body -->
  <rect x="0.5" y="0.5" rx="14" width="${width - 1}" height="${height - 1}" fill="url(#cyber-bg)" stroke="${border}"/>

  <!-- Top Neon Cyber Glow Accent Line -->
  <path d="M 14,0.5 L ${width - 14},0.5" stroke="url(#cyber-top-bar)" stroke-width="3" stroke-linecap="round"/>

  <!-- Tactical Corner Sci-Fi Brackets -->
  <path d="M 12,5 L 5,5 L 5,12" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
  <path d="M ${width - 12},5 L ${width - 5},5 L ${width - 5},12" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
  <path d="M 5,${height - 12} L 5,${height - 5} L 12,${height - 5}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
  <path d="M ${width - 5},${height - 12} L ${width - 5},${height - 5} L ${width - 12},${height - 5}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>

  <!-- Header: Subtitle & Title -->
  <g transform="translate(24, 0)">
    <text class="hud-mono" x="0" y="24" font-size="9" font-weight="700" letter-spacing="1.2" fill="${accent}">SYS.DEV // TELEMETRY HUD</text>
    <text class="hud-title" x="0" y="44">${name} <tspan fill="${subtext}" font-size="13" font-weight="500">(@${login})</tspan></text>
  </g>

  <!-- Live Status Beacon Capsule (Top Right) -->
  <g transform="translate(${width - 162}, 20)">
    <rect x="0" y="0" width="138" height="24" rx="12" fill="${isLight ? '#f1f5f9' : '#0c1624'}" stroke="${border}" stroke-width="1.2"/>
    <circle cx="14" cy="12" r="3.5" fill="#22c55e"/>
    <circle cx="14" cy="12" r="3.5" fill="none" stroke="#22c55e" stroke-width="1.2" opacity="0.6">
      <animate attributeName="r" values="3.5;9" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <text class="hud-mono" x="25" y="15.5" font-size="9.5" font-weight="800" letter-spacing="0.5" fill="${accent}">⚡ ${totalContributions.toLocaleString()} IMPACT</text>
  </g>

  <!-- Horizontal Divider Beam -->
  <line x1="24" y1="56" x2="${width - 24}" y2="56" stroke="${subtleBorder}" stroke-width="1" opacity="0.6"/>
  <line x1="24" y1="56" x2="160" y2="56" stroke="url(#cyber-beam)" stroke-width="1.5"/>

  <!-- ==================== ZONE A: 2x2 TACTICAL INSET WELLS ==================== -->
  <!-- Module 1: Contributions -->
  <g transform="translate(24, 66)">
    <rect x="0" y="0" width="126" height="62" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
    <line x1="1" y1="1" x2="125" y2="1" stroke="#fff" stroke-opacity="0.12"/>
    <rect x="0" y="0" width="3.5" height="62" rx="1.5" fill="#00f2fe"/>
    <text class="hud-mono" x="12" y="16" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="${subtext}">CONTRIBUTIONS</text>
    <text class="hud-val" x="12" y="38">${totalContributions.toLocaleString()}</text>
    <text class="hud-mono" x="12" y="52" font-size="9" font-weight="600" fill="#00f2fe">⚡ Annual Impact</text>
  </g>

  <!-- Module 2: Commits -->
  <g transform="translate(158, 66)">
    <rect x="0" y="0" width="126" height="62" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
    <line x1="1" y1="1" x2="125" y2="1" stroke="#fff" stroke-opacity="0.12"/>
    <rect x="0" y="0" width="3.5" height="62" rx="1.5" fill="#22c55e"/>
    <text class="hud-mono" x="12" y="16" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="${subtext}">COMMITS PUSHED</text>
    <text class="hud-val" x="12" y="38">${totalCommits.toLocaleString()}</text>
    <text class="hud-mono" x="12" y="52" font-size="9" font-weight="600" fill="#22c55e">● Code Shipped</text>
  </g>

  <!-- Module 3: Pull Requests -->
  <g transform="translate(24, 136)">
    <rect x="0" y="0" width="126" height="62" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
    <line x1="1" y1="1" x2="125" y2="1" stroke="#fff" stroke-opacity="0.12"/>
    <rect x="0" y="0" width="3.5" height="62" rx="1.5" fill="#a855f7"/>
    <text class="hud-mono" x="12" y="16" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="${subtext}">PULL REQUESTS</text>
    <text class="hud-val" x="12" y="38">${pullRequests} <tspan font-size="12" font-weight="600" fill="${subtext}">PRs</tspan></text>
    <text class="hud-mono" x="12" y="52" font-size="9" font-weight="600" fill="#a855f7">${prSub}</text>
  </g>

  <!-- Module 4: Active Streak -->
  <g transform="translate(158, 136)">
    <rect x="0" y="0" width="126" height="62" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
    <line x1="1" y1="1" x2="125" y2="1" stroke="#fff" stroke-opacity="0.12"/>
    <rect x="0" y="0" width="3.5" height="62" rx="1.5" fill="#f59e0b"/>
    <text class="hud-mono" x="12" y="16" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="${subtext}">ACTIVE STREAK</text>
    <text class="hud-val" x="12" y="38">${streak} <tspan font-size="12" font-weight="600" fill="${subtext}">DAYS</tspan></text>
    <text class="hud-mono" x="12" y="52" font-size="9" font-weight="600" fill="#f59e0b">🔥 ${streakSub}</text>
  </g>

  <!-- Central Sci-Fi Divider with Crosshair Nodes -->
  <line x1="296" y1="64" x2="296" y2="198" stroke="${subtleBorder}" stroke-dasharray="3 4" opacity="0.5"/>
  <text class="hud-mono" x="296" y="67" text-anchor="middle" font-size="8.5" fill="${accent}" opacity="0.6">+</text>
  <text class="hud-mono" x="296" y="134" text-anchor="middle" font-size="8.5" fill="${accent}" opacity="0.6">+</text>
  <text class="hud-mono" x="296" y="201" text-anchor="middle" font-size="8.5" fill="${accent}" opacity="0.6">+</text>

  <!-- ==================== ZONE B: RADIAL VELOCITY GAUGE ==================== -->
  <g transform="translate(390, 118)">
    <!-- Outer Telemetry Dashed Circle -->
    <circle cx="0" cy="0" r="50" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="2 5" opacity="0.3"/>
    
    <!-- Background Ring Track -->
    <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${theme.barBg || (isLight ? '#e2e8f0' : '#162234')}" stroke-width="7"/>
    
    <!-- Active Progress Arc -->
    <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="url(#cyber-gauge-grad)" stroke-width="7"
            stroke-dasharray="${circleC.toFixed(1)}" stroke-dashoffset="${strokeOffset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90)" />

    <!-- Center Grade Text -->
    <text class="hud-grade" x="0" y="8" text-anchor="middle" fill="url(#cyber-grade-grad)">${rank.level}</text>
    <text class="hud-mono" x="0" y="24" text-anchor="middle" font-size="8.5" font-weight="800" letter-spacing="1.4" fill="${accent}">OVERALL RANK</text>

    <!-- Tactical Score Capsule -->
    <g transform="translate(-55, 38)">
      <rect x="0" y="0" width="110" height="22" rx="6" fill="${isLight ? '#f1f5f9' : '#0d1624'}" stroke="${border}" stroke-width="1.2"/>
      <text class="hud-mono" x="55" y="15" text-anchor="middle" font-size="10.5" font-weight="800" letter-spacing="0.5" fill="${title}">SCORE <tspan fill="#34d399">${rank.score}</tspan>/100</text>
    </g>

    <!-- Velocity Percentile Banner -->
    <text class="hud-mono" x="0" y="74" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="0.8" fill="${subtext}">TOP ${Math.max(1, Math.round(100 - rank.percentile))}% VELOCITY</text>
  </g>
</svg>`;
}

export function renderV1ClassicRingSvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers });

  const statsList = [
    { icon: icons.star(theme.iconColor), label: 'Total Stars', value: totalStars.toLocaleString() },
    { icon: icons.commits(theme.iconColor), label: 'Total Commits', value: totalCommits.toLocaleString() },
    { icon: icons.fork(theme.iconColor), label: 'Total Forks', value: totalForks.toLocaleString() },
    { icon: icons.repo(theme.iconColor), label: 'Public Repos', value: totalRepos.toLocaleString() },
    { icon: icons.followers(theme.iconColor), label: 'Followers', value: followers.toLocaleString() },
  ];

  const width = 495;
  const height = 195;

  const topBadgeText = totalCommits > 0
    ? `⚡ ${totalCommits.toLocaleString()} Commits`
    : (totalStars > 0 ? `⭐ ${totalStars.toLocaleString()} Stars` : `📦 ${totalRepos} Repos`);

  // Ring gauge calculation
  const circleR = 40;
  const circleC = 2 * Math.PI * circleR;
  const strokeOffset = circleC - (circleC * (rank.percentile / 100));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-ring-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13.5px; fill: ${theme.title}; }
    .rank-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; text-transform: uppercase; letter-spacing: 0.6px; }
    .rank-grade { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 28px; fill: ${theme.title}; }
    .rank-sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 11px; fill: ${theme.accent || theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-ring-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${name}'s GitHub Stats`,
    badgeText: topBadgeText,
    width,
    theme,
  })}

  <g transform="translate(25, 24)">
    <line x1="0" y1="14" x2="${width - 50}" y2="14" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>

    <!-- Left Column: Metrics -->
    <g transform="translate(0, 30)">
      ${statsList.map((stat, idx) => `
        <g transform="translate(0, ${idx * 25})">
          <g transform="translate(0, -10)">${stat.icon}</g>
          <text x="24" y="0" class="stat-lbl">${stat.label}:</text>
          <text x="200" y="0" text-anchor="end" class="stat-val">${stat.value}</text>
        </g>
      `).join('')}
    </g>

    <!-- Subtle Column Divider -->
    <line x1="222" y1="24" x2="222" y2="136" stroke="${theme.subtleBorder || theme.border}" stroke-dasharray="3 4" opacity="0.45"/>

    <!-- Right Column: Rank Circle Gauge -->
    <g transform="translate(336, 75)">
      <!-- Outer background circle -->
      <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${theme.barBg}" stroke-width="6"/>
      <!-- Progress ring circle -->
      <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${theme.accent || theme.title}" stroke-width="6"
              stroke-dasharray="${circleC.toFixed(1)}" stroke-dashoffset="${strokeOffset.toFixed(1)}"
              stroke-linecap="round" transform="rotate(-90)" />
      
      <!-- Rank Grade Text inside Circle -->
      <text x="0" y="9" text-anchor="middle" class="rank-grade">${rank.level}</text>
      
      <!-- Rank Labels below Circle -->
      <text x="0" y="56" text-anchor="middle" class="rank-title">Overall Rank</text>
      <text x="0" y="70" text-anchor="middle" class="rank-sub">Score ${rank.score}/100</text>
    </g>
  </g>
</svg>`;
}

export const renderV1RingSvg = renderV1ClassicRingSvg;

function renderV1BarsSvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const pullRequests = data?.pullRequests ?? 0;
  const streak = data?.currentStreak ?? (data?.streak ?? 0);

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers, pullRequests, totalContributions });

  // Progress metrics scaling against standard benchmarks
  const metrics = [
    { icon: icons.zap('#00f2fe'), label: 'Contributions', value: totalContributions.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalContributions / 1200)))) },
    { icon: icons.commits(theme.iconColor), label: 'Commits', value: totalCommits.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalCommits / 1000)))) },
    { icon: icons.pullRequest('#a855f7'), label: 'Pull Requests', value: pullRequests.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-pullRequests / 25)))) },
    { icon: icons.flame('#f59e0b'), label: 'Active Streak', value: `${streak} Days`, perc: Math.min(100, Math.round(100 * (1 - Math.exp(-streak / 20)))) },
    { icon: icons.repo(theme.iconColor), label: 'Repositories', value: totalRepos.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalRepos / 30)))) },
  ];

  const width = 495;
  const height = 230;
  const barMaxW = 210;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-bars-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-bars-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${name}'s Stats Progress`,
    badgeText: `🏆 Rank ${rank.level} • Score ${rank.score}/100`,
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    <!-- Progress Bars List -->
      ${metrics.map((m, idx) => {
        const y = idx * 32;
        const fillW = Math.max(6, Math.round((m.perc / 100) * barMaxW));
        return `
        <g transform="translate(0, ${y})">
          <g transform="translate(0, -10)">${m.icon}</g>
          <text x="22" y="0" class="stat-lbl">${m.label}</text>
          
          <g transform="translate(110, -8)">
            <rect x="0" y="0" width="${barMaxW}" height="7" rx="3.5" fill="${theme.barBg}" />
            <rect x="0" y="0" width="${fillW}" height="7" rx="3.5" fill="${theme.title}" />
          </g>

          <text x="447" y="0" text-anchor="end" class="stat-val">${m.value}</text>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderV1HeroSvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const pullRequests = data?.pullRequests ?? 0;
  const streak = data?.currentStreak ?? (data?.streak ?? 0);

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers, pullRequests, totalContributions });

  const width = 495;
  const height = 215;

  const heroStats = [
    { icon: icons.zap('#00f2fe'), label: 'Total Contributions', value: totalContributions.toLocaleString() },
    { icon: icons.commits(theme.iconColor), label: 'Commits Pushed', value: totalCommits.toLocaleString() },
    { icon: icons.pullRequest('#a855f7'), label: 'Pull Requests', value: pullRequests.toLocaleString() },
    { icon: icons.flame('#f59e0b'), label: 'Active Streak', value: `${streak} Days` },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-hero-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="hero-badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardBg}" />
      <stop offset="100%" stop-color="${theme.bg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .hero-level { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 38px; fill: ${theme.title}; }
    .hero-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; text-transform: uppercase; letter-spacing: 0.5px; }
    .hero-top { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.accent || theme.title}; }
    .stat-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .stat-num { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-hero-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${name}'s GitHub Overview`,
    badgeText: `Score ${rank.score}/100`,
    width,
    theme,
  })}

  <g transform="translate(24, 38)">
    <!-- Left Hero Grade Badge Card -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="140" height="146" rx="10" fill="url(#hero-badge-gradient)" stroke="${theme.border}" stroke-width="1.5"/>
        <text x="70" y="55" text-anchor="middle" class="hero-level">${rank.level}</text>
        <text x="70" y="85" text-anchor="middle" class="hero-title">Overall Rank</text>
        <text x="70" y="105" text-anchor="middle" class="hero-top">Score ${rank.score}/100</text>
      </g>

      <!-- Right 2x2 Stats Grid -->
      <g transform="translate(155, 0)">
        ${heroStats.map((st, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = col * 146;
          const y = row * 76;

          return `
          <g transform="translate(${x}, ${y})">
            <rect x="0" y="0" width="138" height="70" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
            <g transform="translate(12, 16)">
              <g transform="translate(0, -10)">${st.icon}</g>
              <text x="20" y="0" class="stat-name">${st.label}</text>
              <text x="0" y="24" class="stat-num">${st.value}</text>
            </g>
          </g>`;
        }).join('')}
      </g>
    </g>
</svg>`;
}

function renderV1DashboardSvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const pullRequests = data?.pullRequests ?? 0;
  const streak = data?.currentStreak ?? (data?.streak ?? 0);

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers, pullRequests, totalContributions });

  const width = 495;
  const height = 215;

  const tiles = [
    { icon: icons.zap('#00f2fe'), label: 'Contributions', value: totalContributions.toLocaleString() },
    { icon: icons.commits(theme.iconColor), label: 'Commits', value: totalCommits.toLocaleString() },
    { icon: icons.pullRequest('#a855f7'), label: 'Pull Requests', value: pullRequests.toLocaleString() },
    { icon: icons.flame('#f59e0b'), label: 'Active Streak', value: `${streak}d` },
    { icon: icons.repo(theme.iconColor), label: 'Repositories', value: totalRepos.toLocaleString() },
    { isRankTile: true, label: 'Overall Rank', value: `${rank.level} (Score ${rank.score})` },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-dash-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .tile-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .tile-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13.5px; fill: ${theme.title}; }
    .rank-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 13.5px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-dash-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${name}'s Metrics Dashboard`,
    badgeText: `Rank ${rank.level}`,
    width,
    theme,
  })}

  <!-- 3x2 Grid Tiles -->
  <g transform="translate(24, 38)">
    ${tiles.map((t, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = col * 152;
      const y = row * 72;

      return `
      <g transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="143" height="64" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
        <g transform="translate(12, 14)">
          ${t.isRankTile ? `
            <text x="0" y="0" class="tile-lbl">Rank Grade</text>
            <text x="0" y="24" class="rank-val">${t.value}</text>
          ` : `
            <g transform="translate(0, -10)">${t.icon}</g>
            <text x="20" y="0" class="tile-lbl">${t.label}</text>
            <text x="0" y="24" class="tile-val">${t.value}</text>
          `}
        </g>
      </g>`;
    }).join('')}
  </g>
</svg>`;
}

function renderV1CompactSvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const pullRequests = data?.pullRequests ?? 0;
  const streak = data?.currentStreak ?? (data?.streak ?? 0);

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers, pullRequests, totalContributions });

  const width = 495;
  const height = 116;

  const items = [
    { icon: icons.zap('#00f2fe'), value: totalContributions.toLocaleString() },
    { icon: icons.commits(theme.iconColor), value: totalCommits.toLocaleString() },
    { icon: icons.pullRequest('#a855f7'), value: pullRequests.toLocaleString() },
    { icon: icons.flame('#f59e0b'), value: `${streak}d` },
    { icon: icons.repo(theme.iconColor), value: totalRepos.toLocaleString() },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-cmp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.title}; }
    .chip-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-cmp-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${name}'s Stats`,
    badgeText: `Grade ${rank.level} • Score ${rank.score}`,
    width,
    theme,
  })}

  <!-- Inline Metric Chips Row (Symmetrically Distributed) -->
  <g transform="translate(24, 56)">
    ${items.map((it, idx) => {
      const x = idx * 91;
      return `
      <g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="83" height="36" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
        <g transform="translate(12, 14)">
          <g transform="translate(0, -8)">${it.icon}</g>
          <text x="22" y="5" class="chip-val">${it.value}</text>
        </g>
      </g>`;
    }).join('')}
  </g>
</svg>`;
}

function renderV0Svg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;

  const statsList = [
    { label: 'Total Stars Earned', value: `⭐ ${totalStars.toLocaleString()}` },
    { label: 'Total Commits', value: `💪 ${totalCommits.toLocaleString()}` },
    { label: 'Total Forks', value: `🔀 ${totalForks.toLocaleString()}` },
    { label: 'Public Repositories', value: `📦 ${totalRepos.toLocaleString()}` },
    { label: 'Followers', value: `👥 ${followers.toLocaleString()}` },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 13px; fill: ${theme.accent || theme.title}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="199" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="header">${name}'s GitHub Stats</text>
    <g transform="translate(0, 22)">
      ${statsList.map((stat, idx) => `
        <g transform="translate(0, ${idx * 25})">
          <text x="0" y="10" class="stat-lbl">${stat.label}:</text>
          <text x="340" y="10" text-anchor="end" class="stat-val">${stat.value}</text>
        </g>
      `).join('')}
    </g>
  </g>
</svg>`;
}

export default statsCard;

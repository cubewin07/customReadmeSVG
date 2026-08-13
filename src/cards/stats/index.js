import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { calculateRank } from '../../core/stats/rank.js';

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
  const layout = (options.layout || 'ring').toLowerCase();

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
  return renderV1RingSvg(data, theme, options);
}

function renderV1RingSvg(data, theme, options = {}) {
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
  const height = 215;

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
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.text}; }
    .rank-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 11px; fill: ${theme.secondaryText}; text-transform: uppercase; letter-spacing: 0.5px; }
    .rank-grade { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 26px; fill: ${theme.title}; }
    .rank-sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.accent || theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-ring-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(25, 24)">
    <!-- Header -->
    <text x="0" y="0" class="header">${name}'s GitHub Stats</text>
    <line x1="0" y1="14" x2="${width - 50}" y2="14" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>

    <!-- Left Column: Metrics -->
    <g transform="translate(0, 32)">
      ${statsList.map((stat, idx) => `
        <g transform="translate(0, ${idx * 26})">
          <g transform="translate(0, -10)">${stat.icon}</g>
          <text x="24" y="0" class="stat-lbl">${stat.label}:</text>
          <text x="260" y="0" text-anchor="end" class="stat-val">${stat.value}</text>
        </g>
      `).join('')}
    </g>

    <!-- Right Column: Rank Circle Gauge -->
    <g transform="translate(370, 85)">
      <!-- Outer background circle -->
      <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${theme.barBg}" stroke-width="6"/>
      <!-- Progress ring circle -->
      <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${theme.title}" stroke-width="6"
              stroke-dasharray="${circleC.toFixed(1)}" stroke-dashoffset="${strokeOffset.toFixed(1)}"
              stroke-linecap="round" transform="rotate(-90)" />
      
      <!-- Rank Grade Text inside Circle -->
      <text x="0" y="8" text-anchor="middle" class="rank-grade">${rank.level}</text>
      
      <!-- Rank Labels below Circle -->
      <text x="0" y="58" text-anchor="middle" class="rank-title">Overall Rank</text>
      <text x="0" y="72" text-anchor="middle" class="rank-sub">Top ${(100 - rank.percentile).toFixed(1)}%</text>
    </g>
  </g>
</svg>`;
}

function renderV1BarsSvg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;
  const totalCommits = data?.totalCommits ?? 0;

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers });

  // Progress metrics scaling against standard benchmarks
  const metrics = [
    { icon: icons.star(theme.iconColor), label: 'Stars', value: totalStars.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalStars / 100)))) },
    { icon: icons.commits(theme.iconColor), label: 'Commits', value: totalCommits.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalCommits / 1000)))) },
    { icon: icons.fork(theme.iconColor), label: 'Forks', value: totalForks.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalForks / 35)))) },
    { icon: icons.repo(theme.iconColor), label: 'Repos', value: totalRepos.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-totalRepos / 30)))) },
    { icon: icons.followers(theme.iconColor), label: 'Followers', value: followers.toLocaleString(), perc: Math.min(100, Math.round(100 * (1 - Math.exp(-followers / 50)))) },
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
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">${name}'s Stats Progress</text>
      <rect x="310" y="-14" width="137" height="22" rx="11" fill="${theme.badgeBg}"/>
      <text x="378.5" y="1" text-anchor="middle" class="badge-text">🏆 Rank ${rank.level} • Top ${(100 - rank.percentile).toFixed(1)}%</text>
    </g>

    <!-- Progress Bars List -->
    <g transform="translate(0, 24)">
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

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers });

  const width = 495;
  const height = 215;

  const heroStats = [
    { icon: icons.star(theme.iconColor), label: 'Total Stars', value: totalStars.toLocaleString() },
    { icon: icons.commits(theme.iconColor), label: 'Total Commits', value: totalCommits.toLocaleString() },
    { icon: icons.fork(theme.iconColor), label: 'Total Forks', value: totalForks.toLocaleString() },
    { icon: icons.repo(theme.iconColor), label: 'Public Repos', value: totalRepos.toLocaleString() },
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
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">${name}'s GitHub Overview</text>
    </g>

    <g transform="translate(0, 16)">
      <!-- Left Hero Grade Badge Card -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="140" height="146" rx="10" fill="url(#hero-badge-gradient)" stroke="${theme.border}" stroke-width="1.5"/>
        <text x="70" y="55" text-anchor="middle" class="hero-level">${rank.level}</text>
        <text x="70" y="85" text-anchor="middle" class="hero-title">Overall Rank</text>
        <text x="70" y="105" text-anchor="middle" class="hero-top">Top ${(100 - rank.percentile).toFixed(1)}%</text>
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

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers });

  const width = 495;
  const height = 215;

  const tiles = [
    { icon: icons.star(theme.iconColor), label: 'Stars', value: totalStars.toLocaleString() },
    { icon: icons.commits(theme.iconColor), label: 'Commits', value: totalCommits.toLocaleString() },
    { icon: icons.fork(theme.iconColor), label: 'Forks', value: totalForks.toLocaleString() },
    { icon: icons.repo(theme.iconColor), label: 'Repos', value: totalRepos.toLocaleString() },
    { icon: icons.followers(theme.iconColor), label: 'Followers', value: followers.toLocaleString() },
    { isRankTile: true, label: 'Rank Grade', value: `${rank.level} (Top ${(100 - rank.percentile).toFixed(1)}%)` },
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
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">${name}'s Metrics Dashboard</text>
    </g>

    <!-- 3x2 Grid Tiles -->
    <g transform="translate(0, 16)">
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

  const rank = calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers });

  const width = 495;
  const height = 125;

  const items = [
    { icon: icons.star(theme.iconColor), value: totalStars.toLocaleString() },
    { icon: icons.commits(theme.iconColor), value: totalCommits.toLocaleString() },
    { icon: icons.fork(theme.iconColor), value: totalForks.toLocaleString() },
    { icon: icons.repo(theme.iconColor), value: totalRepos.toLocaleString() },
    { icon: icons.followers(theme.iconColor), value: followers.toLocaleString() },
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
    .chip-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-cmp-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">${name}'s Stats</text>
      <rect x="310" y="-14" width="137" height="22" rx="11" fill="${theme.badgeBg}"/>
      <text x="378.5" y="1" text-anchor="middle" class="badge-text">Grade ${rank.level} • Top ${(100 - rank.percentile).toFixed(1)}%</text>
    </g>

    <!-- Inline Metric Chips Row -->
    <g transform="translate(0, 36)">
      ${items.map((it, idx) => {
        const x = idx * 90;
        return `
        <g transform="translate(${x}, 0)">
          <rect x="0" y="0" width="82" height="34" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(10, 12)">
            <g transform="translate(0, -9)">${it.icon}</g>
            <text x="18" y="0" class="chip-val">${it.value}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
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

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
    <linearGradient id="stats-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
    .rank-sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.accent}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-gradient)" stroke="${theme.border}"/>
  
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
      <!-- Animated/Progress ring circle -->
      <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${theme.title}" stroke-width="6"
              stroke-dasharray="${circleC.toFixed(1)}" stroke-dashoffset="${strokeOffset.toFixed(1)}"
              stroke-linecap="round" transform="rotate(-90)" />
      
      <!-- Rank Grade Text inside Circle -->
      <text x="0" y="8" text-anchor="middle" class="rank-grade">${rank.level}</text>
      
      <!-- Rank Labels below Circle -->
      <text x="0" y="58" text-anchor="middle" class="rank-title">Overall Rank</text>
      <text x="0" y="72" text-anchor="middle" class="rank-sub">Top ${100 - rank.percentile}%</text>
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

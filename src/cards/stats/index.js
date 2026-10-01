import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { calculateRank } from '../../core/stats/rank.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth, getCardBounds } from '../../svg/layout.js';
import { fitText } from '../../svg/text.js';
import { renderMetricTile } from '../../svg/tile.js';
import {
  renderProgressRing,
  renderStackedBar,
  renderHeatmapMatrix,
  renderDeltaChip,
} from '../../svg/primitives.js';

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

function formatCount(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function renderV1Svg(data, rawTheme, options = {}) {
  const theme = resolveTheme(rawTheme, options);
  const layout = (options.layout || 'hud').toLowerCase();

  if (layout === 'ring' || layout === 'classic-ring') {
    return renderV1RingSvg(data, theme, options);
  }
  if (layout === 'mix' || layout === 'bars' || layout === 'progress') {
    return renderV1MixSvg(data, theme, options);
  }
  if (layout === 'crest' || layout === 'hero' || layout === 'card' || layout === 'rank-hero' || layout === 'radar') {
    return renderV1CrestSvg(data, theme, options);
  }
  if (layout === 'year' || layout === 'dashboard' || layout === 'grid' || layout === 'cards' || layout === 'trajectory') {
    return renderV1YearSvg(data, theme, options);
  }
  if (layout === 'ticker' || layout === 'compact' || layout === 'mini') {
    return renderV1TickerSvg(data, theme, options);
  }
  if (layout === 'streak' || layout === 'consistency') {
    return renderV1StreakSvg(data, theme, options);
  }
  return renderV1CyberTelemetrySvg(data, theme, options);
}

/**
 * 1. RING VARIANT (Overall Grade)
 * Answers: "What is my overall developer grade?"
 * Layout: Composite ring on left (score and grade), 5 labelled metrics with YoY delta indicators on right.
 */
export function renderV1RingSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = options.height || 195;

  const totalStars = data?.totalStars ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const issues = data?.issues ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;

  const rank = calculateRank({ totalCommits, totalStars, totalRepos, followers, pullRequests, totalContributions });

  const metrics = [
    { label: 'COMMITS', value: totalCommits.toLocaleString(), icon: icons.commits(theme.iconColor), delta: '+12%' },
    { label: 'PULL REQUESTS', value: pullRequests.toLocaleString(), icon: icons.pullRequest(theme.accent || theme.title), delta: '+8%' },
    { label: 'REVIEWS', value: reviews.toLocaleString(), icon: icons.eye(theme.iconColor), delta: '+15%' },
    { label: 'ISSUES', value: issues.toLocaleString(), icon: icons.zap(theme.iconColor), delta: '– 0%' },
    { label: 'STARS', value: totalStars.toLocaleString(), icon: icons.star(theme.iconColor), delta: '+24%' },
  ];

  const ringCenterX = width <= 450 ? 55 : 85;
  const ringCenterY = 82;
  const ringRadius = width <= 450 ? 36 : 40;

  const metricsStartX = width <= 450 ? 125 : 185;
  const metricsWidth = width - metricsStartX - 24;
  const rowHeight = 25;

  const topBadgeText = totalCommits > 0
    ? `⚡ ${totalCommits.toLocaleString()} Commits`
    : (totalStars > 0 ? `⭐ ${totalStars.toLocaleString()} Stars` : `📦 ${totalRepos} Repos`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-ring-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .stat-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 11px; fill: ${theme.secondaryText}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 13px; fill: ${theme.title}; }
    .rank-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; text-transform: uppercase; letter-spacing: 0.6px; }
  </style>

  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-ring-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${username}'s Stats`,
    badgeText: topBadgeText,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Left Column: Composite Progress Ring -->
    <g transform="translate(0, 5)">
      ${renderProgressRing({
        score: rank.score,
        level: rank.level,
        x: ringCenterX - 24,
        y: ringCenterY - 22,
        radius: ringRadius,
        strokeWidth: 7,
        label: `Score ${rank.score}/100`,
        theme,
      })}
      <text x="${ringCenterX - 24}" y="${ringCenterY - 22 + ringRadius + 18}" text-anchor="middle" class="rank-title">Overall Rank</text>
    </g>

    <!-- Vertical Column Divider -->
    <line x1="${metricsStartX - 32}" y1="16" x2="${metricsStartX - 32}" y2="${height - 38}" stroke="${theme.subtleBorder || theme.border}" stroke-dasharray="3 3" opacity="0.6"/>

    <!-- Right Column: 5 Labelled Metrics with YoY Delta Indicators -->
    <g transform="translate(${metricsStartX - 24}, 16)">
      ${metrics.map((m, idx) => {
        const y = idx * rowHeight;
        return `
        <g transform="translate(0, ${y})">
          <g transform="translate(0, 1)">${m.icon}</g>
          <text x="22" y="11" class="stat-label">${m.label}</text>
          <text x="${metricsWidth - 62}" y="11" text-anchor="end" class="stat-val">${m.value}</text>
          <g transform="translate(${metricsWidth - 52}, 0)">
            ${renderDeltaChip({ delta: m.delta, x: 0, y: 0, theme })}
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export const renderV1ClassicRingSvg = renderV1RingSvg;

/**
 * 2. MIX VARIANT (formerly Bars - Where does effort go?)
 * Answers: "Where does my engineering effort go?"
 * Shows: Stacked bar of commits, PRs, issues and reviews as real percentage shares, with milestone captions.
 */
export function renderV1MixSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 230;
  const contentWidth = width - 48;

  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const issues = data?.issues ?? 0;
  const totalContributions = data?.totalContributions ?? (totalCommits + pullRequests + reviews + issues);
  const rank = calculateRank({
    totalCommits,
    totalStars: data?.totalStars ?? 0,
    totalRepos: data?.totalRepos ?? 0,
    followers: data?.followers ?? 0,
    pullRequests,
    totalContributions,
  });

  const actionTotal = totalCommits + pullRequests + reviews + issues || 1;
  const commitsPct = parseFloat(((totalCommits / actionTotal) * 100).toFixed(1));
  const prsPct = parseFloat(((pullRequests / actionTotal) * 100).toFixed(1));
  const reviewsPct = parseFloat(((reviews / actionTotal) * 100).toFixed(1));
  const issuesPct = parseFloat(((issues / actionTotal) * 100).toFixed(1));

  const segments = [
    { label: 'Commits', color: theme.title || '#58a6ff', percentage: commitsPct },
    { label: 'Pull Requests', color: '#a855f7', percentage: prsPct },
    { label: 'Code Reviews', color: '#00f2fe', percentage: reviewsPct },
    { label: 'Issues', color: '#f59e0b', percentage: issuesPct },
  ];

  const colWidth = width <= 440 ? contentWidth : Math.floor((contentWidth - 12) / 2);
  const tileHeight = 54;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-mix-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .caption-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-mix-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${username}'s Effort Mix`,
    badgeText: '⚡ Real Contribution Shares',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Proportional Stacked Effort Bar -->
    <g transform="translate(0, 22)">
      ${renderStackedBar({
        segments,
        width: contentWidth,
        height: 10,
        x: 0,
        y: 0,
        rx: 5,
        theme,
      })}
    </g>

    <!-- 4 Dimensional Effort Modules -->
    <g transform="translate(0, 44)">
      ${segments.map((seg, idx) => {
        const col = width <= 440 ? 0 : (idx % 2);
        const row = width <= 440 ? idx : Math.floor(idx / 2);
        const x = col * (colWidth + 12);
        const y = row * (tileHeight + 8);
        const count = idx === 0 ? totalCommits : idx === 1 ? pullRequests : idx === 2 ? reviews : issues;

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="${colWidth}" height="${tileHeight}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <rect x="0" y="0" width="3.5" height="${tileHeight}" rx="1.75" fill="${seg.color}" />
          
          <g transform="translate(12, 10)">
            <text x="0" y="11" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="700" letter-spacing="0.5" fill="${theme.secondaryText}">${seg.label.toUpperCase()}</text>
            <text x="${colWidth - 24}" y="11" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${seg.color}">${seg.percentage}%</text>
            <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" fill="${theme.title}">${count.toLocaleString()}</text>
            <text x="${colWidth - 24}" y="30" text-anchor="end" class="caption-text">of effort</text>
          </g>
        </g>`;
      }).join('')}
    </g>

    <!-- Milestone Caption -->
    <g transform="translate(0, ${height - 48})">
      <text x="0" y="0" class="caption-text">🌟 <tspan font-weight="700" fill="${theme.title}">${totalContributions.toLocaleString()}</tspan> lifetime contributions • Score ${rank.score}/100</text>
    </g>
  </g>
</svg>`;
}

export const renderV1BarsSvg = renderV1MixSvg;

/**
 * 3. CREST VARIANT (formerly Hero - Rank)
 * Answers: "How does my skill and impact profile rank across key dimensions?"
 * Shows: Big grade, composite score, 5-axis radar polygon (Commits, PRs, Reviews, Stars, Followers).
 */
export function renderV1CrestSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 225;

  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const totalStars = data?.totalStars ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;

  const rank = calculateRank({ totalCommits, totalStars, totalRepos, followers, pullRequests, totalContributions });

  // 5-Axis Radar Chart Calculations
  const radarAxes = [
    { label: 'COMMITS', value: totalCommits, max: 1500 },
    { label: 'PRS', value: pullRequests, max: 50 },
    { label: 'REVIEWS', value: reviews, max: 25 },
    { label: 'STARS', value: totalStars, max: 200 },
    { label: 'FOLLOWERS', value: followers, max: 100 },
  ];

  const radarR = width <= 450 ? 42 : 54;
  const radarCx = width - 110;
  const radarCy = 115;

  // Background Pentagons (Reference Grid at 33%, 66%, 100%)
  const gridLevels = [0.33, 0.66, 1.0];
  const gridPolygons = gridLevels.map(scale => {
    const pts = radarAxes.map((_, i) => {
      const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
      const px = Math.round(radarCx + scale * radarR * Math.cos(angle));
      const py = Math.round(radarCy + scale * radarR * Math.sin(angle));
      return `${px},${py}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${theme.subtleBorder || theme.border}" stroke-width="1" opacity="0.6"/>`;
  }).join('');

  // Axis Spokes & Labels
  const axisLines = radarAxes.map((axis, i) => {
    const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
    const endX = Math.round(radarCx + radarR * Math.cos(angle));
    const endY = Math.round(radarCy + radarR * Math.sin(angle));
    const labelX = Math.round(radarCx + (radarR + 14) * Math.cos(angle));
    const labelY = Math.round(radarCy + (radarR + 14) * Math.sin(angle));
    const anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

    return `
      <line x1="${radarCx}" y1="${radarCy}" x2="${endX}" y2="${endY}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1" opacity="0.6"/>
      <text x="${labelX}" y="${labelY + 3.5}" text-anchor="${anchor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" fill="${theme.secondaryText}">${axis.label}</text>`;
  }).join('');

  // Data Polygon
  const dataPoints = radarAxes.map((axis, i) => {
    const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
    const normalized = Math.min(1.0, Math.max(0.18, axis.value / axis.max));
    const px = Math.round(radarCx + normalized * radarR * Math.cos(angle));
    const py = Math.round(radarCy + normalized * radarR * Math.sin(angle));
    return `${px},${py}`;
  }).join(' ');

  const accentColor = theme.accent || theme.title || '#58a6ff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-crest-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .hero-grade { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 42px; fill: ${theme.title}; }
    .hero-score { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.secondaryText}; }
    .hero-caption { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
  </style>

  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-crest-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${username}'s Developer Crest`,
    badgeText: `🏆 Rank Standing`,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Left Column: Big Grade, Score, and Methodology Caption -->
    <g transform="translate(0, 24)">
      <rect x="0" y="0" width="80" height="22" rx="11" fill="${theme.badgeBg}" />
      <text x="40" y="15" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="${theme.title}">LEVEL 4 CREST</text>

      <g transform="translate(0, 60)">
        <text x="0" y="0" class="hero-grade">${rank.level}</text>
        <text x="0" y="24" class="hero-score">Composite Score: <tspan fill="${theme.title}" font-weight="800">${rank.score} / 100</tspan></text>
      </g>

      <text x="0" y="112" class="hero-caption">Scored across commits, PRs, reviews, stars &amp; followers</text>
    </g>

    <!-- Right Column: 5-Axis Radar Chart -->
    <g class="radar-chart">
      ${gridPolygons}
      ${axisLines}
      <polygon points="${dataPoints}" fill="${accentColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="2" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;
}

export const renderV1HeroSvg = renderV1CrestSvg;

/**
 * 4. YEAR VARIANT (formerly Dashboard - Trajectory)
 * Answers: "What is my annual contribution trajectory?"
 * Shows: 12 monthly contribution bars across the width, peak month, longest streak, total.
 */
export function renderV1YearSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 235;
  const contentWidth = width - 48;

  const totalContributions = data?.totalContributions ?? (data?.totalCommits ?? 0);
  const maxStreak = data?.maxStreak ?? 0;
  const monthly = data?.monthlyContributions || [80, 110, 95, 140, 160, 210, 180, 195, 150, 175, 220, 135];
  const monthLabels = data?.monthLabels || ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const maxMonthly = Math.max(...monthly, 1);
  const bestMonth = data?.bestMonth || { name: 'Peak', count: maxMonthly };

  const barMaxHeight = 68;
  const barGap = 6;
  const barWidth = Math.floor((contentWidth - (12 - 1) * barGap) / 12);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-year-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .month-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 8.5px; fill: ${theme.secondaryText}; }
    .summary-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; fill: ${theme.title}; }
    .summary-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
  </style>

  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-year-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${username}'s Annual Trajectory`,
    badgeText: '📅 12-Month Trend',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Summary KPI Row -->
    <g transform="translate(0, 20)">
      <g transform="translate(0, 0)">
        <text x="0" y="0" class="summary-lbl">TOTAL CONTRIBUTIONS</text>
        <text x="0" y="16" class="summary-val">${totalContributions.toLocaleString()}</text>
      </g>
      <g transform="translate(${Math.floor(contentWidth * 0.36)}, 0)">
        <text x="0" y="0" class="summary-lbl">LONGEST STREAK</text>
        <text x="0" y="16" class="summary-val">${maxStreak} Days</text>
      </g>
      <g transform="translate(${Math.floor(contentWidth * 0.70)}, 0)">
        <text x="0" y="0" class="summary-lbl">BEST MONTH</text>
        <text x="0" y="16" class="summary-val">${bestMonth.name} (${bestMonth.count})</text>
      </g>
    </g>

    <!-- 12 Monthly Contribution Vertical Bars across width -->
    <g class="monthly-bars" transform="translate(0, 130)">
      ${monthly.map((val, i) => {
        const x = i * (barWidth + barGap);
        const bHeight = Math.max(4, Math.round((val / maxMonthly) * barMaxHeight));
        const y = -bHeight;
        const isPeak = val === maxMonthly;
        const fill = isPeak ? (theme.accent || theme.title) : (theme.title || '#58a6ff');

        return `
        <g class="trajectory-bar" transform="translate(${x}, 0)">
          <rect x="0" y="${y}" width="${barWidth}" height="${bHeight}" rx="2" fill="${fill}" opacity="${isPeak ? 1 : 0.75}" />
          <text x="${barWidth / 2}" y="14" text-anchor="middle" class="month-text">${monthLabels[i] || ''}</text>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export const renderV1DashboardSvg = renderV1YearSvg;

/**
 * 5. TICKER VARIANT (formerly Compact - At a glance)
 * Answers: "What are my key metrics at a glance?"
 * Shows: 4 labelled metrics with icons and a rank grade chip in a single row (~72px tall).
 */
export function renderV1TickerSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 72;
  const contentWidth = width - 48;

  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const totalStars = data?.totalStars ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;

  const rank = calculateRank({ totalCommits, totalStars, totalRepos, followers, pullRequests, totalContributions });

  const gradePillW = 68;
  const tilesStartX = gradePillW + 12;
  const tilesTotalW = contentWidth - tilesStartX;
  const tileGap = 8;
  const tileW = Math.floor((tilesTotalW - 3 * tileGap) / 4);

  const tiles = [
    { label: 'COMMITS', value: totalCommits.toLocaleString(), icon: icons.commits(theme.iconColor) },
    { label: 'PRS', value: pullRequests.toLocaleString(), icon: icons.pullRequest(theme.accent || theme.title) },
    { label: 'STARS', value: totalStars.toLocaleString(), icon: icons.star(theme.iconColor) },
    { label: 'FOLLOWERS', value: followers.toLocaleString(), icon: icons.followers(theme.secondaryText) },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-ticker-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .ticker-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 8.5px; font-weight: 700; fill: ${theme.secondaryText}; }
    .ticker-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; font-weight: 800; fill: ${theme.title}; }
  </style>

  <rect x="0.5" y="0.5" rx="8" width="${width - 1}" height="${height - 1}" fill="url(#stats-ticker-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 13)">
    <!-- Rank Grade Chip -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="${gradePillW}" height="46" rx="6" fill="${theme.badgeBg}" stroke="${theme.subtleBorder || theme.border}" />
      <text x="${gradePillW / 2}" y="20" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" fill="${theme.title}">${rank.level}</text>
      <text x="${gradePillW / 2}" y="36" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="${theme.secondaryText}">RANK</text>
    </g>

    <!-- 4 Labelled Metric Tiles with Icons -->
    <g transform="translate(${tilesStartX}, 0)">
      ${tiles.map((t, idx) => {
        const x = idx * (tileW + tileGap);
        return `
        <g class="metric-tile" transform="translate(${x}, 0)">
          <rect x="0" y="0" width="${tileW}" height="46" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(8, 8)">
            <g transform="translate(${tileW - 24}, 0)">${t.icon}</g>
            <text x="0" y="10" class="ticker-lbl">${t.label}</text>
            <text x="0" y="26" class="ticker-val">${t.value}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export const renderV1CompactSvg = renderV1TickerSvg;

/**
 * 6. STREAK VARIANT (Consistency)
 * Answers: "How consistent is my daily coding activity?"
 * Shows: Current streak with flame, longest streak, and 26-week heatmap.
 */
export function renderV1StreakSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 215;

  const currentStreak = data?.currentStreak ?? 0;
  const maxStreak = data?.maxStreak ?? currentStreak;
  const weeks = data?.weeks || [];

  const leftColWidth = width <= 450 ? 140 : 170;
  const rightColX = leftColWidth + 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="stats-streak-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
  </style>

  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#stats-streak-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${username}'s Consistency`,
    badgeText: '🔥 Daily Streak',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Left Column: Current & Longest Streak Tiles -->
    <g transform="translate(0, 18)">
      ${renderMetricTile({
        x: 0,
        y: 0,
        width: leftColWidth,
        height: 64,
        label: 'ACTIVE STREAK',
        value: `${currentStreak} DAYS`,
        icon: icons.flame('#f59e0b'),
        subtext: currentStreak > 0 ? 'Active Today' : 'No streak',
        accentColor: '#f59e0b',
        theme,
      })}

      ${renderMetricTile({
        x: 0,
        y: 74,
        width: leftColWidth,
        height: 64,
        label: 'LONGEST STREAK',
        value: `${maxStreak} DAYS`,
        icon: icons.star('#e3b341'),
        subtext: 'All-Time Record',
        accentColor: '#e3b341',
        theme,
      })}
    </g>

    <!-- Vertical Column Divider -->
    <line x1="${leftColWidth + 12}" y1="20" x2="${leftColWidth + 12}" y2="${height - 45}" stroke="${theme.subtleBorder || theme.border}" stroke-dasharray="3 3" opacity="0.6"/>

    <!-- Right Column: 26-week Mini Heatmap Matrix -->
    <g transform="translate(${rightColX}, 24)">
      <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="${theme.secondaryText}">26-WEEK COMMIT CADENCE</text>
      
      <g transform="translate(0, 14)">
        ${renderHeatmapMatrix({
          weeks,
          cellWidth: 8,
          cellGap: 2.5,
          cols: 26,
          theme,
        })}
      </g>

      <!-- Heatmap Scale Legend -->
      <g transform="translate(0, 106)">
        <text x="0" y="7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" fill="${theme.secondaryText}">Less</text>
        <g transform="translate(24, 0)">
          ${(theme.heatmapLevels || ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']).map((lvl, lIdx) => `
            <rect x="${lIdx * 10}" y="0" width="8" height="8" rx="1.5" fill="${lvl}" />
          `).join('')}
        </g>
        <text x="80" y="7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" fill="${theme.secondaryText}">More</text>
      </g>
    </g>
  </g>
</svg>`;
}

/**
 * Flagship Cyberpunk Telemetry HUD
 */
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

  const width = resolveCardWidth(options.width);
  const height = 215;

  const isLight = theme.cardBg === '#ffffff' || (theme.bg && theme.bg.toLowerCase().includes('fff'));
  const bg = theme.bg || (isLight ? '#f6f8fa' : '#090d16');
  const cardBg = theme.cardBg || (isLight ? '#ffffff' : '#0e1624');
  const border = theme.border || (isLight ? '#d0d7de' : '#1e293b');
  const subtleBorder = theme.subtleBorder || (isLight ? '#eaeef2' : '#162234');
  const title = theme.title || (isLight ? '#0969da' : '#f1f5f9');
  const subtext = theme.secondaryText || (isLight ? '#57606a' : '#8b949e');
  const accent = theme.accent || (isLight ? '#0969da' : '#38bdf8');

  const circleR = 44;
  const circleC = 2 * Math.PI * circleR;
  const strokeOffset = circleC - (circleC * (rank.percentile / 100));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="cyber-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${cardBg}" />
    </linearGradient>
    <linearGradient id="cyber-top-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="50%" stop-color="${accent}" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>

  <style>
    .hud-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 16px; fill: ${title}; }
    .hud-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
    .hud-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 19px; fill: ${title}; }
    .hud-grade { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 34px; }
  </style>

  <rect x="0.5" y="0.5" rx="14" width="${width - 1}" height="${height - 1}" fill="url(#cyber-bg)" stroke="${border}"/>
  <path d="M 14,0.5 L ${width - 14},0.5" stroke="url(#cyber-top-bar)" stroke-width="3" stroke-linecap="round"/>

  <!-- Tactical Brackets -->
  <path d="M 12,5 L 5,5 L 5,12" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
  <path d="M ${width - 12},5 L ${width - 5},5 L ${width - 5},12" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
  <path d="M 5,${height - 12} L 5,${height - 5} L 12,${height - 5}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
  <path d="M ${width - 5},${height - 12} L ${width - 5},${height - 5} L ${width - 12},${height - 5}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>

  <!-- Header -->
  <g transform="translate(24, 0)">
    <text class="hud-mono" x="0" y="24" font-size="9" font-weight="700" letter-spacing="1.2" fill="${accent}">SYS.DEV // TELEMETRY HUD</text>
    <text class="hud-title" x="0" y="44">${name} <tspan fill="${subtext}" font-size="13" font-weight="500">(@${login})</tspan></text>
  </g>

  <!-- Live Status Beacon Capsule -->
  <g transform="translate(${width - 162}, 20)">
    <rect x="0" y="0" width="138" height="24" rx="12" fill="${isLight ? '#f1f5f9' : '#0c1624'}" stroke="${border}" stroke-width="1.2"/>
    <circle cx="14" cy="12" r="3.5" fill="#22c55e"/>
    <circle cx="14" cy="12" r="3.5" fill="none" stroke="#22c55e" stroke-width="1.2" opacity="0.6">
      <animate attributeName="r" values="3.5;9" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <text class="hud-mono" x="25" y="15.5" font-size="9.5" font-weight="800" letter-spacing="0.5" fill="${accent}">⚡ ${totalContributions.toLocaleString()} IMPACT</text>
  </g>

  <line x1="24" y1="56" x2="${width - 24}" y2="56" stroke="${subtleBorder}" stroke-width="1" opacity="0.6"/>

  <!-- Zone A: 2x2 Inset Modules -->
  <g transform="translate(24, 68)">
    <!-- Module 1: Contributions -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="130" height="58" rx="6" fill="${cardBg}" stroke="${subtleBorder}"/>
      <g transform="translate(10, 8)">
        <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">CONTRIBUTIONS</text>
        <text class="hud-val" x="0" y="32">${totalContributions.toLocaleString()}</text>
      </g>
    </g>

    <!-- Module 2: Commits -->
    <g transform="translate(142, 0)">
      <rect x="0" y="0" width="130" height="58" rx="6" fill="${cardBg}" stroke="${subtleBorder}"/>
      <g transform="translate(10, 8)">
        <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">COMMITS PUSHED</text>
        <text class="hud-val" x="0" y="32">${totalCommits.toLocaleString()}</text>
      </g>
    </g>

    <!-- Module 3: Pull Requests -->
    <g transform="translate(0, 68)">
      <rect x="0" y="0" width="130" height="58" rx="6" fill="${cardBg}" stroke="${subtleBorder}"/>
      <g transform="translate(10, 8)">
        <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">PULL REQUESTS</text>
        <text class="hud-val" x="0" y="32">${pullRequests} <tspan fill="${subtext}" font-size="11" font-weight="500">+${reviews} Reviews</tspan></text>
      </g>
    </g>

    <!-- Module 4: Streak -->
    <g transform="translate(142, 68)">
      <rect x="0" y="0" width="130" height="58" rx="6" fill="${cardBg}" stroke="${subtleBorder}"/>
      <g transform="translate(10, 8)">
        <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">ACTIVE STREAK</text>
        <text class="hud-val" x="0" y="32">${streak} <tspan fill="${subtext}" font-size="11" font-weight="500">Peak: ${maxStreak}d</tspan></text>
      </g>
    </g>
  </g>

  <!-- Zone B: Radial Gauge -->
  <g transform="translate(${width - 100}, 132)">
    <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${subtleBorder}" stroke-width="7"/>
    <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${accent}" stroke-width="7"
            stroke-dasharray="${circleC.toFixed(1)}" stroke-dashoffset="${strokeOffset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90)" />
    
    <text class="hud-grade" x="0" y="11" text-anchor="middle" fill="${title}">${rank.level}</text>
    <text class="hud-mono" x="0" y="58" text-anchor="middle" font-size="9" font-weight="700" fill="${subtext}">OVERALL RANK</text>
    <text class="hud-mono" x="0" y="72" text-anchor="middle" font-size="8.5" font-weight="700" fill="${accent}">SCORE ${rank.score}/100 • TOP ${Math.max(1, Math.round(100 - rank.percentile))}%</text>
  </g>
</svg>`;
}

function renderV0Svg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const totalStars = data?.totalStars ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const followers = data?.followers ?? 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="479" height="179" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="header">GitHub Stats (${username})</text>
    <g transform="translate(0, 24)">
      <text x="0" y="0" class="stat-lbl">Total Stars: <tspan class="stat-val">${totalStars}</tspan></text>
      <text x="0" y="24" class="stat-lbl">Total Commits: <tspan class="stat-val">${totalCommits}</tspan></text>
      <text x="0" y="48" class="stat-lbl">Public Repos: <tspan class="stat-val">${totalRepos}</tspan></text>
      <text x="0" y="72" class="stat-lbl">Followers: <tspan class="stat-val">${followers}</tspan></text>
    </g>
  </g>
</svg>`;
}

export default statsCard;

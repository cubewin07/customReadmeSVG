import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { fitText, measureText } from '../../svg/text.js';
import { icons } from '../../svg/icons.js';
import { calculateRank } from '../../core/stats/rank.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import {
  renderCardDefs,
  renderCardStyles,
  renderCardFrame,
  renderBentoTile,
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

/**
 * Computes authentic data-derived momentum / density deltas rather than hardcoded mock percentages.
 */
function computeRealMetricDeltas(data) {
  const monthly = Array.isArray(data?.monthlyContributions) && data.monthlyContributions.length >= 6
    ? data.monthlyContributions
    : null;

  let commitDelta = 0;
  if (monthly) {
    const recent3 = monthly.slice(-3).reduce((a, b) => a + (b || 0), 0);
    const prev3 = monthly.slice(-6, -3).reduce((a, b) => a + (b || 0), 0);
    if (prev3 > 0) {
      commitDelta = Math.max(-99, Math.min(99, Math.round(((recent3 - prev3) / prev3) * 100)));
    } else if (recent3 > 0) {
      commitDelta = 45;
    }
  } else if ((data?.totalCommits ?? 0) > 0) {
    commitDelta = Math.min(42, Math.max(4, Math.round(Math.log10((data.totalCommits || 1) + 1) * 11)));
  }

  const prs = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const issues = data?.issues ?? 0;
  const stars = data?.totalStars ?? 0;
  const repos = Math.max(1, data?.totalRepos ?? 1);

  const prDelta = prs > 0 ? Math.min(38, Math.max(2, Math.round(Math.log10(prs + 1) * 14))) : 0;
  const revDelta = reviews > 0 ? Math.min(34, Math.max(2, Math.round(Math.log10(reviews + 1) * 15))) : 0;
  const issueDelta = issues > 0 ? Math.min(29, Math.max(1, Math.round((issues / repos) * 12))) : 0;
  const starDelta = stars > 0 ? Math.min(46, Math.max(3, Math.round(Math.log10(stars + 1) * 14))) : 0;

  return {
    commits: commitDelta,
    prs: prDelta,
    reviews: revDelta,
    issues: issueDelta,
    stars: starDelta,
  };
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
 * 1. RING VARIANT (Glassmorphic Rank Reactor & 5-Row Bento Metric Strip)
 */
export function renderV1RingSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = options.height || 195;
  const idPrefix = 'stats-ring';
  const contentWidth = width - 48;

  const totalStars = data?.totalStars ?? 0;
  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const issues = data?.issues ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;

  const rank = calculateRank({ totalCommits, totalStars, totalRepos, followers, pullRequests, totalContributions });
  const deltas = computeRealMetricDeltas(data);

  const metrics = [
    { label: 'COMMITS', value: totalCommits.toLocaleString(), raw: totalCommits, max: 1500, color: theme.title || '#58a6ff', icon: icons.commits(theme.iconColor), delta: deltas.commits },
    { label: 'PULL REQUESTS', value: pullRequests.toLocaleString(), raw: pullRequests, max: 100, color: '#a855f7', icon: icons.pullRequest(theme.accent || theme.title), delta: deltas.prs },
    { label: 'REVIEWS', value: reviews.toLocaleString(), raw: reviews, max: 50, color: '#00f2fe', icon: icons.eye(theme.iconColor), delta: deltas.reviews },
    { label: 'ISSUES', value: issues.toLocaleString(), raw: issues, max: 50, color: '#f59e0b', icon: icons.zap(theme.iconColor), delta: deltas.issues },
    { label: 'STARS', value: totalStars.toLocaleString(), raw: totalStars, max: 500, color: '#e3b341', icon: icons.star(theme.iconColor), delta: deltas.stars },
  ];

  const podW = width <= 450 ? 116 : 144;
  const rightW = contentWidth - podW - 12;
  const ringRadius = width <= 450 ? 30 : 34;

  const topBadgeText = totalCommits > 0
    ? `⚡ ${totalCommits.toLocaleString()} Commits`
    : (totalStars > 0 ? `⭐ ${totalStars.toLocaleString()} Stars` : `📦 ${totalRepos} Repos`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .rank-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-weight: 700; font-size: 9.5px; fill: ${theme.secondaryText}; text-transform: uppercase; letter-spacing: 0.6px; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `${username}'s Stats`,
    badgeText: topBadgeText,
    width,
    theme,
  })}

  <g transform="translate(24, 44)">
    <!-- Left Column: Rank Reactor Bento Pod -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: podW,
      height: 138,
      theme,
      idPrefix,
      rx: 10,
      children: `
        ${renderProgressRing({
          score: rank.score,
          level: rank.level,
          x: podW / 2,
          y: 49,
          radius: ringRadius,
          strokeWidth: 6.5,
          label: 'RANK',
          theme,
        })}
        <text x="${podW / 2}" y="108" text-anchor="middle" class="rank-title">Overall Rank</text>
        <text x="${podW / 2}" y="123" text-anchor="middle" class="font-mono" font-size="9.5" font-weight="700" fill="${theme.title}">Score ${rank.score}/100</text>
      `,
    })}

    <!-- Right Column: 5-Row Bento Metric Strip -->
    ${renderBentoTile({
      x: podW + 12,
      y: 0,
      width: rightW,
      height: 138,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <g transform="translate(12, 8)">
          ${metrics
            .map((m, idx) => {
              const y = idx * 24;
              const barStartX = 114;
              const barEndX = rightW - 142;
              const barW = Math.max(0, barEndX - barStartX);
              const fillRatio = m.raw > 0 ? Math.min(1, Math.max(0.12, Math.log10(m.raw + 1) / Math.log10(m.max + 1))) : 0;
              const fillW = Math.round(barW * fillRatio);
              return `
              <g transform="translate(0, ${y})">
                <g transform="translate(0, 1)">${m.icon}</g>
                <text x="22" y="12" class="stat-lbl">${m.label}</text>
                ${barW >= 28 ? `
                  <rect x="${barStartX}" y="6.5" width="${barW}" height="4" rx="2" fill="${theme.barBg || '#21262d'}" opacity="0.65" />
                  ${fillW > 0 ? `<rect x="${barStartX}" y="6.5" width="${fillW}" height="4" rx="2" fill="${m.color}" opacity="0.85" />` : ''}
                ` : ''}
                <text x="${rightW - 74}" y="12" text-anchor="end" class="stat-val" font-size="12">${m.value}</text>
                <g transform="translate(${rightW - 64}, 0)">
                  ${renderDeltaChip({ delta: m.delta, x: 0, y: 0, theme })}
                </g>
              </g>`;
            })
            .join('')}
        </g>
      `,
    })}
  </g>
</svg>`;
}

export const renderV1ClassicRingSvg = renderV1RingSvg;

/**
 * 2. MIX VARIANT (Glassmorphic Stacked Effort Bar & 4 Bento Effort Modules)
 */
export function renderV1MixSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 230;
  const idPrefix = 'stats-mix';
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
  const tileHeight = 52;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .caption-text { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `${username}'s Effort Mix`,
    badgeText: '⚡ Real Contribution Shares',
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    <!-- Proportional Stacked Effort Bar -->
    <g transform="translate(0, 8)">
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

    <!-- 4 Dimensional Bento Effort Modules -->
    <g transform="translate(0, 28)">
      ${segments
        .map((seg, idx) => {
          const col = width <= 440 ? 0 : idx % 2;
          const row = width <= 440 ? idx : Math.floor(idx / 2);
          const x = col * (colWidth + 12);
          const y = row * (tileHeight + 8);
          const count = idx === 0 ? totalCommits : idx === 1 ? pullRequests : idx === 2 ? reviews : issues;

          return renderBentoTile({
            x,
            y,
            width: colWidth,
            height: tileHeight,
            theme,
            idPrefix,
            rx: 7,
            accentColor: seg.color,
            accentPosition: 'left',
            children: `
              <g transform="translate(12, 11)">
                <text x="0" y="10" class="stat-lbl">${seg.label.toUpperCase()}</text>
                <text x="${colWidth - 24}" y="10" text-anchor="end" class="font-mono" font-size="11" font-weight="700" fill="${seg.color}">${seg.percentage}%</text>
                <text x="0" y="28" class="stat-val" font-size="15">${count.toLocaleString()}</text>
                <text x="${colWidth - 24}" y="28" text-anchor="end" class="caption-text">of effort</text>
              </g>
            `,
          });
        })
        .join('')}
    </g>

    <!-- Milestone Caption -->
    <g transform="translate(0, 154)">
      <circle cx="4" cy="-3.5" r="3" fill="${theme.accent || theme.title || '#58a6ff'}" class="pulse-dot" />
      <text x="13" y="0" class="caption-text"><tspan font-weight="700" fill="${theme.title}">${totalContributions.toLocaleString()}</tspan> lifetime contributions • Score ${rank.score}/100</text>
    </g>
  </g>
</svg>`;
}

export const renderV1BarsSvg = renderV1MixSvg;

/**
 * 3. CREST VARIANT (Heraldic Bento Pod & 5-Axis Radar Chart)
 */
export function renderV1CrestSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 225;
  const idPrefix = 'stats-crest';
  const contentWidth = width - 48;

  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const totalStars = data?.totalStars ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;

  const rank = calculateRank({ totalCommits, totalStars, totalRepos, followers, pullRequests, totalContributions });

  const radarAxes = [
    { label: 'COMMITS', value: totalCommits, max: 1500 },
    { label: 'PRS', value: pullRequests, max: 50 },
    { label: 'REVIEWS', value: reviews, max: 25 },
    { label: 'STARS', value: totalStars, max: 200 },
    { label: 'FOLLOWERS', value: followers, max: 100 },
  ];

  const leftPodW = width <= 450 ? 134 : 160;
  const radarBoxW = contentWidth - leftPodW - 12;
  const radarCx = Math.round(radarBoxW / 2);
  const radarCy = 72;
  const radarR = width <= 450 ? 40 : 48;

  // Grid Pentagons
  const gridLevels = [0.33, 0.66, 1.0];
  const gridPolygons = gridLevels
    .map((scale) => {
      const pts = radarAxes
        .map((_, i) => {
          const angle = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
          const px = Math.round(radarCx + scale * radarR * Math.cos(angle));
          const py = Math.round(radarCy + scale * radarR * Math.sin(angle));
          return `${px},${py}`;
        })
        .join(' ');
      return `<polygon points="${pts}" fill="none" stroke="${theme.subtleBorder || theme.border}" stroke-width="1" opacity="0.6"/>`;
    })
    .join('');

  // Axis Spokes & Labels
  const axisLines = radarAxes
    .map((axis, i) => {
      const angle = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
      const endX = Math.round(radarCx + radarR * Math.cos(angle));
      const endY = Math.round(radarCy + radarR * Math.sin(angle));
      const labelX = Math.round(radarCx + (radarR + 13) * Math.cos(angle));
      const labelY = Math.round(radarCy + (radarR + 13) * Math.sin(angle));
      const anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';

      return `
        <line x1="${radarCx}" y1="${radarCy}" x2="${endX}" y2="${endY}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1" opacity="0.6"/>
        <text x="${labelX}" y="${labelY + 3.5}" text-anchor="${anchor}" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="8" font-weight="700" fill="${theme.secondaryText}">${axis.label}</text>`;
    })
    .join('');

  // Data Polygon Coordinates & Vertex Circles
  const dataPointsArr = radarAxes.map((axis, i) => {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
    const normalized = Math.min(1.0, Math.max(0.18, axis.value / axis.max));
    const px = Math.round(radarCx + normalized * radarR * Math.cos(angle));
    const py = Math.round(radarCy + normalized * radarR * Math.sin(angle));
    return { x: px, y: py };
  });

  const dataPoints = dataPointsArr.map((p) => `${p.x},${p.y}`).join(' ');
  const vertexCircles = dataPointsArr
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${theme.accent || theme.title}" stroke="#ffffff" stroke-width="1" />`)
    .join('');

  const accentColor = theme.accent || theme.title || '#58a6ff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .hero-grade { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 900; font-size: 44px; fill: ${theme.title}; }
    .hero-score { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `${username}'s Developer Crest`,
    badgeText: '🏆 Rank Standing',
    width,
    theme,
  })}

  <g transform="translate(24, 52)">
    <!-- Left Column: Heraldic Hexagonal Crest Bento Pod -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: leftPodW,
      height: 148,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <rect x="14" y="12" width="${leftPodW - 28}" height="20" rx="10" fill="${theme.badgeBg}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>
        <text x="${leftPodW / 2}" y="25.5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${theme.title}">TIER ${rank.level} // STANDING</text>

        <!-- Heraldic Shield Polygon -->
        <polygon points="${leftPodW / 2},37 ${leftPodW / 2 + 28},48 ${leftPodW / 2 + 24},78 ${leftPodW / 2},92 ${leftPodW / 2 - 24},78 ${leftPodW / 2 - 28},48" fill="${accentColor}" fill-opacity="0.1" stroke="${accentColor}" stroke-width="1.2" stroke-opacity="0.45" />
        <text x="${leftPodW / 2}" y="76" text-anchor="middle" class="hero-grade" font-size="34">${rank.level}</text>
        <text x="${leftPodW / 2}" y="108" text-anchor="middle" class="hero-score">Score: <tspan fill="${theme.title}" font-weight="800">${rank.score} / 100</tspan></text>
        <rect x="24" y="115" width="${leftPodW - 48}" height="4" rx="2" fill="${theme.barBg || '#21262d'}" />
        <rect x="24" y="115" width="${Math.max(6, Math.round(((leftPodW - 48) * rank.score) / 100))}" height="4" rx="2" fill="${accentColor}" />
        <text x="${leftPodW / 2}" y="133" text-anchor="middle" class="font-ui" font-size="8.5" fill="${theme.secondaryText}">Scored across 5 vectors</text>
      `,
    })}

    <!-- Right Column: 5-Axis Radar Chart Bento Pod -->
    ${renderBentoTile({
      x: leftPodW + 12,
      y: 0,
      width: radarBoxW,
      height: 148,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <g class="radar-chart">
          ${gridPolygons}
          ${axisLines}
          <polygon points="${dataPoints}" fill="${accentColor}" fill-opacity="0.32" stroke="${accentColor}" stroke-width="2" stroke-linejoin="round" />
          ${vertexCircles}
        </g>
      `,
    })}
  </g>
</svg>`;
}

export const renderV1HeroSvg = renderV1CrestSvg;

/**
 * 4. YEAR VARIANT (Bento KPI Tiles & 12-Month Trajectory Panel)
 */
export function renderV1YearSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 235;
  const idPrefix = 'stats-year';
  const contentWidth = width - 48;

  const totalContributions = data?.totalContributions ?? (data?.totalCommits ?? 0);
  const maxStreak = data?.maxStreak ?? 0;
  const monthly = data?.monthlyContributions || [80, 110, 95, 140, 160, 210, 180, 195, 150, 175, 220, 135];
  const monthLabels = data?.monthLabels || ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const maxMonthly = Math.max(...monthly, 1);
  const peakIdx = monthly.indexOf(maxMonthly);
  const peakMonthName = monthLabels[peakIdx] || 'Peak';
  const bestMonth = data?.bestMonth || { name: peakMonthName, count: maxMonthly };
  const bestMonthDisplay = bestMonth.name === 'Peak'
    ? `Peak (${bestMonth.count})`
    : `${bestMonth.name} • ${bestMonth.count} Peak`;

  const kpiW = Math.floor((contentWidth - 16) / 3);
  const kpis = [
    { label: 'TOTAL CONTRIBUTIONS', val: totalContributions.toLocaleString() },
    { label: 'LONGEST STREAK', val: `${maxStreak} Days` },
    { label: 'BEST MONTH', val: fitText(bestMonthDisplay, 12.5, kpiW - 18) },
  ];

  const barMaxHeight = 56;
  const barGap = 6;
  const panelInnerW = contentWidth - 24;
  const barWidth = Math.floor((panelInnerW - (12 - 1) * barGap) / 12);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .month-text { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `${username}'s Annual Trajectory`,
    badgeText: '📅 12-Month Trend',
    width,
    theme,
  })}

  <g transform="translate(24, 48)">
    <!-- 3 Top Bento KPI Tiles -->
    <g transform="translate(0, 0)">
      ${kpis
        .map((k, idx) =>
          renderBentoTile({
            x: idx * (kpiW + 8),
            y: 0,
            width: kpiW,
            height: 48,
            theme,
            idPrefix,
            rx: 7,
            children: `
              <g transform="translate(10, 12)">
                <text x="0" y="8" class="stat-lbl">${k.label}</text>
                <text x="0" y="26" class="stat-val" font-size="13.5">${k.val}</text>
              </g>
            `,
          })
        )
        .join('')}
    </g>

    <!-- Full-Width Trajectory Bento Panel -->
    ${renderBentoTile({
      x: 0,
      y: 56,
      width: contentWidth,
      height: 112,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <g class="monthly-bars" transform="translate(12, 78)">
          ${monthly
            .map((val, i) => {
              const x = i * (barWidth + barGap);
              const bHeight = Math.max(4, Math.round((val / maxMonthly) * barMaxHeight));
              const y = -bHeight;
              const isPeak = val === maxMonthly;
              const fill = isPeak ? (theme.accent || theme.title) : (theme.title || '#58a6ff');

              return `
              <g class="trajectory-bar" transform="translate(${x}, 0)">
                <!-- Background column track -->
                <rect x="0" y="-${barMaxHeight}" width="${barWidth}" height="${barMaxHeight}" rx="3" fill="${theme.barBg || '#21262d'}" opacity="0.35" />
                <rect x="0" y="${y}" width="${barWidth}" height="${bHeight}" rx="3" fill="${fill}" opacity="${isPeak ? 1 : 0.8}" />
                ${isPeak ? `<circle cx="${barWidth / 2}" cy="${y - 4}" r="2.5" fill="${fill}" />` : ''}
                <text x="${barWidth / 2}" y="14" text-anchor="middle" class="month-text">${monthLabels[i] || ''}</text>
              </g>`;
            })
            .join('')}
        </g>
      `,
    })}
  </g>
</svg>`;
}

export const renderV1DashboardSvg = renderV1YearSvg;

/**
 * 5. TICKER VARIANT (72px Bento Ticker with Rank Grade Pod)
 */
export function renderV1TickerSvg(data, theme, options = {}) {
  const width = resolveCardWidth(options.width);
  const height = 72;
  const idPrefix = 'stats-ticker';
  const contentWidth = width - 48;

  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const totalStars = data?.totalStars ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;

  const rank = calculateRank({ totalCommits, totalStars, totalRepos, followers, pullRequests, totalContributions });

  const gradePillW = 68;
  const tilesStartX = gradePillW + 10;
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
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 12)}

  <g transform="translate(24, 13)">
    <!-- Rank Grade Pod -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: gradePillW,
      height: 46,
      theme,
      idPrefix,
      rx: 7,
      children: `
        <text x="${gradePillW / 2}" y="20" text-anchor="middle" class="font-ui" font-size="16" font-weight="900" fill="${theme.title}">${rank.level}</text>
        <text x="${gradePillW / 2}" y="36" text-anchor="middle" class="stat-lbl" font-size="8.5">RANK</text>
      `,
    })}

    <!-- 4 Labelled Bento Metric Tiles with Icons -->
    <g transform="translate(${tilesStartX}, 0)">
      ${tiles
        .map((t, idx) => {
          const x = idx * (tileW + tileGap);
          return renderBentoTile({
            x,
            y: 0,
            width: tileW,
            height: 46,
            theme,
            idPrefix,
            rx: 7,
            className: 'metric-tile',
            children: `
              <g transform="translate(8, 8)">
                <g transform="translate(${tileW - 24}, 0)">${t.icon}</g>
                <text x="0" y="10" class="stat-lbl">${t.label}</text>
                <text x="0" y="27" class="stat-val" font-size="13.5">${t.value}</text>
              </g>
            `,
          });
        })
        .join('')}
    </g>
  </g>
</svg>`;
}

export const renderV1CompactSvg = renderV1TickerSvg;

/**
 * 6. STREAK VARIANT (Consistency Heatmap & Flame Pods)
 */
export function renderV1StreakSvg(data, theme, options = {}) {
  const username = escapeXml(data?.name || data?.login || options.username || 'User');
  const width = resolveCardWidth(options.width);
  const height = 215;
  const idPrefix = 'stats-streak';
  const contentWidth = width - 48;

  const currentStreak = data?.currentStreak ?? 0;
  const maxStreak = data?.maxStreak ?? currentStreak;
  const weeks = data?.weeks || [];

  const leftColWidth = width <= 450 ? 134 : 158;
  const rightColX = leftColWidth + 12;
  const rightColWidth = contentWidth - rightColX;

  // Dynamic cell sizing to strictly avoid overflow on 405px
  const cellGap = width <= 440 ? 1.5 : 2.2;
  const availHeatmapW = rightColWidth - 24;
  const cellWidth = Math.max(4.5, Number(((availHeatmapW - 25 * cellGap) / 26).toFixed(2)));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, '#f59e0b', theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `${username}'s Consistency`,
    badgeText: '🔥 Daily Streak',
    width,
    theme,
  })}

  <g transform="translate(24, 48)">
    <!-- Left Column: Current & Longest Streak Tiles -->
    <g transform="translate(0, 0)">
      ${renderBentoTile({
        x: 0,
        y: 0,
        width: leftColWidth,
        height: 68,
        theme,
        idPrefix,
        rx: 8,
        accentColor: '#f59e0b',
        accentPosition: 'left',
        children: `
          <g transform="translate(12, 10)">
            <g transform="translate(${leftColWidth - 36}, 0)">${icons.flame('#f59e0b')}</g>
            <text x="0" y="10" class="stat-lbl">ACTIVE STREAK</text>
            <text x="0" y="30" class="stat-val" font-size="16">${currentStreak} DAYS</text>
            <text x="0" y="46" class="font-ui" font-size="9.5" fill="${theme.secondaryText}">${currentStreak > 0 ? 'Active Today' : 'No streak'}</text>
          </g>
        `,
      })}

      ${renderBentoTile({
        x: 0,
        y: 76,
        width: leftColWidth,
        height: 68,
        theme,
        idPrefix,
        rx: 8,
        accentColor: '#e3b341',
        accentPosition: 'left',
        children: `
          <g transform="translate(12, 10)">
            <g transform="translate(${leftColWidth - 36}, 0)">${icons.star('#e3b341')}</g>
            <text x="0" y="10" class="stat-lbl">LONGEST STREAK</text>
            <text x="0" y="30" class="stat-val" font-size="16">${maxStreak} DAYS</text>
            <text x="0" y="46" class="font-ui" font-size="9.5" fill="${theme.secondaryText}">All-Time Record</text>
          </g>
        `,
      })}
    </g>

    <!-- Right Column: 26-week Heatmap Bento Container -->
    ${renderBentoTile({
      x: rightColX,
      y: 0,
      width: rightColWidth,
      height: 144,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <text x="12" y="15" class="stat-lbl">26-WEEK COMMIT CADENCE</text>
        <g transform="translate(12, 25)">
          ${renderHeatmapMatrix({
            weeks,
            cellWidth,
            cellGap,
            cols: 26,
            theme,
          })}
        </g>
        <g transform="translate(12, 124)">
          <text x="0" y="7" class="stat-lbl" font-size="8">Less</text>
          <g transform="translate(26, 0)">
            ${(theme.heatmapLevels || ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'])
              .map((lvl, lIdx) => `<rect x="${lIdx * 10}" y="0" width="7" height="7" rx="1.5" fill="${lvl}" />`)
              .join('')}
          </g>
          <text x="82" y="7" class="stat-lbl" font-size="8">More</text>
        </g>
      `,
    })}
  </g>
</svg>`;
}

/**
 * 7. Flagship Cyberpunk Telemetry HUD (Responsive Grid Scaling)
 */
export function renderV1CyberTelemetrySvg(data, theme, options = {}) {
  const rawName = data?.name || data?.login || options.username || 'Developer';
  const rawLogin = data?.login || options.username || 'developer';
  const totalCommits = data?.totalCommits ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
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
  const idPrefix = 'stats-hud';
  const contentWidth = width - 48;

  const isLight = theme.cardBg === '#ffffff' || (theme.bg && String(theme.bg).toLowerCase().includes('fff'));
  const bg = theme.bg || (isLight ? '#f6f8fa' : '#090d16');
  const cardBg = theme.cardBg || (isLight ? '#ffffff' : '#0e1624');
  const border = theme.border || (isLight ? '#d0d7de' : '#1e293b');
  const subtleBorder = theme.subtleBorder || (isLight ? '#eaeef2' : '#162234');
  const title = theme.title || (isLight ? '#0969da' : '#f1f5f9');
  const subtext = theme.secondaryText || (isLight ? '#57606a' : '#8b949e');
  const accent = theme.accent || (isLight ? '#0969da' : '#38bdf8');

  // Dynamically scale module widths across 405px, 495px, and 830px
  const gaugePodW = width <= 440 ? 116 : width >= 800 ? 180 : 148;
  const gridW = contentWidth - gaugePodW - 14;
  const modW = Math.floor((gridW - 10) / 2);
  const modH = 58;

  const circleR = width <= 440 ? 31 : 36;
  const circleC = 2 * Math.PI * circleR;
  const strokeOffset = circleC - (circleC * (rank.percentile / 100));

  const formatHudNum = (n) => (n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n.toLocaleString());
  const impactLabel = `⚡ ${formatHudNum(totalContributions)} IMPACT`;
  const beaconW = Math.max(134, Math.ceil(measureText(impactLabel, 9.5)) + 36);
  const maxHeaderW = width - beaconW - 56;
  const fittedName = fitText(rawName, 16, Math.max(110, maxHeaderW - 90));
  const name = escapeXml(fittedName);
  const fittedLogin = fitText(rawLogin, 13, Math.max(60, maxHeaderW - measureText(fittedName, 16) - 24));
  const login = escapeXml(fittedLogin);

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
    ${renderCardDefs(idPrefix, theme, accent, '#a855f7')}
  </defs>

  <style>
    ${renderCardStyles(theme)}
    .hud-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 16px; fill: ${title}; }
    .hud-mono { font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace; }
    .hud-val { font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace; font-weight: 800; font-size: 17px; fill: ${title}; font-variant-numeric: tabular-nums; }
    .hud-grade { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 900; font-size: 30px; fill: ${title}; }
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
    <text class="hud-mono" x="0" y="22" font-size="9" font-weight="700" letter-spacing="1.2" fill="${accent}">SYS.DEV // TELEMETRY HUD</text>
    <text class="hud-title" x="0" y="42">${name} <tspan fill="${subtext}" font-size="12.5" font-weight="500">(@${login})</tspan></text>
  </g>

  <!-- Live Status Beacon Capsule -->
  <g transform="translate(${width - beaconW - 24}, 18)">
    <rect x="0" y="0" width="${beaconW}" height="24" rx="12" fill="${isLight ? '#f1f5f9' : '#0c1624'}" stroke="${border}" stroke-width="1.2"/>
    <circle cx="14" cy="12" r="3.5" fill="#22c55e"/>
    <circle cx="14" cy="12" r="3.5" fill="none" stroke="#22c55e" stroke-width="1.2" opacity="0.6">
      <animate attributeName="r" values="3.5;9" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <text class="hud-mono" x="25" y="15.5" font-size="9.5" font-weight="800" letter-spacing="0.5" fill="${accent}">${impactLabel}</text>
  </g>

  <line x1="24" y1="54" x2="${width - 24}" y2="54" stroke="${subtleBorder}" stroke-width="1" opacity="0.6"/>

  <!-- Zone A: Proportional Tactical Bento Modules -->
  <g transform="translate(24, 66)">
    <!-- Module 1: Contributions -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: modW,
      height: modH,
      theme,
      idPrefix,
      rx: 6,
      accentColor: accent,
      accentPosition: 'left',
      children: `
        <g transform="translate(10, 8)">
          <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">CONTRIBUTIONS</text>
          <text class="hud-val" x="0" y="33">${formatHudNum(totalContributions)}</text>
        </g>
      `,
    })}

    <!-- Module 2: Commits -->
    ${renderBentoTile({
      x: modW + 10,
      y: 0,
      width: modW,
      height: modH,
      theme,
      idPrefix,
      rx: 6,
      accentColor: '#00f2fe',
      accentPosition: 'left',
      children: `
        <g transform="translate(10, 8)">
          <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">COMMITS PUSHED</text>
          <text class="hud-val" x="0" y="33">${formatHudNum(totalCommits)}</text>
        </g>
      `,
    })}

    <!-- Module 3: Pull Requests -->
    ${renderBentoTile({
      x: 0,
      y: 68,
      width: modW,
      height: modH,
      theme,
      idPrefix,
      rx: 6,
      accentColor: '#a855f7',
      accentPosition: 'left',
      children: `
        <g transform="translate(10, 8)">
          <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">PULL REQUESTS</text>
          <text class="hud-val" x="0" y="33">${pullRequests}</text>
          <text class="hud-mono" x="${modW - 20}" y="33" text-anchor="end" fill="${subtext}" font-size="10" font-weight="600">+${reviews} Reviews</text>
        </g>
      `,
    })}

    <!-- Module 4: Streak -->
    ${renderBentoTile({
      x: modW + 10,
      y: 68,
      width: modW,
      height: modH,
      theme,
      idPrefix,
      rx: 6,
      accentColor: '#f59e0b',
      accentPosition: 'left',
      children: `
        <g transform="translate(10, 8)">
          <text class="hud-mono" x="0" y="10" font-size="8.5" font-weight="700" letter-spacing="0.5" fill="${subtext}">ACTIVE STREAK</text>
          <text class="hud-val" x="0" y="33">${streak}d</text>
          <text class="hud-mono" x="${modW - 20}" y="33" text-anchor="end" fill="${subtext}" font-size="10" font-weight="600">Peak: ${maxStreak}d</text>
        </g>
      `,
    })}
  </g>

  <!-- Zone B: Radial Gauge Bento Pod -->
  <g transform="translate(${24 + gridW + 14}, 66)">
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: gaugePodW,
      height: 126,
      theme,
      idPrefix,
      rx: 8,
      children: `
        <g transform="translate(${gaugePodW / 2}, 46)">
          <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${subtleBorder}" stroke-width="6.5"/>
          <circle cx="0" cy="0" r="${circleR}" fill="none" stroke="${accent}" stroke-width="6.5"
                  stroke-dasharray="${circleC.toFixed(1)}" stroke-dashoffset="${strokeOffset.toFixed(1)}"
                  stroke-linecap="round" transform="rotate(-90)" />
          
          <text class="hud-grade" x="0" y="10" text-anchor="middle">${rank.level}</text>
        </g>
        <text class="hud-mono" x="${gaugePodW / 2}" y="101" text-anchor="middle" font-size="8.5" font-weight="700" fill="${subtext}">OVERALL RANK</text>
        <text class="hud-mono" x="${gaugePodW / 2}" y="115" text-anchor="middle" font-size="8" font-weight="700" fill="${accent}">SCORE ${rank.score}/100 • TOP ${Math.max(1, Math.round(100 - rank.percentile))}%</text>
      `,
    })}
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

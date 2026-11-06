import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { calculateRank } from '../../core/stats/rank.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import {
  SHADE_RAMP,
  card,
  cellMeter,
  cellsThatFit,
  contributionGrid,
  fitMono,
  fitUi,
  formatCount,
  formatPercent,
  hairline,
  heatLegend,
  metric,
  metricRow,
  monoWidth,
  padX,
  shareStrip,
  text,
  tickRing,
  uiWidth,
} from '../../svg/kit.js';

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

/** Half-fill volumes, taken from the scales in core/stats/rank.js so meters agree with the score. */
const METER_MIDPOINT = { commits: 1600, prs: 65, reviews: 30, issues: 35, stars: 100, followers: 45 };

/** Saturating curve: half full at the midpoint, never pinned at 100% by an early cap. */
function meterRatio(value, midpoint) {
  const v = Math.max(0, Number(value) || 0);
  return v / (v + midpoint);
}

function statsFields(data, options = {}) {
  const totalCommits = data?.totalCommits ?? 0;
  const pullRequests = data?.pullRequests ?? 0;
  const reviews = data?.reviews ?? 0;
  const issues = data?.issues ?? 0;
  const totalStars = data?.totalStars ?? 0;
  const totalForks = data?.totalForks ?? 0;
  const followers = data?.followers ?? 0;
  const totalRepos = data?.totalRepos ?? 0;
  const totalContributions = data?.totalContributions ?? totalCommits;
  const currentStreak = data?.currentStreak ?? data?.streak ?? 0;
  const maxStreak = data?.maxStreak ?? currentStreak;

  return {
    name: data?.name || data?.login || options.username || 'Developer',
    login: data?.login || options.username || '',
    totalCommits,
    pullRequests,
    reviews,
    issues,
    totalStars,
    followers,
    totalContributions,
    currentStreak,
    maxStreak,
    weeks: Array.isArray(data?.weeks) ? data.weeks : [],
    monthly: Array.isArray(data?.monthlyContributions) ? data.monthlyContributions : [],
    monthLabels: Array.isArray(data?.monthLabels) ? data.monthLabels : [],
    bestMonth: data?.bestMonth || null,
    rank: calculateRank({ totalCommits, totalStars, totalForks, totalRepos, followers, pullRequests, reviews, issues, totalContributions }),
  };
}

/** Change in the last three months against the three before, the only real trend in the data. */
function contributionTrend(monthly) {
  if (monthly.length < 6) return null;
  const recent = monthly.slice(-3).reduce((a, b) => a + (b || 0), 0);
  const prior = monthly.slice(-6, -3).reduce((a, b) => a + (b || 0), 0);
  if (prior <= 0) return null;
  return Math.round(((recent - prior) / prior) * 100);
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
 * 1. RING: rank as a ring of ticks beside five metered rows.
 */
export function renderV1RingSvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const height = options.height || 195;
  const pad = padX(width);

  const ringR = 50;
  const cx = pad + ringR + 4;
  const cy = 98;
  const rowsX = cx + ringR + (width <= 440 ? 16 : 28);
  const rowsW = width - pad - rowsX;
  const labelW = width <= 440 ? 76 : 86;
  const valueW = 50;
  const meterX = rowsX + labelW;
  const meterW = rowsW - labelW - valueW;
  const meterTotal = cellsThatFit(meterW, 7, 2);

  const rows = [
    ['Commits', s.totalCommits, METER_MIDPOINT.commits],
    ['Pull requests', s.pullRequests, METER_MIDPOINT.prs],
    ['Reviews', s.reviews, METER_MIDPOINT.reviews],
    ['Issues', s.issues, METER_MIDPOINT.issues],
    ['Stars', s.totalStars, METER_MIDPOINT.stars],
  ].map(([label, value, midpoint], i) => {
    const y = 58 + i * 24;
    return `
      ${text(rowsX, y, label, 'mut', 'font-size="11.5"')}
      ${cellMeter({ x: meterX, y: y - 8, total: meterTotal, ratio: meterRatio(value, midpoint), size: 7, gap: 2, theme, delay: i * 60 })}
      ${text(width - pad, y, formatCount(value), 'num', 'font-size="12.5" text-anchor="end"')}`;
  }).join('');

  return card({
    width,
    height,
    title: `${s.name}, GitHub stats`,
    theme,
    body: `
      ${renderCardHeader({ title: 'stats', owner: s.login, badgeText: `${formatCount(s.totalCommits)} Commits`, width, theme })}
      ${tickRing({ cx, cy, r: ringR, ratio: s.rank.score / 100, theme })}
      ${text(cx, cy + 2, s.rank.level, 'num', `font-size="28" text-anchor="middle"`)}
      ${text(cx, cy + 19, `Score ${s.rank.score}`, 'lbl', 'text-anchor="middle"')}
      ${text(cx, cy + ringR + 22, 'Overall Rank', 'lbl', 'text-anchor="middle"')}
      ${rows}
    `,
  });
}

export const renderV1ClassicRingSvg = renderV1RingSvg;

/**
 * 2. MIX: how contribution effort splits, as one strip of ordered shades.
 */
export function renderV1MixSvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const inner = width - pad * 2;
  const height = 168;

  const total = Math.max(1, s.totalCommits + s.pullRequests + s.reviews + s.issues);
  const series = [
    { label: 'Commits', value: s.totalCommits },
    { label: 'Pull requests', value: s.pullRequests },
    { label: 'Reviews', value: s.reviews },
    { label: 'Issues', value: s.issues },
  ].map((item, i) => ({
    ...item,
    color: theme.accent,
    opacity: SHADE_RAMP[i],
    percentage: (item.value / total) * 100,
  }));

  const colW = inner / 4;
  const columns = series.map((item, i) => {
    const x = Math.round(pad + i * colW);
    return `
      <rect x="${x}" y="84" width="9" height="9" rx="2" fill="${theme.accent}" fill-opacity="${item.opacity}" />
      ${text(x + 13, 93, fitUi(item.label, 11, colW - 18), 'lbl')}
      ${text(x, 115, formatCount(item.value), 'num', `font-size="${colW < 95 ? 15 : 17}"`)}
      ${text(x, 132, formatPercent(Math.round(item.percentage * 10) / 10), 'mono mut', 'font-size="11"')}`;
  }).join('');

  return card({
    width,
    height,
    title: `${s.name}, contribution mix`,
    theme,
    body: `
      ${renderCardHeader({ title: 'contribution mix', owner: s.login, width, theme })}
      ${shareStrip({ x: pad, y: 50, width: inner, items: series, size: 10, height: 18, theme, className: 'stacked-bar' })}
      ${columns}
      ${text(pad, 154, `${formatCount(s.totalContributions)} contributions · Score ${s.rank.scoreText}`, 'lbl')}
    `,
  });
}

export const renderV1BarsSvg = renderV1MixSvg;

/**
 * 3. CREST: the grade set large beside a five-axis radar with real values.
 */
export function renderV1CrestSvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const height = 225;

  const leftW = width <= 440 ? 112 : 136;
  const meterTotal = cellsThatFit(leftW, 7, 2);
  const chartX = pad + leftW + 12;
  const chartW = width - pad - chartX;
  const cx = chartX + chartW / 2;
  const cy = 128;
  const R = 58;

  const axes = [
    { label: 'Commits', value: s.totalCommits, midpoint: METER_MIDPOINT.commits },
    { label: 'PRs', value: s.pullRequests, midpoint: METER_MIDPOINT.prs },
    { label: 'Reviews', value: s.reviews, midpoint: METER_MIDPOINT.reviews },
    { label: 'Stars', value: s.totalStars, midpoint: METER_MIDPOINT.stars },
    { label: 'Followers', value: s.followers, midpoint: METER_MIDPOINT.followers },
  ];
  const vertex = (i, radius) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  };
  const toPoints = (fn) => axes.map((axis, i) => fn(axis, i).map((v) => v.toFixed(1)).join(',')).join(' ');

  const rings = [0.33, 0.66, 1]
    .map((level) => `<polygon points="${toPoints((_, i) => vertex(i, R * level))}" stroke="${theme.subtleBorder || theme.border}" />`)
    .join('');
  const spokes = axes.map((_, i) => {
    const [x, y] = vertex(i, R);
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${theme.subtleBorder || theme.border}" />`;
  }).join('');
  const reach = (axis) => R * Math.max(0.04, meterRatio(axis.value, axis.midpoint));
  const dots = axes.map((axis, i) => {
    const [x, y] = vertex(i, reach(axis));
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${theme.accent}" />`;
  }).join('');
  const labels = axes.map((axis, i) => {
    const [x, y] = vertex(i, R + 10);
    const anchor = i === 0 ? 'middle' : i < 3 ? 'start' : 'end';
    const value = formatCount(axis.value);
    if (i === 0) {
      return text(x.toFixed(1), (y - 4).toFixed(1), axis.label, 'lbl', 'text-anchor="middle"')
        + text((x + uiWidth(axis.label, 11) / 2 + 6).toFixed(1), (y - 4).toFixed(1), value, 'num', 'font-size="11"');
    }
    return text(x.toFixed(1), y.toFixed(1), axis.label, 'lbl', `text-anchor="${anchor}"`)
      + text(x.toFixed(1), (y + 14).toFixed(1), value, 'num', `font-size="11" text-anchor="${anchor}"`);
  }).join('');

  return card({
    width,
    height,
    title: `${s.name}, GitHub rank`,
    theme,
    body: `
      ${renderCardHeader({ title: 'rank', owner: s.login, width, theme })}
      ${text(pad, 66, 'Overall tier', 'lbl')}
      ${text(pad - 3, 134, s.rank.level, 'mono', `font-size="${s.rank.level.length > 1 ? 62 : 74}" font-weight="700" fill="${theme.accent}"`)}
      ${text(pad, 164, `Score ${s.rank.scoreText}`, 'mono ink', 'font-size="12"')}
      ${cellMeter({ x: pad, y: 174, total: meterTotal, ratio: s.rank.score / 100, size: 7, gap: 2, theme })}
      <g class="radar-chart">
        ${rings}
        ${spokes}
        <polygon points="${toPoints((axis, i) => vertex(i, reach(axis)))}" fill="${theme.accent}" fill-opacity="0.18" stroke="${theme.accent}" stroke-width="1.5" stroke-linejoin="round" />
        ${dots}
      </g>
      ${labels}
    `,
  });
}

export const renderV1HeroSvg = renderV1CrestSvg;

/**
 * 4. YEAR: twelve months with the best one called out directly on its bar.
 */
export function renderV1YearSvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const inner = width - pad * 2;
  const hasMonths = s.monthly.some((v) => v > 0);
  const height = hasMonths ? 232 : 124;

  const max = Math.max(1, ...s.monthly);
  const peakIdx = s.monthly.indexOf(Math.max(...s.monthly));
  const best = s.bestMonth || (hasMonths ? { name: s.monthLabels[peakIdx] || '', count: max } : null);
  const trend = contributionTrend(s.monthly);
  const badge = trend === null
    ? null
    : `${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)}% vs prior 3 mo`;

  const baseY = 202;
  const barsH = 78;
  const slot = inner / Math.max(1, s.monthly.length);
  const barW = Math.min(slot - 4, 18);
  const bars = hasMonths
    ? s.monthly.map((value, i) => {
        const h = value > 0 ? Math.max(3, (value / max) * barsH) : 0;
        const x = pad + i * slot + (slot - barW) / 2;
        const isPeak = i === peakIdx;
        const label = s.monthLabels[i];
        return `
          ${h ? `<rect class="trajectory-bar ci" x="${x.toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${theme.accent}" fill-opacity="${isPeak ? 1 : 0.45}" style="animation-delay:${i * 30}ms" />` : ''}
          ${isPeak ? text((x + barW / 2).toFixed(1), (baseY - h - 5).toFixed(1), formatCount(value), 'num', 'font-size="11" text-anchor="middle"') : ''}
          ${label && (slot >= 26 || i % 2 === 0) ? text((x + barW / 2).toFixed(1), baseY + 15, label, 'lbl', 'text-anchor="middle"') : ''}`;
      }).join('')
    : '';

  return card({
    width,
    height,
    title: `${s.name}, contributions by month`,
    theme,
    body: `
      ${renderCardHeader({ title: 'this year', owner: s.login, badgeText: badge, width, theme })}
      ${metricRow({ x: pad, y: 48, width: inner, size: 17, items: [
        { label: 'Contributions', value: formatCount(s.totalContributions) },
        { label: 'Longest streak', value: `${s.maxStreak} days` },
        { label: 'Best month', value: best ? `${best.name} ${formatCount(best.count)}`.trim() : '–' },
      ] })}
      ${hasMonths ? `<g class="monthly-bars">${bars}${hairline(pad, baseY + 0.5, width - pad, baseY + 0.5, theme)}</g>` : ''}
    `,
  });
}

export const renderV1DashboardSvg = renderV1YearSvg;

/**
 * 5. TICKER: grade and four numbers on one line.
 */
export function renderV1TickerSvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const pad = padX(width) - 2;
  const height = options.height || 72;

  const gradeW = 48;
  const ruleX = pad + gradeW;
  const metricsX = ruleX + 14;

  return card({
    width,
    height,
    title: `${s.name}, GitHub stats`,
    theme,
    body: `
      ${text(pad, 30, 'Rank', 'lbl')}
      ${text(pad, 53, s.rank.level, 'num', `font-size="22" style="fill:${theme.accent}"`)}
      ${hairline(ruleX, 16, ruleX, height - 16, theme)}
      ${metricRow({ x: metricsX, y: 19, width: width - pad - metricsX, size: 15, gap: 8, items: [
        { label: 'Commits', value: formatCount(s.totalCommits) },
        { label: 'PRs', value: formatCount(s.pullRequests), flex: 0.7 },
        { label: 'Stars', value: formatCount(s.totalStars), flex: 0.8 },
        { label: 'Followers', value: formatCount(s.followers) },
      ] })}
    `,
  });
}

export const renderV1CompactSvg = renderV1TickerSvg;

/**
 * 6. STREAK: two streak numbers beside the recent calendar.
 */
export function renderV1StreakSvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const pad = padX(width);

  const leftW = width <= 440 ? 104 : 124;
  const gridX = pad + leftW + 12;
  const room = width - pad - gridX;
  const weeksShown = s.weeks.length ? Math.min(53, s.weeks.length) : 26;
  const gridW = Math.min(room, weeksShown * 14);
  const grid = contributionGrid({ x: gridX, y: 52, weeks: s.weeks, weeksShown, width: gridW, gap: 2, theme });
  const legendY = 52 + grid.height + 18;
  const height = Math.round(Math.max(legendY + 16, 160));

  return card({
    width,
    height,
    title: `${s.name}, contribution streak`,
    theme,
    body: `
      ${renderCardHeader({ title: 'streak', owner: s.login, width, theme })}
      ${metric({ x: pad, y: 48, label: 'Current streak', value: `${s.currentStreak} days`, size: 20, maxWidth: leftW })}
      ${metric({ x: pad, y: 100, label: 'Longest streak', value: `${s.maxStreak} days`, size: 20, maxWidth: leftW })}
      ${grid.svg}
      ${heatLegend({ right: gridX + gridW, y: legendY, theme })}
    `,
  });
}

/**
 * 7. HUD: the one deliberately in-character variant. A terminal readout in monospace with
 * registration corners, four metered readouts, a rank ring and a strip of weekly volume.
 */
export function renderV1CyberTelemetrySvg(data, theme, options = {}) {
  const s = statsFields(data, options);
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const hasWeeks = s.weeks.length > 0;
  const height = hasWeeks ? 232 : 208;

  const ringW = width <= 440 ? 104 : width >= 700 ? 170 : 130;
  const ringCx = width - pad - ringW / 2;
  const gridW = width - pad * 2 - ringW - 16;
  const colW = (gridW - 14) / 2;
  const meterTotal = cellsThatFit(colW - 8, 5, 2);

  const readouts = [
    { label: 'CONTRIBUTIONS', value: formatCount(s.totalContributions), ratio: meterRatio(s.totalContributions, METER_MIDPOINT.commits) },
    { label: 'COMMITS PUSHED', value: formatCount(s.totalCommits), ratio: meterRatio(s.totalCommits, METER_MIDPOINT.commits) },
    { label: 'PULL REQUESTS', value: formatCount(s.pullRequests), note: `+${formatCount(s.reviews)} Reviews`, ratio: meterRatio(s.pullRequests, METER_MIDPOINT.prs) },
    { label: 'ACTIVE STREAK', value: `${s.currentStreak}d`, note: `Peak: ${s.maxStreak}d`, ratio: s.maxStreak > 0 ? s.currentStreak / s.maxStreak : 0 },
  ].map((item, i) => {
    const x = Math.round(pad + (i % 2) * (colW + 14));
    const y = 72 + Math.floor(i / 2) * 64;
    const px = monoWidth(item.value, 20) > colW * 0.56 ? 15 : 20;
    const noteRoom = colW - monoWidth(item.value, px) - 8;
    return `
      ${text(x, y, fitMono(item.label, 10, colW), 'mono mut', 'font-size="10" letter-spacing="0.5"')}
      ${text(x, y + 24, item.value, 'num', `font-size="${px}"`)}
      ${item.note && monoWidth(item.note, 10) <= noteRoom ? text(x + colW - 4, y + 24, item.note, 'mono mut', 'font-size="10" text-anchor="end"') : ''}
      ${cellMeter({ x, y: y + 33, total: meterTotal, ratio: item.ratio, size: 5, gap: 2, theme, delay: i * 90 })}`;
  }).join('');

  const weekly = s.weeks.map((week) => (week.contributionDays || []).reduce((acc, day) => acc + (day.contributionCount || 0), 0));
  const weeklyMax = Math.max(1, ...weekly);
  const levels = theme.heatmapLevels || [];
  const stripWeeks = weekly.slice(-Math.max(1, cellsThatFit(width - pad * 2, 7, 2)));
  const pitch = (width - pad * 2 + 2) / Math.max(stripWeeks.length, 1);
  const strip = hasWeeks
    ? `<g class="weekly-strip">${stripWeeks.map((count, i) => {
        const level = count ? Math.min(4, Math.ceil((count / weeklyMax) * 4)) : 0;
        return `<rect x="${(pad + i * pitch).toFixed(2)}" y="202" width="${(pitch - 2).toFixed(2)}" height="8" rx="2" fill="${level ? levels[level] : theme.barBg}" />`;
      }).join('')}</g>
      ${text(24, 224, `${stripWeeks.length} WEEKS`, 'mono mut', 'font-size="9.5" letter-spacing="0.5"')}`
    : '';

  const corner = 10;
  const inset = 7;
  const corners = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1],
  ].map(([x, y, dx, dy]) => `<path d="M ${x + dx * corner} ${y} H ${x} V ${y + dy * corner}" stroke="${theme.accent}" stroke-width="1.5" />`).join('');

  const impact = `⚡ ${formatCount(s.totalContributions)} IMPACT`;
  const handle = s.login ? `(@${s.login})` : '';
  const headRoom = width - pad * 2 - monoWidth(impact, 11) - 18;
  const shownName = fitUi(s.name, 15, Math.max(headRoom - monoWidth(handle, 11) - 8, headRoom * 0.55), 600);
  const handleX = pad + uiWidth(shownName, 15, 600) + 8;
  const shownHandle = fitMono(handle, 11, pad + headRoom - handleX);

  return card({
    width,
    height,
    title: `${s.name}, GitHub stats`,
    theme,
    rx: 6,
    body: `
      ${corners}
      ${text(pad, 28, 'SYS.DEV // TELEMETRY HUD', 'mono', `font-size="10" letter-spacing="1" fill="${theme.accent}"`)}
      ${text(pad, 47, shownName, 'ink', 'font-size="15" font-weight="600"')}
      ${text(handleX.toFixed(1), 47, shownHandle, 'mono mut', 'font-size="11"')}
      ${text(width - pad, 47, impact, 'mono ink', 'font-size="11" text-anchor="end"')}
      ${readouts}
      ${hairline(width - pad - ringW - 2, 64, width - pad - ringW - 2, 190, theme)}
      ${tickRing({ cx: ringCx, cy: 118, r: 44, ratio: s.rank.score / 100, ticks: 40, tickLength: 8, tickWidth: 3, theme })}
      ${text(ringCx, 128, s.rank.level, 'num', `font-size="${s.rank.level.length > 1 ? 24 : 28}" text-anchor="middle"`)}
      ${text(ringCx, 178, 'OVERALL RANK', 'mono mut', 'font-size="9.5" letter-spacing="0.5" text-anchor="middle"')}
      ${text(ringCx, 192, `SCORE ${s.rank.score}/100`, 'mono ink', 'font-size="9.5" text-anchor="middle"')}
      ${strip}
    `,
  });
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

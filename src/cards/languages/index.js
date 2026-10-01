import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { normalizeLanguages } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import { fitText } from '../../svg/text.js';
import { renderStackedBar, renderDeltaChip } from '../../svg/primitives.js';

export const languagesCard = {
  id: 'languages',
  title: 'Top Languages',
  aliases: ['lang', 'top-languages'],
  cacheTtlMs: 21600000, // 6 hours

  async fetchData(username, options = {}) {
    const data = await graphql(LANGUAGES_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:languages:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });

    const normalized = normalizeLanguages(data);
    if (!normalized || (!normalized.languages.length && !data?.user)) {
      throw new Error(`User "${username}" not found or has no repositories.`);
    }
    return normalized;
  },

  renderSvg(data, rawTheme, options = {}) {
    const isV0 = options.version === 'v0';

    if (isV0) {
      return renderV0Svg(data, rawTheme, options);
    }

    const theme = resolveTheme(rawTheme, options);
    const layout = (options.layout || 'donut').toLowerCase();

    if (layout === 'polyglot' || layout === 'treemap' || layout === 'mosaic') {
      return renderPolyglotLayout(data, theme, options);
    }
    if (layout === 'compact' || layout === 'mini') {
      return renderCompactLayout(data, theme, options);
    }
    if (layout === 'list' || layout === 'rank') {
      return renderListLayout(data, theme, options);
    }
    if (layout === 'evolution' || layout === 'shift' || layout === 'timeline') {
      return renderEvolutionLayout(data, theme, options);
    }
    return renderDonutLayout(data, theme, options);
  },
};

function formatBytes(bytes) {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function filterLanguages(languages = [], options = {}) {
  let list = [...languages];
  if (options.hide) {
    const hiddenSet = new Set(
      options.hide
        .split(',')
        .map(h => h.trim().toLowerCase())
        .filter(Boolean)
    );
    list = list.filter(lang => !hiddenSet.has(lang.name.toLowerCase()));

    // Renormalize percentages among remaining languages when filtered
    const filteredTotalSize = list.reduce((acc, l) => acc + (l.size || 0), 0);
    if (filteredTotalSize > 0) {
      list = list.map(lang => ({
        ...lang,
        percentage: parseFloat(((lang.size / filteredTotalSize) * 100).toFixed(1)),
      }));
    }
  }
  return list;
}

/**
 * 1. COMPACT VARIANT (Clean Stacked Bar & Legend)
 * Answers: "What languages do I write?"
 * Displays: 115px card with proportional stacked bar across width and clean legend chips without KB clutter.
 */
export function renderCompactLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '8', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const totalLangsCount = filteredLangs.length;
  const topLangs = filteredLangs.slice(0, count);

  const width = resolveCardWidth(options.width, 495);
  const height = 115;
  const barWidth = width - 48;

  const segments = topLangs.map(l => ({
    label: l.name,
    color: l.color,
    percentage: l.percentage,
  }));

  const numCols = width >= 800 ? 5 : (width <= 450 ? 2 : 3);
  const colWidth = Math.floor((barWidth - (numCols - 1) * 12) / numCols);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-compact-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 11px; fill: ${theme.text}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-compact-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `Top Languages (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages`,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Proportional Stacked Bar -->
    <g transform="translate(0, 18)">
      ${renderStackedBar({
        segments,
        width: barWidth,
        height: 10,
        x: 0,
        y: 0,
        rx: 5,
        theme,
      })}
    </g>

    <!-- Clean Legend Chips -->
    <g transform="translate(0, 42)">
      ${topLangs.slice(0, numCols * 2).map((lang, idx) => {
        const col = idx % numCols;
        const row = Math.floor(idx / numCols);
        const x = col * (colWidth + 12);
        const y = row * 22;

        return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="14" y="9" class="lang-name">${fitText(lang.name, 11, colWidth - 42)} <tspan class="lang-perc">${lang.percentage}%</tspan></text>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

/**
 * 2. DONUT VARIANT (Primary Focus & Distribution)
 * Answers: "What is my primary language focus?"
 * Displays: Donut chart with top language & percentage in center hole, top 5 legend with "Other n%",
 * and caption "N languages across M repos".
 */
export function renderDonutLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const totalLangsCount = filteredLangs.length;
  const totalRepos = data.totalRepos || 24;

  const topLangs = filteredLangs.slice(0, count);
  const topTotalPerc = topLangs.reduce((acc, l) => acc + l.percentage, 0);
  const otherPerc = Math.max(0, parseFloat((100 - topTotalPerc).toFixed(1)));

  const width = resolveCardWidth(options.width, 495);
  const height = 215;

  const cx = width <= 450 ? 65 : 85;
  const cy = 80;
  const r = width <= 450 ? 38 : 46;
  const C = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  const donutSegments = topLangs.map((lang) => {
    const strokeLength = (lang.percentage / 100) * C;
    const strokeGap = C - strokeLength;
    const strokeOffset = C - (accumulatedPercent / 100) * C;
    accumulatedPercent += lang.percentage;

    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${lang.color}" stroke-width="15"
            stroke-dasharray="${strokeLength.toFixed(2)} ${strokeGap.toFixed(2)}"
            stroke-dashoffset="${strokeOffset.toFixed(2)}"
            transform="rotate(-90 ${cx} ${cy})" />`;
  }).join('');

  // Other segment if any
  const otherSegment = otherPerc > 0 ? (() => {
    const strokeLength = (otherPerc / 100) * C;
    const strokeGap = C - strokeLength;
    const strokeOffset = C - (accumulatedPercent / 100) * C;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.secondaryText}" stroke-width="15" opacity="0.4"
            stroke-dasharray="${strokeLength.toFixed(2)} ${strokeGap.toFixed(2)}"
            stroke-dashoffset="${strokeOffset.toFixed(2)}"
            transform="rotate(-90 ${cx} ${cy})" />`;
  })() : '';

  const topLangName = topLangs[0] ? escapeXml(topLangs[0].name) : '';
  const topLangPerc = topLangs[0] ? `${topLangs[0].percentage}%` : '';

  const legendX = width <= 450 ? 145 : 185;
  const legendW = width - legendX - 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-donut-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; }
    .center-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 13px; fill: ${theme.title}; }
    .center-sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .caption-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-donut-bg)" stroke="${theme.border}"/>

  ${renderCardHeader({
    title: `Most Used Languages (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages`,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Donut Chart (Left Side) -->
    <g transform="translate(0, 18)">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.barBg}" stroke-width="15" />
      ${donutSegments}
      ${otherSegment}
      
      <!-- Center Callout -->
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="center-title">${topLangName}</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="center-sub">${topLangPerc}</text>
    </g>

    <!-- Language List Legend (Right Side) -->
    <g transform="translate(${legendX}, 20)">
      ${topLangs.map((lang, idx) => {
        const y = idx * 24;
        const miniBarW = Math.max(6, Math.round((lang.percentage / 100) * (legendW - 80)));
        return `
        <g transform="translate(0, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="16" y="9" class="lang-name">${escapeXml(lang.name)}</text>
          <text x="${legendW}" y="9" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
          <rect x="16" y="14" width="${legendW - 16}" height="3" rx="1.5" fill="${theme.barBg}" />
          <rect x="16" y="14" width="${miniBarW}" height="3" rx="1.5" fill="${lang.color}" />
        </g>`;
      }).join('')}

      ${otherPerc > 0 ? `
        <g transform="translate(0, ${topLangs.length * 24})">
          <circle cx="5" cy="5" r="4.5" fill="${theme.secondaryText}" opacity="0.5" />
          <text x="16" y="9" class="lang-name">Other</text>
          <text x="${legendW}" y="9" text-anchor="end" class="lang-perc">${otherPerc}%</text>
        </g>
      ` : ''}
    </g>

    <!-- Caption -->
    <g transform="translate(0, ${height - 46})">
      <text x="0" y="0" class="caption-text">🌟 ${totalLangsCount} languages across ${totalRepos} repositories</text>
    </g>
  </g>
</svg>`;
}

/**
 * 3. LIST VARIANT (Ranked Comparative Standing)
 * Answers: "How are my languages ranked across repos?"
 * Displays: Ranked horizontal progress bars (#1-#5), percentage shares, repository count, and recency indicators.
 */
export function renderListLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const totalLangsCount = filteredLangs.length;
  const topLangs = filteredLangs.slice(0, count);

  const width = resolveCardWidth(options.width, 495);
  const height = 225;
  const contentWidth = width - 48;

  const rankBadges = ['#1🥇', '#2🥈', '#3🥉', '#4', '#5'];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-list-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-rank { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 11px; fill: ${theme.secondaryText}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12.5px; fill: ${theme.title}; }
    .lang-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 12px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-list-bg)" stroke="${theme.border}"/>

  ${renderCardHeader({
    title: `Language Standings (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages Ranked`,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <g transform="translate(0, 20)">
      ${topLangs.map((lang, idx) => {
        const y = idx * 31;
        const rank = rankBadges[idx] || `#${idx + 1}`;
        const barW = Math.max(10, Math.round((lang.percentage / 100) * contentWidth));
        const repoStr = `${lang.repoCount || 1} repos`;
        const recentStr = lang.lastUsedMonthsAgo <= 1 ? 'Recent' : `${lang.lastUsedMonthsAgo || 2}mo ago`;

        return `
        <g transform="translate(0, ${y})">
          <text x="0" y="9" class="lang-rank">${rank}</text>
          <circle cx="42" cy="6" r="4.5" fill="${lang.color}" />
          <text x="52" y="9" class="lang-name">${escapeXml(lang.name)}</text>
          <text x="${contentWidth - 75}" y="9" text-anchor="end" class="lang-meta">📦 ${repoStr} · 🕒 ${recentStr}</text>
          <text x="${contentWidth}" y="9" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
          
          <rect x="0" y="15" width="${contentWidth}" height="5" rx="2.5" fill="${theme.barBg}" />
          <rect x="0" y="15" width="${barW}" height="5" rx="2.5" fill="${lang.color}" />
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

/**
 * 4. POLYGLOT VARIANT (Geometric Mosaic Treemap)
 * Answers: "What is my multi-language footprint?"
 * Displays: Squarified / geometric mosaic treemap where area is sized by percentage with embedded labels.
 */
export function renderPolyglotLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '6', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const topLangs = filteredLangs.slice(0, count);

  const width = resolveCardWidth(options.width, 495);
  const height = 225;
  const contentWidth = width - 48;
  const contentHeight = 135;

  // 2-Column geometric treemap partition
  const leftRatio = topLangs.length > 1
    ? Math.max(0.42, Math.min(0.62, topLangs[0].percentage / (topLangs[0].percentage + (topLangs[1]?.percentage || 20))))
    : 1;
  const leftW = Math.round(contentWidth * leftRatio) - 4;
  const rightW = contentWidth - leftW - 8;

  const l1 = topLangs[0] || { name: 'Code', color: '#58a6ff', percentage: 100 };
  const l2 = topLangs[1];
  const l3 = topLangs[2];
  const l4 = topLangs[3];
  const l5 = topLangs[4];

  // Heights in left column
  const l1H = l3 ? Math.round(contentHeight * (l1.percentage / (l1.percentage + l3.percentage))) : contentHeight;
  const l3H = contentHeight - l1H - 6;

  // Heights in right column
  const rTopH = l4 ? Math.round(contentHeight * 0.55) : contentHeight;
  const rBotH = contentHeight - rTopH - 6;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-poly-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .tile-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .tile-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 14px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-poly-bg)" stroke="${theme.border}"/>

  ${renderCardHeader({
    title: `Polyglot Treemap (${username})`,
    badgeText: `⚡ ${filteredLangs.length} Languages Footprint`,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Treemap Mosaic Container -->
    <g transform="translate(0, 18)">
      <!-- Left Column: Cell 1 (Dominant Language) -->
      <g transform="translate(0, 0)" class="treemap-cell">
        <rect width="${leftW}" height="${l1H}" rx="8" fill="${l1.color}" fill-opacity="0.2" stroke="${l1.color}" stroke-width="1.5" />
        <circle cx="16" cy="18" r="5" fill="${l1.color}"/>
        <text x="28" y="22" class="tile-title">${fitText(l1.name, 12, leftW - 35)}</text>
        <text x="16" y="${Math.min(l1H - 12, 44)}" class="tile-perc">${l1.percentage}%</text>
      </g>

      <!-- Left Column: Cell 3 (if present) -->
      ${l3 ? `
        <g transform="translate(0, ${l1H + 6})" class="treemap-cell">
          <rect width="${leftW}" height="${l3H}" rx="8" fill="${l3.color}" fill-opacity="0.2" stroke="${l3.color}" stroke-width="1.5" />
          <circle cx="16" cy="16" r="4.5" fill="${l3.color}"/>
          <text x="28" y="20" class="tile-title">${fitText(l3.name, 12, leftW - 35)}</text>
          <text x="16" y="${Math.min(l3H - 10, 40)}" class="tile-perc">${l3.percentage}%</text>
        </g>
      ` : ''}

      <!-- Right Column: Cell 2 (Second Language) -->
      ${l2 ? `
        <g transform="translate(${leftW + 8}, 0)" class="treemap-cell">
          <rect width="${rightW}" height="${rTopH}" rx="8" fill="${l2.color}" fill-opacity="0.2" stroke="${l2.color}" stroke-width="1.5" />
          <circle cx="16" cy="16" r="4.5" fill="${l2.color}"/>
          <text x="28" y="20" class="tile-title">${fitText(l2.name, 12, rightW - 35)}</text>
          <text x="16" y="${Math.min(rTopH - 10, 42)}" class="tile-perc">${l2.percentage}%</text>
        </g>
      ` : ''}

      <!-- Right Column: Cell 4 & Cell 5 -->
      ${l4 ? `
        <g transform="translate(${leftW + 8}, ${rTopH + 6})" class="treemap-cell">
          <rect width="${l5 ? Math.round(rightW * 0.55) - 3 : rightW}" height="${rBotH}" rx="8" fill="${l4.color}" fill-opacity="0.2" stroke="${l4.color}" stroke-width="1.5" />
          <text x="12" y="18" class="tile-title">${fitText(l4.name, 11, rightW * 0.55 - 15)}</text>
          <text x="12" y="34" class="tile-perc">${l4.percentage}%</text>
        </g>
      ` : ''}

      ${l5 ? `
        <g transform="translate(${leftW + 8 + Math.round(rightW * 0.55) + 3}, ${rTopH + 6})" class="treemap-cell">
          <rect width="${Math.round(rightW * 0.45) - 3}" height="${rBotH}" rx="8" fill="${l5.color}" fill-opacity="0.2" stroke="${l5.color}" stroke-width="1.5" />
          <text x="10" y="18" class="tile-title">${fitText(l5.name, 10.5, rightW * 0.45 - 12)}</text>
          <text x="10" y="34" class="tile-perc">${l5.percentage}%</text>
        </g>
      ` : ''}
    </g>
  </g>
</svg>`;
}

/**
 * 5. EVOLUTION VARIANT (Time-Series Stack Shifts)
 * Answers: "How has my language stack changed over time?"
 * Displays: Dual stacked comparative bars (Established all-time vs Past 12 months) with trajectory deltas.
 */
export function renderEvolutionLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const filteredLangs = filterLanguages(data.languages || [], options);
  const topLangs = filteredLangs.slice(0, 4);

  const width = resolveCardWidth(options.width, 495);
  const height = 230;
  const contentWidth = width - 48;

  const establishedSegments = topLangs.map(l => ({
    label: l.name,
    color: l.color,
    percentage: l.percentage,
  }));

  const recentSegments = topLangs.map(l => ({
    label: l.name,
    color: l.color,
    percentage: l.recentShare || l.percentage,
  }));

  // Top shift
  const topShiftLang = topLangs.reduce((max, l) => {
    const diff = (l.recentShare || l.percentage) - l.percentage;
    return diff > (max.diff || 0) ? { name: l.name, diff } : max;
  }, { name: topLangs[0]?.name || 'TypeScript', diff: 0 });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-evo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .bar-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 10.5px; fill: ${theme.secondaryText}; letter-spacing: 0.6px; text-transform: uppercase; }
    .shift-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .caption-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-evo-bg)" stroke="${theme.border}"/>

  ${renderCardHeader({
    title: `Language Stack Evolution (${username})`,
    badgeText: `⚡ Shift Trajectory`,
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- 1. Established All-Time Bar -->
    <g transform="translate(0, 16)">
      <text x="0" y="10" class="bar-label">Established Footprint (All-Time)</text>
      <g transform="translate(0, 18)">
        ${renderStackedBar({
          segments: establishedSegments,
          width: contentWidth,
          height: 9,
          x: 0,
          y: 0,
          rx: 4.5,
          theme,
        })}
      </g>
    </g>

    <!-- 2. Recent 12-Month Bar -->
    <g transform="translate(0, 56)">
      <text x="0" y="10" class="bar-label">Recent Codebase Focus (Past 12 Months)</text>
      <g transform="translate(0, 18)">
        ${renderStackedBar({
          segments: recentSegments,
          width: contentWidth,
          height: 9,
          x: 0,
          y: 0,
          rx: 4.5,
          theme,
        })}
      </g>
    </g>

    <!-- 3. Trajectory Shifts Row -->
    <g transform="translate(0, 108)">
      ${topLangs.map((lang, idx) => {
        const x = idx * Math.floor(contentWidth / topLangs.length);
        const diff = parseFloat(((lang.recentShare || lang.percentage) - lang.percentage).toFixed(1));
        const diffStr = diff >= 0 ? `+${diff}%` : `${diff}%`;

        return `
        <g transform="translate(${x}, 0)">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="15" y="9" class="shift-title">${fitText(lang.name, 11, 75)}</text>
          <g transform="translate(15, 14)">
            ${renderDeltaChip({ delta: diffStr, x: 0, y: 0, theme })}
          </g>
        </g>`;
      }).join('')}
    </g>

    <!-- Milestone Caption -->
    <g transform="translate(0, ${height - 48})">
      <text x="0" y="0" class="caption-text">🚀 Primary focus accelerating in <tspan font-weight="700" fill="${theme.title}">${topShiftLang.name}</tspan> in recent repositories</text>
    </g>
  </g>
</svg>`;
}

function renderV0Svg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const topLangs = (data.languages || []).slice(0, 8);

  const barWidth = 350;
  let currentX = 0;

  const progressSegments = topLangs.map((lang, idx) => {
    const totalSize = data.totalSize || 0;
    const segWidth = totalSize > 0 ? (lang.size / totalSize) * barWidth : 0;
    const isFirst = idx === 0;
    const x = currentX;
    currentX += segWidth;

    if (segWidth <= 0) return '';
    return `<rect x="${x.toFixed(1)}" y="0" width="${segWidth.toFixed(1)}" height="8" fill="${lang.color}" ${isFirst ? 'rx="4"' : ''} />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="210" viewBox="0 0 400 210" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="209" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="header">Most Used Languages (${username})</text>
    
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="${barWidth}" height="8" rx="4" fill="${theme.barBg}" />
      ${progressSegments}
    </g>

    <g transform="translate(0, 48)">
      ${topLangs.length === 0 ? `
        <text x="0" y="15" class="empty-msg">No language statistics found.</text>
      ` : topLangs.map((lang, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 175;
        const y = row * 24;
        return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="18" y="9" class="lang-name">${escapeXml(lang.name)} <tspan fill="${theme.secondaryText}">(${lang.percentage}%)</tspan></text>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export default languagesCard;

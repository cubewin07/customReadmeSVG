import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { normalizeLanguages } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import { fitText } from '../../svg/text.js';
import {
  renderCardDefs,
  renderCardStyles,
  renderCardFrame,
  renderBentoTile,
  renderRankBadge,
  renderStackedBar,
  renderDeltaChip,
} from '../../svg/primitives.js';

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

function filterLanguages(languages = [], options = {}) {
  let list = [...languages];
  if (options.hide) {
    const hiddenSet = new Set(
      options.hide
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    );
    list = list.filter((lang) => !hiddenSet.has(lang.name.toLowerCase()));

    // Renormalize percentages among remaining languages when filtered
    const filteredTotalSize = list.reduce((acc, l) => acc + (l.size || 0), 0);
    if (filteredTotalSize > 0) {
      list = list.map((lang) => ({
        ...lang,
        percentage: parseFloat(((lang.size / filteredTotalSize) * 100).toFixed(1)),
      }));
    }
  }
  return list;
}

/**
 * 1. COMPACT VARIANT (Bento Stacked Bar & Legend Pills)
 */
export function renderCompactLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '8', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const totalLangsCount = filteredLangs.length;
  const topLangs = filteredLangs.slice(0, count);

  const width = resolveCardWidth(options.width, 495);
  const height = 115;
  const idPrefix = 'lang-compact';
  const barWidth = width - 48;

  const segments = topLangs.map((l) => ({
    label: l.name,
    color: l.color,
    percentage: l.percentage,
  }));

  const numCols = width >= 800 ? 5 : width <= 450 ? 2 : 3;
  const colWidth = Math.floor((barWidth - (numCols - 1) * 10) / numCols);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 600; font-size: 10.5px; fill: ${theme.title}; }
    .lang-perc { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 10.5px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 12)}
  
  ${renderCardHeader({
    title: `Top Languages (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages`,
    width,
    theme,
  })}

  <g transform="translate(24, 38)">
    <!-- Proportional Stacked Bar -->
    <g transform="translate(0, 8)">
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

    <!-- Bento Legend Pills -->
    <g transform="translate(0, 28)">
      ${topLangs
        .slice(0, numCols * 2)
        .map((lang, idx) => {
          const col = idx % numCols;
          const row = Math.floor(idx / numCols);
          const x = col * (colWidth + 10);
          const y = row * 22;

          return renderBentoTile({
            x,
            y,
            width: colWidth,
            height: 20,
            theme,
            idPrefix,
            rx: 5,
            children: `
              <circle cx="8" cy="10" r="3.5" fill="${lang.color}" />
              <text x="16" y="13.5" class="lang-name">${escapeXml(fitText(lang.name, 10.5, colWidth - 46))}</text>
              <text x="${colWidth - 8}" y="13.5" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
            `,
          });
        })
        .join('')}
    </g>
  </g>
</svg>`;
}

/**
 * 2. DONUT VARIANT (Donut Reactor Pod & Bento Legend Slots)
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
  const height = 225;
  const idPrefix = 'lang-donut';
  const contentWidth = width - 48;

  const podW = width <= 450 ? 134 : 160;
  const legendW = contentWidth - podW - 12;

  const cx = podW / 2;
  const cy = 68;
  const r = width <= 450 ? 36 : 44;
  const C = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  const donutSegments = topLangs
    .map((lang) => {
      const strokeLength = (lang.percentage / 100) * C;
      const strokeGap = C - strokeLength;
      const strokeOffset = C - (accumulatedPercent / 100) * C;
      accumulatedPercent += lang.percentage;

      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${lang.color}" stroke-width="14"
              stroke-dasharray="${Math.max(0, strokeLength - 1.2).toFixed(2)} ${strokeGap.toFixed(2)}"
              stroke-dashoffset="${strokeOffset.toFixed(2)}"
              stroke-linecap="round"
              transform="rotate(-90 ${cx} ${cy})" />`;
    })
    .join('');

  const otherSegment =
    otherPerc > 0
      ? (() => {
          const strokeLength = (otherPerc / 100) * C;
          const strokeGap = C - strokeLength;
          const strokeOffset = C - (accumulatedPercent / 100) * C;
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.secondaryText}" stroke-width="14" opacity="0.35"
                  stroke-dasharray="${Math.max(0, strokeLength - 1.2).toFixed(2)} ${strokeGap.toFixed(2)}"
                  stroke-dashoffset="${strokeOffset.toFixed(2)}"
                  stroke-linecap="round"
                  transform="rotate(-90 ${cx} ${cy})" />`;
        })()
      : '';

  const topLangName = topLangs[0] ? escapeXml(fitText(topLangs[0].name, 12, r * 1.45)) : '';
  const topLangPerc = topLangs[0] ? `${topLangs[0].percentage}%` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 11.5px; fill: ${theme.title}; }
    .lang-perc { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; }
    .center-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 12.5px; fill: ${theme.title}; }
    .center-sub { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 10px; fill: ${theme.secondaryText}; }
    .caption-text { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `Most Used Languages (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages`,
    width,
    theme,
  })}

  <g transform="translate(24, 48)">
    <!-- Donut Reactor Bento Pod (Left Side) -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: podW,
      height: 144,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.barBg || '#21262d'}" stroke-width="14" opacity="0.4" />
        ${donutSegments}
        ${otherSegment}
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="center-title">${topLangName}</text>
        <text x="${cx}" y="${cy + 13}" text-anchor="middle" class="center-sub">${topLangPerc}</text>
        <text x="${podW / 2}" y="132" text-anchor="middle" class="stat-lbl">${totalRepos} REPOSITORIES</text>
      `,
    })}

    <!-- Language Bento Legend Slots (Right Side) -->
    ${renderBentoTile({
      x: podW + 12,
      y: 0,
      width: legendW,
      height: 144,
      theme,
      idPrefix,
      rx: 10,
      children: `
        <g transform="translate(12, 12)">
          ${topLangs
            .map((lang, idx) => {
              const y = idx * 23;
              const miniBarW = Math.max(6, Math.round((lang.percentage / 100) * (legendW - 100)));
              return `
              <g transform="translate(0, ${y})">
                <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
                <text x="16" y="9" class="lang-name">${escapeXml(fitText(lang.name, 11.5, legendW - 90))}</text>
                <text x="${legendW - 24}" y="9" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
                <rect x="16" y="14" width="${legendW - 40}" height="3" rx="1.5" fill="${theme.barBg || '#21262d'}" opacity="0.4" />
                <rect x="16" y="14" width="${miniBarW}" height="3" rx="1.5" fill="${lang.color}" />
              </g>`;
            })
            .join('')}

          ${
            otherPerc > 0
              ? `
            <g transform="translate(0, ${topLangs.length * 23})">
              <circle cx="5" cy="5" r="4.5" fill="${theme.secondaryText}" opacity="0.5" />
              <text x="16" y="9" class="lang-name">Other</text>
              <text x="${legendW - 24}" y="9" text-anchor="end" class="lang-perc">${otherPerc}%</text>
            </g>
          `
              : ''
          }
        </g>
      `,
    })}
  </g>
</svg>`;
}

/**
 * 3. LIST VARIANT (Ranked Bento Rows with Metadata Badges)
 */
export function renderListLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const totalLangsCount = filteredLangs.length;
  const topLangs = filteredLangs.slice(0, count);

  const width = resolveCardWidth(options.width, 495);
  const height = 225;
  const idPrefix = 'lang-list';
  const contentWidth = width - 48;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .lang-meta { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 9.5px; fill: ${theme.secondaryText}; }
    .lang-perc { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 11.5px; fill: ${theme.title}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `Language Standings (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages Ranked`,
    width,
    theme,
  })}

  <g transform="translate(24, 48)">
    ${topLangs
      .map((lang, idx) => {
        const y = idx * 30;
        const barW = Math.max(10, Math.round((lang.percentage / 100) * contentWidth));
        const repoStr = `${lang.repoCount || 1} repos`;
        const recentStr = lang.lastUsedMonthsAgo <= 1 ? 'Recent' : `${lang.lastUsedMonthsAgo || 2}mo ago`;

        return renderBentoTile({
          x: 0,
          y,
          width: contentWidth,
          height: 26,
          theme,
          idPrefix,
          rx: 6,
          children: `
            <g transform="translate(6, 4)">
              ${renderRankBadge({ x: 0, y: 0, rank: idx + 1, width: 34, height: 18, theme })}
            </g>
            <circle cx="52" cy="13" r="4.5" fill="${lang.color}" />
            <text x="62" y="16" class="lang-name">${escapeXml(fitText(lang.name, 12, 100))}</text>
            <text x="${contentWidth - 76}" y="16" text-anchor="end" class="lang-meta">📦 ${repoStr} · 🕒 ${recentStr}</text>
            <text x="${contentWidth - 10}" y="16" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
            <line x1="0" y1="25.5" x2="${barW}" y2="25.5" stroke="${lang.color}" stroke-width="1.5" />
          `,
        });
      })
      .join('')}
  </g>
</svg>`;
}

/**
 * 4. POLYGLOT VARIANT (Clamped Geometric Mosaic Treemap + Overflow Pill Strip)
 */
export function renderPolyglotLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '6', 10);
  const filteredLangs = filterLanguages(data.languages || [], options);
  const topLangs = filteredLangs.slice(0, count);

  const primaryLangs = topLangs.slice(0, 5);
  const extraLangs = topLangs.slice(5, 12);
  const hasExtra = extraLangs.length > 0;

  const width = resolveCardWidth(options.width, 495);
  const height = hasExtra ? 255 : 225;
  const idPrefix = 'lang-poly';
  const contentWidth = width - 48;
  const mosaicHeight = 138;

  // Clamped ratio bounds [0.42, 0.58] ensures no column ever crushes under 78px
  const rawLeftRatio =
    primaryLangs.length > 1
      ? primaryLangs[0].percentage / Math.max(1, primaryLangs[0].percentage + (primaryLangs[1]?.percentage || 25))
      : 1;
  const leftRatio = primaryLangs.length > 1 ? Math.max(0.42, Math.min(0.58, rawLeftRatio)) : 1;
  const leftW = Math.round(contentWidth * leftRatio) - 4;
  const rightW = contentWidth - leftW - 8;

  const l1 = primaryLangs[0] || { name: 'Code', color: '#58a6ff', percentage: 100 };
  const l2 = primaryLangs[1];
  const l3 = primaryLangs[2];
  const l4 = primaryLangs[3];
  const l5 = primaryLangs[4];

  // Left column heights clamped between [0.45, 0.66] so l3H is always >= 44
  const rawL1Ratio = l3 ? l1.percentage / Math.max(1, l1.percentage + l3.percentage) : 1;
  const clampedL1Ratio = l3 ? Math.max(0.45, Math.min(0.66, rawL1Ratio)) : 1;
  const l1H = l3 ? Math.round(mosaicHeight * clampedL1Ratio) - 3 : mosaicHeight;
  const l3H = mosaicHeight - l1H - 6;

  // Right column heights
  const rTopH = l4 ? Math.round(mosaicHeight * 0.54) - 3 : mosaicHeight;
  const rBotH = mosaicHeight - rTopH - 6;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .tile-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 11.5px; fill: ${theme.title}; }
    .tile-perc { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 14px; fill: ${theme.title}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `Polyglot Treemap (${username})`,
    badgeText: `⚡ ${filteredLangs.length} Languages Footprint`,
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    <!-- Treemap Mosaic Container -->
    <g transform="translate(0, 0)">
      <!-- Left Column: Cell 1 (Dominant Language) -->
      <g transform="translate(0, 0)" class="treemap-cell">
        <rect width="${leftW}" height="${l1H}" rx="8" fill="${l1.color}" fill-opacity="0.18" stroke="${l1.color}" stroke-opacity="0.65" stroke-width="1.2" />
        <line x1="8" y1="0.5" x2="${leftW - 8}" y2="0.5" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1" />
        <circle cx="16" cy="16" r="4.5" fill="${l1.color}"/>
        <text x="26" y="20" class="tile-title">${escapeXml(fitText(l1.name, 11.5, leftW - 34))}</text>
        <text x="16" y="${Math.min(l1H - 10, 42)}" class="tile-perc">${l1.percentage}%</text>
      </g>

      <!-- Left Column: Cell 3 (if present) -->
      ${
        l3
          ? `
        <g transform="translate(0, ${l1H + 6})" class="treemap-cell">
          <rect width="${leftW}" height="${l3H}" rx="8" fill="${l3.color}" fill-opacity="0.18" stroke="${l3.color}" stroke-opacity="0.65" stroke-width="1.2" />
          <line x1="8" y1="0.5" x2="${leftW - 8}" y2="0.5" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1" />
          <circle cx="16" cy="16" r="4" fill="${l3.color}"/>
          <text x="26" y="20" class="tile-title">${escapeXml(fitText(l3.name, 11.5, leftW - 34))}</text>
          <text x="16" y="${Math.min(l3H - 10, 40)}" class="tile-perc">${l3.percentage}%</text>
        </g>
      `
          : ''
      }

      <!-- Right Column: Cell 2 (Second Language) -->
      ${
        l2
          ? `
        <g transform="translate(${leftW + 8}, 0)" class="treemap-cell">
          <rect width="${rightW}" height="${rTopH}" rx="8" fill="${l2.color}" fill-opacity="0.18" stroke="${l2.color}" stroke-opacity="0.65" stroke-width="1.2" />
          <line x1="8" y1="0.5" x2="${rightW - 8}" y2="0.5" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1" />
          <circle cx="16" cy="16" r="4" fill="${l2.color}"/>
          <text x="26" y="20" class="tile-title">${escapeXml(fitText(l2.name, 11.5, rightW - 34))}</text>
          <text x="16" y="${Math.min(rTopH - 10, 40)}" class="tile-perc">${l2.percentage}%</text>
        </g>
      `
          : ''
      }

      <!-- Right Column: Cell 4 & Cell 5 -->
      ${
        l4
          ? `
        <g transform="translate(${leftW + 8}, ${rTopH + 6})" class="treemap-cell">
          <rect width="${l5 ? Math.round(rightW * 0.55) - 3 : rightW}" height="${rBotH}" rx="8" fill="${l4.color}" fill-opacity="0.18" stroke="${l4.color}" stroke-opacity="0.65" stroke-width="1.2" />
          <line x1="6" y1="0.5" x2="${(l5 ? Math.round(rightW * 0.55) - 3 : rightW) - 6}" y2="0.5" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1" />
          <circle cx="12" cy="14" r="3.5" fill="${l4.color}" />
          <text x="20" y="17.5" class="tile-title" font-size="10.5">${escapeXml(fitText(l4.name, 10.5, (l5 ? rightW * 0.55 - 3 : rightW) - 26))}</text>
          <text x="12" y="36" class="tile-perc" font-size="12.5">${l4.percentage}%</text>
        </g>
      `
          : ''
      }

      ${
        l5
          ? `
        <g transform="translate(${leftW + 8 + Math.round(rightW * 0.55) + 3}, ${rTopH + 6})" class="treemap-cell">
          <rect width="${Math.round(rightW * 0.45) - 3}" height="${rBotH}" rx="8" fill="${l5.color}" fill-opacity="0.18" stroke="${l5.color}" stroke-opacity="0.65" stroke-width="1.2" />
          <line x1="6" y1="0.5" x2="${Math.round(rightW * 0.45) - 9}" y2="0.5" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1" />
          <circle cx="12" cy="14" r="3.5" fill="${l5.color}" />
          <text x="20" y="17.5" class="tile-title" font-size="10.5">${escapeXml(fitText(l5.name, 10.5, rightW * 0.45 - 26))}</text>
          <text x="12" y="36" class="tile-perc" font-size="12.5">${l5.percentage}%</text>
        </g>
      `
          : ''
      }
    </g>

    <!-- Secondary Polyglot Chip Strip (Languages #6..#12) -->
    ${
      hasExtra
        ? `
      <g transform="translate(0, ${mosaicHeight + 8})">
        ${extraLangs
          .map((lang, idx) => {
            const pillW = Math.max(68, Math.floor((contentWidth - (extraLangs.length - 1) * 8) / extraLangs.length));
            const x = idx * (pillW + 8);
            return `
            <g transform="translate(${x}, 0)">
              <rect width="${pillW}" height="22" rx="6" fill="${theme.cardBg}" stroke="${lang.color}" stroke-opacity="0.45" stroke-width="1" />
              <circle cx="10" cy="11" r="3" fill="${lang.color}" />
              <text x="18" y="14.5" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="9.5" font-weight="600" fill="${theme.title}">${escapeXml(fitText(lang.name, 9.5, pillW - 42))}</text>
              <text x="${pillW - 8}" y="14.5" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${theme.secondaryText}">${lang.percentage}%</text>
            </g>`;
          })
          .join('')}
      </g>
    `
        : ''
    }
  </g>
</svg>`;
}

/**
 * 5. EVOLUTION VARIANT (Comparative Bento Stack & Trajectory Cards)
 */
export function renderEvolutionLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const filteredLangs = filterLanguages(data.languages || [], options);
  const topLangs = filteredLangs.slice(0, 4);

  const width = resolveCardWidth(options.width, 495);
  const height = 230;
  const idPrefix = 'lang-evo';
  const contentWidth = width - 48;

  const establishedSegments = topLangs.map((l) => ({
    label: l.name,
    color: l.color,
    percentage: l.percentage,
  }));

  const recentSegments = topLangs.map((l) => ({
    label: l.name,
    color: l.color,
    percentage: l.recentShare || l.percentage,
  }));

  const topShiftLang = topLangs.reduce(
    (max, l) => {
      const diff = (l.recentShare || l.percentage) - l.percentage;
      return diff > (max.diff || 0) ? { name: l.name, diff } : max;
    },
    { name: topLangs[0]?.name || 'TypeScript', diff: 0 }
  );

  const colW = Math.floor((contentWidth - (topLangs.length - 1) * 8) / topLangs.length);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .bar-label { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 9px; fill: ${theme.secondaryText}; letter-spacing: 0.6px; text-transform: uppercase; }
    .shift-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.title}; }
    .caption-text { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `Language Stack Evolution (${username})`,
    badgeText: '⚡ Shift Trajectory',
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    <!-- Comparative Dual Stack Bento Panel -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: contentWidth,
      height: 84,
      theme,
      idPrefix,
      rx: 8,
      children: `
        <g transform="translate(12, 12)">
          <text x="0" y="8" class="bar-label">Established Footprint (All-Time)</text>
          <g transform="translate(0, 14)">
            ${renderStackedBar({
              segments: establishedSegments,
              width: contentWidth - 24,
              height: 8,
              x: 0,
              y: 0,
              rx: 4,
              theme,
            })}
          </g>

          <text x="0" y="38" class="bar-label">Recent Codebase Focus (Past 12 Months)</text>
          <g transform="translate(0, 44)">
            ${renderStackedBar({
              segments: recentSegments,
              width: contentWidth - 24,
              height: 8,
              x: 0,
              y: 0,
              rx: 4,
              theme,
            })}
          </g>
        </g>
      `,
    })}

    <!-- 4 Individual Bento Trajectory Cards -->
    <g transform="translate(0, 92)">
      ${topLangs
        .map((lang, idx) => {
          const x = idx * (colW + 8);
          const diff = parseFloat(((lang.recentShare || lang.percentage) - lang.percentage).toFixed(1));

          return renderBentoTile({
            x,
            y: 0,
            width: colW,
            height: 48,
            theme,
            idPrefix,
            rx: 7,
            accentColor: lang.color,
            accentPosition: 'left',
            children: `
              <g transform="translate(10, 10)">
                <circle cx="5" cy="5" r="4" fill="${lang.color}" />
                <text x="14" y="8.5" class="shift-title">${escapeXml(fitText(lang.name, 11, colW - 30))}</text>
                <g transform="translate(0, 16)">
                  ${renderDeltaChip({ delta: diff, x: 0, y: 0, theme })}
                </g>
              </g>
            `,
          });
        })
        .join('')}
    </g>

    <!-- Milestone Caption -->
    <g transform="translate(0, 150)">
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

  const progressSegments = topLangs
    .map((lang, idx) => {
      const totalSize = data.totalSize || 0;
      const segWidth = totalSize > 0 ? (lang.size / totalSize) * barWidth : 0;
      const isFirst = idx === 0;
      const x = currentX;
      currentX += segWidth;

      if (segWidth <= 0) return '';
      return `<rect x="${x.toFixed(1)}" y="0" width="${segWidth.toFixed(1)}" height="8" fill="${lang.color}" ${isFirst ? 'rx="4"' : ''} />`;
    })
    .join('');

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
      ${
        topLangs.length === 0
          ? `
        <text x="0" y="15" class="empty-msg">No language statistics found.</text>
      `
          : topLangs
              .map((lang, idx) => {
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const x = col * 175;
                const y = row * 24;
                return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="18" y="9" class="lang-name">${escapeXml(lang.name)} <tspan fill="${theme.secondaryText}">(${lang.percentage}%)</tspan></text>
        </g>`;
              })
              .join('')
      }
    </g>
  </g>
</svg>`;
}

export default languagesCard;

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

  const numCols = width >= 800 ? 5 : width <= 450 ? 2 : 3;
  const maxSlots = numCols * 2;
  const colWidth = Math.floor((barWidth - (numCols - 1) * 10) / numCols);

  const displayLangs = topLangs.slice(0, maxSlots);
  const shownPerc = displayLangs.reduce((acc, l) => acc + (l.percentage || 0), 0);
  const otherPerc = parseFloat(Math.max(0, 100 - shownPerc).toFixed(1));
  if (displayLangs.length > 0 && displayLangs.length < maxSlots && otherPerc >= 0.5) {
    displayLangs.push({
      name: 'Other',
      color: theme.secondaryText || '#8b949e',
      percentage: otherPerc,
    });
  }

  const segments = displayLangs.length > 0
    ? displayLangs.map((l) => ({
        label: l.name,
        color: l.color,
        percentage: l.percentage,
      }))
    : [{ label: 'None', color: theme.barBg || '#21262d', percentage: 100 }];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 600; font-size: 10.5px; fill: ${theme.title}; }
    .lang-perc { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 10px; fill: ${theme.secondaryText}; }
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
    <g transform="translate(0, 26)">
      ${
        displayLangs.length > 0
          ? displayLangs
              .map((lang, idx) => {
                const col = idx % numCols;
                const row = Math.floor(idx / numCols);
                const x = col * (colWidth + 10);
                const y = row * 23;

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
                    <text x="16" y="13.5" class="lang-name">${escapeXml(fitText(lang.name, 10.5, colWidth - 52))}</text>
                    <text x="${colWidth - 8}" y="13.5" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
                  `,
                });
              })
              .join('')
          : renderBentoTile({
              x: 0,
              y: 4,
              width: barWidth,
              height: 34,
              theme,
              idPrefix,
              rx: 6,
              children: `<text x="${barWidth / 2}" y="21" text-anchor="middle" class="meta-text">No language telemetry detected yet</text>`,
            })
      }
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
  const totalRepos = data.totalRepos ?? (totalLangsCount > 0 ? 24 : 0);

  const topLangs = filteredLangs.slice(0, count);
  const topTotalPerc = topLangs.reduce((acc, l) => acc + l.percentage, 0);
  const otherPerc = topLangs.length > 0 ? Math.max(0, parseFloat((100 - topTotalPerc).toFixed(1))) : 0;

  const width = resolveCardWidth(options.width, 495);
  const height = 216;
  const idPrefix = 'lang-donut';
  const contentWidth = width - 48;

  const podW = width <= 450 ? 134 : 160;
  const legendW = contentWidth - podW - 12;

  const cx = podW / 2;
  const cy = 66;
  const r = width <= 450 ? 36 : 43;
  const C = 2 * Math.PI * r;
  const hasMultipleSegments = topLangs.length + (otherPerc > 0 ? 1 : 0) > 1;
  const segGap = hasMultipleSegments ? 2.0 : 0;

  let accumulatedPercent = 0;

  const donutSegments = topLangs
    .map((lang) => {
      const strokeLength = (lang.percentage / 100) * C;
      const visibleLen = Math.max(1, strokeLength - segGap);
      const strokeGap = C - visibleLen;
      const strokeOffset = C - (accumulatedPercent / 100) * C;
      accumulatedPercent += lang.percentage;

      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${lang.color}" stroke-width="13"
              stroke-dasharray="${visibleLen.toFixed(2)} ${strokeGap.toFixed(2)}"
              stroke-dashoffset="${strokeOffset.toFixed(2)}"
              stroke-linecap="butt"
              transform="rotate(-90 ${cx} ${cy})" />`;
    })
    .join('');

  const otherSegment =
    otherPerc > 0
      ? (() => {
          const strokeLength = (otherPerc / 100) * C;
          const visibleLen = Math.max(1, strokeLength - segGap);
          const strokeGap = C - visibleLen;
          const strokeOffset = C - (accumulatedPercent / 100) * C;
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.secondaryText}" stroke-width="13" opacity="0.45"
                  stroke-dasharray="${visibleLen.toFixed(2)} ${strokeGap.toFixed(2)}"
                  stroke-dashoffset="${strokeOffset.toFixed(2)}"
                  stroke-linecap="butt"
                  transform="rotate(-90 ${cx} ${cy})" />`;
        })()
      : '';

  const topLangName = topLangs[0] ? escapeXml(fitText(topLangs[0].name, 11.5, r * 1.4)) : 'No Data';
  const topLangPerc = topLangs[0] ? `${topLangs[0].percentage}%` : '0%';

  const legendItems = [
    ...topLangs,
    ...(otherPerc > 0 ? [{ name: 'Other', color: theme.secondaryText, percentage: otherPerc, isOther: true }] : []),
  ];
  const rowStep = legendItems.length <= 4 ? 26 : 22;
  const legendStartY = Math.max(13, Math.round((144 - ((legendItems.length - 1) * rowStep + 16)) / 2));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 11.5px; fill: ${theme.title}; }
    .lang-perc { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; }
    .center-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 11.5px; fill: ${theme.title}; }
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
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.barBg || '#21262d'}" stroke-width="13" opacity="0.45" />
        ${donutSegments}
        ${otherSegment}
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="center-title">${topLangName}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="center-sub">${topLangPerc}</text>
        <text x="${podW / 2}" y="131" text-anchor="middle" class="stat-lbl">${totalRepos} REPOSITORIES</text>
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
      children:
        legendItems.length > 0
          ? `
        <g transform="translate(14, ${legendStartY})">
          ${legendItems
            .map((lang, idx) => {
              const y = idx * rowStep;
              const trackW = legendW - 44;
              const miniBarW = Math.max(6, Math.round((lang.percentage / 100) * trackW));
              return `
              <g transform="translate(0, ${y})">
                <circle cx="5" cy="5" r="4" fill="${lang.color}" ${lang.isOther ? 'opacity="0.55"' : ''} />
                <text x="15" y="9" class="lang-name">${escapeXml(fitText(lang.name, 11.5, legendW - 92))}</text>
                <text x="${legendW - 28}" y="9" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
                <rect x="15" y="13.5" width="${trackW}" height="3" rx="1.5" fill="${theme.barBg || '#21262d'}" opacity="0.45" />
                <rect x="15" y="13.5" width="${miniBarW}" height="3" rx="1.5" fill="${lang.color}" ${lang.isOther ? 'opacity="0.55"' : ''} />
              </g>`;
            })
            .join('')}
        </g>
      `
          : `<text x="${legendW / 2}" y="76" text-anchor="middle" class="meta-text">No language distribution available</text>`,
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
  const height = topLangs.length > 0 ? Math.max(204, 58 + topLangs.length * 32) : 140;
  const idPrefix = 'lang-list';
  const contentWidth = width - 48;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .lang-meta { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-size: 9.5px; fill: ${theme.secondaryText}; }
    .lang-perc { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 11.5px; fill: ${theme.title}; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: `Language Standings (${username})`,
    badgeText: `⚡ ${totalLangsCount} Languages Ranked`,
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    ${
      topLangs.length > 0
        ? topLangs
            .map((lang, idx) => {
              const y = idx * 32;
              const trackW = contentWidth - 16;
              const barW = Math.max(8, Math.round((lang.percentage / 100) * trackW));
              const repoCount = lang.repoCount || 1;
              const repoStr = `${repoCount} ${repoCount === 1 ? 'repo' : 'repos'}`;
              const recentStr = lang.lastUsedMonthsAgo <= 1 ? 'Recent' : `${lang.lastUsedMonthsAgo || 2}mo ago`;

              return renderBentoTile({
                x: 0,
                y,
                width: contentWidth,
                height: 27,
                theme,
                idPrefix,
                rx: 6,
                children: `
                  <g transform="translate(6, 4.5)">
                    ${renderRankBadge({ x: 0, y: 0, rank: idx + 1, width: 32, height: 17, theme })}
                  </g>
                  <circle cx="48" cy="13" r="4" fill="${lang.color}" />
                  <text x="58" y="16.5" class="lang-name">${escapeXml(fitText(lang.name, 12, Math.max(80, contentWidth - 235)))}</text>
                  <text x="${contentWidth - 68}" y="16" text-anchor="end" class="lang-meta">${repoStr} · ${recentStr}</text>
                  <text x="${contentWidth - 10}" y="16.5" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
                  <rect x="8" y="23" width="${trackW}" height="2" rx="1" fill="${theme.barBg || '#21262d'}" opacity="0.45" />
                  <rect x="8" y="23" width="${barW}" height="2" rx="1" fill="${lang.color}" />
                `,
              });
            })
            .join('')
        : renderBentoTile({
            x: 0,
            y: 8,
            width: contentWidth,
            height: 54,
            theme,
            idPrefix,
            rx: 8,
            children: `<text x="${contentWidth / 2}" y="31" text-anchor="middle" class="meta-text">No ranked languages available</text>`,
          })
    }
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
  const height = hasExtra ? 232 : 202;
  const idPrefix = 'lang-poly';
  const contentWidth = width - 48;
  const mosaicHeight = 138;

  // Clamped ratio bounds [0.42, 0.58] ensures no column ever crushes under 78px
  const rawLeftRatio =
    primaryLangs.length > 1
      ? primaryLangs[0].percentage / Math.max(1, primaryLangs[0].percentage + (primaryLangs[1]?.percentage || 25))
      : 1;
  const leftRatio = primaryLangs.length > 1 ? Math.max(0.42, Math.min(0.58, rawLeftRatio)) : 1;
  const leftW = Math.round(contentWidth * leftRatio) - (primaryLangs.length > 1 ? 4 : 0);
  const rightW = contentWidth - leftW - 8;

  const l1 = primaryLangs[0] || { name: 'No Language Telemetry', color: theme.title || '#58a6ff', percentage: 0 };
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

  const renderTreemapCell = (lang, x, y, cellW, cellH, isCompact = false) => {
    const padX = isCompact ? 11 : 14;
    const barTrackW = Math.max(16, cellW - padX * 2);
    const barFillW = Math.max(6, Math.round(((lang.percentage || 0) / 100) * barTrackW));
    const titleFont = isCompact ? 10.5 : 11.5;
    const percFont = isCompact ? 12 : 14;
    const isShortCell = cellH < 52 && !isCompact;

    return `
      <g transform="translate(${x}, ${y})" class="treemap-cell">
        <rect width="${cellW}" height="${cellH}" rx="8" fill="${theme.cardBg}" stroke="${lang.color}" stroke-opacity="0.55" stroke-width="1.1" />
        <rect width="${cellW}" height="${cellH}" rx="8" fill="${lang.color}" fill-opacity="0.11" />
        <circle cx="${padX}" cy="15" r="${isCompact ? 3.5 : 4}" fill="${lang.color}" />
        <text x="${padX + 9}" y="18.5" class="tile-title" font-size="${titleFont}">${escapeXml(fitText(lang.name, titleFont, isShortCell ? cellW - padX * 2 - 52 : cellW - padX - 18))}</text>
        ${
          isShortCell
            ? `<text x="${cellW - padX}" y="19" text-anchor="end" class="tile-perc" font-size="13">${lang.percentage}%</text>`
            : `<text x="${padX}" y="${isCompact ? 36 : 41}" class="tile-perc" font-size="${percFont}">${lang.percentage}%</text>`
        }
        <rect x="${padX}" y="${cellH - 9}" width="${barTrackW}" height="3" rx="1.5" fill="${theme.barBg || '#21262d'}" opacity="0.5" />
        <rect x="${padX}" y="${cellH - 9}" width="${barFillW}" height="3" rx="1.5" fill="${lang.color}" />
      </g>`;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .tile-title { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; fill: ${theme.text}; }
    .tile-perc { font-family: 'JetBrains Mono', monospace; font-weight: 800; fill: ${theme.title}; }
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
      ${renderTreemapCell(l1, 0, 0, leftW, l1H, false)}
      ${l3 ? renderTreemapCell(l3, 0, l1H + 6, leftW, l3H, false) : ''}
      ${l2 ? renderTreemapCell(l2, leftW + 8, 0, rightW, rTopH, false) : ''}
      ${l4 ? renderTreemapCell(l4, leftW + 8, rTopH + 6, l5 ? Math.round(rightW * 0.55) - 3 : rightW, rBotH, true) : ''}
      ${l5 ? renderTreemapCell(l5, leftW + 8 + Math.round(rightW * 0.55) + 3, rTopH + 6, Math.round(rightW * 0.45) - 3, rBotH, true) : ''}
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
  const height = 238;
  const idPrefix = 'lang-evo';
  const contentWidth = width - 48;

  const establishedSegments = topLangs.length > 0
    ? topLangs.map((l) => ({
        label: l.name,
        color: l.color,
        percentage: l.percentage,
      }))
    : [{ label: 'None', color: theme.barBg || '#21262d', percentage: 100 }];

  const recentSegments = topLangs.length > 0
    ? topLangs.map((l) => ({
        label: l.name,
        color: l.color,
        percentage: l.recentShare || l.percentage,
      }))
    : [{ label: 'None', color: theme.barBg || '#21262d', percentage: 100 }];

  const topShiftLang = topLangs.reduce(
    (max, l) => {
      const diff = (l.recentShare || l.percentage) - l.percentage;
      return diff > (max.diff || 0) ? { name: l.name, diff } : max;
    },
    { name: topLangs[0]?.name || 'TypeScript', diff: 0 }
  );

  const numCols = Math.max(1, topLangs.length);
  const colW = Math.floor((contentWidth - (numCols - 1) * 8) / numCols);

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
      height: 82,
      theme,
      idPrefix,
      rx: 8,
      children: `
        <g transform="translate(12, 11)">
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
    <g transform="translate(0, 90)">
      ${topLangs
        .map((lang, idx) => {
          const x = idx * (colW + 8);
          const diff = parseFloat(((lang.recentShare || lang.percentage) - lang.percentage).toFixed(1));
          const shareVal = lang.recentShare ?? lang.percentage;

          return renderBentoTile({
            x,
            y: 0,
            width: colW,
            height: 50,
            theme,
            idPrefix,
            rx: 7,
            accentColor: lang.color,
            accentPosition: 'left',
            children: `
              <g transform="translate(10, 10)">
                <circle cx="4.5" cy="5" r="3.5" fill="${lang.color}" />
                <text x="12.5" y="8.5" class="shift-title">${escapeXml(fitText(lang.name, 10.5, colW - 52))}</text>
                <text x="${colW - 18}" y="8.5" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${theme.secondaryText}">${shareVal}%</text>
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
    <g transform="translate(4, 160)">
      <circle cx="4" cy="-3.5" r="3.5" fill="${theme.accent || theme.title}" class="pulse-dot" />
      <text x="14" y="0" class="caption-text">Primary focus accelerating in <tspan font-weight="700" fill="${theme.title}">${escapeXml(topShiftLang.name)}</tspan> across recent repositories</text>
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

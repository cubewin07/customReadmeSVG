import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { normalizeLanguages } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import {
  card,
  cellMeter,
  cellsThatFit,
  fitUi,
  formatPercent,
  hairline,
  monoWidth,
  padX,
  shareStrip,
  text,
  waffle,
} from '../../svg/kit.js';

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

function languageTitle(options, theme, width, badgeText, title = 'languages') {
  return renderCardHeader({ title, owner: options.username || '', badgeText, width, theme });
}

/** Folds everything past the shown languages into one neutral Other entry. */
function withOther(languages, shown, theme) {
  const head = languages.slice(0, shown);
  const rest = languages.slice(shown).reduce((acc, l) => acc + (l.percentage || 0), 0);
  return rest >= 0.5
    ? [...head, { name: 'Other', color: theme.secondaryText, percentage: Math.round(rest * 10) / 10 }]
    : head;
}

function languageCount(n) {
  return `${n} ${n === 1 ? 'language' : 'languages'}`;
}

function emptyMessage(x, y) {
  return text(x, y, 'No language data for public repositories yet.', 'mut', 'font-size="12"');
}

/**
 * 1. COMPACT: one strip and an inline legend.
 */
export function renderCompactLayout(data, theme, options = {}) {
  const count = parseInt(options.langs_count || options.count || '8', 10);
  const filtered = filterLanguages(data.languages || [], options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const inner = width - pad * 2;
  const height = 115;

  const items = withOther(filtered, Math.min(count, 5), theme);
  const cols = width >= 700 ? 6 : 3;
  const colW = inner / cols;
  const legend = items.slice(0, cols * 2 - (items.length > cols * 2 ? 1 : 0)).map((lang, i) => {
    const x = Math.round(pad + (i % cols) * colW);
    const y = 76 + Math.floor(i / cols) * 19;
    const pct = formatPercent(lang.percentage);
    const nameRoom = colW - 13 - monoWidth(pct, 10.5) - 12;
    return `
      <rect x="${x}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${lang.color}" />
      ${text(x + 13, y, fitUi(lang.name, 11, nameRoom), 'ink', 'font-size="11"')}
      ${text(Math.round(x + colW - 10), y, pct, 'mono mut', 'font-size="10.5" text-anchor="end"')}`;
  }).join('');

  return card({
    width,
    height,
    title: `Top languages${options.username ? ` for ${options.username}` : ''}`,
    theme,
    body: `
      ${languageTitle(options, theme, width, filtered.length ? languageCount(filtered.length) : null)}
      ${filtered.length
        ? shareStrip({ x: pad, y: 44, width: inner, items, size: 8, height: 12, theme, className: 'stacked-bar' }) + legend
        : emptyMessage(pad, 72)}
    `,
  });
}

/**
 * 2. DONUT: share at a glance, with ranked rows beside it.
 */
export function renderDonutLayout(data, theme, options = {}) {
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const filtered = filterLanguages(data.languages || [], options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const height = 216;

  const items = withOther(filtered, count, theme);
  const top = items[0];
  const cx = pad + 62;
  const cy = 118;
  const r = 54;
  const C = 2 * Math.PI * r;
  const total = items.reduce((acc, l) => acc + l.percentage, 0) || 100;
  const gap = items.length > 1 ? 2 : 0;

  let offset = 0;
  const arcs = items.map((lang) => {
    const length = (lang.percentage / total) * C;
    const visible = Math.max(1, length - gap);
    const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${lang.color}" stroke-width="11" stroke-dasharray="${visible.toFixed(2)} ${(C - visible).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />`;
    offset += length;
    return arc;
  }).join('');

  const rowsX = cx + r + (width <= 440 ? 22 : 34);
  const rowsW = width - pad - rowsX;
  const rowH = Math.min(26, 156 / Math.max(1, items.length));
  const meterTotal = cellsThatFit(rowsW - 44, 6, 2);
  const rows = items.map((lang, i) => {
    const y = 58 + i * rowH;
    const pct = formatPercent(lang.percentage);
    return `
      ${text(rowsX, y, fitUi(lang.name, 11.5, rowsW - monoWidth(pct, 11) - 10), 'ink', 'font-size="11.5"')}
      ${text(width - pad, y, pct, 'mono mut', 'font-size="11" text-anchor="end"')}
      ${rowH >= 26 ? cellMeter({ x: rowsX, y: y + 5, total: meterTotal, ratio: lang.percentage / 100, size: 6, gap: 2, color: lang.color, theme, delay: i * 50 }) : ''}`;
  }).join('');

  return card({
    width,
    height,
    title: `Top languages${options.username ? ` for ${options.username}` : ''}`,
    theme,
    body: `
      ${languageTitle(options, theme, width, filtered.length ? `${languageCount(filtered.length)}${data.totalRepos ? ` across ${data.totalRepos} repos` : ''}` : null)}
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${theme.barBg}" stroke-width="11" />
      ${arcs}
      ${top
        ? `${text(cx, cy + 1, formatPercent(top.percentage), 'num', 'font-size="19" text-anchor="middle"')}
           ${text(cx, cy + 17, fitUi(top.name, 11, r * 1.5), 'lbl', 'text-anchor="middle"')}`
        : text(cx, cy + 4, 'No data', 'lbl', 'text-anchor="middle"')}
      ${filtered.length ? rows : ''}
    `,
  });
}

/**
 * 3. LIST: a ranked table with a cell meter per language.
 */
export function renderListLayout(data, theme, options = {}) {
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const filtered = filterLanguages(data.languages || [], options);
  const list = filtered.slice(0, count);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const inner = width - pad * 2;
  const rowH = 32;
  const height = list.length ? 54 + list.length * rowH : 104;

  const rankW = 24;
  const pctW = 42;
  const showMeta = width > 440;
  const metaW = showMeta ? (width >= 700 ? 150 : 104) : 0;
  const nameW = (inner - rankW - pctW - metaW) * (width >= 700 ? 0.42 : 0.5);
  const meterX = pad + rankW + nameW + 8;
  const meterW = inner - rankW - nameW - 8 - pctW - metaW - 10;
  const meterTotal = cellsThatFit(meterW, 6, 2);

  const rows = list.map((lang, i) => {
    const y = 58 + i * rowH;
    const repos = lang.repoCount ? `${lang.repoCount} ${lang.repoCount === 1 ? 'repo' : 'repos'}` : '';
    const months = lang.lastUsedMonthsAgo;
    const recency = months === undefined || months === null ? '' : months <= 1 ? 'Recent' : `${months}mo ago`;
    const meta = [repos, recency].filter(Boolean).join(' · ');
    return `
      ${i > 0 ? hairline(pad, y - 20, width - pad, y - 20, theme) : ''}
      ${text(pad, y, `#${i + 1}`, 'mono mut', 'font-size="11"')}
      <rect x="${pad + rankW}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${lang.color}" />
      ${text(pad + rankW + 13, y, fitUi(lang.name, 12, nameW - 13, 600), 'ink', 'font-size="12" font-weight="600"')}
      ${cellMeter({ x: meterX, y: y - 7.5, total: meterTotal, ratio: lang.percentage / 100, size: 6, gap: 2, color: lang.color, theme, delay: i * 50 })}
      ${showMeta && meta ? text(width - pad - pctW, y, fitUi(meta, 10.5, metaW - 8), 'mut', 'font-size="10.5" text-anchor="end"') : ''}
      ${text(width - pad, y, formatPercent(lang.percentage), 'num', 'font-size="12" text-anchor="end"')}`;
  }).join('');

  return card({
    width,
    height,
    title: `Language ranking${options.username ? ` for ${options.username}` : ''}`,
    theme,
    body: `
      ${languageTitle(options, theme, width, filtered.length ? languageCount(filtered.length) : null, 'language ranking')}
      ${list.length ? rows : emptyMessage(pad, 72)}
    `,
  });
}

/**
 * 4. POLYGLOT: a hundred-cell waffle, one cell per percent, keyed beside it.
 */
export function renderPolyglotLayout(data, theme, options = {}) {
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const filtered = filterLanguages(data.languages || [], options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);

  const items = withOther(filtered, count, theme);
  const size = width >= 700 ? 15 : 12;
  const gap = 2;
  const cols = width >= 700 ? 20 : 10;
  const rows = width >= 700 ? 5 : 10;
  const gridW = cols * (size + gap) - gap;
  const gridH = rows * (size + gap) - gap;
  const keyX = pad + gridW + (width <= 440 ? 18 : 26);
  const keyW = width - pad - keyX;
  const top = items[0];

  const headY = 50;
  const keyStart = top ? headY + 58 : headY;
  const rowH = 19;
  const keyRows = items.map((lang, i) => {
    const y = keyStart + i * rowH;
    const pct = formatPercent(lang.percentage);
    return `
      <rect x="${keyX}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${lang.color}" />
      ${text(keyX + 13, y, fitUi(lang.name, 11.5, keyW - 13 - monoWidth(pct, 11) - 8), 'ink', 'font-size="11.5"')}
      ${text(width - pad, y, pct, 'mono mut', 'font-size="11" text-anchor="end"')}`;
  }).join('');
  const keyEnd = keyStart + items.length * rowH;
  const height = Math.max(50 + gridH + 20, keyEnd + 10);

  return card({
    width,
    height,
    title: `Polyglot footprint${options.username ? ` for ${options.username}` : ''}`,
    theme,
    body: `
      ${languageTitle(options, theme, width, filtered.length ? languageCount(filtered.length) : null, 'polyglot')}
      ${waffle({ x: pad, y: 50, items, cols, rows, size, gap, theme })}
      ${top ? `
        ${text(keyX, headY + 11, fitUi(top.name, 11, keyW), 'lbl')}
        ${text(keyX, headY + 34, formatPercent(top.percentage), 'num', 'font-size="24"')}` : ''}
      ${filtered.length ? keyRows : text(keyX, 72, 'No language data', 'mut', 'font-size="12"')}
    `,
  });
}

/**
 * 5. EVOLUTION: all-time share against the last twelve months, one dumbbell per language.
 * Without recent data it says so instead of implying a shift.
 */
export function renderEvolutionLayout(data, theme, options = {}) {
  const filtered = filterLanguages(data.languages || [], options);
  const list = filtered.slice(0, 5);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const inner = width - pad * 2;
  const rowH = 28;
  const hasRecent = list.some((l) => typeof l.recentShare === 'number');
  const height = list.length ? 102 + list.length * rowH : 104;

  const nameW = width <= 440 ? 84 : 112;
  const deltaW = 52;
  const trackX = pad + nameW;
  const trackW = inner - nameW - deltaW;
  const maxShare = Math.max(1, ...list.flatMap((l) => [l.percentage, l.recentShare ?? l.percentage]));
  const px = (share) => trackX + (share / maxShare) * trackW;

  const rows = list.map((lang, i) => {
    const y = 76 + i * rowH;
    const allTime = lang.percentage;
    const recent = lang.recentShare ?? allTime;
    const delta = Math.round((recent - allTime) * 10) / 10;
    const a = px(allTime);
    const b = px(recent);
    const deltaLabel = !hasRecent ? formatPercent(allTime) : delta === 0 ? 'no change' : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`;
    return `
      ${text(pad, y, fitUi(lang.name, 11.5, nameW - 8), 'ink', 'font-size="11.5"')}
      <line x1="${trackX}" y1="${y - 4}" x2="${trackX + trackW}" y2="${y - 4}" stroke="${theme.barBg}" stroke-width="2" stroke-linecap="round" />
      ${hasRecent ? `<line x1="${a.toFixed(1)}" y1="${y - 4}" x2="${b.toFixed(1)}" y2="${y - 4}" stroke="${lang.color}" stroke-width="3" stroke-linecap="round" />` : ''}
      <rect x="${(a - 4.5).toFixed(1)}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${theme.bg === 'transparent' ? theme.barBg : theme.bg}" stroke="${lang.color}" stroke-width="1.5" />
      ${hasRecent ? `<rect class="ci" x="${(b - 4.5).toFixed(1)}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${lang.color}" />` : ''}
      ${text(width - pad, y, deltaLabel, 'mono ink', 'font-size="10.5" text-anchor="end"')}`;
  }).join('');

  const legendY = 52;
  const legendItems = hasRecent
    ? `<rect x="${pad + 0.75}" y="${legendY - 8}" width="8" height="8" rx="2" stroke="${theme.secondaryText}" stroke-width="1.5" />
       ${text(pad + 14, legendY, 'All time', 'lbl')}
       <rect x="${pad + 70}" y="${legendY - 8.5}" width="9" height="9" rx="2" fill="${theme.secondaryText}" />
       ${text(pad + 84, legendY, 'Last 12 months', 'lbl')}
       ${text(width - pad, legendY, 'pts', 'lbl', 'text-anchor="end"')}`
    : text(pad, legendY, 'All-time share', 'lbl');

  let caption = '';
  if (list.length) {
    if (!hasRecent) {
      caption = 'Recent activity is not available, so no shift is shown.';
    } else {
      const biggest = list.reduce((best, l) => {
        const shift = (l.recentShare ?? l.percentage) - l.percentage;
        return shift > best.shift ? { name: l.name, shift } : best;
      }, { name: null, shift: 0.5 });
      caption = biggest.name
        ? `${biggest.name} is gaining the most ground, up ${Math.round(biggest.shift * 10) / 10} points.`
        : 'The language mix has held steady over the last 12 months.';
    }
  }

  return card({
    width,
    height,
    title: `Language evolution${options.username ? ` for ${options.username}` : ''}`,
    theme,
    body: `
      ${languageTitle(options, theme, width, null, 'language shift')}
      ${list.length ? `${legendItems}${rows}${text(pad, height - 16, fitUi(caption, 11, inner), 'lbl')}` : emptyMessage(pad, 72)}
    `,
  });
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

import { escapeXml } from './escape.js';
import { fitText, measureText } from './text.js';

/**
 * Card kit: every quantity on a card is drawn in the contribution graph's own mark,
 * a small rounded square. Surfaces stay flat and separated by hairlines; numbers are
 * ink, the accent is reserved for marks, and only repository names use the link colour.
 */

export const FONT_UI = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
export const FONT_MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

const MONO_CHAR = 0.61;

export function monoWidth(text, px) {
  return String(text ?? '').length * px * MONO_CHAR;
}

export function fitMono(text, px, maxWidth) {
  const str = String(text ?? '');
  if (monoWidth(str, px) <= maxWidth) return str;
  const chars = Math.max(1, Math.floor(maxWidth / (px * MONO_CHAR)) - 3);
  return `${str.slice(0, chars).trimEnd()}...`;
}

/** Sans width with headroom, because the table in text.js is calibrated for regular weight. */
export function uiWidth(text, px, weight = 400) {
  return measureText(String(text ?? ''), px) * (weight >= 600 ? 1.08 : 1.02);
}

export function fitUi(text, px, maxWidth, weight = 400) {
  const scale = weight >= 600 ? 1.08 : 1.02;
  return fitText(String(text ?? ''), px, maxWidth / scale);
}

export function padX(width) {
  return width <= 440 ? 16 : 24;
}

export function formatCount(value) {
  const num = Number(value) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 100000) return `${Math.round(num / 1000)}k`;
  return num.toLocaleString('en-US');
}

export function formatPercent(value) {
  const num = Number(value) || 0;
  return `${Number.isInteger(num) ? num : num.toFixed(1).replace(/\.0$/, '')}%`;
}

export function text(x, y, content, cls = '', extra = '') {
  return `<text x="${x}" y="${y}"${cls ? ` class="${cls}"` : ''}${extra ? ` ${extra}` : ''}>${escapeXml(String(content ?? ''))}</text>`;
}

export function hairline(x1, y1, x2, y2, theme) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${theme.subtleBorder || theme.border}" />`;
}

function kitCss(theme) {
  return `
    text { font-family: ${FONT_UI}; }
    .mono { font-family: ${FONT_MONO}; font-variant-numeric: tabular-nums; }
    .ink { fill: ${theme.text}; }
    .mut { fill: ${theme.secondaryText}; }
    .lnk { fill: ${theme.title}; }
    .lbl { font-size: 11px; fill: ${theme.secondaryText}; }
    .num { font-family: ${FONT_MONO}; font-variant-numeric: tabular-nums; font-weight: 600; fill: ${theme.text}; }
    .ci { animation: cellIn .4s ease-out both; }
    @keyframes cellIn { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .ci { animation: none; } }
  `;
}

/** Outer SVG document with the flat card surface. */
export function card({ width, height, title, theme, css = '', defs = '', body = '', rx = 10 }) {
  const fill = theme.bg === 'transparent' ? 'none' : theme.bg;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  ${defs ? `<defs>${defs}</defs>` : ''}
  <style>${kitCss(theme)}${css}</style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${rx}" fill="${fill}" stroke="${theme.border}" />
  ${body}
</svg>`;
}

function delayAttr(ms) {
  return ms > 0 ? ` style="animation-delay:${Math.round(ms)}ms"` : '';
}

/** How many cells of a given pitch fit in a width. */
export function cellsThatFit(width, size = 8, gap = 2) {
  return Math.max(1, Math.floor((width + gap) / (size + gap)));
}

/** Filled/empty run of cells, the discrete counterpart of a progress bar. */
export function cellMeter({ x = 0, y = 0, total = 20, ratio = 0, size = 8, gap = 2, color, theme, className = 'cell-meter', delay = 0 }) {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  const filled = clamped > 0 ? Math.max(1, Math.round(clamped * total)) : 0;
  const fill = color || theme.accent;
  let cells = '';
  for (let i = 0; i < total; i++) {
    const on = i < filled;
    cells += `<rect x="${i * (size + gap)}" width="${size}" height="${size}" rx="2" fill="${on ? fill : theme.barBg}"${on ? ` class="ci"${delayAttr(delay + i * 22)}` : ''} />`;
  }
  return `<g class="${className}" transform="translate(${x}, ${y})">${cells}</g>`;
}

/**
 * Splits `total` cells across items by share using largest remainders, so the cells always
 * add up and any non-zero item keeps at least one visible cell.
 */
export function allocateCells(items, total) {
  const sum = items.reduce((acc, item) => acc + (item.percentage || 0), 0);
  if (sum <= 0 || !items.length) return items.map(() => 0);
  const exact = items.map((item) => ((item.percentage || 0) / sum) * total);
  const counts = exact.map((v, i) => (items[i].percentage > 0 ? Math.max(1, Math.floor(v)) : 0));
  let used = counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; used < total && k < byRemainder.length * 2; k++) {
    const idx = byRemainder[k % byRemainder.length][1];
    if (items[idx].percentage > 0) {
      counts[idx] += 1;
      used += 1;
    }
  }
  while (used > total) {
    const largest = counts.indexOf(Math.max(...counts));
    counts[largest] -= 1;
    used -= 1;
  }
  return counts;
}

/** One-row share strip; each cell belongs to one item. */
export function shareStrip({ x = 0, y = 0, width, items = [], size = 8, gap = 2, height, theme, className = 'share-strip' }) {
  const total = cellsThatFit(width, size, gap);
  const pitch = (width + gap) / total;
  const w = pitch - gap;
  const counts = allocateCells(items, total);
  let index = 0;
  let cells = '';
  items.forEach((item, i) => {
    for (let c = 0; c < counts[i]; c++) {
      cells += `<rect x="${(index * pitch).toFixed(2)}" width="${w.toFixed(2)}" height="${height || size}" rx="2" fill="${item.color}" class="ci"${delayAttr(index * 8)} />`;
      index += 1;
    }
  });
  for (; index < total; index++) {
    cells += `<rect x="${(index * pitch).toFixed(2)}" width="${w.toFixed(2)}" height="${height || size}" rx="2" fill="${theme.barBg}" />`;
  }
  return `<g class="${className}" transform="translate(${x}, ${y})">${cells}</g>`;
}

/** Waffle: one cell per percent, filled column by column so each item forms a solid block. */
export function waffle({ x = 0, y = 0, items = [], cols = 10, rows = 10, size = 12, gap = 2, theme, className = 'waffle' }) {
  const total = cols * rows;
  const counts = allocateCells(items, total);
  const colors = [];
  items.forEach((item, i) => {
    for (let c = 0; c < counts[i]; c++) colors.push(item.color);
  });
  let cells = '';
  for (let i = 0; i < total; i++) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const color = colors[i];
    cells += `<rect class="waffle-cell${color ? ' ci' : ''}" x="${col * (size + gap)}" y="${row * (size + gap)}" width="${size}" height="${size}" rx="2" fill="${color || theme.barBg}"${color ? delayAttr(i * 7) : ''} />`;
  }
  return `<g class="${className}" transform="translate(${x}, ${y})">${cells}</g>`;
}

function contributionLevel(count, max) {
  if (!count) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Contribution calendar scaled to fit `width`. With `weeksShown` it shows that many of the most
 * recent weeks; missing data renders as empty cells rather than invented activity.
 */
export function contributionGrid({ x = 0, y = 0, weeks = [], weeksShown = 53, width, gap = 2, theme, rx = 2, opacity = 1 }) {
  const recent = weeks.slice(-weeksShown);
  const padded = [...Array(Math.max(0, weeksShown - recent.length)).fill(null), ...recent];
  const size = (width - (weeksShown - 1) * gap) / weeksShown;
  const pitch = size + gap;
  const max = Math.max(1, ...recent.flatMap((w) => (w?.contributionDays || []).map((d) => d.contributionCount || 0)));
  const levels = theme.heatmapLevels || [theme.barBg, theme.accent, theme.accent, theme.accent, theme.accent];
  const columns = padded.map((week, w) => {
    const days = week?.contributionDays || [];
    let cells = '';
    for (let d = 0; d < 7; d++) {
      const day = days.find((item, idx) => (item.weekday ?? idx) === d);
      const level = contributionLevel(day?.contributionCount || 0, max);
      cells += `<rect y="${(d * pitch).toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="${rx}" fill="${level === 0 ? theme.barBg : levels[level]}" />`;
    }
    return `<g class="ci" transform="translate(${(w * pitch).toFixed(2)}, 0)"${delayAttr(w * 9)}>${cells}</g>`;
  }).join('');
  return {
    svg: `<g class="heatmap-matrix" transform="translate(${x}, ${y})"${opacity < 1 ? ` opacity="${opacity}"` : ''}>${columns}</g>`,
    height: 7 * pitch - gap,
  };
}

/** "Less [][][][][] More" scale, right-aligned so that `right` is the end of the word More. */
export function heatLegend({ right, y, theme }) {
  const levels = theme.heatmapLevels || [];
  const size = 9;
  const gap = 2;
  const scaleW = 5 * size + 4 * gap;
  const moreW = 26;
  const scaleX = right - moreW - 5 - scaleW;
  const cells = [theme.barBg, ...levels.slice(1, 5)]
    .map((fill, i) => `<rect x="${scaleX + i * (size + gap)}" y="${y - 8}" width="${size}" height="${size}" rx="2" fill="${fill}" />`)
    .join('');
  return `${text(scaleX - 5, y, 'Less', 'lbl', 'text-anchor="end"')}${cells}${text(right, y, 'More', 'lbl', 'text-anchor="end"')}`;
}

/** Label over value. `font: 'ui'` is for words such as a repo name; numbers stay monospace. */
export function metric({ x = 0, y = 0, label, value, size = 18, maxWidth = 120, font = 'mono', swatch = null, valueCls = '' }) {
  const swatchW = swatch ? 13 : 0;
  const room = maxWidth - swatchW;
  let px = size;
  let shown = String(value ?? '');
  if (font === 'mono') {
    while (px > 12 && monoWidth(shown, px) > room) px -= 1;
    shown = fitMono(shown, px, room);
  } else {
    while (px > 12 && uiWidth(shown, px, 600) > room) px -= 1;
    shown = fitUi(shown, px, room, 600);
  }
  const valueY = y + 15 + size;
  const marker = swatch
    ? `<rect x="${x}" y="${valueY - px * 0.72}" width="9" height="9" rx="2" fill="${swatch}" />`
    : '';
  const cls = font === 'mono' ? `num ${valueCls}` : `ink ${valueCls}`;
  const weight = font === 'mono' ? '' : 'font-weight="600"';
  return `<g>
    ${text(x, y + 11, fitUi(label, 11, maxWidth), 'lbl')}
    ${marker}
    ${text(x + swatchW, valueY, shown, cls.trim(), `font-size="${px}" ${weight}`.trim())}
  </g>`;
}

/** Equal-width row of metrics separated by whitespace. */
export function metricRow({ x = 0, y = 0, width, items = [], size = 18, gap = 14 }) {
  if (!items.length) return '';
  const colW = (width - gap * (items.length - 1)) / items.length;
  return items
    .map((item, i) => metric({ size, ...item, x: Math.round(x + i * (colW + gap)), y, maxWidth: Math.floor(colW) }))
    .join('');
}

/**
 * Inline run of meta facts laid out by their measured widths. Items that do not fit are dropped
 * rather than overlapping. Set `end: true` to right-align the run on `x`.
 * Item shape: { text, mono?, swatch?, icon?, cls? }.
 */
export function metaRow({ x = 0, y = 0, items = [], maxWidth = 300, gap = 12, end = false, px = 11 }) {
  const placed = [];
  let used = 0;
  for (const item of items) {
    if (!item || item.text === undefined || item.text === null || item.text === '') continue;
    const value = String(item.text);
    const lead = item.swatch || item.icon ? 14 : 0;
    const w = lead + (item.mono ? monoWidth(value, px) : uiWidth(value, px));
    const next = used + (placed.length ? gap : 0) + w;
    if (next > maxWidth) {
      if (!placed.length && maxWidth > lead + 24) {
        const room = maxWidth - lead;
        placed.push({ ...item, value: item.mono ? fitMono(value, px, room) : fitUi(value, px, room), lead, w: maxWidth, at: 0 });
        used = maxWidth;
      }
      break;
    }
    placed.push({ ...item, value, lead, w, at: used + (placed.length ? gap : 0) });
    used = next;
  }
  const origin = end ? x - used : x;
  return placed.map((item) => {
    const left = origin + item.at;
    const lead = item.swatch
      ? `<rect x="${left.toFixed(1)}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${item.swatch}" />`
      : item.icon
        ? `<g transform="translate(${left.toFixed(1)}, ${y - 10}) scale(0.82)">${item.icon}</g>`
        : '';
    return `${lead}${text((left + item.lead).toFixed(1), y, item.value, `${item.mono ? 'mono ' : ''}${item.cls || 'mut'}`, `font-size="${px}"`)}`;
  }).join('');
}

/** Progress ring built from radial ticks so it reads as the same mark as the cell meters. */
export function tickRing({ cx, cy, r, ratio = 0, ticks = 48, tickLength = 9, tickWidth = 3, color, theme }) {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  const filled = clamped > 0 ? Math.max(1, Math.round(clamped * ticks)) : 0;
  let marks = '';
  for (let i = 0; i < ticks; i++) {
    const on = i < filled;
    const angle = (i / ticks) * 360;
    marks += `<rect x="${(cx - tickWidth / 2).toFixed(2)}" y="${(cy - r).toFixed(2)}" width="${tickWidth}" height="${tickLength}" rx="1" fill="${on ? color || theme.accent : theme.barBg}" transform="rotate(${angle.toFixed(2)} ${cx} ${cy})"${on ? ` class="ci"${delayAttr(i * 16)}` : ''} />`;
  }
  return `<g class="progress-ring">${marks}</g>`;
}

/** Ordered shade ramp of the accent for ordered series on one card. */
export const SHADE_RAMP = [1, 0.68, 0.42, 0.24];

import { escapeXml } from './escape.js';
import { fitText } from './text.js';

/**
 * Shared SVG Visual Primitives for GitHub README Cards.
 * All primitives are static-first, lightweight, and strictly compliant with XML/SVG specs.
 */

/**
 * 1. Static-First Progress Ring (Circular Score / Grade Indicator)
 * @param {object} params
 * @param {number} params.score - Numeric score (e.g. 85)
 * @param {string} params.level - Letter grade (e.g. 'A+', 'S')
 * @param {number} [params.x=50] - Center X
 * @param {number} [params.y=50] - Center Y
 * @param {number} [params.radius=40] - Ring radius
 * @param {number} [params.strokeWidth=7] - Ring border thickness
 * @param {number} [params.maxScore=100] - Score scale maximum
 * @param {string} [params.label='RANK'] - Subtitle label under grade
 * @param {object} params.theme - Card theme
 * @returns {string} SVG <g> element
 */
export function renderProgressRing({
  score = 0,
  level = 'A',
  x = 50,
  y = 50,
  radius = 40,
  strokeWidth = 7,
  maxScore = 100,
  label = 'RANK',
  theme = {},
}) {
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(maxScore, score));
  const progressRatio = clampedScore / maxScore;
  const dashOffset = Math.round(circumference * (1 - progressRatio));

  const ringBgColor = theme.ringBg || theme.barBg || '#21262d';
  const progressColor = theme.iconColor || theme.title || '#58a6ff';

  return `
    <g class="progress-ring" transform="translate(${x}, ${y})">
      <!-- Background Track Circle -->
      <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${ringBgColor}" stroke-width="${strokeWidth}" />
      
      <!-- Progress Arc -->
      <circle
        cx="0"
        cy="0"
        r="${radius}"
        fill="none"
        stroke="${progressColor}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${Math.round(circumference)}"
        stroke-dashoffset="${dashOffset}"
        stroke-linecap="round"
        transform="rotate(-90)"
      />
      
      <!-- Center Content -->
      <text x="0" y="3" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="${theme.title}">${escapeXml(level)}</text>
      <text x="0" y="16" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="600" fill="${theme.secondaryText}">${escapeXml(label)}</text>
    </g>`;
}

/**
 * 2. Static-First Stacked Bar (Horizontal Proportional Bar)
 * @param {object} params
 * @param {Array<{ label?: string, color: string, percentage: number }>} params.segments
 * @param {number} params.width - Total bar width
 * @param {number} [params.height=8] - Bar height
 * @param {number} [params.x=0] - Horizontal position
 * @param {number} [params.y=0] - Vertical position
 * @param {number} [params.rx=4] - Corner radius
 * @param {object} params.theme - Theme palette
 * @returns {string} SVG <g> element
 */
export function renderStackedBar({
  segments = [],
  width = 200,
  height = 8,
  x = 0,
  y = 0,
  rx = 4,
  theme = {},
}) {
  if (!segments || !segments.length) return '';
  const total = segments.reduce((acc, s) => acc + (s.percentage || 0), 0) || 100;
  let currentX = 0;
  const clipId = `stacked-bar-clip-${Math.random().toString(36).slice(2, 8)}`;

  const rects = segments.map((seg) => {
    const segWidth = Math.max(2, Math.round(((seg.percentage || 0) / total) * width));
    const startX = currentX;
    currentX += segWidth;
    const color = seg.color || theme.accent || '#58a6ff';
    return `<rect x="${startX}" y="0" width="${segWidth}" height="${height}" fill="${color}" />`;
  }).join('');

  return `
    <g class="stacked-bar" transform="translate(${x}, ${y})">
      <defs>
        <clipPath id="${clipId}">
          <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="${theme.barBg || '#21262d'}" />
      <g clip-path="url(#${clipId})">
        ${rects}
      </g>
    </g>`;
}

/**
 * 3. Commit Activity Sparkline
 * @param {number[]} bins - 8-point activity numbers
 * @param {number} width - Sparkline width
 * @param {number} height - Sparkline height
 * @param {string} strokeColor - Line stroke color
 * @param {string} [fillColor='none'] - Area underfill color
 * @returns {string} SVG <g> element
 */
export function renderCommitSparkline(bins = [0,0,0,0,0,0,0,0], width = 80, height = 24, strokeColor = '#58a6ff', fillColor = 'none') {
  const safeBins = bins.length === 8 ? bins : (bins.slice(0, 8).concat(new Array(Math.max(0, 8 - bins.length)).fill(0)));
  const max = Math.max(...safeBins, 1);
  const step = width / 7;

  const points = safeBins.map((val, idx) => {
    const x = Math.round(idx * step);
    const y = Math.round((height - 3) - (val / max) * (height - 6));
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return `
    <g class="sparkline">
      ${fillColor && fillColor !== 'none' ? `<path d="${areaData}" fill="${fillColor}" opacity="0.25" />` : ''}
      <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </g>`;
}

/**
 * 4. Mini Heatmap Matrix (Weekly Activity Grid)
 * @param {object} params
 * @param {Array<{ contributionDays: Array<{ contributionCount: number, weekday: number }> }>} params.weeks
 * @param {number} [params.x=0] - Horizontal position
 * @param {number} [params.y=0] - Vertical position
 * @param {number} [params.cellWidth=8] - Cell square size
 * @param {number} [params.cellGap=2] - Gap between cells
 * @param {number} [params.cols=26] - Number of weeks to render
 * @param {object} params.theme - Theme palette
 * @returns {string} SVG <g> element
 */
export function renderHeatmapMatrix({
  weeks = [],
  x = 0,
  y = 0,
  cellWidth = 8,
  cellGap = 2,
  cols = 26,
  theme = {},
}) {
  const levels = theme.heatmapLevels || ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
  const displayWeeks = weeks.slice(Math.max(0, weeks.length - cols));

  const cells = displayWeeks.map((week, wIdx) => {
    const colX = wIdx * (cellWidth + cellGap);
    const days = week.contributionDays || [];

    return days.map((day) => {
      const rowY = (day.weekday || 0) * (cellWidth + cellGap);
      const count = day.contributionCount || 0;
      let levelIdx = 0;
      if (count > 8) levelIdx = 4;
      else if (count > 4) levelIdx = 3;
      else if (count > 1) levelIdx = 2;
      else if (count > 0) levelIdx = 1;

      const fill = levels[levelIdx] || levels[0];
      return `<rect x="${colX}" y="${rowY}" width="${cellWidth}" height="${cellWidth}" rx="1.5" fill="${fill}" />`;
    }).join('');
  }).join('');

  return `
    <g class="heatmap-matrix" transform="translate(${x}, ${y})">
      ${cells}
    </g>`;
}

/**
 * 5. Delta Indicator Chip (▲ / ▼ year-over-year or cadence change)
 * @param {object} params
 * @param {number|string} params.delta - Delta value (e.g., +15, -4, '+12%')
 * @param {string} [params.label] - Optional delta label (e.g., 'vs last year')
 * @param {number} [params.x=0] - Horizontal position
 * @param {number} [params.y=0] - Vertical position
 * @param {object} params.theme - Theme palette
 * @returns {string} SVG <g> element
 */
export function renderDeltaChip({
  delta = 0,
  label = '',
  x = 0,
  y = 0,
  theme = {},
}) {
  const numDelta = typeof delta === 'number' ? delta : parseFloat(String(delta).replace(/[^0-9.-]/g, '')) || 0;
  const isPositive = numDelta > 0;
  const isNegative = numDelta < 0;

  const symbol = isPositive ? '▲' : isNegative ? '▼' : '–';
  const prefix = isPositive ? '+' : '';
  const textVal = `${symbol} ${prefix}${delta}${typeof delta === 'number' ? '%' : ''}`;

  const textColor = isPositive
    ? (theme.positive || '#3fb950')
    : isNegative
      ? (theme.negative || '#f85149')
      : (theme.neutral || '#8b949e');

  const bg = isPositive
    ? 'rgba(63, 185, 80, 0.15)'
    : isNegative
      ? 'rgba(248, 81, 73, 0.15)'
      : 'rgba(139, 148, 158, 0.15)';

  const chipWidth = Math.max(48, Math.round(textVal.length * 6) + 12);

  return `
    <g class="delta-chip" transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${chipWidth}" height="16" rx="8" fill="${bg}" />
      <text x="${chipWidth / 2}" y="11" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="${textColor}">${escapeXml(textVal)}</text>
      ${label ? `<text x="${chipWidth + 6}" y="11" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="${theme.secondaryText}">${escapeXml(label)}</text>` : ''}
    </g>`;
}

/**
 * 6. Topic Pills/Chips
 */
export function renderTopicChips(topics = [], maxCount = 3, maxWidth = 180, theme = {}) {
  if (!topics || !topics.length) return '';
  const displayTopics = topics.slice(0, maxCount);
  let currentX = 0;
  const chipBg = theme.badgeBg || 'rgba(110, 118, 129, 0.15)';
  const chipText = theme.secondaryText || '#8b949e';

  const chipsSvg = displayTopics.map((rawTopic) => {
    const topic = fitText(rawTopic, 9, 70);
    const chipWidth = Math.max(32, Math.round(topic.length * 5.8) + 12);
    if (currentX + chipWidth > maxWidth && currentX > 0) return '';
    const x = currentX;
    currentX += chipWidth + 6;

    return `
      <g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="${chipWidth}" height="16" rx="8" fill="${chipBg}" />
        <text x="${chipWidth / 2}" y="11" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="500" fill="${chipText}">${escapeXml(topic)}</text>
      </g>`;
  }).join('');

  return `<g class="topic-chips">${chipsSvg}</g>`;
}

/**
 * 7. Language Proportion Bar
 */
export function renderLanguageBar(languages = [], width = 200, height = 6, theme = {}) {
  if (!languages || !languages.length) return '';
  const total = languages.reduce((acc, l) => acc + (l.percentage || 0), 0) || 100;
  let currentX = 0;
  const radius = Math.floor(height / 2);
  const clipId = `lang-bar-clip-${Math.random().toString(36).slice(2, 8)}`;

  const segments = languages.map((lang) => {
    const segWidth = Math.max(2, Math.round(((lang.percentage || 0) / total) * width));
    const x = currentX;
    currentX += segWidth;
    const color = lang.color || '#858585';
    return `<rect x="${x}" y="0" width="${segWidth}" height="${height}" fill="${color}" />`;
  }).join('');

  return `
    <g class="language-bar">
      <defs>
        <clipPath id="${clipId}">
          <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="${theme.barBg || '#21262d'}" />
      <g clip-path="url(#${clipId})">
        ${segments}
      </g>
    </g>`;
}

/**
 * 8. Release Tag Pill Badge
 */
export function renderReleaseTag(tagName, theme = {}) {
  if (!tagName) return '';
  const escaped = escapeXml(tagName);
  const tagWidth = Math.max(36, Math.round(escaped.length * 6) + 16);
  const bg = theme.badgeBg || 'rgba(56, 139, 253, 0.15)';
  const textCol = theme.iconColor || theme.title || '#58a6ff';

  return `
    <g class="release-tag">
      <rect x="0" y="0" width="${tagWidth}" height="16" rx="8" fill="${bg}" />
      <text x="${tagWidth / 2}" y="11" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="${textCol}">${escaped}</text>
    </g>`;
}

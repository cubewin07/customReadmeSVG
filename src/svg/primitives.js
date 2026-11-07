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
  const tickRadius = radius + strokeWidth / 2 + 3;

  return `
    <g class="progress-ring" transform="translate(${x}, ${y})">
      <!-- Outer Tick Track Ring -->
      <circle cx="0" cy="0" r="${tickRadius}" fill="none" stroke="${theme.secondaryText || '#8b949e'}" stroke-opacity="0.18" stroke-width="1" stroke-dasharray="2 4" />

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
      <text x="0" y="2" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="${radius <= 36 ? 20 : 22}" font-weight="800" fill="${theme.title}">${escapeXml(level)}</text>
      <text x="0" y="14" text-anchor="middle" font-family="'JetBrains Mono', 'SFMono-Regular', Menlo, monospace" font-size="${String(label).length > 8 ? '7' : '8'}" font-weight="700" fill="${theme.secondaryText}">${escapeXml(label)}</text>
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
      <line x1="0" y1="0.75" x2="${width}" y2="0.75" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1" />
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
  const rawMax = Math.max(...safeBins);
  const max = Math.max(rawMax, 1);
  const step = width / 7;

  const points = safeBins.map((val, idx) => {
    const x = Math.round(idx * step);
    const y = rawMax === 0
      ? Math.round(height * 0.65)
      : Math.round((height - 4) - (val / max) * (height - 8));
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;
  const lastPoint = points[points.length - 1].split(',');
  const lastX = lastPoint[0];
  const lastY = lastPoint[1];

  return `
    <g class="sparkline">
      ${fillColor && fillColor !== 'none' ? `<path d="${areaData}" fill="${fillColor}" opacity="0.22" />` : ''}
      <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${lastX}" cy="${lastY}" r="2.5" fill="${strokeColor}" />
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
  const sliced = Array.isArray(weeks) ? weeks.slice(Math.max(0, weeks.length - cols)) : [];
  const padCount = Math.max(0, cols - sliced.length);
  const displayWeeks = [
    ...Array.from({ length: padCount }, () => ({ contributionDays: [] })),
    ...sliced,
  ];

  const cells = displayWeeks.map((week, wIdx) => {
    const colX = wIdx * (cellWidth + cellGap);
    const daysMap = new Map();
    for (const day of (week.contributionDays || [])) {
      if (day && typeof day.weekday === 'number') {
        daysMap.set(day.weekday, day.contributionCount || 0);
      }
    }

    let colRects = '';
    for (let d = 0; d < 7; d++) {
      const rowY = d * (cellWidth + cellGap);
      const count = daysMap.get(d) || 0;
      let levelIdx = 0;
      if (count > 8) levelIdx = 4;
      else if (count > 4) levelIdx = 3;
      else if (count > 1) levelIdx = 2;
      else if (count > 0) levelIdx = 1;

      const fill = levels[levelIdx] || levels[0];
      colRects += `<rect x="${colX}" y="${rowY}" width="${cellWidth}" height="${cellWidth}" rx="1.5" fill="${fill}" />`;
    }
    return colRects;
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

  const chipWidth = Math.max(48, Math.round(textVal.length * 6) + 12);

  return `
    <g class="delta-chip" transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${chipWidth}" height="16" rx="8" fill="${textColor}" fill-opacity="0.16" />
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
  const chipBg = (theme.badgeBg && !String(theme.badgeBg).startsWith('rgba')) ? theme.badgeBg : (theme.barBg || '#21262d');
  const chipText = theme.secondaryText || '#8b949e';

  const chipsSvg = displayTopics.map((rawTopic) => {
    const topic = fitText(rawTopic, 9, 70);
    const chipWidth = Math.max(32, Math.round(topic.length * 5.8) + 12);
    if (currentX + chipWidth > maxWidth && currentX > 0) return '';
    const x = currentX;
    currentX += chipWidth + 6;

    return `
      <g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="${chipWidth}" height="16" rx="8" fill="${chipBg}" stroke="${theme.subtleBorder || theme.border || '#30363d'}" stroke-opacity="0.6" stroke-width="0.75" />
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
  const bg = (theme.badgeBg && !String(theme.badgeBg).startsWith('rgba')) ? theme.badgeBg : (theme.barBg || '#21262d');
  const textCol = theme.iconColor || theme.title || '#58a6ff';

  return `
    <g class="release-tag">
      <rect x="0" y="0" width="${tagWidth}" height="16" rx="8" fill="${bg}" stroke="${textCol}" stroke-opacity="0.35" stroke-width="0.75" />
      <text x="${tagWidth / 2}" y="11" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="${textCol}">${escaped}</text>
    </g>`;
}

/**
 * 9. Glassmorphic Bento Tile Primitive
 */
export function bentoTile({ x = 0, y = 0, width = 100, height = 50, rx = 10, theme = {}, children = '' }) {
  const cardBg = theme.cardBg || 'rgba(13, 17, 28, 0.78)';
  const border = theme.subtleBorder || theme.border || 'rgba(255, 255, 255, 0.12)';
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="${rx}" fill="${cardBg}" stroke="${border}" stroke-width="1" />
      <line x1="${rx}" y1="0.5" x2="${width - rx}" y2="0.5" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1" />
      ${children}
    </g>
  `;
}

/**
 * 10. Glowing Skill / Tech Badge Primitive
 */
export function skillBadge({ x = 0, y = 0, label = '', accent = '#38bdf8', level = '' }) {
  const textWidth = label.length * 6.8 + (level ? 28 : 14);
  const width = Math.max(58, Math.round(textWidth + 16));
  return {
    width,
    svg: `
      <g transform="translate(${x}, ${y})">
        <rect width="${width}" height="24" rx="6" fill="#090d16" fill-opacity="0.85" stroke="${accent}" stroke-opacity="0.35" stroke-width="1" />
        <circle cx="10" cy="12" r="2.8" fill="${accent}" />
        <text x="18" y="15.5" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="11" font-weight="500" fill="#f1f5f9">${escapeXml(label)}</text>
        ${level ? `<text x="${width - 8}" y="15" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9.5" fill="${accent}">${escapeXml(level)}</text>` : ''}
      </g>
    `,
  };
}

/**
 * 11. Specular Shared Defs Helper
 */
export function renderSharedDefs(theme = {}) {
  const c1 = theme.title || '#38bdf8';
  const c2 = theme.accent || '#818cf8';
  const bg = theme.bg || '#06080f';
  const cardBg = theme.cardBg || '#0d111c';
  return `
    <defs>
      <linearGradient id="card-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.06" />
        <stop offset="100%" stop-color="${c1}" stop-opacity="0.18" />
      </linearGradient>
      <linearGradient id="tile-surface-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${cardBg}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${bg}" stop-opacity="0.95" />
      </linearGradient>
      <radialGradient id="glow-primary" cx="0%" cy="0%" r="70%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.16" />
        <stop offset="100%" stop-color="${c1}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="glow-secondary" cx="100%" cy="100%" r="70%">
        <stop offset="0%" stop-color="${c2}" stop-opacity="0.14" />
        <stop offset="100%" stop-color="${c2}" stop-opacity="0" />
      </radialGradient>
      <pattern id="dot-matrix" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.85" fill="#ffffff" fill-opacity="0.06" />
      </pattern>
    </defs>
  `;
}

/**
 * 12. Glassmorphic Bento Canvas Wrapper
 */
export function svgCanvas({ width = 495, height = 230, title = 'Card', children = '', customCss = '', theme = {} }) {
  const bg = theme.bg || '#06080f';
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(title)}">
      <title>${escapeXml(title)}</title>
      ${renderSharedDefs(theme)}
      <style>
        .font-sans { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-variant-numeric: tabular-nums; }
        .label-caps { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; fill: ${theme.secondaryText || '#94a3b8'}; }
        ${customCss}
      </style>
      <rect width="${width}" height="${height}" rx="14" fill="${bg}" />
      <rect width="${width}" height="${height}" rx="14" fill="url(#dot-matrix)" />
      <rect width="${width}" height="${height}" rx="14" fill="url(#glow-primary)" />
      <rect width="${width}" height="${height}" rx="14" fill="url(#glow-secondary)" />
      ${children}
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="13.5" stroke="url(#card-border-grad)" stroke-width="1" fill="none" />
    </svg>
  `.trim();
}

/**
 * 13. Theme-Aware Glassmorphic Card Defs
 */
export function renderCardDefs(idPrefix, theme = {}, primaryColor = null, secondaryColor = null) {
  const c1 = primaryColor || theme.title || '#38bdf8';
  const c2 = secondaryColor || theme.accent || '#818cf8';
  const isLight = theme.bg === '#ffffff' || (theme.bg && String(theme.bg).toLowerCase().includes('fff'));
  const rimHighlight = isLight ? theme.border || '#d0d7de' : '#ffffff';
  const rimOpacity = isLight ? '0.85' : '0.22';
  const dotOpacity = isLight ? '0.18' : '0.12';

  return `
    <linearGradient id="${idPrefix}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="${idPrefix}-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rimHighlight}" stop-opacity="${rimOpacity}" />
      <stop offset="45%" stop-color="${theme.border}" stop-opacity="0.65" />
      <stop offset="100%" stop-color="${c1}" stop-opacity="0.35" />
    </linearGradient>
    <linearGradient id="${idPrefix}-tile-rim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${rimHighlight}" stop-opacity="${isLight ? '0.6' : '0.14'}" />
      <stop offset="100%" stop-color="${theme.subtleBorder || theme.border}" stop-opacity="0.45" />
    </linearGradient>
    <linearGradient id="${idPrefix}-brand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <radialGradient id="${idPrefix}-glow-tl" cx="0%" cy="0%" r="65%">
      <stop offset="0%" stop-color="${c1}" stop-opacity="${isLight ? '0.07' : '0.14'}" />
      <stop offset="100%" stop-color="${c1}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${idPrefix}-glow-br" cx="100%" cy="100%" r="65%">
      <stop offset="0%" stop-color="${c2}" stop-opacity="${isLight ? '0.06' : '0.11'}" />
      <stop offset="100%" stop-color="${c2}" stop-opacity="0" />
    </radialGradient>
    <pattern id="${idPrefix}-dots" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.8" fill="${theme.secondaryText}" fill-opacity="${dotOpacity}" />
    </pattern>
  `;
}

/**
 * 14. Standardized Card Typography & Utility CSS
 */
export function renderCardStyles(theme = {}, extraCss = '') {
  return `
    .font-ui { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 9px; fill: ${theme.secondaryText}; letter-spacing: 0.08em; text-transform: uppercase; }
    .stat-val { font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace; font-weight: 800; font-size: 14px; fill: ${theme.title}; font-variant-numeric: tabular-nums; }
    .meta-text { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; font-weight: 500; fill: ${theme.secondaryText}; }
    @keyframes statusPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
    .pulse-dot { animation: statusPulse 2.2s ease-in-out infinite; }
    ${extraCss}
  `;
}

/**
 * 15. Outer Glassmorphic Card Frame with Top Specular Accent Bar
 */
export function renderCardFrame(width, height, idPrefix, theme = {}, rx = 14) {
  const isTransparent = theme.bg === 'transparent';
  return `
    ${!isTransparent ? `<rect x="0.5" y="0.5" rx="${rx}" width="${width - 1}" height="${height - 1}" fill="url(#${idPrefix}-bg)" />` : ''}
    <rect x="0.5" y="0.5" rx="${rx}" width="${width - 1}" height="${height - 1}" fill="url(#${idPrefix}-dots)" />
    <rect x="0.5" y="0.5" rx="${rx}" width="${width - 1}" height="${height - 1}" fill="url(#${idPrefix}-glow-tl)" />
    <rect x="0.5" y="0.5" rx="${rx}" width="${width - 1}" height="${height - 1}" fill="url(#${idPrefix}-glow-br)" />
    <path d="M ${rx + 4},0.5 L ${width - rx - 4},0.5" stroke="url(#${idPrefix}-brand)" stroke-width="2" stroke-linecap="round" opacity="0.85" />
    <rect x="0.5" y="0.5" rx="${rx}" width="${width - 1}" height="${height - 1}" fill="none" stroke="url(#${idPrefix}-rim)" stroke-width="1" />
  `;
}

/**
 * 16. Glassmorphic Bento Tile Container
 */
export function renderBentoTile({
  x = 0,
  y = 0,
  width = 120,
  height = 54,
  theme = {},
  idPrefix = 'card',
  rx = 8,
  accentColor = null,
  accentPosition = 'left',
  className = '',
  children = '',
}) {
  const isLight = theme.bg === '#ffffff' || (theme.bg && String(theme.bg).toLowerCase().includes('fff'));
  const fillOpacity = isLight ? '0.94' : '0.82';
  const specOpacity = isLight ? '0.35' : '0.07';
  const clsAttr = className ? ` class="${className}"` : '';
  const tileBg = (theme.cardBg && !String(theme.cardBg).startsWith('rgba')) ? theme.cardBg : (isLight ? '#f6f8fa' : '#161b22');

  let accentSvg = '';
  if (accentColor) {
    if (accentPosition === 'top') {
      const topInset = Math.min(rx + 2, Math.floor(width * 0.2));
      accentSvg = `<rect x="${topInset}" y="0.5" width="${Math.max(8, width - topInset * 2)}" height="2.5" rx="1.25" fill="${accentColor}" opacity="0.9" />`;
    } else {
      const sideInset = Math.min(rx, Math.floor(height * 0.22));
      accentSvg = `<rect x="0.5" y="${sideInset}" width="3" height="${Math.max(8, height - sideInset * 2)}" rx="1.5" fill="${accentColor}" opacity="0.9" />`;
    }
  }

  return `
    <g${clsAttr} transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="${tileBg}" fill-opacity="${fillOpacity}" stroke="url(#${idPrefix}-tile-rim)" stroke-width="1" />
      <line x1="${rx + 2}" y1="0.75" x2="${Math.max(rx + 4, width - rx - 2)}" y2="0.75" stroke="#ffffff" stroke-opacity="${specOpacity}" stroke-width="0.75" />
      ${accentSvg}
      ${children}
    </g>
  `;
}

/**
 * 17. Metallic / Glass Rank Standing Badge (#1 Gold, #2 Silver, #3 Bronze, #4+ Slate)
 */
export function renderRankBadge({ x = 0, y = 0, rank = 1, width = 34, height = 18, theme = {} }) {
  const tierStyles = {
    1: { color: '#eab308', label: '#1' },
    2: { color: '#94a3b8', label: '#2' },
    3: { color: '#d97706', label: '#3' },
  };
  const st = tierStyles[rank];
  const fillCol = st ? st.color : (theme.secondaryText || '#8b949e');
  const borderCol = st ? st.color : (theme.subtleBorder || theme.border || '#30363d');
  const label = st ? st.label : `#${rank}`;

  return `
    <g class="rank-badge" transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${Math.round(height / 2)}" fill="${fillCol}" fill-opacity="0.16" stroke="${borderCol}" stroke-opacity="0.6" stroke-width="1" />
      <text x="${width / 2}" y="${Math.round(height * 0.68)}" text-anchor="middle" font-family="'JetBrains Mono', 'SFMono-Regular', monospace" font-size="9.5" font-weight="800" fill="${fillCol}">${escapeXml(label)}</text>
    </g>
  `;
}


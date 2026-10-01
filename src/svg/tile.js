import { escapeXml } from './escape.js';
import { fitText } from './text.js';

/**
 * Standardized SVG Labelled Metric Tile Component.
 * Ensures every metric tile features a visible label, a prominent hero number,
 * an optional vector icon, and an optional delta chip or subtitle without text overflow.
 *
 * @param {object} params
 * @param {number} [params.x=0] - Horizontal position
 * @param {number} [params.y=0] - Vertical position
 * @param {number} [params.width=120] - Tile width
 * @param {number} [params.height=58] - Tile height
 * @param {string} params.label - Visible metric label (e.g., 'COMMITS', 'STARS')
 * @param {string|number} params.value - Prominent hero number
 * @param {string} [params.icon] - Optional SVG icon string
 * @param {string} [params.delta] - Optional delta indicator (e.g., '▲ +12%', '▼ -4%')
 * @param {string} [params.deltaType='positive'] - 'positive' | 'negative' | 'neutral'
 * @param {string} [params.subtext] - Optional helper text
 * @param {string} [params.accentColor] - Optional left accent bar color
 * @param {object} params.theme - Theme palette
 * @returns {string} SVG <g> element
 */
export function renderMetricTile({
  x = 0,
  y = 0,
  width = 120,
  height = 58,
  label = '',
  value = '0',
  icon = null,
  delta = null,
  deltaType = 'positive',
  subtext = null,
  accentColor = null,
  theme = {},
}) {
  const innerPadX = 12;
  const contentWidth = width - innerPadX * 2;

  // Format and fit text safely
  const labelText = escapeXml(fitText(String(label).toUpperCase(), 9.5, contentWidth - (icon ? 18 : 0)));
  const valString = String(value);
  const valFontSize = valString.length > 7 ? 16 : 18;
  const valText = escapeXml(fitText(valString, valFontSize, contentWidth));

  const deltaColor = deltaType === 'positive'
    ? (theme.positive || '#3fb950')
    : deltaType === 'negative'
      ? (theme.negative || '#f85149')
      : (theme.neutral || theme.secondaryText || '#8b949e');

  const deltaBg = deltaType === 'positive'
    ? 'rgba(63, 185, 80, 0.15)'
    : deltaType === 'negative'
      ? 'rgba(248, 81, 73, 0.15)'
      : 'rgba(139, 148, 158, 0.15)';

  const accentBar = accentColor
    ? `<rect x="0" y="0" width="3.5" height="${height}" rx="1.75" fill="${accentColor}" />`
    : '';

  const iconSvg = icon
    ? `<g transform="translate(${width - innerPadX - 14}, 9)">${icon}</g>`
    : '';

  const deltaSvg = delta ? `
    <g transform="translate(${innerPadX + Math.min(contentWidth - 45, Math.ceil(valString.length * (valFontSize * 0.58)) + 8)}, 32)">
      <rect x="0" y="0" width="${Math.max(34, delta.length * 6 + 10)}" height="15" rx="7.5" fill="${deltaBg}" />
      <text x="${Math.max(34, delta.length * 6 + 10) / 2}" y="10.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="${deltaColor}">${escapeXml(delta)}</text>
    </g>` : '';

  const subtextSvg = subtext ? `
    <text x="${innerPadX}" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="${theme.secondaryText}">${escapeXml(fitText(subtext, 9, contentWidth))}</text>
  ` : '';

  return `
    <g class="metric-tile" transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${width}" height="${height}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
      ${accentBar}
      <g transform="translate(${innerPadX}, 0)">
        <!-- Visible Label -->
        <text x="0" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="600" letter-spacing="0.5" fill="${theme.secondaryText}">${labelText}</text>
        
        <!-- Hero Number -->
        <text x="0" y="${subtext ? 36 : 42}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${valFontSize}" font-weight="800" fill="${theme.title}">${valText}</text>
      </g>
      ${iconSvg}
      ${deltaSvg}
      ${subtextSvg}
    </g>`;
}

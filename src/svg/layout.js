/**
 * SVG Card Dimensions, Layout Breakpoints, and Size Classes.
 * Defines canonical README display widths:
 * - Full (830px): Standard GitHub desktop README container width
 * - Half (405px): Fits 2 cards side-by-side in a 2-column GitHub README Markdown table
 * - Legacy (495px): Default backward-compatible size
 */

export const CANONICAL_WIDTHS = {
  full: 830,
  half: 405,
  legacy: 495,
  compact: 405,
};

/**
 * Resolves card width from query options.
 * @param {string|number} widthParam - Option value (number or keyword like 'full', 'half', 'legacy')
 * @param {number} [defaultWidth=495] - Fallback width
 * @returns {number} Resolved pixel width clamped between 300px and 1200px
 */
export function resolveCardWidth(widthParam, defaultWidth = CANONICAL_WIDTHS.legacy) {
  if (widthParam === undefined || widthParam === null || widthParam === '') {
    return defaultWidth;
  }

  if (typeof widthParam === 'string') {
    const key = widthParam.toLowerCase().trim();
    if (key === 'full' || key === 'wide') return CANONICAL_WIDTHS.full;
    if (key === 'half' || key === 'compact' || key === 'mini') return CANONICAL_WIDTHS.half;
    if (key === 'legacy' || key === 'default') return CANONICAL_WIDTHS.legacy;

    const parsed = parseInt(key, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.max(300, Math.min(1200, parsed));
    }
  }

  if (typeof widthParam === 'number' && !isNaN(widthParam) && widthParam > 0) {
    return Math.max(300, Math.min(1200, Math.round(widthParam)));
  }

  return defaultWidth;
}

/**
 * Returns size class name ('full' | 'half' | 'legacy') for a given width.
 * @param {number} width
 * @returns {'full'|'half'|'legacy'}
 */
export function getSizeClass(width) {
  if (width >= 700) return 'full';
  if (width <= 440) return 'half';
  return 'legacy';
}

/**
 * Standard card inner margins and content bounds.
 * @param {number} width - Total card width
 * @returns {{ paddingX: number, paddingY: number, contentWidth: number }}
 */
export function getCardBounds(width) {
  const paddingX = width <= 405 ? 16 : 24;
  const paddingY = 22;
  const contentWidth = width - paddingX * 2;
  return { paddingX, paddingY, contentWidth };
}

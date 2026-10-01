import { escapeXml } from './escape.js';
import { fitText } from './text.js';

/**
 * Shared SVG visual primitives for card variants.
 */

/**
 * Renders topic pills/chips.
 * @param {string[]} topics - Array of topic strings
 * @param {number} maxCount - Maximum number of chips to render
 * @param {number} maxWidth - Total width constraint for topic row
 * @param {object} theme - Card theme palette
 * @returns {string} SVG <g> element
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
 * Renders a stacked horizontal proportion bar for languages.
 * @param {Array<{name: string, color: string, percentage: number}>} languages
 * @param {number} width - Bar width
 * @param {number} [height=6] - Bar height
 * @param {object} theme - Card theme
 * @returns {string} SVG <g> element
 */
export function renderLanguageBar(languages = [], width = 200, height = 6, theme = {}) {
  if (!languages || !languages.length) return '';
  const total = languages.reduce((acc, l) => acc + (l.percentage || 0), 0) || 100;
  let currentX = 0;
  const radius = Math.floor(height / 2);

  // Mask / clip-path for rounded corners on the entire stacked bar
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
 * Renders an 8-bucket sparkline path representing weekly activity.
 * @param {number[]} bins - 8 numeric activity counts
 * @param {number} width - Sparkline width
 * @param {number} height - Sparkline height
 * @param {string} strokeColor - Line stroke color
 * @param {string} [fillColor] - Optional gradient/fill color under line
 * @returns {string} SVG <g> element
 */
export function renderCommitSparkline(bins = [0,0,0,0,0,0,0,0], width = 80, height = 24, strokeColor = '#58a6ff', fillColor = 'none') {
  const safeBins = bins.length === 8 ? bins : (bins.slice(0, 8).concat(new Array(Math.max(0, 8 - bins.length)).fill(0)));
  const max = Math.max(...safeBins, 1);
  const step = width / 7;

  const points = safeBins.map((val, idx) => {
    const x = Math.round(idx * step);
    // Invert y: 0 is at bottom (height - 2), max is at top (2)
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
 * Renders a release tag pill badge (e.g., "v1.2.0").
 * @param {string} tagName - Tag name string
 * @param {object} theme - Card theme palette
 * @returns {string} SVG <g> element
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

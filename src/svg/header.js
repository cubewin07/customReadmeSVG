import { escapeXml } from './escape.js';

/**
 * Standardized SVG header component for cards.
 * @param {object} params
 * @param {string} params.title - Card title text
 * @param {string} [params.badgeText] - Optional badge / pill text on the right
 * @param {number} [params.width=495] - Total width of the card
 * @param {object} params.theme - Card theme palette
 * @returns {string} SVG <g> element containing header title and optional pill badge
 */
export function renderCardHeader({ title, badgeText, width = 495, theme }) {
  const titleText = escapeXml(title);
  const badge = badgeText ? escapeXml(badgeText) : null;
  const badgeW = badge ? Math.max(90, Math.ceil(badge.length * 6.5) + 24) : 0;
  const badgeX = width - 48 - badgeW;

  return `
    <g transform="translate(24, 22)">
      <text x="0" y="0" class="card-header-title" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="17" fill="${theme.title}">${titleText}</text>
      ${badge ? `
        <rect x="${badgeX}" y="-14" width="${badgeW}" height="20" rx="10" fill="${theme.badgeBg}"/>
        <text x="${badgeX + badgeW / 2}" y="0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="10" fill="${theme.title}">${badge}</text>
      ` : ''}
    </g>`;
}

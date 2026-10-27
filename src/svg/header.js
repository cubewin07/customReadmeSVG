import { escapeXml } from './escape.js';
import { fitText, measureText } from './text.js';

/**
 * Standardized SVG header component for cards.
 * @param {object} params
 * @param {string} params.title - Card title text
 * @param {string} [params.badgeText] - Optional badge / pill text on the right
 * @param {number} [params.width=495] - Total width of the card
 * @param {object} params.theme - Card theme palette
 * @returns {string} SVG <g> element containing header title and optional pill badge
 */
export function renderCardHeader({ title, badgeText, width = 495, theme = {} }) {
  const rawBadge = badgeText ? String(badgeText) : null;
  const badge = !rawBadge ? null : escapeXml(rawBadge);
  const badgeW = rawBadge ? Math.max(88, Math.ceil(measureText(rawBadge, 11) + 26)) : 0;
  const innerWidth = width - 48;
  const badgeX = innerWidth - badgeW;
  const maxTitleWidth = rawBadge ? Math.max(120, badgeX - 24) : innerWidth - 14;
  const titleText = escapeXml(fitText(String(title || ''), 18, maxTitleWidth));
  const accent = theme.accent || theme.title || '#58a6ff';
  const pillBg = (theme.badgeBg && !String(theme.badgeBg).startsWith('rgba')) ? theme.badgeBg : (theme.cardBg || '#161b22');

  return `
    <g transform="translate(24, 24)">
      <line x1="1.5" y1="-12" x2="1.5" y2="3" stroke="${accent}" stroke-width="3" stroke-linecap="round" />
      <text x="10" y="0" class="card-header-title" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="16.5" letter-spacing="-0.02em" fill="${theme.title}">${titleText}</text>
      ${badge ? `
        <rect x="${badgeX}" y="-14" width="${badgeW}" height="20" rx="10" fill="${pillBg}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>
        <text x="${badgeX + badgeW / 2}" y="-0.5" text-anchor="middle" font-family="'JetBrains Mono', 'SFMono-Regular', Consolas, monospace" font-weight="700" font-size="9.5" fill="${theme.title}">${badge}</text>
      ` : ''}
    </g>`;
}

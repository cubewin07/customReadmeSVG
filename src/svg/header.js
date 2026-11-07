import { escapeXml } from './escape.js';
import { fitText, measureText } from './text.js';

const UI = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/**
 * Standardized SVG header component for cards, written as a GitHub path: `owner / title`.
 * @param {object} params
 * @param {string} params.title - Card title text
 * @param {string} [params.owner] - Optional account name shown before the title
 * @param {string} [params.badgeText] - Optional short fact aligned to the right
 * @param {number} [params.width=495] - Total width of the card
 * @param {object} params.theme - Card theme palette
 * @returns {string} SVG <g> element containing the header
 */
export function renderCardHeader({ title, owner, badgeText, width = 495, theme = {} }) {
  const pad = width <= 440 ? 16 : 24;
  const innerWidth = width - pad * 2;
  const rawBadge = badgeText ? String(badgeText) : null;
  const badgeW = rawBadge ? Math.ceil(rawBadge.length * 11 * 0.61) : 0;
  const accent = theme.accent || theme.title || '#3fb950';

  const available = innerWidth - 16 - (rawBadge ? badgeW + 16 : 0);
  const rawTitle = String(title || '');
  const titleW = Math.ceil(measureText(rawTitle, 13.5) * 1.08);
  const ownerRoom = Math.max(0, available - titleW - 18);
  const fittedOwner = owner ? fitText(String(owner), 13.5, ownerRoom) : '';
  const showOwner = fittedOwner && ownerRoom >= 48;
  const fittedTitle = fitText(rawTitle, 13.5, showOwner ? titleW : available / 1.08);

  const ownerSpan = showOwner
    ? `<tspan fill="${theme.secondaryText}" font-weight="400">${escapeXml(fittedOwner)} / </tspan>`
    : '';

  return `
    <g transform="translate(${pad}, 28)">
      <rect x="0" y="-9" width="9" height="9" rx="2" fill="${accent}" />
      <text x="16" y="0" class="card-header-title" font-family="${UI}" font-weight="600" font-size="13.5" fill="${theme.text}">${ownerSpan}${escapeXml(fittedTitle)}</text>
      ${rawBadge ? `<text x="${innerWidth}" y="0" text-anchor="end" font-family="${MONO}" font-size="11" fill="${theme.secondaryText}">${escapeXml(rawBadge)}</text>` : ''}
    </g>`;
}

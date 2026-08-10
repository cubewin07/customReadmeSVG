import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { normalizeLanguages } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';

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

  renderSvg(data, theme, options = {}) {
    const username = escapeXml(options.username || 'User');
    const topLangs = (data.languages || []).slice(0, 8);
    const totalSize = data.totalSize || 0;

    const barWidth = 350;
    let currentX = 0;

    const progressSegments = topLangs.map((lang, idx) => {
      const segWidth = totalSize > 0 ? (lang.size / totalSize) * barWidth : 0;
      const isFirst = idx === 0;
      const isLast = idx === topLangs.length - 1;
      const x = currentX;
      currentX += segWidth;

      if (segWidth <= 0) return '';
      return `<rect x="${x.toFixed(1)}" y="0" width="${segWidth.toFixed(1)}" height="8" fill="${lang.color}" ${isFirst ? 'rx="4"' : ''} />`;
    }).join('');

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
      ${topLangs.length === 0 ? `
        <text x="0" y="15" class="empty-msg">No language statistics found.</text>
      ` : topLangs.map((lang, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 175;
        const y = row * 24;
        return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="18" y="9" class="lang-name">${escapeXml(lang.name)} <tspan fill="${theme.secondaryText}">(${lang.percentage}%)</tspan></text>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
  },
};

export default languagesCard;

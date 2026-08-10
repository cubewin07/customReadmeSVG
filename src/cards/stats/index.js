import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { escapeXml } from '../../svg/escape.js';

export const statsCard = {
  id: 'stats',
  title: 'GitHub Stats',
  aliases: ['metrics'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    try {
      const data = await graphql(STATS_QUERY, { username }, {
        ...options,
        cacheKey: `gh:stats:${username}`,
      });
      return data?.user || null;
    } catch (err) {
      return { error: err.message };
    }
  },

  renderSvg(data, theme, options = {}) {
    const username = escapeXml(options.username || 'User');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .stat-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 14px; fill: ${theme.accent}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="149" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 30)">
    <text x="0" y="0" class="header">GitHub Stats (${username})</text>
    <g transform="translate(0, 30)">
      <text x="0" y="0" class="stat-label">Total Stars Earned:</text>
      <text x="160" y="0" class="stat-val">⭐ --</text>
      <text x="0" y="30" class="stat-label">Total Commits:</text>
      <text x="160" y="30" class="stat-val">💪 --</text>
    </g>
  </g>
</svg>`;
  },
};

export default statsCard;

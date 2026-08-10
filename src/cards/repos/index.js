import { graphql } from '../../core/github/client.js';
import { REPOS_QUERY } from '../../core/github/queries.js';
import { escapeXml } from '../../svg/escape.js';

export const reposCard = {
  id: 'repos',
  title: 'Top Repositories',
  aliases: ['top-repos'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    try {
      const data = await graphql(REPOS_QUERY, { username }, {
        ...options,
        cacheKey: `gh:repos:${username}`,
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
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 13px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="149" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 30)">
    <text x="0" y="0" class="header">Top Repositories (${username})</text>
    <g transform="translate(0, 25)">
      <text x="0" y="10" class="repo-name">customReadmeSVG</text>
      <text x="0" y="28" class="repo-desc">Extensible SVG cards generator for GitHub README</text>
    </g>
  </g>
</svg>`;
  },
};

export default reposCard;

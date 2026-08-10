import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';

export const statsCard = {
  id: 'stats',
  title: 'GitHub Stats',
  aliases: ['metrics'],
  cacheTtlMs: 3600000, // 1 hour

  async fetchData(username, options = {}) {
    const data = await graphql(STATS_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:stats:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });

    const normalized = normalizeStats(data);
    if (!normalized) {
      throw new Error(`User "${username}" not found.`);
    }
    return normalized;
  },

  renderSvg(data, theme, options = {}) {
    const name = escapeXml(data?.name || data?.login || options.username || 'User');
    const totalStars = data?.totalStars ?? 0;
    const totalForks = data?.totalForks ?? 0;
    const totalRepos = data?.totalRepos ?? 0;
    const followers = data?.followers ?? 0;
    const totalCommits = data?.totalCommits ?? 0;

    const statsList = [
      { label: 'Total Stars Earned', value: `⭐ ${totalStars.toLocaleString()}` },
      { label: 'Total Commits', value: `💪 ${totalCommits.toLocaleString()}` },
      { label: 'Total Forks', value: `🔀 ${totalForks.toLocaleString()}` },
      { label: 'Public Repositories', value: `📦 ${totalRepos.toLocaleString()}` },
      { label: 'Followers', value: `👥 ${followers.toLocaleString()}` },
    ];

    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 13px; fill: ${theme.accent || theme.title}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="199" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="header">${name}'s GitHub Stats</text>
    <g transform="translate(0, 22)">
      ${statsList.map((stat, idx) => `
        <g transform="translate(0, ${idx * 25})">
          <text x="0" y="10" class="stat-lbl">${stat.label}:</text>
          <text x="340" y="10" text-anchor="end" class="stat-val">${stat.value}</text>
        </g>
      `).join('')}
    </g>
  </g>
</svg>`;
  },
};

export default statsCard;

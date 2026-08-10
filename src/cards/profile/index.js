import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { escapeXml } from '../../svg/escape.js';

export const profileCard = {
  id: 'profile',
  title: 'Profile Overview',
  aliases: ['overview', 'default'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    try {
      const data = await graphql(PROFILE_QUERY, { username }, {
        ...options,
        cacheKey: `gh:profile:${username}`,
      });
      return data?.user || null;
    } catch (err) {
      return { error: err.message };
    }
  },

  renderSvg(data, theme, options = {}) {
    const username = escapeXml(options.username || data?.login || 'User');
    const name = escapeXml(data?.name || username);
    const bio = escapeXml(data?.bio || 'GitHub Profile Card');
    const followers = data?.followers?.totalCount ?? 0;
    const following = data?.following?.totalCount ?? 0;
    const repos = data?.repositories?.totalCount ?? 0;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="170" viewBox="0 0 450 170" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 18px; fill: ${theme.title}; }
    .stat-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .stat-value { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 14px; fill: ${theme.text}; }
    .bio { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.text}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="449" height="169" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 30)">
    <text x="0" y="0" class="header">${name}</text>
    <text x="0" y="22" class="bio">${bio}</text>
    
    <g transform="translate(0, 60)">
      <text x="0" y="0" class="stat-label">Repositories</text>
      <text x="0" y="20" class="stat-value">${repos}</text>
      
      <text x="120" y="0" class="stat-label">Followers</text>
      <text x="120" y="20" class="stat-value">${followers}</text>
      
      <text x="240" y="0" class="stat-label">Following</text>
      <text x="240" y="20" class="stat-value">${following}</text>
    </g>
  </g>
</svg>`;
  },
};

export default profileCard;

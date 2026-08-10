import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { normalizeProfile } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';

export const profileCard = {
  id: 'profile',
  title: 'Profile Overview',
  aliases: ['overview', 'default'],
  cacheTtlMs: 3600000, // 1 hour

  async fetchData(username, options = {}) {
    const data = await graphql(PROFILE_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:profile:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });

    const normalized = normalizeProfile(data);
    if (!normalized) {
      throw new Error(`User "${username}" not found.`);
    }
    return normalized;
  },

  renderSvg(data, theme, options = {}) {
    const name = escapeXml(data?.name || data?.login || options.username || 'User');
    const handle = escapeXml(`@${data?.login || options.username || ''}`);
    const bio = escapeXml(data?.bio || 'No bio provided.');
    const followers = data?.followers ?? 0;
    const following = data?.following ?? 0;
    const repos = data?.repositories ?? 0;
    const company = data?.company ? escapeXml(data.company) : null;
    const location = data?.location ? escapeXml(data.location) : null;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="465" height="190" viewBox="0 0 465 190" fill="none">
  <style>
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 18px; fill: ${theme.title}; }
    .handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .bio { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.text}; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 15px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
    .meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="464" height="189" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="name">${name}</text>
    <text x="0" y="18" class="handle">${handle}</text>
    <text x="0" y="42" class="bio">${bio.length > 60 ? bio.slice(0, 57) + '...' : bio}</text>
    
    <g transform="translate(0, 68)">
      <rect x="0" y="0" width="415" height="42" rx="4" fill="${theme.cardBg || theme.barBg}" />
      <g transform="translate(20, 16)">
        <text x="0" y="0" class="stat-lbl">Repositories</text>
        <text x="0" y="16" class="stat-val">${repos}</text>
        
        <text x="130" y="0" class="stat-lbl">Followers</text>
        <text x="130" y="16" class="stat-val">${followers}</text>
        
        <text x="260" y="0" class="stat-lbl">Following</text>
        <text x="260" y="16" class="stat-val">${following}</text>
      </g>
    </g>

    <g transform="translate(0, 140)" class="meta">
      ${company ? `<text x="0" y="0">🏢 ${company}</text>` : ''}
      ${location ? `<text x="${company ? 200 : 0}" y="0">📍 ${location}</text>` : ''}
    </g>
  </g>
</svg>`;
  },
};

export default profileCard;

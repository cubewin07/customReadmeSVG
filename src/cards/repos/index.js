import { graphql } from '../../core/github/client.js';
import { REPOS_QUERY } from '../../core/github/queries.js';
import { normalizeRepos } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';

export const reposCard = {
  id: 'repos',
  title: 'Top Repositories',
  aliases: ['top-repos'],
  cacheTtlMs: 7200000, // 2 hours

  async fetchData(username, options = {}) {
    const data = await graphql(REPOS_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:repos:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });

    const normalized = normalizeRepos(data);
    if (!normalized || (!normalized.repos.length && !data?.user)) {
      throw new Error(`User "${username}" not found or has no public repositories.`);
    }
    return normalized;
  },

  renderSvg(data, theme, options = {}) {
    const isV0 = options.version === 'v0';

    if (isV0) {
      return renderV0Svg(data, theme, options);
    }
    return renderV1Svg(data, theme, options);
  },
};

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function renderV1Svg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 6);

  const rowsCount = Math.ceil(reposList.length / 2) || 1;
  const width = 495;
  const cardHeight = Math.max(150, 65 + rowsCount * 76);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-gradient)" stroke="${theme.border}"/>
  
  <g transform="translate(25, 24)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Top Repositories (${username})</text>
    </g>
    
    <!-- Repos Grid -->
    <g transform="translate(0, 20)">
      ${reposList.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : reposList.map((repo, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 228;
        const y = row * 72;
        const langColor = repo.primaryLanguage?.color || '#858585';
        const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
        const name = escapeXml(repo.name);
        const desc = escapeXml(repo.description);
        const updatedTime = formatRelativeTime(repo.updatedAt);

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="216" height="64" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <!-- Left Color Accent Bar -->
          <rect x="0" y="0" width="4" height="64" rx="2" fill="${langColor}" />
          
          <g transform="translate(14, 14)">
            <!-- Title -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="18" y="0" class="repo-name">${name.length > 20 ? name.slice(0, 18) + '...' : name}</text>
            </g>

            <!-- Description -->
            <text x="0" y="16" class="repo-desc">${desc.length > 32 ? desc.slice(0, 29) + '...' : desc || 'No description provided'}</text>
            
            <!-- Meta Footer -->
            <g transform="translate(0, 32)" class="repo-meta">
              ${langName ? `<circle cx="4" cy="-4" r="3.5" fill="${langColor}" /><text x="12" y="0">${langName}</text>` : ''}
              <text x="${langName ? 78 : 0}" y="0">${icons.star(theme.iconColor)} ${repo.stargazerCount}</text>
              <text x="${langName ? 122 : 44}" y="0">${icons.fork(theme.secondaryText)} ${repo.forkCount}</text>
              ${updatedTime ? `<text x="200" y="0" text-anchor="end" fill="${theme.secondaryText}">${updatedTime}</text>` : ''}
            </g>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderV0Svg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 6);

  const rowsCount = Math.ceil(reposList.length / 2) || 1;
  const cardHeight = Math.max(140, 70 + rowsCount * 65);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="${cardHeight}" viewBox="0 0 480 ${cardHeight}" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 600; font-size: 13px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 11px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="479" height="${cardHeight - 1}" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="header">Top Repositories (${username})</text>
    
    <g transform="translate(0, 20)">
      ${reposList.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : reposList.map((repo, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 220;
        const y = row * 62;
        const langColor = repo.primaryLanguage?.color || '#858585';
        const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
        const name = escapeXml(repo.name);
        const desc = escapeXml(repo.description);

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="210" height="56" rx="4" fill="${theme.cardBg || theme.barBg}" stroke="${theme.border}" />
          <g transform="translate(12, 16)">
            <text x="0" y="0" class="repo-name">${name.length > 22 ? name.slice(0, 20) + '...' : name}</text>
            <text x="0" y="15" class="repo-desc">${desc.length > 32 ? desc.slice(0, 29) + '...' : desc || 'No description'}</text>
            <g transform="translate(0, 30)" class="repo-meta">
              ${langName ? `<circle cx="4" cy="-4" r="4" fill="${langColor}" /><text x="12" y="0">${langName}</text>` : ''}
              <text x="${langName ? 90 : 0}" y="0">⭐ ${repo.stargazerCount}</text>
              <text x="${langName ? 145 : 60}" y="0">🔀 ${repo.forkCount}</text>
            </g>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export default reposCard;

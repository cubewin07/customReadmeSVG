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

function formatCount(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function renderV1Svg(data, theme, options = {}) {
  const layout = (options.layout || 'grid').toLowerCase();

  if (layout === 'featured' || layout === 'hero') {
    return renderV1FeaturedSvg(data, theme, options);
  }
  if (layout === 'spotlight' || layout === 'showcase') {
    return renderV1SpotlightSvg(data, theme, options);
  }
  if (layout === 'timeline' || layout === 'activity' || layout === 'tree') {
    return renderV1TimelineSvg(data, theme, options);
  }
  if (layout === 'leaderboard' || layout === 'ranked' || layout === 'rank') {
    return renderV1LeaderboardSvg(data, theme, options);
  }
  return renderV1GridSvg(data, theme, options);
}

function renderV1GridSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 6);

  const rowsCount = Math.ceil(reposList.length / 2) || 1;
  const width = 495;
  const itemHeight = 66;
  const rowGap = 74;
  const cardHeight = Math.max(150, 65 + rowsCount * rowGap);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-grid-bg" x1="0%" y1="0%" x2="100%" y2="100%">
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
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-grid-bg)" stroke="${theme.border}"/>
  
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
        const y = row * rowGap;
        const langColor = repo.primaryLanguage?.color || '#858585';
        const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
        const name = escapeXml(repo.name);
        const desc = escapeXml(repo.description);
        const updatedTime = formatRelativeTime(repo.updatedAt);

        const formattedStars = formatCount(repo.stargazerCount);
        const formattedForks = formatCount(repo.forkCount);

        let currentX = 0;
        let langSvg = '';
        if (langName) {
          const displayLang = langName.length > 9 ? langName.slice(0, 8) + '...' : langName;
          langSvg = `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${displayLang}</text>`;
          currentX = 12 + Math.ceil(displayLang.length * 6.2) + 8;
        }

        const starX = currentX;
        const starTextX = starX + 15;
        const starWidth = 15 + Math.ceil(formattedStars.length * 6.2);

        const forkX = starX + starWidth + 8;
        const forkTextX = forkX + 15;

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="216" height="${itemHeight}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <!-- Left Color Accent Bar -->
          <rect x="0" y="0" width="4" height="${itemHeight}" rx="2" fill="${langColor}" />
          
          <g transform="translate(12, 10)">
            <!-- Title -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="18" y="11" class="repo-name">${name.length > 20 ? name.slice(0, 18) + '...' : name}</text>
            </g>

            <!-- Description -->
            <text x="0" y="27" class="repo-desc">${desc.length > 33 ? desc.slice(0, 30) + '...' : desc || 'No description provided'}</text>
            
            <!-- Meta Footer -->
            <g transform="translate(0, 45)" class="repo-meta">
              ${langSvg}
              <g transform="translate(${starX}, -10)">${icons.star(theme.iconColor)}</g>
              <text x="${starTextX}" y="0">${formattedStars}</text>
              <g transform="translate(${forkX}, -10)">${icons.fork(theme.secondaryText)}</g>
              <text x="${forkTextX}" y="0">${formattedForks}</text>
              ${updatedTime ? `<text x="192" y="0" text-anchor="end" fill="${theme.secondaryText}">${updatedTime}</text>` : ''}
            </g>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderV1FeaturedSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 5);
  const heroRepo = reposList[0];
  const subRepos = reposList.slice(1, 5);

  const width = 495;
  const subRows = Math.ceil(subRepos.length / 2) || 0;
  const cardHeight = Math.max(220, 65 + 86 + (subRepos.length > 0 ? 14 + subRows * 72 : 0));

  const heroLangColor = heroRepo?.primaryLanguage?.color || '#858585';
  const heroLangName = heroRepo?.primaryLanguage?.name ? escapeXml(heroRepo.primaryLanguage.name) : null;
  const heroName = heroRepo ? escapeXml(heroRepo.name) : 'No Repo';
  const heroDesc = heroRepo ? escapeXml(heroRepo.description) : '';
  const heroUpdated = heroRepo ? formatRelativeTime(heroRepo.updatedAt) : '';
  const heroStars = heroRepo ? formatCount(heroRepo.stargazerCount) : '0';
  const heroForks = heroRepo ? formatCount(heroRepo.forkCount) : '0';

  let heroCurrentX = 0;
  let heroLangSvg = '';
  if (heroLangName) {
    heroLangSvg = `<circle cx="4" cy="-3.5" r="3.5" fill="${heroLangColor}" /><text x="12" y="0">${heroLangName}</text>`;
    heroCurrentX = 12 + Math.ceil(heroLangName.length * 6.5) + 12;
  }

  const heroStarX = heroCurrentX;
  const heroStarTextX = heroStarX + 15;
  const heroStarWidth = 15 + Math.ceil(heroStars.length * 6.5);

  const heroForkX = heroStarX + heroStarWidth + 12;
  const heroForkTextX = heroForkX + 15;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-feat-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 15px; fill: ${theme.title}; }
    .hero-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; fill: ${theme.secondaryText}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12.5px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-feat-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Top Repositories (${username})</text>
      <rect x="332" y="-14" width="115" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="390" y="0" text-anchor="middle" class="badge-text">🌟 Featured Project</text>
    </g>
    
    ${!heroRepo ? `<text x="0" y="40" class="empty-msg">No repositories found.</text>` : `
      <!-- Featured Hero Card -->
      <g transform="translate(0, 16)">
        <rect x="0" y="0" width="447" height="82" rx="8" fill="${theme.cardBg}" stroke="${theme.border}" />
        <rect x="0" y="0" width="4" height="82" rx="2" fill="${heroLangColor}" />
        
        <g transform="translate(14, 12)">
          <!-- Title & Hero Badge -->
          <g transform="translate(0, 0)">
            ${icons.repo(theme.title)}
            <text x="20" y="12" class="hero-name">${heroName}</text>
          </g>

          <!-- Description -->
          <text x="0" y="34" class="hero-desc">${heroDesc.length > 75 ? heroDesc.slice(0, 72) + '...' : heroDesc || 'No description provided'}</text>
          
          <!-- Hero Meta -->
          <g transform="translate(0, 56)" class="repo-meta">
            ${heroLangSvg}
            <g transform="translate(${heroStarX}, -10)">${icons.star(theme.iconColor)}</g>
            <text x="${heroStarTextX}" y="0">${heroStars}</text>
            <g transform="translate(${heroForkX}, -10)">${icons.fork(theme.secondaryText)}</g>
            <text x="${heroForkTextX}" y="0">${heroForks}</text>
            ${heroUpdated ? `<text x="420" y="0" text-anchor="end" fill="${theme.secondaryText}">${heroUpdated}</text>` : ''}
          </g>
        </g>
      </g>

      <!-- Secondary Repos Grid -->
      <g transform="translate(0, 112)">
        ${subRepos.map((repo, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = col * 228;
          const y = row * 72;
          const langColor = repo.primaryLanguage?.color || '#858585';
          const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
          const name = escapeXml(repo.name);
          const desc = escapeXml(repo.description);
          const updatedTime = formatRelativeTime(repo.updatedAt);
          const formattedStars = formatCount(repo.stargazerCount);
          const formattedForks = formatCount(repo.forkCount);

          let currentX = 0;
          let langSvg = '';
          if (langName) {
            const displayLang = langName.length > 9 ? langName.slice(0, 8) + '...' : langName;
            langSvg = `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${displayLang}</text>`;
            currentX = 12 + Math.ceil(displayLang.length * 6.2) + 8;
          }

          const starX = currentX;
          const starTextX = starX + 15;
          const starWidth = 15 + Math.ceil(formattedStars.length * 6.2);

          const forkX = starX + starWidth + 8;
          const forkTextX = forkX + 15;

          return `
          <g transform="translate(${x}, ${y})">
            <rect x="0" y="0" width="216" height="64" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
            <rect x="0" y="0" width="4" height="64" rx="2" fill="${langColor}" />
            
            <g transform="translate(12, 10)">
              <g transform="translate(0, 0)">
                ${icons.repo(theme.title)}
                <text x="18" y="11" class="repo-name">${name.length > 20 ? name.slice(0, 18) + '...' : name}</text>
              </g>

              <text x="0" y="26" class="repo-desc">${desc.length > 32 ? desc.slice(0, 29) + '...' : desc || 'No description'}</text>
              
              <g transform="translate(0, 43)" class="repo-meta">
                ${langSvg}
                <g transform="translate(${starX}, -10)">${icons.star(theme.iconColor)}</g>
                <text x="${starTextX}" y="0">${formattedStars}</text>
                <g transform="translate(${forkX}, -10)">${icons.fork(theme.secondaryText)}</g>
                <text x="${forkTextX}" y="0">${formattedForks}</text>
                ${updatedTime ? `<text x="192" y="0" text-anchor="end" fill="${theme.secondaryText}">${updatedTime}</text>` : ''}
              </g>
            </g>
          </g>`;
        }).join('')}
      </g>
    `}
  </g>
</svg>`;
}

function renderV1SpotlightSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 4);
  const heroRepo = reposList[0];
  const sideRepos = reposList.slice(1, 4);

  const width = 495;
  const cardHeight = 275;

  const heroLangColor = heroRepo?.primaryLanguage?.color || '#858585';
  const heroLangName = heroRepo?.primaryLanguage?.name ? escapeXml(heroRepo.primaryLanguage.name) : null;
  const heroName = heroRepo ? escapeXml(heroRepo.name) : 'No Repo';
  const heroDesc = heroRepo ? escapeXml(heroRepo.description) : '';
  const heroUpdated = heroRepo ? formatRelativeTime(heroRepo.updatedAt) : '';
  const heroStars = heroRepo ? formatCount(heroRepo.stargazerCount) : '0';
  const heroForks = heroRepo ? formatCount(heroRepo.forkCount) : '0';

  let heroLangSvg = '';
  if (heroLangName) {
    heroLangSvg = `<circle cx="4" cy="-3.5" r="3.5" fill="${heroLangColor}" /><text x="12" y="0">${heroLangName}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-spot-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 16px; fill: ${theme.title}; }
    .hero-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .side-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .side-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-spot-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Top Repositories (${username})</text>
      <rect x="330" y="-14" width="117" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="388" y="0" text-anchor="middle" class="badge-text">✨ Spotlight</text>
    </g>
    
    <!-- Spotlight Magazine Layout (2 Columns) -->
    <g transform="translate(0, 20)">
      ${!heroRepo ? `<text x="0" y="20" class="empty-msg">No repositories found.</text>` : `
        <!-- Left Spotlight Hero Column (width 255px, height 205px) -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="255" height="205" rx="8" fill="${theme.cardBg}" stroke="${theme.border}" />
          <rect x="0" y="0" width="255" height="4" rx="2" fill="${heroLangColor}" />
          
          <g transform="translate(14, 16)">
            <!-- Title -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="20" y="12" class="hero-name">${heroName.length > 18 ? heroName.slice(0, 16) + '...' : heroName}</text>
            </g>

            <!-- Spotlight Badge -->
            <rect x="0" y="26" width="90" height="18" rx="9" fill="${theme.badgeBg}"/>
            <text x="45" y="38" text-anchor="middle" class="badge-text">⭐ #1 Spotlight</text>

            <!-- Multi-line Description -->
            <text x="0" y="66" class="hero-desc">${heroDesc ? (heroDesc.length > 90 ? heroDesc.slice(0, 87) + '...' : heroDesc) : 'No description provided'}</text>
            
            <!-- Hero Footer -->
            <g transform="translate(0, 158)" class="repo-meta">
              ${heroLangSvg}
              <g transform="translate(75, -10)">${icons.star(theme.iconColor)}</g>
              <text x="91" y="0">${heroStars}</text>
              <g transform="translate(132, -10)">${icons.fork(theme.secondaryText)}</g>
              <text x="148" y="0">${heroForks}</text>
              ${heroUpdated ? `<text x="227" y="0" text-anchor="end" fill="${theme.secondaryText}">${heroUpdated}</text>` : ''}
            </g>
          </g>
        </g>

        <!-- Right Side Stacked Cards Column (3 cards, width 180px each, height 63px) -->
        <g transform="translate(267, 0)">
          ${sideRepos.map((repo, idx) => {
            const y = idx * 71;
            const langColor = repo.primaryLanguage?.color || '#858585';
            const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
            const displayLang = langName ? (langName.length > 8 ? langName.slice(0, 7) + '..' : langName) : '';
            const name = escapeXml(repo.name);
            const formattedStars = formatCount(repo.stargazerCount);
            const formattedForks = formatCount(repo.forkCount);

            return `
            <g transform="translate(0, ${y})">
              <rect x="0" y="0" width="180" height="63" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
              <rect x="0" y="0" width="3" height="63" rx="1.5" fill="${langColor}" />
              
              <g transform="translate(10, 10)">
                <g transform="translate(0, 0)">
                  ${icons.repo(theme.title)}
                  <text x="16" y="11" class="side-name">${name.length > 15 ? name.slice(0, 13) + '...' : name}</text>
                </g>

                <g transform="translate(0, 26)" class="side-desc">
                  ${displayLang ? `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${displayLang}</text>` : ''}
                </g>

                <g transform="translate(0, 42)" class="repo-meta">
                  <g transform="translate(0, -10)">${icons.star(theme.iconColor)}</g>
                  <text x="15" y="0">${formattedStars}</text>
                  <g transform="translate(65, -10)">${icons.fork(theme.secondaryText)}</g>
                  <text x="80" y="0">${formattedForks}</text>
                </g>
              </g>
            </g>`;
          }).join('')}
        </g>
      `}
    </g>
  </g>
</svg>`;
}

function renderV1TimelineSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 5);

  const width = 495;
  const itemGap = 66;
  const cardHeight = Math.max(180, 65 + reposList.length * itemGap);
  const stemHeight = Math.max(20, (reposList.length - 1) * itemGap);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-time-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-time-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Top Repositories (${username})</text>
      <rect x="330" y="-14" width="117" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="388" y="0" text-anchor="middle" class="badge-text">🌿 Git Timeline</text>
    </g>
    
    <!-- Timeline Branch -->
    <g transform="translate(0, 24)">
      ${reposList.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : `
        <!-- Vertical Timeline Stem Line -->
        <line x1="16" y1="26" x2="16" y2="${26 + stemHeight}" stroke="${theme.subtleBorder || theme.border}" stroke-width="2" stroke-dasharray="4 2" opacity="0.8"/>

        ${reposList.map((repo, idx) => {
          const y = idx * itemGap;
          const langColor = repo.primaryLanguage?.color || '#858585';
          const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
          const name = escapeXml(repo.name);
          const desc = escapeXml(repo.description);
          const updatedTime = formatRelativeTime(repo.updatedAt);

          const formattedStars = formatCount(repo.stargazerCount);
          const formattedForks = formatCount(repo.forkCount);

          // Calculate text widths to flow elements backward from right edge (387px)
          const updatedWidth = updatedTime ? Math.ceil(updatedTime.length * 6) : 0;
          const updatedStartX = 387 - updatedWidth;
          const metaEndX = updatedTime ? (updatedStartX - 10) : 387;

          const displayLang = langName ? (langName.length > 8 ? langName.slice(0, 7) + '..' : langName) : '';
          const langWidth = displayLang ? (12 + Math.ceil(displayLang.length * 6) + 10) : 0;
          const starWidth = 16 + Math.ceil(formattedStars.length * 6) + 10;
          const forkWidth = 16 + Math.ceil(formattedForks.length * 6);

          const totalMetaWidth = langWidth + starWidth + forkWidth;
          const metaStartX = metaEndX - totalMetaWidth;

          let currX = metaStartX;
          let langSvg = '';
          if (displayLang) {
            langSvg = `<circle cx="${currX + 4}" cy="7.5" r="3.5" fill="${langColor}" /><text x="${currX + 12}" y="11">${displayLang}</text>`;
            currX += langWidth;
          }

          const starIconX = currX;
          const starTextX = currX + 16;
          currX += starWidth;

          const forkIconX = currX;
          const forkTextX = currX + 16;

          return `
          <g transform="translate(0, ${y})">
            <!-- Timeline Branch Node Circle -->
            <circle cx="16" cy="26" r="6" fill="${langColor}" stroke="${theme.bg}" stroke-width="2"/>
            <line x1="22" y1="26" x2="36" y2="26" stroke="${langColor}" stroke-width="1.5" opacity="0.7"/>

            <!-- Repository Card -->
            <g transform="translate(36, 0)">
              <rect x="0" y="0" width="411" height="52" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
              <rect x="0" y="0" width="4" height="52" rx="2" fill="${langColor}" />
              
              <g transform="translate(12, 10)">
                <!-- Line 1: Title, Language, Stars, Forks, and Updated Time ALL aligned on y=11 -->
                <g transform="translate(0, 0)">
                  ${icons.repo(theme.title)}
                  <text x="18" y="11" class="repo-name">${name.length > 18 ? name.slice(0, 16) + '...' : name}</text>

                  <g class="repo-meta">
                    ${langSvg}
                    <g transform="translate(${starIconX}, 1)">${icons.star(theme.iconColor)}</g>
                    <text x="${starTextX}" y="11">${formattedStars}</text>
                    <g transform="translate(${forkIconX}, 1)">${icons.fork(theme.secondaryText)}</g>
                    <text x="${forkTextX}" y="11">${formattedForks}</text>
                    ${updatedTime ? `<text x="387" y="11" text-anchor="end" fill="${theme.secondaryText}">${updatedTime}</text>` : ''}
                  </g>
                </g>

                <!-- Line 2: Description on y=29 -->
                <text x="0" y="29" class="repo-desc">${desc ? (desc.length > 55 ? desc.slice(0, 52) + '...' : desc) : 'No description provided'}</text>
              </g>
            </g>
          </g>`;
        }).join('')}
      `}
    </g>
  </g>
</svg>`;
}

function renderV1LeaderboardSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const reposList = (data.repos || []).slice(0, 5);
  const maxStars = Math.max(...reposList.map(r => r.stargazerCount || 0), 1);

  const width = 495;
  const rowHeight = 44;
  const rowGap = 52;
  const cardHeight = Math.max(160, 65 + reposList.length * rowGap);

  const RANK_BADGES = [
    { label: '🥇 #1', bg: 'rgba(227, 179, 65, 0.2)', text: '#e3b341' },
    { label: '🥈 #2', bg: 'rgba(139, 148, 158, 0.2)', text: '#8b949e' },
    { label: '🥉 #3', bg: 'rgba(205, 127, 50, 0.2)', text: '#cd7f32' },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-rank-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
    .rank-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 10px; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-rank-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Top Repositories (${username})</text>
      <rect x="330" y="-14" width="117" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="388" y="0" text-anchor="middle" class="badge-text">🏆 Rank Standings</text>
    </g>
    
    <!-- Leaderboard Rows -->
    <g transform="translate(0, 20)">
      ${reposList.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : reposList.map((repo, idx) => {
        const y = idx * rowGap;
        const langColor = repo.primaryLanguage?.color || '#858585';
        const langName = repo.primaryLanguage?.name ? escapeXml(repo.primaryLanguage.name) : null;
        const displayLang = langName ? (langName.length > 8 ? langName.slice(0, 7) + '..' : langName) : '';
        const name = escapeXml(repo.name);

        const formattedStars = formatCount(repo.stargazerCount);
        const rankBadge = RANK_BADGES[idx] || { label: `#${idx + 1}`, bg: theme.barBg, text: theme.secondaryText };
        const barWidth = Math.max(6, Math.round(((repo.stargazerCount || 0) / maxStars) * 75));

        return `
        <g transform="translate(0, ${y})">
          <rect x="0" y="0" width="447" height="${rowHeight}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <rect x="0" y="0" width="4" height="${rowHeight}" rx="2" fill="${langColor}" />
          
          <g transform="translate(10, 10)">
            <!-- Rank Badge -->
            <rect x="0" y="2" width="42" height="20" rx="5" fill="${rankBadge.bg}" />
            <text x="21" y="15" text-anchor="middle" class="rank-text" fill="${rankBadge.text}">${rankBadge.label}</text>

            <!-- Title -->
            <g transform="translate(50, 2)">
              ${icons.repo(theme.title)}
              <text x="18" y="12" class="repo-name">${name.length > 18 ? name.slice(0, 16) + '...' : name}</text>
            </g>

            <!-- Language Badge -->
            <g transform="translate(210, 14)" class="repo-meta">
              ${displayLang ? `<circle cx="0" cy="-3.5" r="3.5" fill="${langColor}" /><text x="7" y="0">${displayLang}</text>` : ''}
            </g>

            <!-- Popularity Progress Bar -->
            <g transform="translate(280, 8)">
              <rect x="0" y="6" width="75" height="4" rx="2" fill="${theme.barBg}" />
              <rect x="0" y="6" width="${barWidth}" height="4" rx="2" fill="${langColor}" />
            </g>

            <!-- Stars Count -->
            <g transform="translate(372, 14)" class="repo-meta">
              <g transform="translate(0, -10)">${icons.star(theme.iconColor)}</g>
              <text x="15" y="0" font-weight="bold">${formattedStars}</text>
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

import { graphql } from '../../core/github/client.js';
import { REPOS_QUERY } from '../../core/github/queries.js';
import { normalizeRepos } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { renderCardHeader } from '../../svg/header.js';
import { fitText, wrapText } from '../../svg/text.js';
import {
  renderTopicChips,
  renderLanguageBar,
  renderCommitSparkline,
  renderReleaseTag,
} from '../../svg/primitives.js';

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

    const normalized = normalizeRepos(data, options);
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

export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
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

import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';

function renderV1Svg(data, rawTheme, options = {}) {
  const theme = resolveTheme(rawTheme, options);
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

/**
 * 1. GRID VARIANT (Pinned Work)
 * Answers: "What are my primary pinned projects?"
 * Shows: Fitted name, 1-line description, 3 topic chips, language dot, stars, forks, "pushed Xd ago".
 */
function renderV1GridSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const reposList = (data.repos || []).slice(0, 6);

  const isSingleCol = width < 450;
  const cols = isSingleCol ? 1 : (width >= 800 ? 3 : 2);
  const rowsCount = Math.ceil(reposList.length / cols) || 1;
  const colGap = 12;
  const colWidth = Math.floor((width - 48 - (cols - 1) * colGap) / cols);
  const itemHeight = 78;
  const rowGap = itemHeight + 10;
  const cardHeight = Math.max(160, 65 + rowsCount * rowGap);

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
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-grid-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    width,
    theme,
  })}
  
  <!-- Repos Grid -->
  <g transform="translate(24, 44)">
      ${reposList.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : reposList.map((repo, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = col * (colWidth + colGap);
        const y = row * rowGap;
        const langColor = repo.primaryLanguage?.color || '#858585';
        const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
        const rawName = repo.name || 'Unnamed';
        const name = escapeXml(fitText(rawName, 13, colWidth - 44));
        const rawDesc = repo.description || 'No description provided';
        const desc = escapeXml(fitText(rawDesc, 10.5, colWidth - 24));
        const pushedTime = formatRelativeTime(repo.pushedAt || repo.updatedAt);
        const formattedStars = formatCount(repo.stargazerCount);
        const formattedForks = formatCount(repo.forkCount);

        let currentX = 0;
        let langSvg = '';
        if (langName) {
          const fittedLang = escapeXml(fitText(langName, 10, 65));
          langSvg = `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${fittedLang}</text>`;
          currentX = 12 + Math.ceil(fittedLang.length * 6) + 8;
        }

        const starX = currentX;
        const starTextX = starX + 15;
        const starWidth = 15 + Math.ceil(formattedStars.length * 6.2);

        const forkX = starX + starWidth + 8;
        const forkTextX = forkX + 15;

        const topicSvg = repo.topics && repo.topics.length
          ? `<g transform="translate(0, 31)">${renderTopicChips(repo.topics, 3, colWidth - 24, theme)}</g>`
          : '';

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="${colWidth}" height="${itemHeight}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <!-- Left Accent Color Bar -->
          <rect x="0" y="0" width="4" height="${itemHeight}" rx="2" fill="${langColor}" />
          
          <g transform="translate(12, 10)">
            <!-- Title -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="18" y="11" class="repo-name">${name}</text>
            </g>

            <!-- Description -->
            <text x="0" y="26" class="repo-desc">${desc}</text>

            <!-- Topics Chips -->
            ${topicSvg}
            
            <!-- Meta Footer -->
            <g transform="translate(0, 56)" class="repo-meta">
              ${langSvg}
              <g transform="translate(${starX}, -10)">${icons.star(theme.iconColor)}</g>
              <text x="${starTextX}" y="0">${formattedStars}</text>
              <g transform="translate(${forkX}, -10)">${icons.fork(theme.secondaryText)}</g>
              <text x="${forkTextX}" y="0">${formattedForks}</text>
              ${pushedTime ? `<text x="${colWidth - 24}" y="0" text-anchor="end" fill="${theme.secondaryText}">pushed ${pushedTime}</text>` : ''}
            </g>
          </g>
        </g>`;
      }).join('')}
    </g>
</svg>`;
}

/**
 * 2. FEATURED VARIANT (Headline Project)
 * Answers: "What is my headline project?"
 * Shows: Hero card with 2-line description, topics, language bar, sparkline, release tag,
 * plus 2 small secondary tiles (eliminates orphan 3rd tile).
 */
function renderV1FeaturedSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const reposList = (data.repos || []).slice(0, 3);
  const heroRepo = reposList[0];
  const subRepos = reposList.slice(1, 3); // exactly 2 secondary tiles

  const heroHeight = 104;
  const subTileHeight = 64;
  const cardHeight = subRepos.length > 0 ? Math.max(220, 65 + heroHeight + 14 + subTileHeight) : 190;
  const contentWidth = width - 48;

  const heroLangColor = heroRepo?.primaryLanguage?.color || '#858585';
  const heroRawName = heroRepo ? heroRepo.name : 'No Repo';
  const heroName = escapeXml(fitText(heroRawName, 15, contentWidth - 110));
  const heroDescLines = heroRepo ? wrapText(heroRepo.description || 'No description provided', 11, contentWidth - 28, 2) : [];
  const heroRelease = heroRepo?.latestRelease || null;
  const heroStars = heroRepo ? formatCount(heroRepo.stargazerCount) : '0';
  const heroForks = heroRepo ? formatCount(heroRepo.forkCount) : '0';
  const heroSparkline = heroRepo?.sparkline || [0, 0, 0, 0, 0, 0, 0, 0];
  const heroLanguages = heroRepo?.languages || [];

  const subColWidth = subRepos.length === 1 ? contentWidth : Math.floor((contentWidth - 12) / 2);

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
    .hero-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12.5px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-feat-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    badgeText: '🌟 Headline Project',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    ${!heroRepo ? `<text x="0" y="40" class="empty-msg">No repositories found.</text>` : `
      <!-- Featured Hero Card -->
      <g transform="translate(0, 16)">
        <rect x="0" y="0" width="${contentWidth}" height="${heroHeight}" rx="8" fill="${theme.cardBg}" stroke="${theme.border}" />
        <rect x="0" y="0" width="4" height="${heroHeight}" rx="2" fill="${heroLangColor}" />
        
        <g transform="translate(14, 10)">
          <!-- Line 1: Title & Release Tag -->
          <g transform="translate(0, 0)">
            ${icons.repo(theme.title)}
            <text x="20" y="12" class="hero-name">${heroName}</text>
            ${heroRelease ? `<g transform="translate(${Math.min(contentWidth - 90, 20 + Math.ceil(heroName.length * 8.5) + 8)}, -1)">${renderReleaseTag(heroRelease, theme)}</g>` : ''}
          </g>

          <!-- Line 2: 2-line wrapped description -->
          <text x="0" y="29" class="hero-desc">
            ${heroDescLines.map((line, lIdx) => `<tspan x="0" dy="${lIdx === 0 ? 0 : 14}">${escapeXml(line)}</tspan>`).join('')}
          </text>
          
          <!-- Line 3: Topics -->
          ${heroRepo.topics && heroRepo.topics.length ? `
            <g transform="translate(0, ${heroDescLines.length > 1 ? 58 : 46})">
              ${renderTopicChips(heroRepo.topics, 3, contentWidth - 110, theme)}
            </g>
          ` : ''}

          <!-- Line 4: Languages bar + Stats + Sparkline -->
          <g transform="translate(0, 82)" class="repo-meta">
            ${heroLanguages.length ? `<g transform="translate(0, -6)">${renderLanguageBar(heroLanguages, 110, 5, theme)}</g>` : ''}
            
            <g transform="translate(${heroLanguages.length ? 122 : 0}, -10)">${icons.star(theme.iconColor)}</g>
            <text x="${heroLanguages.length ? 138 : 16}" y="0">${heroStars}</text>
            
            <g transform="translate(${heroLanguages.length ? 180 : 58}, -10)">${icons.fork(theme.secondaryText)}</g>
            <text x="${heroLanguages.length ? 196 : 74}" y="0">${heroForks}</text>

            <!-- 8-week Commit Sparkline -->
            <g transform="translate(${contentWidth - 96}, -12)">
              ${renderCommitSparkline(heroSparkline, 68, 16, theme.iconColor || '#58a6ff')}
            </g>
          </g>
        </g>
      </g>

      <!-- Secondary Repos Grid (2 tiles side by side, no orphan 3rd item) -->
      ${subRepos.length > 0 ? `
        <g transform="translate(0, ${16 + heroHeight + 12})">
          ${subRepos.map((repo, idx) => {
            const x = idx * (subColWidth + 12);
            const langColor = repo.primaryLanguage?.color || '#858585';
            const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
            const name = escapeXml(fitText(repo.name || '', 12.5, subColWidth - 44));
            const desc = escapeXml(fitText(repo.description || 'No description', 10.5, subColWidth - 24));
            const updatedTime = formatRelativeTime(repo.pushedAt || repo.updatedAt);
            const formattedStars = formatCount(repo.stargazerCount);
            const formattedForks = formatCount(repo.forkCount);

            return `
            <g transform="translate(${x}, 0)">
              <rect x="0" y="0" width="${subColWidth}" height="${subTileHeight}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
              <rect x="0" y="0" width="3" height="${subTileHeight}" rx="1.5" fill="${langColor}" />
              
              <g transform="translate(10, 8)">
                <g transform="translate(0, 0)">
                  ${icons.repo(theme.title)}
                  <text x="16" y="11" class="repo-name">${name}</text>
                </g>

                <text x="0" y="25" class="repo-desc">${desc}</text>
                
                <g transform="translate(0, 42)" class="repo-meta">
                  ${langName ? `<circle cx="4" cy="-3.5" r="3" fill="${langColor}" /><text x="10" y="0">${escapeXml(fitText(langName, 9.5, 48))}</text>` : ''}
                  <g transform="translate(62, -10)">${icons.star(theme.iconColor)}</g>
                  <text x="76" y="0">${formattedStars}</text>
                  <g transform="translate(112, -10)">${icons.fork(theme.secondaryText)}</g>
                  <text x="126" y="0">${formattedForks}</text>
                  ${updatedTime ? `<text x="${subColWidth - 20}" y="0" text-anchor="end" fill="${theme.secondaryText}">${updatedTime}</text>` : ''}
                </g>
              </g>
            </g>`;
          }).join('')}
        </g>
      ` : ''}
    `}
  </g>
</svg>`;
}

/**
 * 3. SPOTLIGHT VARIANT (Case Study)
 * Answers: "What is the deep-dive case study of my primary repo?"
 * Shows: Description wrapped to 3 lines, stats row with watchers, last commit message and SHA,
 * sparkline, with a side list of 3 repos.
 */
function renderV1SpotlightSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const reposList = (data.repos || []).slice(0, 4);
  const heroRepo = reposList[0];
  const sideRepos = reposList.slice(1, 4);

  const cardHeight = 280;
  const leftColWidth = width >= 600 ? Math.floor((width - 48) * 0.58) : 255;
  const rightColWidth = width - 48 - leftColWidth - 12;

  const heroLangColor = heroRepo?.primaryLanguage?.color || '#858585';
  const heroLangName = heroRepo?.primaryLanguage?.name ? heroRepo.primaryLanguage.name : null;
  const heroRawName = heroRepo ? heroRepo.name : 'No Repo';
  const heroName = escapeXml(fitText(heroRawName, 15, leftColWidth - 36));
  const heroDescLines = heroRepo ? wrapText(heroRepo.description || 'No description provided', 10.5, leftColWidth - 28, 3) : [];
  const heroUpdated = heroRepo ? formatRelativeTime(heroRepo.pushedAt || heroRepo.updatedAt) : '';
  const heroStars = heroRepo ? formatCount(heroRepo.stargazerCount) : '0';
  const heroForks = heroRepo ? formatCount(heroRepo.forkCount) : '0';
  const heroWatchers = heroRepo ? formatCount(heroRepo.watchers) : '0';
  const heroSparkline = heroRepo?.sparkline || [0, 0, 0, 0, 0, 0, 0, 0];
  const heroLastCommit = heroRepo?.lastCommit || null;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    <linearGradient id="repos-spot-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 15px; fill: ${theme.title}; }
    .hero-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .commit-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 9.5px; fill: ${theme.secondaryText}; }
    .side-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .side-desc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 9.5px; fill: ${theme.title}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-spot-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    badgeText: '✨ Spotlight Case Study',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <g transform="translate(0, 20)">
      ${!heroRepo ? `<text x="0" y="20" class="empty-msg">No repositories found.</text>` : `
        <!-- Left Spotlight Hero Column -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="${leftColWidth}" height="210" rx="8" fill="${theme.cardBg}" stroke="${theme.border}" />
          <rect x="0" y="0" width="${leftColWidth}" height="4" rx="2" fill="${heroLangColor}" />
          
          <g transform="translate(14, 14)">
            <!-- Title -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="20" y="12" class="hero-name">${heroName}</text>
            </g>

            <!-- Spotlight Badge -->
            <rect x="0" y="24" width="95" height="18" rx="9" fill="${theme.badgeBg}"/>
            <text x="47" y="36" text-anchor="middle" class="badge-text">⭐ #1 Spotlight</text>

            <!-- Multi-line Description (wrapped to 3 lines) -->
            <text x="0" y="58" class="hero-desc">
              ${heroDescLines.map((l, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 13}">${escapeXml(l)}</tspan>`).join('')}
            </text>
            
            <!-- Latest Commit Info -->
            ${heroLastCommit ? `
              <g transform="translate(0, 108)">
                <rect x="0" y="0" width="56" height="15" rx="4" fill="${theme.badgeBg}" />
                <text x="28" y="11" text-anchor="middle" font-family="monospace" font-size="9" fill="${theme.iconColor || theme.title}">${escapeXml(heroLastCommit.sha || 'commit')}</text>
                <text x="62" y="11" class="commit-text">${escapeXml(fitText(heroLastCommit.message, 9.5, leftColWidth - 100))}</text>
              </g>
            ` : ''}

            <!-- 8-week Activity Sparkline -->
            <g transform="translate(0, 134)">
              ${renderCommitSparkline(heroSparkline, leftColWidth - 28, 20, theme.iconColor || '#58a6ff')}
            </g>

            <!-- Hero Footer Stats (Stars, Forks, Watchers, Pushed Date) -->
            <g transform="translate(0, 180)" class="repo-meta">
              ${heroLangName ? `<circle cx="4" cy="-3.5" r="3.5" fill="${heroLangColor}" /><text x="12" y="0">${escapeXml(fitText(heroLangName, 9.5, 45))}</text>` : ''}
              
              <g transform="translate(60, -10)">${icons.star(theme.iconColor)}</g>
              <text x="74" y="0">${heroStars}</text>
              
              <g transform="translate(112, -10)">${icons.fork(theme.secondaryText)}</g>
              <text x="126" y="0">${heroForks}</text>

              <g transform="translate(162, -10)">${icons.eye(theme.secondaryText)}</g>
              <text x="178" y="0">${heroWatchers}</text>

              ${heroUpdated ? `<text x="${leftColWidth - 28}" y="0" text-anchor="end" fill="${theme.secondaryText}">${heroUpdated}</text>` : ''}
            </g>
          </g>
        </g>

        <!-- Right Side Stacked Cards Column (3 cards) -->
        <g transform="translate(${leftColWidth + 12}, 0)">
          ${sideRepos.map((repo, idx) => {
            const y = idx * 72;
            const langColor = repo.primaryLanguage?.color || '#858585';
            const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
            const displayLang = langName ? escapeXml(fitText(langName, 9.5, 55)) : '';
            const rawName = repo.name || '';
            const name = escapeXml(fitText(rawName, 12, rightColWidth - 36));
            const formattedStars = formatCount(repo.stargazerCount);
            const formattedForks = formatCount(repo.forkCount);

            return `
            <g transform="translate(0, ${y})">
              <rect x="0" y="0" width="${rightColWidth}" height="64" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
              <rect x="0" y="0" width="3" height="64" rx="1.5" fill="${langColor}" />
              
              <g transform="translate(10, 10)">
                <g transform="translate(0, 0)">
                  ${icons.repo(theme.title)}
                  <text x="16" y="11" class="side-name">${name}</text>
                </g>

                <g transform="translate(0, 26)" class="side-desc">
                  ${displayLang ? `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${displayLang}</text>` : ''}
                </g>

                <g transform="translate(0, 42)" class="repo-meta">
                  <g transform="translate(0, -10)">${icons.star(theme.iconColor)}</g>
                  <text x="15" y="0">${formattedStars}</text>
                  <g transform="translate(60, -10)">${icons.fork(theme.secondaryText)}</g>
                  <text x="75" y="0">${formattedForks}</text>
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

/**
 * 4. TIMELINE VARIANT (Recently Shipped)
 * Answers: "What have I shipped recently?"
 * Rule: SORT BY pushedAt DESC (not stars!). Shows last commit message, SHA, and push date.
 */
function renderV1TimelineSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);

  // Genuinely distinct: SORT BY pushedAt DESCENDING
  const rawRepos = [...(data.repos || [])];
  const sortedRepos = rawRepos.sort((a, b) => {
    const timeA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
    const timeB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
    return timeB - timeA;
  }).slice(0, 5);

  const itemGap = 64;
  const cardHeight = Math.max(180, 65 + sortedRepos.length * itemGap);
  const stemHeight = Math.max(20, (sortedRepos.length - 1) * itemGap);
  const contentWidth = width - 48;
  const repoBoxWidth = contentWidth - 36;

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
    .commit-line { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 10px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-time-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `Recently Shipped (${username})`,
    badgeText: '🌿 Git Timeline',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <g transform="translate(0, 24)">
      ${sortedRepos.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : `
        <!-- Vertical Timeline Stem Line -->
        <line x1="16" y1="24" x2="16" y2="${24 + stemHeight}" stroke="${theme.subtleBorder || theme.border}" stroke-width="2" stroke-dasharray="4 2" opacity="0.8"/>

        ${sortedRepos.map((repo, idx) => {
          const y = idx * itemGap;
          const langColor = repo.primaryLanguage?.color || '#858585';
          const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
          const rawName = repo.name || 'Unnamed';
          const name = escapeXml(fitText(rawName, 13, 140));
          const pushedTime = formatRelativeTime(repo.pushedAt || repo.updatedAt);
          const formattedStars = formatCount(repo.stargazerCount);
          const formattedForks = formatCount(repo.forkCount);
          const commit = repo.lastCommit || null;
          const commitSha = commit?.sha ? escapeXml(commit.sha) : '';
          const commitMsg = commit?.message ? escapeXml(fitText(commit.message, 10, repoBoxWidth - 110)) : (repo.description ? escapeXml(fitText(repo.description, 10, repoBoxWidth - 30)) : 'No commit message');

          return `
          <g transform="translate(0, ${y})">
            <!-- Timeline Branch Node Circle -->
            <circle cx="16" cy="24" r="6" fill="${langColor}" stroke="${theme.bg}" stroke-width="2"/>
            <line x1="22" y1="24" x2="36" y2="24" stroke="${langColor}" stroke-width="1.5" opacity="0.7"/>

            <!-- Repository Card -->
            <g transform="translate(36, 0)">
              <rect x="0" y="0" width="${repoBoxWidth}" height="52" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
              <rect x="0" y="0" width="4" height="52" rx="2" fill="${langColor}" />
              
              <g transform="translate(12, 10)">
                <!-- Line 1: Title, Language, Stars, Forks, and Pushed Time -->
                <g transform="translate(0, 0)">
                  ${icons.repo(theme.title)}
                  <text x="18" y="11" class="repo-name">${name}</text>

                  <g class="repo-meta">
                    ${langName ? `<circle cx="155" cy="7.5" r="3.5" fill="${langColor}" /><text x="163" y="11">${escapeXml(fitText(langName, 9.5, 55))}</text>` : ''}
                    <g transform="translate(225, 1)">${icons.star(theme.iconColor)}</g>
                    <text x="241" y="11">${formattedStars}</text>
                    <g transform="translate(278, 1)">${icons.fork(theme.secondaryText)}</g>
                    <text x="294" y="11">${formattedForks}</text>
                    ${pushedTime ? `<text x="${repoBoxWidth - 24}" y="11" text-anchor="end" fill="${theme.secondaryText}">pushed ${pushedTime}</text>` : ''}
                  </g>
                </g>

                <!-- Line 2: Last Commit Message & SHA -->
                <g transform="translate(0, 28)">
                  ${commitSha ? `
                    <rect x="0" y="-8" width="52" height="14" rx="3" fill="${theme.badgeBg}" />
                    <text x="26" y="2" text-anchor="middle" font-family="monospace" font-size="8.5" fill="${theme.iconColor || theme.title}">${commitSha}</text>
                    <text x="58" y="2" class="commit-line">${commitMsg}</text>
                  ` : `
                    <text x="0" y="2" class="commit-line">${commitMsg}</text>
                  `}
                </g>
              </g>
            </g>
          </g>`;
        }).join('')}
      `}
    </g>
  </g>
</svg>`;
}

/**
 * 5. LEADERBOARD VARIANT (Most Popular)
 * Answers: "Which projects have the highest community adoption?"
 * Shows: Rank, stars bar (proportional to max), forks, watchers, with names fitted to available width.
 */
function renderV1LeaderboardSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const reposList = [...(data.repos || [])]
    .sort((a, b) => (b.stargazerCount || 0) - (a.stargazerCount || 0))
    .slice(0, 5);

  const maxStars = Math.max(...reposList.map(r => r.stargazerCount || 0), 1);
  const rowHeight = 44;
  const rowGap = 52;
  const cardHeight = Math.max(160, 65 + reposList.length * rowGap);
  const contentWidth = width - 48;

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
    .rank-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 10px; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${cardHeight - 1}" fill="url(#repos-rank-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    badgeText: '🏆 Rank Standings',
    width,
    theme,
  })}

  <g transform="translate(24, 22)">
    <!-- Leaderboard Rows -->
    <g transform="translate(0, 20)">
      ${reposList.length === 0 ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      ` : reposList.map((repo, idx) => {
        const y = idx * rowGap;
        const langColor = repo.primaryLanguage?.color || '#858585';
        const rawName = repo.name || 'Unnamed';

        const formattedStars = formatCount(repo.stargazerCount);
        const formattedForks = formatCount(repo.forkCount);
        const formattedWatchers = formatCount(repo.watchers);
        const rankBadge = RANK_BADGES[idx] || { label: `#${idx + 1}`, bg: theme.barBg, text: theme.secondaryText };

        const rightMargin = contentWidth - 16;
        const watchersX = rightMargin - 36;
        const forksX = watchersX - 48;
        const starsX = forksX - 48;
        const barWidthMax = Math.max(36, Math.min(80, Math.floor(contentWidth * 0.14)));
        const barX = starsX - barWidthMax - 14;
        const nameMaxWidth = Math.max(120, barX - 72);
        const name = escapeXml(fitText(rawName, 12.5, nameMaxWidth));
        const barWidth = Math.max(6, Math.round(((repo.stargazerCount || 0) / maxStars) * barWidthMax));

        return `
        <g transform="translate(0, ${y})">
          <rect x="0" y="0" width="${contentWidth}" height="${rowHeight}" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <rect x="0" y="0" width="4" height="${rowHeight}" rx="2" fill="${langColor}" />
          
          <g transform="translate(10, 10)">
            <!-- Rank Badge -->
            <rect x="0" y="2" width="42" height="20" rx="5" fill="${rankBadge.bg}" />
            <text x="21" y="15" text-anchor="middle" class="rank-text" fill="${rankBadge.text}">${rankBadge.label}</text>

            <!-- Title -->
            <g transform="translate(50, 2)">
              ${icons.repo(theme.title)}
              <text x="18" y="12" class="repo-name" font-size="12.5">${name}</text>
            </g>

            <!-- Popularity Progress Bar -->
            <g transform="translate(${barX}, 8)" class="stars-bar">
              <rect x="0" y="6" width="${barWidthMax}" height="4" rx="2" fill="${theme.barBg}" />
              <rect x="0" y="6" width="${barWidth}" height="4" rx="2" fill="${langColor}" />
            </g>

            <!-- Stars Count -->
            <g transform="translate(${starsX}, 14)" class="repo-meta">
              <g transform="translate(0, -10)">${icons.star(theme.iconColor)}</g>
              <text x="15" y="0" font-weight="bold">${formattedStars}</text>
            </g>

            <!-- Forks Count -->
            <g transform="translate(${forksX}, 14)" class="repo-meta">
              <g transform="translate(0, -10)">${icons.fork(theme.secondaryText)}</g>
              <text x="15" y="0">${formattedForks}</text>
            </g>

            <!-- Watchers Count -->
            <g transform="translate(${watchersX}, 14)" class="repo-meta">
              <g transform="translate(0, -10)">${icons.eye(theme.secondaryText)}</g>
              <text x="15" y="0">${formattedWatchers}</text>
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

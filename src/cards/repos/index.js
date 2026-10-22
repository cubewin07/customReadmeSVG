import { graphql } from '../../core/github/client.js';
import { REPOS_QUERY } from '../../core/github/queries.js';
import { normalizeRepos } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { renderCardHeader } from '../../svg/header.js';
import { fitText, wrapText, measureText } from '../../svg/text.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import {
  renderCardDefs,
  renderCardStyles,
  renderCardFrame,
  renderBentoTile,
  renderRankBadge,
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
 * 1. GRID VARIANT (Glassmorphic Bento Grid with Collision-Free Footer)
 */
function renderV1GridSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const idPrefix = 'repos-grid';
  const reposList = (data.repos || []).slice(0, 6);

  const isSingleCol = width < 450;
  const cols = isSingleCol ? 1 : width >= 800 ? 3 : 2;
  const rowsCount = Math.ceil(reposList.length / cols) || 1;
  const colGap = 12;
  const colWidth = Math.floor((width - 48 - (cols - 1) * colGap) / cols);
  const itemHeight = 86;
  const rowGap = itemHeight + 10;
  const cardHeight = Math.max(160, 65 + rowsCount * rowGap);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: ${theme.text}; font-variant-numeric: tabular-nums; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, cardHeight, idPrefix, theme, 14)}
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    width,
    theme,
  })}
  
  <!-- Repos Grid -->
  <g transform="translate(24, 46)">
    ${
      reposList.length === 0
        ? `
      <text x="0" y="20" class="empty-msg">No repositories found.</text>
    `
        : reposList
            .map((repo, idx) => {
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
              const rawPushedTime = formatRelativeTime(repo.pushedAt || repo.updatedAt);
              const pushedTime = colWidth < 210 ? rawPushedTime : `pushed ${rawPushedTime}`;
              const formattedStars = formatCount(repo.stargazerCount);
              const formattedForks = formatCount(repo.forkCount);

              let currentX = 0;
              let langSvg = '';
              if (langName) {
                const fittedLang = escapeXml(fitText(langName, 10, 60));
                langSvg = `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${fittedLang}</text>`;
                currentX = 12 + Math.ceil(fittedLang.length * 6) + 8;
              }

              const starX = currentX;
              const starTextX = starX + 15;
              const starWidth = 15 + Math.ceil(formattedStars.length * 6.2);

              const forkX = starX + starWidth + 8;
              const forkTextX = forkX + 15;

              const topicSvg =
                repo.topics && repo.topics.length
                  ? `<g transform="translate(0, 31)">${renderTopicChips(repo.topics, 3, colWidth - 24, theme)}</g>`
                  : repo.languages && repo.languages.length
                  ? `<g transform="translate(0, 34)">${renderLanguageBar(repo.languages, colWidth - 28, 4.5, theme)}</g>`
                  : '';

              return renderBentoTile({
                x,
                y,
                width: colWidth,
                height: itemHeight,
                theme,
                idPrefix,
                rx: 7,
                accentColor: langColor,
                accentPosition: 'left',
                children: `
                  <g transform="translate(12, 10)">
                    <!-- Title -->
                    <g transform="translate(0, 0)">
                      ${icons.repo(theme.title)}
                      <text x="18" y="11" class="repo-name">${name}</text>
                    </g>

                    <!-- Description -->
                    <text x="0" y="26" class="repo-desc">${desc}</text>

                    <!-- Topics / Proportions -->
                    ${topicSvg}
                    
                    <!-- Meta Footer -->
                    <g transform="translate(0, 64)" class="repo-meta">
                      ${langSvg}
                      <g transform="translate(${starX}, -10)">${icons.star(theme.iconColor)}</g>
                      <text x="${starTextX}" y="0">${formattedStars}</text>
                      <g transform="translate(${forkX}, -10)">${icons.fork(theme.secondaryText)}</g>
                      <text x="${forkTextX}" y="0">${formattedForks}</text>
                      ${pushedTime ? `<text x="${colWidth - 24}" y="0" text-anchor="end" fill="${theme.secondaryText}">${pushedTime}</text>` : ''}
                    </g>
                  </g>
                `,
              });
            })
            .join('')
    }
  </g>
</svg>`;
}

/**
 * 2. FEATURED VARIANT (Headline Hero & Secondary Bento Tiles)
 */
function renderV1FeaturedSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const idPrefix = 'repos-feat';
  const reposList = (data.repos || []).slice(0, 3);
  const heroRepo = reposList[0];
  const subRepos = reposList.slice(1, 3);

  const heroHeight = 110;
  const subTileHeight = 68;
  const cardHeight = subRepos.length > 0 ? Math.max(220, 65 + heroHeight + 14 + subTileHeight) : 190;
  const contentWidth = width - 48;

  const heroLangColor = heroRepo?.primaryLanguage?.color || '#858585';
  const heroRawName = heroRepo ? heroRepo.name : 'No Repo';
  const heroNameFit = fitText(heroRawName, 15, contentWidth - 110);
  const heroName = escapeXml(heroNameFit);
  const heroNameW = Math.round(measureText(heroNameFit, 15));
  const heroDescLines = heroRepo ? wrapText(heroRepo.description || 'No description provided', 11, contentWidth - 28, 2) : [];
  const heroRelease = heroRepo?.latestRelease || null;
  const heroStars = heroRepo ? formatCount(heroRepo.stargazerCount) : '0';
  const heroForks = heroRepo ? formatCount(heroRepo.forkCount) : '0';
  const heroSparkline = heroRepo?.sparkline || [0, 0, 0, 0, 0, 0, 0, 0];
  const heroLanguages = heroRepo?.languages || [];

  const subColWidth = subRepos.length === 1 ? contentWidth : Math.floor((contentWidth - 12) / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 15px; fill: ${theme.title}; }
    .hero-desc { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 12.5px; fill: ${theme.title}; }
    .repo-desc { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: ${theme.text}; font-variant-numeric: tabular-nums; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, cardHeight, idPrefix, theme, 14)}
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    badgeText: '🌟 Headline Project',
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    ${
      !heroRepo
        ? `<text x="0" y="40" class="empty-msg">No repositories found.</text>`
        : `
      <!-- Featured Hero Bento Card -->
      ${renderBentoTile({
        x: 0,
        y: 0,
        width: contentWidth,
        height: heroHeight,
        theme,
        idPrefix,
        rx: 9,
        accentColor: heroLangColor,
        accentPosition: 'left',
        children: `
          <g transform="translate(14, 10)">
            <!-- Line 1: Title & Release Tag -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="20" y="12" class="hero-name">${heroName}</text>
              ${heroRelease ? `<g transform="translate(${Math.min(contentWidth - 90, 20 + heroNameW + 8)}, -1)">${renderReleaseTag(heroRelease, theme)}</g>` : ''}
            </g>

            <!-- Line 2: 2-line wrapped description -->
            <text x="0" y="30" class="hero-desc">
              ${heroDescLines.map((line, lIdx) => `<tspan x="0" dy="${lIdx === 0 ? 0 : 14}">${escapeXml(line)}</tspan>`).join('')}
            </text>
            
            <!-- Line 3: Topics -->
            ${
              heroRepo.topics && heroRepo.topics.length
                ? `
              <g transform="translate(0, ${heroDescLines.length > 1 ? 60 : 48})">
                ${renderTopicChips(heroRepo.topics, 3, contentWidth - 110, theme)}
              </g>
            `
                : ''
            }

            <!-- Line 4: Languages bar + Stats + Sparkline -->
            <g transform="translate(0, 86)" class="repo-meta">
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
        `,
      })}

      <!-- Secondary Repos Grid (2 Bento tiles side by side) -->
      ${
        subRepos.length > 0
          ? `
        <g transform="translate(0, ${heroHeight + 12})">
          ${subRepos
            .map((repo, idx) => {
              const x = idx * (subColWidth + 12);
              const langColor = repo.primaryLanguage?.color || '#858585';
              const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
              const name = escapeXml(fitText(repo.name || '', 12.5, subColWidth - 44));
              const desc = escapeXml(fitText(repo.description || 'No description', 10.5, subColWidth - 24));
              const updatedTime = formatRelativeTime(repo.pushedAt || repo.updatedAt);
              const formattedStars = formatCount(repo.stargazerCount);
              const formattedForks = formatCount(repo.forkCount);

              let currentX = 0;
              let langSvg = '';
              if (langName) {
                const fittedLang = escapeXml(fitText(langName, 9.5, 48));
                langSvg = `<circle cx="4" cy="-3.5" r="3" fill="${langColor}" /><text x="10" y="0">${fittedLang}</text>`;
                currentX = 10 + Math.ceil(measureText(fittedLang, 9.5)) + 8;
              }

              const starX = currentX;
              const starTextX = starX + 14;
              const starW = 14 + Math.ceil(formattedStars.length * 6);
              const forkX = starX + starW + 8;
              const forkTextX = forkX + 14;

              return renderBentoTile({
                x,
                y: 0,
                width: subColWidth,
                height: subTileHeight,
                theme,
                idPrefix,
                rx: 7,
                accentColor: langColor,
                accentPosition: 'left',
                children: `
                  <g transform="translate(10, 8)">
                    <g transform="translate(0, 0)">
                      ${icons.repo(theme.title)}
                      <text x="16" y="11" class="repo-name">${name}</text>
                    </g>

                    <text x="0" y="27" class="repo-desc">${desc}</text>
                    
                    <g transform="translate(0, 46)" class="repo-meta">
                      ${langSvg}
                      <g transform="translate(${starX}, -10)">${icons.star(theme.iconColor)}</g>
                      <text x="${starTextX}" y="0">${formattedStars}</text>
                      <g transform="translate(${forkX}, -10)">${icons.fork(theme.secondaryText)}</g>
                      <text x="${forkTextX}" y="0">${formattedForks}</text>
                      ${updatedTime ? `<text x="${subColWidth - 20}" y="0" text-anchor="end" fill="${theme.secondaryText}">${updatedTime}</text>` : ''}
                    </g>
                  </g>
                `,
              });
            })
            .join('')}
        </g>
      `
          : ''
      }
    `
    }
  </g>
</svg>`;
}

/**
 * 3. SPOTLIGHT VARIANT (Case Study & Balanced Responsive Columns)
 */
function renderV1SpotlightSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const idPrefix = 'repos-spot';
  const reposList = (data.repos || []).slice(0, 4);
  const heroRepo = reposList[0];
  const sideRepos = reposList.slice(1, 4);

  const cardHeight = 280;
  const contentWidth = width - 48;
  const leftColWidth = width >= 600 ? Math.floor(contentWidth * 0.58) : Math.floor(contentWidth * 0.55);
  const rightColWidth = contentWidth - leftColWidth - 12;

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
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 15px; fill: ${theme.title}; }
    .hero-desc { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .commit-text { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; fill: ${theme.secondaryText}; }
    .side-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .side-desc { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: ${theme.text}; font-variant-numeric: tabular-nums; }
    .badge-text { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 9px; fill: ${theme.title}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, cardHeight, idPrefix, theme, 14)}
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    badgeText: '✨ Spotlight Case Study',
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    ${
      !heroRepo
        ? `<text x="0" y="20" class="empty-msg">No repositories found.</text>`
        : `
      <!-- Left Spotlight Hero Column -->
      ${renderBentoTile({
        x: 0,
        y: 0,
        width: leftColWidth,
        height: 216,
        theme,
        idPrefix,
        rx: 9,
        accentColor: heroLangColor,
        accentPosition: 'top',
        children: `
          <g transform="translate(14, 14)">
            <!-- Title -->
            <g transform="translate(0, 0)">
              ${icons.repo(theme.title)}
              <text x="20" y="12" class="hero-name">${heroName}</text>
            </g>

            <!-- Spotlight Badge -->
            <rect x="0" y="24" width="95" height="18" rx="9" fill="${theme.badgeBg}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>
            <text x="47" y="36" text-anchor="middle" class="badge-text">⭐ #1 Spotlight</text>

            <!-- Multi-line Description (wrapped to 3 lines) -->
            <text x="0" y="58" class="hero-desc">
              ${heroDescLines.map((l, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 13}">${escapeXml(l)}</tspan>`).join('')}
            </text>
            
            <!-- Inset Telemetry Box (Commit + Sparkline) -->
            ${
              heroLastCommit
                ? `
              <g transform="translate(0, 108)">
                <rect x="0" y="0" width="56" height="16" rx="4" fill="${theme.badgeBg}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>
                <text x="28" y="11.5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="${theme.iconColor || theme.title}">${escapeXml(heroLastCommit.sha || 'commit')}</text>
                <text x="64" y="11.5" class="commit-text">${escapeXml(fitText(heroLastCommit.message, 9.5, leftColWidth - 100))}</text>
              </g>
            `
                : ''
            }

            <!-- 8-week Activity Sparkline -->
            <g transform="translate(0, 136)">
              ${renderCommitSparkline(heroSparkline, leftColWidth - 28, 20, theme.iconColor || '#58a6ff')}
            </g>

            <!-- Hero Footer Stats (Stars, Forks, Watchers, Pushed Date) -->
            <g transform="translate(0, 186)" class="repo-meta">
              ${heroLangName ? `<circle cx="4" cy="-3.5" r="3.5" fill="${heroLangColor}" /><text x="12" y="0">${escapeXml(fitText(heroLangName, 9.5, 45))}</text>` : ''}
              
              <g transform="translate(56, -10)">${icons.star(theme.iconColor)}</g>
              <text x="70" y="0">${heroStars}</text>
              
              <g transform="translate(104, -10)">${icons.fork(theme.secondaryText)}</g>
              <text x="118" y="0">${heroForks}</text>

              <g transform="translate(150, -10)">${icons.eye(theme.secondaryText)}</g>
              <text x="166" y="0">${heroWatchers}</text>

              ${heroUpdated ? `<text x="${leftColWidth - 28}" y="0" text-anchor="end" fill="${theme.secondaryText}">${heroUpdated}</text>` : ''}
            </g>
          </g>
        `,
      })}

      <!-- Right Side Stacked Cards Column (3 Bento cards) -->
      <g transform="translate(${leftColWidth + 12}, 0)">
        ${sideRepos
          .map((repo, idx) => {
            const y = idx * 74;
            const langColor = repo.primaryLanguage?.color || '#858585';
            const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
            const displayLang = langName ? escapeXml(fitText(langName, 9.5, 55)) : '';
            const rawName = repo.name || '';
            const name = escapeXml(fitText(rawName, 12, rightColWidth - 36));
            const desc = escapeXml(fitText(repo.description || (repo.lastCommit?.message || 'Repository'), 9.5, rightColWidth - 22));
            const formattedStars = formatCount(repo.stargazerCount);
            const formattedForks = formatCount(repo.forkCount);

            return renderBentoTile({
              x: 0,
              y,
              width: rightColWidth,
              height: 68,
              theme,
              idPrefix,
              rx: 7,
              accentColor: langColor,
              accentPosition: 'left',
              children: `
                <g transform="translate(10, 10)">
                  <g transform="translate(0, 0)">
                    ${icons.repo(theme.title)}
                    <text x="16" y="11" class="side-name">${name}</text>
                  </g>

                  <text x="0" y="27" class="side-desc">${desc}</text>

                  <g transform="translate(0, 44)" class="repo-meta">
                    ${displayLang ? `<circle cx="4" cy="-3.5" r="3.5" fill="${langColor}" /><text x="12" y="0">${displayLang}</text>` : ''}
                    <g transform="translate(68, -10)">${icons.star(theme.iconColor)}</g>
                    <text x="82" y="0">${formattedStars}</text>
                    <g transform="translate(116, -10)">${icons.fork(theme.secondaryText)}</g>
                    <text x="130" y="0">${formattedForks}</text>
                  </g>
                </g>
              `,
            });
          })
          .join('')}
      </g>
    `
    }
  </g>
</svg>`;
}

/**
 * 4. TIMELINE VARIANT (Recently Shipped Timeline with Anchored Metadata)
 */
function renderV1TimelineSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const idPrefix = 'repos-time';

  const rawRepos = [...(data.repos || [])];
  const sortedRepos = rawRepos
    .sort((a, b) => {
      const timeA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
      const timeB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  const itemGap = 64;
  const cardHeight = Math.max(180, 65 + sortedRepos.length * itemGap);
  const stemHeight = Math.max(20, (sortedRepos.length - 1) * itemGap);
  const contentWidth = width - 48;
  const repoBoxWidth = contentWidth - 36;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .commit-line { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: ${theme.secondaryText}; }
    .repo-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: ${theme.text}; font-variant-numeric: tabular-nums; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, cardHeight, idPrefix, theme, 14)}
  
  ${renderCardHeader({
    title: `Recently Shipped (${username})`,
    badgeText: '🌿 Git Timeline',
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    ${
      sortedRepos.length === 0
        ? `
      <text x="0" y="20" class="empty-msg">No repositories found.</text>
    `
        : `
      <!-- Vertical Timeline Stem Line -->
      <line x1="16" y1="24" x2="16" y2="${24 + stemHeight}" stroke="${theme.subtleBorder || theme.border}" stroke-width="2" stroke-dasharray="4 2" opacity="0.8"/>

      ${sortedRepos
        .map((repo, idx) => {
          const y = idx * itemGap;
          const langColor = repo.primaryLanguage?.color || '#858585';
          const langName = repo.primaryLanguage?.name ? repo.primaryLanguage.name : null;
          const rawName = repo.name || 'Unnamed';
          const pushedTime = formatRelativeTime(repo.pushedAt || repo.updatedAt);
          const formattedStars = formatCount(repo.stargazerCount);
          const formattedForks = formatCount(repo.forkCount);
          const commit = repo.lastCommit || null;
          const commitSha = commit?.sha ? escapeXml(commit.sha) : '';
          const commitMsg = commit?.message
            ? escapeXml(fitText(commit.message, 10, repoBoxWidth - 110))
            : repo.description
            ? escapeXml(fitText(repo.description, 10, repoBoxWidth - 30))
            : 'No commit message';

          // Dynamically anchor metadata relative to repoBoxWidth
          const pushedX = repoBoxWidth - 14;
          const forkX = repoBoxWidth - (width <= 440 ? 68 : 118);
          const starX = repoBoxWidth - (width <= 440 ? 116 : 166);
          const langX = repoBoxWidth - 238;
          const showLang = width > 440 && langName;
          const nameMaxWidth = Math.max(90, (showLang ? langX : starX) - 24);
          const name = escapeXml(fitText(rawName, 13, nameMaxWidth));

          return `
          <g transform="translate(0, ${y})">
            <!-- Timeline Branch Node Circle -->
            <circle cx="16" cy="26" r="6" fill="${langColor}" stroke="${theme.bg}" stroke-width="2"/>
            <line x1="22" y1="26" x2="36" y2="26" stroke="${langColor}" stroke-width="1.5" opacity="0.7"/>

            <!-- Repository Bento Card -->
            ${renderBentoTile({
              x: 36,
              y: 0,
              width: repoBoxWidth,
              height: 52,
              theme,
              idPrefix,
              rx: 7,
              accentColor: langColor,
              accentPosition: 'left',
              children: `
                <g transform="translate(12, 10)">
                  <!-- Line 1: Title, Language, Stars, Forks, and Pushed Time -->
                  <g transform="translate(0, 0)">
                    ${icons.repo(theme.title)}
                    <text x="18" y="11" class="repo-name">${name}</text>

                    <g class="repo-meta">
                      ${showLang ? `<circle cx="${langX}" cy="7.5" r="3.5" fill="${langColor}" /><text x="${langX + 8}" y="11">${escapeXml(fitText(langName, 9.5, 55))}</text>` : ''}
                      <g transform="translate(${starX}, 1)">${icons.star(theme.iconColor)}</g>
                      <text x="${starX + 16}" y="11">${formattedStars}</text>
                      <g transform="translate(${forkX}, 1)">${icons.fork(theme.secondaryText)}</g>
                      <text x="${forkX + 16}" y="11">${formattedForks}</text>
                      ${pushedTime ? `<text x="${pushedX}" y="11" text-anchor="end" fill="${theme.secondaryText}">pushed ${pushedTime}</text>` : ''}
                    </g>
                  </g>

                  <!-- Line 2: Last Commit Message & SHA -->
                  <g transform="translate(0, 28)">
                    ${
                      commitSha
                        ? `
                      <rect x="0" y="-8" width="52" height="14" rx="3" fill="${theme.badgeBg}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>
                      <text x="26" y="2" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700" fill="${theme.iconColor || theme.title}">${commitSha}</text>
                      <text x="58" y="2" class="commit-line">${commitMsg}</text>
                    `
                        : `
                      <text x="0" y="2" class="commit-line">${commitMsg}</text>
                    `
                    }
                  </g>
                </g>
              `,
            })}
          </g>`;
        })
        .join('')}
    `
    }
  </g>
</svg>`;
}

/**
 * 5. LEADERBOARD VARIANT (2-Tier Proportional Adoption Rows)
 */
function renderV1LeaderboardSvg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const width = resolveCardWidth(options.width);
  const idPrefix = 'repos-rank';
  const reposList = [...(data.repos || [])]
    .sort((a, b) => (b.stargazerCount || 0) - (a.stargazerCount || 0))
    .slice(0, 5);

  const maxStars = Math.max(...reposList.map((r) => r.stargazerCount || 0), 1);
  const rowHeight = 50;
  const rowGap = 58;
  const cardHeight = Math.max(160, 65 + reposList.length * rowGap);
  const contentWidth = width - 48;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none">
  <defs>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .repo-name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .repo-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: ${theme.text}; font-variant-numeric: tabular-nums; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>

  ${renderCardFrame(width, cardHeight, idPrefix, theme, 14)}
  
  ${renderCardHeader({
    title: `Top Repositories (${username})`,
    badgeText: '🏆 Rank Standings',
    width,
    theme,
  })}

  <g transform="translate(24, 46)">
    ${
      reposList.length === 0
        ? `
      <text x="0" y="20" class="empty-msg">No repositories found.</text>
    `
        : reposList
            .map((repo, idx) => {
              const y = idx * rowGap;
              const langColor = repo.primaryLanguage?.color || '#858585';
              const rawName = repo.name || 'Unnamed';

              const formattedStars = formatCount(repo.stargazerCount);
              const formattedForks = formatCount(repo.forkCount);
              const formattedWatchers = formatCount(repo.watchers);

              const rightMargin = contentWidth - 14;
              const watchersX = rightMargin - 36;
              const forksX = watchersX - 48;
              const starsX = forksX - 48;
              const nameMaxWidth = Math.max(120, starsX - 56);
              const name = escapeXml(fitText(rawName, 12.5, nameMaxWidth));

              const barWidthMax = contentWidth - 64;
              const barWidth = Math.max(6, Math.round(((repo.stargazerCount || 0) / maxStars) * barWidthMax));

              return renderBentoTile({
                x: 0,
                y,
                width: contentWidth,
                height: rowHeight,
                theme,
                idPrefix,
                rx: 7,
                accentColor: langColor,
                accentPosition: 'left',
                children: `
                  <g transform="translate(10, 8)">
                    <!-- Rank Badge -->
                    <g transform="translate(0, 0)">
                      ${renderRankBadge({ x: 0, y: 0, rank: idx + 1, width: 34, height: 20, theme })}
                    </g>

                    <!-- Title -->
                    <g transform="translate(42, 3)">
                      ${icons.repo(theme.title)}
                      <text x="18" y="11" class="repo-name" font-size="12.5">${name}</text>
                    </g>

                    <!-- Stars Count -->
                    <g transform="translate(${starsX - 10}, 14)" class="repo-meta">
                      <g transform="translate(0, -10)">${icons.star(theme.iconColor)}</g>
                      <text x="15" y="0" font-weight="bold">${formattedStars}</text>
                    </g>

                    <!-- Forks Count -->
                    <g transform="translate(${forksX - 10}, 14)" class="repo-meta">
                      <g transform="translate(0, -10)">${icons.fork(theme.secondaryText)}</g>
                      <text x="15" y="0">${formattedForks}</text>
                    </g>

                    <!-- Watchers Count -->
                    <g transform="translate(${watchersX - 10}, 14)" class="repo-meta">
                      <g transform="translate(0, -10)">${icons.eye(theme.secondaryText)}</g>
                      <text x="15" y="0">${formattedWatchers}</text>
                    </g>

                    <!-- 2nd Tier: Proportional Stars Bar -->
                    <g transform="translate(42, 28)" class="stars-bar">
                      <rect x="0" y="0" width="${barWidthMax}" height="4" rx="2" fill="${theme.barBg || '#21262d'}" opacity="0.4" />
                      <rect x="0" y="0" width="${barWidth}" height="4" rx="2" fill="${langColor}" />
                    </g>
                  </g>
                `,
              });
            })
            .join('')
    }
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
      ${
        reposList.length === 0
          ? `
        <text x="0" y="20" class="empty-msg">No repositories found.</text>
      `
          : reposList
              .map((repo, idx) => {
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
              })
              .join('')
      }
    </g>
  </g>
</svg>`;
}

export default reposCard;

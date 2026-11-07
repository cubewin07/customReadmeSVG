import { graphql } from '../../core/github/client.js';
import { REPOS_QUERY } from '../../core/github/queries.js';
import { normalizeRepos } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { renderCardHeader } from '../../svg/header.js';
import { wrapText } from '../../svg/text.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import {
  card,
  cellMeter,
  cellsThatFit,
  fitUi,
  hairline,
  metaRow,
  monoWidth,
  padX,
  shareStrip,
  text,
  uiWidth,
} from '../../svg/kit.js';

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

function repoFacts(repo, theme, { language = true, watchers = false, time = true } = {}) {
  const lang = repo.primaryLanguage;
  const watching = repo.watchers ?? repo.watchersCount;
  return [
    language && lang ? { text: fitUi(lang.name, 11, 88), swatch: lang.color || theme.secondaryText } : null,
    { text: formatCount(repo.stargazerCount), icon: icons.star(theme.secondaryText), mono: true },
    { text: formatCount(repo.forkCount), icon: icons.fork(theme.secondaryText), mono: true },
    watchers && watching ? { text: formatCount(watching), icon: icons.eye(theme.secondaryText), mono: true } : null,
    time && (repo.pushedAt || repo.updatedAt) ? { text: formatRelativeTime(repo.pushedAt || repo.updatedAt) } : null,
  ].filter(Boolean);
}

function repoName(x, y, name, maxWidth, size = 13) {
  return text(x, y, fitUi(name, size, maxWidth, 600), 'lnk', `font-size="${size}" font-weight="600"`);
}

function descriptionLines(x, y, description, maxWidth, maxLines, size = 11.5, lineHeight = 15.5) {
  if (!description) return '';
  return wrapText(description, size, maxWidth - 6, maxLines)
    .map((line, i) => text(x, y + i * lineHeight, line, 'mut', `font-size="${size}"`))
    .join('');
}

/** Eight weeks of commits as thin bars, so the shape reads without a chart frame. */
function weeklyBars({ x, y, width, height, bins = [], theme }) {
  const values = bins.length ? bins.slice(-8) : new Array(8).fill(0);
  const max = Math.max(1, ...values);
  const gap = 2;
  const barW = (width - gap * (values.length - 1)) / values.length;
  const bars = values.map((v, i) => {
    const h = v > 0 ? Math.max(2, (v / max) * height) : 1.5;
    return `<rect x="${(x + i * (barW + gap)).toFixed(1)}" y="${(y + height - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${v > 0 ? theme.accent : theme.barBg}" fill-opacity="${i === values.length - 1 && v > 0 ? 1 : v > 0 ? 0.55 : 1}" />`;
  }).join('');
  return `<g class="sparkline">${bars}</g>`;
}

function repoLanguageShares(repo) {
  if (Array.isArray(repo.languages) && repo.languages.length) return repo.languages;
  return repo.primaryLanguage ? [{ ...repo.primaryLanguage, percentage: 100 }] : [];
}

function reposCardShell({ width, height, options, theme, title, badgeText, body }) {
  const owner = options.username || '';
  return card({
    width,
    height,
    title: `Repositories${owner ? ` by ${owner}` : ''}`,
    theme,
    body: `${renderCardHeader({ title, owner, badgeText, width, theme })}${body}`,
  });
}

const NO_REPOS = 'No public repositories to show yet.';

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
 * 1. GRID: an unboxed table of repositories, ruled between rows and columns.
 */
function renderV1GridSvg(data, theme, options = {}) {
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const inner = width - pad * 2;
  const repos = (data.repos || []).slice(0, 6);
  const cols = width < 450 ? 1 : width >= 800 ? 3 : 2;
  const gutter = 28;
  const colW = (inner - gutter * (cols - 1)) / cols;
  const rowH = 88;
  const rows = Math.max(1, Math.ceil(repos.length / cols));
  const startY = 44;
  const height = repos.length ? startY + rows * rowH + 4 : 96;

  const items = repos.map((repo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = Math.round(pad + col * (colW + gutter));
    const y = startY + row * rowH;
    const divider = col > 0
      ? hairline(x - gutter / 2, y + 8, x - gutter / 2, y + rowH - 8, theme)
      : '';
    return `
      ${row > 0 && col === 0 ? hairline(pad, y, width - pad, y, theme) : ''}
      ${divider}
      ${repoName(x, y + 22, repo.name, colW)}
      ${descriptionLines(x, y + 40, repo.description, colW, 2)}
      ${metaRow({ x, y: y + 76, maxWidth: colW, gap: 10, items: repoFacts(repo, theme) })}`;
  }).join('');

  return reposCardShell({
    width,
    height,
    options,
    theme,
    title: 'repositories',
    badgeText: repos.length ? `${repos.length} shown` : null,
    body: repos.length ? items : text(pad, 70, NO_REPOS, 'mut', 'font-size="12"'),
  });
}

/**
 * 2. FEATURED: the headline project at full width, runners-up beneath it.
 */
function renderV1FeaturedSvg(data, theme, options = {}) {
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const inner = width - pad * 2;
  const repos = (data.repos || []).slice(0, 3);
  const lead = repos[0];
  const others = repos.slice(1);

  if (!lead) {
    return reposCardShell({ width, height: 96, options, theme, title: 'repositories', body: text(pad, 70, NO_REPOS, 'mut', 'font-size="12"') });
  }

  const tag = lead.latestRelease ? String(lead.latestRelease) : '';
  const tagW = tag ? monoWidth(tag, 11) + 10 : 0;
  const barsW = 60;
  const leadH = 122;
  const topicsY = 118;
  const shares = repoLanguageShares(lead);
  const secondaryY = 44 + leadH;
  const colW = others.length > 1 ? (inner - 28) / 2 : inner;
  const height = others.length ? secondaryY + 74 : secondaryY + 2;

  const secondary = others.map((repo, i) => {
    const x = Math.round(pad + i * (colW + 28));
    return `
      ${i > 0 ? hairline(x - 14, secondaryY + 10, x - 14, secondaryY + 64, theme) : ''}
      ${repoName(x, secondaryY + 22, repo.name, colW, 12.5)}
      ${text(x, secondaryY + 39, fitUi(repo.description || '', 11, colW - 4), 'mut', 'font-size="11"')}
      ${metaRow({ x, y: secondaryY + 58, maxWidth: colW, gap: 10, items: repoFacts(repo, theme) })}`;
  }).join('');

  return reposCardShell({
    width,
    height,
    options,
    theme,
    title: 'repositories',
    badgeText: 'Featured',
    body: `
      ${repoName(pad, 70, lead.name, inner - barsW - tagW - 16, 16)}
      ${tag ? text(pad + Math.min(uiWidth(lead.name, 16, 600), inner - barsW - tagW - 16) + 8, 70, tag, 'mono mut', 'font-size="11"') : ''}
      ${weeklyBars({ x: width - pad - barsW, y: 54, width: barsW, height: 18, bins: lead.sparkline, theme })}
      ${descriptionLines(pad, 90, lead.description, inner, 1, 12)}
      ${metaRow({ x: pad, y: 108, maxWidth: inner, gap: 12, items: (lead.topics || []).slice(0, 5).map((t) => ({ text: `#${t}`, mono: true })) })}
      ${shares.length ? shareStrip({ x: pad, y: topicsY, width: inner, items: shares, size: 6, height: 6, theme, className: 'language-bar' }) : ''}
      ${metaRow({ x: pad, y: 150, maxWidth: inner, items: repoFacts(lead, theme, { watchers: true }) })}
      ${others.length ? hairline(pad, secondaryY, width - pad, secondaryY, theme) : ''}
      ${secondary}
    `,
  });
}

/**
 * 3. SPOTLIGHT: a case study of one repo, with its latest commit, beside a short list.
 */
function renderV1SpotlightSvg(data, theme, options = {}) {
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const inner = width - pad * 2;
  const repos = (data.repos || []).slice(0, 4);
  const lead = repos[0];
  const others = repos.slice(1);

  if (!lead) {
    return reposCardShell({ width, height: 96, options, theme, title: 'spotlight', body: text(pad, 70, NO_REPOS, 'mut', 'font-size="12"') });
  }

  const hasSide = others.length > 0;
  const leftW = hasSide ? Math.round(inner * (width <= 440 ? 0.54 : 0.58)) : inner;
  const ruleX = pad + leftW + 14;
  const sideX = ruleX + 14;
  const sideW = width - pad - sideX;
  const height = 218;

  const commit = lead.lastCommit;
  const factsY = 128;
  const commitBlock = commit?.sha
    ? `${text(pad, 150, commit.sha, 'mono ink', 'font-size="11"')}
       ${text(pad + monoWidth(commit.sha, 11) + 8, 150, fitUi(commit.message || '', 11, leftW - monoWidth(commit.sha, 11) - 12), 'mut', 'font-size="11"')}`
    : '';
  const barsLabelY = commit?.sha ? 170 : 148;
  const barsY = barsLabelY + 6;
  const barsH = height - 16 - barsY;

  const sideItems = others.map((repo, i) => {
    const y = 44 + i * 58;
    return `
      ${i > 0 ? hairline(sideX, y, width - pad, y, theme) : ''}
      ${repoName(sideX, y + 20, repo.name, sideW, 12)}
      ${metaRow({ x: sideX, y: y + 40, maxWidth: sideW, gap: 8, items: repoFacts(repo, theme, { time: false }) })}`;
  }).join('');

  return reposCardShell({
    width,
    height,
    options,
    theme,
    title: 'spotlight',
    body: `
      ${repoName(pad, 66, lead.name, leftW, 15)}
      ${descriptionLines(pad, 84, lead.description, leftW, 2, 11.5)}
      ${metaRow({ x: pad, y: factsY, maxWidth: leftW, gap: 10, items: repoFacts(lead, theme, { watchers: true, time: false }) })}
      ${commitBlock}
      ${text(pad, barsLabelY, 'Commits, last 8 weeks', 'lbl')}
      ${weeklyBars({ x: pad, y: barsY, width: leftW, height: barsH, bins: lead.sparkline, theme })}
      ${hasSide ? hairline(ruleX, 44, ruleX, height - 16, theme) : ''}
      ${sideItems}
    `,
  });
}

/**
 * 4. TIMELINE: repositories as a git log, newest first, on one commit rail.
 */
function renderV1TimelineSvg(data, theme, options = {}) {
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const repos = [...(data.repos || [])]
    .sort((a, b) => new Date(b.pushedAt || b.updatedAt || 0) - new Date(a.pushedAt || a.updatedAt || 0))
    .slice(0, 5);
  const rowH = 62;
  const startY = 50;
  const height = repos.length ? startY + repos.length * rowH : 96;

  const railX = pad + 4.5;
  const textX = pad + 22;
  const textW = width - pad - textX;
  const rail = repos.length > 1
    ? `<line x1="${railX}" y1="${startY + 10}" x2="${railX}" y2="${startY + (repos.length - 1) * rowH + 10}" stroke="${theme.border}" stroke-width="1.5" />`
    : '';

  const rows = repos.map((repo, i) => {
    const y = startY + i * rowH;
    const when = repo.pushedAt || repo.updatedAt;
    const pushed = when ? `pushed ${formatRelativeTime(when)}` : '';
    const pushedW = uiWidth(pushed, 11) + 6;
    const facts = repoFacts(repo, theme, { time: false, language: width > 440 });
    const factsW = Math.min(textW * 0.5, 210);
    const sha = repo.lastCommit?.sha;
    const message = sha ? repo.lastCommit.message || '' : repo.description || '';
    const shaW = sha ? monoWidth(sha, 11) + 8 : 0;
    return `
      <rect x="${pad}" y="${y + 5}" width="9" height="9" rx="2" fill="${repo.primaryLanguage?.color || theme.accent}" />
      ${repoName(textX, y + 14, repo.name, textW - pushedW - 8, 13)}
      ${pushed ? text(width - pad, y + 14, pushed, 'mut', 'font-size="11" text-anchor="end"') : ''}
      ${sha ? text(textX, y + 32, sha, 'mono ink', 'font-size="11"') : ''}
      ${text(textX + shaW, y + 32, fitUi(message, 11, textW - shaW - 2), 'mut', 'font-size="11"')}
      ${metaRow({ x: textX, y: y + 47, maxWidth: factsW + textW * 0.3, gap: 10, items: facts })}`;
  }).join('');

  return reposCardShell({
    width,
    height,
    options,
    theme,
    title: 'recently pushed',
    body: repos.length ? `${rail}${rows}` : text(pad, 70, NO_REPOS, 'mut', 'font-size="12"'),
  });
}

/**
 * 5. LEADERBOARD: ranked by stars, each repo metered against the leader.
 */
function renderV1LeaderboardSvg(data, theme, options = {}) {
  const width = resolveCardWidth(options.width);
  const pad = padX(width);
  const inner = width - pad * 2;
  const repos = (data.repos || []).slice(0, 5);
  const rowH = 48;
  const startY = 50;
  const height = repos.length ? startY + repos.length * rowH + 2 : 96;
  const maxStars = Math.max(1, ...repos.map((r) => r.stargazerCount || 0));
  const rankW = 26;
  const meterW = inner - rankW;
  const meterTotal = cellsThatFit(meterW, 6, 2);

  const rows = repos.map((repo, i) => {
    const y = startY + i * rowH;
    const facts = repoFacts(repo, theme, { time: false, watchers: true, language: width > 440 });
    const factsW = width <= 440 ? 150 : Math.min(inner * 0.6, 300);
    return `
      ${i > 0 ? hairline(pad, y - 8, width - pad, y - 8, theme) : ''}
      ${text(pad, y + 12, `#${i + 1}`, 'mono mut', 'font-size="11"')}
      ${repoName(pad + rankW, y + 12, repo.name, inner - rankW - factsW - 10, 13)}
      ${metaRow({ x: width - pad, y: y + 12, end: true, maxWidth: factsW, gap: 10, items: facts })}
      ${cellMeter({ x: pad + rankW, y: y + 20, total: meterTotal, ratio: (repo.stargazerCount || 0) / maxStars, size: 6, gap: 2, color: repo.primaryLanguage?.color, theme, className: 'stars-bar', delay: i * 60 })}`;
  }).join('');

  return reposCardShell({
    width,
    height,
    options,
    theme,
    title: 'top by stars',
    body: repos.length ? rows : text(pad, 70, NO_REPOS, 'mut', 'font-size="12"'),
  });
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

import axios from 'axios';
import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { normalizeProfile } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import { fitText, wrapText } from '../../svg/text.js';
import {
  renderHeatmapMatrix,
  renderCommitSparkline,
  renderLanguageBar,
} from '../../svg/primitives.js';

async function fetchAvatarBase64(url) {
  if (!url) return null;
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });
    const contentType = res.headers['content-type'] || 'image/jpeg';
    const bytes = new Uint8Array(res.data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof btoa === 'function' ? btoa(binary) : (typeof globalThis.Buffer !== 'undefined' ? globalThis.Buffer.from(res.data).toString('base64') : '');
    return base64 ? `data:${contentType};base64,${base64}` : null;
  } catch {
    return null;
  }
}

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

    if (normalized.avatarUrl) {
      const avatarBase64 = await fetchAvatarBase64(normalized.avatarUrl);
      if (avatarBase64) {
        normalized.avatarBase64 = avatarBase64;
      }
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

function extractProfileFields(data, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const login = escapeXml(data?.login || options.username || '');
  const handle = escapeXml(`@${login}`);
  const rawBio = data?.bio || 'No bio provided.';
  const hideBio = options.hide_bio === 'true' || options.show_bio === 'false';
  const hideMeta = options.hide_meta === 'true' || options.show_meta === 'false';
  const bio = hideBio ? null : (rawBio.length > 95 ? rawBio.slice(0, 92) + '...' : rawBio);

  const avatarDataUri = data?.avatarBase64 && data.avatarBase64.startsWith('data:') ? escapeXml(data.avatarBase64) : null;
  const followers = data?.followers ?? 0;
  const following = data?.following ?? 0;
  const repos = data?.repositories ?? 0;
  const stars = data?.totalStars ?? 0;

  const company = (!hideMeta && data?.company) ? escapeXml(data.company) : null;
  const location = (!hideMeta && data?.location) ? escapeXml(data.location) : null;
  const website = (!hideMeta && data?.websiteUrl) ? escapeXml(data.websiteUrl.replace(/^https?:\/\//, '')) : null;
  const createdAtYear = data?.createdAt ? new Date(data.createdAt).getFullYear() : (data?.createdAtYear || null);
  const currentYear = new Date().getFullYear();
  const accountAgeYears = createdAtYear ? Math.max(1, currentYear - createdAtYear) : (data?.accountAgeYears || null);
  const tenureText = createdAtYear ? `Joined ${createdAtYear} · ${accountAgeYears}y active` : (data?.tenureText || null);
  const isHireable = Boolean(data?.isHireable);
  const status = data?.status ? {
    emoji: escapeXml(data.status.emoji || ''),
    message: escapeXml(data.status.message || ''),
  } : null;

  const organizations = Array.isArray(data?.organizations) ? data.organizations.slice(0, 4) : [];
  const topRepo = data?.topRepo || null;
  const topLanguages = Array.isArray(data?.topLanguages) ? data.topLanguages.slice(0, 3) : [];
  const monthlyContributions = Array.isArray(data?.monthlyContributions)
    ? data.monthlyContributions
    : Array(12).fill(0);
  const calendar = data?.calendar || {
    totalContributions: 0,
    currentStreak: 0,
    longestStreak: 0,
    busiestWeekday: 'Wednesday',
    last30DaysCount: 0,
    weeks: [],
  };

  return {
    name,
    login,
    handle,
    bio,
    rawBio,
    hideBio,
    hideMeta,
    avatarDataUri,
    followers,
    following,
    repos,
    stars,
    company,
    location,
    website,
    createdAtYear,
    accountAgeYears,
    tenureText,
    isHireable,
    status,
    organizations,
    topRepo,
    topLanguages,
    monthlyContributions,
    calendar,
  };
}

function renderV1Svg(data, rawTheme, options = {}) {
  const theme = resolveTheme(rawTheme, options);
  const layout = (options.layout || 'classic').toLowerCase();

  if (layout === 'hero' || layout === 'banner') {
    return renderV1HeroSvg(data, theme, options);
  }
  if (layout === 'compact' || layout === 'mini') {
    return renderV1CompactSvg(data, theme, options);
  }
  if (layout === 'split' || layout === 'sidebar') {
    return renderV1SplitSvg(data, theme, options);
  }
  if (layout === 'activity' || layout === 'dashboard' || layout === 'grid') {
    return renderV1ActivitySvg(data, theme, options);
  }
  return renderV1ClassicSvg(data, theme, options);
}

/**
 * 1. CLASSIC VARIANT (Identity & Comprehensive Overview)
 * Answers: "Who is this developer?"
 * Displays: Avatar, name, handle, wrapped bio, metadata links (company, location, website),
 * isHireable badge, tenure indicator, and 4-cell footer summary strip (top language, top repo, followers, account age).
 */
export function renderV1ClassicSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 215;

  const badgeText = p.isHireable ? '🟢 Available for hire' : (p.tenureText || `Joined ${p.createdAtYear || 2021}`);
  const bioLines = p.hideBio ? [] : wrapText(p.rawBio, 11.5, width - 110, 2);

  const topLang = p.topLanguages[0] || { name: 'JavaScript', color: theme.title || '#58a6ff' };
  const topRepo = p.topRepo || { name: `${p.login}/repo`, stars: p.stars };

  const footerWidth = width - 48;
  const langColWidth = Math.floor(footerWidth * 0.22);
  const repoColWidth = Math.floor(footerWidth * 0.36);
  const followersColWidth = Math.floor(footerWidth * 0.18);
  const xCol0 = 0;
  const xCol1 = langColWidth;
  const xCol2 = langColWidth + repoColWidth;
  const xCol3 = langColWidth + repoColWidth + followersColWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-classic">
      <circle cx="54" cy="50" r="30" />
    </clipPath>
    <linearGradient id="profile-classic-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="avatar-fallback-classic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent || theme.title}" />
    </linearGradient>
  </defs>
  <style>
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 18px; fill: ${theme.title}; }
    .handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .bio { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.text}; opacity: 0.9; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 9.5px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
    .meta-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Card Frame -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-classic-bg)" stroke="${theme.border}"/>
  
  ${renderCardHeader({
    title: `${p.name}'s Profile`,
    badgeText,
    width,
    theme,
  })}

  <g transform="translate(0, 22)">
    <!-- Avatar Column -->
    <g transform="translate(0, 0)">
      <circle cx="54" cy="50" r="32" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
      ${p.avatarDataUri ? `
        <image href="${p.avatarDataUri}" x="24" y="20" width="60" height="60" clip-path="url(#avatar-clip-classic)"/>
      ` : `
        <circle cx="54" cy="50" r="30" fill="url(#avatar-fallback-classic)"/>
        <text x="54" y="57" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
      `}
    </g>

    <!-- User Identity & Bio -->
    <g transform="translate(100, 16)">
      <text x="0" y="16" class="name">${p.name}</text>
      <text x="0" y="34" class="handle">${p.handle}</text>
      ${bioLines.length > 0 ? `
        <text x="0" y="52" class="bio">
          ${bioLines.map((l, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 15}">${escapeXml(l)}</tspan>`).join('')}
        </text>
      ` : ''}
    </g>

    <!-- Metadata Row -->
    <g transform="translate(24, 108)" class="meta-text">
      ${p.company ? `<g transform="translate(0,0)">${icons.company(theme.iconColor)} <text x="17" y="10">${p.company}</text></g>` : ''}
      ${p.location ? `<g transform="translate(${p.company ? 150 : 0},0)">${icons.location(theme.iconColor)} <text x="17" y="10">${p.location}</text></g>` : ''}
      ${p.website ? `<g transform="translate(${p.company && p.location ? 290 : p.company || p.location ? 150 : 0},0)">${icons.link(theme.iconColor)} <text x="17" y="10">${p.website.length > 20 ? p.website.slice(0, 18) + '...' : p.website}</text></g>` : ''}
      ${!p.company && !p.location && !p.website && p.status?.message ? `<g transform="translate(0,0)"><text x="0" y="10">${p.status.emoji} ${p.status.message}</text></g>` : ''}
    </g>

    <!-- Footer Summary Strip -->
    <g transform="translate(24, 134)">
      <rect x="0" y="0" width="${footerWidth}" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>
      
      <g transform="translate(14, 14)">
        <!-- Top Language -->
        <g transform="translate(${xCol0}, 0)">
          <text x="0" y="0" class="stat-lbl">TOP LANGUAGE</text>
          <g transform="translate(0, 8)">
            <circle cx="5" cy="8" r="4" fill="${topLang.color || '#58a6ff'}"/>
            <text x="15" y="12" class="stat-val">${fitText(topLang.name, 12, langColWidth - 20)}</text>
          </g>
        </g>

        <!-- Top Repo -->
        <g transform="translate(${xCol1}, 0)">
          <text x="0" y="0" class="stat-lbl">TOP REPO</text>
          <text x="0" y="20" class="stat-val">⭐ ${fitText(topRepo.name, 11.5, repoColWidth - 15)}</text>
        </g>

        <!-- Followers -->
        <g transform="translate(${xCol2}, 0)">
          <text x="0" y="0" class="stat-lbl">FOLLOWERS</text>
          <text x="0" y="20" class="stat-val">${p.followers.toLocaleString()}</text>
        </g>

        <!-- Account Age / Joined -->
        <g transform="translate(${xCol3}, 0)">
          <text x="0" y="0" class="stat-lbl">ACCOUNT AGE</text>
          <text x="0" y="20" class="stat-val">${p.accountAgeYears ? `${p.accountAgeYears}y (Joined ${p.createdAtYear || 2021})` : `Joined ${p.createdAtYear || 2021}`}</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
}

/**
 * 2. HERO VARIANT (Language-Themed Dual Banner & Organization Badges)
 * Answers: "What is the strong first impression?"
 * Displays: Top language dual-gradient banner, prominent centered avatar, bio,
 * up to 4 organization badges, top-3 language dots, and bottom metric row.
 */
export function renderV1HeroSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 245;

  const lang1 = p.topLanguages?.[0]?.color || theme.title || '#58a6ff';
  const lang2 = p.topLanguages?.[1]?.color || theme.accent || '#a855f7';

  const stats = [
    { label: 'Repos', value: p.repos.toLocaleString(), icon: icons.repo(theme.iconColor) },
    { label: 'Stars', value: p.stars.toLocaleString(), icon: icons.star(theme.iconColor) },
    { label: 'Followers', value: p.followers.toLocaleString(), icon: icons.followers(theme.iconColor) },
    { label: 'Following', value: p.following.toLocaleString(), icon: icons.followers(theme.iconColor) },
  ];

  const colWidth = Math.floor((width - 48 - 36) / 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-hero">
      <circle cx="${width / 2}" cy="48" r="28" />
    </clipPath>
    <linearGradient id="profile-hero-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="hero-banner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${lang1}" stop-opacity="0.3" />
      <stop offset="50%" stop-color="${lang2}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${lang1}" stop-opacity="0.3" />
    </linearGradient>
    <linearGradient id="avatar-fallback-hero" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${lang1}" />
      <stop offset="100%" stop-color="${lang2}" />
    </linearGradient>
  </defs>
  <style>
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 19px; fill: ${theme.title}; }
    .hero-handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .hero-bio { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; fill: ${theme.text}; opacity: 0.9; }
    .tile-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
    .tile-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
    .org-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; font-weight: 600; fill: ${theme.secondaryText}; }
    .lang-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 600; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-hero-bg)" stroke="${theme.border}"/>
  
  <!-- Language Dual-Gradient Banner -->
  <rect x="1" y="1" width="${width - 2}" height="55" rx="11" fill="url(#hero-banner-grad)"/>

  <!-- Centered Avatar -->
  <g transform="translate(0, 0)">
    <circle cx="${width / 2}" cy="48" r="30" fill="${theme.bg}" stroke="${lang1}" stroke-width="2"/>
    ${p.avatarDataUri ? `
      <image href="${p.avatarDataUri}" x="${width / 2 - 28}" y="20" width="56" height="56" clip-path="url(#avatar-clip-hero)"/>
    ` : `
      <circle cx="${width / 2}" cy="48" r="28" fill="url(#avatar-fallback-hero)"/>
      <text x="${width / 2}" y="55" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
    `}
  </g>

  <!-- Centered User Info -->
  <g transform="translate(${width / 2}, 92)">
    <text x="0" y="0" text-anchor="middle" class="hero-name">${p.name}</text>
    <text x="0" y="18" text-anchor="middle" class="hero-handle">${p.handle}</text>
    ${p.bio ? `<text x="0" y="36" text-anchor="middle" class="hero-bio">${escapeXml(fitText(p.rawBio, 11.5, width - 60))}</text>` : ''}
  </g>

  <!-- Organization Badges or Top Language Color Dots -->
  <g transform="translate(24, 145)">
    ${p.organizations.length > 0 ? `
      <g transform="translate(0, 0)">
        ${p.organizations.slice(0, 3).map((org, i) => {
          const orgX = i * 140;
          return `
          <g transform="translate(${orgX}, 0)">
            <rect x="0" y="0" width="130" height="22" rx="11" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>
            <text x="12" y="15" class="org-text">🏢 ${fitText(org.name || org.login, 10.5, 95)}</text>
          </g>`;
        }).join('')}
      </g>
    ` : `
      <g transform="translate(0, 4)">
        ${p.topLanguages.slice(0, 3).map((l, i) => {
          const lx = i * 130;
          return `
          <g transform="translate(${lx}, 0)">
            <circle cx="5" cy="5" r="4.5" fill="${l.color}"/>
            <text x="15" y="9" class="lang-text">${l.name} (${l.percentage}%)</text>
          </g>`;
        }).join('')}
      </g>
    `}
  </g>

  <!-- Bottom Stats Row (4 tiles) -->
  <g transform="translate(24, 180)">
    ${stats.map((st, idx) => {
      const x = idx * (colWidth + 12);
      return `
      <g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="${colWidth}" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
        <g transform="translate(10, 14)">
          <g transform="translate(0, -9)">${st.icon}</g>
          <text x="18" y="0" class="tile-lbl">${st.label.toUpperCase()}</text>
          <text x="0" y="20" class="tile-val">${st.value}</text>
        </g>
      </g>`;
    }).join('')}
  </g>
</svg>`;
}

/**
 * 3. COMPACT VARIANT (Ultra-Compact README Header Banner)
 * Answers: "Inline identity for README header?"
 * Displays: 72px banner with 44px avatar, name, handle, 1-line bio, and 3 labelled chips (repos, followers, tenure).
 */
export function renderV1CompactSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 72;

  const chips = [
    { label: 'Repos', value: p.repos.toLocaleString(), icon: '📦' },
    { label: 'Followers', value: p.followers.toLocaleString(), icon: '👥' },
    { label: 'active', value: `${p.accountAgeYears || 1}y`, icon: '⏳' },
  ];

  const chipWidth = 78;
  const chipGap = 8;
  const chipsTotalWidth = chips.length * chipWidth + (chips.length - 1) * chipGap;
  const chipsStartX = width - chipsTotalWidth - 16;
  const textMaxWidth = Math.max(120, chipsStartX - 76);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-compact">
      <circle cx="36" cy="36" r="22" />
    </clipPath>
    <linearGradient id="profile-compact-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="avatar-fallback-compact" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent || theme.title}" />
    </linearGradient>
  </defs>
  <style>
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
    .handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; fill: ${theme.secondaryText}; }
    .bio-inline { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.text}; opacity: 0.85; }
    .chip-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11.5px; fill: ${theme.title}; }
    .chip-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9.5px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="10" width="${width - 1}" height="${height - 1}" fill="url(#profile-compact-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(0, 0)">
    <!-- Avatar -->
    <circle cx="36" cy="36" r="23" fill="none" stroke="${theme.title}" stroke-width="1.5" opacity="0.8"/>
    ${p.avatarDataUri ? `
      <image href="${p.avatarDataUri}" x="14" y="14" width="44" height="44" clip-path="url(#avatar-clip-compact)"/>
    ` : `
      <circle cx="36" cy="36" r="22" fill="url(#avatar-fallback-compact)"/>
      <text x="36" y="42" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="16" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
    `}

    <!-- User Identity & 1-Line Bio -->
    <g transform="translate(68, 16)">
      <text x="0" y="12" class="name">${p.name} <tspan class="handle" font-weight="400">${p.handle}</tspan></text>
      <text x="0" y="32" class="bio-inline">${escapeXml(fitText(p.rawBio, 10.5, textMaxWidth))}</text>
    </g>

    <!-- 3 Labelled Chips -->
    <g transform="translate(${chipsStartX}, 18)">
      ${chips.map((ch, idx) => {
        const x = idx * (chipWidth + chipGap);
        return `
        <g transform="translate(${x}, 0)">
          <rect x="0" y="0" width="${chipWidth}" height="36" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(6, 14)">
            <text x="0" y="0" font-size="11">${ch.icon}</text>
            <text x="16" y="-1" class="chip-val">${ch.value}</text>
            <text x="16" y="11" class="chip-lbl">${ch.label}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

/**
 * 4. SPLIT VARIANT (Developer Résumé / Summary)
 * Answers: "What is this developer's résumé summary?"
 * Displays: 2-column layout (Left: Sidebar identity, links, location. Right: ABOUT text, CURRENT FOCUS, top languages bar, 12m activity sparkline).
 */
export function renderV1SplitSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 225;

  const sidebarWidth = width <= 450 ? 135 : 155;
  const rightWidth = width - sidebarWidth - 36;
  const bioLines = wrapText(p.rawBio, 11, rightWidth - 24, 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-split">
      <circle cx="${sidebarWidth / 2}" cy="48" r="28" />
    </clipPath>
    <linearGradient id="profile-split-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="avatar-fallback-split" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent || theme.title}" />
    </linearGradient>
  </defs>
  <style>
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
    .handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 9.5px; fill: ${theme.title}; }
    .meta-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10.5px; fill: ${theme.secondaryText}; }
    .bio-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 10px; fill: ${theme.secondaryText}; letter-spacing: 0.6px; text-transform: uppercase; }
    .bio-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; fill: ${theme.text}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-split-bg)" stroke="${theme.border}"/>
  
  <!-- Left Sidebar Panel -->
  <rect x="1" y="1" width="${sidebarWidth}" height="${height - 2}" rx="11" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>

  <!-- Sidebar Content (Left Column) -->
  <g transform="translate(0, 0)">
    <!-- Avatar -->
    <circle cx="${sidebarWidth / 2}" cy="48" r="30" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
    ${p.avatarDataUri ? `
      <image href="${p.avatarDataUri}" x="${sidebarWidth / 2 - 28}" y="20" width="56" height="56" clip-path="url(#avatar-clip-split)"/>
    ` : `
      <circle cx="${sidebarWidth / 2}" cy="48" r="28" fill="url(#avatar-fallback-split)"/>
      <text x="${sidebarWidth / 2}" y="55" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
    `}

    <g transform="translate(${sidebarWidth / 2}, 90)">
      <text x="0" y="0" text-anchor="middle" class="name">${fitText(p.name, 14, sidebarWidth - 16)}</text>
      <text x="0" y="16" text-anchor="middle" class="handle">${p.handle}</text>

      ${p.createdAtYear ? `
        <g transform="translate(-40, 24)">
          <rect x="0" y="0" width="80" height="18" rx="9" fill="${theme.badgeBg}"/>
          <text x="40" y="12" text-anchor="middle" class="badge-text">Joined ${p.createdAtYear}</text>
        </g>
      ` : ''}
    </g>

    <!-- Sidebar Meta Links -->
    <g transform="translate(14, 150)" class="meta-text">
      ${p.company ? `<g transform="translate(0, 0)">${icons.company(theme.iconColor)} <text x="16" y="9">${fitText(p.company, 10.5, sidebarWidth - 36)}</text></g>` : ''}
      ${p.location ? `<g transform="translate(0, ${p.company ? 18 : 0})">${icons.location(theme.iconColor)} <text x="16" y="9">${fitText(p.location, 10.5, sidebarWidth - 36)}</text></g>` : ''}
      ${p.website ? `<g transform="translate(0, ${p.company && p.location ? 36 : p.company || p.location ? 18 : 0})">${icons.link(theme.iconColor)} <text x="16" y="9">${fitText(p.website, 10.5, sidebarWidth - 36)}</text></g>` : ''}
    </g>
  </g>

  <!-- Right Main Panel Content -->
  <g transform="translate(${sidebarWidth + 16}, 16)">
    <!-- 1. ABOUT Box -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="${rightWidth}" height="52" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
      <text x="12" y="15" class="bio-title">ABOUT</text>
      <text x="12" y="31" class="bio-text">
        ${bioLines.map((l, idx) => `<tspan x="12" dy="${idx === 0 ? 0 : 15}">${escapeXml(l)}</tspan>`).join('')}
      </text>
    </g>

    <!-- 2. CURRENT FOCUS / STATUS -->
    <g transform="translate(0, 60)">
      <rect x="0" y="0" width="${rightWidth}" height="26" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>
      <text x="10" y="17" class="bio-text">
        ${p.status?.emoji || '🚀'} <tspan font-weight="600" fill="${theme.title}">${p.status?.message || 'Full-Stack Developer &amp; Creative Technologist'}</tspan>
      </text>
    </g>

    <!-- 3. TOP LANGUAGES PROPORTION BAR -->
    <g transform="translate(0, 96)">
      <text x="0" y="0" class="bio-title">TOP LANGUAGES</text>
      <g transform="translate(0, 6)">
        ${renderLanguageBar(p.topLanguages, rightWidth, 8, theme)}
      </g>
    </g>

    <!-- 4. 12-MONTH ACTIVITY SPARKLINE -->
    <g transform="translate(0, 134)">
      <text x="0" y="0" class="bio-title">12-MONTH ACTIVITY</text>
      <g transform="translate(0, 6)">
        ${renderCommitSparkline(p.monthlyContributions.slice(-8), rightWidth, 34, theme.title, theme.accent || theme.title)}
      </g>
    </g>
  </g>
</svg>`;
}

/**
 * 5. ACTIVITY / DASHBOARD VARIANT (Contribution Cadence & Heatmap)
 * Answers: "How does this developer work?"
 * Displays: 53-week mini contribution heatmap, streak capsules (current flame 🔥 + longest streak),
 * busiest weekday, and 30-day contribution volume.
 */
export function renderV1ActivitySvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 245;

  const contentWidth = width - 48;
  const colWidth = Math.floor((contentWidth - 36) / 4);

  const cal = p.calendar;
  const cadenceStats = [
    { label: 'Current Streak', value: `${cal.currentStreak || 0}d`, icon: '🔥' },
    { label: 'Longest Streak', value: `${cal.longestStreak || 0}d`, icon: '🏆' },
    { label: 'Busiest Day', value: cal.busiestWeekday || 'Wednesday', icon: '📅' },
    { label: 'Last 30 Days', value: `${cal.last30DaysCount || 0}`, icon: '⚡' },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-activity">
      <circle cx="36" cy="30" r="16" />
    </clipPath>
    <linearGradient id="profile-activity-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="avatar-fallback-activity" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent || theme.title}" />
    </linearGradient>
  </defs>
  <style>
    .header-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
    .header-handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
    .bio-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.text}; opacity: 0.85; }
    .tile-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
    .tile-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 9.5px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-activity-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 16)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <!-- Avatar -->
      <circle cx="16" cy="16" r="16" fill="none" stroke="${theme.title}" stroke-width="1.5" opacity="0.8"/>
      ${p.avatarDataUri ? `
        <image href="${p.avatarDataUri}" x="0" y="0" width="32" height="32" clip-path="url(#avatar-clip-activity)"/>
      ` : `
        <circle cx="16" cy="16" r="15" fill="url(#avatar-fallback-activity)"/>
        <text x="16" y="21" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="13" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
      `}

      <!-- User Title & Handle -->
      <text x="44" y="14" class="header-title">${p.name}'s Contribution Cadence</text>
      <text x="44" y="28" class="header-handle">${p.handle} · Joined ${p.createdAtYear || 2020}</text>
      ${p.bio ? `<text x="0" y="44" class="bio-text">${escapeXml(fitText(p.rawBio, 11, contentWidth))}</text>` : ''}
    </g>

    <!-- 53-Week Full Contribution Heatmap -->
    <g transform="translate(0, 60)">
      ${renderHeatmapMatrix({
        weeks: cal.weeks,
        x: 0,
        y: 0,
        cellWidth: Math.max(4, Math.floor((contentWidth - (53 * 1.5)) / 53)),
        cellGap: 1.5,
        cols: 53,
        theme,
      })}
    </g>

    <!-- 4 Cadence & Consistency Metric Tiles -->
    <g transform="translate(0, 160)">
      ${cadenceStats.map((st, idx) => {
        const x = idx * (colWidth + 12);
        return `
        <g transform="translate(${x}, 0)">
          <rect x="0" y="0" width="${colWidth}" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(10, 14)">
            <text x="0" y="0" font-size="12">${st.icon}</text>
            <text x="18" y="0" class="tile-lbl">${st.label}</text>
            <text x="0" y="20" class="tile-val">${st.value}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export const renderV1DashboardSvg = renderV1ActivitySvg;

function renderV0Svg(data, theme, options = {}) {
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
}

export default profileCard;

import axios from 'axios';
import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { normalizeProfile } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';

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
  const bio = hideBio ? null : escapeXml(rawBio.length > 95 ? rawBio.slice(0, 92) + '...' : rawBio);

  const avatarDataUri = data?.avatarBase64 && data.avatarBase64.startsWith('data:') ? escapeXml(data.avatarBase64) : null;
  const followers = data?.followers ?? 0;
  const following = data?.following ?? 0;
  const repos = data?.repositories ?? 0;
  const stars = data?.totalStars ?? 0;

  const company = (!hideMeta && data?.company) ? escapeXml(data.company) : null;
  const location = (!hideMeta && data?.location) ? escapeXml(data.location) : null;
  const website = (!hideMeta && data?.websiteUrl) ? escapeXml(data.websiteUrl.replace(/^https?:\/\//, '')) : null;
  const createdAtYear = data?.createdAt ? new Date(data.createdAt).getFullYear() : null;

  return {
    name,
    login,
    handle,
    bio,
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
  };
}

function renderV1Svg(data, theme, options = {}) {
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
  if (layout === 'dashboard' || layout === 'grid') {
    return renderV1DashboardSvg(data, theme, options);
  }
  return renderV1ClassicSvg(data, theme, options);
}

function renderV1ClassicSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = 495;
  const height = 195;

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
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
    .meta-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
  </style>

  <!-- Card Outer Frame -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-classic-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(0, 0)">
    <!-- Avatar -->
    <g transform="translate(0, 0)">
      <circle cx="54" cy="50" r="32" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
      ${p.avatarDataUri ? `
        <image href="${p.avatarDataUri}" x="24" y="20" width="60" height="60" clip-path="url(#avatar-clip-classic)"/>
      ` : `
        <circle cx="54" cy="50" r="30" fill="url(#avatar-fallback-classic)"/>
        <text x="54" y="57" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
      `}
    </g>

    <!-- User Details -->
    <g transform="translate(100, 20)">
      <text x="0" y="16" class="name">${p.name}</text>
      <text x="0" y="34" class="handle">${p.handle}</text>
      
      ${p.createdAtYear ? `
        <rect x="300" y="0" width="70" height="20" rx="10" fill="${theme.badgeBg}"/>
        <text x="335" y="13" text-anchor="middle" class="badge-text">Joined ${p.createdAtYear}</text>
      ` : ''}

      ${p.bio ? `<text x="0" y="55" class="bio">${p.bio}</text>` : ''}
    </g>

    <!-- Meta Info Row -->
    <g transform="translate(24, 104)" class="meta-text">
      ${p.company ? `<g transform="translate(0,0)">${icons.company(theme.iconColor)} <text x="17" y="10">${p.company}</text></g>` : ''}
      ${p.location ? `<g transform="translate(${p.company ? 150 : 0},0)">${icons.location(theme.iconColor)} <text x="17" y="10">${p.location}</text></g>` : ''}
      ${p.website ? `<g transform="translate(${p.company && p.location ? 290 : p.company || p.location ? 150 : 0},0)">${icons.link(theme.iconColor)} <text x="17" y="10">${p.website.length > 18 ? p.website.slice(0, 16) + '...' : p.website}</text></g>` : ''}
    </g>

    <!-- Bottom Stats Container Grid -->
    <g transform="translate(24, 130)">
      <rect x="0" y="0" width="447" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>
      
      <g transform="translate(0, 14)">
        <g transform="translate(20, 0)">
          <text x="0" y="0" class="stat-lbl">REPOSITORIES</text>
          <text x="0" y="18" class="stat-val">${p.repos.toLocaleString()}</text>
        </g>
        <g transform="translate(130, 0)">
          <text x="0" y="0" class="stat-lbl">STARS</text>
          <text x="0" y="18" class="stat-val">${p.stars.toLocaleString()}</text>
        </g>
        <g transform="translate(240, 0)">
          <text x="0" y="0" class="stat-lbl">FOLLOWERS</text>
          <text x="0" y="18" class="stat-val">${p.followers.toLocaleString()}</text>
        </g>
        <g transform="translate(350, 0)">
          <text x="0" y="0" class="stat-lbl">FOLLOWING</text>
          <text x="0" y="18" class="stat-val">${p.following.toLocaleString()}</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
}

function renderV1HeroSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = 495;
  const height = 235;

  const stats = [
    { label: 'Repos', value: p.repos.toLocaleString(), icon: icons.repo(theme.iconColor) },
    { label: 'Stars', value: p.stars.toLocaleString(), icon: icons.star(theme.iconColor) },
    { label: 'Followers', value: p.followers.toLocaleString(), icon: icons.followers(theme.iconColor) },
    { label: 'Following', value: p.following.toLocaleString(), icon: icons.followers(theme.iconColor) },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-hero">
      <circle cx="247.5" cy="48" r="28" />
    </clipPath>
    <linearGradient id="profile-hero-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="hero-banner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.title}" stop-opacity="0.15" />
      <stop offset="50%" stop-color="${theme.accent || theme.title}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${theme.title}" stop-opacity="0.15" />
    </linearGradient>
    <linearGradient id="avatar-fallback-hero" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent || theme.title}" />
    </linearGradient>
  </defs>
  <style>
    .hero-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 19px; fill: ${theme.title}; }
    .hero-handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; fill: ${theme.secondaryText}; }
    .hero-bio { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.text}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
    .meta-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .tile-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 14px; fill: ${theme.title}; }
    .tile-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-hero-bg)" stroke="${theme.border}"/>
  
  <!-- Header Accent Banner -->
  <rect x="1" y="1" width="${width - 2}" height="55" rx="11" fill="url(#hero-banner-grad)"/>

  <!-- Centered Avatar -->
  <g transform="translate(0, 0)">
    <circle cx="247.5" cy="48" r="30" fill="${theme.bg}" stroke="${theme.title}" stroke-width="2"/>
    ${p.avatarDataUri ? `
      <image href="${p.avatarDataUri}" x="219.5" y="20" width="56" height="56" clip-path="url(#avatar-clip-hero)"/>
    ` : `
      <circle cx="247.5" cy="48" r="28" fill="url(#avatar-fallback-hero)"/>
      <text x="247.5" y="55" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
    `}
  </g>

  <!-- Centered User Info -->
  <g transform="translate(247.5, 96)">
    <text x="0" y="0" text-anchor="middle" class="hero-name">${p.name}</text>
    <text x="0" y="18" text-anchor="middle" class="hero-handle">${p.handle}</text>

    ${p.createdAtYear ? `
      <g transform="translate(-40, 24)">
        <rect x="0" y="0" width="80" height="18" rx="9" fill="${theme.badgeBg}"/>
        <text x="40" y="12" text-anchor="middle" class="badge-text">Joined ${p.createdAtYear}</text>
      </g>
    ` : ''}

    ${p.bio ? `<text x="0" y="${p.createdAtYear ? 58 : 38}" text-anchor="middle" class="hero-bio">${p.bio}</text>` : ''}
  </g>

  <!-- Bottom Stats Row (4 tiles) -->
  <g transform="translate(24, 172)">
    ${stats.map((st, idx) => {
      const x = idx * 114;
      return `
      <g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="104" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
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

function renderV1CompactSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = 495;
  const height = 125;

  const stats = [
    { label: 'Repos', value: p.repos.toLocaleString(), icon: icons.repo(theme.iconColor) },
    { label: 'Stars', value: p.stars.toLocaleString(), icon: icons.star(theme.iconColor) },
    { label: 'Followers', value: p.followers.toLocaleString(), icon: icons.followers(theme.iconColor) },
    { label: 'Following', value: p.following.toLocaleString(), icon: icons.followers(theme.iconColor) },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-compact">
      <circle cx="45" cy="62.5" r="26" />
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
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
    .meta-inline { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .chip-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 12px; fill: ${theme.title}; }
    .chip-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-compact-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(0, 0)">
    <!-- Avatar -->
    <circle cx="45" cy="62.5" r="28" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
    ${p.avatarDataUri ? `
      <image href="${p.avatarDataUri}" x="19" y="36.5" width="52" height="52" clip-path="url(#avatar-clip-compact)"/>
    ` : `
      <circle cx="45" cy="62.5" r="26" fill="url(#avatar-fallback-compact)"/>
      <text x="45" y="69" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="18" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
    `}

    <!-- User Info -->
    <g transform="translate(85, 28)">
      <text x="0" y="14" class="name">${p.name}</text>
      <text x="0" y="32" class="handle">${p.handle}</text>
      <text x="0" y="52" class="meta-inline">
        ${p.location ? `📍 ${p.location}` : p.company ? `🏢 ${p.company}` : p.createdAtYear ? `Joined ${p.createdAtYear}` : ''}
      </text>
    </g>

    <!-- 2x2 Metric Chips Grid -->
    <g transform="translate(265, 24)">
      ${stats.map((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 105;
        const y = row * 38;

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="98" height="32" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(8, 11)">
            <g transform="translate(0, -9)">${st.icon}</g>
            <text x="16" y="0" class="chip-val">${st.value}</text>
            <text x="16" y="12" class="chip-lbl">${st.label}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderV1SplitSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = 495;
  const height = 215;

  const stats = [
    { label: 'Repositories', value: p.repos.toLocaleString(), icon: icons.repo(theme.iconColor) },
    { label: 'Total Stars', value: p.stars.toLocaleString(), icon: icons.star(theme.iconColor) },
    { label: 'Followers', value: p.followers.toLocaleString(), icon: icons.followers(theme.iconColor) },
    { label: 'Following', value: p.following.toLocaleString(), icon: icons.followers(theme.iconColor) },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-split">
      <circle cx="75" cy="52" r="28" />
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
    .bio-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 11px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
    .bio-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.text}; }
    .tile-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 15px; fill: ${theme.title}; }
    .tile-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-split-bg)" stroke="${theme.border}"/>
  
  <!-- Left Sidebar Panel -->
  <rect x="1" y="1" width="150" height="${height - 2}" rx="11" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>

  <!-- Sidebar Content (Left Column) -->
  <g transform="translate(0, 0)">
    <!-- Avatar -->
    <circle cx="75" cy="52" r="30" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
    ${p.avatarDataUri ? `
      <image href="${p.avatarDataUri}" x="47" y="24" width="56" height="56" clip-path="url(#avatar-clip-split)"/>
    ` : `
      <circle cx="75" cy="52" r="28" fill="url(#avatar-fallback-split)"/>
      <text x="75" y="59" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
    `}

    <g transform="translate(75, 94)">
      <text x="0" y="0" text-anchor="middle" class="name">${p.name.length > 14 ? p.name.slice(0, 12) + '..' : p.name}</text>
      <text x="0" y="16" text-anchor="middle" class="handle">${p.handle}</text>

      ${p.createdAtYear ? `
        <g transform="translate(-35, 22)">
          <rect x="0" y="0" width="70" height="18" rx="9" fill="${theme.badgeBg}"/>
          <text x="35" y="12" text-anchor="middle" class="badge-text">Joined ${p.createdAtYear}</text>
        </g>
      ` : ''}
    </g>

    <!-- Sidebar Meta Links -->
    <g transform="translate(15, 156)" class="meta-text">
      ${p.company ? `<g transform="translate(0, 0)">${icons.company(theme.iconColor)} <text x="16" y="9">${p.company.length > 13 ? p.company.slice(0, 11) + '..' : p.company}</text></g>` : ''}
      ${p.location ? `<g transform="translate(0, ${p.company ? 18 : 0})">${icons.location(theme.iconColor)} <text x="16" y="9">${p.location.length > 13 ? p.location.slice(0, 11) + '..' : p.location}</text></g>` : ''}
      ${p.website ? `<g transform="translate(0, ${p.company && p.location ? 36 : p.company || p.location ? 18 : 0})">${icons.link(theme.iconColor)} <text x="16" y="9">${p.website.length > 13 ? p.website.slice(0, 11) + '..' : p.website}</text></g>` : ''}
    </g>
  </g>

  <!-- Right Main Panel Content -->
  <g transform="translate(166, 18)">
    <!-- Bio Container Box -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="310" height="54" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
      <text x="12" y="18" class="bio-title">ABOUT</text>
      <text x="12" y="36" class="bio-text">${p.bio || 'GitHub developer profile.'}</text>
    </g>

    <!-- 2x2 Metric Grid Cards -->
    <g transform="translate(0, 68)">
      ${stats.map((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 158;
        const y = row * 54;

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="152" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(12, 16)">
            <g transform="translate(0, -10)">${st.icon}</g>
            <text x="20" y="0" class="tile-lbl">${st.label}</text>
            <text x="0" y="20" class="tile-val">${st.value}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderV1DashboardSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = 495;
  const height = 220;

  const stats = [
    { label: 'Public Repositories', value: p.repos.toLocaleString(), icon: icons.repo(theme.iconColor) },
    { label: 'Stars Earned', value: p.stars.toLocaleString(), icon: icons.star(theme.iconColor) },
    { label: 'Followers Count', value: p.followers.toLocaleString(), icon: icons.followers(theme.iconColor) },
    { label: 'Following Count', value: p.following.toLocaleString(), icon: icons.followers(theme.iconColor) },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-dash">
      <circle cx="28" cy="24" r="22" />
    </clipPath>
    <linearGradient id="profile-dash-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="avatar-fallback-dash" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent || theme.title}" />
    </linearGradient>
  </defs>
  <style>
    .header-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .header-handle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
    .bio-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; fill: ${theme.text}; }
    .tile-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 16px; fill: ${theme.title}; }
    .tile-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.secondaryText}; letter-spacing: 0.5px; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-dash-bg)" stroke="${theme.border}"/>
  
  <g transform="translate(24, 20)">
    <!-- Top Header Summary Card -->
    <g transform="translate(0, 0)">
      <!-- Avatar -->
      <circle cx="28" cy="24" r="24" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
      ${p.avatarDataUri ? `
        <image href="${p.avatarDataUri}" x="6" y="2" width="44" height="44" clip-path="url(#avatar-clip-dash)"/>
      ` : `
        <circle cx="28" cy="24" r="22" fill="url(#avatar-fallback-dash)"/>
        <text x="28" y="30" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="16" fill="#ffffff">${p.name.charAt(0).toUpperCase()}</text>
      `}

      <!-- User Title & Handle -->
      <text x="62" y="18" class="header-title">${p.name}</text>
      <text x="62" y="34" class="header-handle">${p.handle}</text>

      ${p.createdAtYear ? `
        <rect x="367" y="4" width="80" height="20" rx="10" fill="${theme.badgeBg}"/>
        <text x="407" y="17" text-anchor="middle" class="badge-text">Joined ${p.createdAtYear}</text>
      ` : ''}

      ${p.bio ? `<text x="0" y="62" class="bio-text">${p.bio}</text>` : ''}
    </g>

    <!-- 2x2 Dashboard Tile Cards -->
    <g transform="translate(0, 78)">
      ${stats.map((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 228;
        const y = row * 56;

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="218" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <g transform="translate(14, 16)">
            <g transform="translate(0, -9)">${st.icon}</g>
            <text x="22" y="0" class="tile-lbl">${st.label.toUpperCase()}</text>
            <text x="0" y="20" class="tile-val">${st.value}</text>
          </g>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}


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

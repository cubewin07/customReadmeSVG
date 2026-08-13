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

function renderV1Svg(data, theme, options = {}) {
  const name = escapeXml(data?.name || data?.login || options.username || 'User');
  const handle = escapeXml(`@${data?.login || options.username || ''}`);
  const rawBio = data?.bio || 'No bio provided.';
  const bio = escapeXml(rawBio.length > 95 ? rawBio.slice(0, 92) + '...' : rawBio);
  
  // Only use avatar image if it's a valid Data URI (to avoid browser SVG sub-resource broken image icon)
  const avatarDataUri = data?.avatarBase64 && data.avatarBase64.startsWith('data:') ? escapeXml(data.avatarBase64) : null;
  
  const followers = data?.followers ?? 0;
  const following = data?.following ?? 0;
  const repos = data?.repositories ?? 0;
  const stars = data?.totalStars ?? 0;
  const company = data?.company ? escapeXml(data.company) : null;
  const location = data?.location ? escapeXml(data.location) : null;
  const website = data?.websiteUrl ? escapeXml(data.websiteUrl.replace(/^https?:\/\//, '')) : null;
  const createdAtYear = data?.createdAt ? new Date(data.createdAt).getFullYear() : null;

  const width = 495;
  const height = 195;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip">
      <circle cx="54" cy="50" r="30" />
    </clipPath>
    <linearGradient id="profile-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
    <linearGradient id="avatar-fallback-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.title}" />
      <stop offset="100%" stop-color="${theme.accent}" />
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
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#profile-card-bg)" stroke="${theme.border}"/>
  
  <!-- Content Area -->
  <g transform="translate(0, 0)">
    
    <!-- Avatar (Left Column) -->
    <g transform="translate(0, 0)">
      <circle cx="54" cy="50" r="32" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.8"/>
      ${avatarDataUri ? `
        <image href="${avatarDataUri}" x="24" y="20" width="60" height="60" clip-path="url(#avatar-clip)"/>
      ` : `
        <circle cx="54" cy="50" r="30" fill="url(#avatar-fallback-bg)"/>
        <text x="54" y="57" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">${name.charAt(0).toUpperCase()}</text>
      `}
    </g>

    <!-- User Details (Right Column next to Avatar) -->
    <g transform="translate(100, 20)">
      <!-- Name -->
      <text x="0" y="16" class="name">${name}</text>
      
      <!-- Handle -->
      <text x="0" y="34" class="handle">${handle}</text>
      
      <!-- Joined Badge -->
      ${createdAtYear ? `
        <rect x="300" y="0" width="70" height="20" rx="10" fill="${theme.badgeBg}"/>
        <text x="335" y="13" text-anchor="middle" class="badge-text">Joined ${createdAtYear}</text>
      ` : ''}

      <!-- Bio (Aligned under handle, NOT under avatar) -->
      <text x="0" y="55" class="bio">${bio}</text>
    </g>

    <!-- Meta Info Row (Company, Location, Website) -->
    <g transform="translate(24, 104)" class="meta-text">
      ${company ? `<g transform="translate(0,0)">${icons.company(theme.iconColor)} <text x="17" y="10">${company}</text></g>` : ''}
      ${location ? `<g transform="translate(${company ? 150 : 0},0)">${icons.location(theme.iconColor)} <text x="17" y="10">${location}</text></g>` : ''}
      ${website ? `<g transform="translate(${company && location ? 290 : company || location ? 150 : 0},0)">${icons.link(theme.iconColor)} <text x="17" y="10">${website.length > 18 ? website.slice(0, 16) + '...' : website}</text></g>` : ''}
    </g>

    <!-- Bottom Stats Container Grid -->
    <g transform="translate(24, 130)">
      <rect x="0" y="0" width="447" height="48" rx="8" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}"/>
      
      <g transform="translate(0, 14)">
        <!-- Repos -->
        <g transform="translate(20, 0)">
          <text x="0" y="0" class="stat-lbl">REPOSITORIES</text>
          <text x="0" y="18" class="stat-val">${repos.toLocaleString()}</text>
        </g>
        
        <!-- Stars -->
        <g transform="translate(130, 0)">
          <text x="0" y="0" class="stat-lbl">STARS</text>
          <text x="0" y="18" class="stat-val">${stars.toLocaleString()}</text>
        </g>

        <!-- Followers -->
        <g transform="translate(240, 0)">
          <text x="0" y="0" class="stat-lbl">FOLLOWERS</text>
          <text x="0" y="18" class="stat-val">${followers.toLocaleString()}</text>
        </g>

        <!-- Following -->
        <g transform="translate(350, 0)">
          <text x="0" y="0" class="stat-lbl">FOLLOWING</text>
          <text x="0" y="18" class="stat-val">${following.toLocaleString()}</text>
        </g>
      </g>
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

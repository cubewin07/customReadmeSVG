import axios from 'axios';
import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { normalizeProfile } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { icons } from '../../svg/icons.js';
import { renderCardHeader } from '../../svg/header.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import { fitText, wrapText, measureText } from '../../svg/text.js';
import {
  renderCardDefs,
  renderCardStyles,
  renderCardFrame,
  renderBentoTile,
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
    const base64 =
      typeof btoa === 'function'
        ? btoa(binary)
        : typeof globalThis.Buffer !== 'undefined'
        ? globalThis.Buffer.from(res.data).toString('base64')
        : '';
    return base64 ? `data:${contentType};base64,${base64}` : null;
  } catch {
    return null;
  }
}

export const profileCard = {
  id: 'profile',
  title: 'Profile Overview',
  aliases: ['overview', 'default'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    const data = await graphql(
      PROFILE_QUERY,
      { login: username },
      {
        ...options,
        cacheKey: options.cacheKey || `gh:profile:${username}`,
        ttlMs: options.ttlMs || this.cacheTtlMs,
      }
    );

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

function extractProfileFields(data = {}, options = {}) {
  const login = data.login || 'developer';
  const name = data.name || login;
  const handle = `@${login}`;
  const rawBio = (data.bio || '').trim();
  const hideBio = options.hide_bio === 'true' || options.hide_bio === true || !rawBio;
  const hideMeta = options.hide_meta === 'true' || options.hide_meta === true;
  const bio = hideBio ? '' : rawBio;
  const avatarDataUri = data.avatarBase64 || data.avatarUrl || null;

  const followers = data.followers || 0;
  const following = data.following || 0;
  const repos = data.repositories || 0;
  const stars = data.totalStars || 0;

  const company = hideMeta ? '' : (data.company || '').trim();
  const location = hideMeta ? '' : (data.location || '').trim();
  const website = hideMeta ? '' : (data.websiteUrl || '').trim();

  let createdAtYear = null;
  let accountAgeYears = null;
  if (data.createdAt) {
    const createdDate = new Date(data.createdAt);
    if (!Number.isNaN(createdDate.getTime())) {
      createdAtYear = createdDate.getFullYear();
      const now = new Date();
      accountAgeYears = Math.max(1, now.getFullYear() - createdAtYear);
    }
  }
  const tenureText = createdAtYear
    ? `Joined ${createdAtYear} · ${accountAgeYears}y active`
    : null;

  const isHireable = Boolean(data.isHireable);
  const status = data.status || null;
  const organizations = Array.isArray(data.organizations) ? data.organizations : [];
  const topRepo = data.topRepo || null;
  const topLanguages = Array.isArray(data.topLanguages) ? data.topLanguages : [];
  const rawWeeks = Array.isArray(data.calendar?.weeks)
    ? data.calendar.weeks
    : Array.isArray(data.weeks)
    ? data.weeks
    : [];
  const derivedDays = rawWeeks.flatMap((w) => w.contributionDays || []);
  const derivedLast30 = derivedDays.slice(-30).reduce((s, d) => s + (d.contributionCount || 0), 0);
  const calendar = {
    totalContributions: data.calendar?.totalContributions ?? data.totalContributions ?? 0,
    currentStreak: data.calendar?.currentStreak ?? data.currentStreak ?? 0,
    longestStreak: data.calendar?.longestStreak ?? data.maxStreak ?? data.longestStreak ?? 0,
    busiestWeekday: data.calendar?.busiestWeekday || data.busiestWeekday || 'Wednesday',
    last30DaysCount: data.calendar?.last30DaysCount ?? data.last30DaysCount ?? derivedLast30,
    weeks: rawWeeks,
  };
  const monthlyContributions = Array.isArray(data.monthlyContributions)
    ? data.monthlyContributions
    : rawWeeks.length >= 8
    ? Array.from({ length: 8 }, (_, idx) => {
        const slice = rawWeeks.slice(Math.max(0, rawWeeks.length - (8 - idx) * 4), rawWeeks.length - (7 - idx) * 4);
        return slice.reduce((acc, w) => acc + (w.contributionDays || []).reduce((s, d) => s + (d.contributionCount || 0), 0), 0);
      })
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

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

function formatCompactCount(val) {
  const num = Number(val) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return num.toLocaleString();
}

function renderAvatarRing(cx, cy, r, clipId, avatarDataUri, initial, idPrefix) {
  return `
    <g>
      <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="url(#${idPrefix}-brand)" stroke-width="1.75" opacity="0.9" />
      <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="url(#${idPrefix}-brand)" stroke-width="0.75" stroke-dasharray="3 3" opacity="0.45" />
      ${
        avatarDataUri
          ? `<image href="${avatarDataUri}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${clipId})"/>`
          : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${idPrefix}-brand)"/>
             <text x="${cx}" y="${cy + Math.round(r * 0.26)}" text-anchor="middle" class="font-ui" font-weight="800" font-size="${Math.round(r * 0.72)}" fill="#ffffff">${initial}</text>`
      }
    </g>
  `;
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
 * 1. CLASSIC VARIANT (Glassmorphic Executive Overview)
 */
export function renderV1ClassicSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 204;
  const idPrefix = 'prof-classic';
  const contentWidth = width - 48;

  const badgeText = p.isHireable
    ? '🟢 Available for hire'
    : p.tenureText || `JOINED ${p.createdAtYear || 2024}`;

  const topLang = p.topLanguages[0] || {
    name: 'JavaScript',
    color: theme.title || '#38bdf8',
  };
  const topRepo = p.topRepo || { name: `${p.login}/repo`, stars: p.stars };

  const maxNameW = Math.max(95, Math.floor((contentWidth - 84) * 0.58));
  const fittedNameRaw = fitText(p.name, 19, maxNameW);
  const fittedName = escapeXml(fittedNameRaw);
  const nameW = Math.round(measureText(fittedNameRaw, 19.5));
  const handleX = nameW + 10;
  const maxHandleW = Math.max(60, contentWidth - 82 - handleX);
  const fittedHandle = escapeXml(fitText(p.handle, 12.5, maxHandleW));

  const effectiveBio = p.rawBio || (options.hide_bio === 'true' || options.hide_bio === true ? '' : 'Software engineer & open-source builder shipping code on GitHub.');
  const bioLines = effectiveBio ? wrapText(effectiveBio, 12, contentWidth - 82, 2) : [];

  // Dynamic Metadata Row (advancing currentX to strictly avoid collisions/overflow)
  const metaItems = [];
  if (p.company) metaItems.push({ icon: icons.company(theme.iconColor), text: p.company });
  if (p.location) metaItems.push({ icon: icons.location(theme.iconColor), text: p.location });
  if (p.website) {
    const cleanWeb = p.website.replace(/^https?:\/\//, '');
    metaItems.push({ icon: icons.link(theme.iconColor), text: cleanWeb });
  }
  if (metaItems.length === 0) {
    metaItems.push({ statusDot: true, text: p.status?.message || 'Active Open-Source Builder & Systems Engineer' });
  }

  let metaX = 0;
  const maxMetaX = contentWidth - 80;
  const metaSvg = metaItems
    .map((item) => {
      const availItemW = maxMetaX - metaX - (item.statusDot ? 18 : 20);
      if (availItemW < 45 && metaX > 0) return '';
      const maxItemTextW = metaItems.length === 1 ? availItemW : Math.min(155, availItemW);
      const fittedItem = fitText(item.text, 11, maxItemTextW);
      const itemText = escapeXml(fittedItem);
      const itemW = Math.round(measureText(fittedItem, 11.2)) + (item.statusDot ? 18 : 20);
      const currentX = metaX;
      metaX += itemW + 14;
      if (item.statusDot) {
        return `<g transform="translate(${currentX}, 0)"><circle cx="4" cy="6" r="3.5" fill="#10b981" class="pulse-dot"/><text x="13" y="10">${itemText}</text></g>`;
      }
      return `<g transform="translate(${currentX}, 0)">${item.icon}<text x="16" y="10">${itemText}</text></g>`;
    })
    .join('');

  // 4-Cell Bento Telemetry Strip
  const footerWidth = contentWidth;
  const col0W = Math.floor(footerWidth * 0.23);
  const col1W = Math.floor(footerWidth * 0.36);
  const col2W = Math.floor(footerWidth * 0.19);
  const col3W = footerWidth - col0W - col1W - col2W - 18;

  const cells = [
    {
      w: col0W,
      label: 'TOP LANGUAGE',
      content: `<circle cx="5" cy="15" r="4" fill="${topLang.color || '#38bdf8'}"/>
                <text x="14" y="19" class="stat-val" font-size="12">${escapeXml(fitText(topLang.name, 12, col0W - 24))}</text>`,
    },
    {
      w: col1W,
      label: 'FLAGSHIP REPO',
      content: `<g transform="translate(0, 6)" fill="${theme.accent || theme.title}">${icons.star(theme.accent || theme.title)}</g>
                <text x="16" y="19" class="stat-val" font-size="11.5">${escapeXml(fitText(String(topRepo.name).replace(/^.*\//, ''), 11.5, col1W - 26))}</text>`,
    },
    {
      w: col2W,
      label: 'FOLLOWERS',
      content: `<text x="0" y="19" class="stat-val" font-size="13">${formatCompactCount(p.followers)}</text>`,
    },
    {
      w: col3W,
      label: col3W < 88 ? 'JOINED' : 'ACCOUNT AGE',
      content: `<text x="0" y="19" class="stat-val" font-size="12.5">${p.accountAgeYears ? `${p.accountAgeYears}y` : '1y'} <tspan class="meta-text" font-size="9.5">(${p.createdAtYear || 2024})</tspan></text>`,
    },
  ];

  let currentTileX = 0;
  const tilesSvg = cells
    .map((cell) => {
      const tile = renderBentoTile({
        x: currentTileX,
        y: 0,
        width: cell.w,
        height: 50,
        theme,
        idPrefix,
        rx: 8,
        children: `<g transform="translate(11, 14)">
          <text x="0" y="0" class="stat-lbl">${cell.label}</text>
          <g transform="translate(0, 6)">${cell.content}</g>
        </g>`,
      });
      currentTileX += cell.w + 6;
      return tile;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-classic">
      <circle cx="54" cy="52" r="29" />
    </clipPath>
    ${renderCardDefs(idPrefix, theme, topLang.color, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: -0.02em; fill: ${theme.title}; }
    .handle { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-size: 12px; font-weight: 500; fill: ${theme.accent || theme.secondaryText}; }
    .bio, .bio-text { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11.5px; fill: ${theme.text}; opacity: 0.92; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  ${renderCardHeader({
    title: 'PROFILE // Overview',
    badgeText,
    width,
    theme,
  })}

  <g transform="translate(0, 24)">
    ${renderAvatarRing(54, 52, 29, 'avatar-clip-classic', p.avatarDataUri, p.name.charAt(0).toUpperCase(), idPrefix)}

    <!-- Identity & Bio -->
    <g transform="translate(98, 16)">
      <text x="0" y="15" class="name">${fittedName}</text>
      <text x="${handleX}" y="15" class="handle">${fittedHandle}</text>
      ${
        bioLines.length > 0
          ? bioLines.map((l, idx) => `<text x="0" y="${35 + idx * 15}" class="bio-text" fill="${theme.text}"><tspan>${escapeXml(l)}</tspan></text>`).join('')
          : ''
      }
    </g>

    <!-- Metadata Dynamic Row -->
    <g transform="translate(98, 76)" class="meta-text">
      ${metaSvg}
    </g>

    <!-- 4-Cell Bento Telemetry Strip -->
    <g transform="translate(24, 114)">
      ${tilesSvg}
    </g>
  </g>
</svg>`;
}

/**
 * 2. HERO VARIANT (Language-Themed Aurora Banner & Bento Telemetry)
 */
export function renderV1HeroSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 248;
  const idPrefix = 'prof-hero';

  const lang1 = p.topLanguages?.[0]?.color || theme.title || '#38bdf8';
  const lang2 = p.topLanguages?.[1]?.color || theme.accent || '#818cf8';

  const colWidth = Math.floor((width - 44 - 24) / 4);
  const stats = [
    { label: colWidth < 96 ? 'REPOS' : 'PUBLIC REPOS', value: formatCompactCount(p.repos), icon: icons.repo(theme.iconColor) },
    { label: colWidth < 96 ? 'STARS' : 'TOTAL STARS', value: formatCompactCount(p.stars), icon: icons.star(theme.iconColor) },
    { label: 'FOLLOWERS', value: formatCompactCount(p.followers), icon: icons.followers(theme.iconColor) },
    { label: 'FOLLOWING', value: formatCompactCount(p.following), icon: icons.followers(theme.iconColor) },
  ];

  const heroName = escapeXml(fitText(p.name, 20, width - 56));
  const heroHandle = escapeXml(fitText(p.handle, 12.5, width - 80));
  const heroBioText = p.rawBio || (options.hide_bio === 'true' || options.hide_bio === true ? '' : 'Open-Source Software Engineer & Systems Builder');

  const fallbackMetaPills = [
    { icon: icons.company(theme.iconColor), text: p.company || 'Open-Source' },
    { icon: icons.location(theme.iconColor), text: p.location || 'Global / Remote' },
    { icon: icons.calendar(theme.iconColor), text: `Joined ${p.createdAtYear || 2024}` },
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-hero">
      <circle cx="${width / 2}" cy="48" r="28" />
    </clipPath>
    <clipPath id="hero-banner-clip">
      <path d="M 1,14 A 13,13 0 0 1 14,1 L ${width - 14},1 A 13,13 0 0 1 ${width - 1},14 L ${width - 1},54 L 1,54 Z" />
    </clipPath>
    ${renderCardDefs(idPrefix, theme, lang1, lang2)}
    <linearGradient id="hero-banner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${lang1}" stop-opacity="0.32" />
      <stop offset="50%" stop-color="${lang2}" stop-opacity="0.48" />
      <stop offset="100%" stop-color="${lang1}" stop-opacity="0.32" />
    </linearGradient>
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 18px; letter-spacing: -0.02em; fill: ${theme.title}; }
    .handle { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-size: 12px; font-weight: 500; fill: ${theme.accent || theme.secondaryText}; }
    .bio { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11.5px; fill: ${theme.text}; opacity: 0.92; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  <!-- Top Aurora Header Banner (Clipped to Card Bounds) -->
  <rect x="1" y="1" width="${width - 2}" height="56" clip-path="url(#hero-banner-clip)" fill="url(#hero-banner-grad)" />
  <line x1="1" y1="54" x2="${width - 1}" y2="54" stroke="${theme.subtleBorder || theme.border}" stroke-opacity="0.75" />

  ${renderAvatarRing(width / 2, 48, 28, 'avatar-clip-hero', p.avatarDataUri, p.name.charAt(0).toUpperCase(), idPrefix)}

  <!-- Centered Identity -->
  <g transform="translate(${width / 2}, 96)">
    <text x="0" y="0" text-anchor="middle" class="name" font-size="18.5">${heroName}</text>
    <text x="0" y="16" text-anchor="middle" class="handle">${heroHandle}</text>
    ${heroBioText ? `<text x="0" y="34" text-anchor="middle" class="bio bio-text" fill="${theme.text}">${escapeXml(fitText(heroBioText, 12, width - 56))}</text>` : ''}
  </g>

  <!-- Language / Org / Fallback Metadata Pill Strip -->
  <g transform="translate(${width / 2}, 146)">
    ${
      p.organizations.length > 0
        ? p.organizations
            .slice(0, 3)
            .map((org, i, arr) => {
              const pillW = Math.min(122, Math.floor((width - 56) / arr.length));
              const totalW = arr.length * pillW + (arr.length - 1) * 8;
              const startX = -totalW / 2 + i * (pillW + 8);
              return `
              <g transform="translate(${startX}, 0)">
                <rect x="0" y="0" width="${pillW}" height="22" rx="11" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" stroke-opacity="0.7" />
                <g transform="translate(8, 4)">${icons.company(theme.iconColor)}</g>
                <text x="24" y="14.5" class="font-ui" font-size="10" font-weight="600" fill="${theme.secondaryText}">${escapeXml(fitText(org.name || org.login, 10.5, pillW - 30))}</text>
              </g>`;
            })
            .join('')
        : p.topLanguages.length > 0
        ? p.topLanguages
            .slice(0, 3)
            .map((l, i, arr) => {
              const pillW = Math.min(118, Math.floor((width - 56) / arr.length));
              const totalW = arr.length * pillW + (arr.length - 1) * 8;
              const startX = -totalW / 2 + i * (pillW + 8);
              return `
              <g transform="translate(${startX}, 0)">
                <rect x="0" y="0" width="${pillW}" height="22" rx="11" fill="${theme.cardBg}" stroke="${l.color || lang1}" stroke-opacity="0.45" />
                <circle cx="12" cy="11" r="3.5" fill="${l.color || lang1}" />
                <text x="21" y="14.5" class="font-ui" font-size="10" font-weight="600" fill="${theme.title}">${escapeXml(fitText(l.name, 10.5, pillW - 56))}</text>
                <text x="${pillW - 10}" y="14.5" text-anchor="end" class="font-mono" font-size="9.5" fill="${theme.secondaryText}">${l.percentage ?? ''}%</text>
              </g>`;
            })
            .join('')
        : fallbackMetaPills
            .map((item, i, arr) => {
              const pillW = Math.min(126, Math.floor((width - 56) / arr.length));
              const totalW = arr.length * pillW + (arr.length - 1) * 8;
              const startX = -totalW / 2 + i * (pillW + 8);
              return `
              <g transform="translate(${startX}, 0)">
                <rect x="0" y="0" width="${pillW}" height="22" rx="11" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" stroke-opacity="0.7" />
                <g transform="translate(8, 4.5)">${item.icon}</g>
                <text x="24" y="14.5" class="font-ui" font-size="9.5" font-weight="600" fill="${theme.secondaryText}">${escapeXml(fitText(item.text, 10, pillW - 30))}</text>
              </g>`;
            })
            .join('')
    }
  </g>

  <!-- 4 Bento Metric Tiles -->
  <g transform="translate(22, 182)">
    ${stats
      .map((st, idx) =>
        renderBentoTile({
          x: idx * (colWidth + 8),
          y: 0,
          width: colWidth,
          height: 50,
          theme,
          idPrefix,
          rx: 8,
          children: `<g transform="translate(11, 15)">
            <g transform="translate(0, -8)">${st.icon}</g>
            <text x="17" y="0" class="stat-lbl">${st.label}</text>
            <text x="0" y="21" class="stat-val" font-size="15">${st.value}</text>
          </g>`,
        })
      )
      .join('')}
  </g>
</svg>`;
}

/**
 * 3. COMPACT VARIANT (Sleek 72px HUD Header Bar)
 */
export function renderV1CompactSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 72;
  const idPrefix = 'prof-compact';

  const chips = [
    { label: 'REPOS', value: formatCompactCount(p.repos), accent: theme.title },
    { label: 'FOLLOWERS', value: formatCompactCount(p.followers), accent: theme.accent || theme.title },
    { label: 'ACTIVE', value: `${p.accountAgeYears || 1}y`, accent: '#10b981' },
  ];

  const chipWidth = width <= 430 ? 60 : 68;
  const chipGap = 6;
  const chipsTotalWidth = chips.length * chipWidth + (chips.length - 1) * chipGap;
  const chipsStartX = width - chipsTotalWidth - 14;
  const textMaxWidth = Math.max(100, chipsStartX - 78);

  const maxNameW = Math.max(85, Math.floor(textMaxWidth * 0.62));
  const fittedNameRaw = fitText(p.name, 16, maxNameW);
  const fittedName = escapeXml(fittedNameRaw);
  const namePx = Math.round(measureText(fittedNameRaw, 16.5));
  const handleX = namePx + 8;
  const maxHandleW = Math.max(48, textMaxWidth - handleX);
  const fittedHandle = escapeXml(fitText(p.handle, 12, maxHandleW));
  const compactBio = p.rawBio || 'Software engineer & open-source builder on GitHub.';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-compact">
      <circle cx="36" cy="36" r="21" />
    </clipPath>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 15px; letter-spacing: -0.02em; fill: ${theme.title}; }
    .handle { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-size: 11px; font-weight: 500; fill: ${theme.accent || theme.secondaryText}; }
    .bio { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 10.5px; fill: ${theme.text}; opacity: 0.92; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 12)}
  ${renderAvatarRing(36, 36, 21, 'avatar-clip-compact', p.avatarDataUri, p.name.charAt(0).toUpperCase(), idPrefix)}

  <g transform="translate(70, 17)">
    <text x="0" y="13" class="name">${fittedName}</text>
    <text x="${handleX}" y="13" class="handle">${fittedHandle}</text>
    <text x="0" y="32" class="bio bio-text" fill="${theme.text}">${escapeXml(fitText(compactBio, 11, textMaxWidth))}</text>
  </g>

  <g transform="translate(${chipsStartX}, 15)">
    ${chips
      .map((ch, idx) =>
        renderBentoTile({
          x: idx * (chipWidth + chipGap),
          y: 0,
          width: chipWidth,
          height: 42,
          theme,
          idPrefix,
          rx: 7,
          accentColor: ch.accent,
          accentPosition: 'top',
          children: `<text x="${chipWidth / 2}" y="17" text-anchor="middle" class="stat-lbl" font-size="8">${ch.label}</text>
           <text x="${chipWidth / 2}" y="33" text-anchor="middle" class="stat-val" font-size="12.5">${ch.value}</text>`,
        })
      )
      .join('')}
  </g>
</svg>`;
}

/**
 * 4. SPLIT VARIANT (Executive Developer Résumé & Telemetry Bento)
 */
export function renderV1SplitSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 230;
  const idPrefix = 'prof-split';

  const sidebarWidth = width <= 450 ? 140 : 158;
  const rightWidth = width - sidebarWidth - 34;
  const effectiveBio = p.rawBio || 'Software engineer crafting systems and open-source tools.';
  const bioLines = wrapText(effectiveBio, 11, rightWidth - 24, 2);

  // Top 3 Language Legend Pills (with clean fallback when topLanguages is empty)
  const effectiveLangs = p.topLanguages.length > 0
    ? p.topLanguages.slice(0, 3)
    : [
        { name: 'JavaScript', color: '#f1e05a', percentage: 60 },
        { name: 'TypeScript', color: '#3178c6', percentage: 40 },
      ];
  let legX = 0;
  const legendItemsSvg = effectiveLangs
    .map((l) => {
      const labelStr = `${l.name} ${l.percentage}%`;
      const itemW = 10 + Math.ceil(measureText(labelStr, 9.5)) + 14;
      const curX = legX;
      legX += itemW;
      return `<g transform="translate(${curX}, 0)">
        <circle cx="3.5" cy="-3" r="3" fill="${l.color || theme.title}" />
        <text x="10" y="0" class="font-ui" font-size="9.5" font-weight="600" fill="${theme.title}">${escapeXml(l.name)} <tspan fill="${theme.secondaryText}" font-family="'JetBrains Mono', monospace">${l.percentage}%</tspan></text>
      </g>`;
    })
    .join('');

  const hasSidebarMeta = Boolean(p.company || p.location || p.website);
  const sidebarMetaSvg = hasSidebarMeta
    ? `
        ${p.company ? `<g transform="translate(0, 0)">${icons.company(theme.iconColor)} <text x="16" y="9">${escapeXml(fitText(p.company, 11, sidebarWidth - 36))}</text></g>` : ''}
        ${p.location ? `<g transform="translate(0, ${p.company ? 19 : 0})">${icons.location(theme.iconColor)} <text x="16" y="9">${escapeXml(fitText(p.location, 11, sidebarWidth - 36))}</text></g>` : ''}
        ${p.website ? `<g transform="translate(0, ${p.company && p.location ? 38 : (p.company || p.location ? 19 : 0)})">${icons.link(theme.iconColor)} <text x="16" y="9">${escapeXml(fitText(p.website.replace(/^https?:\/\//, ''), 11, sidebarWidth - 36))}</text></g>` : ''}
      `
    : `
        <g transform="translate(0, 0)">${icons.repo(theme.iconColor)} <text x="18" y="10">${formatCompactCount(p.repos)} Public Repos</text></g>
        <g transform="translate(0, 19)">${icons.star(theme.iconColor)} <text x="18" y="10">${formatCompactCount(p.stars)} Total Stars</text></g>
        <g transform="translate(0, 38)">${icons.followers(theme.iconColor)} <text x="18" y="10">${formatCompactCount(p.followers)} Followers</text></g>
      `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-split">
      <circle cx="${sidebarWidth / 2}" cy="44" r="26" />
    </clipPath>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 14.5px; fill: ${theme.title}; }
    .handle { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-size: 11px; font-weight: 500; fill: ${theme.accent || theme.secondaryText}; }
    .bio, .bio-text { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11px; fill: ${theme.text}; opacity: 0.92; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  <!-- Left Sidebar Bento Container -->
  ${renderBentoTile({
    x: 12,
    y: 12,
    width: sidebarWidth,
    height: height - 24,
    theme,
    idPrefix,
    rx: 10,
    children: `
      ${renderAvatarRing(sidebarWidth / 2, 44, 26, 'avatar-clip-split', p.avatarDataUri, p.name.charAt(0).toUpperCase(), idPrefix)}
      <g transform="translate(${sidebarWidth / 2}, 88)">
        <text x="0" y="0" text-anchor="middle" class="name">${escapeXml(fitText(p.name, 15, sidebarWidth - 20))}</text>
        <text x="0" y="16" text-anchor="middle" class="handle">${escapeXml(fitText(p.handle, 12, sidebarWidth - 20))}</text>
        <rect x="-42" y="24" width="84" height="18" rx="9" fill="${theme.badgeBg || theme.bg}" stroke="${theme.subtleBorder || theme.border}" stroke-width="1"/>
        <text x="0" y="36" text-anchor="middle" class="stat-lbl" font-size="8.5" fill="${theme.title}">SINCE ${p.createdAtYear || 2024}</text>
      </g>
      <g transform="translate(14, 146)" class="meta-text">
        ${sidebarMetaSvg}
      </g>
    `,
  })}

  <!-- Right Main Content -->
  <g transform="translate(${sidebarWidth + 22}, 12)">
    <!-- Tile 1: About / Bio -->
    ${renderBentoTile({
      x: 0,
      y: 0,
      width: rightWidth,
      height: 52,
      theme,
      idPrefix,
      rx: 8,
      children: `<text x="12" y="15" class="stat-lbl">ENGINEERING PROFILE // ABOUT</text>
       ${bioLines.map((l, idx) => `<text x="12" y="${30 + idx * 14}" class="bio-text" font-size="11" fill="${theme.text}"><tspan>${escapeXml(l)}</tspan></text>`).join('')}`,
    })}

    <!-- Tile 2: Status Pill -->
    ${renderBentoTile({
      x: 0,
      y: 56,
      width: rightWidth,
      height: 26,
      theme,
      idPrefix,
      rx: 7,
      children: `<circle cx="14" cy="13" r="3.5" fill="#10b981" class="pulse-dot" />
       <text x="24" y="17" class="bio" font-size="10.5" font-weight="600" fill="${theme.title}">
         ${escapeXml(fitText(p.status?.message || 'Crafting interactive web apps & reactive UI systems', 11, rightWidth - 36))}
       </text>`,
    })}

    <!-- Tile 3: Language Distribution with Legend -->
    ${renderBentoTile({
      x: 0,
      y: 86,
      width: rightWidth,
      height: 54,
      theme,
      idPrefix,
      rx: 8,
      children: `
        <text x="12" y="14" class="stat-lbl">LANGUAGE DISTRIBUTION</text>
        <g transform="translate(12, 21)">
          ${renderLanguageBar(effectiveLangs, rightWidth - 24, 6.5, theme)}
        </g>
        <g transform="translate(12, 43)">
          ${legendItemsSvg}
        </g>
      `,
    })}

    <!-- Tile 4: 12-Month Velocity -->
    ${renderBentoTile({
      x: 0,
      y: 144,
      width: rightWidth,
      height: 62,
      theme,
      idPrefix,
      rx: 8,
      children: `
        <text x="12" y="14" class="stat-lbl">12-MONTH ACTIVITY // VELOCITY</text>
        <text x="${rightWidth - 12}" y="14" text-anchor="end" class="font-mono" font-size="9.5" font-weight="700" fill="${theme.title}">${formatCompactCount(p.calendar.totalContributions)} <tspan fill="${theme.secondaryText}">contribs</tspan></text>
        <g transform="translate(12, 22)">
          ${renderCommitSparkline(
            p.monthlyContributions.slice(-8),
            rightWidth - 24,
            32,
            theme.title,
            theme.accent || theme.title
          )}
        </g>
      `,
    })}
  </g>
</svg>`;
}

/**
 * 5. ACTIVITY / DASHBOARD VARIANT (Contribution Cadence & Heatmap HUD)
 */
export function renderV1ActivitySvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const height = 250;
  const idPrefix = 'prof-activity';

  const contentWidth = width - 44;
  const colWidth = Math.floor((contentWidth - 24) / 4);

  const cal = p.calendar;
  const cadenceStats = [
    { label: colWidth < 96 ? 'STREAK' : 'ACTIVE STREAK', value: `${cal.currentStreak || 0}d`, dot: '#f97316' },
    { label: 'PEAK STREAK', value: `${cal.longestStreak || 0}d`, dot: '#eab308' },
    { label: 'BUSIEST DAY', value: fitText(cal.busiestWeekday || 'Wednesday', 13, colWidth - 18), dot: '#38bdf8' },
    { label: colWidth < 96 ? '30D VOLUME' : 'LAST 30 DAYS', value: formatCompactCount(cal.last30DaysCount || 0), dot: '#10b981' },
  ];

  const scaleColors = theme.heatmapLevels || ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
  const scaleX = contentWidth - 110;
  const scaleSvg = `
    <g transform="translate(${scaleX}, 7)">
      <text x="0" y="8" class="stat-lbl" font-size="8">Less</text>
      ${scaleColors.map((c, i) => `<rect x="${24 + i * 10}" y="1" width="7" height="7" rx="1.5" fill="${c}" />`).join('')}
      <text x="${24 + scaleColors.length * 10 + 4}" y="8" class="stat-lbl" font-size="8">More</text>
    </g>
  `;

  const availHeatmapW = contentWidth - 24;
  const cellGap = 1.5;
  const cellWidth = Math.max(4, Number(((availHeatmapW - 52 * cellGap) / 53).toFixed(2)));
  const headerTitle = escapeXml(fitText(`${p.name} // Contribution Matrix`, 16, contentWidth - 48));
  const headerSub = escapeXml(fitText(`${p.handle} · Joined ${p.createdAtYear || 2024}`, 12, contentWidth - 48));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <clipPath id="avatar-clip-activity">
      <circle cx="18" cy="18" r="16" />
    </clipPath>
    ${renderCardDefs(idPrefix, theme, theme.title, theme.accent)}
  </defs>
  <style>
    ${renderCardStyles(theme)}
    .name { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-weight: 800; font-size: 15px; letter-spacing: -0.02em; fill: ${theme.title}; }
    .handle { font-family: 'JetBrains Mono', 'SFMono-Regular', monospace; font-size: 11.5px; font-weight: 500; fill: ${theme.accent || theme.secondaryText}; }
    .bio { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; font-size: 11px; fill: ${theme.text}; opacity: 0.92; }
  </style>

  ${renderCardFrame(width, height, idPrefix, theme, 14)}

  <g transform="translate(22, 18)">
    <g transform="translate(0, 0)">
      ${renderAvatarRing(18, 18, 16, 'avatar-clip-activity', p.avatarDataUri, p.name.charAt(0).toUpperCase(), idPrefix)}
      <text x="44" y="15" class="name">${headerTitle}</text>
      <text x="44" y="31" class="handle">${headerSub}</text>
      ${p.bio ? `<text x="44" y="47" class="bio bio-text" font-size="11" fill="${theme.text}">${escapeXml(fitText(p.rawBio, 11.5, contentWidth - 48))}</text>` : ''}
    </g>

    <!-- Heatmap Bento Box with Header & Scale -->
    ${renderBentoTile({
      x: 0,
      y: p.bio ? 56 : 46,
      width: contentWidth,
      height: p.bio ? 96 : 106,
      theme,
      idPrefix,
      rx: 9,
      children: `
        <text x="12" y="15" class="stat-lbl">53-WEEK CONTRIBUTION CADENCE</text>
        ${scaleSvg}
        <g transform="translate(12, 24)">
          ${renderHeatmapMatrix({
            weeks: cal.weeks,
            x: 0,
            y: 0,
            cellWidth,
            cellGap,
            cols: 53,
            theme,
          })}
        </g>
      `,
    })}

    <!-- Bottom Cadence Bento Tiles -->
    <g transform="translate(0, 162)">
      ${cadenceStats
        .map((st, idx) =>
          renderBentoTile({
            x: idx * (colWidth + 8),
            y: 0,
            width: colWidth,
            height: 52,
            theme,
            idPrefix,
            rx: 8,
            children: `<g transform="translate(10, 16)">
              <circle cx="3.5" cy="-3" r="3" fill="${st.dot}" />
              <text x="10.5" y="0" class="stat-lbl streak" font-size="8.5">${st.label}</text>
              <text x="0" y="21" class="stat-val" font-size="14">${escapeXml(String(st.value))}</text>
            </g>`,
          })
        )
        .join('')}
    </g>
  </g>
</svg>`;
}

export const renderV1DashboardSvg = renderV1ActivitySvg;

function renderV0Svg(data, theme, options = {}) {
  return renderV1ClassicSvg(data, resolveTheme(theme, options), options);
}

export default profileCard;

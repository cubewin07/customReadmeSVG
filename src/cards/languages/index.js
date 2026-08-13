import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { normalizeLanguages } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';

export const languagesCard = {
  id: 'languages',
  title: 'Top Languages',
  aliases: ['lang', 'top-languages'],
  cacheTtlMs: 21600000, // 6 hours

  async fetchData(username, options = {}) {
    const data = await graphql(LANGUAGES_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:languages:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });

    const normalized = normalizeLanguages(data);
    if (!normalized || (!normalized.languages.length && !data?.user)) {
      throw new Error(`User "${username}" not found or has no repositories.`);
    }
    return normalized;
  },

  renderSvg(data, theme, options = {}) {
    const isV0 = options.version === 'v0';

    if (isV0) {
      return renderV0Svg(data, theme, options);
    }

    const layout = (options.layout || 'donut').toLowerCase();
    if (layout === 'polyglot' || layout === 'grid') {
      return renderPolyglotLayout(data, theme, options);
    }
    if (layout === 'compact') {
      return renderCompactLayout(data, theme, options);
    }
    if (layout === 'list') {
      return renderListLayout(data, theme, options);
    }
    return renderDonutLayout(data, theme, options);
  },
};

function formatBytes(bytes) {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Polyglot Layout: Specifically designed for developers who code in many languages.
 * Renders 3 columns of language pills with mini progress bars, supporting 10-16+ languages dynamically.
 */
function renderPolyglotLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '12', 10);
  const allLangs = data.languages || [];
  const totalLangsCount = data.totalLanguages || allLangs.length;
  const topLangs = allLangs.slice(0, count);
  const totalSize = data.totalSize || 0;

  const hiddenCount = Math.max(0, allLangs.length - topLangs.length);

  const rows = Math.ceil(topLangs.length / 3) || 1;
  const width = 495;
  const height = Math.max(210, 75 + rows * 36 + (hiddenCount > 0 ? 25 : 0));

  // Top multi-segment progress bar
  const barWidth = 447;
  let currentX = 0;
  const progressSegments = allLangs.map((lang, idx) => {
    const segWidth = totalSize > 0 ? (lang.size / totalSize) * barWidth : 0;
    const isFirst = idx === 0;
    const isLast = idx === allLangs.length - 1;
    const x = currentX;
    currentX += segWidth;

    if (segWidth <= 0) return '';
    return `<rect x="${x.toFixed(1)}" y="0" width="${Math.max(0.8, segWidth - 1).toFixed(1)}" height="8" fill="${lang.color}" ${isFirst ? 'rx="4"' : ''} ${isLast ? 'rx="4"' : ''} />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-poly-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 11px; fill: ${theme.text}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
    .more-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.secondaryText}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-poly-bg)" stroke="${theme.border}"/>

  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Polyglot Languages (${username})</text>
      <rect x="330" y="-14" width="117" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="388" y="0" text-anchor="middle" class="badge-text">⚡ ${totalLangsCount} Languages Used</text>
    </g>

    <!-- Header Progress Bar -->
    <g transform="translate(0, 14)">
      <rect x="0" y="0" width="${barWidth}" height="8" rx="4" fill="${theme.barBg}" />
      ${progressSegments}
    </g>

    <!-- 3-Column Polyglot Grid -->
    <g transform="translate(0, 36)">
      ${topLangs.map((lang, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = col * 152;
        const y = row * 34;
        const miniBarW = Math.max(4, Math.round((lang.percentage / 100) * 125));

        return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="143" height="28" rx="6" fill="${theme.cardBg}" stroke="${theme.subtleBorder || theme.border}" />
          <circle cx="10" cy="14" r="4" fill="${lang.color}" />
          <text x="20" y="14" class="lang-name">${escapeXml(lang.name.length > 10 ? lang.name.slice(0, 8) + '..' : lang.name)}</text>
          <text x="135" y="14" text-anchor="end" class="lang-perc">${lang.percentage}%</text>
          <rect x="20" y="20" width="115" height="3" rx="1.5" fill="${theme.barBg}" />
          <rect x="20" y="20" width="${miniBarW}" height="3" rx="1.5" fill="${lang.color}" />
        </g>`;
      }).join('')}
    </g>

    <!-- More Languages Footer -->
    ${hiddenCount > 0 ? `
      <g transform="translate(0, ${36 + rows * 34 + 8})">
        <text x="223" y="0" text-anchor="middle" class="more-text">+ ${hiddenCount} more languages in repositories (${formatBytes(totalSize)} total code)</text>
      </g>
    ` : ''}
  </g>
</svg>`;
}

function renderDonutLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const allLangs = data.languages || [];
  const totalLangsCount = data.totalLanguages || allLangs.length;
  const topLangs = allLangs.slice(0, count);
  const totalSize = data.totalSize || 0;

  const width = 495;
  const height = 215;

  const cx = 85;
  const cy = 80;
  const r = 46;
  const C = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  const donutSegments = topLangs.map((lang) => {
    const strokeLength = (lang.percentage / 100) * C;
    const strokeGap = C - strokeLength;
    const strokeOffset = C - (accumulatedPercent / 100) * C;
    accumulatedPercent += lang.percentage;

    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${lang.color}" stroke-width="15"
            stroke-dasharray="${strokeLength.toFixed(2)} ${strokeGap.toFixed(2)}"
            stroke-dashoffset="${strokeOffset.toFixed(2)}"
            transform="rotate(-90 ${cx} ${cy})" />`;
  }).join('');

  const topLangName = topLangs[0] ? escapeXml(topLangs[0].name) : '';
  const topLangPerc = topLangs[0] ? `${topLangs[0].percentage}%` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-donut-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .center-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 13px; fill: ${theme.title}; }
    .center-sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: ${theme.secondaryText}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-donut-bg)" stroke="${theme.border}"/>

  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Most Used Languages (${username})</text>
      <rect x="290" y="-14" width="157" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="368" y="0" text-anchor="middle" class="badge-text">⚡ ${totalLangsCount} Languages (${formatBytes(totalSize)})</text>
    </g>

    <!-- Donut Chart (Left Side) -->
    <g transform="translate(0, 20)">
      <!-- Donut Base Ring -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.barBg}" stroke-width="15" />
      
      <!-- Donut Segments -->
      ${donutSegments}
      
      <!-- Center Text -->
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="center-title">${topLangName}</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="center-sub">${topLangPerc}</text>
    </g>

    <!-- Language List Legend (Right Side) -->
    <g transform="translate(185, 28)">
      ${topLangs.map((lang, idx) => {
        const y = idx * 28;
        const miniBarW = Math.max(6, Math.round((lang.percentage / 100) * 130));
        return `
        <g transform="translate(0, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="16" y="9" class="lang-name">${escapeXml(lang.name)}</text>
          <text x="260" y="9" text-anchor="end" class="lang-perc">${lang.percentage}% <tspan fill="${theme.secondaryText}">(${formatBytes(lang.size)})</tspan></text>
          <rect x="16" y="14" width="244" height="4" rx="2" fill="${theme.barBg}" />
          <rect x="16" y="14" width="${miniBarW}" height="4" rx="2" fill="${lang.color}" />
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderListLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '5', 10);
  const allLangs = data.languages || [];
  const totalLangsCount = data.totalLanguages || allLangs.length;
  const topLangs = allLangs.slice(0, count);
  const totalSize = data.totalSize || 0;

  const width = 495;
  const height = 215;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-list-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 13px; fill: ${theme.text}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-list-bg)" stroke="${theme.border}"/>

  <g transform="translate(24, 22)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Most Used Languages (${username})</text>
      <rect x="290" y="-14" width="157" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="368" y="0" text-anchor="middle" class="badge-text">⚡ ${totalLangsCount} Languages (${formatBytes(totalSize)})</text>
    </g>

    <!-- Stacked Full Width Progress Bars -->
    <g transform="translate(0, 26)">
      ${topLangs.map((lang, idx) => {
        const y = idx * 30;
        const barW = Math.max(8, Math.round((lang.percentage / 100) * 447));
        return `
        <g transform="translate(0, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="16" y="9" class="lang-name">${escapeXml(lang.name)}</text>
          <text x="447" y="9" text-anchor="end" class="lang-perc">${lang.percentage}% <tspan fill="${theme.secondaryText}">(${formatBytes(lang.size)})</tspan></text>
          <rect x="0" y="14" width="447" height="6" rx="3" fill="${theme.barBg}" />
          <rect x="0" y="14" width="${barW}" height="6" rx="3" fill="${lang.color}" />
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderCompactLayout(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const count = parseInt(options.langs_count || options.count || '8', 10);
  const allLangs = data.languages || [];
  const totalLangsCount = data.totalLanguages || allLangs.length;
  const topLangs = allLangs.slice(0, count);
  const totalSize = data.totalSize || 0;

  const width = 495;
  const height = 220;
  const barWidth = 445;

  let currentX = 0;

  const progressSegments = topLangs.map((lang, idx) => {
    const segWidth = totalSize > 0 ? (lang.size / totalSize) * barWidth : 0;
    const isFirst = idx === 0;
    const isLast = idx === topLangs.length - 1;
    const x = currentX;
    currentX += segWidth;

    if (segWidth <= 0) return '';
    return `<rect x="${x.toFixed(1)}" y="0" width="${Math.max(1, segWidth - 1.5).toFixed(1)}" height="10" fill="${lang.color}" ${isFirst ? 'rx="4"' : ''} ${isLast ? 'rx="4"' : ''} />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="lang-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>
  </defs>
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 17px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 12px; fill: ${theme.text}; }
    .lang-perc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.secondaryText}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; font-size: 10px; fill: ${theme.title}; }
  </style>

  <!-- Background -->
  <rect x="0.5" y="0.5" rx="12" width="${width - 1}" height="${height - 1}" fill="url(#lang-gradient)" stroke="${theme.border}"/>
  
  <g transform="translate(25, 24)">
    <!-- Header -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" class="header">Most Used Languages (${username})</text>
      <rect x="330" y="-14" width="117" height="20" rx="10" fill="${theme.badgeBg}"/>
      <text x="388" y="0" text-anchor="middle" class="badge-text">${totalLangsCount} Languages Used</text>
    </g>
    
    <!-- Top Progress Bar -->
    <g transform="translate(0, 16)">
      <rect x="0" y="0" width="${barWidth}" height="10" rx="5" fill="${theme.barBg}" />
      ${progressSegments}
    </g>

    <!-- Language Grid -->
    <g transform="translate(0, 48)">
      ${topLangs.length === 0 ? `
        <text x="0" y="15" class="empty-msg">No language statistics found.</text>
      ` : topLangs.map((lang, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 230;
        const y = row * 32;
        const miniBarW = Math.max(4, Math.round((lang.percentage / 100) * 80));

        return `
        <g transform="translate(${x}, ${y})">
          <circle cx="6" cy="6" r="5" fill="${lang.color}" />
          <text x="18" y="10" class="lang-name">${escapeXml(lang.name)}</text>
          <text x="215" y="10" text-anchor="end" class="lang-perc">${lang.percentage}% <tspan fill="${theme.secondaryText}">(${formatBytes(lang.size)})</tspan></text>
          <rect x="18" y="16" width="197" height="4" rx="2" fill="${theme.barBg}" />
          <rect x="18" y="16" width="${miniBarW}" height="4" rx="2" fill="${lang.color}" />
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

function renderV0Svg(data, theme, options = {}) {
  const username = escapeXml(options.username || 'User');
  const topLangs = (data.languages || []).slice(0, 8);

  const barWidth = 350;
  let currentX = 0;

  const progressSegments = topLangs.map((lang, idx) => {
    const totalSize = data.totalSize || 0;
    const segWidth = totalSize > 0 ? (lang.size / totalSize) * barWidth : 0;
    const isFirst = idx === 0;
    const x = currentX;
    currentX += segWidth;

    if (segWidth <= 0) return '';
    return `<rect x="${x.toFixed(1)}" y="0" width="${segWidth.toFixed(1)}" height="8" fill="${lang.color}" ${isFirst ? 'rx="4"' : ''} />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="210" viewBox="0 0 400 210" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.text}; }
    .empty-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="209" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 28)">
    <text x="0" y="0" class="header">Most Used Languages (${username})</text>
    
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="${barWidth}" height="8" rx="4" fill="${theme.barBg}" />
      ${progressSegments}
    </g>

    <g transform="translate(0, 48)">
      ${topLangs.length === 0 ? `
        <text x="0" y="15" class="empty-msg">No language statistics found.</text>
      ` : topLangs.map((lang, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col * 175;
        const y = row * 24;
        return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="5" r="4.5" fill="${lang.color}" />
          <text x="18" y="9" class="lang-name">${escapeXml(lang.name)} <tspan fill="${theme.secondaryText}">(${lang.percentage}%)</tspan></text>
        </g>`;
      }).join('')}
    </g>
  </g>
</svg>`;
}

export default languagesCard;

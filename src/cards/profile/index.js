import axios from 'axios';
import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { normalizeProfile } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { resolveTheme } from '../../svg/theme.js';
import { resolveCardWidth } from '../../svg/layout.js';
import { wrapText } from '../../svg/text.js';
import {
  card,
  contributionGrid,
  fitMono,
  fitUi,
  formatCount,
  formatPercent,
  hairline,
  heatLegend,
  metaRow,
  metricRow,
  padX,
  shareStrip,
  text,
} from '../../svg/kit.js';

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

function deriveBusiestWeekday(days) {
  const totals = new Array(7).fill(0);
  days.forEach((day, idx) => {
    totals[day.weekday ?? idx % 7] += day.contributionCount || 0;
  });
  const peak = Math.max(...totals);
  if (peak <= 0) return '–';
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][totals.indexOf(peak)];
}

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
    busiestWeekday: data.calendar?.busiestWeekday || data.busiestWeekday || deriveBusiestWeekday(derivedDays),
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
    : [];

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

function renderAvatar({ cx, cy, r, clipId, uri, name, theme, ring = false }) {
  const initial = escapeXml(String(name || '?').charAt(0).toUpperCase());
  const halo = ring && theme.bg !== 'transparent'
    ? `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${theme.bg}" />`
    : '';
  const face = uri
    ? `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
       <image href="${uri}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${clipId})" />`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${theme.barBg}" />
       <text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" class="ink" font-weight="600" font-size="${Math.round(r)}">${initial}</text>`;
  return `${halo}${face}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.border}" />`;
}

function renderBioLines({ x, y, lines, theme, lineHeight = 17, size = 12.5 }) {
  if (!lines.length) return '';
  const spans = lines
    .map((line, i) => `<tspan x="${x}" y="${y + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  return `<text class="bio-text" fill="${theme.text}" font-size="${size}">${spans}</text>`;
}

function languageLegend({ x, y, width, languages }) {
  return metaRow({
    x,
    y,
    maxWidth: width,
    items: languages.map((l) => ({ text: `${l.name} ${formatPercent(l.percentage)}`, swatch: l.color })),
  });
}

function monthlyBars({ x, y, width, height, values, theme }) {
  const list = values.length ? values : [];
  const max = Math.max(1, ...list);
  const peak = list.indexOf(Math.max(...list));
  const gap = 3;
  const slotW = (width - gap * (list.length - 1)) / Math.max(1, list.length);
  const barW = Math.min(slotW, 12);
  const bars = list.map((v, i) => {
    const h = v > 0 ? Math.max(2, (v / max) * height) : 0;
    return h
      ? `<rect class="ci" x="${(x + i * (slotW + gap) + (slotW - barW) / 2).toFixed(1)}" y="${(y + height - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${theme.accent}" fill-opacity="${i === peak ? 1 : 0.45}" />`
      : '';
  }).join('');
  return `<g class="activity-bars">${bars}${hairline(x, y + height + 0.5, x + width, y + height + 0.5, theme)}</g>`;
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
 * 1. CLASSIC: identity block over a four-fact ledger.
 */
export function renderV1ClassicSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const inner = width - pad * 2;
  const textX = pad + 66;

  const hire = p.isHireable
    ? metaRow({ x: width - pad, y: 38, end: true, maxWidth: 130, items: [{ text: 'Available for hire', swatch: theme.accent, cls: 'ink' }] })
    : '';
  const nameRoom = inner - 66 - (p.isHireable ? 138 : 0);
  const bioLines = p.bio ? wrapText(p.bio, 12.5, inner - 72, 2) : [];
  const bioY = 76;
  const metaY = Math.max(92, bioY + bioLines.length * 17 + 6);
  const ruleY = metaY + 14;

  const topLang = p.topLanguages[0];
  const facts = [
    { label: 'Top language', value: topLang?.name || '–', font: 'ui', swatch: topLang?.color, flex: 1.15 },
    { label: 'Top repo', value: p.topRepo?.name || '–', font: 'ui', flex: 1.8 },
    { label: 'Followers', value: formatCount(p.followers), flex: 0.7 },
    { label: 'Stars', value: formatCount(p.stars), flex: 0.7 },
  ];
  const height = ruleY + 58;

  return card({
    width,
    height,
    title: `${p.name}, GitHub profile`,
    theme,
    body: `
      ${renderAvatar({ cx: pad + 26, cy: 48, r: 26, clipId: 'prof-classic-av', uri: p.avatarDataUri, name: p.name, theme })}
      ${text(textX, 38, fitUi(p.name, 19, nameRoom, 600), 'ink', 'font-size="19" font-weight="600"')}
      ${text(textX, 56, fitMono(p.handle, 12, inner - 66), 'mono mut', 'font-size="12"')}
      ${hire}
      ${renderBioLines({ x: textX, y: bioY, lines: bioLines, theme })}
      ${metaRow({ x: pad, y: metaY, maxWidth: inner, items: [
        { text: p.company },
        { text: p.location },
        { text: p.website.replace(/^https?:\/\//, '') },
        { text: p.createdAtYear ? `Joined ${p.createdAtYear}` : '' },
      ] })}
      ${hairline(pad, ruleY, width - pad, ruleY, theme)}
      ${metricRow({ x: pad, y: ruleY + 10, width: inner, items: facts, size: 14 })}
    `,
  });
}

/**
 * 2. HERO: the banner is the account's own contribution calendar.
 */
export function renderV1HeroSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const inner = width - pad * 2;

  const grid = contributionGrid({ x: 1, y: 1, weeks: p.calendar.weeks, weeksShown: 53, width: width - 2, gap: 2, theme });
  const bannerH = Math.round(grid.height);
  const faded = theme.bg !== 'transparent';

  const avatarR = 30;
  const avatarCy = bannerH + 8;
  const textX = pad + avatarR * 2 + 16;
  const bioLines = p.bio ? wrapText(p.bio, 12.5, inner - 6, 2) : [];
  const bioY = avatarCy + avatarR + 20;
  const metaY = bioY + bioLines.length * 17 + (bioLines.length ? 2 : -6);
  const orgs = p.organizations.map((o) => o.name || o.login).filter(Boolean).slice(0, 2);
  const stripY = metaY + 14;
  const langs = p.topLanguages.slice(0, 5);
  const legendY = stripY + 24;
  const ruleY = (langs.length ? legendY : stripY) + 12;
  const height = ruleY + 62;

  return card({
    width,
    height,
    title: `${p.name}, GitHub profile`,
    theme,
    defs: `
      <clipPath id="hero-banner-clip"><rect x="1" y="1" width="${width - 2}" height="${bannerH + 6}" rx="9" /></clipPath>
      ${faded ? `<linearGradient id="hero-banner-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.35" stop-color="${theme.bg}" stop-opacity="0" />
        <stop offset="1" stop-color="${theme.bg}" stop-opacity="0.92" />
      </linearGradient>` : ''}`,
    body: `
      <g clip-path="url(#hero-banner-clip)">
        ${grid.svg}
        ${faded ? `<rect x="1" y="1" width="${width - 2}" height="${bannerH + 2}" fill="url(#hero-banner-grad)" />` : ''}
      </g>
      ${renderAvatar({ cx: pad + avatarR, cy: avatarCy, r: avatarR, clipId: 'prof-hero-av', uri: p.avatarDataUri, name: p.name, theme, ring: true })}
      ${text(textX, avatarCy + 20, fitUi(p.name, 20, width - pad - textX, 600), 'ink', 'font-size="20" font-weight="600"')}
      ${text(textX, avatarCy + 37, fitMono(p.handle, 12, width - pad - textX), 'mono mut', 'font-size="12"')}
      ${renderBioLines({ x: pad, y: bioY, lines: bioLines, theme })}
      ${metaRow({ x: pad, y: metaY, maxWidth: inner, items: [
        { text: p.company },
        ...orgs.map((o) => ({ text: o })),
        { text: p.location },
      ] })}
      ${langs.length ? shareStrip({ x: pad, y: stripY, width: inner, items: langs, theme, className: 'language-strip' }) : ''}
      ${langs.length ? languageLegend({ x: pad, y: legendY, width: inner, languages: langs }) : ''}
      ${hairline(pad, ruleY, width - pad, ruleY, theme)}
      ${metricRow({ x: pad, y: ruleY + 10, width: inner, size: 17, items: [
        { label: 'Repositories', value: formatCount(p.repos) },
        { label: 'Stars', value: formatCount(p.stars) },
        { label: 'Followers', value: formatCount(p.followers) },
        { label: 'Following', value: formatCount(p.following) },
      ] })}
    `,
  });
}

/**
 * 3. COMPACT: one line of identity, three numbers.
 */
export function renderV1CompactSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width) - 2;
  const height = 72;

  const metricsW = width <= 440 ? 172 : 186;
  const metricsX = width - pad - metricsW;
  const textX = pad + 52;
  const room = metricsX - textX - 14;

  return card({
    width,
    height,
    title: `${p.name}, GitHub profile`,
    theme,
    body: `
      ${renderAvatar({ cx: pad + 20, cy: 36, r: 20, clipId: 'prof-compact-av', uri: p.avatarDataUri, name: p.name, theme })}
      ${text(textX, 33, fitUi(p.name, 15, room, 600), 'ink', 'font-size="15" font-weight="600"')}
      ${text(textX, 50, fitMono(p.handle, 11.5, room), 'mono mut', 'font-size="11.5"')}
      ${metricRow({ x: metricsX, y: 17, width: metricsW, gap: 8, size: 15, items: [
        { label: 'Repos', value: formatCount(p.repos), flex: 0.8 },
        { label: 'Followers', value: formatCount(p.followers), flex: 1.2 },
        { label: 'Active', value: p.accountAgeYears ? `${p.accountAgeYears}y` : '–', flex: 0.8 },
      ] })}
    `,
  });
}

/**
 * 4. SPLIT: identity sidebar beside about, languages and a year of activity.
 */
export function renderV1SplitSvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const sideW = width <= 440 ? 118 : width >= 700 ? 200 : 142;
  const ruleX = pad + sideW + 12;
  const mainX = ruleX + 16;
  const mainW = width - pad - mainX;

  const nameLines = wrapText(p.name, 15, sideW, 2);
  const nameEndY = 92 + (nameLines.length - 1) * 19;
  const sideFacts = [
    p.createdAtYear ? `Since ${p.createdAtYear}` : '',
    p.company,
    p.location,
    p.website.replace(/^https?:\/\//, ''),
  ].filter(Boolean);

  const bioLines = p.bio ? wrapText(p.bio, 12.5, mainW - 6, 3) : [];
  const statusMsg = p.status?.message ? fitUi(p.status.message, 11.5, mainW) : '';
  let y = 34;
  const aboutLabel = p.bio ? text(mainX, y, 'About', 'lbl') : '';
  const bioSvg = renderBioLines({ x: mainX, y: y + 18, lines: bioLines, theme });
  if (p.bio) y += 18 + bioLines.length * 17;
  const statusSvg = statusMsg ? text(mainX, y, statusMsg, 'mut', 'font-size="11.5"') : '';
  if (statusMsg) y += 18;

  const langs = p.topLanguages.slice(0, 4);
  let langSvg = '';
  if (langs.length) {
    y += 4;
    langSvg = `${text(mainX, y, 'Languages', 'lbl')}
      ${shareStrip({ x: mainX, y: y + 7, width: mainW, items: langs, theme, className: 'language-strip' })}
      ${languageLegend({ x: mainX, y: y + 31, width: mainW, languages: langs })}`;
    y += 54;
  }

  const hasActivity = p.monthlyContributions.some((v) => v > 0);
  const total = p.calendar.totalContributions;
  y += 2;
  const activitySvg = `${text(mainX, y, 'Activity', 'lbl')}
    ${text(width - pad, y, total ? `${formatCount(total)} this year` : 'No contributions yet', 'mono mut', 'font-size="11" text-anchor="end"')}
    ${hasActivity ? monthlyBars({ x: mainX, y: y + 8, width: mainW, height: 34, values: p.monthlyContributions, theme }) : ''}`;
  y += hasActivity ? 42 : 0;

  const sideY = nameEndY + 38;
  const sideEnd = sideY + sideFacts.length * 18;
  const height = Math.max(y + 20, sideEnd + 8, 180);

  return card({
    width,
    height,
    title: `${p.name}, GitHub profile`,
    theme,
    body: `
      ${renderAvatar({ cx: pad + 26, cy: 46, r: 26, clipId: 'prof-split-av', uri: p.avatarDataUri, name: p.name, theme })}
      ${nameLines.map((line, i) => text(pad, 92 + i * 19, line, 'ink', 'font-size="15" font-weight="600"')).join('')}
      ${text(pad, nameEndY + 17, fitMono(p.handle, 11.5, sideW), 'mono mut', 'font-size="11.5"')}
      ${sideFacts.map((fact, i) => text(pad, sideY + i * 18, fitUi(fact, 11.5, sideW), 'mut', 'font-size="11.5"')).join('')}
      ${hairline(ruleX, 18, ruleX, height - 18, theme)}
      ${aboutLabel}
      ${bioSvg}
      ${statusSvg}
      ${langSvg}
      ${activitySvg}
    `,
  });
}

/**
 * 5. ACTIVITY: a full year of contributions under a small identity line.
 */
export function renderV1ActivitySvg(data, theme, options = {}) {
  const p = extractProfileFields(data, options);
  const width = resolveCardWidth(options.width, 495);
  const pad = padX(width);
  const inner = width - pad * 2;
  const textX = pad + 50;

  const bioLine = p.bio ? fitUi(p.bio, 12.5, inner) : '';
  const gridY = bioLine ? 92 : 70;
  const grid = contributionGrid({ x: pad, y: gridY, weeks: p.calendar.weeks, weeksShown: 53, width: inner, gap: width <= 440 ? 1.5 : 2, theme, rx: 1.5 });
  const legendY = gridY + grid.height + 18;
  const ruleY = legendY + 10;
  const total = p.calendar.totalContributions;
  const subline = [p.handle, p.createdAtYear ? `joined ${p.createdAtYear}` : ''].filter(Boolean).join(' · ');

  return card({
    width,
    height: Math.round(ruleY + 58),
    title: `${p.name}, contribution activity`,
    theme,
    body: `
      ${renderAvatar({ cx: pad + 19, cy: 38, r: 19, clipId: 'prof-activity-av', uri: p.avatarDataUri, name: p.name, theme })}
      ${text(textX, 34, fitUi(p.name, 15, inner - 50, 600), 'ink', 'font-size="15" font-weight="600"')}
      ${text(textX, 51, fitMono(subline, 11.5, inner - 50), 'mono mut', 'font-size="11.5"')}
      ${renderBioLines({ x: pad, y: 76, lines: bioLine ? [bioLine] : [], theme })}
      ${grid.svg}
      ${text(pad, legendY, `${formatCount(total)} contributions this year`, 'lbl')}
      ${heatLegend({ right: width - pad, y: legendY, theme })}
      ${hairline(pad, ruleY, width - pad, ruleY, theme)}
      ${metricRow({ x: pad, y: ruleY + 10, width: inner, size: 14, items: [
        { label: 'Current streak', value: `${p.calendar.currentStreak}d` },
        { label: 'Longest streak', value: `${p.calendar.longestStreak}d` },
        { label: 'Busiest day', value: p.calendar.busiestWeekday, font: 'ui' },
        { label: 'Last 30 days', value: formatCount(p.calendar.last30DaysCount) },
      ] })}
    `,
  });
}

function renderV0Svg(data, theme, options = {}) {
  return renderV1ClassicSvg(data, resolveTheme(theme, options), options);
}

export default profileCard;

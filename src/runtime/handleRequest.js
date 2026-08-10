import '../cards/index.js';
import { resolveCard } from '../core/cards/registry.js';
import { getTheme } from '../svg/theme.js';
import { createCache } from '../core/cache/index.js';
import { escapeXml } from '../svg/escape.js';

const sharedCache = createCache({ kind: 'memory', ttlMs: 3600000 });

/**
 * Handle incoming SVG request for /:user or /:user/:card
 * @param {string} pathname - Request URL path
 * @param {object} [options]
 * @param {object} [options.query] - Parsed query params
 * @returns {Promise<{ status: number, headers: object, body: string } | null>}
 */
export async function handleRequest(pathname, options = {}) {
  const query = options.query || {};
  const cleanPath = pathname.split('?')[0];
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length === 0 || parts.length > 2) {
    return null;
  }

  const RESERVED_PATHS = new Set(['docs', 'playground', 'assets', 'src', 'public', 'node_modules', 'favicon.ico', 'api']);
  if (RESERVED_PATHS.has(parts[0].toLowerCase()) || parts[0].includes('.')) {
    return null;
  }

  const username = parts[0];
  const cardId = parts.length === 2 ? parts[1] : 'profile';

  const card = resolveCard(cardId);
  const theme = getTheme(query.theme);

  const headers = {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  };

  if (!card) {
    const errorBody = renderErrorSvg(theme, '404 Card Not Found', `No card plugin registered for "${cardId}".`);
    return { status: 404, headers, body: errorBody };
  }

  try {
    const cacheObj = (query.cache === '0' || query.cache === 'false') ? null : sharedCache;
    const cacheKey = `gh:${card.id}:${username}`;

    const data = await card.fetchData(username, {
      cache: cacheObj,
      cacheKey,
      ttlMs: card.cacheTtlMs,
      token: query.token,
    });

    const body = card.renderSvg(data, theme, { username });
    return { status: 200, headers, body };
  } catch (err) {
    const errorBody = renderErrorSvg(theme, '500 Server Error', err.message);
    return { status: 500, headers, body: errorBody };
  }
}

function renderErrorSvg(theme, title, message) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120" fill="none">
  <style>
    .err-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: #d73a49; }
    .err-msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 12px; fill: ${theme.secondaryText}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="399" height="119" fill="${theme.bg}" stroke="#d73a49"/>
  <g transform="translate(20, 35)">
    <text x="0" y="0" class="err-title">${escapeXml(title)}</text>
    <text x="0" y="25" class="err-msg">${escapeXml(message)}</text>
  </g>
</svg>`;
}

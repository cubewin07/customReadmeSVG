import axios from 'axios';

/**
 * Resolves GitHub Personal Access Token from options or environment variables.
 * @param {string} [tokenOverride]
 * @returns {string}
 */
export function getGithubToken(tokenOverride) {
  if (tokenOverride) return tokenOverride;
  const env = typeof globalThis.process !== 'undefined' ? globalThis.process.env : undefined;
  if (env) {
    if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN;
    if (env.VITE_GITHUB_TOKEN) return env.VITE_GITHUB_TOKEN;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_GITHUB_TOKEN) return import.meta.env.VITE_GITHUB_TOKEN;
    if (import.meta.env.GITHUB_TOKEN) return import.meta.env.GITHUB_TOKEN;
  }
  return '';
}

/**
 * Axios GraphQL client for GitHub API.
 * @param {string} query - GraphQL query string
 * @param {object} [variables] - Query variables
 * @param {object} [options]
 * @param {string} [options.token] - Optional explicit GitHub token
 * @param {object} [options.cache] - Cache instance with get/set methods
 * @param {string} [options.cacheKey] - Cache key to store/retrieve response
 * @param {number} [options.ttlMs] - Custom TTL for cache entry
 * @returns {Promise<object>} Parsed GraphQL data payload
 */
export async function graphql(query, variables = {}, options = {}) {
  const { token: customToken, cache, cacheKey, ttlMs } = options;

  if (cache && cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  const token = getGithubToken(customToken);
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'customReadmeSVG-App',
  };

  if (!token) {
    throw new Error('Set GITHUB_TOKEN or VITE_GITHUB_TOKEN (GitHub GraphQL API requires authentication).');
  }

  headers['Authorization'] = `Bearer ${token}`;

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query, variables },
    { headers, timeout: 10000 }
  );

  if (response.data.errors && response.data.errors.length > 0) {
    const errMessage = response.data.errors.map(e => e.message).join('; ');
    throw new Error(`GitHub GraphQL API Error: ${errMessage}`);
  }

  const data = response.data.data;

  if (cache && cacheKey && data) {
    cache.set(cacheKey, data, ttlMs);
  }

  return data;
}

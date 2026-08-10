/**
 * @typedef {object} CardPluginOptions
 * @property {object} [cache] - Cache instance
 * @property {string} [token] - GitHub token override
 * @property {string} [theme] - Theme name ('light' | 'dark')
 */

/**
 * @typedef {object} CardPlugin
 * @property {string} id - Unique card plugin identifier (e.g. 'profile', 'languages', 'repos', 'stats')
 * @property {string} title - Human readable title of the SVG card
 * @property {string[]} [aliases] - Optional alternative route names for this card
 * @property {number} [cacheTtlMs] - Recommended cache TTL in milliseconds (default: 3600000)
 * @property {(username: string, options?: CardPluginOptions) => Promise<object>} fetchData - Asynchronously fetches data required for rendering
 * @property {(data: object, theme: object, options?: object) => string} renderSvg - Synchronously renders the SVG card markup string
 */

export {};

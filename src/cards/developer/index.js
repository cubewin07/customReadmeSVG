import { graphql } from '../../core/github/client.js';
import { PROFILE_QUERY } from '../../core/github/queries.js';
import { normalizeProfile } from '../../core/github/normalize.js';
import { DEFAULT_DEVELOPER_PROFILE } from './data/defaultProfile.js';
import { renderInfoCards } from './components/infoCards.js';
import { renderWorkspaceScene } from './components/workspaceScene.js';
import { renderPixelCharacter } from './components/pixelCharacter.js';

export const developerCard = {
  id: 'developer',
  title: 'Developer Showcase',
  aliases: ['about', 'me', 'character'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    try {
      const data = await graphql(PROFILE_QUERY, { login: username }, {
        ...options,
        cacheKey: options.cacheKey || `gh:developer:${username}`,
        ttlMs: options.ttlMs || this.cacheTtlMs,
      });

      const normalized = normalizeProfile(data);
      if (normalized) {
        return {
          ...DEFAULT_DEVELOPER_PROFILE,
          ...normalized,
          stats: {
            repos: normalized.repositories,
            stars: normalized.totalStars,
            followers: normalized.followers,
          },
        };
      }
    } catch {
      // Graceful fallback to default profile on error or unauthenticated environment
    }

    return {
      ...DEFAULT_DEVELOPER_PROFILE,
      login: username || DEFAULT_DEVELOPER_PROFILE.login,
    };
  },

  renderSvg(data, theme, options = {}) {
    const width = 840;
    const height = 270;

    const accent = theme.accent || '#38bdf8';
    const titleColor = theme.title || '#58a6ff';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="dev-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="60%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.cardBg}" />
    </linearGradient>

    <!-- Top Accent Bar Gradient -->
    <linearGradient id="top-accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${titleColor}" />
      <stop offset="50%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${titleColor}" />
    </linearGradient>

    <!-- Name Header Gradient -->
    <linearGradient id="name-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${titleColor}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>

    <!-- Character Aura Radial Gradient -->
    <radialGradient id="char-aura-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${titleColor}" stop-opacity="0.35" />
      <stop offset="70%" stop-color="${accent}" stop-opacity="0.1" />
      <stop offset="100%" stop-color="${theme.bg}" stop-opacity="0" />
    </radialGradient>

    <!-- Front Monitor Clip Path -->
    <clipPath id="monitor-clip">
      <polygon points="-71, -26  71, -26  62, -2  -62, -2" />
    </clipPath>
  </defs>

  <!-- Card Background Container -->
  <rect x="0.5" y="0.5" rx="14" width="${width - 1}" height="${height - 1}" fill="url(#dev-card-bg)" stroke="${theme.border}" stroke-width="1" />
  
  <!-- Subtle Top Glowing Accent Line -->
  <rect x="1" y="1" width="${width - 2}" height="3.5" rx="2" fill="url(#top-accent-grad)" />

  <!-- Left Column: Info & About Me Cards -->
  ${renderInfoCards(data, theme, options)}

  <!-- Vertical Divider Between Columns -->
  <line x1="416" y1="24" x2="416" y2="246" stroke="${theme.subtleBorder || theme.border}" stroke-width="1" stroke-dasharray="3 4" opacity="0.65" />

  <!-- Right Column: Interactive Cyber Workspace Scene & Handcrafted Pixel Character -->
  ${renderWorkspaceScene(theme)}
  ${renderPixelCharacter(options.action)}
</svg>`;
  },
};

export default developerCard;

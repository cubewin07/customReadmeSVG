import { graphql } from '../../core/github/client.js';
import { DEVELOPER_QUERY } from '../../core/github/queries.js';
import { normalizeDeveloperData } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import { DEFAULT_DEVELOPER_PROFILE } from './data/defaultProfile.js';
import { tr, W, H, SX, SY } from './utils/timeline.js';
import { renderSharedDefs } from './components/sharedDefs.js';
import { renderInfoPanel } from './components/infoPanel.js';
import { renderSkyAtmosphere } from './components/skyAtmosphere.js';
import { renderActDesk } from './components/actDesk.js';
import { renderActRunner } from './components/actRunner.js';
import { renderActCity } from './components/actCity.js';
import { renderChapterTracker } from './components/chapterTracker.js';

export const developerCard = {
  id: 'developer',
  title: 'Developer Showcase',
  aliases: ['about', 'me', 'character'],
  cacheTtlMs: 3600000, // 1 hour

  async fetchData(username, options = {}) {
    try {
      const data = await graphql(DEVELOPER_QUERY, { login: username }, {
        ...options,
        cacheKey: options.cacheKey || `gh:developer:${username}`,
        ttlMs: options.ttlMs || this.cacheTtlMs,
      });

      const normalized = normalizeDeveloperData(data);
      if (normalized) {
        return {
          ...DEFAULT_DEVELOPER_PROFILE,
          ...normalized,
          name: options.name || normalized.name || DEFAULT_DEVELOPER_PROFILE.name,
          role: options.role || normalized.role || DEFAULT_DEVELOPER_PROFILE.role,
          status: options.status || normalized.status || DEFAULT_DEVELOPER_PROFILE.status,
          focus: options.bio ? [options.bio] : normalized.focus,
          streak: normalized.streak || DEFAULT_DEVELOPER_PROFILE.streak,
          counts: normalized.counts && normalized.counts.length >= 49 ? normalized.counts : DEFAULT_DEVELOPER_PROFILE.counts,
        };
      }
    } catch {
      // Graceful fallback to default developer profile on unauthenticated/offline environments
    }

    return {
      ...DEFAULT_DEVELOPER_PROFILE,
      name: options.name || (username && username !== DEFAULT_DEVELOPER_PROFILE.login ? username : DEFAULT_DEVELOPER_PROFILE.name),
      login: username || DEFAULT_DEVELOPER_PROFILE.login,
      handle: username ? `@${username}` : DEFAULT_DEVELOPER_PROFILE.handle,
      role: options.role || DEFAULT_DEVELOPER_PROFILE.role,
      status: options.status || DEFAULT_DEVELOPER_PROFILE.status,
      focus: options.bio ? [options.bio] : DEFAULT_DEVELOPER_PROFILE.focus,
    };
  },

  renderSvg(data, theme, options = {}) {
    const profile = {
      ...DEFAULT_DEVELOPER_PROFILE,
      ...data,
      name: options.name || data?.name || (options.username && options.username !== DEFAULT_DEVELOPER_PROFILE.login ? options.username : DEFAULT_DEVELOPER_PROFILE.name),
      handle: data?.handle || (options.username ? `@${options.username}` : DEFAULT_DEVELOPER_PROFILE.handle),
      role: options.role || data?.role || DEFAULT_DEVELOPER_PROFILE.role,
      joinedYear: data?.joinedYear || (data?.createdAt ? new Date(data.createdAt).getFullYear() : DEFAULT_DEVELOPER_PROFILE.joinedYear),
      customStatus: options.status || null,
      focus: options.bio ? [options.bio] : (data?.focus || DEFAULT_DEVELOPER_PROFILE.focus),
    };

    const cardBg = theme.bg || '#12161d';
    const borderColor = theme.border || '#2a313c';
    const name = escapeXml(profile.name || 'Le Tan Thang');
    const role = escapeXml(profile.role || 'Full-Stack Engineer & Creative Coder');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ttl dsc">
  <title id="ttl">${name} - developer card</title>
  <desc id="dsc">${name}, ${role}. Animated scene: shipping code, pinned repos, a runner on the contribution graph and a voxel city built from commits.</desc>

  ${renderSharedDefs(theme)}

  <g clip-path="url(#card)">
    <!-- Main Card Body Background -->
    <rect width="${W}" height="${H}" fill="${cardBg}"/>

    <!-- Top Glow Accent Bar -->
    <rect width="${W}" height="4" fill="url(#barGrad)"/>

    <!-- Light Shimmer Beam Across Top Bar -->
    <rect y="0" width="200" height="4" fill="url(#shimGrad)">
      ${tr([[0, -200, 0], [0.4, -200, 0], [2.6, 1150, 0]])}
    </rect>

    <!-- Left Column: Identity, Status, Focus, Arsenal, and Mechanical Rolling Stats -->
    ${renderInfoPanel(profile, theme)}

    <!-- Right Column: 24s Master Timeline Cyber World -->
    <g transform="translate(${SX},${SY})" clip-path="url(#scene)">
      <!-- Always-on Day/Night Sky & Celestial Paths -->
      ${renderSkyAtmosphere(profile.streak)}

      <!-- Act 1 (0s - 12s): Workstation Desk, Ship-it Story & Hologram Pinned Repos -->
      ${renderActDesk(profile, theme)}

      <!-- Act 2 (12s - 18s): Platformer Runner on Real Contribution Terrain -->
      ${renderActRunner(profile.counts)}

      <!-- Act 3 (18s - 24s): 3D Isometric Voxel City Built from Commits -->
      ${renderActCity(profile.counts)}

      <!-- Unified 3-Act Chapter Tracker HUD (3 pips + progress bar + fact per act) -->
      ${renderChapterTracker(profile, theme)}
    </g>
  </g>

  <!-- Outer Card Bezel Stroke -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="17.5" fill="none" stroke="${borderColor}"/>
</svg>`;
  },
};

export default developerCard;

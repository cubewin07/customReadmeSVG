import { anim, pulse } from '../utils/timeline.js';

/**
 * Renders the unified 3-act Chapter Tracker HUD at the top of the scene (24s timeline).
 * 3 pips + progress bar + one clear fact per act in large, crisp typography:
 * - ACT 01 // SHIP • LATEST COMMIT & PINNED REPOS (0s - 12s)
 * - ACT 02 // RUN • STREAK & CONTRIBUTION PLATFORMER (12s - 18s)
 * - ACT 03 // BUILD • 7-WEEK VOXEL CITY (18s - 24s)
 *
 * @param {object} profile - Normalized profile data
 * @param {object} theme - Active theme
 * @returns {string} SVG markup
 */
export function renderChapterTracker(profile, theme = {}) {
  const accent = theme.accent || '#58a6ff';
  const streak = profile.streak || 14;
  const counts = profile.counts || [];
  let totalCommits = 0;
  for (let i = 0; i < 49 && i < counts.length; i++) {
    totalCommits += (counts[i] || 0);
  }
  if (totalCommits === 0) totalCommits = 142;

  return `<!-- ============================= UNIFIED CHAPTER TRACKER HUD ============================= -->
  <g transform="translate(20, 16)">
    <!-- HUD Background Glass Capsule -->
    <rect x="0" y="0" width="484" height="28" rx="8" fill="#090e17" fill-opacity="0.92" stroke="#253347" stroke-width="1.2"/>
    <line x1="2" y1="1" x2="482" y2="1" stroke="#fff" stroke-opacity="0.2"/>

    <!-- Progress Track & Pips -->
    <g transform="translate(14, 14)">
      <!-- Track Background Line -->
      <line x1="0" y1="0" x2="48" y2="0" stroke="#1d283a" stroke-width="3" stroke-linecap="round"/>
      <!-- Active Progress Bar Fill -->
      <line x1="0" y1="0" x2="48" y2="0" stroke="${accent}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="48" stroke-dashoffset="48">
        ${anim('stroke-dashoffset', [[0, 48], [11.9, 48], [12.1, 24], [17.9, 24], [18.1, 0], [24, 0]])}
      </line>

      <!-- Pip 1: Act 1 (0s-12s) -->
      <circle cx="0" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="0" cy="0" r="2" fill="${accent}">
        ${anim('opacity', [[0, 1], [11.9, 1], [12.1, 0.3], [24, 0.3]])}
      </circle>

      <!-- Pip 2: Act 2 (12s-18s) -->
      <circle cx="24" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="24" cy="0" r="2" fill="${accent}" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [12, 0.3], [12.2, 1], [17.9, 1], [18.1, 0.3], [24, 0.3]])}
      </circle>

      <!-- Pip 3: Act 3 (18s-24s) -->
      <circle cx="48" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="48" cy="0" r="2" fill="${accent}" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [18, 0.3], [18.2, 1], [23.9, 1], [24, 0.3]])}
      </circle>
    </g>

    <!-- Chapter Title & One Fact Per Act -->
    <!-- Act 1 Caption (0s - 12s) -->
    <g opacity="1">
      ${anim('opacity', [[0, 1], [11.8, 1], [12.2, 0], [24, 0]])}
      <text class="m" x="78" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="${accent}">ACT 01 // SHIP</tspan> • LATEST COMMIT &amp; PINNED REPOS
      </text>
    </g>

    <!-- Act 2 Caption (12s - 18s) -->
    <g opacity="0">
      ${anim('opacity', pulse(12.0, 17.8, 0.2))}
      <text class="m" x="78" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="#34d399">ACT 02 // RUN</tspan> • ${streak}-DAY STREAK PLATFORMER
      </text>
    </g>

    <!-- Act 3 Caption (18s - 24s) -->
    <g opacity="0">
      ${anim('opacity', [[0, 0], [17.8, 0], [18.2, 1], [23.8, 1], [24, 0]])}
      <text class="m" x="78" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="#a78bfa">ACT 03 // BUILD</tspan> • 7-WEEK VOXEL CITY (${totalCommits} COMMITS)
      </text>
    </g>
  </g>`;
}

import { anim, pulse, sl, sla } from '../utils/timeline.js';

/**
 * Renders the unified 5-act Chapter Tracker HUD at the top of the scene (36s timeline).
 * 5 pips + progress bar + one clear fact per act in large, crisp typography:
 * - ACT 01 // SHIP • LATEST COMMIT & REPOS (0s - 12s)
 * - ACT 02 // RUN • STREAK & CONTRIBUTION PLATFORMER (12s - 18s)
 * - ACT 03 // BUILD • 7-WEEK VOXEL CITY (18s - 24s)
 * - ACT 04 // ORBIT • LANGUAGE UNIVERSE (24s - 29.4s)
 * - ACT 05 // SIGN-OFF • CONTINUE? COUNTDOWN (29.4s - 32.6s)
 *
 * @param {object} profile - Normalized profile data
 * @param {object} theme - Active theme
 * @returns {string} SVG markup
 */
export function renderChapterTracker(profile, theme = {}) {
  const accent = theme.accent || '#58a6ff';
  const streak = profile.streak ?? 0;
  const counts = profile.counts || [];
  let totalCommits = 0;
  for (let i = 0; i < 49 && i < counts.length; i++) {
    totalCommits += (counts[i] || 0);
  }

  return `<!-- ============================= UNIFIED CHAPTER TRACKER HUD ============================= -->
  <g transform="translate(20, 16)">
    <!-- HUD Background Glass Capsule -->
    <rect x="0" y="0" width="484" height="28" rx="8" fill="#090e17" fill-opacity="0.92" stroke="#253347" stroke-width="1.2"/>
    <line x1="2" y1="1" x2="482" y2="1" stroke="#fff" stroke-opacity="0.2"/>

    <!-- Progress Track & 5 Pips -->
    <g transform="translate(14, 14)">
      <!-- Track Background Line -->
      <line x1="0" y1="0" x2="64" y2="0" stroke="#1d283a" stroke-width="3" stroke-linecap="round"/>
      <!-- Active Progress Bar Fill across all 5 acts -->
      <line x1="0" y1="0" x2="64" y2="0" stroke="${accent}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="64" stroke-dashoffset="64">
        ${anim('stroke-dashoffset', [[0, 64], [11.9, 64], [12.1, 48], [17.9, 48], [18.1, 32], [23.9, 32], [24.1, 16], [29.2, 16], [29.5, 0], [32.6, 0]])}
      </line>

      <!-- Pip 1: Act 1 (0s-12s) -->
      <circle cx="0" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="0" cy="0" r="2" fill="${accent}">
        ${anim('opacity', [[0, 1], [11.9, 1], [12.1, 0.3], [32.6, 0.3]])}
      </circle>

      <!-- Pip 2: Act 2 (12s-18s) -->
      <circle cx="16" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="16" cy="0" r="2" fill="${accent}" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [12, 0.3], [12.2, 1], [17.9, 1], [18.1, 0.3], [32.6, 0.3]])}
      </circle>

      <!-- Pip 3: Act 3 (18s-24s) -->
      <circle cx="32" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="32" cy="0" r="2" fill="${accent}" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [18, 0.3], [18.2, 1], [23.9, 1], [24.1, 0.3], [32.6, 0.3]])}
      </circle>

      <!-- Pip 4: Act 4 (24s-29.4s) -->
      <circle cx="48" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="48" cy="0" r="2" fill="${accent}" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [24, 0.3], [24.2, 1], [29.2, 1], [29.4, 0.3], [32.6, 0.3]])}
      </circle>

      <!-- Pip 5: Act 5 (29.4s-32.6s) -->
      <circle cx="64" cy="0" r="3.5" fill="#182333" stroke="${accent}" stroke-width="1.2"/>
      <circle cx="64" cy="0" r="2" fill="${accent}" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [29.4, 0.3], [29.6, 1], [32.6, 1]])}
      </circle>
    </g>

    <!-- Chapter Title & One Fact Per Act -->
    <!-- Act 1 Caption (0s - 12s) -->
    <g opacity="1">
      ${anim('opacity', [[0, 1], [11.8, 1], [12.2, 0], [24, 0]])}
      <text class="m" x="92" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="${accent}">ACT 01 // SHIP</tspan> • LATEST COMMIT &amp; REPOS
      </text>
    </g>

    <!-- Act 2 Caption (12s - 18s) -->
    <g opacity="0">
      ${anim('opacity', pulse(12.0, 17.8, 0.2))}
      <text class="m" x="92" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="#34d399">ACT 02 // RUN</tspan> • ${streak}-DAY STREAK PLATFORMER
      </text>
    </g>

    <!-- Act 3 Caption (18s - 24s) -->
    <g opacity="0">
      ${anim('opacity', pulse(18.0, 23.8, 0.2))}
      <text class="m" x="92" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="#a78bfa">ACT 03 // BUILD</tspan> • 7-WK VOXEL CITY (${totalCommits}C)
      </text>
    </g>

    <!-- Act 4 Caption (24s - 29.4s) -->
    <g opacity="0">
      ${anim('opacity', pulse(24.0, 29.2, 0.2))}
      <text class="m" x="92" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="#38bdf8">ACT 04 // ORBIT</tspan> • LANGUAGE UNIVERSE
      </text>
    </g>

    <!-- Outro Caption (29.4s - 32.6s) -->
    <g opacity="0">
      ${anim('opacity', [[0, 0], [29.2, 0], [29.5, 1], [32.6, 1]])}
      <text class="m" x="92" y="18" font-size="10.5" font-weight="800" letter-spacing="0.6" fill="#e6edf3">
        <tspan fill="#ff7b72">ACT 05 // SIGN-OFF</tspan> • CONTINUE? COUNTDOWN
      </text>
    </g>

    <!-- HUD Streak Flame Badge (Right Side, Inside HUD) -->
    <g transform="translate(470, 14)">
      <g transform="translate(0, 0)">
        ${sl('scale', ['1 1', '1.07 .93', '.95 1.06', '1 1'], 0.9)}
        <!-- Outer Flame -->
        <path d="M0 -9 C2.2 -5.5 6.5 -2.8 5.8 2.1 C5.1 6.3 1.5 8.4 0 8.4 C-2.1 8.4 -5.6 6.3 -5.6 2.1 C-5.6 -1.4 -2.8 -2.8 -2.1 -6.3 C-0.7 -4.9 0 -7 0 -9Z" fill="#ff8a3d"/>
        <!-- Inner Flame Core -->
        <path d="M0 -2.1 C1.4 0 3.5 1.4 2.8 4.2 C2.1 6.3 0.7 7 0 7 C-1.4 7 -2.8 6.3 -2.8 4.2 C-2.8 2.1 -0.7 1.4 0 -2.1Z" fill="#ffd76a"/>
      </g>
      <!-- Floating Embers -->
      <circle cx="0" cy="-10" r="0.8" fill="#ffd76a">
        ${sl('translate', ['0 0', '1.5 -7'], 1.6)}
        ${sla('opacity', ['1', '0'], 1.6)}
      </circle>
      <circle cx="-2" cy="-9" r="0.6" fill="#ff8a3d">
        ${sl('translate', ['0 0', '-2 -6'], 1.4, 0.4)}
        ${sla('opacity', ['1', '0'], 1.4, 0.4)}
      </circle>
      <text class="t" x="-10" y="3.5" font-size="10.5" font-weight="700" fill="#ffb86b" text-anchor="end">${streak}-day streak</text>
    </g>
  </g>`;
}

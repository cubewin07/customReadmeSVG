import { anim, nightPairs, sl, sla, SW, SH } from '../utils/timeline.js';

const SKY_COLORS = [
  [0, '#0a0e17'],    // Midnight deep blue/black
  [3.6, '#2a3350'],  // Dawn awakening
  [8.4, '#1c3a5e'],  // Midday vibrant sky
  [13.2, '#1c3a5e'], // Afternoon
  [16.8, '#3a2b4d'], // Sunset dusk violet
  [20.4, '#0a0e17'], // Nightfall
];

// 20 deterministic stars with seeded positions and durations
const STAR_DATA = [
  { x: 38, y: 32, r: 1.2, dur: 2.3, delay: 0.4 },
  { x: 88, y: 74, r: 0.9, dur: 3.1, delay: 1.2 },
  { x: 142, y: 28, r: 1.4, dur: 2.1, delay: 0.7 },
  { x: 195, y: 92, r: 0.8, dur: 3.6, delay: 2.1 },
  { x: 236, y: 44, r: 1.1, dur: 2.7, delay: 0.1 },
  { x: 282, y: 112, r: 1.3, dur: 3.4, delay: 1.5 },
  { x: 324, y: 36, r: 0.9, dur: 2.5, delay: 0.9 },
  { x: 376, y: 68, r: 1.5, dur: 2.9, delay: 2.4 },
  { x: 418, y: 24, r: 1.1, dur: 3.2, delay: 0.3 },
  { x: 462, y: 84, r: 0.8, dur: 2.2, delay: 1.7 },
  { x: 512, y: 48, r: 1.4, dur: 3.8, delay: 1.1 },
  { x: 554, y: 96, r: 1.0, dur: 2.6, delay: 0.6 },
  { x: 64, y: 138, r: 1.2, dur: 3.3, delay: 2.0 },
  { x: 120, y: 162, r: 0.8, dur: 2.4, delay: 0.8 },
  { x: 182, y: 144, r: 1.1, dur: 3.5, delay: 1.3 },
  { x: 310, y: 156, r: 1.3, dur: 2.8, delay: 0.2 },
  { x: 446, y: 132, r: 0.9, dur: 3.0, delay: 1.9 },
  { x: 498, y: 164, r: 1.2, dur: 2.7, delay: 0.5 },
  { x: 260, y: 22, r: 1.5, dur: 3.7, delay: 1.4 },
  { x: 532, y: 18, r: 0.9, dur: 2.2, delay: 1.0 },
];

/**
 * Renders the always-on sky environment:
 * - 24s Day/Night atmospheric transition
 * - Celestial Sun and Moon orbital arcs
 * - Twinkling night stars
 * - Ambient cyber grid
 * - Streak Flame HUD badge
 */
export function renderSkyAtmosphere(streak = 14) {
  let starsSvg = '';
  for (const s of STAR_DATA) {
    starsSvg += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#dfe7f5">
      ${sla('opacity', ['.25', '1', '.25'], s.dur, s.delay)}
    </circle>`;
  }

  return `<!-- ============================= SKY & ATMOSPHERE ============================= -->
  <!-- Dynamic Day/Night Sky -->
  <rect width="${SW}" height="${SH}" fill="#0a0e17">
    ${anim('fill', SKY_COLORS)}
  </rect>

  <!-- Twinkling Night Stars -->
  <g>
    ${anim('opacity', nightPairs())}
    ${starsSvg}
  </g>

  <!-- Cyber Matrix Backdrop Grid -->
  <g stroke="#fff" stroke-opacity="0.05" stroke-dasharray="3 5">
    <path d="M0 90H${SW}M0 150H${SW}M0 210H${SW}M110 0V300M230 0V300M350 0V300M470 0V300"/>
  </g>

  <!-- Celestial Sun Orbit -->
  <g>
    ${anim('opacity', [[0, 0], [2.4, 0], [3.6, 1], [15.6, 1], [17, 0]])}
    <animateMotion dur="24s" repeatCount="indefinite" path="M40 240 Q292 -110 544 240" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.1;0.7;1"/>
    <!-- Sun Ambient Glow -->
    <circle r="30" fill="#ffd76a" opacity="0.14"/>
    <!-- Sun Core -->
    <circle r="12" fill="#ffd76a"/>
  </g>

  <!-- Celestial Crescent Moon Orbit -->
  <g>
    ${anim('opacity', [[0, 0], [16.3, 0], [17.5, 1], [22.2, 1], [23.3, 0]])}
    <animateMotion dur="24s" repeatCount="indefinite" path="M60 230 Q292 -100 524 230" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.68;0.97;1"/>
    <!-- Moon Ambient Glow -->
    <circle r="22" fill="#9db7e8" opacity="0.1"/>
    <!-- Crescent Moon Silhouette -->
    <path d="M0 -10 A10 10 0 1 0 0 10 A7 7 0 1 1 0 -10Z" fill="#dfe7f5"/>
  </g>

  <!-- HUD: Streak Flame Badge -->
  <g transform="translate(486,26)">
    <g>
      ${sl('scale', ['1 1', '1.07 .93', '.95 1.06', '1 1'], 0.9)}
      <!-- Outer Flame -->
      <path d="M0 -13 C3 -8 9 -4 8 3 C7 9 2 12 0 12 C-3 12 -8 9 -8 3 C-8 -2 -4 -4 -3 -9 C-1 -7 0 -10 0 -13Z" fill="#ff8a3d"/>
      <!-- Inner Flame Core -->
      <path d="M0 -3 C2 0 5 2 4 6 C3 9 1 10 0 10 C-2 10 -4 9 -4 6 C-4 3 -1 2 0 -3Z" fill="#ffd76a"/>
    </g>
    <text class="t" x="14" y="4" font-size="12" font-weight="700" fill="#ffb86b">${streak}-day streak</text>
  </g>`;
}

import {
  anim,
  tr,
  nightPairs,
  sl,
  sla,
  SW,
  SH,
} from '../utils/timeline.js';

const SKY_COLORS = [
  [0, '#0a0e17'],    // Midnight deep space
  [3.6, '#2a3350'],  // Dawn violet/peach awakening
  [8.4, '#1c3a5e'],  // Midday vibrant cyber sky
  [13.2, '#1c3a5e'], // Afternoon
  [16.8, '#3a2b4d'], // Sunset dusk magenta/crimson
  [20.4, '#0a0e17'], // Deep nightfall
];

// 14 deterministic stars with seeded positions and durations
const STAR_DATA = [
  { x: 38, y: 32, r: 1.2, dur: 2.3, delay: 0.4 },
  { x: 88, y: 74, r: 0.9, dur: 3.1, delay: 1.2 },
  { x: 142, y: 28, r: 1.4, dur: 2.1, delay: 0.7 },
  { x: 195, y: 92, r: 0.8, dur: 3.6, delay: 2.1 },
  { x: 260, y: 22, r: 1.5, dur: 3.7, delay: 1.4 },
  { x: 324, y: 36, r: 0.9, dur: 2.5, delay: 0.9 },
  { x: 376, y: 68, r: 1.5, dur: 2.9, delay: 2.4 },
  { x: 418, y: 24, r: 1.1, dur: 3.2, delay: 0.3 },
  { x: 462, y: 84, r: 0.8, dur: 2.2, delay: 1.7 },
  { x: 512, y: 48, r: 1.4, dur: 3.8, delay: 1.1 },
  { x: 554, y: 96, r: 1.0, dur: 2.6, delay: 0.6 },
  { x: 120, y: 162, r: 0.8, dur: 2.4, delay: 0.8 },
  { x: 310, y: 156, r: 1.3, dur: 2.8, delay: 0.2 },
  { x: 498, y: 164, r: 1.2, dur: 2.7, delay: 0.5 },
];

/**
 * Renders the always-on sky environment:
 * - 24s Day/Night atmospheric transition with sun rays and moon craters
 * - Drifting daytime clouds and nocturnal shooting star / satellite
 * - Twinkling night stars
 * - Volumetric dust motes in desk lamp beam
 * - Streak Flame HUD badge with rising ember sparks
 */
export function renderSkyAtmosphere() {
  let g1 = '';
  let g2 = '';
  for (let i = 0; i < STAR_DATA.length; i++) {
    const s = STAR_DATA[i];
    const circle = `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#dfe7f5"/>`;
    if (i % 2 === 0) g1 += circle;
    else g2 += circle;
  }
  const starsSvg = `<g opacity="0.3">${sla('opacity', ['.25', '1', '.25'], 2.4)}${g1}</g>`
    + `<g opacity="0.4">${sla('opacity', ['.3', '1', '.3'], 3.1, 1.2)}${g2}</g>`;

  return `<!-- ============================= SKY & ATMOSPHERE ============================= -->
  <!-- Dynamic Day/Night Sky -->
  <rect width="${SW}" height="${SH}" fill="#0a0e17">
    ${anim('fill', SKY_COLORS)}
  </rect>

  <!-- Twinkling Night Stars -->
  <g>
    ${anim('opacity', nightPairs())}
    ${starsSvg}

    <!-- Shooting Star / Satellite Streak (Active at 21.0s - 22.5s) -->
    <g opacity="0">
      ${anim('opacity', [[20.9, 0], [21.0, 1], [22.2, 1], [22.5, 0]])}
      ${tr([[21.0, 520, 20], [22.4, 240, 140]])}
      <line x1="0" y1="0" x2="36" y2="-18" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="60" y2="-30" stroke="#4fd1ff" stroke-width="1" stroke-opacity="0.4" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="2" fill="#fff"/>
    </g>
  </g>

  <!-- Drifting Pixel Clouds (Active during Daytime 3.6s - 15.6s) -->
  <g opacity="0">
    ${anim('opacity', [[0, 0], [3.2, 0], [4.2, 0.45], [14.8, 0.45], [15.8, 0]])}
    <!-- Cloud 1 -->
    <g>
      ${sl('translate', ['0 0', '-280 0'], 14)}
      <g transform="translate(480,45)">
        <rect x="0" y="0" width="48" height="12" rx="6" fill="#fff" opacity="0.3"/>
        <rect x="8" y="-6" width="28" height="10" rx="5" fill="#fff" opacity="0.4"/>
      </g>
    </g>
    <!-- Cloud 2 -->
    <g>
      ${sl('translate', ['0 0', '-340 0'], 18, 3)}
      <g transform="translate(540,85)">
        <rect x="0" y="0" width="56" height="14" rx="7" fill="#fff" opacity="0.25"/>
        <rect x="12" y="-7" width="32" height="12" rx="6" fill="#fff" opacity="0.35"/>
      </g>
    </g>
  </g>

  <!-- Cyber Matrix Backdrop Grid -->
  <g stroke="#fff" stroke-opacity="0.05" stroke-dasharray="3 5">
    <path d="M0 90H${SW}M0 150H${SW}M0 210H${SW}M110 0V300M230 0V300M350 0V300M470 0V300"/>
  </g>

  <!-- Celestial Sun Orbit with Solar Flares -->
  <g>
    ${anim('opacity', [[0, 0], [2.4, 0], [3.6, 1], [15.6, 1], [17, 0]])}
    <animateMotion dur="24s" repeatCount="indefinite" path="M40 240 Q292 -110 544 240" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.1;0.7;1"/>
    <!-- Outer Solar Flare Atmosphere -->
    <circle r="36" fill="url(#sunGlowGrad)"/>
    <circle r="14" fill="#ffe885"/>
    <circle r="10" fill="#ffd76a"/>
  </g>

  <!-- Celestial Crescent Moon Orbit with Subtle Craters -->
  <g>
    ${anim('opacity', [[0, 0], [16.3, 0], [17.5, 1], [22.2, 1], [23.3, 0]])}
    <animateMotion dur="24s" repeatCount="indefinite" path="M60 230 Q292 -100 524 230" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.68;0.97;1"/>
    <!-- Moon Ambient Glow -->
    <circle r="26" fill="#9db7e8" opacity="0.12"/>
    <!-- Crescent Moon Silhouette -->
    <path d="M0 -11 A11 11 0 1 0 0 11 A8 8 0 1 1 0 -11Z" fill="#dfe7f5"/>
    <circle cx="-3" cy="2" r="1.6" fill="#b0c4de" opacity="0.5"/>
    <circle cx="1" cy="-4" r="1.2" fill="#b0c4de" opacity="0.4"/>
  </g>

  <!-- Volumetric Lamp Dust Motes (Active when lamp is illuminated at Night) -->
  <g opacity="0">
    ${anim('opacity', nightPairs(0.7))}
    <circle cx="548" cy="275" r="0.8" fill="#ffd76a">
      ${sl('translate', ['0 0', '-8 -12', '0 0'], 3.2)}
      ${sla('opacity', ['0.3', '0.9', '0.3'], 3.2)}
    </circle>
    <circle cx="560" cy="285" r="1.0" fill="#ffd76a">
      ${sl('translate', ['0 0', '-12 -16', '0 0'], 4.1, 1.2)}
      ${sla('opacity', ['0.2', '0.8', '0.2'], 4.1, 1.2)}
    </circle>
  </g>`;
}

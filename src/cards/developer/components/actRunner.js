import {
  anim,
  tr,
  sc,
  sl,
  star,
  shade,
  SH,
} from '../utils/timeline.js';
import { CUBE_COLORS } from './sharedDefs.js';

/**
 * Calculates terrain elevation level (0..4) from commit count.
 */
function lvl(count) {
  if (!count || count <= 0) return 0;
  return Math.min(4, 1 + Math.floor(count / 3));
}

/**
 * Renders Act 2: The Contribution Graph Platformer Runner (12s - 18s).
 * - Multi-layer parallax background (distant cyber towers with blinking antennae + midground skybridge).
 * - 3D beveled contribution pillars with illuminated caps and abyss digital grid.
 * - Spinning collectible stars with golden halos and sparkle burst FX on collection.
 * - Mini hero with ground shadow and animated running kinematics.
 */
export function renderActRunner(counts = []) {
  const SPEED = 120;
  const X0 = 150;
  const N = 58;

  // Use provided counts or fallback
  const cData = counts && counts.length >= N
    ? counts
    : [
        2, 4, 3, 5, 0, 4, 6, 8, 5, 3, 0, 4, 6, 5, 9, 3, 2, 6, 4, 0,
        5, 7, 6, 8, 4, 0, 5, 7, 6, 9, 4, 3, 7, 5, 0, 6, 8, 7, 4, 5,
        3, 6, 0, 5, 7, 8, 6, 4, 0, 5, 6, 8, 7, 9, 5, 4, 6, 8,
      ];

  function getTop(c) {
    return 322 - lvl(cData[c]) * 16;
  }

  function getTc(c) {
    return 12 + (c * 24 + 12 - X0) / SPEED;
  }

  // Layer 1: Far Parallax Cyber Skyline with Window Lights & Antenna Blinkers
  const farSkyline = [
    { x: 0, w: 28, h: 65, antenna: true }, { x: 36, w: 34, h: 95, antenna: false },
    { x: 80, w: 24, h: 70, antenna: true }, { x: 114, w: 38, h: 115, antenna: false },
    { x: 162, w: 26, h: 60, antenna: false }, { x: 198, w: 32, h: 88, antenna: true },
    { x: 240, w: 25, h: 120, antenna: true }, { x: 275, w: 35, h: 72, antenna: false },
    { x: 320, w: 28, h: 100, antenna: true }, { x: 358, w: 26, h: 80, antenna: false },
    { x: 394, w: 36, h: 110, antenna: false }, { x: 440, w: 24, h: 65, antenna: true },
    { x: 474, w: 32, h: 98, antenna: false }, { x: 516, w: 28, h: 75, antenna: true },
    { x: 554, w: 34, h: 125, antenna: true }, { x: 598, w: 25, h: 70, antenna: false },
    { x: 633, w: 35, h: 90, antenna: false }, { x: 678, w: 28, h: 85, antenna: true },
    { x: 716, w: 32, h: 105, antenna: false }, { x: 758, w: 26, h: 75, antenna: false },
    { x: 794, w: 36, h: 115, antenna: true }, { x: 840, w: 25, h: 80, antenna: false },
    { x: 875, w: 35, h: 95, antenna: true }, { x: 920, w: 30, h: 120, antenna: false },
    { x: 960, w: 26, h: 70, antenna: true },
  ];

  let farSkylineSvg = '';
  for (const b of farSkyline) {
    const yTop = 300 - b.h;
    farSkylineSvg += `
      <rect x="${b.x}" y="${yTop}" width="${b.w}" height="${b.h + 70}" fill="#080e1a" opacity="0.85"/>
      <!-- Window Matrix Grid -->
      <line x1="${b.x + 6}" y1="${yTop + 14}" x2="${b.x + b.w - 6}" y2="${yTop + 14}" stroke="#58a6ff" stroke-opacity="0.3" stroke-dasharray="3 4"/>
      <line x1="${b.x + 6}" y1="${yTop + 24}" x2="${b.x + b.w - 6}" y2="${yTop + 24}" stroke="#ffd76a" stroke-opacity="0.25" stroke-dasharray="3 4"/>
      <line x1="${b.x + 6}" y1="${yTop + 34}" x2="${b.x + b.w - 6}" y2="${yTop + 34}" stroke="#58a6ff" stroke-opacity="0.2" stroke-dasharray="3 4"/>
      ${b.antenna ? `
        <!-- Radio Tower Antenna & Blinking Red Beacon -->
        <line x1="${b.x + b.w / 2}" y1="${yTop}" x2="${b.x + b.w / 2}" y2="${yTop - 12}" stroke="#2a3547" stroke-width="1.2"/>
        <circle cx="${b.x + b.w / 2}" cy="${yTop - 12}" r="1.5" fill="#ff5f56">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/>
        </circle>
      ` : ''}`;
  }

  // Layer 2: Midground Skybridge with Speeding Data Packet
  let skybridgeSvg = `
    <!-- Skybridge Girder -->
    <line x1="0" y1="210" x2="1000" y2="210" stroke="#131b2b" stroke-width="3" opacity="0.6"/>
    <line x1="0" y1="212" x2="1000" y2="212" stroke="#38bdf8" stroke-width="0.8" stroke-opacity="0.3"/>
    <!-- Speeding Cyber Drone -->
    <g>
      ${sl('translate', ['0 0', '-400 0'], 3.6)}
      <circle cx="500" cy="208" r="2.5" fill="#38bdf8"/>
      <line x1="500" y1="208" x2="525" y2="208" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.4"/>
    </g>`;

  // Layer 3: Beveled Contribution Terrain Pillars
  let terrainSvg = '';
  const candidateStarIndices = [9, 13, 17, 21, 25, 29, 33];
  const starsAt = candidateStarIndices.filter(c => c < N && lvl(cData[c]) > 0);

  for (let c = 0; c < N; c++) {
    const lv = lvl(cData[c]);
    if (lv === 0) continue; // Gap/pit!
    const y = getTop(c);
    const col = CUBE_COLORS[lv];
    terrainSvg += `
      <!-- Pillar Base & Bevel -->
      <rect x="${c * 24}" y="${y}" width="23" height="${SH - y}" fill="${shade(col, 0.45)}"/>
      <!-- Vertical Activity Seam Lines -->
      <line x1="${c * 24 + 11.5}" y1="${y + 5}" x2="${c * 24 + 11.5}" y2="${SH}" stroke="#000" stroke-opacity="0.25"/>
      <!-- Side Shadow Edge -->
      <rect x="${c * 24 + 20}" y="${y}" width="3" height="${SH - y}" fill="#000" opacity="0.2"/>
      <!-- Top Glowing Cap -->
      <rect x="${c * 24}" y="${y}" width="23" height="5" fill="${col}"/>
      <line x1="${c * 24}" y1="${y}" x2="${c * 24 + 23}" y2="${y}" stroke="#fff" stroke-width="1" stroke-opacity="0.6"/>`;
  }

  // Spinning Stars with Glowing Halos
  for (const c of starsAt) {
    const starY = getTop(c) - 62;
    const starPts = star(0, 0, 9);
    const tc = getTc(c);
    terrainSvg += `
      <g transform="translate(${c * 24 + 12},${starY})">
        ${anim('opacity', [[0, 1], [tc - 0.06, 1], [tc, 0]])}
        <!-- Halo Glow -->
        <circle r="14" fill="#ffd76a" opacity="0.2"/>
        <!-- Spinning Star -->
        <g>
          ${sl('rotate', ['0', '360'], 2.4)}
          <polygon points="${starPts}" fill="#ffd76a"/>
        </g>
      </g>`;
  }

  // Star Collection Score Popups with Sparkle Burst Particles
  let starPopsSvg = '';
  for (const c of starsAt) {
    const t = getTc(c);
    const y = getTop(c) - 80;
    starPopsSvg += `
      <g>
        <text class="t" x="${X0 - 12}" y="${y}" font-size="12.5" font-weight="800" fill="#ffd76a" opacity="0">
          ${anim('opacity', [[t - 0.02, 0], [t, 1], [t + 0.55, 0]])}
          ${tr([[t, 0, 0], [t + 0.55, 0, -20]])}★+1
        </text>
        <!-- Sparkle Cross Burst -->
        <g opacity="0">
          ${anim('opacity', [[t - 0.02, 0], [t, 1], [t + 0.35, 0]])}
          ${sc([[t, 0.4, 0.4], [t + 0.35, 1.4, 1.4]])}
          <line x1="${X0}" y1="${y + 14}" x2="${X0}" y2="${y - 2}" stroke="#ffe885" stroke-width="1.5"/>
          <line x1="${X0 - 8}" y1="${y + 6}" x2="${X0 + 8}" y2="${y + 6}" stroke="#ffe885" stroke-width="1.5"/>
        </g>
      </g>`;
  }

  // Runner vertical animation points (jumping across pits)
  const ry = [[12.0, X0, getTop(6)]];
  for (let c = 6; c < 36 && c < N; c++) {
    let yv;
    if (lvl(cData[c]) === 0) {
      // Jump peak over pit
      const prevY = c > 0 ? getTop(c - 1) : 322;
      const nextY = c < N - 1 ? getTop(c + 1) : 322;
      yv = Math.min(prevY, nextY) - 44;
    } else {
      yv = getTop(c);
    }
    ry.push([parseFloat(getTc(c).toFixed(3)), X0, yv]);
  }

  return `<!-- ============================= ACT 2: RUNNER (12s - 18s) ============================= -->
  <g opacity="0">
    ${anim('opacity', [[0, 0], [12.0, 0], [12.5, 1], [17.5, 1], [18.0, 0]])}

    <!-- Far Parallax Cyber Skyline (Slow Scroll) -->
    <g>
      ${tr([[12, 0, 0], [18, -280, 0]])}
      ${farSkylineSvg}
    </g>

    <!-- Midground Skybridge with Speeding Drones -->
    <g>
      ${tr([[12, 0, 0], [18, -480, 0]])}
      ${skybridgeSvg}
    </g>

    <!-- Contribution Graph Ground & Abyss (Fast Scroll) -->
    <g>
      ${tr([[12, 0, 0], [18, -SPEED * 6, 0]])}
      <!-- Abyss Ground with Digital Grid -->
      <rect x="0" y="340" width="${N * 24}" height="30" fill="#080c14"/>
      <line x1="0" y1="340" x2="${N * 24}" y2="340" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.4"/>
      <g stroke="#38bdf8" stroke-opacity="0.15" stroke-dasharray="2 6">
        <line x1="0" y1="352" x2="${N * 24}" y2="352"/>
        <line x1="0" y1="362" x2="${N * 24}" y2="362"/>
      </g>
      ${terrainSvg}
    </g>

    <!-- Star Collection Score Popups -->
    ${starPopsSvg}

    <!-- Mini Hero Runner with Dynamic Ground Shadow -->
    <g>
      ${tr(ry)}
      <!-- Ground Shadow Ellipse -->
      <ellipse cx="0" cy="0" rx="14" ry="3.5" fill="#000" opacity="0.35"/>
      <g transform="scale(1.5)">
        <!-- Running Legs Cycle -->
        <g>
          ${sl('rotate', ['-38 -4 -12', '38 -4 -12', '-38 -4 -12'], 0.34)}
          <rect x="-7" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
        </g>
        <g>
          ${sl('rotate', ['38 4 -12', '-38 4 -12', '38 4 -12'], 0.34)}
          <rect x="1" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
        </g>

        <!-- Torso & Head Bob -->
        <g>
          ${sl('translate', ['0 0', '0 -1.6', '0 0'], 0.17)}
          <use href="#mbody"/>
        </g>

        <!-- Swinging Arms Cycle -->
        <g>
          ${sl('rotate', ['40 -11 -26', '-40 -11 -26', '40 -11 -26'], 0.34)}
          <rect x="-14" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
        </g>
        <g>
          ${sl('rotate', ['-40 11 -26', '40 11 -26', '-40 11 -26'], 0.34)}
          <rect x="8" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
        </g>
      </g>
    </g>

    <!-- Wind Speed Streak Lines -->
    <g stroke="#fff" stroke-opacity="0.25" stroke-width="2" stroke-linecap="round">
      <g>
        ${sl('translate', ['30 0', '-40 0'], 0.35)}
        <line x1="60" y1="240" x2="90" y2="240"/>
      </g>
      <g>
        ${sl('translate', ['30 0', '-40 0'], 0.35, 0.12)}
        <line x1="40" y1="262" x2="80" y2="262"/>
      </g>
    </g>

    <!-- CLI Step Prompt HUD -->
    <text class="m" x="20" y="27" font-size="11" fill="#7d8590">
      &gt; run --commits <tspan fill="#ffd76a">★ x${starsAt.length}</tspan>
    </text>
  </g>`;
}

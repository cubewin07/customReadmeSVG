import {
  anim,
  tr,
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
 * - Real contribution activity heights form a tiered jumping course.
 * - Zero-commit days create gaps/pits.
 * - Mini hero runs and leaps across pits with animated legs and arms.
 * - Collects glowing stars with floating "★+1" popups.
 * - Parallax skyline and speed wind lines.
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

  // Parallax skyline buildings
  const skylineBuildings = [
    { x: 0, w: 26, h: 48 }, { x: 38, w: 32, h: 72 }, { x: 82, w: 22, h: 54 },
    { x: 114, w: 34, h: 86 }, { x: 158, w: 28, h: 42 }, { x: 196, w: 30, h: 68 },
    { x: 236, w: 24, h: 92 }, { x: 270, w: 32, h: 50 }, { x: 312, w: 28, h: 76 },
    { x: 350, w: 26, h: 60 }, { x: 386, w: 34, h: 88 }, { x: 430, w: 22, h: 46 },
    { x: 462, w: 30, h: 80 }, { x: 502, w: 28, h: 58 }, { x: 540, w: 32, h: 94 },
    { x: 582, w: 24, h: 52 }, { x: 616, w: 34, h: 84 }, { x: 660, w: 26, h: 66 },
    { x: 696, w: 30, h: 78 }, { x: 736, w: 28, h: 90 }, { x: 774, w: 32, h: 56 },
    { x: 816, w: 24, h: 74 }, { x: 850, w: 34, h: 82 }, { x: 894, w: 28, h: 64 },
    { x: 932, w: 30, h: 88 }, { x: 972, w: 26, h: 50 },
  ];

  let skylineSvg = '';
  for (const b of skylineBuildings) {
    skylineSvg += `<rect x="${b.x}" y="${300 - b.h}" width="${b.w}" height="${b.h + 70}" fill="#0b1220" opacity="0.8"/>`;
  }

  // Terrain pillars and floating stars
  let terrainSvg = '';
  const candidateStarIndices = [9, 13, 17, 21, 25, 29, 33];
  const starsAt = candidateStarIndices.filter(c => c < N && lvl(cData[c]) > 0);

  for (let c = 0; c < N; c++) {
    const lv = lvl(cData[c]);
    if (lv === 0) continue; // Gap/pit!
    const y = getTop(c);
    terrainSvg += `
      <rect x="${c * 24}" y="${y}" width="23" height="${SH - y}" fill="${shade(CUBE_COLORS[lv], 0.55)}"/>
      <rect x="${c * 24}" y="${y}" width="23" height="4" fill="${CUBE_COLORS[lv]}"/>`;
  }

  for (const c of starsAt) {
    const starY = getTop(c) - 62;
    const starPts = star(c * 24 + 12, starY, 10);
    const tc = getTc(c);
    terrainSvg += `<polygon points="${starPts}" fill="#ffd76a">
      ${anim('opacity', [[0, 1], [tc - 0.06, 1], [tc, 0]])}
    </polygon>`;
  }

  // Star collection score popups ("★+1")
  let starPopsSvg = '';
  for (const c of starsAt) {
    const t = getTc(c);
    const y = getTop(c) - 80;
    starPopsSvg += `<text class="t" x="${X0 - 12}" y="${y}" font-size="12" font-weight="800" fill="#ffd76a" opacity="0">
      ${anim('opacity', [[t - 0.02, 0], [t, 1], [t + 0.55, 0]])}
      ${tr([[t, 0, 0], [t + 0.55, 0, -18]])}★+1
    </text>`;
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

    <!-- Parallax Skyline Layer (Slow Scroll) -->
    <g>
      ${tr([[12, 0, 0], [18, -360, 0]])}
      ${skylineSvg}
    </g>

    <!-- Contribution Graph Ground & Ledges (Fast Scroll) -->
    <g>
      ${tr([[12, 0, 0], [18, -SPEED * 6, 0]])}
      <!-- Abyss Base -->
      <rect x="0" y="340" width="${N * 24}" height="30" fill="#0b0f16"/>
      ${terrainSvg}
    </g>

    <!-- Star Floating Score Popups -->
    ${starPopsSvg}

    <!-- Mini Hero Runner -->
    <g>
      ${tr(ry)}
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

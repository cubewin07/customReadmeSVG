import { anim, sl } from '../utils/timeline.js';

/**
 * Calculates building stack height (0..4 cubes) from commit count.
 */
function cubeHeight(count) {
  if (!count || count <= 0) return 0;
  return Math.min(4, Math.ceil(count / 2.5));
}

/**
 * Renders Act 3: The 3D Isometric Voxel City (18s - 24s).
 * - 7x7 isometric grid representing 7 weeks of commits (49 days).
 * - 3D voxel buildings drop down dynamically from the sky with bouncy overshoot landing.
 * - Mini hero stands as an architect / conductor orchestrating the city build with conductor gestures.
 * - Displays 7-week total commit count and CLI status.
 */
export function renderActCity(counts = []) {
  const cData = counts && counts.length >= 49
    ? counts
    : [
        2, 4, 3, 5, 0, 4, 6, 8, 5, 3, 0, 4, 6, 5, 9, 3, 2, 6, 4, 0,
        5, 7, 6, 8, 4, 0, 5, 7, 6, 9, 4, 3, 7, 5, 0, 6, 8, 7, 4, 5,
        3, 6, 0, 5, 7, 8, 6, 4, 0,
      ];

  // Grid line coordinates
  let gridLinesSvg = '';
  for (let i = 0; i < 8; i++) {
    const x1 = i * 13;
    const y1 = i * 7.5;
    const x2 = i * 13 - 91;
    const y2 = i * 7.5 + 52.5;
    gridLinesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

    const negX1 = -i * 13;
    const negY1 = i * 7.5;
    const negX2 = -i * 13 + 91;
    const negY2 = i * 7.5 + 52.5;
    gridLinesSvg += `<line x1="${negX1}" y1="${negY1}" x2="${negX2}" y2="${negY2}"/>`;
  }

  // 3D Voxel Cubes ordered by depth
  const cubes = [];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const idx = i * 7 + j;
      const hh = cubeHeight(cData[idx]);
      for (let k = 0; k < hh; k++) {
        cubes.push({
          depth: i + j,
          k,
          i,
          j,
          hh,
        });
      }
    }
  }

  // Sort by isometric draw order: depth first, then height k
  cubes.sort((a, b) => (a.depth - b.depth) || (a.k - b.k));

  let cubesSvg = '';
  for (const c of cubes) {
    const px = (c.i - c.j) * 13;
    const py = (c.i + c.j) * 7.5 - (c.k + 1) * 12;
    const ts = parseFloat((18.6 + (c.i + c.j) * 0.17 + c.k * 0.1).toFixed(2));

    cubesSvg += `<use href="#c${c.hh}" x="${px}" y="${py}" opacity="0">
      ${anim('opacity', [[ts, 0], [ts + 0.06, 1]])}
      ${anim('y', [
        [ts, parseFloat((py - 110).toFixed(1))],
        [ts + 0.28, parseFloat((py + 3).toFixed(1))],
        [ts + 0.38, parseFloat(py.toFixed(1))],
      ])}
    </use>`;
  }

  // Calculate 7-week commit total
  let totalCommits = 0;
  for (let i = 0; i < 49 && i < cData.length; i++) {
    totalCommits += (cData[i] || 0);
  }

  return `<!-- ============================= ACT 3: ISOMETRIC VOXEL CITY (18s - 24s) ============================= -->
  <g opacity="0">
    ${anim('opacity', [[0, 0], [17.6, 0], [18.2, 1], [23.5, 1], [24, 0]])}

    <!-- 3D Isometric City Stage -->
    <g transform="translate(352,112) scale(1.6)">
      <!-- Base Floating Isometric Pedestal -->
      <polygon points="-91,52.5 0,105 0,117 -91,64.5" fill="#0a0f18"/>
      <polygon points="91,52.5 0,105 0,117 91,64.5" fill="#0c121c"/>
      <polygon points="0,0 91,52.5 0,105 -91,52.5" fill="#0f1622" stroke="#1f2a3a"/>

      <!-- Isometric Floor Grid Lines -->
      <g stroke="#1c2636" stroke-width="0.6">
        ${gridLinesSvg}
      </g>

      <!-- Dropping 3D Voxel Buildings -->
      ${cubesSvg}
    </g>

    <!-- Conductor / Architect Podium & Hero -->
    <rect x="104" y="299" width="52" height="8" rx="3" fill="#1a2230"/>
    <g transform="translate(130,299) scale(1.6)">
      <!-- Legs Grounded on Podium -->
      <rect x="-7" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
      <rect x="1" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
      <use href="#mbody"/>

      <!-- Orchestrating Conductor Arms -->
      <g>
        ${sl('rotate', ['150 -11 -26', '112 -11 -26', '150 -11 -26'], 0.72, 0)}
        <rect x="-14" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
      </g>
      <g>
        ${sl('rotate', ['-150 11 -26', '-112 11 -26', '-150 11 -26'], 0.72, 0.36)}
        <rect x="8" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
      </g>
    </g>

    <!-- Total Commit Summary Footer -->
    <text class="m" x="352" y="340" text-anchor="middle" font-size="11" fill="#7d8590">
      7 weeks • ${totalCommits} commits
    </text>

    <!-- CLI Step Prompt HUD -->
    <text class="m" x="20" y="27" font-size="11" fill="#7d8590">&gt; build --world</text>
  </g>`;
}

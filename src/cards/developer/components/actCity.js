import { anim, tr, sl, sla } from '../utils/timeline.js';

/**
 * Calculates building stack height (0..4 cubes) from commit count.
 */
function cubeHeight(count) {
  if (!count || count <= 0) return 0;
  return Math.min(4, Math.ceil(count / 2.5));
}

/**
 * Renders Act 3: The 3D Isometric Voxel City (18s - 24s).
 * - Anti-gravity floating island base with glowing reactor core and floating data crystals.
 * - 7x7 isometric grid representing 7 weeks of commits (49 days).
 * - 3D voxel buildings drop down with bouncy elastic landing, rooftop beacons, and impact shockwaves.
 * - Flying cyber hoverships cruising between towers with plasma trails.
 * - Conductor hero at an illuminated holographic console orchestrating the digital world with symphony light waves.
 * - Summary commit badge and CLI status.
 */
export function renderActCity(counts = []) {
  const cData = counts && counts.length >= 49
    ? counts
    : [
        2, 4, 3, 5, 0, 4, 6, 8, 5, 3, 0, 4, 6, 5, 9, 3, 2, 6, 4, 0,
        5, 7, 6, 8, 4, 0, 5, 7, 6, 9, 4, 3, 7, 5, 0, 6, 8, 7, 4, 5,
        3, 6, 0, 5, 7, 8, 6, 4, 0,
      ];

  // Grid line coordinates with glowing intersection points
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
    const isRoof = c.k === c.hh - 1;
    const isSkyscraper = c.hh >= 3;

    cubesSvg += `<use href="#c${c.hh}" x="${px}" y="${py}" opacity="0">
      ${anim('opacity', [[ts, 0], [ts + 0.06, 1]])}
      ${anim('y', [
        [ts, parseFloat((py - 110).toFixed(1))],
        [ts + 0.28, parseFloat((py + 3).toFixed(1))],
        [ts + 0.38, parseFloat(py.toFixed(1))],
      ])}
    </use>`;

    if (isRoof && isSkyscraper) {
      cubesSvg += `
        <!-- Rooftop Satellite Relay Antenna & Warning Beacon -->
        <g opacity="0">
          ${anim('opacity', [[ts + 0.38, 0], [ts + 0.44, 1]])}
          <line x1="${px}" y1="${py}" x2="${px}" y2="${py - 9}" stroke="#ffffff" stroke-width="0.9"/>
          <circle cx="${px}" cy="${py - 9}" r="1.6" fill="#ff5f56">
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>`;
    }
  }

  // Floating Anti-Gravity Data Shards / Crystals around Island
  const crystalCoords = [
    [-110, 70, 2.8, 0],
    [-80, 126, 3.4, 0.8],
    [92, 76, 3.1, 0.4],
    [114, 120, 2.6, 1.2],
    [0, 138, 3.8, 1.6],
  ];
  let crystalsSvg = '';
  for (const [cx, cy, cDur, cDel] of crystalCoords) {
    crystalsSvg += `
      <g transform="translate(${cx},${cy})">
        ${sl('translate', ['0 0', '0 -6', '0 0'], cDur, cDel)}
        <polygon points="0,-7 5,0 0,7 -5,0" fill="url(#antiGravCrystalGrad)" stroke="#38bdf8" stroke-width="0.6"/>
        <line x1="0" y1="-7" x2="0" y2="7" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.5"/>
      </g>`;
  }

  // Calculate 7-week commit total
  let totalCommits = 0;
  for (let i = 0; i < 49 && i < cData.length; i++) {
    totalCommits += (cData[i] || 0);
  }

  return `<!-- ============================= ACT 3: ISOMETRIC VOXEL CITY (18s - 24s) ============================= -->
  <g opacity="0">
    ${anim('opacity', [[0, 0], [17.6, 0], [18.2, 1], [23.5, 1], [24, 0]])}

    <!-- 3D Isometric City Floating Island Stage -->
    <g transform="translate(352,112) scale(1.6)">
      <!-- Anti-Gravity Reactor Glow Beneath Island -->
      <ellipse cx="0" cy="115" rx="80" ry="24" fill="url(#antiGravCore)"/>

      <!-- Levitating Data Shards / Crystals -->
      ${crystalsSvg}

      <!-- Island Sub-bedrock Layers -->
      <polygon points="-91,64.5 0,117 0,132 -91,79.5" fill="#06090f"/>
      <polygon points="91,64.5 0,117 0,132 91,79.5" fill="#080c13"/>
      <!-- Mid-bedrock with Neon Energy Strata -->
      <polygon points="-91,52.5 0,105 0,117 -91,64.5" fill="#0a0f18"/>
      <line x1="-91" y1="58.5" x2="0" y2="111" stroke="#38c9a0" stroke-width="1.2" stroke-opacity="0.5"/>
      <polygon points="91,52.5 0,105 0,117 91,64.5" fill="#0c121c"/>
      <line x1="91" y1="58.5" x2="0" y2="111" stroke="#4c8dff" stroke-width="1.2" stroke-opacity="0.5"/>

      <!-- Top Island Surface with Cyber Grid -->
      <polygon points="0,0 91,52.5 0,105 -91,52.5" fill="#0e1520" stroke="#1f2c3d" stroke-width="1.2"/>
      <polygon points="0,1 89,52.5 0,103 -89,52.5" fill="none" stroke="#38bdf8" stroke-width="0.8" stroke-opacity="0.3"/>

      <!-- Isometric Floor Grid Lines -->
      <g stroke="#1c2636" stroke-width="0.6">
        ${gridLinesSvg}
      </g>

      <!-- Impact Shockwave Ripple during City Drop -->
      <ellipse cx="0" cy="52.5" rx="15" ry="8.5" fill="none" stroke="#4fd1ff" stroke-width="1.5" opacity="0">
        ${anim('rx', [[19.2, 10], [20.2, 75]])}
        ${anim('ry', [[19.2, 5], [20.2, 42]])}
        ${anim('opacity', [[19.2, 0.7], [20.2, 0]])}
      </ellipse>

      <!-- Dropping 3D Voxel Buildings with Rooftop Beacons -->
      ${cubesSvg}
    </g>

    <!-- Flying Cyber Speedcraft 1 (Cruising Right to Left across Skyscrapers) -->
    <g>
      ${tr([[18.4, 520, 138], [23.6, -40, 152]])}
      <ellipse cx="0" cy="0" rx="9" ry="3" fill="#0d1b2a" stroke="#38bdf8" stroke-width="0.8"/>
      <!-- Tail Light Trail -->
      <line x1="9" y1="0" x2="22" y2="0" stroke="#ff5f56" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
      <!-- Headlight Beam -->
      <circle cx="-9" cy="0" r="1.5" fill="#38bdf8"/>
    </g>

    <!-- Flying Cyber Speedcraft 2 (Cruising Left to Right High Altitude) -->
    <g>
      ${tr([[18.6, -30, 85], [23.8, 540, 75]])}
      <ellipse cx="0" cy="0" rx="10" ry="3.5" fill="#0f172a" stroke="#a78bfa" stroke-width="0.8"/>
      <!-- Tail Light Trail -->
      <line x1="-10" y1="0" x2="-24" y2="0" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
      <!-- Headlight Beam -->
      <circle cx="10" cy="0" r="1.5" fill="#ffd76a"/>
    </g>

    <!-- Conductor Holographic Symphony Resonance Waves -->
    <g transform="translate(130,265)">
      <ellipse cx="20" cy="-10" rx="10" ry="16" fill="none" stroke="#38c9a0" stroke-width="1.2" opacity="0">
        ${anim('rx', [[18.6, 10], [19.8, 55], [21.0, 10], [22.2, 55]])}
        ${anim('ry', [[18.6, 16], [19.8, 80], [21.0, 16], [22.2, 80]])}
        ${anim('opacity', [[18.6, 0.6], [19.8, 0], [21.0, 0.6], [22.2, 0]])}
      </ellipse>
      <ellipse cx="20" cy="-10" rx="10" ry="16" fill="none" stroke="#4c8dff" stroke-width="1.2" opacity="0">
        ${anim('rx', [[19.2, 10], [20.4, 65], [21.6, 10], [22.8, 65]])}
        ${anim('ry', [[19.2, 16], [20.4, 90], [21.6, 16], [22.8, 90]])}
        ${anim('opacity', [[19.2, 0.6], [20.4, 0], [21.6, 0.6], [22.8, 0]])}
      </ellipse>
    </g>

    <!-- Conductor / Architect Podium & Holographic Control Console -->
    <g transform="translate(130,299)">
      <!-- Multi-tier Illuminated Stage -->
      <rect x="-32" y="0" width="64" height="8" rx="3" fill="#141a24" stroke="#38bdf8" stroke-width="1"/>
      <line x1="-30" y1="1" x2="30" y2="1" stroke="#fff" stroke-opacity="0.25"/>
      <rect x="-26" y="8" width="52" height="6" rx="2" fill="#0a0d14"/>

      <!-- Character Standing on Stage (scale 1.6) -->
      <g transform="scale(1.6)">
        <!-- Grounded Legs -->
        <rect x="-7" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
        <rect x="1" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
        <use href="#mbody"/>

        <!-- Orchestrating Conductor Arms with Glowing Baton Light Arcs -->
        <g>
          ${sl('rotate', ['150 -11 -26', '112 -11 -26', '150 -11 -26'], 0.72, 0)}
          <rect x="-14" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
          <!-- Conductor Light Baton -->
          <line x1="-11" y1="-26" x2="-8" y2="-38" stroke="#38c9a0" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <g>
          ${sl('rotate', ['-150 11 -26', '-112 11 -26', '-150 11 -26'], 0.72, 0.36)}
          <rect x="8" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
          <!-- Conductor Light Baton -->
          <line x1="11" y1="-26" x2="8" y2="-38" stroke="#4c8dff" stroke-width="1.5" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Hologram Equalizer / Synthesizer Console in Front of Conductor -->
      <g transform="translate(0,-6)">
        <polygon points="-24,0 24,0 18,6 -18,6" fill="#0d1f30" stroke="#38bdf8" stroke-width="0.8" opacity="0.8"/>
        <!-- Animated Equalizer Audio Visualizer Bars -->
        <rect x="-14" y="-8" width="3" height="7" fill="#38c9a0">
          ${sla('height', ['3', '8', '2', '6', '3'], 0.45)}
        </rect>
        <rect x="-8" y="-10" width="3" height="9" fill="#4fd1ff">
          ${sla('height', ['5', '11', '4', '8', '5'], 0.52)}
        </rect>
        <rect x="-2" y="-12" width="3" height="11" fill="#6bdc7a">
          ${sla('height', ['8', '13', '6', '11', '8'], 0.38)}
        </rect>
        <rect x="4" y="-9" width="3" height="8" fill="#ffd76a">
          ${sla('height', ['4', '10', '3', '7', '4'], 0.48)}
        </rect>
        <rect x="10" y="-7" width="3" height="6" fill="#4fd1ff">
          ${sla('height', ['2', '7', '4', '6', '2'], 0.42)}
        </rect>
      </g>
    </g>

    <!-- Total Commit Summary Footer Pill -->
    <g transform="translate(352,340)">
      <rect x="-75" y="-14" width="150" height="22" rx="11" fill="#0a0f18" stroke="#1f2c3d"/>
      <text class="m" x="0" y="1" text-anchor="middle" font-size="11" font-weight="600" fill="#9db7e8">
        7 weeks • <tspan fill="#38c9a0">${totalCommits}</tspan> commits
      </text>
    </g>

  </g>`;
}

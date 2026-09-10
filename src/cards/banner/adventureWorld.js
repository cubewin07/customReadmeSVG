/**
 * Static Hub Street & Overworld Environment Engine
 *
 * Implements a rich, living 890x240 Metroidvania hub world:
 * 1. Starry cyber twilight sky with twinkling stars, meteors, and synthwave moon
 * 2. Parallax distant skyline with illuminated windows and broadcast spires
 * 3. Detailed multi-layer sidewalk with stone pavers, beveled neon curbing,
 *    glowing drainage vents emitting rising steam wisps, and streetlamp downlights
 * 4. Distinct puddle reflections under each building matched to that stage's neon theme
 * 5. Organic terrain transition at x=640 from neon pavement into natural rocky campsite earth,
 *    tufts of cyber-grass, river stepping stones, and cozy campsite clearing
 * 6. Multi-layered animated campfire with dancing flames, glowing ember sparks,
 *    explorer's rucksack, wooden supply crates, and hanging trail lantern
 * 7. Architectural pixel-art facades for all 4 stages with clear stars (★)
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.5
 */

import { escapeXml } from '../../svg/escape.js';

/**
 * Twinkling night sky stars
 */
export function renderStars(count = 48) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const x = ((i * 137 + 29) % 880) + 5;
    const y = ((i * 73 + 17) % 125) + 6;
    const size = (i % 5 === 0) ? 2 : (i % 3 === 0 ? 1.5 : 1);
    const dur = (1.5 + (i % 4) * 0.7).toFixed(1);
    const delay = ((i % 5) * 0.4).toFixed(1);
    const fill = (i % 4 === 0) ? '#00f0ff' : (i % 6 === 0 ? '#ff99dd' : '#ffffff');

    stars.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" opacity="0.8">
      <animate attributeName="opacity" values="0.15;0.95;0.15" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
    </rect>`);
  }
  return `<g id="stars-layer">${stars.join('')}</g>`;
}

/**
 * Animated shooting meteors streaking diagonally across the sky
 */
export function renderShootingStars() {
  return `<!-- Shooting Stars -->
  <g id="shooting-stars">
    <line x1="820" y1="12" x2="710" y2="70" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" opacity="0">
      <animate attributeName="opacity" values="0; 0; 1; 0; 0" keyTimes="0; 0.45; 0.50; 0.56; 1" dur="6.5s" repeatCount="indefinite"/>
      <animate attributeName="x1" values="820; 820; 700; 590; 820" keyTimes="0; 0.45; 0.50; 0.56; 1" dur="6.5s" repeatCount="indefinite"/>
      <animate attributeName="y1" values="12; 12; 72; 128; 12" keyTimes="0; 0.45; 0.50; 0.56; 1" dur="6.5s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="860; 860; 740; 630; 860" keyTimes="0; 0.45; 0.50; 0.56; 1" dur="6.5s" repeatCount="indefinite"/>
      <animate attributeName="y2" values="-8; -8; 52; 108; -8" keyTimes="0; 0.45; 0.50; 0.56; 1" dur="6.5s" repeatCount="indefinite"/>
    </line>
  </g>`;
}

/**
 * Retro synthwave neon moon
 */
export function renderNeonMoon(cx = 760, cy = 56, r = 32) {
  return `<!-- Retro Synthwave Moon -->
  <g id="neon-moon" opacity="0.9">
    <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="#ff007f" opacity="0.12"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#ffaa00" opacity="0.18"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moon-gradient)"/>
    <rect x="${cx - r}" y="${cy + 6}" width="${r * 2}" height="2" fill="#0c0e22" opacity="0.85"/>
    <rect x="${cx - r}" y="${cy + 12}" width="${r * 2}" height="3" fill="#0c0e22" opacity="0.85"/>
    <rect x="${cx - r}" y="${cy + 19}" width="${r * 2}" height="4" fill="#0c0e22" opacity="0.85"/>
    <rect x="${cx - r}" y="${cy + 26}" width="${r * 2}" height="4" fill="#0c0e22" opacity="0.85"/>
  </g>`;
}

/**
 * Distant city skyline with slow parallax drift
 */
export function renderParallaxSkyline() {
  const buildings = [
    { x: 0, w: 42, h: 55 },
    { x: 44, w: 28, h: 75, spire: true },
    { x: 74, w: 55, h: 42 },
    { x: 131, w: 38, h: 80 },
    { x: 171, w: 48, h: 60 },
    { x: 221, w: 32, h: 90, spire: true },
    { x: 255, w: 52, h: 50 },
    { x: 310, w: 44, h: 68 },
    { x: 356, w: 36, h: 78 },
    { x: 394, w: 60, h: 48 },
    { x: 456, w: 40, h: 72, spire: true },
    { x: 498, w: 50, h: 58 },
    { x: 550, w: 48, h: 84 },
    { x: 600, w: 40, h: 62 },
    { x: 642, w: 56, h: 76, spire: true },
    { x: 700, w: 35, h: 54 },
    { x: 737, w: 46, h: 80 },
    { x: 785, w: 52, h: 50 },
    { x: 840, w: 45, h: 70, spire: true },
  ];

  const totalWidth = 890;
  const baseY = 192;

  const renderSlice = (offsetX) => {
    return buildings.map(b => {
      const x = b.x + offsetX;
      const y = baseY - b.h;
      let extra = '';
      if (b.spire) {
        extra = `<line x1="${x + b.w / 2}" y1="${y - 10}" x2="${x + b.w / 2}" y2="${y}" stroke="#ff007f" stroke-width="1.5" opacity="0.8">
          <animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
        </line>
        <circle cx="${x + b.w / 2}" cy="${y - 10}" r="1.5" fill="#00f0ff"/>`;
      }

      const windows = [];
      for (let wy = y + 8; wy < baseY - 10; wy += 8) {
        for (let wx = x + 6; wx < x + b.w - 6; wx += 7) {
          if ((wx * 11 + wy * 17) % 7 < 3) {
            windows.push(`<rect x="${wx}" y="${wy}" width="3" height="3.5" fill="#ffe066" opacity="0.45"/>`);
          }
        }
      }

      return `<g>
        <rect x="${x}" y="${y}" width="${b.w}" height="${b.h}" fill="#0e1124" stroke="#1a1d38" stroke-width="1"/>
        ${windows.join('')}
        ${extra}
      </g>`;
    }).join('');
  };

  return `<!-- Parallax City Skyline -->
  <g id="skyline-parallax" opacity="0.8">
    <animateTransform attributeName="transform" type="translate"
      from="0 0" to="-${totalWidth} 0" dur="75s" repeatCount="indefinite"/>
    ${renderSlice(0)}
    ${renderSlice(totalWidth)}
  </g>`;
}

/**
 * Rich Terrain Engine:
 * - Multi-layer cyber sidewalk with hexagonal pavers, curb bevel, and drainage steam vents
 * - Puddle reflections under doors
 * - Streetlamp bollards casting soft cones of light
 * - Weathered cobblestones transitioning into the campsite earth at x=640
 */
export function renderCyberRoad(width = 890, baseY = 192) {
  const height = 48;

  // Sidewalk Paver Stones (x=0 to x=640)
  const pavers = [];
  for (let px = 4; px < 636; px += 26) {
    const isAlt = (px % 52) === 0;
    const paverFill = isAlt ? '#10152a' : '#0c1020';
    pavers.push(`<rect x="${px}" y="${baseY - 14}" width="24" height="13" rx="1.5" fill="${paverFill}" stroke="#18203c" stroke-width="0.8"/>`);
  }

  // Stepping stones and rocky path in campsite (x=640 to 890)
  const campsiteRocks = [
    { x: 642, y: baseY - 10, w: 18, h: 9, r: 3 },
    { x: 666, y: baseY - 13, w: 22, h: 11, r: 4 },
    { x: 694, y: baseY - 8, w: 16, h: 8, r: 3 },
    { x: 715, y: baseY - 14, w: 26, h: 12, r: 5 },
    { x: 748, y: baseY - 9, w: 20, h: 9, r: 4 },
    { x: 774, y: baseY - 13, w: 24, h: 11, r: 4 },
    { x: 804, y: baseY - 8, w: 18, h: 8, r: 3 },
    { x: 828, y: baseY - 12, w: 24, h: 10, r: 4 },
    { x: 858, y: baseY - 9, w: 22, h: 9, r: 4 },
  ];
  const rocksSvg = campsiteRocks.map(rk => `
    <rect x="${rk.x}" y="${rk.y}" width="${rk.w}" height="${rk.h}" rx="${rk.r}" fill="#221c2c" stroke="#382e46" stroke-width="0.8"/>
  `).join('');

  // Tufts of cyber-grass sprouting between stones in campsite
  const grassTufts = [
    { x: 658, y: baseY - 14 },
    { x: 686, y: baseY - 12 },
    { x: 738, y: baseY - 15 },
    { x: 768, y: baseY - 14 },
    { x: 822, y: baseY - 13 },
    { x: 852, y: baseY - 15 },
  ];
  const grassSvg = grassTufts.map(g => `
    <g transform="translate(${g.x}, ${g.y})">
      <line x1="0" y1="0" x2="-2" y2="-7" stroke="#00ff88" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="2" y1="0" x2="3" y2="-9" stroke="#39ff14" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="4" y1="0" x2="7" y2="-6" stroke="#00ff88" stroke-width="1" stroke-linecap="round"/>
    </g>
  `).join('');

  // Streetlamp bollards between buildings (x=172, 342, 512)
  const streetlamps = [172, 342, 512].map(bx => `
    <!-- Neon Streetlamp Bollard at x=${bx} -->
    <g transform="translate(${bx}, ${baseY - 42})">
      <!-- Light Cone Falling onto Sidewalk -->
      <polygon points="6,6 -18,42 30,42" fill="#00f0ff" opacity="0.06"/>
      <!-- Lamp Post Body -->
      <rect x="3" y="10" width="6" height="32" rx="1" fill="#080c1a" stroke="#253055" stroke-width="0.8"/>
      <!-- Glowing Lamp Head -->
      <rect x="1" y="2" width="10" height="8" rx="2" fill="#00f0ff" opacity="0.9"/>
      <circle cx="6" cy="6" r="8" fill="#00f0ff" opacity="0.18">
        <animate attributeName="r" values="7; 10; 7" dur="2.4s" repeatCount="indefinite"/>
      </circle>
    </g>
  `).join('');

  // Animated Steam Grates (x=110, 460)
  const steamGrates = [
    { x: 110, y: baseY - 12 },
    { x: 460, y: baseY - 12 },
  ].map((sg, idx) => `
    <g transform="translate(${sg.x}, ${sg.y})">
      <!-- Iron Grate Frame -->
      <rect x="0" y="0" width="28" height="10" rx="2" fill="#070a16" stroke="#2e385c" stroke-width="1"/>
      <line x1="6" y1="2" x2="6" y2="8" stroke="#3e4c7a" stroke-width="1"/>
      <line x1="12" y1="2" x2="12" y2="8" stroke="#3e4c7a" stroke-width="1"/>
      <line x1="18" y1="2" x2="18" y2="8" stroke="#3e4c7a" stroke-width="1"/>
      <line x1="22" y1="2" x2="22" y2="8" stroke="#3e4c7a" stroke-width="1"/>
      <!-- Rising Steam Vapor Wisps -->
      <circle cx="10" cy="2" r="3" fill="#ffffff" opacity="0.4">
        <animate attributeName="cy" values="2; -18; -32" dur="2.2s" begin="${(idx * 0.8).toFixed(1)}s" repeatCount="indefinite"/>
        <animate attributeName="r" values="2.5; 5; 7" dur="2.2s" begin="${(idx * 0.8).toFixed(1)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.45; 0.2; 0" dur="2.2s" begin="${(idx * 0.8).toFixed(1)}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="18" cy="2" r="2.5" fill="#00f0ff" opacity="0.3">
        <animate attributeName="cy" values="2; -14; -28" dur="1.8s" begin="${(idx * 0.8 + 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        <animate attributeName="r" values="2; 4; 6" dur="1.8s" begin="${(idx * 0.8 + 0.4).toFixed(1)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4; 0.15; 0" dur="1.8s" begin="${(idx * 0.8 + 0.4).toFixed(1)}s" repeatCount="indefinite"/>
      </circle>
    </g>
  `).join('');

  return `<!-- Ground & Dynamic Terrain Layer -->
  <g id="ground-layer">
    <!-- 1. Sidewalk Platform Foundation -->
    <rect x="0" y="${baseY - 16}" width="640" height="16" fill="#0a0d1e"/>
    <!-- Campsite Earth Foundation -->
    <rect x="640" y="${baseY - 16}" width="${width - 640}" height="16" fill="#14101a"/>

    <!-- 2. Sidewalk Flagstones -->
    ${pavers.join('')}

    <!-- 3. Campsite Rocks & Cyber-Grass -->
    ${rocksSvg}
    ${grassSvg}

    <!-- 4. Puddle Reflections Under Every Door Facade -->
    <!-- Door 0 Puddle (Lab: Cyan) -->
    <ellipse cx="46" cy="${baseY - 2}" rx="32" ry="4" fill="#00f0ff" opacity="0.2">
      <animate attributeName="opacity" values="0.15; 0.28; 0.15" dur="3s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Door 1 Puddle (Vault: Gold) -->
    <ellipse cx="216" cy="${baseY - 2}" rx="32" ry="4" fill="#ffd700" opacity="0.2">
      <animate attributeName="opacity" values="0.15; 0.28; 0.15" dur="3.4s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Door 2 Puddle (Forge: Fire Orange) -->
    <ellipse cx="386" cy="${baseY - 2}" rx="32" ry="4" fill="#ff5500" opacity="0.2">
      <animate attributeName="opacity" values="0.15; 0.28; 0.15" dur="2.8s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Door 3 Puddle (Tower: Sky Blue) -->
    <ellipse cx="556" cy="${baseY - 2}" rx="32" ry="4" fill="#00ADD8" opacity="0.2">
      <animate attributeName="opacity" values="0.15; 0.28; 0.15" dur="3.2s" repeatCount="indefinite"/>
    </ellipse>

    <!-- 5. Steam Drainage Grates -->
    ${steamGrates}

    <!-- 6. Streetlamp Bollards & Light Cones -->
    ${streetlamps}

    <!-- 7. Raised Curb Stone Edge with Cyber Neon Bevel -->
    <line x1="0" y1="${baseY}" x2="640" y2="${baseY}" stroke="#00f0ff" stroke-width="2" opacity="0.95"/>
    <line x1="0" y1="${baseY + 2}" x2="640" y2="${baseY + 2}" stroke="#ff007f" stroke-width="1.2" opacity="0.7"/>
    <!-- Organic crumbling edge transition at x=640 -->
    <path d="M 640 ${baseY} L 648 ${baseY + 2} L 656 ${baseY - 1} L 668 ${baseY + 1} L ${width} ${baseY + 1}" fill="none" stroke="#483a58" stroke-width="1.5"/>

    <!-- 8. Lower Road Asphalt & Cyber Grid Surface -->
    <rect x="0" y="${baseY + 3}" width="${width}" height="${height - 3}" fill="#060814"/>
    <line x1="0" y1="${baseY + 14}" x2="${width}" y2="${baseY + 14}" stroke="#1c2140" stroke-width="1"/>
    <line x1="0" y1="${baseY + 26}" x2="${width}" y2="${baseY + 26}" stroke="#222850" stroke-width="1.2"/>
    <line x1="0" y1="${baseY + 40}" x2="${width}" y2="${baseY + 40}" stroke="#272e5c" stroke-width="1.5"/>

    <!-- Static Street Lane Dashes -->
    <rect x="70" y="${baseY + 20}" width="42" height="3.5" rx="1.5" fill="#00f0ff" opacity="0.35"/>
    <rect x="230" y="${baseY + 20}" width="42" height="3.5" rx="1.5" fill="#00f0ff" opacity="0.35"/>
    <rect x="390" y="${baseY + 20}" width="42" height="3.5" rx="1.5" fill="#00f0ff" opacity="0.35"/>
    <rect x="550" y="${baseY + 20}" width="42" height="3.5" rx="1.5" fill="#00f0ff" opacity="0.35"/>
    <rect x="710" y="${baseY + 20}" width="42" height="3.5" rx="1.5" fill="#ffd700" opacity="0.25"/>

    <!-- Wet Asphalt Gloss Reflection Overlay -->
    <rect x="0" y="${baseY}" width="${width}" height="${height}" fill="url(#ground-reflection)" opacity="0.55"/>
  </g>`;
}

/**
 * Renders an exterior door facade for a given stage
 */
function renderDoorFacade(stage, slotX, slotW, stageIndex, timeline, baseY = 192) {
  const { paint, archetype } = stage;
  const bH = 110;
  const bY = baseY - bH;
  const langColor = paint.langColor || '#00f0ff';
  const name = escapeXml(paint.name || 'STAGE');
  const lang = escapeXml(paint.lang || 'CODE');

  // Find when this stage's zoom-out occurs to reveal the clear-star
  const zoomOut = timeline?.scenes?.find(s => s.type === 'zoom-out' && s.stageIndex === stageIndex);
  const clearTime = zoomOut ? zoomOut.t1 : 28;
  const totalDur = timeline?.totalDur || 28;
  const totalDurStr = timeline?.totalDurStr || '28.0s';
  const normClear = Number(Math.min(0.9999, Math.max(0.0001, clearTime / totalDur)).toFixed(4));

  // Visual architectural pixel art based on archetype
  let accentGraphics;
  if (archetype === 'lab') {
    accentGraphics = `
      <!-- Rooftop Observatory Dish with Radar Beam -->
      <g transform="translate(${slotW - 36}, -12)">
        <path d="M 0 16 Q 14 0 28 16" fill="none" stroke="#00f0ff" stroke-width="2"/>
        <line x1="14" y1="9" x2="22" y2="0" stroke="#ff007f" stroke-width="1.5"/>
        <circle cx="22" cy="0" r="2" fill="#39ff14"/>
        <path d="M 24 -4 Q 30 0 24 6" fill="none" stroke="#00f0ff" stroke-width="1" opacity="0">
          <animate attributeName="opacity" values="0; 1; 0" dur="1.5s" repeatCount="indefinite"/>
        </path>
      </g>
      <!-- Dual-Pane Observatory Illuminated Windows -->
      <g transform="translate(56, 36)">
        <rect x="0" y="0" width="38" height="24" rx="2" fill="#040816" stroke="#00f0ff" stroke-width="0.8"/>
        <!-- Oscilloscope Waveform -->
        <path d="M 4 12 Q 12 4 20 12 T 34 12" fill="none" stroke="#00f0ff" stroke-width="1.2">
          <animate attributeName="d" values="
            M 4 12 Q 12 4 20 12 T 34 12;
            M 4 12 Q 12 20 20 12 T 34 12;
            M 4 12 Q 12 4 20 12 T 34 12" dur="2s" repeatCount="indefinite"/>
        </path>
      </g>
      <!-- Coolant Conduit Pipe -->
      <line x1="${slotW - 14}" y1="24" x2="${slotW - 14}" y2="${bH}" stroke="#00f0ff" stroke-width="2" opacity="0.6"/>
      <circle cx="${slotW - 14}" cy="70" r="2.5" fill="#00f0ff">
        <animate attributeName="opacity" values="0.4; 1; 0.4" dur="1.2s" repeatCount="indefinite"/>
      </circle>`;
  } else if (archetype === 'vault') {
    accentGraphics = `
      <!-- Neoclassical Cyber Vault Pillars -->
      <g>
        <rect x="52" y="28" width="8" height="${bH - 28}" fill="#141828" stroke="#ffd700" stroke-width="0.8"/>
        <rect x="50" y="26" width="12" height="4" fill="#ffd700"/>
        <rect x="50" y="${bH - 6}" width="12" height="4" fill="#ffd700"/>
      </g>
      <g>
        <rect x="${slotW - 36}" y="28" width="8" height="${bH - 28}" fill="#141828" stroke="#ffd700" stroke-width="0.8"/>
        <rect x="${slotW - 38}" y="26" width="12" height="4" fill="#ffd700"/>
        <rect x="${slotW - 38}" y="${bH - 6}" width="12" height="4" fill="#ffd700"/>
      </g>
      <!-- Digital Security Keypad & Gold Coin -->
      <rect x="68" y="38" width="36" height="20" rx="2" fill="#070c18" stroke="#ffd700" stroke-width="0.8"/>
      <text x="73" y="51" font-family="'Courier New', monospace" font-size="7.5px" font-weight="800" fill="#00ff88">+24% ▲</text>
      <!-- Heavy Vault Gear Emblem -->
      <circle cx="${slotW - 22}" cy="16" r="6" fill="#182038" stroke="#ffd700" stroke-width="1.2"/>
      <circle cx="${slotW - 22}" cy="16" r="3" fill="#ffd700"/>`;
  } else if (archetype === 'forge') {
    accentGraphics = `
      <!-- Steampunk Chimney Puffs -->
      <g transform="translate(${slotW - 34}, 8)">
        <rect x="0" y="4" width="18" height="36" fill="#180f1e" stroke="#ff5500" stroke-width="1"/>
        <rect x="-3" y="0" width="24" height="5" rx="1" fill="#2d1d32"/>
        <!-- Floating Red-Hot Embers -->
        <circle cx="9" cy="-2" r="1.5" fill="#ffaa00">
          <animate attributeName="cy" values="-2; -12; -22" dur="1.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1; 0.8; 0" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="14" cy="1" r="1.2" fill="#ff3300">
          <animate attributeName="cy" values="1; -8; -18" dur="1.3s" begin="0.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1; 0.8; 0" dur="1.3s" begin="0.4s" repeatCount="indefinite"/>
        </circle>
      </g>
      <!-- Molten Heat Grate -->
      <rect x="54" y="36" width="38" height="22" rx="2" fill="#120814" stroke="#ff5500" stroke-width="0.8"/>
      <line x1="60" y1="42" x2="86" y2="42" stroke="#ff3300" stroke-width="2"/>
      <line x1="60" y1="47" x2="86" y2="47" stroke="#ff5500" stroke-width="2"/>
      <line x1="60" y1="52" x2="86" y2="52" stroke="#ffaa00" stroke-width="2"/>
      <!-- Hazard Stripes Above Door -->
      <rect x="14" y="50" width="32" height="5" fill="#ffaa00"/>
      <line x1="18" y1="50" x2="23" y2="55" stroke="#120814" stroke-width="2.5"/>
      <line x1="28" y1="50" x2="33" y2="55" stroke="#120814" stroke-width="2.5"/>
      <line x1="38" y1="50" x2="43" y2="55" stroke="#120814" stroke-width="2.5"/>`;
  } else {
    accentGraphics = `
      <!-- Server Monolith Multi-LED Rack -->
      <rect x="56" y="34" width="42" height="24" rx="2" fill="#040814" stroke="#00ADD8" stroke-width="0.8"/>
      <circle cx="64" cy="42" r="1.8" fill="#00ff88">
        <animate attributeName="opacity" values="0.3; 1; 0.3" dur="0.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="72" cy="42" r="1.8" fill="#ff007f">
        <animate attributeName="opacity" values="1; 0.2; 1" dur="1.1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="80" cy="42" r="1.8" fill="#00f0ff">
        <animate attributeName="opacity" values="0.2; 1; 0.2" dur="0.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="88" cy="42" r="1.8" fill="#ffd700">
        <animate attributeName="opacity" values="1; 0.4; 1" dur="1.4s" repeatCount="indefinite"/>
      </circle>
      <text x="64" y="53" font-family="'Courier New', monospace" font-size="6px" font-weight="900" fill="#00ADD8">ASYNC // OK</text>
      <!-- Rooftop Tower Antenna -->
      <line x1="${slotW - 20}" y1="24" x2="${slotW - 20}" y2="-8" stroke="#00ADD8" stroke-width="1.8"/>
      <circle cx="${slotW - 20}" cy="-8" r="2.5" fill="#00ff88"/>
      <line x1="${slotW - 26}" y1="-4" x2="${slotW - 14}" y2="-4" stroke="#00ADD8" stroke-width="1.2"/>`;
  }

  return `<!-- Facade Door ${stageIndex}: ${name} (${archetype}) -->
  <g id="facade-door-${stageIndex}" transform="translate(${slotX}, ${bY})">
    <!-- Main Building Facade Shell -->
    <rect x="0" y="24" width="${slotW}" height="${bH - 24}" rx="5" fill="#0b0e1e" stroke="${langColor}" stroke-width="1.2"/>
    <rect x="0" y="24" width="${slotW}" height="${bH - 24}" rx="5" fill="rgba(0, 240, 255, 0.03)"/>

    <!-- Architectural Panel Seams -->
    <line x1="0" y1="62" x2="${slotW}" y2="62" stroke="#161d36" stroke-width="1"/>
    <line x1="50" y1="24" x2="50" y2="${bH}" stroke="#161d36" stroke-width="1"/>

    <!-- Marquee Header -->
    <rect x="6" y="6" width="${slotW - 12}" height="20" rx="3" fill="#060914" stroke="${langColor}" stroke-width="1"/>
    <text x="14" y="20" font-family="'Courier New', monospace" font-size="9px" font-weight="900" fill="#ffffff" letter-spacing="0.3">
      ${name}
    </text>
    <rect x="${slotW - 48}" y="9" width="38" height="14" rx="2" fill="${langColor}" opacity="0.3"/>
    <text x="${slotW - 29}" y="19" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="7.5px" font-weight="800" fill="${langColor}">
      ${lang}
    </text>

    <!-- Clear Star (★) Award on Facade (Lights up when stage cleared!) -->
    <g id="star-award-${stageIndex}" transform="translate(${slotW / 2}, 0)">
      <circle cx="0" cy="0" r="10" fill="#ffd700" opacity="0">
        <animate attributeName="opacity" values="0; 0.3" keyTimes="0; ${normClear}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <animate attributeName="r" values="8; 13; 8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text text-anchor="middle" y="4" font-size="13px" fill="#ffd700" opacity="0">
        <animate attributeName="opacity" values="0; 1" keyTimes="0; ${normClear}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        ★
      </text>
    </g>

    ${accentGraphics}

    <!-- Entrance Door Portal (x=16, y=58, w=28, h=52) -->
    <g id="door-portal-${stageIndex}" transform="translate(16, 58)">
      <rect x="0" y="0" width="28" height="52" rx="2" fill="#03060f" stroke="${langColor}" stroke-width="1.2"/>
      <!-- Glowing portal interior -->
      <rect x="3" y="3" width="22" height="49" fill="${langColor}" opacity="0.25">
        <animate attributeName="opacity" values="0.15; 0.45; 0.15" dur="2s" repeatCount="indefinite"/>
      </rect>
    </g>
  </g>`;
}

/**
 * Campfire & Rest Wilderness (x=696, w=170, baseY=192)
 * Rich campsite with adventure tent, wooden seats, supply packs, hanging lantern,
 * stone-ring fire pit, and multi-layered dancing fire!
 */
function renderCampfireArea(slotX = 696, baseY = 192) {
  return `<!-- Campfire Rest Wilderness Checkpoint (x=${slotX}) -->
  <g id="checkpoint-campfire" transform="translate(${slotX}, ${baseY - 78})">
    <!-- Cozy Canvas Adventure Tent (x=6, y=18) -->
    <polygon points="6,78 44,18 82,78" fill="#151b32" stroke="#00f0ff" stroke-width="1.2"/>
    <polygon points="22,78 44,38 66,78" fill="#080c18"/>
    <!-- Glowing Tent Lantern Interior -->
    <circle cx="44" cy="58" r="10" fill="#ffaa00" opacity="0.2">
      <animate attributeName="opacity" values="0.15; 0.3; 0.15" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <!-- Tent Flagpole & Fluttering Pennant -->
    <line x1="44" y1="18" x2="44" y2="4" stroke="#00f0ff" stroke-width="1.5"/>
    <polygon points="44,4 66,9 44,14" fill="#ff007f">
      <animate attributeName="points" values="44,4 66,9 44,14; 44,4 64,10 44,14; 44,4 66,9 44,14" dur="1.2s" repeatCount="indefinite"/>
    </polygon>
    <text x="47" y="11" font-family="'Courier New', monospace" font-size="5.5px" font-weight="900" fill="#ffffff">CAMP</text>

    <!-- Explorer Supply Crate & Adventurer Backpack (x=76, y=56) -->
    <g transform="translate(74, 54)">
      <!-- Wooden Ration Crate with Iron Straps -->
      <rect x="0" y="8" width="18" height="16" rx="1.5" fill="#2d1c14" stroke="#5a3824" stroke-width="0.8"/>
      <line x1="0" y1="12" x2="18" y2="12" stroke="#442a18" stroke-width="0.8"/>
      <line x1="0" y1="20" x2="18" y2="20" stroke="#442a18" stroke-width="0.8"/>
      <!-- Leather Travel Backpack with Brass Buckle -->
      <rect x="16" y="12" width="12" height="12" rx="3" fill="#3a2418" stroke="#684228" stroke-width="0.8"/>
      <rect x="20" y="10" width="8" height="4" rx="1.5" fill="#22140d"/>
      <circle cx="22" cy="18" r="1" fill="#ffd700"/>
    </g>

    <!-- Hanging Brass Lantern on Crooked Branch Post (x=102, y=34) -->
    <g transform="translate(100, 30)">
      <path d="M 2 48 L 2 12 Q 2 2 12 2 L 18 2" fill="none" stroke="#3d2a1c" stroke-width="2"/>
      <line x1="16" y1="2" x2="16" y2="8" stroke="#ffd700" stroke-width="1"/>
      <!-- Brass Lantern Housing -->
      <rect x="12" y="8" width="8" height="10" rx="1.5" fill="#281a10" stroke="#ffd700" stroke-width="0.8"/>
      <rect x="13.5" y="10" width="5" height="6" fill="#ffcc00"/>
      <!-- Warm Ambient Lantern Glow -->
      <circle cx="16" cy="13" r="14" fill="#ffaa00" opacity="0.12">
        <animate attributeName="r" values="12; 16; 12" dur="1.6s" repeatCount="indefinite"/>
      </circle>
    </g>

    <!-- Warm Multi-Layered Campfire (x=124, y=52) -->
    <g transform="translate(124, 50)">
      <!-- Ground Earth Shadow -->
      <ellipse cx="16" cy="26" rx="20" ry="5" fill="#060408" opacity="0.7"/>

      <!-- Rough-Hewn River Stone Ring -->
      <ellipse cx="16" cy="24" rx="16" ry="5" fill="#1c1622" stroke="#3c3046" stroke-width="1"/>
      <circle cx="4" cy="23" r="3" fill="#2c2234"/>
      <circle cx="10" cy="26" r="3.5" fill="#32263a"/>
      <circle cx="18" cy="27" r="3" fill="#2c2234"/>
      <circle cx="26" cy="24" r="3.5" fill="#32263a"/>
      <circle cx="22" cy="21" r="2.5" fill="#261c2c"/>
      <circle cx="8" cy="21" r="2.5" fill="#261c2c"/>

      <!-- Charred Campfire Firewood Logs -->
      <line x1="6" y1="24" x2="26" y2="20" stroke="#442612" stroke-width="3" stroke-linecap="round"/>
      <line x1="7" y1="19" x2="25" y2="25" stroke="#442612" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="17" x2="16" y2="26" stroke="#2c1608" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Large Warm Pulsating Firelight Glow -->
      <circle cx="16" cy="16" r="36" fill="#ff5500" opacity="0.16">
        <animate attributeName="r" values="32; 42; 34; 44; 32" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.14; 0.22; 0.14" dur="1.2s" repeatCount="indefinite"/>
      </circle>

      <!-- Outer Flame (Deep Crimson/Amber) -->
      <path d="M 8 22 Q 16 2 16 8 Q 16 0 22 10 Q 26 4 24 22 Z" fill="#ff2200">
        <animate attributeName="d" values="
          M 8 22 Q 16 2 16 8 Q 16 0 22 10 Q 26 4 24 22 Z;
          M 8 22 Q 14 0 16 6 Q 18 -2 23 8 Q 26 2 24 22 Z;
          M 8 22 Q 16 2 16 8 Q 16 0 22 10 Q 26 4 24 22 Z" dur="0.55s" repeatCount="indefinite"/>
      </path>

      <!-- Mid Flame (Vibrant Radiant Orange) -->
      <path d="M 10 22 Q 16 6 17 11 Q 17 3 20 12 Q 23 8 22 22 Z" fill="#ff6600">
        <animate attributeName="d" values="
          M 10 22 Q 16 6 17 11 Q 17 3 20 12 Q 23 8 22 22 Z;
          M 10 22 Q 14 4 16 9 Q 18 1 21 10 Q 24 6 22 22 Z;
          M 10 22 Q 16 6 17 11 Q 17 3 20 12 Q 23 8 22 22 Z" dur="0.45s" repeatCount="indefinite"/>
      </path>

      <!-- Inner Flame (Bright Golden Yellow) -->
      <path d="M 12 22 Q 16 10 16 13 Q 17 7 19 14 Q 21 11 20 22 Z" fill="#ffcc00">
        <animate attributeName="d" values="
          M 12 22 Q 16 10 16 13 Q 17 7 19 14 Q 21 11 20 22 Z;
          M 12 22 Q 15 8 16 11 Q 17 5 19 12 Q 20 9 20 22 Z;
          M 12 22 Q 16 10 16 13 Q 17 7 19 14 Q 21 11 20 22 Z" dur="0.38s" repeatCount="indefinite"/>
      </path>

      <!-- White-Hot Core Spark -->
      <ellipse cx="16" cy="20" rx="3.5" ry="5" fill="#ffffff" opacity="0.95">
        <animate attributeName="ry" values="5; 3.5; 5" dur="0.3s" repeatCount="indefinite"/>
      </ellipse>

      <!-- Floating Upward Embers / Sparks -->
      <circle cx="14" cy="14" r="1" fill="#ffd700">
        <animate attributeName="cy" values="14; -6; -20" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="14; 9; 16" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1; 0.8; 0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="19" cy="16" r="1.3" fill="#ffaa00">
        <animate attributeName="cy" values="16; -2; -16" dur="1.4s" begin="0.4s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="19; 24; 18" dur="1.4s" begin="0.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1; 0.8; 0" dur="1.4s" begin="0.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="12" r="0.9" fill="#ff4400">
        <animate attributeName="cy" values="12; -10; -24" dur="2.1s" begin="0.8s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="12; 6; 11" dur="2.1s" begin="0.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1; 0.7; 0" dur="2.1s" begin="0.8s" repeatCount="indefinite"/>
      </circle>
    </g>
  </g>`;
}

/**
 * Static Hub Street with 4 packed door facades + campfire
 */
export function renderHubStreet(stages, timeline, bounds = { width: 890, height: 240, groundY: 192 }) {
  const { width, groundY } = bounds;
  const doorSlots = [
    { x: 16, w: 150 },
    { x: 186, w: 150 },
    { x: 356, w: 150 },
    { x: 526, w: 150 },
  ];

  const facadesSvg = stages.map((stage, idx) => {
    const slot = doorSlots[idx] || { x: 16 + idx * 170, w: 150 };
    return renderDoorFacade(stage, slot.x, slot.w, idx, timeline, groundY);
  }).join('\n');

  const campfireSvg = renderCampfireArea(696, groundY);
  const roadSvg = renderCyberRoad(width, groundY);

  return `<!-- Static Hub Street (No World Translate) -->
  <g id="hub-street">
    ${roadSvg}
    ${facadesSvg}
    ${campfireSvg}
  </g>`;
}

export default {
  renderStars,
  renderShootingStars,
  renderNeonMoon,
  renderParallaxSkyline,
  renderCyberRoad,
  renderHubStreet,
};

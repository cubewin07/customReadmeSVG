import { escapeXml } from '../../../svg/escape.js';
import {
  anim,
  tr,
  rot,
  sc,
  sl,
  sla,
  pulse,
  nightPairs,
} from '../utils/timeline.js';

/**
 * Renders Act 1: The Workstation Desk & Hologram Showcase (0s - 12s).
 * - "Ship-it" story: Live commit typing, bug crawl, electric zap arc, build passed badge, rocket launch with smoke puff rings, confetti shower.
 * - Tactile Cyber Desk Mat with neon edge, RGB chroma underglow, and plasma typing sparks.
 * - Physical metallic hologram projector emitter with pulsing concentric rings.
 * - Pinned repositories hologram with glowing sparkline area fill and repo badges.
 * - Polished character likeness with natural breathing and gesture toward hologram.
 */
export function renderActDesk(data, theme = {}) {
  const accent = theme.accent || '#58a6ff';
  const HX = 352;
  const HY = 176;
  const commitMsg = escapeXml(data.commit || 'feat: add SVG animation engine');

  // Pinned repos fallback
  const repos = data.repos && data.repos.length >= 3
    ? data.repos
    : [
        {
          name: 'customReadmeSVG',
          language: 'JavaScript',
          color: '#f1e05a',
          stars: 32,
          description: 'Dynamic, game-inspired SVG cards',
          sparkline: [2, 4, 3, 6, 5, 8, 7, 9],
        },
        {
          name: 'financial-management',
          language: 'TypeScript',
          color: '#3178c6',
          stars: 18,
          description: 'Full-stack reactive finance platform',
          sparkline: [1, 2, 5, 3, 4, 6, 8, 7],
        },
        {
          name: 'creative-engine',
          language: 'Python',
          color: '#3572A5',
          stars: 14,
          description: 'Algorithmic artwork & visual tools',
          sparkline: [3, 3, 4, 2, 5, 4, 6, 9],
        },
      ];

  // Confetti particles deterministic positions and colors
  const confettiColors = ['#ff6b6b', '#ffd76a', '#58a6ff', '#3fb950', '#bc8cff', '#ff9ed2'];
  const confettiOffsets = [
    [-110, 65, 0.45], [95, 78, 0.6], [-60, 48, 0.5], [115, 92, 0.7],
    [-85, 110, 0.55], [45, 55, 0.4], [-30, 85, 0.65], [70, 105, 0.5],
    [-120, 95, 0.8], [105, 60, 0.45], [-45, 115, 0.6], [85, 45, 0.55],
    [-75, 70, 0.7], [30, 90, 0.5], [-95, 50, 0.65], [60, 120, 0.75],
    [-15, 60, 0.4], [120, 110, 0.6], [-105, 82, 0.7], [50, 75, 0.5],
    [-40, 100, 0.6], [90, 88, 0.65], [-70, 125, 0.75], [15, 110, 0.55],
  ];

  let confettiSvg = '';
  const t0 = 6.4;
  for (let k = 0; k < confettiOffsets.length; k++) {
    const [dx, dy, rotDur] = confettiOffsets[k];
    const col = confettiColors[k % confettiColors.length];
    confettiSvg += `
      <g opacity="0">
        ${anim('opacity', [[t0 - 0.01, 0], [t0, 1], [t0 + 1.2, 1], [t0 + 1.7, 0]])}
        ${tr([
          [t0, 250, 24],
          [t0 + 0.45, Math.round(250 + dx * 0.7), Math.round(24 - 18)],
          [t0 + 1.7, Math.round(250 + dx), Math.round(24 + dy)],
        ])}
        <rect x="-2" y="-3" width="4" height="6" fill="${col}">
          ${sl('rotate', ['0', '360'], rotDur)}
        </rect>
      </g>`;
  }

  // Electric arc zap particles
  let zapParticlesSvg = '';
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + 0.3;
    const destX = Math.round(128 + 20 * Math.cos(a));
    const destY = Math.round(59 + 16 * Math.sin(a));
    zapParticlesSvg += `
      <rect x="-2" y="-2" width="4" height="4" fill="#ff6b6b" opacity="0">
        ${anim('opacity', [[3.58, 0], [3.6, 1], [4.0, 0]])}
        ${tr([[3.6, 128, 59], [4.0, destX, destY]])}
      </rect>`;
  }

  // Pinned repos slides
  const starts = [7.7, 9.0, 10.4];
  const ends = [9.0, 10.4, 11.9];
  let repoSlidesSvg = '';
  for (let k = 0; k < 3; k++) {
    const r = repos[k];
    const a = starts[k];
    const b = ends[k];
    const pts = r.sparkline.map((v, i) => `${(-68 + i * 19.4).toFixed(1)},${(44 - v * 2.2).toFixed(1)}`).join(' ');
    const areaPts = `-68,44 ${pts} ${( -68 + (r.sparkline.length - 1) * 19.4).toFixed(1)},44`;

    repoSlidesSvg += `
      <g opacity="0">
        ${anim('opacity', pulse(a, b - 0.2, 0.25))}
        ${tr([
          [a - 0.01, 14, 0],
          [a, 14, 0],
          [a + 0.3, 0, 0],
          [b - 0.2, 0, 0],
          [b + 0.05, -14, 0],
        ])}
        <!-- Corner Tech Brackets -->
        <path d="M-72 -48 h6 M-72 -48 v6 M72 -48 h-6 M72 -48 v6 M-72 48 h6 M-72 48 v-6 M72 48 h-6 M72 48 v-6" stroke="#4fd1ff" stroke-width="1.2" fill="none"/>
        <text class="m" x="-68" y="-34" font-size="7.5" letter-spacing="1.2" fill="#4fd1ff" opacity="0.9">PINNED REPOSITORY</text>
        <text class="m" x="-68" y="-15" font-size="13.5" font-weight="700" fill="#eaf6ff">${escapeXml(r.name)}</text>
        <text class="t" x="-68" y="0" font-size="9.5" fill="#9fc3d9">${escapeXml(r.description)}</text>
        <circle cx="-64" cy="14" r="4" fill="${r.color}"/>
        <text class="t" x="-56" y="17.5" font-size="10" fill="#cfe9f7">${escapeXml(r.language)}</text>
        <text class="t" x="68" y="17.5" text-anchor="end" font-size="10.5" font-weight="700" fill="#ffd76a">★ ${r.stars}</text>
        <!-- Sparkline Area Glow & Polyline -->
        <polygon points="${areaPts}" fill="url(#holoAreaGrad)"/>
        <polyline points="${pts}" fill="none" stroke="#4fd1ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      <!-- Pagination Dot Indicator -->
      <circle cx="${(k - 1) * 12}" cy="66" r="2.6" fill="#4fd1ff" opacity="0.3">
        ${anim('opacity', [[0, 0.3], [a, 0.3], [a + 0.1, 1], [b - 0.1, 1], [b, 0.3]])}
      </circle>`;
  }

  // Keyboard keycaps matrix with RGB Chroma underglow
  let keycapsSvg = '';
  for (let row = 0; row < 3; row++) {
    for (let kx = 0; kx < 8; kx++) {
      const x = HX - 52 + kx * 13 + row * 1.5;
      const y = 306 + row * 9;
      if ((kx + row) % 2 === 0) {
        keycapsSvg += `<rect x="${x}" y="${y}" width="9" height="5" rx="1" fill="${accent}" opacity="0.25">
          ${sla('opacity', ['.25', '1', '.25'], 0.5, ((kx * 0.1) % 0.5))}
        </rect>`;
      } else {
        keycapsSvg += `<rect x="${x}" y="${y}" width="9" height="5" rx="1" fill="${accent}" opacity="0.25"/>`;
      }
    }
  }

  // Right arm gesture schedule
  const grest = [
    [0, 0],
    [6.9, 0],
    [7.5, -100],
    [8.95, -100],
    [9.05, -86],
    [9.2, -100],
    [10.35, -100],
    [10.45, -86],
    [10.6, -100],
    [11.7, -100],
    [12.4, 0],
  ];

  return `<!-- ============================= ACT 1: DESK & HOLOGRAM (0s - 12s) ============================= -->
  <g>
    ${anim('opacity', [[0, 1], [11.7, 1], [12.4, 0]])}

    <!-- Character Ambient Glow Aura -->
    <circle cx="${HX}" cy="196" r="160" fill="url(#glowGrad)"/>

    <!-- Hero Character Likeness (Standing at Desk) -->
    <g transform="translate(${HX},${HY})">
      <!-- Torso & Black Crew Neck -->
      <path d="M-64 24 Q-64 4 -44 2 L44 2 Q64 4 64 24 L66 132 L-66 132Z" fill="#181b22"/>
      <!-- Collar Rib -->
      <rect x="-30" y="2" width="60" height="7" rx="3" fill="#2d3340"/>
      <!-- Shoulder Seams -->
      <rect x="-66" y="44" width="10" height="88" fill="#14171d"/>
      <rect x="56" y="44" width="10" height="88" fill="#14171d"/>
      <!-- Warm Skin Neck -->
      <rect x="-9" y="-10" width="18" height="16" fill="#e4bb98"/>

      <!-- Head & Voluminous Textured Wavy/Curly Hair with Idle Breathing Bob -->
      <g>
        ${sl('translate', ['0 0', '0 -2', '0 0'], 2.6)}
        <!-- Hair Volume Base -->
        <rect x="-38" y="-86" width="76" height="42" rx="10" fill="#1b1826"/>
        <!-- Face Contour -->
        <rect x="-31" y="-60" width="62" height="56" rx="8" fill="#f2cfae"/>
        <!-- Ears -->
        <rect x="-36" y="-40" width="7" height="14" rx="2" fill="#e4bb98"/>
        <rect x="29" y="-40" width="7" height="14" rx="2" fill="#e4bb98"/>
        <!-- Hair Crown Texture & Waves -->
        <rect x="-34" y="-72" width="68" height="22" rx="7" fill="#221e30"/>
        <rect x="-30" y="-84" width="16" height="15" fill="#262238"/>
        <rect x="-8" y="-90" width="18" height="18" fill="#2a2640"/>
        <rect x="14" y="-84" width="16" height="15" fill="#262238"/>
        <!-- Sideburn Curls -->
        <rect x="-31" y="-56" width="12" height="14" fill="#221e30"/>
        <rect x="19" y="-56" width="12" height="14" fill="#221e30"/>
        <!-- Hair Specular Highlight Swirls -->
        <path d="M-22 -80 Q-15 -84 -8 -80" stroke="#483f60" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M6 -80 Q13 -84 20 -80" stroke="#483f60" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Warm Cheek Highlights -->
        <rect x="-27" y="-24" width="10" height="5" rx="2" fill="#f0a99b" opacity="0.65"/>
        <rect x="17" y="-24" width="10" height="5" rx="2" fill="#f0a99b" opacity="0.65"/>

        <!-- Eyebrows with Dynamic Story Reactions -->
        <rect x="-21" y="-45" width="11" height="3" rx="1.5" fill="#201e28">
          ${anim('y', [[0, -45], [2.0, -45], [2.15, -51], [3.6, -51], [4.1, -46], [12, -46]])}
        </rect>
        <rect x="10" y="-45" width="11" height="3" rx="1.5" fill="#201e28">
          ${anim('y', [[0, -45], [2.0, -45], [2.15, -51], [3.6, -51], [4.1, -46], [12, -46]])}
        </rect>

        <!-- Eyes with Realistic Blinking and Celebratory Wink -->
        <g>
          <!-- Left Eye -->
          <rect x="-19" y="-38" width="8" height="10" rx="2" fill="#2a2230">
            <animate attributeName="height" values="10;10;1;10" keyTimes="0;0.93;0.96;1" dur="4.2s" repeatCount="indefinite"/>
            <animate attributeName="y" values="-38;-38;-29;-38" keyTimes="0;0.93;0.96;1" dur="4.2s" repeatCount="indefinite"/>
          </rect>
          <rect x="-17" y="-37" width="3" height="3" fill="#fff" opacity="0.9"/>

          <!-- Right Eye (with wink at rocket launch 4.6s - 5.4s) -->
          <rect x="11" y="-38" width="8" height="10" rx="2" fill="#2a2230">
            <animate attributeName="height" values="10;10;1;10" keyTimes="0;0.93;0.96;1" dur="4.2s" repeatCount="indefinite"/>
            <animate attributeName="y" values="-38;-38;-29;-38" keyTimes="0;0.93;0.96;1" dur="4.2s" repeatCount="indefinite"/>
            ${anim('height', [[0, 10], [4.5, 10], [4.7, 2], [5.3, 2], [5.5, 10], [12, 10]])}
          </rect>
          <rect x="13" y="-37" width="3" height="3" fill="#fff" opacity="0.9"/>
        </g>

        <!-- Mouth with Story Expressions: Neutral Smile -> Surprised 'O' -> Triumphant Smile -->
        <g>
          <!-- Normal Focused Smile -->
          <path d="M-8 -16 Q0 -9 8 -16" stroke="#a0524a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
          <!-- Surprised 'O' (Active when bug appears 2.05s - 3.6s) -->
          <ellipse cx="0" cy="-14" rx="4.5" ry="5.5" fill="#581e18" stroke="#a0524a" stroke-width="1.8" opacity="0">
            ${anim('opacity', pulse(2.05, 3.6, 0.08))}
          </ellipse>
          <!-- Triumphant Broad Smile (Active during build passed & rocket launch 4.0s - 6.8s) -->
          <path d="M-11 -16 Q0 -4 11 -16 Z" fill="#fff" stroke="#a0524a" stroke-width="2" opacity="0">
            ${anim('opacity', pulse(4.0, 6.8, 0.1))}
          </path>
        </g>
      </g>
    </g>

    <!-- Workstation Desk Surface & Cyber Mat -->
    <polygon points="40,298 544,298 570,366 14,366" fill="url(#deskGrad)" stroke="#2a3140"/>
    <!-- LED Highlight Edge Strip on Desk Rim -->
    <line x1="40" y1="298" x2="544" y2="298" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.65"/>
    <line x1="40" y1="299" x2="544" y2="299" stroke="#fff" stroke-width="0.8" stroke-opacity="0.3"/>

    <!-- Subtle Desk Circuit Glow Etchings -->
    <path d="M48 310 h28 l14 14 h36 M534 310 h-28 l-14 14 h-32" stroke="${accent}" stroke-width="0.8" stroke-opacity="0.2" fill="none"/>

    <!-- Cyber Desk Mat under Keyboard with Stitched Rim & Octocat Decal -->
    <polygon points="${HX - 88},299 ${HX + 88},299 ${HX + 104},346 ${HX - 104},346" fill="url(#deskMatGrad)" stroke="${accent}" stroke-width="1" stroke-opacity="0.35"/>
    <polygon points="${HX - 85},301 ${HX + 85},301 ${HX + 100},344 ${HX - 100},344" fill="none" stroke="${accent}" stroke-width="0.8" stroke-dasharray="2 3" stroke-opacity="0.35"/>

    <!-- Octocat Decal on Desk Mat -->
    <g transform="translate(${HX - 92},332) scale(0.7)" opacity="0.45" fill="${accent}">
      <path d="M0 0 c-2 -4 -6 -4 -6 0 c0 3 2 6 6 8 c4 -2 6 -5 6 -8 c0 -4 -4 -4 -6 0Z"/>
      <circle cx="-2" cy="2" r="0.8" fill="#fff"/>
      <circle cx="2" cy="2" r="0.8" fill="#fff"/>
    </g>

    <!-- Adorable Cyber Droid Desk Companion (x=286, y=286) -->
    <g transform="translate(286,286)">
      <ellipse cx="0" cy="12" rx="14" ry="4" fill="#000" opacity="0.35"/>
      <g>
        ${anim('transform', [
          [0, 'translate(0,0)'],
          [2.05, 'translate(0,0)'],
          [2.15, 'translate(0,-6)'],
          [2.3, 'translate(0,0)'],
          [4.8, 'translate(0,0)'],
          [4.95, 'translate(0,-7)'],
          [5.1, 'translate(0,0)'],
          [5.25, 'translate(0,-5)'],
          [5.4, 'translate(0,0)'],
          [12, 'translate(0,0)'],
        ])}
        <!-- Droid Metallic Chassis -->
        <rect x="-11" y="-8" width="22" height="20" rx="9" fill="#131b26" stroke="#38bdf8" stroke-width="1.3"/>
        <!-- Droid Antenna with Blinking Tip -->
        <line x1="0" y1="-8" x2="0" y2="-15" stroke="#38bdf8" stroke-width="1.2"/>
        <circle cx="0" cy="-16" r="2" fill="#ffd76a">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/>
        </circle>
        <!-- Curved OLED Visor Screen -->
        <rect x="-8" y="-3" width="16" height="9" rx="3.5" fill="#070c14"/>
        <!-- State 1 (0s-2.0s & 6.9s-12s): Happy Idling Cyan Eyes -->
        <g opacity="1">
          ${anim('opacity', [[0, 1], [2.0, 1], [2.05, 0], [4.0, 0], [6.8, 0], [6.9, 1], [12, 1]])}
          <circle cx="-3.5" cy="1.5" r="1.5" fill="#38bdf8"/>
          <circle cx="3.5" cy="1.5" r="1.5" fill="#38bdf8"/>
        </g>
        <!-- State 2 (2.05s-3.8s): Surprised Alert Amber Eyes [!] -->
        <g opacity="0">
          ${anim('opacity', pulse(2.05, 3.8, 0.05))}
          <text class="m" x="0" y="4" text-anchor="middle" font-size="7" font-weight="900" fill="#ffd76a">!!</text>
        </g>
        <!-- State 3 (4.0s-6.8s): Celebratory Happy Arcs [^^] -->
        <g opacity="0">
          ${anim('opacity', pulse(4.0, 6.8, 0.05))}
          <path d="M-5 3 Q-3.5 0 -2 3 M2 3 Q3.5 0 5 3" stroke="#34d399" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        </g>
      </g>
    </g>

    <!-- Succulent Desk Plant in Geometric Obsidian Pot (x=248, y=284) -->
    <g transform="translate(248,284)">
      <ellipse cx="0" cy="12" rx="13" ry="3.5" fill="#000" opacity="0.3"/>
      <polygon points="-11,0 11,0 8,12 -8,12" fill="#151b26" stroke="#253245" stroke-width="1"/>
      <polygon points="-11,0 0,0 0,12 -8,12" fill="#1b2332"/>
      <rect x="-12" y="-2" width="24" height="3" rx="1" fill="#a0523d"/>
      <path d="M0 -2 Q-7 -7 -3 -12 Q0 -7 0 -2" fill="#2ea043"/>
      <path d="M0 -2 Q7 -7 3 -12 Q0 -7 0 -2" fill="#3fb950"/>
      <path d="M0 -2 Q-10 -3 -8 -8 Q-3 -5 0 -2" fill="#238636"/>
      <path d="M0 -2 Q10 -3 8 -8 Q3 -5 0 -2" fill="#56d364"/>
      <circle cx="0" cy="-6" r="3" fill="#3fb950"/>
      <circle cx="0" cy="-6" r="1.2" fill="#ffd76a" opacity="0.8"/>
    </g>

    <!-- Secondary Mini-Display Tablet with Live Visualizer Waves (x=222, y=242) -->
    <g transform="translate(222,242)">
      <rect x="18" y="48" width="6" height="12" rx="2" fill="#111620"/>
      <rect width="42" height="50" rx="4" fill="#0c111a" stroke="#2a3547" stroke-width="1.2"/>
      <rect x="3" y="3" width="36" height="44" rx="2" fill="#06090e"/>
      <text class="m" x="21" y="10" text-anchor="middle" font-size="5" fill="#6e7681">TELEMETRY</text>
      <rect x="6" y="28" width="4" height="14" rx="1" fill="#38bdf8">
        ${sla('height', ['6', '16', '4', '12', '6'], 0.42)}
        ${sla('y', ['36', '26', '38', '30', '36'], 0.42)}
      </rect>
      <rect x="13" y="24" width="4" height="18" rx="1" fill="#34d399">
        ${sla('height', ['10', '20', '8', '16', '10'], 0.38)}
        ${sla('y', ['32', '22', '34', '26', '32'], 0.38)}
      </rect>
      <rect x="20" y="26" width="4" height="16" rx="1" fill="#a78bfa">
        ${sla('height', ['8', '18', '5', '14', '8'], 0.46)}
        ${sla('y', ['34', '24', '37', '28', '34'], 0.46)}
      </rect>
      <rect x="27" y="30" width="4" height="12" rx="1" fill="#ffd76a">
        ${sla('height', ['5', '14', '7', '11', '5'], 0.52)}
        ${sla('y', ['37', '28', '35', '31', '37'], 0.52)}
      </rect>
      <rect x="34" y="28" width="4" height="14" rx="1" fill="#38bdf8">
        ${sla('height', ['7', '15', '4', '13', '7'], 0.36)}
        ${sla('y', ['35', '27', '38', '29', '35'], 0.36)}
      </rect>
    </g>

    <!-- Mechanical Keyboard with Underglow -->
    <ellipse cx="${HX}" cy="344" rx="98" ry="8" fill="${accent}" opacity="0.25"/>
    <polygon points="${HX - 60},300 ${HX + 60},300 ${HX + 76},336 ${HX - 76},336" fill="#0d1520" stroke="${accent}" stroke-width="2"/>
    <g>
      ${anim('opacity', [[0, 1], [6.9, 1], [7.3, 0.3], [11.9, 0.3], [12.4, 1]])}
      ${keycapsSvg}
      <!-- Spacebar -->
      <rect x="${HX - 24}" y="331" width="48" height="4" rx="1.5" fill="${accent}" opacity="0.6"/>
    </g>

    <!-- Plasma Typing Keystroke Sparks -->
    <g opacity="0">
      ${anim('opacity', [[0, 0], [0.5, 0.8], [6.8, 0.8], [7.2, 0], [12.2, 0.8]])}
      <g transform="translate(${HX - 18},312)">
        <circle cx="0" cy="0" r="1.5" fill="${accent}">
          ${sl('translate', ['0 0', '-4 -12'], 1.2)}
          ${sla('opacity', ['1', '0'], 1.2)}
        </circle>
      </g>
      <g transform="translate(${HX + 16},314)">
        <circle cx="0" cy="0" r="1.5" fill="#38c9a0">
          ${sl('translate', ['0 0', '6 -14'], 1.4, 0.3)}
          ${sla('opacity', ['1', '0'], 1.4, 0.3)}
        </circle>
      </g>
    </g>

    <!-- Physical Metallic Hologram Projector Emitter Base on Desk -->
    <g transform="translate(410,299)">
      <g>
        ${anim('opacity', [[0, 0.4], [7.0, 1], [11.9, 1], [12.4, 0.4]])}
        <!-- Metal Puck -->
        <ellipse cx="0" cy="1" rx="20" ry="5.5" fill="#182230" stroke="#38bdf8" stroke-width="1.2"/>
        <!-- Glowing Cyan Emitter Lens -->
        <ellipse cx="0" cy="0" rx="14" ry="4" fill="#4fd1ff"/>
        <!-- Pulsing Optical Lens Core -->
        <ellipse cx="0" cy="0" rx="6" ry="2" fill="#fff"/>
      </g>
    </g>

    <!-- Hologram Projection Beam with Energy Cone -->
    <g>
      ${anim('opacity', [[0, 0], [7.0, 0], [7.5, 1], [11.9, 1], [12.4, 0]])}
      <polygon points="392,300 428,300 574,162 426,162" fill="url(#beamGrad)"/>
      <!-- Concentric Energy Wave Rings -->
      <ellipse cx="440" cy="245" rx="36" ry="10" fill="none" stroke="#4fd1ff" stroke-width="1.2" opacity="0.45"/>
      <ellipse cx="475" cy="205" rx="55" ry="14" fill="none" stroke="#4fd1ff" stroke-width="1.2" opacity="0.3"/>
    </g>

    <!-- Desk Lamp with Cohesive Volumetric Beam -->
    <polygon points="552,258 568,262 600,300 522,300" fill="url(#lampGrad)" opacity="0">
      ${anim('opacity', nightPairs(0.95))}
    </polygon>
    <rect x="524" y="292" width="22" height="6" rx="2" fill="#2a3140"/>
    <polyline points="535,292 535,262 552,246" stroke="#566073" stroke-width="3" fill="none"/>
    <polygon points="545,238 568,248 560,260 538,250" fill="#3a4557"/>
    <circle cx="553" cy="255" r="5" fill="#ffd76a" opacity="0">
      ${anim('opacity', nightPairs())}
    </circle>

    <!-- Coffee Mug with Coaster, Reflection, and Liquid Refill -->
    <g transform="translate(466,272)">
      <!-- Coaster -->
      <ellipse cx="13" cy="28" rx="18" ry="4.5" fill="#0f1622" stroke="#253142" stroke-width="1"/>
      <!-- Ceramic Cup Body & Handle -->
      <rect x="0" y="0" width="26" height="28" rx="4" fill="#0f1b2b" stroke="${accent}" stroke-width="2"/>
      <path d="M26 6 h6 a5 5 0 0 1 0 14 h-6" stroke="${accent}" stroke-width="2" fill="none"/>
      <!-- Ceramic Gloss Highlight -->
      <line x1="3" y1="2" x2="3" y2="26" stroke="#fff" stroke-opacity="0.25" stroke-linecap="round"/>
      <!-- Liquid Level Animated Refill -->
      <rect x="2" y="20" width="22" height="6" fill="#7a4a2b">
        ${anim('y', [[0, 20], [6.0, 20], [6.9, 4], [23.5, 4], [24, 20]])}
        ${anim('height', [[0, 6], [6.0, 6], [6.9, 22], [23.5, 22], [24, 6]])}
      </rect>
      <!-- Mug Developer Emblem -->
      <text class="m" x="13" y="20" text-anchor="middle" font-size="8" font-weight="700" fill="#3fb950">&lt;/&gt;</text>
      <!-- Pouring Coffee Stream -->
      <g opacity="0">
        ${anim('opacity', pulse(5.95, 6.9, 0.05))}
        <circle cx="13" r="2.4" fill="#7a4a2b">
          ${sla('cy', ['-50', '3'], 0.38)}
        </circle>
      </g>
      <!-- Rising Steaming Ribbons -->
      <g>
        ${anim('opacity', [[0, 0.35], [6.9, 0.35], [7.4, 1], [12, 1]])}
        <g transform="translate(7,-4)">
          <path d="M0 0 c-4 -6 4 -10 0 -16" stroke="#a9b7c6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0">
            ${sla('opacity', ['0', '.6', '0'], 2.4, 0)}
            ${sl('translate', ['0 0', '0 -9'], 2.4, 0)}
          </path>
        </g>
        <g transform="translate(13,-4)">
          <path d="M0 0 c-4 -6 4 -10 0 -16" stroke="#a9b7c6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0">
            ${sla('opacity', ['0', '.6', '0'], 2.4, 0.7)}
            ${sl('translate', ['0 0', '0 -9'], 2.4, 0.7)}
          </path>
        </g>
        <g transform="translate(19,-4)">
          <path d="M0 0 c-4 -6 4 -10 0 -16" stroke="#a9b7c6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0">
            ${sla('opacity', ['0', '.6', '0'], 2.4, 1.4)}
            ${sl('translate', ['0 0', '0 -9'], 2.4, 1.4)}
          </path>
        </g>
      </g>
    </g>

    <!-- Left Workstation Monitor Display -->
    <g transform="translate(24,150)">
      <!-- Stand -->
      <rect x="94" y="122" width="28" height="18" fill="#161c26"/>
      <rect x="72" y="138" width="72" height="7" rx="3" fill="#1c2430"/>
      <!-- Monitor Chassis & Screen -->
      <rect width="216" height="124" rx="10" fill="#0e131a" stroke="#2c3442" stroke-width="2"/>
      <rect x="8" y="8" width="200" height="108" rx="6" fill="#090c12"/>
      <!-- Window Controls -->
      <circle cx="19" cy="17" r="2.6" fill="#ff5f56"/>
      <circle cx="28" cy="17" r="2.6" fill="#ffbd2e"/>
      <circle cx="37" cy="17" r="2.6" fill="#27c93f"/>
      <text class="m" x="108" y="20" text-anchor="middle" font-size="8.5" fill="#6e7681">editor.js</text>

      <!-- Code Syntax Lines -->
      <g opacity="0">
        ${anim('opacity', [[0.35, 0], [0.5, 1]])}
        <rect x="16" y="34" width="46" height="5" rx="2.5" fill="#58a6ff"/>
        <rect x="67" y="34" width="30" height="5" rx="2.5" fill="#bc8cff" opacity="0.7"/>
      </g>
      <g opacity="0">
        ${anim('opacity', [[0.65, 0], [0.8, 1]])}
        <rect x="16" y="45" width="26" height="5" rx="2.5" fill="#3fb950"/>
        <rect x="47" y="45" width="62" height="5" rx="2.5" fill="#3fb950" opacity="0.7"/>
      </g>
      <g opacity="0">
        ${anim('opacity', [[0.95, 0], [1.1, 1]])}
        <rect x="28" y="56" width="58" height="5" rx="2.5" fill="#f0883e"/>
        <rect x="91" y="56" width="24" height="5" rx="2.5" fill="#8b949e" opacity="0.7"/>
      </g>
      <g opacity="0">
        ${anim('opacity', [[1.25, 0], [1.4, 1]])}
        <rect x="16" y="67" width="40" height="5" rx="2.5" fill="#58a6ff"/>
        <rect x="61" y="67" width="34" height="5" rx="2.5" fill="#e6edf3" opacity="0.7"/>
      </g>

      <!-- Lower Terminal Pane with Live Commit -->
      <rect x="8" y="80" width="200" height="36" fill="#06090e"/>
      <text class="m" x="15" y="93" font-size="8.5" fill="#6e7681">$ git log -1 --oneline</text>
      <!-- Typing Clip Path -->
      <clipPath id="cm">
        <rect x="12" y="97" width="0" height="14">
          ${anim('width', [[0, 0], [0.6, 0], [2.0, 190], [11.5, 190], [12, 0]])}
        </rect>
      </clipPath>
      <text class="m" x="15" y="108" font-size="9.5" font-weight="700" fill="#e6edf3" clip-path="url(#cm)">
        <tspan fill="#3fb950">▸ </tspan>${commitMsg}
      </text>

      <!-- Crawling Bug (2.0s - 3.6s) -->
      <g opacity="0">
        ${anim('opacity', [[2.0, 0], [2.1, 1], [3.55, 1], [3.6, 0]])}
        ${tr([[2.0, 24, 59], [2.05, 24, 59], [2.6, 66, 61], [3.1, 98, 57], [3.6, 128, 59]])}
        <g>
          ${sl('translate', ['0 0', '0 -1', '0 0'], 0.16)}
          <!-- Bug Body -->
          <rect x="-6" y="-3.5" width="12" height="7" rx="3.5" fill="#ff6b6b"/>
          <circle cx="7" cy="0" r="3.2" fill="#ff8585"/>
          <!-- Bug Legs & Antennae -->
          <path d="M-3 -3.5 l-2 -3 M1 -3.5 l0 -4 M-3 3.5 l-2 3 M1 3.5 l0 4 M8 -2 l3 -3 M8 2 l3 3" stroke="#ff6b6b" stroke-width="1.2"/>
        </g>
      </g>

      <!-- Electric Bug Zap Shockwave -->
      <circle cx="128" cy="59" r="2" fill="none" stroke="#ffd76a" stroke-width="2" opacity="0">
        ${anim('r', [[3.59, 2], [4.0, 22]])}
        ${anim('opacity', [[3.58, 0], [3.6, 1], [4.0, 0]])}
      </circle>
      <circle cx="128" cy="59" r="2" fill="none" stroke="#38bdf8" stroke-width="1.2" opacity="0">
        ${anim('r', [[3.59, 1], [4.0, 28]])}
        ${anim('opacity', [[3.58, 0], [3.6, 0.8], [4.0, 0]])}
      </circle>
      <!-- Debris -->
      ${zapParticlesSvg}

      <!-- Build Passed Badge -->
      <g opacity="0">
        ${anim('opacity', [[4.0, 0], [4.2, 1]])}
        ${tr([[4.0, 0, 6], [4.25, 0, 0]])}
        <rect x="118" y="26" width="86" height="19" rx="9.5" fill="#0f2a1a" stroke="#3fb950"/>
        <text class="m" x="161" y="39" text-anchor="middle" font-size="9" font-weight="700" fill="#3fb950">✔ build passed</text>
      </g>
    </g>

    <!-- Character Arms (Front of Desk Layer) -->
    <g transform="translate(${HX},${HY})">
      <!-- Left Typing Arm -->
      <rect x="-74" y="14" width="24" height="56" rx="11" fill="#181b22"/>
      <g>
        ${sl('rotate', ['-20 -62 66', '-28 -62 66', '-20 -62 66'], 0.34)}
        <rect x="-71" y="60" width="18" height="64" rx="8" fill="#f2cfae"/>
        <rect x="-73" y="116" width="22" height="16" rx="6" fill="#f2cfae"/>
      </g>

      <!-- Right Arm: Typing -> Gesturing to Hologram -->
      <g>
        ${rot(grest, 62, 22)}
        <rect x="50" y="14" width="24" height="56" rx="11" fill="#181b22"/>
        <g>
          ${rot([[0, 20], [6.9, 20], [7.6, 0], [11.7, 0], [12.4, 20]], 62, 66)}
          ${sl('rotate', ['0 62 66', '7 62 66', '0 62 66'], 0.34, 0, true)}
          <rect x="53" y="60" width="18" height="64" rx="8" fill="#f2cfae"/>
          <rect x="51" y="116" width="22" height="16" rx="6" fill="#f2cfae"/>
        </g>
      </g>
    </g>

    <!-- "!" Surprise Alert Overhead -->
    <text class="t" x="${HX}" y="76" text-anchor="middle" font-size="30" font-weight="900" fill="#ffd76a" opacity="0">
      ${anim('opacity', [[2.05, 0], [2.15, 1], [3.0, 1], [3.2, 0]])}
      ${tr([[2.05, 0, 6], [2.2, 0, -2], [3.2, 0, -8]])}!
    </text>

    <!-- Floating Pinned Repos Hologram HUD -->
    <g transform="translate(500,108)">
      <g>
        ${anim('opacity', [[0, 0], [7.0, 0], [7.3, 1], [11.9, 1], [12.4, 0]])}
        ${sc([[0, 0, 0], [7.0, 0, 0], [7.6, 1, 1]])}
        <g>
          ${sl('translate', ['0 0', '0 -3', '0 0'], 3.2)}
          <!-- Hologram Glass Card Frame -->
          <rect x="-76" y="-52" width="152" height="104" rx="8" fill="#0c2233" fill-opacity="0.68" stroke="#4fd1ff" stroke-width="1.5"/>
          <!-- Moving Laser Scanline -->
          <rect x="-76" y="-52" width="152" height="3" fill="#4fd1ff" opacity="0.35">
            ${sla('y', ['-50', '48'], 1.8)}
          </rect>
          <!-- Carousel Slides -->
          ${repoSlidesSvg}
        </g>
      </g>
    </g>

    <!-- Launching Rocket Ship with Launch Clouds -->
    <g opacity="0">
      ${anim('opacity', [[4.7, 0], [4.85, 1], [6.3, 1], [6.45, 0]])}
      ${tr([[4.8, 244, 262], [5.2, 244, 232], [6.4, 250, 24], [6.5, 250, -40]])}
      <!-- Launch Cloud Rings Expanding -->
      <circle cx="0" cy="18" r="6" fill="#fff" opacity="0.4">
        ${anim('r', [[4.8, 4], [5.3, 18]])}
        ${anim('opacity', [[4.8, 0.5], [5.3, 0]])}
      </circle>
      <!-- Exhaust Trail -->
      <rect x="-1.5" y="8" width="3" height="46" fill="url(#rocketTrailGrad)"/>
      <!-- Fins -->
      <polygon points="-5,2 -11,12 -5,9" fill="#ff6b6b"/>
      <polygon points="5,2 11,12 5,9" fill="#ff6b6b"/>
      <!-- Fuselage -->
      <rect x="-5.5" y="-14" width="11" height="22" rx="4.5" fill="#e6edf3"/>
      <!-- Nose Cone -->
      <polygon points="-5.5,-11 0,-24 5.5,-11" fill="#ff6b6b"/>
      <circle cx="0" cy="-3" r="2.8" fill="#58a6ff"/>
      <!-- Rocket Engine Flame -->
      <g transform="translate(0,8)">
        <g>
          ${sl('scale', ['1 1', '1 1.5', '1 .9', '1 1'], 0.18)}
          <polygon points="-4,0 0,13 4,0" fill="#ffb347"/>
        </g>
      </g>
    </g>

    <!-- Confetti Shower Explosion -->
    ${confettiSvg}

    <!-- CLI Step Prompt HUD -->
    <text class="m" x="20" y="27" font-size="11" fill="#7d8590" opacity="0">
      ${anim('opacity', pulse(0, 6.9))}&gt; ship_it.sh
    </text>
    <text class="m" x="20" y="27" font-size="11" fill="#7d8590" opacity="0">
      ${anim('opacity', pulse(7.0, 11.9))}&gt; pinned --repos
    </text>
  </g>`;
}

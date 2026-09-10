/**
 * Interior Template: The Hardware / Observatory Lab (Archetype: 'lab')
 *
 * Full 890x240 interior scene:
 * - 2-floor structure with stairs leading from y=192 to mezzanine at y=126
 * - Rooftop satellite observatory dish with radar sweep
 * - CPU/RAM hardware monitor gauges (or CRT terminal)
 * - Glowing collectable language orb of paint.langColor
 * - Scan sensor door frame
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.7
 */

import { escapeXml } from '../../../svg/escape.js';

export function renderLabInterior(stage, bounds = { width: 890, height: 240, groundY: 192 }) {
  const { paint } = stage;
  const { width, height, groundY } = bounds;
  const langColor = paint.langColor || '#00f0ff';
  const repoName = escapeXml(paint.name || 'OBSERVATORY');
  const langName = escapeXml(paint.lang || 'Swift');
  const widget = paint.widget || 'gauges';

  // Widget panel: CPU & Memory gauges if gauges, else CRT terminal
  const widgetSvg = widget === 'gauges'
    ? `<!-- Hardware Gauges Panel -->
      <g id="lab-gauges" transform="translate(680, 50)">
        <rect width="160" height="74" rx="4" fill="#080c1a" stroke="#00f0ff" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="16" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#00f0ff">SYS-MON // IOKIT</text>
        <!-- CPU Gauge -->
        <text x="12" y="32" font-family="'Courier New', monospace" font-size="8px" fill="#8899bb">CPU LOAD 38%</text>
        <rect x="12" y="36" width="136" height="5" rx="2" fill="#141c30"/>
        <rect x="12" y="36" width="52" height="5" rx="2" fill="#00f0ff">
          <animate attributeName="width" values="52; 98; 40; 75; 52" dur="3s" repeatCount="indefinite"/>
        </rect>
        <!-- RAM Gauge -->
        <text x="12" y="55" font-family="'Courier New', monospace" font-size="8px" fill="#8899bb">RAM 12.4 / 16 GB</text>
        <rect x="12" y="60" width="136" height="5" rx="2" fill="#141c30"/>
        <rect x="12" y="60" width="105" height="5" rx="2" fill="#ff007f">
          <animate attributeName="width" values="105; 118; 95; 112; 105" dur="4.2s" repeatCount="indefinite"/>
        </rect>
      </g>`
    : `<!-- CRT Terminal Panel -->
      <g id="lab-terminal" transform="translate(680, 50)">
        <rect width="160" height="74" rx="4" fill="#060914" stroke="#00ff88" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="16" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#00ff88">>_ KERNEL LOG</text>
        <text x="12" y="30" font-family="'Courier New', monospace" font-size="7.5px" fill="#55cc77">[OK] mount nvme0s1</text>
        <text x="12" y="42" font-family="'Courier New', monospace" font-size="7.5px" fill="#55cc77">[OK] sysctl hw.perf</text>
        <text x="12" y="54" font-family="'Courier New', monospace" font-size="7.5px" fill="#00f0ff">> pulse 60.00 Hz</text>
        <rect x="12" y="62" width="6" height="2" fill="#00ff88">
          <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/>
        </rect>
      </g>`;

  return `<!-- Interior Archetype: Lab (890x240) -->
  <g class="interior-archetype-lab">
    <!-- Room Shell -->
    <rect width="${width}" height="${height}" fill="#080b18"/>
    <!-- Cyber Grid Ceiling & Wall Conduits -->
    <line x1="0" y1="40" x2="${width}" y2="40" stroke="#161c36" stroke-width="1"/>
    <line x1="0" y1="80" x2="${width}" y2="80" stroke="#161c36" stroke-width="1"/>
    <line x1="0" y1="126" x2="${width}" y2="126" stroke="#1c2448" stroke-width="2"/>
    <line x1="0" y1="${groundY}" x2="${width}" y2="${groundY}" stroke="#283566" stroke-width="3"/>
    <rect y="${groundY}" width="${width}" height="${height - groundY}" fill="#04060d"/>

    <!-- Mezzanine Floor & Support Beams -->
    <rect x="300" y="126" width="360" height="8" rx="2" fill="#182244" stroke="#00f0ff" stroke-width="0.8"/>
    <line x1="380" y1="134" x2="380" y2="${groundY}" stroke="#182244" stroke-width="3"/>
    <line x1="580" y1="134" x2="580" y2="${groundY}" stroke="#182244" stroke-width="3"/>
    <!-- Guard Railing -->
    <line x1="300" y1="114" x2="660" y2="114" stroke="#00f0ff" stroke-width="0.7" opacity="0.6"/>
    <line x1="340" y1="114" x2="340" y2="126" stroke="#00f0ff" stroke-width="0.7" opacity="0.6"/>
    <line x1="420" y1="114" x2="420" y2="126" stroke="#00f0ff" stroke-width="0.7" opacity="0.6"/>
    <line x1="500" y1="114" x2="500" y2="126" stroke="#00f0ff" stroke-width="0.7" opacity="0.6"/>
    <line x1="580" y1="114" x2="580" y2="126" stroke="#00f0ff" stroke-width="0.7" opacity="0.6"/>

    <!-- Staircase (x=160 to x=300) -->
    <path d="M 160 ${groundY} L 195 ${groundY} L 195 174 L 230 174 L 230 150 L 265 150 L 265 126 L 300 126" fill="none" stroke="#00f0ff" stroke-width="2.5"/>
    <path d="M 160 ${groundY} L 300 126 L 300 ${groundY} Z" fill="#0d142a" opacity="0.7"/>

    <!-- Entrance Door Scanner Frame (Left) -->
    <g id="lab-door-entrance" transform="translate(40, 122)">
      <rect x="0" y="0" width="46" height="70" rx="3" fill="#070b16" stroke="#00f0ff" stroke-width="1.5"/>
      <line x1="23" y1="0" x2="23" y2="70" stroke="#00f0ff" stroke-width="0.8" stroke-dasharray="2 2"/>
      <!-- Scan Beam Pulse -->
      <line x1="2" y1="10" x2="44" y2="10" stroke="#00f0ff" stroke-width="2" opacity="0.8">
        <animate attributeName="y1" values="4; 66; 4" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="4; 66; 4" dur="2.4s" repeatCount="indefinite"/>
      </line>
    </g>

    <!-- Rooftop Satellite Dish & Signals (Top Center) -->
    <g id="lab-satellite" transform="translate(480, 24)">
      <path d="M 10 32 Q 30 10 50 32" fill="none" stroke="#00f0ff" stroke-width="2.5"/>
      <line x1="30" y1="21" x2="42" y2="10" stroke="#ff007f" stroke-width="1.8"/>
      <circle cx="42" cy="10" r="3" fill="#ff007f"/>
      <line x1="30" y1="21" x2="30" y2="40" stroke="#253566" stroke-width="2.5"/>
      <!-- Broadcast Arcs -->
      <path d="M 44 4 Q 52 10 44 16" fill="none" stroke="#00f0ff" stroke-width="1.2" opacity="0">
        <animate attributeName="opacity" values="0; 1; 0" dur="1.8s" repeatCount="indefinite"/>
      </path>
      <path d="M 49 -2 Q 60 10 49 22" fill="none" stroke="#00f0ff" stroke-width="1.2" opacity="0">
        <animate attributeName="opacity" values="0; 1; 0" dur="1.8s" begin="0.3s" repeatCount="indefinite"/>
      </path>
    </g>

    <!-- Side Widget Panel -->
    ${widgetSvg}

    <!-- Wall Plate: Repo Identification Marquee -->
    <g id="lab-marquee" transform="translate(260, 18)">
      <rect x="0" y="0" width="190" height="22" rx="4" fill="#080e22" stroke="${langColor}" stroke-width="1.2"/>
      <circle cx="12" cy="11" r="4" fill="${langColor}"/>
      <text x="24" y="14.5" font-family="'Courier New', monospace" font-size="10px" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${repoName}
      </text>
      <rect x="145" y="3" width="40" height="16" rx="3" fill="${langColor}" opacity="0.25"/>
      <text x="165" y="14" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="8px" font-weight="800" fill="${langColor}">
        ${langName}
      </text>
    </g>

    <!-- High Observatory Objective: Language Skill Orb -->
    <g id="lab-target-orb" transform="translate(560, 68)">
      <!-- Animated hover float -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="2.4s" repeatCount="indefinite"/>
        <!-- Glow halo -->
        <circle cx="0" cy="0" r="18" fill="${langColor}" opacity="0.18">
          <animate attributeName="r" values="16; 22; 16" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="0" cy="0" r="10" fill="${langColor}" opacity="0.4"/>
        <circle cx="0" cy="0" r="6" fill="#ffffff"/>
        <!-- Sparkle runes -->
        <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="${langColor}" opacity="0.75"/>
      </g>
    </g>
  </g>`;
}

export default renderLabInterior;

/**
 * Interior Template: The Vector Graphics Forge (Archetype: 'forge')
 *
 * Full 890x240 interior scene:
 * - Industrial chimney with animated flying glowing embers
 * - Horizontal laser drafting beam sweeping at walking height (y=168)
 * - Central heavy blacksmith/cyber anvil workstation (x=440) where clone stamp is taught
 * - Oscilloscope / laser drafting table
 * - Collectable language orb of paint.langColor
 * - Dash & clone gating
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.7
 */

import { escapeXml } from '../../../svg/escape.js';

export function renderForgeInterior(stage, bounds = { width: 890, height: 240, groundY: 192 }) {
  const { paint } = stage;
  const { width, height, groundY } = bounds;
  const langColor = paint.langColor || '#f1e05a';
  const repoName = escapeXml(paint.name || 'VECTOR FORGE');
  const langName = escapeXml(paint.lang || 'SVG/SMIL');
  const widget = paint.widget || 'laser';

  // Laser drafting board widget
  const widgetSvg = widget === 'laser'
    ? `<!-- Oscilloscope / Sine Wave Drafting Panel -->
      <g id="forge-oscilloscope" transform="translate(670, 36)">
        <rect width="170" height="78" rx="4" fill="#080816" stroke="#ff007f" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="15" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#ff007f">VECTOR // SINE WAVE</text>
        <!-- Sine Wave Grid -->
        <line x1="12" y1="46" x2="158" y2="46" stroke="#221133" stroke-width="1"/>
        <path d="M 16 46 Q 30 18 44 46 T 72 46 T 100 46 T 128 46 T 156 46" fill="none" stroke="#00f0ff" stroke-width="1.8">
          <animate attributeName="d" values="
            M 16 46 Q 30 18 44 46 T 72 46 T 100 46 T 128 46 T 156 46;
            M 16 46 Q 30 74 44 46 T 72 46 T 100 46 T 128 46 T 156 46;
            M 16 46 Q 30 18 44 46 T 72 46 T 100 46 T 128 46 T 156 46" dur="3s" repeatCount="indefinite"/>
        </path>
      </g>`
    : `<!-- Forge Status Monitor -->
      <g id="forge-status" transform="translate(670, 36)">
        <rect width="170" height="78" rx="4" fill="#080816" stroke="#ff5500" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="15" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#ff5500">CORE // HEAT 1450 C</text>
        <text x="12" y="32" font-family="'Courier New', monospace" font-size="8px" fill="#ffaa00">SMIL ENGINE: OPTIMAL</text>
        <text x="12" y="46" font-family="'Courier New', monospace" font-size="8px" fill="#00f0ff">ZERO RUNTIME REQS</text>
      </g>`;

  return `<!-- Interior Archetype: Forge (890x240) -->
  <g class="interior-archetype-forge">
    <!-- Dark Industrial Chamber -->
    <rect width="${width}" height="${height}" fill="#0d0914"/>
    <!-- Floor & Heat Grid -->
    <line x1="0" y1="60" x2="${width}" y2="60" stroke="#261833" stroke-width="1"/>
    <line x1="0" y1="120" x2="${width}" y2="120" stroke="#261833" stroke-width="1"/>
    <line x1="0" y1="${groundY}" x2="${width}" y2="${groundY}" stroke="#ff5500" stroke-width="2.5"/>
    <rect y="${groundY}" width="${width}" height="${height - groundY}" fill="#06040a"/>

    <!-- Smoking Chimney & Furnace Vent (Left: x=100) -->
    <g id="forge-chimney" transform="translate(90, 20)">
      <rect x="0" y="20" width="34" height="${groundY - 40}" fill="#1c1226" stroke="#ff5500" stroke-width="1"/>
      <rect x="-4" y="14" width="42" height="6" rx="2" fill="#2d1d3d"/>
      <!-- Glowing Molten Vent slit -->
      <rect x="6" y="100" width="22" height="30" rx="3" fill="#ff3300" opacity="0.85">
        <animate attributeName="opacity" values="0.65; 0.95; 0.65" dur="1.5s" repeatCount="indefinite"/>
      </rect>
      <!-- Flying Sparks / Embers -->
      <circle cx="12" cy="8" r="1.5" fill="#ffaa00">
        <animate attributeName="cy" values="8; -14; -30" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="12; 6; 16" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1; 0.8; 0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="22" cy="10" r="1.2" fill="#ff3300">
        <animate attributeName="cy" values="10; -10; -24" dur="1.4s" begin="0.4s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="22; 28; 20" dur="1.4s" begin="0.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1; 0.8; 0" dur="1.4s" begin="0.4s" repeatCount="indefinite"/>
      </circle>
    </g>

    <!-- Hazard Laser Gate (At Walking Height: y=168, x=130 to x=360) -->
    <g id="forge-hazard-laser">
      <!-- Emitter Tower -->
      <rect x="135" y="145" width="8" height="47" fill="#251636" stroke="#ff007f" stroke-width="1"/>
      <circle cx="139" cy="168" r="4" fill="#ff007f"/>
      <!-- Laser Beam (Fox dashes beneath this) -->
      <line x1="143" y1="168" x2="350" y2="168" stroke="#ff007f" stroke-width="3" stroke-linecap="round" opacity="0.9">
        <animate attributeName="opacity" values="0.9; 0.4; 0.9" dur="0.8s" repeatCount="indefinite"/>
      </line>
      <!-- Laser Receiver -->
      <rect x="350" y="145" width="8" height="47" fill="#251636" stroke="#ff007f" stroke-width="1"/>
      <circle cx="354" cy="168" r="4" fill="#ff007f"/>
    </g>

    <!-- Cyber Blacksmith Anvil Workstation (Center: x=440) -->
    <g id="forge-anvil" transform="translate(440, ${groundY - 32})">
      <!-- Pedestal & Horn -->
      <rect x="-14" y="14" width="28" height="18" fill="#221833" stroke="#554466" stroke-width="1"/>
      <path d="M -22 6 L 22 6 L 16 14 L -16 14 Z" fill="#3a2855" stroke="#775599" stroke-width="1"/>
      <path d="M -22 6 L -32 9 L -22 12 Z" fill="#ff5500"/>
      <!-- Holographic Clone Blueprint Spark -->
      <g transform="translate(0, -12)">
        <circle cx="0" cy="0" r="10" fill="#00f0ff" opacity="0.15">
          <animate attributeName="r" values="8; 14; 8" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <polygon points="0,-8 6,0 0,8 -6,0" fill="none" stroke="#00f0ff" stroke-width="1.2">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite"/>
        </polygon>
      </g>
    </g>

    <!-- Wall Plate: Repo Identification Marquee -->
    <g id="forge-marquee" transform="translate(260, 18)">
      <rect x="0" y="0" width="190" height="22" rx="4" fill="#150f22" stroke="#ff5500" stroke-width="1.2"/>
      <circle cx="12" cy="11" r="4" fill="#ff5500"/>
      <text x="24" y="14.5" font-family="'Courier New', monospace" font-size="10px" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${repoName}
      </text>
      <rect x="145" y="3" width="40" height="16" rx="3" fill="#ff5500" opacity="0.25"/>
      <text x="165" y="14" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="8px" font-weight="800" fill="#ffaa00">
        ${langName}
      </text>
    </g>

    <!-- Side Widget Panel -->
    ${widgetSvg}

    <!-- Forge Crucible & Collectable Skill Orb (Right: x=720, y=100) -->
    <g id="forge-crucible" transform="translate(720, 100)">
      <!-- Suspended Crane Chain -->
      <line x1="0" y1="-80" x2="0" y2="-12" stroke="#553366" stroke-width="2" stroke-dasharray="3 3"/>
      <!-- Skill Orb -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2s" repeatCount="indefinite"/>
        <circle cx="0" cy="0" r="16" fill="${langColor}" opacity="0.25">
          <animate attributeName="r" values="14; 20; 14" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="0" cy="0" r="9" fill="${langColor}" opacity="0.8"/>
        <circle cx="0" cy="0" r="5" fill="#ffffff"/>
      </g>
    </g>
  </g>`;
}

export default renderForgeInterior;

/**
 * Interior Template: The Async Server Tower (Archetype: 'tower')
 *
 * Full 890x240 interior scene:
 * - Dual tall server racks with blinking activity LEDs
 * - Floor pressure plate switch (clone holds switch)
 * - Vertical climbable conduit ladder ascending to ceiling gantry
 * - High suspended data bridge with glowing collectable language orb
 * - Clone & climb gating
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.7
 */

import { escapeXml } from '../../../svg/escape.js';

export function renderTowerInterior(stage, bounds = { width: 890, height: 240, groundY: 192 }) {
  const { paint } = stage;
  const { width, height, groundY } = bounds;
  const langColor = paint.langColor || '#00ADD8';
  const repoName = escapeXml(paint.name || 'SERVER TOWER');
  const langName = escapeXml(paint.lang || 'Async/C#');
  const widget = paint.widget || 'leds';

  // Blinking LEDs matrix generator for server racks
  const generateServerLeds = (startX, startY, count = 18) => {
    const leds = [];
    for (let i = 0; i < count; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * 12;
      const y = startY + row * 10;
      const color = i % 4 === 0 ? '#ff007f' : i % 3 === 0 ? '#ffd700' : '#00ff88';
      const dur = (0.5 + (i % 5) * 0.3).toFixed(1);
      leds.push(`<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="0.8">
        <animate attributeName="opacity" values="0.2; 1; 0.2" dur="${dur}s" repeatCount="indefinite"/>
      </circle>`);
    }
    return leds.join('');
  };

  const leftLeds = generateServerLeds(152, 70, 24);
  const rightLeds = generateServerLeds(572, 70, 24);

  // Widget panel
  const widgetSvg = widget === 'leds'
    ? `<!-- Server Status Terminal -->
      <g id="tower-server-mon" transform="translate(680, 36)">
        <rect width="160" height="78" rx="4" fill="#060b14" stroke="#00ff88" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="15" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#00ff88">>_ ASYNC THREADS</text>
        <text x="12" y="32" font-family="'Courier New', monospace" font-size="8px" fill="#77dd99">TASK [0]: RUNNING</text>
        <text x="12" y="46" font-family="'Courier New', monospace" font-size="8px" fill="#77dd99">TASK [1]: AWAIT LOCK</text>
        <text x="12" y="60" font-family="'Courier New', monospace" font-size="8px" fill="#00f0ff">CHANNEL: ACTIVE (0ms)</text>
      </g>`
    : `<!-- Network Traffic Panel -->
      <g id="tower-traffic" transform="translate(680, 36)">
        <rect width="160" height="78" rx="4" fill="#060b14" stroke="#00ADD8" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="15" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#00ADD8">>_ NETWORK PACKETS</text>
        <text x="12" y="32" font-family="'Courier New', monospace" font-size="8px" fill="#88ccff">RX: 14.8 Gbps</text>
        <text x="12" y="46" font-family="'Courier New', monospace" font-size="8px" fill="#88ccff">TX: 12.2 Gbps</text>
        <text x="12" y="60" font-family="'Courier New', monospace" font-size="8px" fill="#00ff88">LATENCY: 1.2ms [STABLE]</text>
      </g>`;

  return `<!-- Interior Archetype: Tower (890x240) -->
  <g class="interior-archetype-tower">
    <!-- Server Room Shell -->
    <rect width="${width}" height="${height}" fill="#060912"/>
    <!-- Elevated Floor & Data Conduits -->
    <line x1="0" y1="50" x2="${width}" y2="50" stroke="#10182c" stroke-width="1"/>
    <line x1="0" y1="100" x2="${width}" y2="100" stroke="#10182c" stroke-width="1"/>
    <line x1="0" y1="${groundY}" x2="${width}" y2="${groundY}" stroke="#00ADD8" stroke-width="2.5"/>
    <rect y="${groundY}" width="${width}" height="${height - groundY}" fill="#030408"/>

    <!-- Left Server Rack (x=140 to x=190, y=50 to 192) -->
    <g id="tower-rack-left">
      <rect x="140" y="50" width="50" height="${groundY - 50}" rx="3" fill="#0a1224" stroke="#1f2f55" stroke-width="1.2"/>
      <rect x="145" y="56" width="40" height="${groundY - 62}" rx="2" fill="#050a16"/>
      ${leftLeds}
      <!-- Vertical Climb Ladder / Conduits (Fox climbs here!) -->
      <line x1="196" y1="50" x2="196" y2="${groundY}" stroke="#00f0ff" stroke-width="2"/>
      <line x1="208" y1="50" x2="208" y2="${groundY}" stroke="#00f0ff" stroke-width="2"/>
      <!-- Ladder Rungs -->
      <line x1="196" y1="65" x2="208" y2="65" stroke="#00f0ff" stroke-width="1.5"/>
      <line x1="196" y1="90" x2="208" y2="90" stroke="#00f0ff" stroke-width="1.5"/>
      <line x1="196" y1="115" x2="208" y2="115" stroke="#00f0ff" stroke-width="1.5"/>
      <line x1="196" y1="140" x2="208" y2="140" stroke="#00f0ff" stroke-width="1.5"/>
      <line x1="196" y1="165" x2="208" y2="165" stroke="#00f0ff" stroke-width="1.5"/>
    </g>

    <!-- Right Server Rack (x=560 to x=610) -->
    <g id="tower-rack-right">
      <rect x="560" y="50" width="50" height="${groundY - 50}" rx="3" fill="#0a1224" stroke="#1f2f55" stroke-width="1.2"/>
      <rect x="565" y="56" width="40" height="${groundY - 62}" rx="2" fill="#050a16"/>
      ${rightLeds}
    </g>

    <!-- Floor Pressure Switch (Left: x=100) - Holds security gate open -->
    <g id="tower-switch" transform="translate(90, ${groundY - 6})">
      <rect x="0" y="0" width="30" height="6" rx="1" fill="#ff007f" stroke="#ffffff" stroke-width="0.8"/>
      <circle cx="15" cy="3" r="2.5" fill="#ffffff">
        <animate attributeName="opacity" values="0.5; 1; 0.5" dur="1s" repeatCount="indefinite"/>
      </circle>
    </g>

    <!-- Overhead Suspension Gantry / Cable Bridge (y=50) -->
    <g id="tower-gantry">
      <rect x="196" y="50" width="370" height="6" fill="#14213d" stroke="#00f0ff" stroke-width="1"/>
      <line x1="280" y1="50" x2="280" y2="0" stroke="#14213d" stroke-width="2"/>
      <line x1="480" y1="50" x2="480" y2="0" stroke="#14213d" stroke-width="2"/>
    </g>

    <!-- Wall Plate: Repo Identification Marquee -->
    <g id="tower-marquee" transform="translate(260, 18)">
      <rect x="0" y="0" width="190" height="22" rx="4" fill="#0a1329" stroke="#00ADD8" stroke-width="1.2"/>
      <circle cx="12" cy="11" r="4" fill="#00ADD8"/>
      <text x="24" y="14.5" font-family="'Courier New', monospace" font-size="10px" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${repoName}
      </text>
      <rect x="145" y="3" width="40" height="16" rx="3" fill="#00ADD8" opacity="0.25"/>
      <text x="165" y="14" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="8px" font-weight="800" fill="#00ADD8">
        ${langName}
      </text>
    </g>

    <!-- Side Widget Panel -->
    ${widgetSvg}

    <!-- High Suspended Language Skill Orb (Center: x=380, y=36) -->
    <g id="tower-skill-orb" transform="translate(380, 36)">
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2.2s" repeatCount="indefinite"/>
        <circle cx="0" cy="0" r="16" fill="${langColor}" opacity="0.25">
          <animate attributeName="r" values="14; 20; 14" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="0" cy="0" r="9" fill="${langColor}" opacity="0.8"/>
        <circle cx="0" cy="0" r="5" fill="#ffffff"/>
      </g>
    </g>
  </g>`;
}

export default renderTowerInterior;

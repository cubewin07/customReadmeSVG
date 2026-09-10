/**
 * Interior Template: The FinTech Vault & Bank (Archetype: 'vault')
 *
 * Full 890x240 interior scene:
 * - Massive heavy vault wheel gear door on left
 * - Digital candlestick financial chart tickers & columns
 * - Floating golden coins arc across the hall
 * - Target language orb at vault safe terminal (x=720)
 * - Dash corridor gating
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.7
 */

import { escapeXml } from '../../../svg/escape.js';

export function renderVaultInterior(stage, bounds = { width: 890, height: 240, groundY: 192 }) {
  const { paint } = stage;
  const { width, height, groundY } = bounds;
  const langColor = paint.langColor || '#f1e05a';
  const repoName = escapeXml(paint.name || 'FINTECH VAULT');
  const langName = escapeXml(paint.lang || 'JavaScript');
  const widget = paint.widget || 'candles';

  // Floating gold coins arc (x=160 to x=660)
  const coins = [
    { cx: 170, cy: 165 },
    { cx: 240, cy: 140 },
    { cx: 310, cy: 125 },
    { cx: 380, cy: 118 },
    { cx: 450, cy: 125 },
    { cx: 520, cy: 140 },
    { cx: 590, cy: 158 },
    { cx: 660, cy: 172 },
  ];

  const coinsSvg = coins.map((c, i) => `
    <g transform="translate(${c.cx}, ${c.cy})">
      <circle cx="0" cy="0" r="7.5" fill="#ffd700" stroke="#ff8800" stroke-width="1.2">
        <animate attributeName="r" values="7.5; 8.5; 7.5" dur="1.6s" begin="${(i * 0.2).toFixed(1)}s" repeatCount="indefinite"/>
      </circle>
      <text x="0" y="3" text-anchor="middle" font-family="'Courier New', monospace" font-size="7.5px" font-weight="900" fill="#774400">$</text>
      <!-- Sparkle -->
      <line x1="-3" y1="-8" x2="3" y2="-8" stroke="#ffffff" stroke-width="0.8" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="${(i * 0.25).toFixed(1)}s" repeatCount="indefinite"/>
      </line>
    </g>`).join('');

  // Candlestick chart ticker on back wall
  const widgetSvg = widget === 'candles'
    ? `<!-- Candlestick Financial Chart -->
      <g id="vault-candles" transform="translate(670, 36)">
        <rect width="170" height="78" rx="4" fill="#080e1c" stroke="#ffd700" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="15" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#ffd700">INDEX // +24.8% ▲</text>
        <!-- Candlesticks -->
        <g transform="translate(18, 56)">
          <line x1="0" y1="-28" x2="0" y2="12" stroke="#00ff88" stroke-width="1"/>
          <rect x="-4" y="-20" width="8" height="24" fill="#00ff88"/>
        </g>
        <g transform="translate(42, 56)">
          <line x1="0" y1="-20" x2="0" y2="15" stroke="#ff3366" stroke-width="1"/>
          <rect x="-4" y="-12" width="8" height="18" fill="#ff3366"/>
        </g>
        <g transform="translate(66, 56)">
          <line x1="0" y1="-32" x2="0" y2="8" stroke="#00ff88" stroke-width="1"/>
          <rect x="-4" y="-25" width="8" height="26" fill="#00ff88"/>
        </g>
        <g transform="translate(90, 56)">
          <line x1="0" y1="-36" x2="0" y2="6" stroke="#00ff88" stroke-width="1"/>
          <rect x="-4" y="-30" width="8" height="30" fill="#00ff88">
            <animate attributeName="height" values="30; 34; 28; 32; 30" dur="2.5s" repeatCount="indefinite"/>
          </rect>
        </g>
        <g transform="translate(114, 56)">
          <line x1="0" y1="-24" x2="0" y2="10" stroke="#ff3366" stroke-width="1"/>
          <rect x="-4" y="-18" width="8" height="16" fill="#ff3366"/>
        </g>
        <g transform="translate(138, 56)">
          <line x1="0" y1="-38" x2="0" y2="4" stroke="#00ff88" stroke-width="1"/>
          <rect x="-4" y="-32" width="8" height="32" fill="#00ff88"/>
        </g>
      </g>`
    : `<!-- Ledger Table Panel -->
      <g id="vault-ledger" transform="translate(670, 36)">
        <rect width="170" height="78" rx="4" fill="#080e1c" stroke="#ffd700" stroke-width="1.2" opacity="0.9"/>
        <text x="12" y="15" font-family="'Courier New', monospace" font-size="9px" font-weight="800" fill="#ffd700">>_ LEDGER BLOCK</text>
        <text x="12" y="32" font-family="'Courier New', monospace" font-size="8px" fill="#aabbcc">TX: 0x7f4a...91bc</text>
        <text x="12" y="46" font-family="'Courier New', monospace" font-size="8px" fill="#00ff88">+250.00 GOLD</text>
        <text x="12" y="60" font-family="'Courier New', monospace" font-size="8px" fill="#8899aa">HASH VERIFIED [OK]</text>
      </g>`;

  return `<!-- Interior Archetype: Vault (890x240) -->
  <g class="interior-archetype-vault">
    <!-- Vault Shell -->
    <rect width="${width}" height="${height}" fill="#0a0c16"/>
    <!-- Security Grid Lines & Pillars -->
    <line x1="0" y1="50" x2="${width}" y2="50" stroke="#1c2038" stroke-width="1"/>
    <line x1="0" y1="110" x2="${width}" y2="110" stroke="#1c2038" stroke-width="1"/>
    <line x1="0" y1="${groundY}" x2="${width}" y2="${groundY}" stroke="#ffd700" stroke-width="2.5"/>
    <rect y="${groundY}" width="${width}" height="${height - groundY}" fill="#05060b"/>

    <!-- Vault Architectural Columns -->
    <rect x="220" y="30" width="16" height="${groundY - 30}" fill="#14192d" stroke="#252d4e" stroke-width="0.8"/>
    <rect x="420" y="30" width="16" height="${groundY - 30}" fill="#14192d" stroke="#252d4e" stroke-width="0.8"/>
    <rect x="620" y="30" width="16" height="${groundY - 30}" fill="#14192d" stroke="#252d4e" stroke-width="0.8"/>

    <!-- Giant Circular Vault Wheel Door (Left: x=65, y=140) -->
    <g id="vault-wheel-door" transform="translate(65, 136)">
      <!-- Outer Rim -->
      <circle cx="0" cy="0" r="46" fill="#101526" stroke="#ffd700" stroke-width="3"/>
      <circle cx="0" cy="0" r="38" fill="#181f36" stroke="#ff8800" stroke-width="1.5"/>
      <!-- Heavy Locking Bolts -->
      <rect x="-48" y="-4" width="8" height="8" rx="2" fill="#ffd700"/>
      <rect x="40" y="-4" width="8" height="8" rx="2" fill="#ffd700"/>
      <rect x="-4" y="-48" width="8" height="8" rx="2" fill="#ffd700"/>
      <rect x="-4" y="40" width="8" height="8" rx="2" fill="#ffd700"/>
      <!-- Wheel Hub & Spokes (Rotates slowly) -->
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="18s" repeatCount="indefinite"/>
        <line x1="-30" y1="0" x2="30" y2="0" stroke="#ffd700" stroke-width="2.5"/>
        <line x1="0" y1="-30" x2="0" y2="30" stroke="#ffd700" stroke-width="2.5"/>
        <circle cx="0" cy="0" r="10" fill="#ffd700"/>
        <circle cx="0" cy="0" r="5" fill="#181f36"/>
      </g>
    </g>

    <!-- Wall Plate: Repo Identification Marquee -->
    <g id="vault-marquee" transform="translate(260, 18)">
      <rect x="0" y="0" width="190" height="22" rx="4" fill="#121626" stroke="#ffd700" stroke-width="1.2"/>
      <circle cx="12" cy="11" r="4" fill="#ffd700"/>
      <text x="24" y="14.5" font-family="'Courier New', monospace" font-size="10px" font-weight="900" fill="#ffffff" letter-spacing="0.5">
        ${repoName}
      </text>
      <rect x="145" y="3" width="40" height="16" rx="3" fill="#ffd700" opacity="0.25"/>
      <text x="165" y="14" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="8px" font-weight="800" fill="#ffd700">
        ${langName}
      </text>
    </g>

    <!-- Floating Coins Arc -->
    ${coinsSvg}

    <!-- Side Widget Panel -->
    ${widgetSvg}

    <!-- Vault Safe & Language Skill Orb (Right: x=740, y=140) -->
    <g id="vault-safe-terminal" transform="translate(740, 140)">
      <rect x="-18" y="0" width="36" height="52" rx="3" fill="#12172a" stroke="#ffd700" stroke-width="1.5"/>
      <line x1="-10" y1="12" x2="10" y2="12" stroke="#00f0ff" stroke-width="1"/>
      <circle cx="0" cy="28" r="4" fill="#ff007f"/>
      <!-- Skill Orb -->
      <g transform="translate(0, -18)">
        <animateTransform attributeName="transform" type="translate" values="0,-18; 0,-26; 0,-18" dur="2s" repeatCount="indefinite"/>
        <circle cx="0" cy="0" r="16" fill="${langColor}" opacity="0.25">
          <animate attributeName="r" values="14; 20; 14" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="0" cy="0" r="9" fill="${langColor}" opacity="0.8"/>
        <circle cx="0" cy="0" r="5" fill="#ffffff"/>
      </g>
    </g>
  </g>`;
}

export default renderVaultInterior;

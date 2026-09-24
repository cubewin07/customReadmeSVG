import { shade, W, H, SW, SH } from '../utils/timeline.js';

export const CUBE_COLORS = {
  1: '#4c8dff', // Electric Azure
  2: '#3aa6d8', // Cyan Tech
  3: '#38c9a0', // Mint Jade
  4: '#6bdc7a', // Emerald Green
};

/**
 * Renders SVG <defs> containing clip paths, gradients, 3D voxel cubes, and mini hero sprite.
 */
export function renderSharedDefs(theme) {
  const accent = theme.accent || '#58a6ff';
  const titleColor = theme.title || '#6ea8fe';
  const successColor = theme.success || '#3fb950';

  let cubeDefs = '';
  for (const [level, col] of Object.entries(CUBE_COLORS)) {
    cubeDefs += `
    <g id="c${level}">
      <!-- Top Face -->
      <polygon points="0,0 13,7.5 0,15 -13,7.5" fill="${col}"/>
      <!-- Left Shaded Face -->
      <polygon points="-13,7.5 0,15 0,27 -13,19.5" fill="${shade(col, 0.6)}"/>
      <!-- Right Shaded Face -->
      <polygon points="13,7.5 0,15 0,27 13,19.5" fill="${shade(col, 0.8)}"/>
    </g>`;
  }

  return `<defs>
    <style>
      .t { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .m { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
    </style>

    <!-- Card & Scene Clipping -->
    <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
    <clipPath id="scene"><rect width="${SW}" height="${SH}" rx="14"/></clipPath>

    <!-- Left Name Gradient -->
    <linearGradient id="nameGrad" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${titleColor}"/>
      <stop offset="55%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${successColor}"/>
    </linearGradient>

    <!-- Top Accent Bar Gradient -->
    <linearGradient id="barGrad" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${titleColor}"/>
      <stop offset="50%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${successColor}"/>
    </linearGradient>

    <!-- Moving Card Shimmer Gradient -->
    <linearGradient id="shimGrad" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#fff" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>

    <!-- Character Glow Aura -->
    <radialGradient id="glowGrad">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>

    <!-- Desk Gradient -->
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c232f"/>
      <stop offset="100%" stop-color="#0c1017"/>
    </linearGradient>

    <!-- Hologram Projection Beam -->
    <linearGradient id="beamGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#4fd1ff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#4fd1ff" stop-opacity="0.03"/>
    </linearGradient>

    <!-- Desk Lamp Warm Beam -->
    <linearGradient id="lampGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd76a" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffd76a" stop-opacity="0"/>
    </linearGradient>

    <!-- Rocket Exhaust Trail -->
    <linearGradient id="rocketTrailGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffb347" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffb347" stop-opacity="0"/>
    </linearGradient>

    <!-- 3D Voxel Cubes for City Act -->
    ${cubeDefs}

    <!-- Mini Hero Sprite (#mbody) matching Le Tan Thang's Likeness (Used in Runner & Conductor Acts) -->
    <g id="mbody">
      <!-- Black Crew Neck Torso -->
      <rect x="-10" y="-28" width="20" height="17" rx="3" fill="#181b22"/>
      <!-- Collar Rib -->
      <rect x="-6" y="-28" width="12" height="2.5" rx="1" fill="#2d3340"/>
      <!-- Warm Skin Neck -->
      <rect x="-4" y="-30" width="8" height="4" fill="#e4bb98"/>
      <!-- Face -->
      <rect x="-11" y="-47" width="22" height="18" rx="4" fill="#f2cfae"/>
      <!-- Cheeks Warmth -->
      <rect x="-9" y="-37" width="4" height="2" rx="1" fill="#f0a99b" opacity="0.6"/>
      <rect x="5" y="-37" width="4" height="2" rx="1" fill="#f0a99b" opacity="0.6"/>
      <!-- Dark Eyes with Catchlights -->
      <rect x="-6" y="-41" width="3" height="4" rx="1" fill="#221e30"/>
      <rect x="-5" y="-41" width="1.2" height="1.2" fill="#fff" opacity="0.9"/>
      <rect x="3" y="-41" width="3" height="4" rx="1" fill="#221e30"/>
      <rect x="4" y="-41" width="1.2" height="1.2" fill="#fff" opacity="0.9"/>
      <!-- Smile -->
      <path d="M-3 -33 Q0 -30 3 -33" stroke="#a0524a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <!-- Distinctive Wavy / Curly Hair Silhouette -->
      <rect x="-12" y="-52" width="24" height="10" rx="4" fill="#201c2c"/>
      <rect x="-10" y="-56" width="7" height="6" rx="2" fill="#262238"/>
      <rect x="-1" y="-57" width="8" height="7" rx="2.5" fill="#2a253e"/>
      <rect x="5" y="-55" width="6" height="5" rx="2" fill="#201c2c"/>
      <rect x="-13" y="-47" width="4" height="7" rx="2" fill="#201c2c"/>
      <rect x="9" y="-47" width="4" height="7" rx="2" fill="#201c2c"/>
    </g>
  </defs>`;
}

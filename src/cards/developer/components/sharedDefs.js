import { shade, W, H, SW, SH } from '../utils/timeline.js';

export const CUBE_COLORS = {
  1: '#4c8dff', // Electric Azure (level 1)
  2: '#3aa6d8', // Cyan Tech (level 2)
  3: '#38c9a0', // Mint Jade (level 3)
  4: '#6bdc7a', // Emerald Green (level 4)
};

export const BRAND_COLORS = {
  react: '#61dafb',
  javascript: '#f7df1e',
  typescript: '#3178c6',
  'node.js': '#68a063',
  node: '#68a063',
  python: '#4584b6',
  'next.js': '#e6edf3',
  next: '#e6edf3',
  'svg / smil': '#ff7b72',
  svg: '#ff7b72',
  tailwind: '#38bdf8',
  git: '#f05032',
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
    const isSkyscraper = level >= 3;
    cubeDefs += `
    <g id="c${level}">
      <!-- Top Face with Specular Bevel -->
      <polygon points="0,0 13,7.5 0,15 -13,7.5" fill="${col}"/>
      <polygon points="0,0 12,6.9 0,13.8 -12,6.9" fill="none" stroke="#fff" stroke-width="0.6" stroke-opacity="0.35"/>
      <!-- Left Shaded Face -->
      <polygon points="-13,7.5 0,15 0,27 -13,19.5" fill="${shade(col, 0.6)}"/>
      ${isSkyscraper ? `
      <!-- Cyber Window Slits on Left Face -->
      <line x1="-10" y1="12" x2="-2" y2="16.5" stroke="#fff" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="-10" y1="17" x2="-2" y2="21.5" stroke="#fff" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>
      ` : ''}
      <!-- Right Shaded Face -->
      <polygon points="13,7.5 0,15 0,27 13,19.5" fill="${shade(col, 0.8)}"/>
      ${isSkyscraper ? `
      <!-- Cyber Window Slits on Right Face -->
      <line x1="2" y1="16.5" x2="10" y2="12" stroke="#fff" stroke-opacity="0.65" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="2" y1="21.5" x2="10" y2="17" stroke="#fff" stroke-opacity="0.65" stroke-width="1.2" stroke-linecap="round"/>
      ` : ''}
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

    <!-- Desk Surface Gradient -->
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e2633"/>
      <stop offset="25%" stop-color="#161c26"/>
      <stop offset="100%" stop-color="#0a0d13"/>
    </linearGradient>

    <!-- Cyber Desk Mat Gradient -->
    <linearGradient id="deskMatGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f151f"/>
      <stop offset="50%" stop-color="#151d2b"/>
      <stop offset="100%" stop-color="#0f151f"/>
    </linearGradient>

    <!-- Hologram Projection Beam -->
    <linearGradient id="beamGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#4fd1ff" stop-opacity="0.55"/>
      <stop offset="40%" stop-color="#4fd1ff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#4fd1ff" stop-opacity="0.02"/>
    </linearGradient>

    <!-- Sparkline Area Fill Gradient under Hologram Charts -->
    <linearGradient id="holoAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4fd1ff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4fd1ff" stop-opacity="0.02"/>
    </linearGradient>

    <!-- Desk Lamp Volumetric Beam -->
    <linearGradient id="lampGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd76a" stop-opacity="0.55"/>
      <stop offset="40%" stop-color="#ffd76a" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffd76a" stop-opacity="0"/>
    </linearGradient>

    <!-- Rocket Exhaust Trail -->
    <linearGradient id="rocketTrailGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffb347" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#ff6b6b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffb347" stop-opacity="0"/>
    </linearGradient>

    <!-- Voxel Island Anti-Gravity Reactor Core -->
    <radialGradient id="antiGravCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38c9a0" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#4c8dff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0a0f18" stop-opacity="0"/>
    </radialGradient>

    <!-- Sun Flare Radial Glow -->
    <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe885" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#ffd76a" stop-opacity="0.6"/>
      <stop offset="70%" stop-color="#ff9e3b" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffd76a" stop-opacity="0"/>
    </radialGradient>

    <!-- Jetpack Thruster Flame Gradient -->
    <linearGradient id="jetpackFlameGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#ffd76a"/>
      <stop offset="70%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </linearGradient>

    <!-- Levitating Crystal Shard Gradient -->
    <linearGradient id="antiGravCrystalGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#67e8f9" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0.8"/>
    </linearGradient>

    <!-- Mini Droid Visor Gradient -->
    <linearGradient id="droidVisorGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>

    <!-- Left Panel Rank Badge Gradient -->
    <linearGradient id="rankBadgeGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.2"/>
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
      <!-- Face Contour -->
      <rect x="-11" y="-47" width="22" height="18" rx="4" fill="#f2cfae"/>
      <!-- Cheeks Warmth -->
      <rect x="-9" y="-37" width="4" height="2" rx="1" fill="#f0a99b" opacity="0.65"/>
      <rect x="5" y="-37" width="4" height="2" rx="1" fill="#f0a99b" opacity="0.65"/>
      <!-- Dark Eyes with Catchlights -->
      <rect x="-6" y="-41" width="3" height="4" rx="1" fill="#221e30"/>
      <rect x="-5" y="-41" width="1.2" height="1.2" fill="#fff" opacity="0.9"/>
      <rect x="3" y="-41" width="3" height="4" rx="1" fill="#221e30"/>
      <rect x="4" y="-41" width="1.2" height="1.2" fill="#fff" opacity="0.9"/>
      <!-- Smile -->
      <path d="M-3 -33 Q0 -30 3 -33" stroke="#a0524a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <!-- Textured Wavy / Curly Hair Silhouette -->
      <rect x="-12" y="-52" width="24" height="10" rx="4" fill="#201c2c"/>
      <rect x="-10" y="-56" width="7" height="6" rx="2" fill="#262238"/>
      <rect x="-1" y="-57" width="8" height="7" rx="2.5" fill="#2a253e"/>
      <rect x="5" y="-55" width="6" height="5" rx="2" fill="#201c2c"/>
      <rect x="-13" y="-47" width="4" height="7" rx="2" fill="#201c2c"/>
      <rect x="9" y="-47" width="4" height="7" rx="2" fill="#201c2c"/>
      <!-- Hair Specular Highlights -->
      <path d="M-7 -54 Q-3 -56 0 -54" stroke="#483f60" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M2 -54 Q5 -55 7 -53" stroke="#483f60" stroke-width="1" fill="none" stroke-linecap="round"/>
    </g>
  </defs>`;
}

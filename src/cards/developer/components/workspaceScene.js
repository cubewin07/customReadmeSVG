/**
 * Workspace Scene Component
 * Separated into background and foreground layers for strict paint-order layering:
 * Layer 1 (Background): Cyber grid, spotlight, floating tech orbs, left terminal.
 * Layer 3 (Foreground): Desk surface (covers legs), neon strip, mug, keyboard, front monitor.
 */

export function renderWorkspaceBackground(theme) {
  const accent = theme.accent || '#38bdf8';
  const titleColor = theme.title || '#58a6ff';

  return `
  <!-- ==================== WORKSPACE LAYER 1: BACKGROUND & ORBS ==================== -->
  <g id="workspace-background">
    <!-- Ambient Cyber Lighting & Radial Glow -->
    <radialGradient id="desk-spotlight" cx="625" cy="145" r="175" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${titleColor}" stop-opacity="0.22" />
      <stop offset="55%" stop-color="${accent}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${theme.bg}" stop-opacity="0" />
    </radialGradient>
    <rect x="428" y="16" width="396" height="248" rx="12" fill="url(#desk-spotlight)" />

    <!-- Cyber Grid Background Lines (Subtle) -->
    <g opacity="0.14" stroke="${titleColor}" stroke-width="0.8" stroke-dasharray="3 4">
      <line x1="435" y1="55" x2="815" y2="55" />
      <line x1="435" y1="105" x2="815" y2="105" />
      <line x1="435" y1="155" x2="815" y2="155" />
      <line x1="435" y1="205" x2="815" y2="205" />
      <line x1="495" y1="24" x2="495" y2="248" />
      <line x1="575" y1="24" x2="575" y2="248" />
      <line x1="675" y1="24" x2="675" y2="248" />
      <line x1="755" y1="24" x2="755" y2="248" />
    </g>

    <!-- Floating Ambient Code Sparks / Cyber Embers -->
    <g id="ambient-cyber-embers" opacity="0.75">
      <circle cx="510" cy="85" r="1.5" fill="${accent}">
        <animate attributeName="cy" values="95;65;95" dur="4.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="4.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="755" cy="105" r="1.8" fill="${titleColor}">
        <animate attributeName="cy" values="115;85;115" dur="3.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="715" cy="45" r="1.3" fill="#facc15">
        <animate attributeName="cy" values="55;35;55" dur="4.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;1;0.4" dur="4.6s" repeatCount="indefinite" />
      </circle>
    </g>

    <!-- ==================== FLOATING TECH ORBS (ORBITING) ==================== -->
    <!-- Tech 1: React Atom (Spinning Orbit) -->
    <g id="orb-react" transform="translate(500, 72)">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -4; 0 0" dur="3.2s" repeatCount="indefinite" />
        <circle cx="0" cy="0" r="15" fill="#0f172a" stroke="#00d8ff" stroke-width="1.3" opacity="0.95" />
        <circle cx="0" cy="0" r="2.8" fill="#00d8ff" />
        <ellipse cx="0" cy="0" rx="10" ry="4" fill="none" stroke="#00d8ff" stroke-width="1.1" opacity="0.85">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="0" cy="0" rx="10" ry="4" fill="none" stroke="#00d8ff" stroke-width="1.1" opacity="0.85">
          <animateTransform attributeName="transform" type="rotate" from="60" to="420" dur="8s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="0" cy="0" rx="10" ry="4" fill="none" stroke="#00d8ff" stroke-width="1.1" opacity="0.85">
          <animateTransform attributeName="transform" type="rotate" from="120" to="480" dur="8s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </g>

    <!-- Tech 2: TypeScript Holographic Chip -->
    <g id="orb-ts" transform="translate(750, 68)">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 4; 0 0" dur="3.6s" repeatCount="indefinite" />
        <rect x="-13" y="-13" width="26" height="26" rx="5.5" fill="#0f172a" stroke="#3178c6" stroke-width="1.3" opacity="0.95" />
        <text x="0" y="5.5" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11.5" font-weight="900" fill="#3178c6">TS</text>
        <circle cx="9" cy="-9" r="1.5" fill="#60a5fa">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>

    <!-- Tech 3: Python Glowing Badge -->
    <g id="orb-python" transform="translate(778, 140)">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -3; 0 0" dur="2.9s" repeatCount="indefinite" />
        <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="1.3" opacity="0.95" />
        <path d="M -5 -6 Q -6 -2 -2 -2 L 1 -2 Q 4 -2 4 1 L 4 3 L -1 3 Q -4 3 -4 -1 Z" fill="#38bdf8" />
        <path d="M 5 6 Q 6 2 2 2 L -1 2 Q -4 2 -4 -1 L -4 -3 L 1 -3 Q 4 -3 4 1 Z" fill="#facc15" />
      </g>
    </g>

    <!-- Tech 4: Git Branch Pulse -->
    <g id="orb-git" transform="translate(465, 132)">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 3; 0 0" dur="3.4s" repeatCount="indefinite" />
        <rect x="-12" y="-12" width="24" height="24" rx="5.5" fill="#0f172a" stroke="#f43f5e" stroke-width="1.3" opacity="0.95" />
        <circle cx="-3" cy="4.5" r="2.2" fill="#f43f5e" />
        <circle cx="-3" cy="-4.5" r="2.2" fill="#f43f5e" />
        <circle cx="4.5" cy="-1" r="2.2" fill="#fb7185" />
        <path d="M -3 2.5 L -3 -2.5 M -3 2.5 Q 0 2.5 2.5 0" fill="none" stroke="#f43f5e" stroke-width="1.3" />
      </g>
    </g>

    <!-- ==================== LEFT HOLOGRAPHIC CODE TERMINAL ==================== -->
    <g id="left-terminal" transform="translate(470, 168)">
      <!-- Monitor Frame -->
      <rect x="-36" y="-38" width="72" height="52" rx="5" fill="#0b0f19" stroke="${theme.subtleBorder || '#30363d'}" stroke-width="1.3" />
      <rect x="-33" y="-35" width="66" height="46" rx="3" fill="#050811" />
      <!-- Terminal Window Bar -->
      <rect x="-33" y="-35" width="66" height="8" fill="#111827" />
      <circle cx="-27" cy="-31" r="1.3" fill="#ef4444" />
      <circle cx="-23" cy="-31" r="1.3" fill="#f59e0b" />
      <circle cx="-19" cy="-31" r="1.3" fill="#10b981" />
      <text x="3" y="-29.5" text-anchor="middle" font-family="monospace" font-size="5" fill="${theme.secondaryText}">editor.js</text>
      
      <!-- Code lines with line numbers -->
      <g transform="translate(-29, -23)">
        <text x="0" y="5" font-family="monospace" font-size="5.5" fill="#4b5563">1</text>
        <rect x="7" y="2" width="22" height="2" fill="${titleColor}" opacity="0.9" />
        <rect x="31" y="2" width="18" height="2" fill="#a855f7" opacity="0.85" />

        <text x="0" y="11" font-family="monospace" font-size="5.5" fill="#4b5563">2</text>
        <rect x="7" y="8" width="14" height="2" fill="#38bdf8" opacity="0.9" />
        <rect x="23" y="8" width="28" height="2" fill="#34d399" opacity="0.85" />

        <text x="0" y="17" font-family="monospace" font-size="5.5" fill="#4b5563">3</text>
        <rect x="7" y="14" width="36" height="2" fill="#facc15" opacity="0.85" />
        <rect x="45" y="14" width="10" height="2" fill="${accent}" opacity="0.9" />

        <text x="0" y="23" font-family="monospace" font-size="5.5" fill="#4b5563">4</text>
        <rect x="7" y="20" width="26" height="2" fill="#f43f5e" opacity="0.85" />
        
        <text x="0" y="29" font-family="monospace" font-size="5.5" fill="#4b5563">5</text>
        <rect x="7" y="26" width="42" height="2" fill="${titleColor}" opacity="0.9" />
        <!-- Glowing blinking cursor -->
        <rect x="51" y="25" width="3" height="3" fill="#38bdf8">
          <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
        </rect>
      </g>
      <!-- Monitor Stand -->
      <path d="M -4 14 L 4 14 L 8 22 L -8 22 Z" fill="#1e293b" />
    </g>
  </g>
  `;
}

export function renderWorkspaceForeground(theme) {
  const accent = theme.accent || '#38bdf8';
  const titleColor = theme.title || '#58a6ff';

  return `
  <!-- ==================== WORKSPACE LAYER 3: FOREGROUND DESK & HARDWARE ==================== -->
  <!-- Painted over character body so world y=214 down completely covers the legs -->
  <g id="workspace-foreground">
    <!-- Desk Surface (Tilted Cyber Desk) -->
    <g id="desk-surface">
      <!-- Main Desk Plane -->
      <polygon points="440,214 810,214 822,274 428,274" fill="#0f121a" stroke="${theme.border}" stroke-width="1" />
      
      <!-- Glowing Neon Desk Edge Strip -->
      <line x1="440" y1="214" x2="810" y2="214" stroke="url(#neon-desk-strip)" stroke-width="2.6" />
      <linearGradient id="neon-desk-strip" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.3" />
        <stop offset="50%" stop-color="${titleColor}" stop-opacity="0.95" />
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.3" />
      </linearGradient>

      <!-- Desk Surface Depth Bevel -->
      <line x1="428" y1="274" x2="822" y2="274" stroke="#08090e" stroke-width="2.5" />
    </g>

    <!-- ==================== STEAMING COFFEE / BOBA MUG ==================== -->
    <g id="desk-mug" transform="translate(742, 228)">
      <!-- Animated Steam Ripples Rising -->
      <g id="mug-steam" opacity="0.8">
        <path d="M 0 -4 C -2 -10, 2 -16, 0 -22 C -2 -26, 1 -30, 0 -34" fill="none" stroke="#e2e8f0" stroke-width="1.3" stroke-linecap="round">
          <animate attributeName="opacity" values="0.2; 0.85; 0.2" dur="2.4s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="2.4s" repeatCount="indefinite" />
        </path>
        <path d="M 7 -6 C 9 -12, 5 -18, 7 -24" fill="none" stroke="#cbd5e1" stroke-width="1.1" stroke-linecap="round">
          <animate attributeName="opacity" values="0.75; 0.2; 0.75" dur="2.8s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -4; 0 0" dur="2.8s" repeatCount="indefinite" />
        </path>
      </g>
      <!-- Ceramic Mug Body -->
      <rect x="-9" y="-2" width="18" height="22" rx="3.5" fill="#1e293b" stroke="${titleColor}" stroke-width="1.1" />
      <!-- Mug Handle -->
      <path d="M 9 2 Q 15 2 15 9 Q 15 16 9 16" fill="none" stroke="${titleColor}" stroke-width="2" stroke-linecap="round" />
      <!-- Mug Rim & Liquid (Dark Roast) -->
      <ellipse cx="0" cy="-2" rx="8.5" ry="3.2" fill="#0f172a" stroke="${titleColor}" stroke-width="0.9" />
      <ellipse cx="0" cy="-1.5" rx="7" ry="2.2" fill="#58311a" />
      <!-- Mug Front Graphic '</>' -->
      <text x="0" y="12" text-anchor="middle" font-family="monospace" font-size="7.5" font-weight="bold" fill="${accent}">&lt;/&gt;</text>
    </g>

    <!-- ==================== MECHANICAL KEYBOARD ==================== -->
    <g id="mech-keyboard" transform="translate(625, 222)">
      <!-- RGB Underglow Aura -->
      <rect x="-62" y="-9" width="124" height="26" rx="5" fill="${titleColor}" opacity="0.3" filter="blur(2px)">
        <animate attributeName="opacity" values="0.22;0.48;0.22" dur="2s" repeatCount="indefinite" />
      </rect>

      <!-- Keyboard Base Chassis -->
      <rect x="-60" y="-7" width="120" height="24" rx="4" fill="#0d1117" stroke="${theme.border}" stroke-width="1.2" />
      
      <!-- Keycap Rows (Pixel Aesthetic) -->
      <!-- Top Function Row -->
      <g fill="#1f2937">
        <rect x="-54" y="-4" width="8" height="4.5" rx="1" />
        <rect x="-44" y="-4" width="8" height="4.5" rx="1" fill="${accent}" opacity="0.85" />
        <rect x="-34" y="-4" width="8" height="4.5" rx="1" />
        <rect x="-24" y="-4" width="8" height="4.5" rx="1" />
        <rect x="-14" y="-4" width="8" height="4.5" rx="1" />
        <rect x="-4"  y="-4" width="8" height="4.5" rx="1" />
        <rect x="6"   y="-4" width="8" height="4.5" rx="1" />
        <rect x="16"  y="-4" width="8" height="4.5" rx="1" />
        <rect x="26"  y="-4" width="8" height="4.5" rx="1" />
        <rect x="36"  y="-4" width="8" height="4.5" rx="1" fill="#f43f5e" opacity="0.85" />
        <rect x="46"  y="-4" width="8" height="4.5" rx="1" />
      </g>
      <!-- Home Row -->
      <g fill="#1f2937">
        <rect x="-52" y="1.5" width="8" height="4.5" rx="1" />
        <rect x="-42" y="1.5" width="8" height="4.5" rx="1" />
        <rect x="-32" y="1.5" width="8" height="4.5" rx="1" />
        <rect x="-22" y="1.5" width="8" height="4.5" rx="1" fill="${titleColor}" opacity="0.9" />
        <rect x="-12" y="1.5" width="8" height="4.5" rx="1" />
        <rect x="-2"  y="1.5" width="8" height="4.5" rx="1" />
        <rect x="8"   y="1.5" width="8" height="4.5" rx="1" />
        <rect x="18"  y="1.5" width="8" height="4.5" rx="1" />
        <rect x="28"  y="1.5" width="8" height="4.5" rx="1" />
        <rect x="38"  y="1.5" width="12" height="4.5" rx="1" fill="#10b981" opacity="0.85" />
      </g>
      <!-- Bottom Row & Spacebar -->
      <g fill="#1f2937">
        <rect x="-52" y="7" width="11" height="5.5" rx="1" />
        <rect x="-39" y="7" width="9" height="5.5" rx="1" />
        <!-- Spacebar (Central illuminated key) -->
        <rect x="-28" y="7" width="56" height="5.5" rx="1.5" fill="#374151" stroke="${titleColor}" stroke-width="0.9">
          <animate attributeName="fill" values="#374151;#4b5563;#374151" dur="0.6s" repeatCount="indefinite" />
        </rect>
        <rect x="30" y="7" width="9" height="5.5" rx="1" />
        <rect x="41" y="7" width="11" height="5.5" rx="1" />
      </g>
    </g>

    <!-- ==================== FRONT-FACING CODING MONITOR ==================== -->
    <g id="main-monitor" transform="translate(625, 245)">
      <!-- Angled Laptop / Monitor Frame -->
      <polygon points="-82, -28  82, -28  70, 0  -70, 0" fill="#090d16" stroke="${titleColor}" stroke-width="1.3" />
      <!-- Glowing Display Surface -->
      <polygon points="-78, -26  78, -26  67, -2  -67, -2" fill="#020408" />
      
      <!-- Code lines streaming on screen -->
      <g transform="translate(-62, -23)" clip-path="url(#monitor-clip)">
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="0 0; 0 -16" dur="2.4s" repeatCount="indefinite" />
          <rect x="0" y="2" width="38" height="2" fill="#60a5fa" />
          <rect x="42" y="2" width="24" height="2" fill="#f472b6" />
          <rect x="6" y="6" width="52" height="2" fill="#34d399" />
          <rect x="62" y="6" width="34" height="2" fill="#fbbf24" />
          <rect x="12" y="10" width="60" height="2" fill="#38bdf8" />
          <rect x="0" y="14" width="22" height="2" fill="#a78bfa" />
          <!-- Looping duplicates -->
          <rect x="0" y="18" width="38" height="2" fill="#60a5fa" />
          <rect x="42" y="18" width="24" height="2" fill="#f472b6" />
          <rect x="6" y="22" width="52" height="2" fill="#34d399" />
          <rect x="62" y="22" width="34" height="2" fill="#fbbf24" />
          <rect x="12" y="26" width="60" height="2" fill="#38bdf8" />
        </g>
      </g>

      <!-- Screen Glow Backlight onto desk -->
      <ellipse cx="0" cy="0" rx="66" ry="6.5" fill="${titleColor}" opacity="0.4">
        <animate attributeName="opacity" values="0.28;0.5;0.28" dur="1.8s" repeatCount="indefinite" />
      </ellipse>
    </g>
  </g>
  `;
}

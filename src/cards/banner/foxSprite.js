/**
 * Pixel-Art Fox Sprite Engine
 *
 * Implements:
 * 1. 4-frame quadruped walk cycle with crisp discrete display switching (zero blur/ghosting)
 * 2. Natural quadruped physics: vertical bobbing (footfall weight & lift), spine pitch flexion,
 *    and subtle breathing squash-and-stretch
 * 3. Embedded visor pixels that bob with head movement and light up neon cyan after Stage 0
 * 4. High-octane Metroidvania DASH: anticipation crouch, supersonic burst across the screen,
 *    chromatic ghost afterimages, speed lines, and friction skid smoke puffs
 * 5. Unlockable glowing orbit rings after Stage 1 clear
 * 6. Cozy campfire loaf with gentle sinusoidal breathing, tail wag, warm fire illumination,
 *    and floating heart emote
 * 7. Synchronized room actor fox with bespoke physics:
 *    - Lab: 3 bounding step-hops, high leap to satellite, starburst flash collection
 *    - Vault: 360° airborne somersault through the golden coin arc, terminal unlock
 *    - Forge: Flat crouch-slide under hazard laser, holographic clone stamp at anvil
 *    - Tower: Holographic clone holds pressure switch, ladder climb, gantry sprint
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.6
 */

const P = 2.6; // Base pixel unit size for street fox (2.6 * 22 = 57.2px width, 41.6px height)

// Frame 0: Contact A (Tail up, front right leg forward)
const FRAME_0 = [
  // Ears
  { x: 14, y: 1, w: 2, h: 2, c: '#231714' },
  { x: 11, y: 2, w: 2, h: 2, c: '#231714' },
  { x: 14, y: 3, w: 2, h: 2, c: '#ff6e27' },
  { x: 12, y: 3, w: 2, h: 2, c: '#ffa05c' },
  { x: 13, y: 4, w: 1, h: 2, c: '#ff9999' },
  // Head
  { x: 13, y: 4, w: 4, h: 4, c: '#ff6e27' },
  { x: 12, y: 5, w: 3, h: 3, c: '#ffa05c' },
  { x: 17, y: 6, w: 3, h: 2, c: '#ff6e27' },
  { x: 20, y: 7, w: 2, h: 2, c: '#dd4e10' },
  { x: 21, y: 6, w: 1, h: 1, c: '#1a1016' },
  { x: 17, y: 8, w: 3, h: 1, c: '#ffffff' },
  { x: 15, y: 7, w: 2, h: 2, c: '#ffffff' },
  // Visor Eye (bobs with head)
  { x: 16, y: 5, w: 2, h: 2, visor: true },
  { x: 18, y: 5, w: 1, h: 1, gleam: true },
  // Bandana
  { x: 13, y: 8, w: 3, h: 1, c: '#ff007f' },
  { x: 11, y: 9, w: 2, h: 2, c: '#ff007f' },
  // Torso
  { x: 7, y: 8, w: 6, h: 4, c: '#ff6e27' },
  { x: 8, y: 7, w: 5, h: 2, c: '#ffa05c' },
  { x: 11, y: 8, w: 3, h: 3, c: '#ffffff' },
  { x: 6, y: 9, w: 4, h: 3, c: '#dd4e10' },
  // Tail (High curl)
  { x: 4, y: 8, w: 3, h: 3, c: '#ff6e27' },
  { x: 2, y: 6, w: 3, h: 3, c: '#ff6e27' },
  { x: 1, y: 4, w: 3, h: 3, c: '#ffa05c' },
  { x: 2, y: 2, w: 3, h: 3, c: '#ffffff' },
  { x: 3, y: 1, w: 2, h: 2, c: '#ffffff' },
  // Legs
  { x: 14, y: 11, w: 2, h: 3, c: '#dd4e10' },
  { x: 16, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 11, y: 11, w: 2, h: 2, c: '#b83808' },
  { x: 10, y: 13, w: 2, h: 2, c: '#180f12' },
  { x: 8, y: 11, w: 2, h: 3, c: '#ff6e27' },
  { x: 9, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 5, y: 11, w: 2, h: 3, c: '#b83808' },
  { x: 4, y: 13, w: 2, h: 2, c: '#180f12' },
];

// Frame 1: Passing (Compact stride, head dips by 1px)
const FRAME_1 = [
  { x: 14, y: 2, w: 2, h: 2, c: '#231714' },
  { x: 11, y: 3, w: 2, h: 2, c: '#231714' },
  { x: 14, y: 4, w: 2, h: 2, c: '#ff6e27' },
  { x: 12, y: 4, w: 2, h: 2, c: '#ffa05c' },
  { x: 13, y: 5, w: 1, h: 2, c: '#ff9999' },
  { x: 13, y: 5, w: 4, h: 4, c: '#ff6e27' },
  { x: 12, y: 6, w: 3, h: 3, c: '#ffa05c' },
  { x: 17, y: 7, w: 3, h: 2, c: '#ff6e27' },
  { x: 20, y: 8, w: 2, h: 2, c: '#dd4e10' },
  { x: 21, y: 7, w: 1, h: 1, c: '#1a1016' },
  { x: 17, y: 9, w: 3, h: 1, c: '#ffffff' },
  { x: 15, y: 8, w: 2, h: 2, c: '#ffffff' },
  // Visor Eye (dipped 1px with head)
  { x: 16, y: 6, w: 2, h: 2, visor: true },
  { x: 18, y: 6, w: 1, h: 1, gleam: true },
  { x: 13, y: 9, w: 3, h: 1, c: '#ff007f' },
  { x: 10, y: 10, w: 3, h: 2, c: '#ff007f' },
  { x: 7, y: 9, w: 6, h: 4, c: '#ff6e27' },
  { x: 8, y: 8, w: 5, h: 2, c: '#ffa05c' },
  { x: 11, y: 9, w: 3, h: 3, c: '#ffffff' },
  { x: 6, y: 10, w: 4, h: 3, c: '#dd4e10' },
  { x: 4, y: 9, w: 3, h: 3, c: '#ff6e27' },
  { x: 2, y: 8, w: 3, h: 3, c: '#ff6e27' },
  { x: 0, y: 6, w: 3, h: 3, c: '#ffa05c' },
  { x: 1, y: 4, w: 3, h: 3, c: '#ffffff' },
  { x: 2, y: 3, w: 2, h: 2, c: '#ffffff' },
  { x: 13, y: 11, w: 2, h: 2, c: '#dd4e10' },
  { x: 14, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 12, y: 11, w: 2, h: 2, c: '#b83808' },
  { x: 11, y: 13, w: 2, h: 2, c: '#180f12' },
  { x: 7, y: 11, w: 2, h: 2, c: '#ff6e27' },
  { x: 7, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 6, y: 11, w: 2, h: 2, c: '#b83808' },
  { x: 5, y: 13, w: 2, h: 2, c: '#180f12' },
];

// Frame 2: Contact B (Left front leg forward)
const FRAME_2 = [
  { x: 14, y: 1, w: 2, h: 2, c: '#231714' },
  { x: 11, y: 2, w: 2, h: 2, c: '#231714' },
  { x: 14, y: 3, w: 2, h: 2, c: '#ff6e27' },
  { x: 12, y: 3, w: 2, h: 2, c: '#ffa05c' },
  { x: 13, y: 4, w: 1, h: 2, c: '#ff9999' },
  { x: 13, y: 4, w: 4, h: 4, c: '#ff6e27' },
  { x: 12, y: 5, w: 3, h: 3, c: '#ffa05c' },
  { x: 17, y: 6, w: 3, h: 2, c: '#ff6e27' },
  { x: 20, y: 7, w: 2, h: 2, c: '#dd4e10' },
  { x: 21, y: 6, w: 1, h: 1, c: '#1a1016' },
  { x: 17, y: 8, w: 3, h: 1, c: '#ffffff' },
  { x: 15, y: 7, w: 2, h: 2, c: '#ffffff' },
  // Visor Eye
  { x: 16, y: 5, w: 2, h: 2, visor: true },
  { x: 18, y: 5, w: 1, h: 1, gleam: true },
  { x: 13, y: 8, w: 3, h: 1, c: '#ff007f' },
  { x: 11, y: 9, w: 2, h: 2, c: '#ff007f' },
  { x: 7, y: 8, w: 6, h: 4, c: '#ff6e27' },
  { x: 8, y: 7, w: 5, h: 2, c: '#ffa05c' },
  { x: 11, y: 8, w: 3, h: 3, c: '#ffffff' },
  { x: 6, y: 9, w: 4, h: 3, c: '#dd4e10' },
  { x: 4, y: 7, w: 3, h: 3, c: '#ff6e27' },
  { x: 1, y: 6, w: 3, h: 3, c: '#ff6e27' },
  { x: 0, y: 4, w: 2, h: 3, c: '#ffa05c' },
  { x: 1, y: 2, w: 2, h: 3, c: '#ffffff' },
  { x: 2, y: 1, w: 2, h: 2, c: '#ffffff' },
  { x: 11, y: 11, w: 2, h: 3, c: '#dd4e10' },
  { x: 10, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 14, y: 11, w: 2, h: 2, c: '#b83808' },
  { x: 15, y: 13, w: 2, h: 2, c: '#180f12' },
  { x: 6, y: 11, w: 2, h: 3, c: '#ff6e27' },
  { x: 5, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 9, y: 11, w: 2, h: 3, c: '#b83808' },
  { x: 10, y: 13, w: 2, h: 2, c: '#180f12' },
];

// Frame 3: Push-off (Stride extension)
const FRAME_3 = [
  { x: 14, y: 2, w: 2, h: 2, c: '#231714' },
  { x: 11, y: 3, w: 2, h: 2, c: '#231714' },
  { x: 14, y: 4, w: 2, h: 2, c: '#ff6e27' },
  { x: 12, y: 4, w: 2, h: 2, c: '#ffa05c' },
  { x: 13, y: 5, w: 1, h: 2, c: '#ff9999' },
  { x: 13, y: 4, w: 4, h: 4, c: '#ff6e27' },
  { x: 12, y: 5, w: 3, h: 3, c: '#ffa05c' },
  { x: 17, y: 6, w: 3, h: 2, c: '#ff6e27' },
  { x: 20, y: 7, w: 2, h: 2, c: '#dd4e10' },
  { x: 21, y: 6, w: 1, h: 1, c: '#1a1016' },
  { x: 17, y: 8, w: 3, h: 1, c: '#ffffff' },
  { x: 15, y: 7, w: 2, h: 2, c: '#ffffff' },
  // Visor Eye
  { x: 16, y: 5, w: 2, h: 2, visor: true },
  { x: 18, y: 5, w: 1, h: 1, gleam: true },
  { x: 13, y: 8, w: 3, h: 1, c: '#ff007f' },
  { x: 10, y: 9, w: 3, h: 2, c: '#ff007f' },
  { x: 7, y: 8, w: 6, h: 4, c: '#ff6e27' },
  { x: 8, y: 7, w: 5, h: 2, c: '#ffa05c' },
  { x: 11, y: 8, w: 3, h: 3, c: '#ffffff' },
  { x: 6, y: 8, w: 4, h: 3, c: '#dd4e10' },
  { x: 4, y: 8, w: 3, h: 3, c: '#ff6e27' },
  { x: 2, y: 6, w: 3, h: 3, c: '#ff6e27' },
  { x: 0, y: 5, w: 3, h: 3, c: '#ffa05c' },
  { x: 1, y: 3, w: 3, h: 3, c: '#ffffff' },
  { x: 3, y: 2, w: 2, h: 2, c: '#ffffff' },
  { x: 14, y: 10, w: 2, h: 3, c: '#dd4e10' },
  { x: 13, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 12, y: 10, w: 2, h: 3, c: '#b83808' },
  { x: 12, y: 13, w: 2, h: 2, c: '#180f12' },
  { x: 8, y: 10, w: 2, h: 3, c: '#ff6e27' },
  { x: 7, y: 13, w: 2, h: 2, c: '#231714' },
  { x: 6, y: 10, w: 2, h: 3, c: '#b83808' },
  { x: 5, y: 13, w: 2, h: 2, c: '#180f12' },
];

// Resting Frame: Sitting Loaf at Campfire
const RESTING_LOAF = [
  { x: 13, y: 3, w: 2, h: 2, c: '#231714' },
  { x: 10, y: 4, w: 2, h: 2, c: '#231714' },
  { x: 13, y: 5, w: 2, h: 2, c: '#ff6e27' },
  { x: 11, y: 5, w: 2, h: 2, c: '#ffa05c' },
  { x: 12, y: 6, w: 4, h: 4, c: '#ff6e27' },
  { x: 11, y: 7, w: 3, h: 3, c: '#ffa05c' },
  { x: 16, y: 7, w: 3, h: 2, c: '#ff6e27' },
  { x: 19, y: 8, w: 2, h: 2, c: '#dd4e10' },
  { x: 20, y: 7, w: 1, h: 1, c: '#1a1016' },
  // Happy squint visor (^ _ ^)
  { x: 15, y: 7, w: 3, h: 1, c: '#00f0ff' },
  { x: 16, y: 6, w: 1, h: 1, c: '#ffffff' },
  { x: 16, y: 9, w: 3, h: 1, c: '#ffffff' },
  { x: 12, y: 10, w: 3, h: 1, c: '#ff007f' },
  { x: 10, y: 11, w: 2, h: 2, c: '#ff007f' },
  // Torso Loaf
  { x: 5, y: 10, w: 8, h: 4, c: '#ff6e27' },
  { x: 6, y: 9, w: 6, h: 2, c: '#ffa05c' },
  { x: 8, y: 10, w: 4, h: 3, c: '#ffffff' },
  // Tucked Paws
  { x: 11, y: 13, w: 4, h: 2, c: '#231714' },
  { x: 6, y: 13, w: 4, h: 2, c: '#231714' },
  // Cozy Curled Tail
  { x: 2, y: 9, w: 3, h: 4, c: '#ff6e27' },
  { x: 1, y: 7, w: 3, h: 3, c: '#ffa05c' },
  { x: 2, y: 5, w: 3, h: 3, c: '#ffffff' },
  { x: 4, y: 5, w: 2, h: 2, c: '#ffffff' },
];

/**
 * Renders pixels with embedded animated visor that switches to neon cyan after Stage 0
 */
function renderPixels(pixels, p = P, visorKeyTime = 0.2786, totalDurStr = '28.0s') {
  return pixels.map(px => {
    if (px.visor) {
      if (visorKeyTime <= 0) {
        return `<rect x="${px.x * p}" y="${px.y * p}" width="${px.w * p}" height="${px.h * p}" fill="#00f0ff"/>`;
      }
      return `<rect x="${px.x * p}" y="${px.y * p}" width="${px.w * p}" height="${px.h * p}" fill="#253545">
        <animate attributeName="fill" values="#253545; #00f0ff; #00f0ff"
          keyTimes="0; ${visorKeyTime}; 1"
          calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
      </rect>`;
    }
    if (px.gleam) {
      if (visorKeyTime <= 0) {
        return `<rect x="${px.x * p}" y="${px.y * p}" width="${px.w * p}" height="${px.h * p}" fill="#ffffff"/>`;
      }
      return `<rect x="${px.x * p}" y="${px.y * p}" width="${px.w * p}" height="${px.h * p}" fill="#354555">
        <animate attributeName="fill" values="#354555; #ffffff; #ffffff"
          keyTimes="0; ${visorKeyTime}; 1"
          calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
      </rect>`;
    }
    return `<rect x="${px.x * p}" y="${px.y * p}" width="${px.w * p}" height="${px.h * p}" fill="${px.c}"/>`;
  }).join('');
}

/**
 * Renders crisp 4-frame walk cycle with natural quadruped physical bounce,
 * spine pitch oscillation, and breathing squash/stretch.
 */
function renderWalkCycle(p = P, visorKeyTime = 0.2786, totalDurStr = '28.0s', dur = '0.52s', prefix = 'walk') {
  const keyTimes = '0; 0.25; 0.5; 0.75; 1';

  return `
  <!-- Quadruped Natural Bounce & Spine Dynamic Container -->
  <g id="${prefix}-bounce">
    <!-- 2-Stroke Vertical Bounce (simulates footfall contact & push-off) -->
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-3.4; 0,-0.6; 0,-3.4; 0,0"
      keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" additive="sum"/>
    <!-- Subtle Spine Pitch Oscillation (tilts forward on push-off) -->
    <animateTransform attributeName="transform" type="rotate"
      values="0 28 20; -2.2 28 20; 0 28 20; 2.2 28 20; 0 28 20"
      keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" additive="sum"/>
    <!-- Micro Elastic Squash-and-Stretch -->
    <animateTransform attributeName="transform" type="scale"
      values="1 1; 1.02 0.98; 0.99 1.01; 1.02 0.98; 1 1"
      keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" additive="sum"/>

    <!-- Frame 0: Contact A -->
    <g id="${prefix}-f0" display="inline" opacity="1">
      <animate attributeName="display" values="inline; none; none; none; inline" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      <animate attributeName="opacity" values="1; 0; 0; 0; 1" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      ${renderPixels(FRAME_0, p, visorKeyTime, totalDurStr)}
    </g>
    <!-- Frame 1: Passing A -->
    <g id="${prefix}-f1" display="none" opacity="0">
      <animate attributeName="display" values="none; inline; none; none; none" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      <animate attributeName="opacity" values="0; 1; 0; 0; 0" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      ${renderPixels(FRAME_1, p, visorKeyTime, totalDurStr)}
    </g>
    <!-- Frame 2: Contact B -->
    <g id="${prefix}-f2" display="none" opacity="0">
      <animate attributeName="display" values="none; none; inline; none; none" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      <animate attributeName="opacity" values="0; 0; 1; 0; 0" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      ${renderPixels(FRAME_2, p, visorKeyTime, totalDurStr)}
    </g>
    <!-- Frame 3: Push-Off B -->
    <g id="${prefix}-f3" display="none" opacity="0">
      <animate attributeName="display" values="none; none; none; inline; none" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      <animate attributeName="opacity" values="0; 0; 0; 1; 0" keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
      ${renderPixels(FRAME_3, p, visorKeyTime, totalDurStr)}
    </g>
  </g>`;
}

/**
 * Companion Cyber Butterfly (tracks fox during street scenes)
 */
function renderCompanionButterfly() {
  return `<!-- Companion Cyber Butterfly -->
  <g id="companion-butterfly" transform="translate(46, -14)">
    <g id="butterfly-wings">
      <animateTransform attributeName="transform" type="scale" values="1 1; 0.2 1; 1 1" dur="0.2s" repeatCount="indefinite"/>
      <ellipse cx="-4" cy="-2" rx="4" ry="3" fill="#00f0ff" opacity="0.85"/>
      <ellipse cx="4" cy="-2" rx="4" ry="3" fill="#ff007f" opacity="0.85"/>
    </g>
    <circle cx="0" cy="0" r="1.5" fill="#ffffff"/>
    <animateTransform attributeName="transform" type="translate" values="46,-14; 52,-20; 46,-14" dur="1.8s" repeatCount="indefinite" additive="sum"/>
  </g>`;
}

// -------------------------------------------------------------
// STREET FOX
// -------------------------------------------------------------
export function renderStreetFox({ timeline, groundY = 192 }) {
  const totalDur = timeline?.totalDur || 28.0;
  const totalDurStr = timeline?.totalDurStr || '28.0s';
  const scenes = timeline?.scenes || [];
  const foxH = 15 * P; // ~39px
  const baseY = groundY - foxH; // Paws land on groundY

  const norm = (t) => Math.max(0, Math.min(1, t / totalDur));

  // Door Centers:
  // Slot 0 (x=16, w=150, door portal center = 46)
  // Slot 1 (x=186, w=150, door portal center = 216)
  // Slot 2 (x=356, w=150, door portal center = 386)
  // Slot 3 (x=526, w=150, door portal center = 556)
  // Campfire (x=696, loaf center = 730)
  const doorX = [46, 216, 386, 556];
  const campfireX = 730;

  // Build high-octane movement waypoints from timeline scenes:
  // During Street 2 (DASH):
  // Anticipation crouch at Door 1 -> Supersonic Rocket Dash -> Skid Brake at Door 2!
  const rawTimes = [0];
  const rawCoords = [`10, ${baseY}`];

  for (const scene of scenes) {
    if (scene.type === 'street') {
      if (scene.stageIndex === 2) {
        // High-Octane DASH between Door 1 and Door 2!
        const tStart = scene.t0;
        const tEnd = scene.t1;
        const dur = tEnd - tStart;
        // 1. Anticipation pause at Door 1 (crouch)
        rawTimes.push(norm(tStart + dur * 0.18));
        rawCoords.push(`${doorX[1]}, ${baseY}`);
        // 2. Rocket burst reaches Door 2 in 50% of time!
        rawTimes.push(norm(tStart + dur * 0.65));
        rawCoords.push(`${doorX[2]}, ${baseY}`);
        // 3. Skid brake at Door 2
        rawTimes.push(norm(tEnd));
        rawCoords.push(`${doorX[2]}, ${baseY}`);
      } else if (scene.stageIndex !== null) {
        // Regular steady trot to door
        const targetX = doorX[scene.stageIndex] ?? 46;
        rawTimes.push(norm(scene.t1));
        rawCoords.push(`${targetX}, ${baseY}`);
      } else {
        // Stroll into campsite
        rawTimes.push(norm(scene.t1));
        rawCoords.push(`${campfireX}, ${baseY}`);
      }
    } else if (scene.type === 'zoom-out') {
      const currentX = doorX[scene.stageIndex] ?? 46;
      rawTimes.push(norm(scene.t1));
      rawCoords.push(`${currentX}, ${baseY}`);
    } else if (scene.type === 'campfire') {
      rawTimes.push(norm(scene.t1));
      rawCoords.push(`${campfireX}, ${baseY}`);
    }
  }
  rawTimes.push(1);
  rawCoords.push(`${campfireX}, ${baseY}`);

  // Deduplicate strictly increasing keyTimes
  const moveTimes = [];
  const moveCoords = [];
  for (let i = 0; i < rawTimes.length; i++) {
    const t = Number(rawTimes[i].toFixed(4));
    if (i === 0 || t > moveTimes[moveTimes.length - 1]) {
      moveTimes.push(t);
      moveCoords.push(rawCoords[i]);
    }
  }
  if (moveTimes[moveTimes.length - 1] < 1) {
    moveTimes.push(1);
    moveCoords.push(`${campfireX}, ${baseY}`);
  }

  // Find when Stage 0 zoom-out ends (visor lights up)
  const zOut0 = scenes.find(s => s.type === 'zoom-out' && s.stageIndex === 0);
  const visorKeyTime = zOut0 ? Number(norm(zOut0.t1).toFixed(4)) : 0.2786;

  // Find Stage 1 zoom-out ends (orbit rings unlock)
  const zOut1 = scenes.find(s => s.type === 'zoom-out' && s.stageIndex === 1);
  const orbitKeyTime = zOut1 ? Number(norm(zOut1.t1).toFixed(4)) : 0.5143;

  // Find Street 1 scene (scan beam active)
  const street1 = scenes.find(s => s.type === 'street' && s.stageIndex === 1);
  const scanT0 = street1 ? Number(norm(street1.t0).toFixed(4)) : 0.2786;
  const scanT1 = street1 ? Number(norm(street1.t1).toFixed(4)) : 0.3286;

  // Find Street 2 scene (dash trail active)
  const street2 = scenes.find(s => s.type === 'street' && s.stageIndex === 2);
  const dashT0 = street2 ? Number(norm(street2.t0).toFixed(4)) : 0.5143;
  const dashDur = street2 ? street2.dur : 1.4;
  const dashBlastStart = street2 ? Number(norm(street2.t0 + dashDur * 0.18).toFixed(4)) : 0.525;
  const dashBlastEnd = street2 ? Number(norm(street2.t0 + dashDur * 0.65).toFixed(4)) : 0.555;
  const dashT1 = street2 ? Number(norm(street2.t1).toFixed(4)) : 0.5643;

  // Find Campfire scene (loaf switch)
  const campfireScene = scenes.find(s => s.type === 'campfire');
  const campT0 = campfireScene ? Number(norm(campfireScene.t0).toFixed(4)) : 0.9643;

  return `<!-- Street Fox Character (p=${P}) -->
  <g id="fox-street" transform="translate(10, ${baseY})">
    <!-- Horizontal Translation Between Doors -->
    <animateTransform attributeName="transform" type="translate"
      values="${moveCoords.join('; ')}"
      keyTimes="${moveTimes.join('; ')}"
      dur="${totalDurStr}" repeatCount="indefinite"/>

    <!-- Ground Contact Shadow with Elastic Scaling -->
    <ellipse cx="28" cy="${foxH + 2}" rx="22" ry="3.5" fill="#04060f" opacity="0.6">
      <animate attributeName="rx" values="22; 19; 22" dur="0.52s" repeatCount="indefinite"/>
    </ellipse>

    <!-- DASH Elastic Squash & Stretch Container (Triggers on Street 2) -->
    <g id="street-fox-dynamics">
      <!-- Scale stretch during dash, crouch on anticipation -->
      <animateTransform attributeName="transform" type="scale"
        values="1 1; 1 1; 1.15 0.82; 1.35 0.72; 1.15 0.88; 1 1; 1 1"
        keyTimes="0; ${dashT0}; ${dashBlastStart}; ${dashBlastEnd}; ${Number(((dashBlastEnd + dashT1) / 2).toFixed(4))}; ${dashT1}; 1"
        dur="${totalDurStr}" repeatCount="indefinite" additive="sum"/>

      <!-- Active Walk Cycle Frames (Switches to loaf at campfire) -->
      <g id="street-walk-frames" display="inline" opacity="1">
        <animate attributeName="display" values="inline; none" keyTimes="0; ${campT0}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1; 0" keyTimes="0; ${campT0}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        ${renderWalkCycle(P, visorKeyTime, totalDurStr, '0.52s', 'street-walk')}
      </g>

      <!-- Campfire Resting Loaf Frame (Cozy Life) -->
      <g id="street-loaf-frame" display="none" opacity="0">
        <animate attributeName="display" values="none; inline" keyTimes="0; ${campT0}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0; 1" keyTimes="0; ${campT0}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <!-- Gentle Sinusoidal Breathing -->
        <g>
          <animateTransform attributeName="transform" type="scale" values="1 1; 1.04 0.96; 1 1" dur="2.2s" repeatCount="indefinite"/>
          ${renderPixels(RESTING_LOAF, P, 0, totalDurStr)}
          <!-- Warm Amber Campfire Glow Overlay on Fur -->
          <ellipse cx="28" cy="24" rx="20" ry="12" fill="#ff6600" opacity="0.12">
            <animate attributeName="opacity" values="0.08; 0.16; 0.08" dur="1.2s" repeatCount="indefinite"/>
          </ellipse>
        </g>
        <!-- Floating Cozy Heart Emote -->
        <g transform="translate(24, -10)">
          <text x="0" y="0" font-family="-apple-system, sans-serif" font-size="12px" fill="#ff007f">♥</text>
          <animateTransform attributeName="transform" type="translate" values="24,-10; 24,-20; 24,-10" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9; 0.4; 0.9" dur="2.4s" repeatCount="indefinite"/>
        </g>
      </g>

      <!-- Unlocked Ability: Orbit Energy Rings (Active after Stage 1) -->
      <g id="orbit-rings" opacity="0">
        <animate attributeName="opacity" values="0; 1; 1" keyTimes="0; ${orbitKeyTime}; 1" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <g transform="translate(28, 20)">
          <ellipse cx="0" cy="0" rx="30" ry="8" fill="none" stroke="#00f0ff" stroke-width="1.2" opacity="0.75">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="0" cy="0" rx="28" ry="7" fill="none" stroke="#ff007f" stroke-width="0.8" opacity="0.55">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="1.8s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      </g>

      <!-- Dash Trail Chromatic Ghosts (Active during Street 2 Dash Blast) -->
      <g id="dash-ghosts" opacity="0">
        <animate attributeName="opacity" values="0; 0.7; 0" keyTimes="0; ${dashBlastStart}; ${dashBlastEnd}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <!-- Cyan Ghost -->
        <g transform="translate(-18, 0)" opacity="0.45">
          ${renderPixels(FRAME_3, P, 0, totalDurStr)}
        </g>
        <!-- Magenta Ghost -->
        <g transform="translate(-36, 0)" opacity="0.25">
          ${renderPixels(FRAME_3, P, 0, totalDurStr)}
        </g>
        <!-- Speed Streak Lines -->
        <line x1="-10" y1="12" x2="-45" y2="12" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="8 4"/>
        <line x1="-15" y1="22" x2="-55" y2="22" stroke="#ff007f" stroke-width="1.5" stroke-dasharray="10 5"/>
        <line x1="-8" y1="30" x2="-40" y2="30" stroke="#00f0ff" stroke-width="1.2" stroke-dasharray="6 3"/>
      </g>

      <!-- Friction Skid Smoke Puffs at Door 2 Braking -->
      <g id="skid-smoke" opacity="0">
        <animate attributeName="opacity" values="0; 0.8; 0" keyTimes="0; ${dashBlastEnd}; ${dashT1}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <circle cx="8" cy="38" r="4" fill="#ffffff" opacity="0.6">
          <animate attributeName="r" values="2; 6; 8" dur="0.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="2" cy="36" r="3" fill="#88aacc" opacity="0.5">
          <animate attributeName="r" values="1; 5; 7" dur="0.4s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Scan Pulse Beam (Active during Street 1) -->
      <g id="scan-pulse" opacity="0">
        <animate attributeName="opacity" values="0; 0.85; 0" keyTimes="0; ${scanT0}; ${scanT1}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        <line x1="48" y1="16" x2="115" y2="10" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 2">
          <animate attributeName="stroke-dashoffset" values="0; -12" dur="0.4s" repeatCount="indefinite"/>
        </line>
        <circle cx="115" cy="10" r="4" fill="#00f0ff" opacity="0.8">
          <animate attributeName="r" values="3; 5.5; 3" dur="0.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    </g>

    <!-- Companion Butterfly -->
    ${renderCompanionButterfly()}
  </g>`;
}

/**
 * Creates an animated fox actor for a specific interior room,
 * synchronized with the master timeline during that room's scene window.
 */
export function renderRoomFox({ archetype, stageIndex = 0, timeline, bounds = { groundY: 192 } }) {
  const { groundY } = bounds;
  const p = 2.4;
  const foxH = 15 * p; // ~36px
  const baseY = groundY - foxH;

  const totalDur = timeline?.totalDur || 28.0;
  const totalDurStr = timeline?.totalDurStr || '28.0s';
  const scenes = timeline?.scenes || [];
  const norm = (t) => Math.max(0, Math.min(1, t / totalDur));

  // Find interior scene
  const interior = scenes.find(s => s.type === 'interior' && s.stageIndex === stageIndex);
  const t0 = interior ? interior.t0 : 2.6;
  const t1 = interior ? interior.t1 : 7.4;
  const dur = interior ? interior.dur : 4.8;

  let waypoints;
  let extraFx;

  if (archetype === 'lab') {
    // Lab: 3 distinct bounding steps up staircase, sprint on mezzanine, high leap to satellite orb!
    waypoints = [
      { relT: 0.00, x: 60, y: baseY },
      { relT: 0.16, x: 160, y: baseY },
      // Step hops up stairs
      { relT: 0.26, x: 200, y: baseY - 18 },
      { relT: 0.36, x: 245, y: baseY - 42 },
      { relT: 0.46, x: 300, y: baseY - 66 },
      // Sprint along mezzanine
      { relT: 0.58, x: 440, y: baseY - 66 },
      // Powerful launch arc to satellite orb
      { relT: 0.70, x: 540, y: baseY - 118 },
      { relT: 0.80, x: 540, y: baseY - 66 },
      { relT: 0.90, x: 300, y: baseY - 66 },
      { relT: 1.00, x: 60, y: baseY },
    ];
    // Orb collection starburst ring
    extraFx = `
      <g transform="translate(560, 68)" opacity="0">
        <animate attributeName="opacity" values="0; 1; 0; 0" keyTimes="0; ${norm(t0 + dur * 0.70)}; ${norm(t0 + dur * 0.78)}; 1" dur="${totalDurStr}" repeatCount="indefinite"/>
        <circle cx="0" cy="0" r="6" fill="none" stroke="#00f0ff" stroke-width="2">
          <animate attributeName="r" values="6; 28; 36" dur="${(dur * 0.1).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>
      </g>
    `;
  } else if (archetype === 'vault') {
    // Vault: Sprint start, 360° airborne somersault through coin arc, terminal unlock!
    waypoints = [
      { relT: 0.00, x: 60, y: baseY },
      { relT: 0.18, x: 180, y: baseY },
      // High parabolic leap through coin arc
      { relT: 0.35, x: 340, y: baseY - 58 },
      { relT: 0.50, x: 480, y: baseY - 70 },
      { relT: 0.65, x: 620, y: baseY - 24 },
      // Lands at safe terminal
      { relT: 0.76, x: 710, y: baseY },
      { relT: 0.88, x: 710, y: baseY },
      { relT: 1.00, x: 60, y: baseY },
    ];
    // Somersault roll rotation during airborne arc (relT 0.25 to 0.70)
    extraFx = `
      <g id="vault-somersault">
        <animateTransform attributeName="transform" type="rotate"
          values="0 28 18; 0 28 18; 360 28 18; 360 28 18"
          keyTimes="0; ${norm(t0 + dur * 0.25)}; ${norm(t0 + dur * 0.70)}; 1"
          dur="${totalDurStr}" repeatCount="indefinite" additive="sum"/>
      </g>
    `;
  } else if (archetype === 'forge') {
    // Forge: Low crouch-slide under hazard laser, anvil interaction, leap to crucible orb
    waypoints = [
      { relT: 0.00, x: 60, y: baseY },
      // Flat slide beneath laser beam
      { relT: 0.18, x: 200, y: baseY + 5 },
      { relT: 0.35, x: 340, y: baseY + 5 },
      // Emerges at cyber anvil
      { relT: 0.48, x: 440, y: baseY },
      // Leap up to suspended crucible orb
      { relT: 0.68, x: 580, y: baseY - 45 },
      { relT: 0.78, x: 700, y: baseY - 75 },
      { relT: 0.88, x: 700, y: baseY },
      { relT: 1.00, x: 60, y: baseY },
    ];
    // Holographic clone stamped at anvil
    extraFx = `
      <g id="forge-clone-stamp" transform="translate(440, ${baseY})" opacity="0">
        <animate attributeName="opacity" values="0; 0.7; 0.7; 0; 0"
          keyTimes="0; ${norm(t0 + dur * 0.45)}; ${norm(t0 + dur * 0.75)}; ${norm(t0 + dur * 0.80)}; 1"
          dur="${totalDurStr}" repeatCount="indefinite"/>
        <g opacity="0.65">
          ${renderPixels(FRAME_0, p, 0, totalDurStr)}
        </g>
        <circle cx="26" cy="18" r="22" fill="#00f0ff" opacity="0.15">
          <animate attributeName="r" values="18; 26; 18" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </g>
    `;
  } else {
    // Tower: Leaves clone on floor switch, vertical ladder climb, gantry bridge sprint!
    waypoints = [
      { relT: 0.00, x: 60, y: baseY },
      // Steps onto pressure plate switch
      { relT: 0.14, x: 95, y: baseY },
      { relT: 0.26, x: 196, y: baseY },
      // Vertical ladder climb
      { relT: 0.38, x: 196, y: baseY - 65 },
      { relT: 0.50, x: 196, y: baseY - 132 },
      // Sprints across overhead gantry
      { relT: 0.66, x: 360, y: baseY - 138 },
      { relT: 0.80, x: 360, y: baseY },
      { relT: 1.00, x: 60, y: baseY },
    ];
    // Clone remains on pressure plate holding security barrier deactivated
    extraFx = `
      <g id="tower-clone-switch" transform="translate(95, ${baseY})" opacity="0">
        <animate attributeName="opacity" values="0; 0.7; 0.7; 0; 0"
          keyTimes="0; ${norm(t0 + dur * 0.20)}; ${norm(t0 + dur * 0.82)}; ${norm(t0 + dur * 0.86)}; 1"
          dur="${totalDurStr}" repeatCount="indefinite"/>
        <g opacity="0.65">
          ${renderPixels(FRAME_0, p, 0, totalDurStr)}
        </g>
      </g>
    `;
  }

  // Map relative waypoints into master timeline interval [t0, t1]
  const rawTimes = [0];
  const rawCoords = [`60, ${baseY}`];

  if (t0 > 0.001) {
    rawTimes.push(norm(t0));
    rawCoords.push(`60, ${baseY}`);
  }

  for (let k = 1; k < waypoints.length - 1; k++) {
    const wp = waypoints[k];
    const absT = t0 + wp.relT * dur;
    rawTimes.push(norm(absT));
    rawCoords.push(`${wp.x}, ${wp.y}`);
  }

  if (t1 < totalDur - 0.001) {
    rawTimes.push(norm(t1));
    rawCoords.push(`60, ${baseY}`);
  }

  rawTimes.push(1);
  rawCoords.push(`60, ${baseY}`);

  // Deduplicate strictly increasing keyTimes
  const pathTimes = [];
  const pathCoords = [];
  for (let i = 0; i < rawTimes.length; i++) {
    const t = Number(rawTimes[i].toFixed(4));
    if (i === 0 || t > pathTimes[pathTimes.length - 1]) {
      pathTimes.push(t);
      pathCoords.push(rawCoords[i]);
    }
  }
  if (pathTimes[pathTimes.length - 1] < 1) {
    pathTimes.push(1);
    pathCoords.push(`60, ${baseY}`);
  }

  return `<!-- Room Actor Fox (${archetype} - Stage ${stageIndex}) -->
  <g id="fox-room-${archetype}-${stageIndex}" transform="translate(60, ${baseY})">
    <animateTransform attributeName="transform" type="translate"
      values="${pathCoords.join('; ')}"
      keyTimes="${pathTimes.join('; ')}"
      dur="${totalDurStr}" repeatCount="indefinite"/>
    <!-- Drop Shadow with Dynamic Elevation -->
    <ellipse cx="26" cy="${foxH + 1}" rx="18" ry="3" fill="#04060f" opacity="0.6">
      <animate attributeName="rx" values="18; 15; 18" dur="0.52s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Walk Cycle Frames (visor lit up cyan inside room) -->
    ${renderWalkCycle(p, 0, totalDurStr, '0.50s', `fox-${archetype}-${stageIndex}`)}
  </g>
  ${extraFx}`;
}

export function renderFoxSprite(options = {}) {
  const role = options.role || 'street';
  if (role === 'room' || role === 'interior') {
    return renderRoomFox(options);
  }
  return renderStreetFox(options);
}

export default renderFoxSprite;

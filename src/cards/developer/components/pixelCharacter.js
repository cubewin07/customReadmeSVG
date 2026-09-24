/**
 * Pixel Character Component
 * Handcrafted 2D pixel-art representation of the user based on the provided portrait:
 * - Wavy / curly voluminous dark hair with textured peaks and natural curl tufts
 * - Warm natural skin tones with expressive eyes & double catchlights
 * - Black crew-neck shirt & stylish dark pants
 * - DYNAMIC CHOREOGRAPHY:
 *   1. Stands up from desk, greets the viewer with a friendly "👋 Hi! I'm Thang" speech bubble
 *   2. Enthusiastically waves right hand back and forth with a warm smile
 *   3. Sits back down at the mechanical keyboard and types code with plasma keystroke sparks
 *   4. Smoothly and continuously loops
 */

export function renderPixelCharacter(action = 'coding') {
  // Center: x=625, y=130, scaled 1.32x for prominent, heroic presence
  return `
  <!-- ==================== PIXEL ART CHARACTER ==================== -->
  <g id="pixel-developer" data-action="${action}" transform="translate(625, 130) scale(1.32)" shape-rendering="crispEdges">
    
    <!-- Ambient Character Back-glow / Silhouette Aura -->
    <ellipse cx="0" cy="14" rx="54" ry="58" fill="url(#char-aura-grad)" opacity="0.5" shape-rendering="geometricPrecision">
      <animate attributeName="opacity" values="0.38;0.65;0.38" dur="3.2s" repeatCount="indefinite" />
      <animate attributeName="rx" values="50;56;50" dur="3.2s" repeatCount="indefinite" />
    </ellipse>

    <!-- ==================== WHOLE BODY STAND-UP CHOREOGRAPHY ==================== -->
    <!-- Translates the whole body from sitting (y=0) to standing (y=-26) and back -->
    <g id="char-standing-body">
      <animateTransform attributeName="transform" type="translate"
        values="0 -26; 0 -26; 0 0; 0 0; 0 -26; 0 -26"
        keyTimes="0; 0.44; 0.52; 0.88; 0.95; 1"
        dur="8s" repeatCount="indefinite" />

      <!-- Lower Body (Pants / Jeans) visible when standing up -->
      <g id="char-legs">
        <animate attributeName="opacity"
          values="1; 1; 0; 0; 1; 1"
          keyTimes="0; 0.44; 0.50; 0.90; 0.95; 1"
          dur="8s" repeatCount="indefinite" />
        <!-- Dark Navy / Charcoal Jeans -->
        <rect x="-24" y="64" width="48" height="28" rx="2" fill="#141722" />
        <!-- Belt line & buckle -->
        <rect x="-24" y="64" width="48" height="3.5" fill="#1f2433" />
        <rect x="-3" y="64" width="6" height="3.5" fill="#e2e8f0" />
        <!-- Leg separation crease -->
        <line x1="0" y1="72" x2="0" y2="92" stroke="#0a0c12" stroke-width="2" />
        <!-- Pocket / denim seam highlights -->
        <path d="M -20 68 Q -14 74 -10 68" fill="none" stroke="#252b3d" stroke-width="1.2" shape-rendering="geometricPrecision" />
        <path d="M 20 68 Q 14 74 10 68" fill="none" stroke="#252b3d" stroke-width="1.2" shape-rendering="geometricPrecision" />
      </g>

      <!-- Torso & Black Crew-Neck T-shirt -->
      <g id="char-torso">
        <!-- Torso Base (Deep Black Crewneck) -->
        <rect x="-32" y="24" width="64" height="42" rx="3" fill="#121216" />
        
        <!-- Left Shoulder Contour & Sleeve -->
        <rect x="-36" y="27" width="6" height="35" fill="#17171d" />
        <rect x="-40" y="33" width="6" height="28" fill="#121216" />
        <rect x="-34" y="29" width="4" height="2" fill="#22222a" opacity="0.6" />

        <!-- Right Shoulder Contour & Sleeve -->
        <rect x="30" y="27" width="6" height="35" fill="#17171d" />
        <rect x="34" y="33" width="6" height="28" fill="#121216" />
        <rect x="30" y="29" width="4" height="2" fill="#22222a" opacity="0.6" />

        <!-- Crew-Neck Collar Rim (distinct rounded contour) -->
        <path d="M -13 23 Q 0 32 13 23" fill="none" stroke="#2c2c36" stroke-width="2.5" shape-rendering="geometricPrecision" />
        <!-- Crew-Neck Inner Neck Shadow -->
        <path d="M -11 23 Q 0 30 11 23 Z" fill="#0b0b0e" />
        
        <!-- Fabric folds & chest contour highlights -->
        <rect x="-20" y="36" width="40" height="2" fill="#1f1f28" opacity="0.7" />
        <rect x="-24" y="47" width="48" height="2" fill="#1a1a22" opacity="0.6" />
        <rect x="-16" y="57" width="32" height="2" fill="#181820" opacity="0.5" />
        
        <!-- Exposed Neck (Warm Honey Skin Tone) -->
        <rect x="-9" y="13" width="18" height="13" fill="#f0be97" />
        <rect x="-9" y="19" width="18" height="5" fill="#d99971" /> <!-- neck throat shadow -->
      </g>

      <!-- Head & Hair Group (Animated Subtle Breathing & Head Bob) -->
      <g id="char-head-group">
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -1.4; 0 0"
          dur="2.8s" repeatCount="indefinite" />

        <!-- Head Base Structure (Face Shape & Jaw) -->
        <rect x="-19" y="-13" width="38" height="29" rx="4" fill="#f5c29b" />
        <rect x="-16" y="13" width="32" height="6" fill="#e5a67d" /> <!-- Chin shadow -->
        <rect x="-12" y="17" width="24" height="3" fill="#cf8e66" /> <!-- Under-chin depth -->

        <!-- Ears (with inner cartilage depth) -->
        <rect x="-22" y="-3" width="4" height="11" rx="1" fill="#ebae86" />
        <rect x="-21" y="0" width="2" height="5" fill="#cf8e66" />
        <rect x="18" y="-3" width="4" height="11" rx="1" fill="#ebae86" />
        <rect x="19" y="0" width="2" height="5" fill="#cf8e66" />

        <!-- Facial Features -->
        <!-- Eyebrows (Distinct dark, gently arched, friendly) -->
        <rect x="-15" y="-4.5" width="10" height="2.8" rx="1.2" fill="#201e28" />
        <rect x="5" y="-4.5" width="10" height="2.8" rx="1.2" fill="#201e28" />

        <!-- Left Eye -->
        <g id="char-eye-left">
          <!-- Sclera -->
          <rect x="-14" y="1.5" width="8" height="6.5" rx="1" fill="#ffffff" />
          <!-- Iris & Pupil (Dark Charcoal/Brown) -->
          <rect x="-13" y="1.5" width="6" height="6" fill="#15141b" />
          <!-- Primary Catchlight -->
          <rect x="-13" y="2" width="2" height="2" fill="#ffffff" />
          <rect x="-10" y="4.5" width="1" height="1" fill="#cbd5e1" opacity="0.8" />
          <rect x="-14" y="7.5" width="8" height="1" fill="#dc9b73" />
          
          <!-- Blink Animation -->
          <rect x="-15" y="0.5" width="10" height="8.5" fill="#f5c29b" opacity="0">
            <animate attributeName="opacity"
              values="0; 0; 1; 1; 0; 0"
              keyTimes="0; 0.94; 0.95; 0.97; 0.98; 1"
              dur="3.6s" repeatCount="indefinite" />
          </rect>
        </g>

        <!-- Right Eye -->
        <g id="char-eye-right">
          <!-- Sclera -->
          <rect x="6" y="1.5" width="8" height="6.5" rx="1" fill="#ffffff" />
          <!-- Iris & Pupil (Dark Charcoal/Brown) -->
          <rect x="7" y="1.5" width="6" height="6" fill="#15141b" />
          <!-- Primary Catchlight -->
          <rect x="7" y="2" width="2" height="2" fill="#ffffff" />
          <rect x="10" y="4.5" width="1" height="1" fill="#cbd5e1" opacity="0.8" />
          <rect x="6" y="7.5" width="8" height="1" fill="#dc9b73" />
          
          <!-- Blink Animation -->
          <rect x="5" y="0.5" width="10" height="8.5" fill="#f5c29b" opacity="0">
            <animate attributeName="opacity"
              values="0; 0; 1; 1; 0; 0"
              keyTimes="0; 0.94; 0.95; 0.97; 0.98; 1"
              dur="3.6s" repeatCount="indefinite" />
          </rect>
        </g>

        <!-- Nose (Bridge and defined warm tip) -->
        <rect x="-1.5" y="3.5" width="3" height="5.5" fill="#e7a880" />
        <rect x="-3" y="8" width="6" height="2.2" rx="1" fill="#d7936d" />

        <!-- Cheeks (Youthful subtle glow) -->
        <rect x="-16" y="9.5" width="5" height="2.5" rx="1" fill="#ea9c86" opacity="0.65" />
        <rect x="11" y="9.5" width="5" height="2.5" rx="1" fill="#ea9c86" opacity="0.65" />

        <!-- ==================== DYNAMIC MOUTH (SMILE vs TYPING) ==================== -->
        <!-- Wide Friendly Smile (Active when standing and waving) -->
        <g id="mouth-waving" shape-rendering="geometricPrecision">
          <path d="M -6 12 Q 0 19 6 12 Z" fill="#ffffff" stroke="#9d5345" stroke-width="1.2" />
          <path d="M -4 15 Q 0 18 4 15 Z" fill="#e11d48" opacity="0.8" />
          <animate attributeName="opacity"
            values="1; 1; 0; 0; 1; 1"
            keyTimes="0; 0.44; 0.52; 0.88; 0.95; 1"
            dur="8s" repeatCount="indefinite" />
        </g>

        <!-- Focused Dev Smirk (Active when sitting and typing) -->
        <g id="mouth-typing">
          <rect x="-4.5" y="12.5" width="9" height="2.2" rx="1" fill="#be705e" />
          <rect x="-3" y="13.5" width="6" height="1.2" fill="#9d5345" />
          <animate attributeName="opacity"
            values="0; 0; 1; 1; 0; 0"
            keyTimes="0; 0.44; 0.52; 0.88; 0.95; 1"
            dur="8s" repeatCount="indefinite" />
        </g>

        <!-- ==================== SIGNATURE WAVY / CURLY HAIR ==================== -->
        <!-- Modeled directly after user's photo with textured curls, waves & volume -->
        <g id="char-hair">
          <!-- Hair Base Shadow Silhouette -->
          <path d="M -25 -8 
                   C -27 -18, -22 -31, -15 -35 
                   C -6 -39, 6 -39, 15 -35 
                   C 22 -31, 27 -18, 25 -8 
                   L 22 2 L 18 -6 L 12 -9 L 0 -8 L -12 -9 L -18 -6 L -22 2 Z" 
                fill="#121117" shape-rendering="geometricPrecision" />

          <!-- Hair Core Curly Volume Layer 1 -->
          <rect x="-22" y="-32" width="44" height="22" rx="7" fill="#1b1923" />
          <rect x="-19" y="-36" width="38" height="18" rx="6" fill="#23202e" />
          
          <!-- Distinctive Curly Crown Peaks (Top Wave Tufts from photo) -->
          <rect x="-18" y="-39" width="8" height="7" rx="2.5" fill="#2c283a" />
          <rect x="-8" y="-41" width="9" height="8" rx="3" fill="#2c283a" />
          <rect x="3" y="-40" width="8" height="7" rx="2.5" fill="#2c283a" />
          <rect x="12" y="-38" width="7" height="6" rx="2.5" fill="#23202e" />

          <!-- Side Curls & Flairs framing the temples -->
          <rect x="-26" y="-24" width="8" height="18" rx="3.5" fill="#191721" />
          <rect x="-24" y="-15" width="6" height="14" rx="2.5" fill="#23202e" />
          <rect x="18" y="-24" width="8" height="18" rx="3.5" fill="#191721" />
          <rect x="19" y="-15" width="6" height="14" rx="2.5" fill="#23202e" />

          <!-- Forehead Fringe Curls (Parted natural wave clusters) -->
          <rect x="-18" y="-13" width="7" height="9" rx="2" fill="#282436" />
          <rect x="-10" y="-14" width="8" height="10" rx="2.5" fill="#322d44" />
          <rect x="-2" y="-15" width="7" height="8" rx="2" fill="#282436" />
          <rect x="5" y="-14" width="8" height="10" rx="2.5" fill="#322d44" />
          <rect x="13" y="-13" width="7" height="9" rx="2" fill="#23202e" />

          <!-- Wavy Hair Luster Highlights -->
          <rect x="-14" y="-34" width="6" height="2.5" rx="1.2" fill="#4a4460" opacity="0.8" />
          <rect x="-5" y="-36" width="7" height="3" rx="1.5" fill="#4a4460" opacity="0.85" />
          <rect x="5" y="-35" width="6" height="2.5" rx="1.2" fill="#4a4460" opacity="0.8" />
          <rect x="-9" y="-9" width="4" height="2.2" fill="#4a4460" opacity="0.65" />
          <rect x="7" y="-9" width="4" height="2.2" fill="#4a4460" opacity="0.65" />
        </g>
      </g> <!-- End Head Group -->

      <!-- ==================== ANIMATION STATE A: STANDING & WAVING HELLO ==================== -->
      <!-- Visible during standing interval (t=0 to 0.44s, t=0.95 to 1s) -->
      <g id="state-waving">
        <animate attributeName="opacity"
          values="1; 1; 0; 0; 1; 1"
          keyTimes="0; 0.44; 0.50; 0.90; 0.95; 1"
          dur="8s" repeatCount="indefinite" />

        <!-- Left Arm: Comfortably Resting at Side / Hip -->
        <g id="standing-left-arm">
          <!-- Upper sleeve -->
          <rect x="-37" y="32" width="10" height="20" rx="2.5" fill="#121216" />
          <!-- Forearm & Hand at hip -->
          <rect x="-35" y="48" width="9" height="18" rx="2" fill="#e7a87e" />
          <rect x="-34" y="62" width="10" height="7" rx="2.5" fill="#f5c29b" />
        </g>

        <!-- Right Arm: Raised High, Actively Waving Hello! -->
        <g id="standing-right-arm">
          <!-- Raised Upper Arm / Shoulder Connection -->
          <path d="M 32 30 L 46 16 L 38 10 L 26 26 Z" fill="#121216" />
          
          <!-- Oscillating Forearm & Waving Hand (Rotates around elbow pivot at 42, 13) -->
          <g id="waving-forearm-hand">
            <animateTransform attributeName="transform" type="rotate"
              values="-16 42 13; 18 42 13; -16 42 13"
              dur="0.48s" repeatCount="indefinite" />
            
            <!-- Raised Forearm -->
            <rect x="40" y="-12" width="9" height="26" rx="3" fill="#e7a87e" transform="rotate(12 44 2)" />
            
            <!-- Open Waving Hand with Spread Fingers -->
            <g transform="translate(48, -14)">
              <!-- Palm -->
              <rect x="-6" y="-8" width="13" height="11" rx="2.5" fill="#f5c29b" />
              <!-- Thumb -->
              <rect x="-9" y="-4" width="4" height="6" rx="1.5" fill="#e7a87e" />
              <!-- Index, Middle, Ring, Pinky Fingers Spread Open -->
              <rect x="-5" y="-14" width="2.6" height="7" rx="1.2" fill="#f5c29b" />
              <rect x="-2" y="-16" width="2.8" height="9" rx="1.2" fill="#f5c29b" />
              <rect x="1.5" y="-15" width="2.6" height="8" rx="1.2" fill="#f5c29b" />
              <rect x="4.5" y="-12" width="2.4" height="6" rx="1.2" fill="#e7a87e" />
            </g>
          </g>
        </g>

        <!-- Friendly Speech / Greeting Bubble "👋 Hi! I'm Thang" -->
        <g id="greeting-speech-bubble" transform="translate(68, -32)" shape-rendering="geometricPrecision">
          <g>
            <animateTransform attributeName="transform" type="translate"
              values="0 0; 0 -3; 0 0" dur="2s" repeatCount="indefinite" />
            <!-- Bubble Box -->
            <rect x="-8" y="-14" width="88" height="25" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.3" />
            <!-- Speech tail pointer -->
            <polygon points="-8,-2 -16,4 -4,4" fill="#0f172a" />
            <line x1="-8" y1="-2" x2="-16" y2="4" stroke="#38bdf8" stroke-width="1.3" />
            <line x1="-16" y1="4" x2="-4" y2="4" stroke="#38bdf8" stroke-width="1.3" />
            <!-- Greeting Text -->
            <text x="36" y="2" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#f8fafc">
              👋 Hi, I&apos;m Thang!
            </text>
          </g>
        </g>
      </g> <!-- End State Waving -->

      <!-- ==================== ANIMATION STATE B: SITTING & RAPID CODING ==================== -->
      <!-- Visible during sitting interval (t=0.52s to 0.88s) -->
      <g id="state-coding">
        <animate attributeName="opacity"
          values="0; 0; 1; 1; 0; 0"
          keyTimes="0; 0.46; 0.52; 0.86; 0.92; 1"
          dur="8s" repeatCount="indefinite" />

        <!-- Left Forearm & Hand (Alternating fast keystrokes) -->
        <g id="arm-left">
          <animateTransform attributeName="transform" type="translate"
            values="0 0; -1 -2.5; 0 0; 1 -1.5; 0 0"
            dur="0.32s" repeatCount="indefinite" />
          <!-- Upper arm sleeve -->
          <rect x="-36" y="38" width="11" height="17" rx="2" fill="#121216" />
          <!-- Forearm (Warm Skin) -->
          <rect x="-30" y="48" width="9" height="17" rx="2" fill="#e7a87e" />
          <!-- Left Hand tapping on keys -->
          <rect x="-26" y="60" width="11" height="6.5" rx="2" fill="#f5c29b" />
          <rect x="-25" y="63" width="3.5" height="4" fill="#dc9b72" />
          <rect x="-20" y="63" width="3.5" height="4" fill="#dc9b72" />
        </g>

        <!-- Right Forearm & Hand (Alternating out-of-phase keystrokes) -->
        <g id="arm-right">
          <animateTransform attributeName="transform" type="translate"
            values="0 -2; 1 0; 0 -2.5; -1 0; 0 -1"
            dur="0.28s" repeatCount="indefinite" />
          <!-- Upper arm sleeve -->
          <rect x="25" y="38" width="11" height="17" rx="2" fill="#121216" />
          <!-- Forearm (Warm Skin) -->
          <rect x="21" y="48" width="9" height="17" rx="2" fill="#e7a87e" />
          <!-- Right Hand tapping on keys -->
          <rect x="15" y="60" width="11" height="6.5" rx="2" fill="#f5c29b" />
          <rect x="17" y="63" width="3.5" height="4" fill="#dc9b72" />
          <rect x="22" y="63" width="3.5" height="4" fill="#dc9b72" />
        </g>

        <!-- Keypress Plasma Particles Rising From Keyboard -->
        <g id="keystroke-particles" shape-rendering="geometricPrecision">
          <!-- Particle 1 (Cyan) -->
          <circle cx="-18" cy="62" r="1.6" fill="#38bdf8">
            <animate attributeName="cy" values="62; 46; 34" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9; 0.5; 0" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="cx" values="-18; -24; -28" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <!-- Particle 2 (Violet / Magenta) -->
          <circle cx="20" cy="62" r="1.6" fill="#c084fc">
            <animate attributeName="cy" values="62; 44; 30" dur="0.95s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9; 0.5; 0" dur="0.95s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="cx" values="20; 26; 30" dur="0.95s" begin="0.3s" repeatCount="indefinite" />
          </circle>
          <!-- Particle 3 (Amber/Green) -->
          <circle cx="0" cy="64" r="1.4" fill="#34d399">
            <animate attributeName="cy" values="64; 50; 38" dur="0.75s" begin="0.15s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9; 0.4; 0" dur="0.75s" begin="0.15s" repeatCount="indefinite" />
          </circle>
        </g>
      </g> <!-- End State Coding -->

    </g> <!-- End char-standing-body -->

  </g>
  `;
}

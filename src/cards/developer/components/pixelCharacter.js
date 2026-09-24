/**
 * Pixel Character Component
 * Handcrafted 2D pixel-art representation of the user based on the provided portrait:
 * - Wavy / curly voluminous dark hair with textured peaks and natural curl tufts
 * - Warm natural skin tones with expressive eyes & double catchlights
 * - Black crew-neck shirt
 * - Animated breathing, natural eye blink, mechanical keyboard typing arms, and keystroke sparks
 */

export function renderPixelCharacter(action = 'coding') {
  // Center: x=625, y=130, scaled 1.35x for prominent, heroic presence
  return `
  <!-- ==================== PIXEL ART CHARACTER ==================== -->
  <g id="pixel-developer" data-action="${action}" transform="translate(625, 130) scale(1.32)" shape-rendering="crispEdges">
    
    <!-- Ambient Character Back-glow / Silhouette Aura -->
    <ellipse cx="0" cy="18" rx="52" ry="56" fill="url(#char-aura-grad)" opacity="0.5" shape-rendering="geometricPrecision">
      <animate attributeName="opacity" values="0.38;0.65;0.38" dur="3.2s" repeatCount="indefinite" />
      <animate attributeName="rx" values="50;56;50" dur="3.2s" repeatCount="indefinite" />
    </ellipse>

    <!-- Torso & Black Crew-Neck T-shirt -->
    <g id="char-torso">
      <!-- Torso Base (Deep Black Crewneck) -->
      <rect x="-32" y="24" width="64" height="42" rx="3" fill="#121216" />
      
      <!-- Left Shoulder Contour & Sleeve -->
      <rect x="-36" y="27" width="6" height="35" fill="#17171d" />
      <rect x="-40" y="33" width="6" height="28" fill="#121216" />
      <rect x="-34" y="29" width="4" height="2" fill="#22222a" opacity="0.6" /> <!-- shoulder seam highlight -->

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
        values="0 0; 0 -1.6; 0 0"
        dur="3s" repeatCount="indefinite" />

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
      <!-- Eyebrows (Distinct dark, gently arched, confident) -->
      <rect x="-15" y="-4.5" width="10" height="2.8" rx="1.2" fill="#201e28" />
      <rect x="5" y="-4.5" width="10" height="2.8" rx="1.2" fill="#201e28" />

      <!-- Left Eye -->
      <g id="char-eye-left">
        <!-- Sclera -->
        <rect x="-14" y="1.5" width="8" height="6.5" rx="1" fill="#ffffff" />
        <!-- Iris & Pupil (Dark Charcoal/Brown) -->
        <rect x="-13" y="1.5" width="6" height="6" fill="#15141b" />
        <!-- Primary Catchlight (Sparkle dot) -->
        <rect x="-13" y="2" width="2" height="2" fill="#ffffff" />
        <rect x="-10" y="4.5" width="1" height="1" fill="#cbd5e1" opacity="0.8" />
        <!-- Lower eyelid tone -->
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
        <!-- Lower eyelid tone -->
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

      <!-- Mouth (Focused, subtle friendly smirk) -->
      <rect x="-4.5" y="12.5" width="9" height="2.2" rx="1" fill="#be705e" />
      <rect x="-3" y="13.5" width="6" height="1.2" fill="#9d5345" />

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

      <!-- Floating Idea / Code Sparks Overhead -->
      <g id="floating-code-spark" transform="translate(20, -42)">
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="0 0; 0 -6; 0 0" dur="2.4s" repeatCount="indefinite" />
          <!-- Mini Glowing Code Badge "{ ; }" -->
          <rect x="-13" y="-13" width="26" height="15" rx="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.3" shape-rendering="geometricPrecision" />
          <text x="0" y="-2" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="bold" fill="#38bdf8" shape-rendering="geometricPrecision">{ ; }</text>
          <!-- Sparkle star -->
          <circle cx="11" cy="-11" r="1.8" fill="#facc15" shape-rendering="geometricPrecision">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </g> <!-- End Head Group -->

    <!-- ==================== ANIMATED ARMS & MECHANICAL TYPING ==================== -->
    <g id="char-typing-arms">
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
    </g>

  </g>
  `;
}

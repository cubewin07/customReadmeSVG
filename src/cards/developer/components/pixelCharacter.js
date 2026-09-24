/**
 * Pixel Character Component
 * Handcrafted 2D pixel-art representation of the user based on the provided portrait.
 *
 * Implements the single-pose kinematic standing setup:
 * - Permanent standing pose at desk height (body shift y=0, hands meet keys at world y≈212)
 * - Single 7s phrase on right arm (Shoulder -> Forearm -> Wrist kinematics with exact cubic splines)
 * - Shared 7s timeline across torso sway, head nod/tilt, mouth speech, and eye blinks/wink
 * - Independent ±1px breath (3.4s) on head and chest only (arms stay anchored to keys)
 * - Separate 2.4s left-hand tap with two 1.6s keystroke sparks
 * - Strict paint-order split: renderCharacterBody() [Layer 2] and renderCharacterArms() [Layer 4]
 */

export function renderCharacterBody() {
  return `
  <!-- ==================== CHARACTER LAYER 2: BODY, HEAD & LEGS ==================== -->
  <g id="pixel-developer-body" transform="translate(625, 130) scale(1.32)" shape-rendering="crispEdges">
    
    <!-- Ambient Character Back-glow / Silhouette Aura -->
    <ellipse cx="0" cy="18" rx="54" ry="58" fill="url(#char-aura-grad)" opacity="0.45" shape-rendering="geometricPrecision">
      <animate attributeName="opacity" values="0.35;0.60;0.35" dur="3.4s" repeatCount="indefinite" />
      <animate attributeName="rx" values="50;56;50" dur="3.4s" repeatCount="indefinite" />
    </ellipse>

    <!-- Lower Body (Jeans): Runs through world y≈214-251, covered by foreground desk -->
    <g id="char-legs">
      <!-- Dark Navy / Charcoal Jeans -->
      <rect x="-24" y="64" width="48" height="32" rx="2" fill="#141722" />
      <!-- Belt line & buckle -->
      <rect x="-24" y="64" width="48" height="3.5" fill="#1f2433" />
      <rect x="-3" y="64" width="6" height="3.5" fill="#e2e8f0" />
      <!-- Leg separation crease -->
      <line x1="0" y1="72" x2="0" y2="94" stroke="#0a0c12" stroke-width="2" />
      <!-- Pocket / denim seam highlights -->
      <path d="M -20 68 Q -14 74 -10 68" fill="none" stroke="#252b3d" stroke-width="1.2" shape-rendering="geometricPrecision" />
      <path d="M 20 68 Q 14 74 10 68" fill="none" stroke="#252b3d" stroke-width="1.2" shape-rendering="geometricPrecision" />
    </g>

    <!-- Torso with Torso Sway around pivot (0, 70) on shared 7s timeline -->
    <g transform="translate(0, 70)">
      <g id="torso-sway">
        <animateTransform attributeName="transform" type="rotate"
          values="0; 1.4; -0.8; 0.6; -0.5; 0.2; 0"
          keyTimes="0; 0.08; 0.20; 0.40; 0.60; 0.88; 1"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95"
          dur="7s" repeatCount="indefinite" />

        <g transform="translate(0, -70)">
          <!-- Chest Breath Loop: ±1px on 3.4s loop (arms kept separate) -->
          <g id="chest-breath">
            <animateTransform attributeName="transform" type="translate"
              values="0 0; 0 -1; 0 0"
              calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
              dur="3.4s" repeatCount="indefinite" />

            <!-- Torso Base (Deep Black Crewneck) -->
            <rect x="-32" y="24" width="64" height="42" rx="3" fill="#121216" />
            
            <!-- Shoulder Slopes -->
            <rect x="-36" y="27" width="6" height="35" fill="#17171d" />
            <rect x="-40" y="33" width="6" height="28" fill="#121216" />
            <rect x="-34" y="29" width="4" height="2" fill="#22222a" opacity="0.6" />

            <rect x="30" y="27" width="6" height="35" fill="#17171d" />
            <rect x="34" y="33" width="6" height="28" fill="#121216" />
            <rect x="30" y="29" width="4" height="2" fill="#22222a" opacity="0.6" />

            <!-- Crew-Neck Collar Rim -->
            <path d="M -13 23 Q 0 32 13 23" fill="none" stroke="#2c2c36" stroke-width="2.5" shape-rendering="geometricPrecision" />
            <path d="M -11 23 Q 0 30 11 23 Z" fill="#0b0b0e" />
            
            <!-- Fabric folds -->
            <rect x="-20" y="36" width="40" height="2" fill="#1f1f28" opacity="0.7" />
            <rect x="-24" y="47" width="48" height="2" fill="#1a1a22" opacity="0.6" />
            <rect x="-16" y="57" width="32" height="2" fill="#181820" opacity="0.5" />
            
            <!-- Exposed Neck (Warm Honey Skin Tone) -->
            <rect x="-9" y="13" width="18" height="13" fill="#f0be97" />
            <rect x="-9" y="19" width="18" height="5" fill="#d99971" />
          </g>
        </g>
      </g>
    </g>

    <!-- Head & Hair Group: Pivot at (0, 4) with 7s tilt + nod + 3.4s breath -->
    <g transform="translate(0, 4)">
      <!-- Nod translate over 7s timeline -->
      <g id="head-nod">
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 1.2; 0 -0.6; 0 -0.3; 0 0; 0 0"
          keyTimes="0; 0.08; 0.22; 0.55; 0.88; 1"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95"
          dur="7s" repeatCount="indefinite" />

        <!-- Head tilt rotate over 7s timeline -->
        <g id="head-tilt">
          <animateTransform attributeName="transform" type="rotate"
            values="0; 1.5; -2.4; -1.2; 0; 0"
            keyTimes="0; 0.08; 0.22; 0.55; 0.88; 1"
            calcMode="spline"
            keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95"
            dur="7s" repeatCount="indefinite" />

          <!-- Head breath: ±1px on 3.4s loop -->
          <g id="head-breath">
            <animateTransform attributeName="transform" type="translate"
              values="0 0; 0 -1; 0 0"
              calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
              dur="3.4s" repeatCount="indefinite" />

            <g transform="translate(0, -4)">
              <!-- Face Shape & Jaw -->
              <rect x="-19" y="-13" width="38" height="29" rx="4" fill="#f5c29b" />
              <rect x="-16" y="13" width="32" height="6" fill="#e5a67d" />
              <rect x="-12" y="17" width="24" height="3" fill="#cf8e66" />

              <!-- Ears -->
              <rect x="-22" y="-3" width="4" height="11" rx="1" fill="#ebae86" />
              <rect x="-21" y="0" width="2" height="5" fill="#cf8e66" />
              <rect x="18" y="-3" width="4" height="11" rx="1" fill="#ebae86" />
              <rect x="19" y="0" width="2" height="5" fill="#cf8e66" />

              <!-- Eyebrows -->
              <rect x="-15" y="-4.5" width="10" height="2.8" rx="1.2" fill="#201e28" />
              <rect x="5" y="-4.5" width="10" height="2.8" rx="1.2" fill="#201e28" />

              <!-- Left Eye (Screen-Left): Blinks at 0.06 - 0.09 -->
              <g id="char-eye-left">
                <rect x="-14" y="1.5" width="8" height="6.5" rx="1" fill="#ffffff" />
                <rect x="-13" y="1.5" width="6" height="6" fill="#15141b" />
                <rect x="-13" y="2" width="2" height="2" fill="#ffffff" />
                <rect x="-10" y="4.5" width="1" height="1" fill="#cbd5e1" opacity="0.8" />
                <rect x="-14" y="7.5" width="8" height="1" fill="#dc9b73" />
                
                <!-- Blink Animation -->
                <rect x="-15" y="0.5" width="10" height="8.5" fill="#f5c29b" opacity="0">
                  <animate attributeName="opacity"
                    values="0; 0; 1; 1; 0; 0"
                    keyTimes="0; 0.06; 0.07; 0.085; 0.095; 1"
                    dur="7s" repeatCount="indefinite" />
                </rect>
              </g>

              <!-- Right Eye (Screen-Right): Blinks at 0.06 - 0.09 AND winks at 0.48 - 0.54 -->
              <g id="char-eye-right">
                <rect x="6" y="1.5" width="8" height="6.5" rx="1" fill="#ffffff" />
                <rect x="7" y="1.5" width="6" height="6" fill="#15141b" />
                <rect x="7" y="2" width="2" height="2" fill="#ffffff" />
                <rect x="10" y="4.5" width="1" height="1" fill="#cbd5e1" opacity="0.8" />
                <rect x="6" y="7.5" width="8" height="1" fill="#dc9b73" />
                
                <!-- Lid Animation (Blink + Wink) -->
                <rect x="5" y="0.5" width="10" height="8.5" fill="#f5c29b" opacity="0">
                  <animate attributeName="opacity"
                    values="0; 0; 1; 1; 0; 0; 0; 1; 1; 0; 0"
                    keyTimes="0; 0.06; 0.07; 0.085; 0.095; 0.48; 0.49; 0.53; 0.54; 0.55; 1"
                    dur="7s" repeatCount="indefinite" />
                </rect>
                <!-- Playful Wink Arc -->
                <path d="M 6 6 Q 10 3 14 6" fill="none" stroke="#201e28" stroke-width="1.8" opacity="0" shape-rendering="geometricPrecision">
                  <animate attributeName="opacity"
                    values="0; 0; 1; 1; 0; 0"
                    keyTimes="0; 0.48; 0.49; 0.53; 0.54; 1"
                    dur="7s" repeatCount="indefinite" />
                </path>
              </g>

              <!-- Nose -->
              <rect x="-1.5" y="3.5" width="3" height="5.5" fill="#e7a880" />
              <rect x="-3" y="8" width="6" height="2.2" rx="1" fill="#d7936d" />

              <!-- Cheeks -->
              <rect x="-16" y="9.5" width="5" height="2.5" rx="1" fill="#ea9c86" opacity="0.65" />
              <rect x="11" y="9.5" width="5" height="2.5" rx="1" fill="#ea9c86" opacity="0.65" />

              <!-- Single Animated Mouth Path: opens on 3 big forearm peaks (0.30, 0.50, 0.72) -->
              <path fill="#ffffff" stroke="#9d5345" stroke-width="1.2" shape-rendering="geometricPrecision"
                d="M -6 12 Q 0 16 6 12">
                <animate attributeName="d"
                  values="M -6 12 Q 0 16 6 12; M -6 12 Q 0 16 6 12; M -6 12 Q 0 18.5 6 12; M -6 12 Q 0 16.5 6 12; M -6 12 Q 0 18.5 6 12; M -6 12 Q 0 16.5 6 12; M -6 12 Q 0 18.5 6 12; M -6 12 Q 0 16 6 12; M -6 12 Q 0 16 6 12; M -6 12 Q 0 16 6 12"
                  keyTimes="0; 0.22; 0.30; 0.40; 0.50; 0.60; 0.72; 0.82; 0.88; 1"
                  calcMode="spline"
                  keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
                  dur="7s" repeatCount="indefinite" />
              </path>

              <!-- Signature Wavy / Curly Hair Silhouette -->
              <g id="char-hair">
                <path d="M -25 -8 
                         C -27 -18, -22 -31, -15 -35 
                         C -6 -39, 6 -39, 15 -35 
                         C 22 -31, 27 -18, 25 -8 
                         L 22 2 L 18 -6 L 12 -9 L 0 -8 L -12 -9 L -18 -6 L -22 2 Z" 
                      fill="#121117" shape-rendering="geometricPrecision" />

                <!-- Hair Core Curly Volume -->
                <rect x="-22" y="-32" width="44" height="22" rx="7" fill="#1b1923" />
                <rect x="-19" y="-36" width="38" height="18" rx="6" fill="#23202e" />
                
                <!-- Distinctive Curly Crown Peaks -->
                <rect x="-18" y="-39" width="8" height="7" rx="2.5" fill="#2c283a" />
                <rect x="-8" y="-41" width="9" height="8" rx="3" fill="#2c283a" />
                <rect x="3" y="-40" width="8" height="7" rx="2.5" fill="#2c283a" />
                <rect x="12" y="-38" width="7" height="6" rx="2.5" fill="#23202e" />

                <!-- Side Curls -->
                <rect x="-26" y="-24" width="8" height="18" rx="3.5" fill="#191721" />
                <rect x="-24" y="-15" width="6" height="14" rx="2.5" fill="#23202e" />
                <rect x="18" y="-24" width="8" height="18" rx="3.5" fill="#191721" />
                <rect x="19" y="-15" width="6" height="14" rx="2.5" fill="#23202e" />

                <!-- Forehead Fringe Curls -->
                <rect x="-18" y="-13" width="7" height="9" rx="2" fill="#282436" />
                <rect x="-10" y="-14" width="8" height="10" rx="2.5" fill="#322d44" />
                <rect x="-2" y="-15" width="7" height="8" rx="2" fill="#282436" />
                <rect x="5" y="-14" width="8" height="10" rx="2.5" fill="#322d44" />
                <rect x="13" y="-13" width="7" height="9" rx="2" fill="#23202e" />

                <!-- Highlights -->
                <rect x="-14" y="-34" width="6" height="2.5" rx="1.2" fill="#4a4460" opacity="0.8" />
                <rect x="-5" y="-36" width="7" height="3" rx="1.5" fill="#4a4460" opacity="0.85" />
                <rect x="5" y="-35" width="6" height="2.5" rx="1.2" fill="#4a4460" opacity="0.8" />
                <rect x="-9" y="-9" width="4" height="2.2" fill="#4a4460" opacity="0.65" />
                <rect x="7" y="-9" width="4" height="2.2" fill="#4a4460" opacity="0.65" />
              </g>

              <!-- Floating { ; } Spark Overhead -->
              <g id="floating-code-spark" transform="translate(20, -42)">
                <g>
                  <animateTransform attributeName="transform" type="translate"
                    values="0 0; 0 -5; 0 0" dur="2.4s" repeatCount="indefinite" />
                  <rect x="-13" y="-13" width="26" height="15" rx="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.3" shape-rendering="geometricPrecision" />
                  <text x="0" y="-2" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="bold" fill="#38bdf8" shape-rendering="geometricPrecision">{ ; }</text>
                  <circle cx="11" cy="-11" r="1.8" fill="#facc15" shape-rendering="geometricPrecision">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </g>
              </g>

            </g> <!-- end translate(0, -4) -->
          </g> <!-- end head-breath -->
        </g> <!-- end head-tilt -->
      </g> <!-- end head-nod -->
    </g> <!-- end head pivot translate(0, 4) -->

  </g>
  `;
}

export function renderCharacterArms() {
  return `
  <!-- ==================== CHARACTER LAYER 4: ARMS & HANDS ==================== -->
  <!-- Painted over keyboard and desk so hands meet keys at world y≈212 -->
  <g id="pixel-developer-arms" transform="translate(625, 130) scale(1.32)" shape-rendering="crispEdges">

    <!-- Screen-Left Arm: Rests on rear lip of keyboard at (-22, 62), separate 2.4s tap loop -->
    <g id="screen-left-arm">
      <!-- Upper sleeve -->
      <path d="M -34 28 L -28 46 L -36 48 L -40 32 Z" fill="#121216" />
      <!-- Forearm -->
      <path d="M -28 46 L -22 60 L -29 62 L -35 48 Z" fill="#e7a87e" />

      <!-- Left Hand at (-22, 62) with 2.4s tap loop and two 1.6s keystroke sparks -->
      <g transform="translate(-22, 62)">
        <g id="left-hand-tap">
          <animateTransform attributeName="transform" type="translate"
            values="0 0; 0 -1.6; 0 0"
            calcMode="spline"
            keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
            dur="2.4s" repeatCount="indefinite" />

          <!-- Left Hand on keyboard keys -->
          <rect x="-5" y="-3" width="10" height="6.5" rx="2" fill="#f5c29b" />
          <rect x="-4" y="0" width="3" height="4" fill="#dc9b72" />
          <rect x="0" y="0" width="3" height="4" fill="#dc9b72" />

          <!-- Keystroke Plasma Sparks (Rising off left hand only, 1.6s) -->
          <g shape-rendering="geometricPrecision">
            <circle cx="-1" cy="0" r="1.5" fill="#38bdf8">
              <animate attributeName="cy" values="0; -14; -24" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.5; 0" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="cx" values="-1; -4; -6" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="3" cy="0" r="1.4" fill="#a855f7">
              <animate attributeName="cy" values="0; -16; -28" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.5; 0" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
              <animate attributeName="cx" values="3; 6; 8" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </g>
    </g>

    <!-- Screen-Right Arm: Shoulder -> Forearm -> Wrist kinematics on shared 7s timeline -->
    <!-- Shoulder at (28, 32). Hanging along +Y -->
    <g transform="translate(28, 32)">
      <g id="joint-shoulder">
        <animateTransform attributeName="transform" type="rotate"
          values="12; 20; -118; -112; -124; -114; -122; -116; 14; 12"
          keyTimes="0; 0.08; 0.20; 0.30; 0.40; 0.50; 0.60; 0.72; 0.88; 1"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95"
          dur="7s" repeatCount="indefinite" />

        <!-- Upper Arm: Length 20 along +Y -->
        <rect x="-5" y="0" width="10" height="15" rx="2" fill="#121216" />
        <rect x="-4" y="14" width="8" height="6" rx="1.5" fill="#e7a87e" />

        <!-- Elbow Group at local (0, 20) -->
        <g transform="translate(0, 20)">
          <g id="joint-forearm">
            <animateTransform attributeName="transform" type="rotate"
              values="22; 28; -30; -46; -14; -42; -18; -36; 24; 22"
              keyTimes="0; 0.08; 0.20; 0.30; 0.40; 0.50; 0.60; 0.72; 0.88; 1"
              calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95"
              dur="7s" repeatCount="indefinite" />

            <!-- Forearm: Length 18 along +Y -->
            <rect x="-4" y="0" width="8" height="18" rx="2" fill="#e7a87e" />

            <!-- Wrist Group at local (0, 18) -->
            <g transform="translate(0, 18)">
              <g id="joint-wrist">
                <animateTransform attributeName="transform" type="rotate"
                  values="-6; -4; 10; 22; -6; 16; -2; 12; -4; -6"
                  keyTimes="0; 0.08; 0.20; 0.30; 0.40; 0.50; 0.60; 0.72; 0.88; 1"
                  calcMode="spline"
                  keySplines="0.45 0.05 0.55 0.95; 0.15 0.7 0.25 1; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.25 1; 0.45 0.05 0.55 0.95"
                  dur="7s" repeatCount="indefinite" />

                <!-- Hand: Palm and fingers hanging along +Y, palm facing camera -->
                <rect x="-5" y="0" width="10" height="7" rx="2" fill="#f5c29b" />
                <rect x="-8" y="1" width="3.5" height="4.5" rx="1" fill="#e7a87e" />
                <!-- Spread Fingers -->
                <rect x="-4.5" y="7" width="2" height="4.5" rx="0.8" fill="#f5c29b" />
                <rect x="-2" y="7" width="2.2" height="5.5" rx="0.8" fill="#f5c29b" />
                <rect x="0.6" y="7" width="2" height="5" rx="0.8" fill="#f5c29b" />
                <rect x="3" y="7" width="1.8" height="4" rx="0.8" fill="#e7a87e" />
              </g>
            </g> <!-- end wrist -->
          </g> <!-- end forearm -->
        </g> <!-- end elbow -->
      </g> <!-- end shoulder -->
    </g> <!-- end shoulder group -->

  </g>
  `;
}

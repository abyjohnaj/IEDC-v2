/**
 * IEDC BMCE Hero Section Interactive Doodle Short Film Engine
 * Authentic Hand-Drawn Sketchbook Boy with Realistic Child Proportions,
 * Natural Human Kinematics, and Expressive Physical Acting.
 */

class HeroDoodleAnimation {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.totalDuration = 28000; // 28-second continuous narrative loop
    this.rafId = null;
    this.startTime = null;
    this.pausedAt = 0;
    this.isPlaying = true;
    this.currentPose = null;

    this.init();
  }

  init() {
    this.render();
    this.startAnimationLoop();
    this.initControls();
    this.initVisibilityListener();
  }

  render() {
    this.container.innerHTML = `
      <div class="doodle-sketchpad" id="doodle-sketchpad-card">
        <!-- Master SVG Canvas (viewBox 0 0 650 400) -->
        <svg class="doodle-svg-canvas" viewBox="0 0 650 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hand-drawn animated short film of student innovation">
          <defs>
            <filter id="cyan-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#00bcd4" flood-opacity="0.85"/>
            </filter>
            <filter id="amber-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.85"/>
            </filter>

            <!-- The Boy Protagonist: Master Tousled Sketch Hair (Faithfully drawn from reference sheet) -->
            <g id="boy-hair-master">
              <!-- Paper fill base to mask background lines -->
              <path class="sketch-fill-paper" d="M -18 2 C -24 -3, -24 -16, -16 -24 C -6 -34, 10 -34, 18 -22 C 24 -12, 22 -2, 17 5 C 14 -1, 12 -7, 7 -5 C 4 -1, 0 -6, -3 -2 C -6 -7, -10 -1, -13 -5 C -16 -8, -16 -1, -18 2 Z" />
              <!-- Outer wild spiky contour & cowlicks -->
              <path class="sketch-line-bold" d="M -17 4 Q -25 -1, -22 -9 Q -28 -15, -19 -21 Q -21 -29, -11 -28 Q -6 -38, 2 -32 Q 9 -40, 16 -30 Q 24 -31, 21 -19 Q 27 -13, 22 -3 Q 24 3, 17 6" />
              <!-- Crown wisps / cowlicks from reference drawing -->
              <path class="sketch-line" d="M -3 -33 Q 0 -42, 5 -40" />
              <path class="sketch-line-thin" d="M 2 -34 Q 8 -43, 12 -38" />
              <!-- Forehead bangs framing brow -->
              <path class="sketch-line" d="M -17 -6 Q -13 3, -10 -3 Q -7 4, -4 -3 Q 0 5, 4 -2 Q 8 4, 11 -3 Q 14 2, 16 -5" />
              <path class="sketch-line-thin" d="M -13 0 L -11 -3 M -6 1 L -4 -2 M 1 2 L 3 -1 M 9 1 L 11 -2" />
              <!-- Rich pen & ink pencil cross-hatching texture -->
              <path class="sketch-line-thin" d="M -14 -24 Q -7 -16, -9 -9 M -9 -28 Q -3 -18, -4 -9 M -4 -30 Q 1 -20, 0 -9 M 3 -31 Q 6 -20, 4 -9 M 8 -29 Q 11 -18, 8 -8 M 13 -25 Q 14 -16, 12 -8 M -18 -18 Q -13 -11, -14 -6 M -19 -11 Q -15 -6, -16 -2 M 17 -18 Q 15 -11, 14 -6 M 18 -10 Q 16 -5, 15 -1" opacity="0.75" />
            </g>

            <!-- Master Head Base: Cheeks, Ears with cartilage, Neck & Collar -->
            <g id="boy-head-base">
              <!-- Neck -->
              <path class="sketch-line-thin" d="M -5 22 L -5 32 M 5 22 L 5 32" />
              <!-- Crewneck Collar -->
              <path class="sketch-line-thin" d="M -9 30 Q 0 35, 9 30" />
              <!-- Soft Youthful Jaw & Cheeks -->
              <path class="sketch-line sketch-fill-paper" d="M -16 -2 C -17 12, -9 22, 0 23 C 9 22, 17 12, 16 -2 C 16 -12, -16 -12, -16 -2 Z" />
              <!-- Detailed Ears with Cartilage -->
              <path class="sketch-line-thin" d="M -16 -1 C -20 -1, -20 7, -16 8 M -17 2 C -19 3, -19 5, -17 6" />
              <path class="sketch-line-thin" d="M 16 -1 C 20 -1, 20 7, 16 8 M 17 2 C 19 3, 19 5, 17 6" />
              <!-- Tiny delicate nose -->
              <path class="sketch-line-thin" d="M 0.8 7 L 1.4 9.5" />
            </g>
          </defs>

          <!-- Stage Background Grid & Floor Line -->
          <g class="doodle-background">
            <path class="sketch-line-thin" d="M 15 355 Q 160 354, 320 356 T 630 355" stroke-dasharray="8 6" opacity="0.4" />
            <path class="sketch-line-bold" d="M 25 362 Q 220 360, 380 363 T 620 362" opacity="0.85" />
            
            <!-- Floor Blueprint Drafting Sheet (Scene 3, 4, 8) -->
            <g id="floor-blueprint" transform="translate(180, 305)">
              <rect x="0" y="0" width="75" height="50" rx="4" class="sketch-line-thin sketch-fill-paper" />
              <!-- Mini sketch lines on blueprint -->
              <g id="blueprint-sketches">
                <!-- Rocket Idea Sketch -->
                <path id="bp-rocket" class="sketch-line-thin" d="M 14 36 L 22 14 L 30 36 Z M 18 36 L 18 42 M 26 36 L 26 42" />
                <!-- Crossed out red X on rocket -->
                <path id="bp-cross" class="sketch-line-bold sketch-red" d="M 10 12 L 34 40 M 34 12 L 10 40" style="display: none;" />
                <!-- Rover Idea Sketch (Circled) -->
                <rect id="bp-rover" x="42" y="16" width="24" height="16" rx="3" class="sketch-line-thin" style="display: none;" />
                <circle id="bp-rover-w1" cx="47" cy="34" r="4" class="sketch-line-thin" style="display: none;" />
                <circle id="bp-rover-w2" cx="61" cy="34" r="4" class="sketch-line-thin" style="display: none;" />
                <!-- Circle around rover -->
                <ellipse id="bp-circle" cx="54" cy="25" rx="17" ry="15" class="sketch-line-bold sketch-cyan" style="display: none;" />
              </g>
            </g>

            <!-- Workbench Table (Scene 5 through 10) -->
            <g id="stage-workbench" transform="translate(365, 290)">
              <path class="sketch-line-bold" d="M 0 10 L 210 10" />
              <path class="sketch-line" d="M 15 10 L 12 68 M 195 10 L 198 68" />
              <!-- Table cross brace -->
              <path class="sketch-line-thin" d="M 14 45 L 196 45" opacity="0.4" />
            </g>
          </g>

          <!-- ==========================================================
               THE PROTOTYPE ON WORKBENCH (Stateful Evolution)
               ========================================================== -->
          <g id="workbench-prototype" transform="translate(420, 200)">
            
            <!-- 1. Prototype Being Built (Scenes 5 & 6) -->
            <g id="proto-building" class="anim-prototype-wobble" style="display: none;">
              <rect x="20" y="40" width="115" height="60" rx="8" class="sketch-line sketch-fill-paper" />
              <circle cx="45" cy="100" r="14" class="sketch-line sketch-fill-paper" />
              <circle cx="110" cy="100" r="14" class="sketch-line sketch-fill-paper" />
              <path class="sketch-line-thin" d="M 32 100 L 122 100" />
              <!-- Interior gear -->
              <circle cx="78" cy="65" r="14" class="sketch-line-thin sketch-fill-amber" />
              <path class="sketch-line-thin" d="M 78 51 L 78 79 M 64 65 L 92 65" />
              <!-- Antenna & Button Console -->
              <path class="sketch-line" d="M 78 40 L 78 15" />
              <circle cx="78" cy="12" r="5" fill="#00bcd4" />
              <!-- Red Activation Button on side -->
              <rect x="10" y="60" width="10" height="14" rx="2" fill="#ef4444" stroke="#1c222c" stroke-width="2" />
            </g>

            <!-- 2. Prototype Exploding & Broken (Scene 7) -->
            <g id="proto-broken" class="anim-violent-shake" style="display: none;">
              <rect x="20" y="40" width="115" height="60" rx="8" class="sketch-line sketch-fill-paper" />
              <circle cx="45" cy="100" r="14" class="sketch-line sketch-fill-paper" />
              <!-- Crack -->
              <path class="sketch-line-bold sketch-red" d="M 65 40 L 78 65 L 72 80 L 88 100" />
              <!-- Detached Wheel rolling -->
              <circle cx="132" cy="98" r="14" class="sketch-line sketch-fill-paper" />
              <!-- Bent Antenna -->
              <path class="sketch-line" d="M 78 40 L 72 25 L 94 20" />
              <circle cx="97" cy="20" r="4" fill="#ef4444" />
              <!-- Activation Button -->
              <rect x="10" y="60" width="10" height="14" rx="2" fill="#ef4444" stroke="#1c222c" stroke-width="2" />
              <!-- Smoke puff -->
              <g class="anim-smoke-puff" transform="translate(70, -10)">
                <path class="sketch-line-thin sketch-fill-paper" d="M 0 0 Q 15 -20, 35 -10 Q 55 -25, 65 0 Q 75 25, 50 30 Q 30 40, 10 25 Q -15 20, 0 0 Z" fill="#e2e8f0" opacity="0.9" />
              </g>
            </g>

            <!-- 3. Prototype Rebuilt & Victorious (Scenes 9 & 10) -->
            <g id="proto-success" class="anim-success-active" style="display: none;">
              <!-- Cyan Energy Field -->
              <ellipse cx="80" cy="70" rx="95" ry="60" class="sketch-line-thin sketch-cyan" stroke-dasharray="8 6" opacity="0.65" />
              <!-- Sleek Upgraded Body -->
              <rect x="15" y="35" width="130" height="65" rx="12" class="sketch-line-bold sketch-fill-paper" filter="url(#cyan-glow)" />
              <!-- Dual Drive Wheels -->
              <circle cx="45" cy="100" r="16" class="sketch-line-bold sketch-fill-cyan" />
              <circle cx="115" cy="100" r="16" class="sketch-line-bold sketch-fill-cyan" />
              <circle cx="45" cy="100" r="5" fill="#1c222c" />
              <circle cx="115" cy="100" r="5" fill="#1c222c" />
              <path class="sketch-line" d="M 29 100 L 131 100" />
              <!-- Top Solar Array -->
              <rect x="40" y="24" width="80" height="12" rx="3" class="sketch-line sketch-fill-paper" />
              <!-- Radiant Antenna -->
              <path class="sketch-line-bold" d="M 80 24 L 80 4" />
              <circle cx="80" cy="2" r="6" fill="#00bcd4" filter="url(#cyan-glow)" />
              <path class="sketch-line-thin sketch-cyan anim-ray-pulse" d="M 65 -2 Q 80 -14, 95 -2 M 57 -8 Q 80 -24, 103 -8" />
              <!-- Green Activation Button -->
              <rect x="5" y="58" width="10" height="14" rx="2" fill="#10b981" stroke="#1c222c" stroke-width="2" />
            </g>

          </g>

          <!-- Debris on Floor After Failure -->
          <g id="floor-debris" transform="translate(370, 345)" style="display: none;">
            <circle cx="0" cy="0" r="9" class="sketch-line-bold sketch-red" />
            <path class="sketch-line-thin" d="M -9 0 L 9 0 M 0 -9 L 0 9" />
          </g>

          <!-- Thought Bubbles & Lightbulbs -->
          <g id="fx-lightbulb-1" transform="translate(135, 45)" style="display: none;">
            <g class="anim-bulb-pop">
              <g class="anim-ray-pulse" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round">
                <line x1="25" y1="0" x2="25" y2="-14" />
                <line x1="45" y1="8" x2="55" y2="-2" />
                <line x1="55" y1="28" x2="68" y2="28" />
                <line x1="5" y1="8" x2="-5" y2="-2" />
                <line x1="-5" y1="28" x2="-18" y2="28" />
              </g>
              <path class="sketch-line sketch-fill-amber" filter="url(#amber-glow)" d="M 12 28 C 12 14, 38 14, 38 28 C 38 37, 32 42, 32 50 L 18 50 C 18 42, 12 37, 12 28 Z" />
              <path class="sketch-line-thin" d="M 21 42 L 23 28 L 27 28 L 29 42" stroke="#b45309" />
            </g>
            <text x="25" y="78" class="doodle-text" font-size="14" fill="#00bcd4">IDEA!</text>
          </g>

          <g id="fx-lightbulb-2" transform="translate(230, 85)" style="display: none;">
            <g class="anim-bulb-pop">
              <path class="sketch-line sketch-fill-amber" filter="url(#amber-glow)" d="M 10 18 C 10 8, 30 8, 30 18 C 30 25, 25 28, 25 35 L 15 35 C 15 28, 10 25, 10 18 Z" />
              <circle cx="20" cy="12" r="2" fill="#f59e0b" />
            </g>
            <text x="20" y="55" class="doodle-text" font-size="12" fill="#00bcd4">AHA!</text>
          </g>

          <!-- Celebration Effects -->
          <g id="fx-celebration" style="display: none;">
            <g transform="translate(300, 75)" class="anim-sparkle">
              <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" fill="#f59e0b" />
            </g>
            <g transform="translate(540, 70)" class="anim-sparkle">
              <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" fill="#00bcd4" />
            </g>
            <g transform="translate(210, 80)" class="anim-sparkle">
              <polygon points="8,0 10,5 16,8 10,11 8,16 6,11 0,8 6,5" fill="#10b981" />
            </g>
            <!-- SUCCESS Banner -->
            <g transform="translate(480, 50)">
              <text x="0" y="0" class="doodle-text sketch-cyan" font-size="22" fill="#00bcd4">★ SUCCESS! ★</text>
              <text x="0" y="22" class="doodle-text" font-size="12" fill="#1e293b" letter-spacing="0.08em">IDEA → ACTION → IMPACT</text>
              <path class="sketch-line sketch-amber" d="M -90 30 Q 0 38, 90 30" />
            </g>
          </g>

          <!-- ==========================================================
               THE PROTAGONIST: AUTHENTIC SKETCHBOOK BOY
               Faithfully matching the character design sheet
               ========================================================== -->
          <g id="doodle-boy-actor" transform="translate(100, 175)">

            <!-- POSE 1: SITTING & THINKING (Pondering with hand under chin, Row 2 Image 1) -->
            <g id="pose-sit-think" class="boy-pose-layer is-active anim-natural-breathe">
              <ellipse cx="38" cy="180" rx="34" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              
              <!-- Legs: Natural folded knees sitting on floor -->
              <g id="boy-sit-legs">
                <path class="sketch-line" d="M 28 140 C 18 142, 10 152, 12 165 C 14 174, 20 176, 38 176" />
                <path class="sketch-line-thin" d="M 20 176 L 38 176" />
                <path class="sketch-line" d="M 44 140 C 32 145, 34 162, 45 170 C 52 176, 60 176, 72 176" />
                <path class="sketch-line-thin" d="M 48 176 L 72 176" />
              </g>

              <!-- Torso: Casual crewneck tee with natural folds -->
              <g id="boy-sit-torso">
                <path class="sketch-line sketch-fill-paper" d="M 24 92 C 30 88, 48 88, 54 92 L 48 142 C 38 146, 28 146, 20 142 Z" />
                <path class="sketch-line-thin" d="M 28 114 Q 38 118, 46 114 M 26 128 Q 36 132, 44 128" opacity="0.5" />
              </g>

              <!-- Left Arm: Resting on knee -->
              <path class="sketch-line" d="M 24 96 C 14 115, 12 135, 20 155" />
              
              <!-- Right Arm: Propped on knee supporting chin -->
              <g id="boy-sit-arm-r">
                <path class="sketch-line" d="M 52 96 C 64 112, 56 128, 46 98 L 42 76" />
                <path class="sketch-line-thin" d="M 38 78 C 36 72, 44 70, 46 76" />
              </g>

              <!-- Head: Tilted thoughtfully with tousled sketch hair (Row 2 Image 1) -->
              <g transform="translate(38, 50) rotate(-8)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- Eyebrows (Thoughtful gentle arch) -->
                <path class="sketch-line-thin" d="M -12 -3 Q -7 -8, -2 -3 M 2 -3 Q 7 -8, 12 -3" />
                <!-- Expressive Eyes (Pupils looking up-right thoughtfully) -->
                <ellipse cx="-5" cy="3" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="-4" cy="1.8" r="1.1" fill="#ffffff" />
                <ellipse cx="8" cy="3" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="9" cy="1.8" r="1.1" fill="#ffffff" />
                <!-- Pensive quiet mouth -->
                <path class="sketch-line-thin" d="M -3 15 Q 1 17, 5 15" />
                <!-- Hand supporting chin from below (Row 2 Image 1) -->
                <path class="sketch-line-thin" d="M -5 19 C -7 24, -1 24, 1 20 L 4 22" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 2: STANDING & REACHING UP (Excited discovery, Row 2 Image 2) -->
            <g id="pose-stand-reach" class="boy-pose-layer">
              <ellipse cx="38" cy="180" rx="30" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 28 128 L 26 176 M 18 176 L 32 176" />
              <path class="sketch-line" d="M 48 128 L 50 176 M 44 176 L 58 176" />
              <path class="sketch-line sketch-fill-paper" d="M 22 75 C 28 72, 48 72, 54 75 L 50 128 C 38 132, 28 132, 22 128 Z" />
              <!-- Arms reaching up -->
              <path class="sketch-line" d="M 22 78 C 12 50, 8 32, 16 16 M 12 16 L 22 12" />
              <path class="sketch-line" d="M 54 78 C 64 50, 68 32, 60 16 M 56 16 L 66 12" />
              <!-- Head tilted up, inspired awe -->
              <g transform="translate(38, 42) rotate(6)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- High arched amazed brows -->
                <path class="sketch-line-thin" d="M -11 -6 Q -6 -12, -2 -6 M 2 -6 Q 6 -12, 11 -6" />
                <!-- Wide inspired eyes looking high up -->
                <ellipse cx="-6" cy="1" rx="2.8" ry="3.8" fill="#1c222c" />
                <circle cx="-5" cy="0" r="1.2" fill="#ffffff" />
                <ellipse cx="8" cy="1" rx="2.8" ry="3.8" fill="#1c222c" />
                <circle cx="9" cy="0" r="1.2" fill="#ffffff" />
                <path class="sketch-line" d="M -5 13 Q 0 19, 6 13" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 3: WALKING CYCLE (Row 1 Image 6) -->
            <g id="pose-walk" class="boy-pose-layer anim-walk-bob">
              <ellipse cx="38" cy="180" rx="26" ry="4.5" fill="rgba(28, 34, 44, 0.12)" />
              <g class="anim-walk-foot-l">
                <path class="sketch-line" d="M 30 128 L 18 176 M 10 176 L 26 176" />
              </g>
              <g class="anim-walk-foot-r">
                <path class="sketch-line" d="M 46 128 L 58 176 M 52 176 L 68 176" />
              </g>
              <path class="sketch-line sketch-fill-paper" d="M 24 75 C 30 72, 50 72, 56 75 L 52 128 C 38 132, 28 132, 22 128 Z" />
              <g class="anim-walk-arm-l">
                <path class="sketch-line" d="M 22 78 C 32 98, 40 110, 48 116" />
              </g>
              <g class="anim-walk-arm-r">
                <path class="sketch-line" d="M 54 78 C 44 98, 36 110, 28 116" />
              </g>
              <!-- Cheerful forward gaze (Row 1 Image 6) -->
              <g transform="translate(40, 42)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-thin" d="M -10 -2 Q -6 -6, -2 -2 M 3 -2 Q 7 -6, 11 -2" />
                <ellipse cx="-5" cy="4" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="-4" cy="2.8" r="1.1" fill="#ffffff" />
                <ellipse cx="8" cy="4" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="9" cy="2.8" r="1.1" fill="#ffffff" />
                <path class="sketch-line" d="M -3 14 Q 2 18, 7 14" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 4: KNEELING & DRAWING (Focused sketcher, Row 2 Image 3) -->
            <g id="pose-kneel-draw" class="boy-pose-layer">
              <ellipse cx="45" cy="180" rx="34" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 20 142 C 10 156, 12 176, 42 176" />
              <path class="sketch-line" d="M 38 142 C 30 162, 40 176, 70 176" />
              <path class="sketch-line sketch-fill-paper" d="M 26 96 C 44 88, 62 98, 58 146 C 42 152, 28 150, 18 142 Z" />
              <path class="sketch-line" d="M 30 106 C 42 128, 58 142, 66 152" />
              <g class="anim-drawing-hand">
                <path class="sketch-line" d="M 54 104 C 70 118, 76 136, 82 146" />
                <path class="sketch-line-bold sketch-amber" d="M 80 142 L 92 154" />
                <polygon points="92,154 95,157 91,157" fill="#1c222c" />
              </g>
              <!-- Focused face looking down -->
              <g transform="translate(48, 56) rotate(16)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- Focused furrowed brows -->
                <path class="sketch-line-bold" d="M -10 0 L -2 3 M 2 3 L 10 0" />
                <!-- Eyes looking down at blueprint -->
                <ellipse cx="-5" cy="7" rx="2.4" ry="3" fill="#1c222c" />
                <circle cx="-4.2" cy="6" r="0.9" fill="#ffffff" />
                <ellipse cx="7" cy="7" rx="2.4" ry="3" fill="#1c222c" />
                <circle cx="7.8" cy="6" r="0.9" fill="#ffffff" />
                <path class="sketch-line" d="M -3 16 L 4 16" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 5: BRAINSTORM EVALUATION (Scratching head, Row 1 Image 5 & Row 2 Image 4) -->
            <g id="pose-eval-brainstorm" class="boy-pose-layer">
              <ellipse cx="38" cy="180" rx="28" ry="5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 28 128 L 24 176 M 16 176 L 30 176" />
              <path class="sketch-line" d="M 48 128 L 52 176 M 46 176 L 60 176" />
              <path class="sketch-line sketch-fill-paper" d="M 22 75 C 28 72, 48 72, 54 75 L 50 128 C 38 132, 28 132, 22 128 Z" />
              <!-- Hand scratching messy hair -->
              <path class="sketch-line" d="M 22 78 C 8 60, 14 42, 24 34 L 30 28" />
              <path class="sketch-line" d="M 54 78 C 70 102, 78 122, 82 136" />
              <path class="sketch-line-bold sketch-cyan" d="M 80 134 L 88 146" />
              <!-- Inquisitive & smirking face with floating question mark -->
              <g transform="translate(38, 42) rotate(8)">
                <!-- Floating Question Mark (Row 1 Image 5) -->
                <path class="sketch-line-bold sketch-amber" d="M 20 -30 C 18 -38, 30 -38, 28 -30 C 27 -25, 24 -23, 24 -19" />
                <circle cx="24" cy="-15" r="1.4" fill="#f59e0b" />
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-thin" d="M -11 -6 Q -6 -12, -2 -6 M 2 -2 L 10 -4" />
                <ellipse cx="-4" cy="2" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="-3.2" cy="1" r="1" fill="#ffffff" />
                <ellipse cx="8" cy="2" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="8.8" cy="1" r="1" fill="#ffffff" />
                <path class="sketch-line" d="M -4 14 Q 0 16, 5 12" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 6: ACTIVE BUILDING (At workbench, hammering/wrenching) -->
            <g id="pose-build" class="boy-pose-layer">
              <ellipse cx="38" cy="180" rx="28" ry="5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 26 128 L 20 176 M 12 176 L 26 176" />
              <path class="sketch-line" d="M 46 128 L 48 176 M 42 176 L 56 176" />
              <path class="sketch-line sketch-fill-paper" d="M 22 75 C 38 68, 56 74, 58 80 L 52 130 C 38 134, 26 132, 20 128 Z" />
              <path class="sketch-line" d="M 24 80 C 44 98, 62 96, 72 94" />
              <g class="anim-wrench-torque">
                <path class="sketch-line" d="M 56 78 C 72 62, 82 78, 88 80" />
                <path class="sketch-line-bold sketch-amber" d="M 85 78 L 102 70 L 106 75" />
              </g>
              <!-- Focused building grin -->
              <g transform="translate(42, 42) rotate(12)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-bold" d="M -10 -2 L -2 1 M 2 1 L 10 -2" />
                <ellipse cx="-3" cy="3" rx="2.2" ry="3.2" fill="#1c222c" />
                <circle cx="-2.2" cy="2" r="0.9" fill="#ffffff" />
                <ellipse cx="9" cy="3" rx="2.2" ry="3.2" fill="#1c222c" />
                <circle cx="9.8" cy="2" r="0.9" fill="#ffffff" />
                <path class="sketch-line" d="M -3 14 Q 2 18, 8 13" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 7: TESTING (Pressing button, tense anticipation, Row 1 Image 5) -->
            <g id="pose-test-press" class="boy-pose-layer anim-tense-wait">
              <ellipse cx="36" cy="180" rx="26" ry="5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 26 128 L 22 176 M 14 176 L 28 176" />
              <path class="sketch-line" d="M 46 128 L 44 176 M 38 176 L 52 176" />
              <path class="sketch-line sketch-fill-paper" d="M 24 75 C 42 70, 58 74, 56 80 L 52 128 C 38 132, 28 132, 22 128 Z" />
              <path class="sketch-line" d="M 22 78 C 14 100, 22 112, 28 115" />
              <path class="sketch-line-bold" d="M 56 78 L 88 78 L 105 78" />
              <circle cx="108" cy="78" r="3.5" fill="#ef4444" />
              <!-- Tense expectant face -->
              <g transform="translate(42, 42) rotate(8)">
                <!-- Nervous sweat drop -->
                <path class="sketch-cyan" d="M 17 6 Q 20 8, 17 11 Z" fill="#00bcd4" />
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-thin" d="M -11 -4 Q -6 -8, -1 -4 M 3 -4 Q 8 -8, 12 -4" />
                <ellipse cx="-2" cy="3" rx="2.8" ry="3.8" fill="#1c222c" />
                <circle cx="-1" cy="1.8" r="1.1" fill="#ffffff" />
                <ellipse cx="10" cy="3" rx="2.8" ry="3.8" fill="#1c222c" />
                <circle cx="11" cy="1.8" r="1.1" fill="#ffffff" />
                <path class="sketch-line-bold" d="M 0 14 L 8 14" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 8: SHOCKED RECOIL (Jumping back from glitch, Row 1 Image 4) -->
            <g id="pose-shock-recoil" class="boy-pose-layer">
              <ellipse cx="30" cy="180" rx="30" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 24 128 L 8 174 M 2 174 L 16 174" />
              <path class="sketch-line" d="M 44 128 L 35 174 M 28 174 L 42 174" />
              <path class="sketch-line sketch-fill-paper" d="M 18 78 C 30 72, 48 74, 46 80 L 40 128 C 26 132, 16 130, 12 126 Z" />
              <path class="sketch-line-bold" d="M 16 80 C 0 60, -4 44, -2 38" />
              <path class="sketch-line-bold" d="M 46 78 C 30 55, 36 40, 38 34" />
              <!-- Shocked face with !! (Row 1 Image 4) -->
              <g transform="translate(32, 42) rotate(-14)">
                <!-- Shock exclamation marks !! -->
                <line x1="18" y1="-28" x2="22" y2="-36" stroke="#1c222c" stroke-width="2.4" stroke-linecap="round"/>
                <circle cx="23" cy="-24" r="1.2" fill="#1c222c"/>
                <line x1="25" y1="-26" x2="29" y2="-34" stroke="#1c222c" stroke-width="2.4" stroke-linecap="round"/>
                <circle cx="30" cy="-22" r="1.2" fill="#1c222c"/>
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- Raised shocked brows -->
                <path class="sketch-line-thin" d="M -12 -5 Q -7 -12, -2 -7 M 2 -7 Q 7 -12, 12 -5" />
                <!-- Wide shocked round eyes -->
                <circle cx="-6" cy="3" r="3.6" fill="#1c222c" />
                <circle cx="-5" cy="2" r="1.2" fill="#ffffff" />
                <circle cx="8" cy="3" r="3.6" fill="#1c222c" />
                <circle cx="9" cy="2" r="1.2" fill="#ffffff" />
                <!-- Round open O mouth -->
                <ellipse cx="1" cy="15" rx="3.4" ry="4.4" fill="#1c222c" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 9: SLUMPED DISAPPOINTMENT (Facing failure, Row 2 Image 5 / Row 3 Image 1) -->
            <g id="pose-slumped-fail" class="boy-pose-layer">
              <ellipse cx="35" cy="180" rx="36" ry="6" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 16 152 L 6 176 L 44 176" />
              <path class="sketch-line" d="M 36 152 L 26 176 L 66 176" />
              <path class="sketch-line sketch-fill-paper" d="M 18 102 C 38 98, 48 112, 42 156 C 28 162, 14 160, 10 152 Z" />
              <path class="sketch-line" d="M 18 112 C 8 138, 8 160, 10 174" />
              <path class="sketch-line" d="M 44 116 C 40 142, 40 162, 42 174" />
              <!-- Drooping sad head (Row 2 Image 5) -->
              <g transform="translate(36, 70) rotate(22)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- Sad drooping eyebrows -->
                <path class="sketch-line-thin" d="M -11 -1 Q -7 4, -3 -1 M 3 -1 Q 7 4, 11 -1" />
                <!-- Downcast sad eyes -->
                <ellipse cx="-6" cy="6" rx="2.4" ry="2.8" fill="#1c222c" />
                <ellipse cx="6" cy="6" rx="2.4" ry="2.8" fill="#1c222c" />
                <!-- Drooping sad frown -->
                <path class="sketch-line-thin" d="M -5 16 Q 0 11, 5 15" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 10: INSPECTING BROKEN GEAR (Row 2 Image 1) -->
            <g id="pose-inspect-gear" class="boy-pose-layer">
              <ellipse cx="35" cy="180" rx="30" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 18 148 C 8 158, 12 174, 42 174" />
              <path class="sketch-line" d="M 38 148 C 30 160, 44 174, 68 174" />
              <path class="sketch-line sketch-fill-paper" d="M 22 95 C 38 90, 52 94, 48 148 C 35 152, 20 150, 16 146 Z" />
              <path class="sketch-line" d="M 22 98 C 30 114, 44 92, 46 88" />
              <path class="sketch-line" d="M 52 98 C 54 110, 48 90, 48 88" />
              <!-- Rotating gear in hands -->
              <g class="anim-inspect-gear" transform="translate(48, 85)">
                <circle cx="0" cy="0" r="10" class="sketch-line-bold sketch-red" />
                <path class="sketch-line-thin" d="M -10 0 L 10 0 M 0 -10 L 0 10" />
              </g>
              <!-- Examining face -->
              <g transform="translate(38, 50) rotate(4)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-thin" d="M -11 -3 Q -6 -7, -1 -3 M 3 -3 Q 8 -7, 12 -3" />
                <ellipse cx="-4" cy="4" rx="2.5" ry="3.4" fill="#1c222c" />
                <circle cx="-3.2" cy="3" r="1" fill="#ffffff" />
                <ellipse cx="8" cy="4" rx="2.5" ry="3.4" fill="#1c222c" />
                <circle cx="8.8" cy="3" r="1" fill="#ffffff" />
                <path class="sketch-line-thin" d="M -2 14 Q 3 17, 7 14" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 11: REDRAWING FIX (Row 2 Image 4) -->
            <g id="pose-draw-fix" class="boy-pose-layer">
              <ellipse cx="45" cy="180" rx="34" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 20 142 C 10 156, 12 176, 42 176" />
              <path class="sketch-line" d="M 38 142 C 30 162, 40 176, 70 176" />
              <path class="sketch-line sketch-fill-paper" d="M 26 96 C 44 88, 62 98, 58 146 C 42 152, 28 150, 18 142 Z" />
              <path class="sketch-line" d="M 30 106 C 42 128, 58 142, 66 152" />
              <g class="anim-drawing-hand">
                <path class="sketch-line" d="M 54 104 C 70 118, 78 136, 84 146" />
                <path class="sketch-line-bold sketch-cyan" d="M 82 142 L 94 154" />
              </g>
              <!-- Confident fix drawing face -->
              <g transform="translate(48, 56) rotate(16)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-bold" d="M -10 -1 L -2 2 M 2 2 L 10 -1" />
                <ellipse cx="-4" cy="6" rx="2.4" ry="3" fill="#1c222c" />
                <circle cx="-3.2" cy="5" r="0.9" fill="#ffffff" />
                <ellipse cx="8" cy="6" rx="2.4" ry="3" fill="#1c222c" />
                <circle cx="8.8" cy="5" r="0.9" fill="#ffffff" />
                <path class="sketch-line" d="M -3 15 Q 3 19, 8 14" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 12: PUSHING UP FROM GROUND (Row 2 Image 3) -->
            <g id="pose-pushup-rise" class="boy-pose-layer">
              <ellipse cx="35" cy="180" rx="30" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 18 140 L 10 176 L 30 176" />
              <path class="sketch-line" d="M 36 135 L 48 165 L 60 176" />
              <path class="sketch-line sketch-fill-paper" d="M 24 85 C 38 80, 54 82, 50 136 C 35 142, 22 140, 16 134 Z" />
              <path class="sketch-line-bold" d="M 24 88 L 10 136 L 12 176" />
              <path class="sketch-line" d="M 54 88 C 60 115, 52 135, 48 144" />
              <!-- Determined face -->
              <g transform="translate(38, 48) rotate(-6)">
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <path class="sketch-line-bold" d="M -10 -2 L -2 1 M 2 1 L 10 -2" />
                <ellipse cx="-4" cy="3" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="-3.2" cy="2" r="1.1" fill="#ffffff" />
                <ellipse cx="8" cy="3" rx="2.5" ry="3.6" fill="#1c222c" />
                <circle cx="8.8" cy="2" r="1.1" fill="#ffffff" />
                <path class="sketch-line-bold" d="M -4 14 L 6 14" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 13: DETERMINED STAND (Row 2 Image 4 - Confident Smirk) -->
            <g id="pose-determined-stand" class="boy-pose-layer">
              <ellipse cx="38" cy="180" rx="28" ry="5.5" fill="rgba(28, 34, 44, 0.12)" />
              <path class="sketch-line" d="M 26 128 L 22 176 M 14 176 L 28 176" />
              <path class="sketch-line" d="M 46 128 L 50 176 M 44 176 L 58 176" />
              <path class="sketch-line sketch-fill-paper" d="M 20 72 C 34 68, 52 68, 56 72 L 52 128 C 38 132, 24 132, 18 128 Z" />
              <path class="sketch-line-bold" d="M 20 76 L 8 96 L 22 104" />
              <path class="sketch-line-bold" d="M 54 76 L 66 96 L 52 104" />
              <!-- Confident smirking face (Row 2 Image 4) -->
              <g transform="translate(38, 42)">
                <!-- Energy action ticks -->
                <line x1="-28" y1="-14" x2="-22" y2="-10" stroke="#00bcd4" stroke-width="2" stroke-linecap="round"/>
                <line x1="-30" y1="-4" x2="-23" y2="-3" stroke="#00bcd4" stroke-width="2" stroke-linecap="round"/>
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- Sharp determined brows -->
                <path class="sketch-line-bold" d="M -11 -4 L -2 0 M 2 0 L 11 -4" />
                <ellipse cx="-5" cy="3" rx="2.6" ry="3.6" fill="#1c222c" />
                <circle cx="-4" cy="1.8" r="1.1" fill="#ffffff" />
                <ellipse cx="7" cy="3" rx="2.6" ry="3.6" fill="#1c222c" />
                <circle cx="8" cy="1.8" r="1.1" fill="#ffffff" />
                <!-- Confident smirk -->
                <path class="sketch-line-bold sketch-cyan" d="M -4 13 Q 1 14, 7 9" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

            <!-- POSE 14: CELEBRATING JUMP (Row 1 Image 2 / Row 2 Image 6 - Joyful Triumph!) -->
            <g id="pose-celebrate-jump" class="boy-pose-layer anim-victory-leap">
              <ellipse cx="38" cy="190" rx="20" ry="3.5" fill="rgba(28, 34, 44, 0.08)" />
              <path class="sketch-line" d="M 28 120 C 18 134, 12 152, 22 164" />
              <path class="sketch-line" d="M 48 120 C 58 134, 64 152, 54 164" />
              <path class="sketch-line sketch-fill-paper" d="M 22 68 C 34 65, 52 65, 54 68 L 50 124 C 38 128, 24 128, 20 124 Z" />
              <!-- Both arms raised in victory V with clenched fists -->
              <path class="sketch-line-bold" d="M 22 70 C 8 40, 10 22, 10 14" />
              <circle cx="10" cy="12" r="5" fill="#1c222c" />
              <path class="sketch-line-bold" d="M 54 70 C 68 40, 66 22, 66 14" />
              <circle cx="66" cy="12" r="5" fill="#1c222c" />
              <!-- Big triumphant joyful laughing face (Row 1 Image 2) -->
              <g transform="translate(38, 38)">
                <!-- Joy sparks -->
                <line x1="-26" y1="-28" x2="-33" y2="-35" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                <line x1="0" y1="-44" x2="0" y2="-52" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                <line x1="26" y1="-28" x2="33" y2="-35" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                <use href="#boy-head-base" xlink:href="#boy-head-base" />
                <!-- Raised happy brows -->
                <path class="sketch-line-thin" d="M -11 -4 Q -6 -9, -2 -4 M 2 -4 Q 6 -9, 11 -4" />
                <!-- Curved laughing eyes (^ ^) -->
                <path class="sketch-line-bold" d="M -11 4 Q -7 -3, -3 4 M 3 4 Q 7 -3, 11 4" />
                <!-- Laugh lines -->
                <line x1="-15" y1="2" x2="-18" y2="-2" stroke="#1c222c" stroke-width="1.6" stroke-linecap="round"/>
                <line x1="15" y1="2" x2="18" y2="-2" stroke="#1c222c" stroke-width="1.6" stroke-linecap="round"/>
                <!-- Wide open joyful laughing mouth with tongue -->
                <path class="sketch-line" d="M -7 10 C -7 20, 7 20, 7 10 Z" fill="#1c222c" />
                <path d="M -3 16 Q 0 13, 3 16" fill="#f43f5e" />
                <!-- Tousled Hair -->
                <use href="#boy-hair-master" xlink:href="#boy-hair-master" />
              </g>
            </g>

          </g> <!-- End of #doodle-boy-actor -->

        </svg>
      </div>
    `;

    this.cacheDOMElements();
  }

  cacheDOMElements() {
    this.boyActor = document.getElementById('doodle-boy-actor');

    // All 14 Anatomical Poses
    this.poses = {
      sitThink: document.getElementById('pose-sit-think'),
      standReach: document.getElementById('pose-stand-reach'),
      walk: document.getElementById('pose-walk'),
      kneelDraw: document.getElementById('pose-kneel-draw'),
      evalBrainstorm: document.getElementById('pose-eval-brainstorm'),
      build: document.getElementById('pose-build'),
      testPress: document.getElementById('pose-test-press'),
      shockRecoil: document.getElementById('pose-shock-recoil'),
      slumpedFail: document.getElementById('pose-slumped-fail'),
      inspectGear: document.getElementById('pose-inspect-gear'),
      drawFix: document.getElementById('pose-draw-fix'),
      pushupRise: document.getElementById('pose-pushup-rise'),
      determinedStand: document.getElementById('pose-determined-stand'),
      celebrateJump: document.getElementById('pose-celebrate-jump')
    };

    // Stage Props
    this.props = {
      bulb1: document.getElementById('fx-lightbulb-1'),
      bulb2: document.getElementById('fx-lightbulb-2'),
      celebration: document.getElementById('fx-celebration'),
      debris: document.getElementById('floor-debris'),
      protoBuilding: document.getElementById('proto-building'),
      protoBroken: document.getElementById('proto-broken'),
      protoSuccess: document.getElementById('proto-success'),
      bpCross: document.getElementById('bp-cross'),
      bpRover: document.getElementById('bp-rover'),
      bpRoverW1: document.getElementById('bp-rover-w1'),
      bpRoverW2: document.getElementById('bp-rover-w2'),
      bpCircle: document.getElementById('bp-circle')
    };
  }

  startAnimationLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const step = (timestamp) => {
      if (!this.isPlaying) return;

      if (!this.startTime) {
        this.startTime = timestamp - this.pausedAt;
      }

      const elapsed = (timestamp - this.startTime) % this.totalDuration;
      this.pausedAt = elapsed;

      this.updateTimeline(elapsed);
      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    if (this.playIcon) {
      this.playIcon.textContent = this.isPlaying ? '⏸' : '▶';
    }

    if (this.isPlaying) {
      this.startTime = null;
      this.startAnimationLoop();
    } else {
      if (this.rafId) cancelAnimationFrame(this.rafId);
    }
  }

  initControls() {
    const card = document.getElementById('doodle-sketchpad-card');
    if (card) {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        // Jump +3.5s forward on click to scrub through story
        this.pausedAt = (this.pausedAt + 3500) % this.totalDuration;
        this.startTime = null;
        if (!this.isPlaying) {
          this.updateTimeline(this.pausedAt);
        }
      });
    }
  }

  updateTimeline(ms) {
    /**
     * 28-SECOND REALISTIC NARRATIVE TIMELINE:
     * 
     * 0.0s – 2.8s: Scene 1 — Boy Sitting & Pondering (x=100)
     * 2.8s – 5.0s: Scene 2 — Idea Discovery, Pushes Up to Stand & Reaches (x=100)
     * 5.0s – 6.2s: Walks naturally to drafting blueprint (x: 100 -> 180)
     * 6.2s – 9.2s: Scene 3 — Kneels & Draws Rocket, Crosses It Out (x=180)
     * 9.2s – 11.5s: Scene 4 — Draws Rover, Circles Winner in Cyan (x=180)
     * 11.5s – 12.8s: Walks to workbench carrying parts (x: 180 -> 310)
     * 12.8s – 15.5s: Scene 5 — Active Building at Workbench with Wrench Torque (x=310)
     * 15.5s – 17.0s: Scene 6 — Testing Prototype: Button Press & Anticipation (x=310)
     * 17.0s – 18.0s: Scene 7 — Explosion! Jumps Back in Shock (x: 310 -> 240)
     * 18.0s – 20.5s: Scene 8 — Slumps on Floor in Disappointment (x=240)
     * 20.5s – 23.0s: Scene 9 — Inspects Broken Gear in Hands, Idea Strikes, Draws Fix (x=240)
     * 23.0s – 24.5s: Scene 10 — Pushes Up & Stands Tall with Determination (x=240)
     * 24.5s – 25.5s: Walks to workbench (x: 240 -> 310)
     * 25.5s – 26.5s: Rebuilds & Tests Again (x=310)
     * 26.5s – 28.0s: Scene 11 — Prototype Activates & Victory Celebration Jump! (x=310)
     */

    let targetX = 100;
    let activePose = 'sitThink';

    this.hideAllProps();

    if (ms >= 0 && ms < 2800) {
      // SCENE 1: SITTING & THINKING
      targetX = 100;
      activePose = 'sitThink';
      this.showProp('bulb1');
    } else if (ms >= 2800 && ms < 5000) {
      // SCENE 2: IDEA DISCOVERY
      targetX = 100;
      activePose = 'standReach';
      this.showProp('bulb1');
    } else if (ms >= 5000 && ms < 6200) {
      // TRANSITION: WALKING TO BLUEPRINT
      const progress = (ms - 5000) / 1200;
      targetX = 100 + progress * 80; // 100 -> 180
      activePose = 'walk';
    } else if (ms >= 6200 && ms < 9200) {
      // SCENE 3: KNEELING & DRAWING ROCKET, CROSSING IT OUT
      targetX = 180;
      activePose = 'kneelDraw';
      if (ms > 7800) this.showProp('bpCross'); // crosses out
    } else if (ms >= 9200 && ms < 11500) {
      // SCENE 4: SKETCHING ROVER & CIRCLING BREAKTHROUGH
      targetX = 180;
      activePose = 'evalBrainstorm';
      this.showProp('bpCross');
      this.showProp('bpRover');
      this.showProp('bpRoverW1');
      this.showProp('bpRoverW2');
      if (ms > 10200) this.showProp('bpCircle'); // circles winner in cyan
    } else if (ms >= 11500 && ms < 12800) {
      // TRANSITION: WALKING TO WORKBENCH
      const progress = (ms - 11500) / 1300;
      targetX = 180 + progress * 130; // 180 -> 310
      activePose = 'walk';
      this.showProp('protoBuilding');
    } else if (ms >= 12800 && ms < 15500) {
      // SCENE 5: ACTIVE BUILDING AT WORKBENCH
      targetX = 310;
      activePose = 'build';
      this.showProp('protoBuilding');
    } else if (ms >= 15500 && ms < 17000) {
      // SCENE 6: TESTING PROTOTYPE
      targetX = 310;
      activePose = 'testPress';
      this.showProp('protoBuilding');
    } else if (ms >= 17000 && ms < 18000) {
      // SCENE 7: EXPLOSION & SHOCK RECOIL
      const progress = (ms - 17000) / 1000;
      targetX = 310 - progress * 70; // 310 -> 240
      activePose = 'shockRecoil';
      this.showProp('protoBroken');
      this.showProp('debris');
    } else if (ms >= 18000 && ms < 20500) {
      // SCENE 8: SLUMPED DISAPPOINTMENT
      targetX = 240;
      activePose = 'slumpedFail';
      this.showProp('protoBroken');
      this.showProp('debris');
    } else if (ms >= 20500 && ms < 23000) {
      // SCENE 9: INSPECTING BROKEN PART & DRAFTING FIX
      targetX = 240;
      activePose = ms < 21800 ? 'inspectGear' : 'drawFix';
      this.showProp('protoBroken');
      this.showProp('bulb2');
    } else if (ms >= 23000 && ms < 24500) {
      // SCENE 10: PUSHING UP & DETERMINED STAND
      targetX = 240;
      activePose = ms < 23700 ? 'pushupRise' : 'determinedStand';
      this.showProp('protoBroken');
    } else if (ms >= 24500 && ms < 25500) {
      // TRANSITION: WALKING TO REBUILD
      const progress = (ms - 24500) / 1000;
      targetX = 240 + progress * 70; // 240 -> 310
      activePose = 'walk';
      this.showProp('protoBuilding');
    } else if (ms >= 25500 && ms < 26500) {
      // REBUILD & TEST AGAIN
      targetX = 310;
      activePose = 'testPress';
      this.showProp('protoSuccess');
    } else if (ms >= 26500 && ms < 28000) {
      // SCENE 12: VICTORY CELEBRATION!
      targetX = 310;
      activePose = 'celebrateJump';
      this.showProp('protoSuccess');
      this.showProp('celebration');
    } else {
      // TRANSITION BACK TO START FOR SEAMLESS LOOP
      targetX = 100;
      activePose = 'sitThink';
      this.showProp('bulb1');
    }

    // Apply Location
    if (this.boyActor) {
      this.boyActor.setAttribute('transform', `translate(${targetX}, 175)`);
    }

    // Apply Pose
    this.switchPose(activePose);
  }

  switchPose(poseKey) {
    if (this.currentPose === poseKey) return;
    this.currentPose = poseKey;

    Object.keys(this.poses).forEach(key => {
      const el = this.poses[key];
      if (!el) return;
      if (key === poseKey) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
  }

  showProp(propKey) {
    if (this.props[propKey]) {
      this.props[propKey].style.display = 'block';
    }
  }

  hideAllProps() {
    Object.keys(this.props).forEach(k => {
      if (this.props[k]) this.props[k].style.display = 'none';
    });
  }

  initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.rafId) cancelAnimationFrame(this.rafId);
      } else if (this.isPlaying) {
        this.startTime = null;
        this.startAnimationLoop();
      }
    });
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new HeroDoodleAnimation('hero-doodle-container');
});

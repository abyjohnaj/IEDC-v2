import React from 'react';
import { SceneNarrativeState } from '../Character/characterRigTypes';

interface DoodleEnvironmentProps {
  narrativeState: SceneNarrativeState;
}

export const DoodleEnvironment: React.FC<DoodleEnvironmentProps> = ({ narrativeState }) => {
  const {
    blueprintState,
    prototypeState,
    activeLightbulb,
    showCelebration,
    debrisOnFloor
  } = narrativeState;

  return (
    <g id="doodle-environment-stage">
      <defs>
        {/* Glow Filters for Signature IEDC Accents */}
        <filter id="doodle-cyan-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f2fe" floodOpacity="0.85" />
        </filter>
        <filter id="doodle-amber-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffab00" floodOpacity="0.85" />
        </filter>
      </defs>

      {/* =================================================== */}
      {/* 1. STAGE FLOOR & BACKGROUND PERSPECTIVE GRID        */}
      {/* =================================================== */}
      <g className="doodle-background">
        <path
          className="sketch-line-thin"
          d="M 15 355 Q 160 354, 320 356 T 630 355"
          strokeDasharray="8 6"
          opacity="0.4"
        />
        <path
          className="sketch-line-bold"
          d="M 25 362 Q 220 360, 380 363 T 620 362"
          opacity="0.85"
        />
      </g>

      {/* =================================================== */}
      {/* 2. DRAFTING BLUEPRINT PAPER (Scene 2, 3, 4, 8)       */}
      {/* =================================================== */}
      <g id="floor-blueprint" transform="translate(160, 305)">
        <rect
          x="0"
          y="0"
          width="85"
          height="55"
          rx="4"
          className="sketch-line-thin sketch-fill-paper"
        />
        <path className="sketch-line-thin" d="M 5 12 L 80 12" opacity="0.3" />

        {/* State A: Initial Rocket Idea */}
        {(blueprintState === 'rocket' || blueprintState === 'crossed') && (
          <g id="bp-rocket">
            <path
              className="sketch-line-thin"
              d="M 18 42 L 28 16 L 38 42 Z M 22 42 L 22 48 M 34 42 L 34 48"
            />
            <circle cx="28" cy="28" r="3" className="sketch-line-thin" />
          </g>
        )}

        {/* State B: Crossed out with bold red X */}
        {(blueprintState === 'crossed' || blueprintState === 'rover' || blueprintState === 'circled' || blueprintState === 'fixed') && (
          <path
            className="sketch-line-bold sketch-red"
            d="M 14 16 L 42 46 M 42 16 L 14 46"
          />
        )}

        {/* State C: Rover Idea */}
        {(blueprintState === 'rover' || blueprintState === 'circled' || blueprintState === 'fixed') && (
          <g id="bp-rover" transform="translate(44, 18)">
            <rect x="0" y="0" width="30" height="18" rx="3" className="sketch-line-thin" />
            <circle cx="6" cy="22" r="4.5" className="sketch-line-thin" />
            <circle cx="24" cy="22" r="4.5" className="sketch-line-thin" />
            <path className="sketch-line-thin" d="M 15 0 L 15 -6" />
            <circle cx="15" cy="-8" r="2" fill="#00bcd4" />
          </g>
        )}

        {/* State D: Circled Winning Idea in Signature IEDC Cyan Loop */}
        {(blueprintState === 'circled' || blueprintState === 'fixed') && (
          <ellipse
            cx="58"
            cy="27"
            rx="22"
            ry="18"
            className="sketch-line-bold sketch-cyan"
            transform="rotate(-5, 58, 27)"
          />
        )}

        {/* State E: Fixed connection ratio note in Scene 8 */}
        {blueprintState === 'fixed' && (
          <g transform="translate(8, 4)">
            <path className="sketch-line-bold sketch-green" d="M 45 42 L 55 48 L 75 36" />
            <text x="4" y="8" className="doodle-text" fontSize="9" fill="#10b981">
              FIXED RATIO ✓
            </text>
          </g>
        )}
      </g>

      {/* =================================================== */}
      {/* 3. WORKBENCH TABLE (Scenes 4 through 10)            */}
      {/* =================================================== */}
      <g id="stage-workbench" transform="translate(385, 290)">
        {/* Table top beam */}
        <path className="sketch-line-bold" d="M 0 10 L 210 10" />
        {/* Table legs */}
        <path className="sketch-line" d="M 15 10 L 12 72 M 195 10 L 198 72" />
        {/* Cross brace */}
        <path className="sketch-line-thin" d="M 14 48 L 196 48" opacity="0.4" />
      </g>

      {/* =================================================== */}
      {/* 4. PROTOTYPE ON WORKBENCH                           */}
      {/* =================================================== */}
      <g id="workbench-prototype" transform="translate(425, 200)">
        {/* State: Assembling / Assembled */}
        {(prototypeState === 'assembling' || prototypeState === 'assembled') && (
          <g id="proto-assembled">
            <rect x="20" y="40" width="115" height="60" rx="8" className="sketch-line sketch-fill-paper" />
            <circle cx="45" cy="100" r="14" className="sketch-line sketch-fill-paper" />
            <circle cx="110" cy="100" r="14" className="sketch-line sketch-fill-paper" />
            <path className="sketch-line-thin" d="M 32 100 L 122 100" />
            {/* Gear mechanism */}
            <circle cx="78" cy="65" r="14" className="sketch-line-thin sketch-fill-amber" />
            <path className="sketch-line-thin" d="M 78 51 L 78 79 M 64 65 L 92 65" />
            {/* Antenna & Button */}
            <path className="sketch-line" d="M 78 40 L 78 15" />
            <circle cx="78" cy="12" r="5" fill="#00bcd4" />
            <rect x="10" y="60" width="10" height="14" rx="2" fill="#ef4444" stroke="#1c222c" strokeWidth="2" />
          </g>
        )}

        {/* State: Violent Shaking */}
        {prototypeState === 'shaking' && (
          <g id="proto-shaking" transform="translate(3, -2) rotate(2)">
            <rect x="20" y="40" width="115" height="60" rx="8" className="sketch-line-bold sketch-fill-paper" />
            <circle cx="45" cy="100" r="14" className="sketch-line-bold sketch-fill-paper" />
            <circle cx="110" cy="100" r="14" className="sketch-line-bold sketch-fill-paper" />
            {/* Alarm lines */}
            <path className="sketch-line-bold sketch-amber" d="M 68 15 L 60 5 M 88 15 L 96 5" />
            <circle cx="78" cy="12" r="6" fill="#ef4444" />
            <rect x="10" y="60" width="10" height="14" rx="2" fill="#ef4444" stroke="#1c222c" strokeWidth="2" />
          </g>
        )}

        {/* State: Exploding / Failure Smoke */}
        {prototypeState === 'exploding' && (
          <g id="proto-exploding">
            <rect x="20" y="40" width="115" height="60" rx="8" className="sketch-line sketch-fill-paper" />
            <circle cx="45" cy="100" r="14" className="sketch-line sketch-fill-paper" />
            {/* Crack mark */}
            <path className="sketch-line-bold sketch-red" d="M 65 40 L 78 65 L 72 80 L 88 100" />
            {/* Bent antenna */}
            <path className="sketch-line" d="M 78 40 L 72 25 L 94 20" />
            <circle cx="97" cy="20" r="4" fill="#ef4444" />
            {/* Smoke Puff Cloud */}
            <g transform="translate(70, -15)">
              <path
                className="sketch-line-thin"
                d="M 0 0 Q 15 -20, 35 -10 Q 55 -25, 65 0 Q 75 25, 50 30 Q 30 40, 10 25 Q -15 20, 0 0 Z"
                fill="#e2e8f0"
                opacity="0.9"
              />
            </g>
          </g>
        )}

        {/* State: Broken (Scene 8) */}
        {prototypeState === 'broken' && (
          <g id="proto-broken">
            <rect x="20" y="40" width="115" height="60" rx="8" className="sketch-line sketch-fill-paper" />
            <circle cx="45" cy="100" r="14" className="sketch-line sketch-fill-paper" />
            <path className="sketch-line-bold sketch-red" d="M 65 40 L 78 65 L 72 80 L 88 100" />
            <path className="sketch-line" d="M 78 40 L 72 25 L 94 20" />
            <circle cx="97" cy="20" r="4" fill="#ef4444" />
          </g>
        )}

        {/* State: Rebuilt & Victorious (Scene 9 & 10) */}
        {(prototypeState === 'rebuilt' || prototypeState === 'active') && (
          <g id="proto-success">
            {prototypeState === 'active' && (
              <ellipse
                cx="80"
                cy="70"
                rx="95"
                ry="60"
                className="sketch-line-thin sketch-cyan"
                strokeDasharray="8 6"
                opacity="0.75"
              />
            )}
            <rect
              x="15"
              y="35"
              width="130"
              height="65"
              rx="12"
              className="sketch-line-bold sketch-fill-paper"
              filter={prototypeState === 'active' ? 'url(#doodle-cyan-glow)' : undefined}
            />
            {/* Dual Drive Wheels */}
            <circle cx="45" cy="100" r="16" className="sketch-line-bold sketch-fill-cyan" />
            <circle cx="115" cy="100" r="16" className="sketch-line-bold sketch-fill-cyan" />
            <circle cx="45" cy="100" r="5" fill="#1c222c" />
            <circle cx="115" cy="100" r="5" fill="#1c222c" />
            <path className="sketch-line" d="M 29 100 L 131 100" />
            {/* Top Solar Array & Radiant Antenna */}
            <rect x="40" y="24" width="80" height="12" rx="3" className="sketch-line sketch-fill-paper" />
            <path className="sketch-line-bold" d="M 80 24 L 80 4" />
            <circle cx="80" cy="2" r="6" fill="#00bcd4" filter="url(#doodle-cyan-glow)" />
            {prototypeState === 'active' && (
              <path
                className="sketch-line-thin sketch-cyan"
                d="M 65 -2 Q 80 -14, 95 -2 M 57 -8 Q 80 -24, 103 -8"
              />
            )}
            <rect x="5" y="58" width="10" height="14" rx="2" fill="#10b981" stroke="#1c222c" strokeWidth="2" />
          </g>
        )}
      </g>

      {/* Broken Gear Debris on Floor */}
      {debrisOnFloor && (
        <g id="floor-debris" transform="translate(390, 350)">
          <circle cx="0" cy="0" r="9" className="sketch-line-bold sketch-red" />
          <path className="sketch-line-thin" d="M -9 0 L 9 0 M 0 -9 L 0 9" />
        </g>
      )}

      {/* =================================================== */}
      {/* 5. THOUGHT LIGHTBULBS                                */}
      {/* =================================================== */}
      {activeLightbulb === 1 && (
        <g id="fx-lightbulb-1" transform="translate(145, 55)">
          <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
            <line x1="25" y1="0" x2="25" y2="-14" />
            <line x1="45" y1="8" x2="55" y2="-2" />
            <line x1="55" y1="28" x2="68" y2="28" />
            <line x1="5" y1="8" x2="-5" y2="-2" />
            <line x1="-5" y1="28" x2="-18" y2="28" />
          </g>
          <path
            className="sketch-line sketch-fill-amber"
            filter="url(#doodle-amber-glow)"
            d="M 12 28 C 12 14, 38 14, 38 28 C 38 37, 32 42, 32 50 L 18 50 C 18 42, 12 37, 12 28 Z"
          />
          <text x="25" y="78" className="doodle-text" fontSize="14" fill="#00bcd4" textAnchor="middle">
            IDEA!
          </text>
        </g>
      )}

      {activeLightbulb === 2 && (
        <g id="fx-lightbulb-2" transform="translate(240, 85)">
          <g stroke="#00f2fe" strokeWidth="2" strokeLinecap="round">
            <line x1="15" y1="0" x2="15" y2="-10" />
            <line x1="30" y1="10" x2="38" y2="4" />
            <line x1="0" y1="10" x2="-8" y2="4" />
          </g>
          <path
            className="sketch-line sketch-fill-cyan"
            filter="url(#doodle-cyan-glow)"
            d="M 8 20 C 8 8, 24 8, 24 20 C 24 26, 20 28, 20 34 L 12 34 C 12 28, 8 26, 8 20 Z"
          />
          <text x="16" y="52" className="doodle-text" fontSize="12" fill="#00bcd4" textAnchor="middle">
            AHA!
          </text>
        </g>
      )}

      {/* =================================================== */}
      {/* 6. CELEBRATION SPARKLES & BANNER                    */}
      {/* =================================================== */}
      {showCelebration && (
        <g id="fx-celebration">
          <g transform="translate(260, 75)">
            <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" fill="#f59e0b" />
          </g>
          <g transform="translate(540, 70)">
            <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" fill="#00bcd4" />
          </g>
          <g transform="translate(190, 90)">
            <polygon points="8,0 10,5 16,8 10,11 8,16 6,11 0,8 6,5" fill="#10b981" />
          </g>
          <g transform="translate(480, 50)">
            <text x="0" y="0" className="doodle-text sketch-cyan" fontSize="22" fill="#00bcd4" textAnchor="middle">
              ★ SUCCESS! ★
            </text>
            <text x="0" y="22" className="doodle-text" fontSize="12" fill="#1e293b" letterSpacing="0.08em" textAnchor="middle">
              IDEA → ACTION → IMPACT
            </text>
            <path className="sketch-line sketch-amber" d="M -90 30 Q 0 38, 90 30" />
          </g>
        </g>
      )}
    </g>
  );
};

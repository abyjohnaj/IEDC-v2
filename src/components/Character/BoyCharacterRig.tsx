import React from 'react';
import { CharacterJointState } from './characterRigTypes';

interface BoyCharacterRigProps {
  pose: CharacterJointState;
  heldTool?: 'none' | 'pen' | 'wrench' | 'gear';
}

export const BoyCharacterRig: React.FC<BoyCharacterRigProps> = ({ pose, heldTool = 'none' }) => {
  const {
    x,
    y,
    scaleX,
    torsoAngle,
    torsoSquashY,
    headAngle,
    headOffset,
    browLeft,
    browRight,
    eyeOpenness,
    gaze,
    mouth,
    hairBounce,
    leftShoulder,
    leftUpperArmAngle,
    leftForearmAngle,
    leftHandAngle,
    leftHand,
    rightShoulder,
    rightUpperArmAngle,
    rightForearmAngle,
    rightHandAngle,
    rightHand,
    leftThighAngle,
    leftKneeAngle,
    leftFootAngle,
    rightThighAngle,
    rightKneeAngle,
    rightFootAngle
  } = pose;

  // Mouth Path Generator (Gentle storybook expressions)
  const renderMouth = () => {
    switch (mouth) {
      case 'smile':
        return (
          <g>
            <path className="sketch-line" d="M -4 11 Q 1 15, 6 11" />
            <path className="sketch-line-thin" d="M 6 11 L 7.2 10" />
          </g>
        );
      case 'wideSmile':
        return (
          <g>
            <path className="sketch-line-bold" d="M -6 10 Q 1 18, 7 11" />
            <path className="sketch-line-thin" d="M 7 11 L 8.5 9.5" />
          </g>
        );
      case 'focused':
        return <path className="sketch-line-bold" d="M -4 12 L 4 12" />;
      case 'shock':
        return <circle cx="1" cy="12" r="4.5" className="sketch-line-bold sketch-fill-paper" />;
      case 'smirk':
        return <path className="sketch-line-bold sketch-cyan" d="M -3 12 Q 1 14, 6 9" />;
      case 'laugh':
        return (
          <g>
            <path className="sketch-line" d="M -6 9 C -6 18, 7 18, 7 9 Z" fill="#1c222c" />
            <path d="M -2 14 Q 1 12, 4 14" fill="#f43f5e" />
          </g>
        );
      case 'pensive':
      default:
        return <path className="sketch-line-thin" d="M -3 12 Q 1 14, 5 12" />;
    }
  };

  // Hand Gesture Generator
  const renderHand = (gesture: string, isRight: boolean) => {
    switch (gesture) {
      case 'behindBack':
        // Forearm already tucks behind the back; subtle wrist clasp
        return (
          <g transform={isRight ? 'scale(1, 1)' : 'scale(-1, 1)'}>
            <path className="sketch-line-thin" d="M -2 0 C 0 3, 2 3, 3 1" />
          </g>
        );
      case 'chin':
        return (
          <g transform={isRight ? 'scale(1, 1)' : 'scale(-1, 1)'}>
            <path className="sketch-line-thin" d="M -4 2 C -6 7, 0 8, 3 4 L 5 6" />
          </g>
        );
      case 'pen':
      case 'tool':
        return (
          <g>
            <circle cx="0" cy="0" r="4" className="sketch-line-thin sketch-fill-paper" />
            {heldTool === 'pen' && (
              <g transform="rotate(25)">
                <path className="sketch-line-bold sketch-amber" d="M 0 -4 L 0 18" />
                <polygon points="0,18 2,22 -2,22" fill="#1c222c" />
              </g>
            )}
            {heldTool === 'wrench' && (
              <g transform="rotate(-35)">
                <path className="sketch-line-bold sketch-amber" d="M 0 -12 L 0 18" />
                <path className="sketch-line-bold" d="M -4 -12 L 4 -12 M -4 -8 L 4 -8" />
              </g>
            )}
            {heldTool === 'gear' && (
              <g transform="translate(0, 4)">
                <circle cx="0" cy="0" r="8" className="sketch-line-bold sketch-amber" />
                <circle cx="0" cy="0" r="3" fill="#1c222c" />
                <path className="sketch-line-thin" d="M -8 0 L 8 0 M 0 -8 L 0 8" />
              </g>
            )}
          </g>
        );
      case 'fist':
        return <circle cx="0" cy="0" r="4.5" fill="#1c222c" />;
      case 'flat':
        return <path className="sketch-line-thin" d="M -4 0 L 4 0 M -3 3 L 3 3" />;
      case 'reach':
        return (
          <g>
            <path className="sketch-line-thin" d="M -3 0 L -1 -5 M 0 0 L 1 -6 M 3 0 L 3 -5" />
          </g>
        );
      case 'open':
      default:
        return (
          <g>
            <path className="sketch-line-thin" d="M -3 0 Q 0 -3, 3 0 Q 0 3, -3 0" />
            <path className="sketch-line-thin" d="M -1 2 L -1 5 M 1 2 L 1 5" />
          </g>
        );
    }
  };

  // Helper to render barefoot with cute toes (matching reference image)
  const renderBareFoot = (isRight: boolean) => {
    return (
      <g transform={isRight ? 'scale(1, 1)' : 'scale(-1, 1)'}>
        {/* Foot contour: heel -> flat grounded sole -> big toe cap -> instep */}
        <path
          className="sketch-line-bold sketch-fill-paper"
          d="M -4 0 C -5 2, -4 6, -3 7 L 14 7 C 15 5.5, 14.5 2, 12 1.5 C 10 1.2, 7 3, 3 3 C 0 3, -1 1, -2 0 Z"
        />
        {/* Toes: 5 distinct rounded toes */}
        {/* Big toe */}
        <path className="sketch-line" d="M 14 6 C 14.5 4, 12.5 2.5, 11 3" />
        {/* 2nd toe */}
        <path className="sketch-line-thin" d="M 11 3 C 10.5 2, 9 2, 8 3.2" />
        {/* 3rd toe */}
        <path className="sketch-line-thin" d="M 8 3.2 C 7.5 2.5, 6 2.5, 5.2 3.8" />
        {/* 4th toe */}
        <path className="sketch-line-thin" d="M 5.2 3.8 C 4.8 3, 3.8 3, 3 4.2" />
        {/* Little toe */}
        <path className="sketch-line-thin" d="M 3 4.2 C 2.5 3.5, 1.6 3.5, 1 4.8" />
        {/* Separation tick marks between toes */}
        <line x1="11" y1="6" x2="11" y2="4" className="sketch-line-thin" opacity="0.6" />
        <line x1="8" y1="6" x2="8" y2="4.2" className="sketch-line-thin" opacity="0.6" />
        <line x1="5.2" y1="6" x2="5.2" y2="4.8" className="sketch-line-thin" opacity="0.6" />
        {/* Subtle instep arch crease */}
        <path className="sketch-line-thin" d="M 2 3 Q 5 2, 8 3" opacity="0.3" />
      </g>
    );
  };

  return (
    <g
      id="articulated-boy-actor"
      transform={`translate(${x}, ${y}) scale(${scaleX}, 1)`}
      style={{ transition: 'transform 0.05s linear' }}
    >
      {/* Ground Contact Shadow (Soft sketchy pencil hatch) */}
      <ellipse
        cx="0"
        cy="78"
        rx={34 * torsoSquashY}
        ry="5"
        fill="rgba(28, 34, 44, 0.14)"
      />
      <line x1={-24 * torsoSquashY} y1="78" x2={24 * torsoSquashY} y2="78" className="sketch-line-thin" opacity="0.3" />

      {/* =================================================== */}
      {/* 1. LOWER LIMBS: BAGGY TROUSERS, ROLLED CUFFS & FEET  */}
      {/* =================================================== */}

      {/* LEFT LEG (Screen Left / Character Right) */}
      <g transform="translate(-10, 14)">
        {/* Thigh (Hip Joint): Baggy trouser upper leg */}
        <g transform={`rotate(${leftThighAngle})`}>
          <path
            className="sketch-line-bold sketch-fill-paper"
            d="M -7 -2 L 7 -2 L 6 32 L -6 32 Z"
          />
          {/* Subtle fabric wrinkle folds */}
          <path className="sketch-line-thin" d="M -4 14 Q 0 17, 4 14" opacity="0.5" />
          <path className="sketch-line-thin" d="M -5 22 Q -1 25, 3 22" opacity="0.4" />

          {/* Knee Joint: Baggy trouser shin & Rolled Cuff */}
          <g transform={`translate(0, 32) rotate(${leftKneeAngle})`}>
            {/* Lower trouser leg */}
            <path
              className="sketch-line-bold sketch-fill-paper"
              d="M -6 0 L 6 0 L 7.5 22 L -7.5 22 Z"
            />
            <path className="sketch-line-thin" d="M -3 10 Q 0 13, 3 10" opacity="0.4" />

            {/* Distinct Rolled-Up Cuff */}
            <g transform="translate(0, 22)">
              {/* Cuff fold band */}
              <rect
                x="-9"
                y="0"
                width="18"
                height="7"
                rx="2"
                className="sketch-line-bold sketch-fill-paper"
              />
              <line x1="-8.5" y1="3.5" x2="8.5" y2="3.5" className="sketch-line-thin" opacity="0.5" />

              {/* Ankle Joint & Barefoot */}
              <g transform={`translate(0, 7) rotate(${leftFootAngle})`}>
                {/* Bare ankle */}
                <line x1="-3" y1="0" x2="-3" y2="6" className="sketch-line" />
                <line x1="3" y1="0" x2="3" y2="6" className="sketch-line" />
                {/* Ankle bone bump */}
                <circle cx="-3.2" cy="3.5" r="0.8" fill="#1c222c" />

                {/* Grounded Barefoot */}
                <g transform="translate(0, 6)">
                  {renderBareFoot(false)}
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* RIGHT LEG (Screen Right / Character Left) */}
      <g transform="translate(10, 14)">
        {/* Thigh (Hip Joint): Baggy trouser upper leg */}
        <g transform={`rotate(${rightThighAngle})`}>
          <path
            className="sketch-line-bold sketch-fill-paper"
            d="M -7 -2 L 7 -2 L 6 32 L -6 32 Z"
          />
          {/* Subtle fabric wrinkle folds */}
          <path className="sketch-line-thin" d="M -4 14 Q 0 17, 4 14" opacity="0.5" />
          <path className="sketch-line-thin" d="M -3 22 Q 1 25, 5 22" opacity="0.4" />

          {/* Knee Joint: Baggy trouser shin & Rolled Cuff */}
          <g transform={`translate(0, 32) rotate(${rightKneeAngle})`}>
            {/* Lower trouser leg */}
            <path
              className="sketch-line-bold sketch-fill-paper"
              d="M -6 0 L 6 0 L 7.5 22 L -7.5 22 Z"
            />
            <path className="sketch-line-thin" d="M -3 10 Q 0 13, 3 10" opacity="0.4" />

            {/* Distinct Rolled-Up Cuff */}
            <g transform="translate(0, 22)">
              {/* Cuff fold band */}
              <rect
                x="-9"
                y="0"
                width="18"
                height="7"
                rx="2"
                className="sketch-line-bold sketch-fill-paper"
              />
              <line x1="-8.5" y1="3.5" x2="8.5" y2="3.5" className="sketch-line-thin" opacity="0.5" />

              {/* Ankle Joint & Barefoot */}
              <g transform={`translate(0, 7) rotate(${rightFootAngle})`}>
                {/* Bare ankle */}
                <line x1="-3" y1="0" x2="-3" y2="6" className="sketch-line" />
                <line x1="3" y1="0" x2="3" y2="6" className="sketch-line" />
                {/* Ankle bone bump */}
                <circle cx="3.2" cy="3.5" r="0.8" fill="#1c222c" />

                {/* Grounded Barefoot */}
                <g transform="translate(0, 6)">
                  {renderBareFoot(true)}
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* =================================================== */}
      {/* 2. TORSO: BARE CHEST, SUSPENDERS & HIGH-WAIST PANTS  */}
      {/* =================================================== */}
      <g transform={`rotate(${torsoAngle}) scale(1, ${torsoSquashY})`}>
        {/* Bare Chest & Shoulders (Shirtless silhouette) */}
        <path
          className="sketch-line-bold sketch-fill-paper"
          d="M -15 -38 C -11 -42, 11 -42, 15 -38 L 13 -7 C 6 -5, -6 -5, -13 -7 Z"
        />

        {/* Collarbone notch lines */}
        <path className="sketch-line-thin" d="M -6 -32 Q 0 -30, 6 -32" opacity="0.55" />
        {/* Ribcage / torso side contours */}
        <path className="sketch-line-thin" d="M -11 -25 Q -10 -17, -11 -11" opacity="0.35" />
        <path className="sketch-line-thin" d="M 11 -25 Q 10 -17, 11 -11" opacity="0.35" />

        {/* High-Waisted Trouser Pelvis (Dungarees) */}
        <path
          className="sketch-line-bold sketch-fill-paper"
          d="M -14 -7 C -7 -5, 7 -5, 14 -7 L 13 14 C 6 17, -6 17, -13 14 Z"
        />
        {/* High waistband rim line */}
        <path className="sketch-line-bold" d="M -14 -7 Q 0 -5, 14 -7" />
        <path className="sketch-line-thin" d="M -13 -1 Q 0 1, 13 -1" opacity="0.5" />

        {/* Trouser center fly vertical seam */}
        <line x1="0" y1="-5" x2="0" y2="12" className="sketch-line" />

        {/* Trouser side pocket & crease folds */}
        <path className="sketch-line-thin" d="M -13 -3 Q -9 4, -11 11" opacity="0.7" />
        <path className="sketch-line-thin" d="M 13 -3 Q 9 4, 11 11" opacity="0.7" />
        <path className="sketch-line-thin" d="M -5 6 Q -2 9, -5 13" opacity="0.4" />
        <path className="sketch-line-thin" d="M 5 6 Q 2 9, 5 13" opacity="0.4" />

        {/* Suspenders (Dark straps coming over shoulders to waistband) */}
        {/* Left Suspender Strap */}
        <path
          d="M -9 -40 L -7 -6"
          stroke="#1c222c"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        {/* Right Suspender Strap */}
        <path
          d="M 9 -40 L 7 -6"
          stroke="#1c222c"
          strokeWidth="3.4"
          strokeLinecap="round"
        />

        {/* Round Suspender Buttons / Fasteners on Waistband */}
        <circle cx="-7" cy="-5" r="2.6" fill="#1c222c" />
        <circle cx="-7" cy="-5" r="0.7" fill="#faf8f5" />

        <circle cx="7" cy="-5" r="2.6" fill="#1c222c" />
        <circle cx="7" cy="-5" r="0.7" fill="#faf8f5" />

        {/* =================================================== */}
        {/* 3. UPPER LIMB: LEFT ARM (Screen Left)               */}
        {/* =================================================== */}
        <g transform={`translate(-15, ${-36 + leftShoulder.liftY}) rotate(${leftShoulder.angle})`}>
          {/* Shoulder socket & Slender Upper Arm */}
          <g transform={`rotate(${leftUpperArmAngle})`}>
            <path className="sketch-line-bold" d="M 0 0 L -6 22" />
            {/* Elbow joint & Forearm */}
            <g transform={`translate(-6, 22) rotate(${leftForearmAngle})`}>
              <path className="sketch-line" d="M 0 0 L -5 20" />
              {/* Wrist & Hand */}
              <g transform={`translate(-5, 20) rotate(${leftHandAngle})`}>
                {renderHand(leftHand, false)}
              </g>
            </g>
          </g>
        </g>

        {/* =================================================== */}
        {/* 4. UPPER LIMB: RIGHT ARM (Screen Right)              */}
        {/* =================================================== */}
        <g transform={`translate(15, ${-36 + rightShoulder.liftY}) rotate(${rightShoulder.angle})`}>
          {/* Shoulder socket & Slender Upper Arm */}
          <g transform={`rotate(${rightUpperArmAngle})`}>
            <path className="sketch-line-bold" d="M 0 0 L 6 22" />
            {/* Elbow joint & Forearm */}
            <g transform={`translate(6, 22) rotate(${rightForearmAngle})`}>
              <path className="sketch-line" d="M 0 0 L 5 20" />
              {/* Wrist & Hand */}
              <g transform={`translate(5, 20) rotate(${rightHandAngle})`}>
                {renderHand(rightHand, true)}
              </g>
            </g>
          </g>
        </g>

        {/* =================================================== */}
        {/* 5. NECK & HEAD (MATCHING EXACT CHARACTER DESIGN)   */}
        {/* =================================================== */}
        <g transform={`translate(${headOffset.x}, ${-40 + headOffset.y}) rotate(${headAngle})`}>
          {/* Slender Bare Neck */}
          <path className="sketch-line-thin" d="M -4 0 L -4 6 M 4 0 L 4 6" />
          <path className="sketch-line-thin" d="M -3 2 Q 0 4, 3 2" opacity="0.4" />

          {/* Head Center (translated up from neck) */}
          <g transform="translate(0, -25)">
            {/* Head Contour: Soft, rounded, cherubic jawline & cute cheeks */}
            <path
              className="sketch-line-bold sketch-fill-paper"
              d="M -16 -4 C -18 7, -11 18, 0 19 C 11 18, 18 7, 16 -4 C 15 -16, -15 -16, -16 -4 Z"
            />

            {/* Left Ear (Prominent round ear with sketched cartilage) */}
            <path
              className="sketch-line sketch-fill-paper"
              d="M -16 -3 C -20 -3, -20 6, -16 7 Z"
            />
            <path
              className="sketch-line-thin"
              d="M -17 0 C -18.5 1, -17.5 3.5, -16 4"
            />

            {/* Right Ear (Symmetrical sketch) */}
            <path
              className="sketch-line sketch-fill-paper"
              d="M 16 -3 C 20 -3, 20 6, 16 7 Z"
            />
            <path
              className="sketch-line-thin"
              d="M 17 0 C 18.5 1, 17.5 3.5, 16 4"
            />

            {/* Innocent Cheek Blush Hatching (Below Left Eye) */}
            <path
              className="sketch-line-thin"
              d="M -11 6.5 L -9 8.5 M -8.5 6.5 L -6.5 8.5"
              opacity="0.65"
            />

            {/* Tiny Button Nose Flick */}
            <path className="sketch-line-thin" d="M 0.5 3.5 Q 1.5 5.5, 2.2 4.5" />

            {/* Gentle Smile Mouth */}
            {renderMouth()}

            {/* Left Eyebrow (Gentle arched storybook stroke) */}
            <g transform={`translate(-6, ${browLeft.y}) rotate(${browLeft.angle})`}>
              <path className="sketch-line-bold" d="M -5 0 Q 0 -2.5, 5 0" />
            </g>

            {/* Right Eyebrow */}
            <g transform={`translate(7, ${browRight.y}) rotate(${browRight.angle})`}>
              <path className="sketch-line-bold" d="M -5 0 Q 0 -2.5, 5 0" />
            </g>

            {/* Left Eye: Large expressive dark inky oval with bright white catchlight */}
            <g transform="translate(-6, 1)">
              <ellipse
                cx="0"
                cy="0"
                rx={3.2 * eyeOpenness}
                ry={4.2 * eyeOpenness}
                fill="#1c222c"
              />
              {eyeOpenness > 0.35 && (
                <>
                  {/* Primary upper-right catchlight sparkle */}
                  <circle
                    cx={gaze.x * 1.5 + 1.2}
                    cy={gaze.y * 1.5 - 1.2}
                    r="1.3"
                    fill="#ffffff"
                  />
                  {/* Secondary small reflection */}
                  <circle
                    cx={gaze.x * 1.5 - 0.8}
                    cy={gaze.y * 1.5 + 1.5}
                    r="0.6"
                    fill="#ffffff"
                  />
                </>
              )}
            </g>

            {/* Right Eye: Matching friendly glance */}
            <g transform="translate(7, 1)">
              <ellipse
                cx="0"
                cy="0"
                rx={3.2 * eyeOpenness}
                ry={4.2 * eyeOpenness}
                fill="#1c222c"
              />
              {eyeOpenness > 0.35 && (
                <>
                  {/* Primary upper-right catchlight sparkle */}
                  <circle
                    cx={gaze.x * 1.5 + 1.2}
                    cy={gaze.y * 1.5 - 1.2}
                    r="1.3"
                    fill="#ffffff"
                  />
                  {/* Secondary small reflection */}
                  <circle
                    cx={gaze.x * 1.5 - 0.8}
                    cy={gaze.y * 1.5 + 1.5}
                    r="0.6"
                    fill="#ffffff"
                  />
                </>
              )}
            </g>

            {/* =================================================== */}
            {/* TOUSLED, MESSY INK-SKETCH HAIR WITH PLAYFUL COWLICKS */}
            {/* =================================================== */}
            <g transform={`translate(0, ${hairBounce * 0.4}) rotate(${hairBounce * 0.5})`}>
              {/* Paper fill mask behind hair */}
              <path
                className="sketch-fill-paper"
                d="M -18 1 C -24 -4, -24 -18, -15 -25 C -5 -35, 11 -35, 18 -23 C 24 -12, 22 -2, 17 4 C 13 -2, 11 -8, 6 -6 C 3 -2, -1 -7, -4 -3 C -7 -8, -11 -2, -14 -6 C -18 -9, -18 -2, -18 1 Z"
              />

              {/* Solid Rich Dark Ink Hair Volume */}
              <path
                d="M -17 3 C -23 -1, -26 -11, -21 -19 C -27 -25, -16 -32, -9 -31 C -5 -41, 4 -39, 9 -33 C 14 -42, 22 -32, 21 -21 C 26 -13, 23 -3, 17 4 C 14 -1, 12 -7, 7 -5 C 4 -1, 0 -6, -3 -2 C -6 -7, -10 -2, -13 -6 C -17 -9, -17 -1, -17 3 Z"
                fill="#1c222c"
              />

              {/* Outer wild messy cowlicks & tufts */}
              {/* Crown stray cowlick flick */}
              <path className="sketch-line-bold" d="M -3 -33 C -2 -44, 5 -45, 4 -35" />
              <path className="sketch-line" d="M 2 -35 C 7 -47, 13 -41, 10 -32" />
              <path className="sketch-line-thin" d="M -6 -32 C -8 -40, -2 -41, -1 -34" />

              {/* Left-side messy spiky locks */}
              <path className="sketch-line-bold" d="M -17 2 C -24 -2, -26 -9, -21 -14" />
              <path className="sketch-line" d="M -21 -14 C -28 -19, -24 -26, -16 -24" />
              <path className="sketch-line" d="M -16 -24 C -21 -30, -14 -34, -7 -32" />

              {/* Right-side tapered tufts */}
              <path className="sketch-line-bold" d="M 16 3 C 23 -2, 24 -10, 19 -16" />
              <path className="sketch-line" d="M 19 -16 C 26 -22, 22 -30, 15 -28" />

              {/* Forehead Bangs & Fringe Locks */}
              <path
                className="sketch-line-bold"
                d="M -16 -4 Q -12 4, -9 -2 Q -6 5, -2 -3 Q 1 6, 5 -2 Q 8 5, 11 -2 Q 14 3, 16 -3"
              />

              {/* Pen & Ink cross-hatch texture lines on hair */}
              <path
                className="sketch-line-thin"
                stroke="#ffffff"
                d="M -13 -20 Q -6 -13, -8 -6 M -7 -24 Q -2 -15, -3 -7 M -2 -26 Q 3 -17, 2 -7 M 5 -27 Q 8 -17, 6 -7 M 10 -25 Q 13 -15, 10 -6"
                opacity="0.35"
              />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

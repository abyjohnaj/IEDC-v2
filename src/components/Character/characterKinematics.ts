import { CharacterJointState, SceneNarrativeState } from './characterRigTypes';
import { BASE_POSES } from './characterPoses';

export const TOTAL_STORY_DURATION_MS = 28000; // 28-second complete narrative arc

/**
 * Standard cubic easeInOut interpolation
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolates smoothly between two anatomical character joint states
 */
export function interpolateJointStates(
  from: CharacterJointState,
  to: CharacterJointState,
  rawT: number,
  useOvershoot = false
): CharacterJointState {
  const t = useOvershoot ? easeOutBack(Math.min(1, Math.max(0, rawT))) : easeInOutCubic(Math.min(1, Math.max(0, rawT)));

  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    scaleX: from.scaleX,
    torsoAngle: lerp(from.torsoAngle, to.torsoAngle, t),
    torsoSquashY: lerp(from.torsoSquashY, to.torsoSquashY, t),
    headAngle: lerp(from.headAngle, to.headAngle, t),
    headOffset: {
      x: lerp(from.headOffset.x, to.headOffset.x, t),
      y: lerp(from.headOffset.y, to.headOffset.y, t)
    },
    browLeft: {
      angle: lerp(from.browLeft.angle, to.browLeft.angle, t),
      y: lerp(from.browLeft.y, to.browLeft.y, t)
    },
    browRight: {
      angle: lerp(from.browRight.angle, to.browRight.angle, t),
      y: lerp(from.browRight.y, to.browRight.y, t)
    },
    eyeOpenness: lerp(from.eyeOpenness, to.eyeOpenness, t),
    gaze: {
      x: lerp(from.gaze.x, to.gaze.x, t),
      y: lerp(from.gaze.y, to.gaze.y, t)
    },
    mouth: t > 0.5 ? to.mouth : from.mouth,
    hairBounce: lerp(from.hairBounce, to.hairBounce, t),
    leftShoulder: {
      angle: lerp(from.leftShoulder.angle, to.leftShoulder.angle, t),
      liftY: lerp(from.leftShoulder.liftY, to.leftShoulder.liftY, t)
    },
    leftUpperArmAngle: lerp(from.leftUpperArmAngle, to.leftUpperArmAngle, t),
    leftForearmAngle: lerp(from.leftForearmAngle, to.leftForearmAngle, t),
    leftHandAngle: lerp(from.leftHandAngle, to.leftHandAngle, t),
    leftHand: t > 0.5 ? to.leftHand : from.leftHand,
    rightShoulder: {
      angle: lerp(from.rightShoulder.angle, to.rightShoulder.angle, t),
      liftY: lerp(from.rightShoulder.liftY, to.rightShoulder.liftY, t)
    },
    rightUpperArmAngle: lerp(from.rightUpperArmAngle, to.rightUpperArmAngle, t),
    rightForearmAngle: lerp(from.rightForearmAngle, to.rightForearmAngle, t),
    rightHandAngle: lerp(from.rightHandAngle, to.rightHandAngle, t),
    rightHand: t > 0.5 ? to.rightHand : from.rightHand,
    leftThighAngle: lerp(from.leftThighAngle, to.leftThighAngle, t),
    leftKneeAngle: lerp(from.leftKneeAngle, to.leftKneeAngle, t),
    leftFootAngle: lerp(from.leftFootAngle, to.leftFootAngle, t),
    rightThighAngle: lerp(from.rightThighAngle, to.rightThighAngle, t),
    rightKneeAngle: lerp(from.rightKneeAngle, to.rightKneeAngle, t),
    rightFootAngle: lerp(from.rightFootAngle, to.rightFootAngle, t)
  };
}

/**
 * Evaluates the full innovation narrative state at time `ms`
 * (0 to 28,000 milliseconds)
 */
export function evaluateNarrativeAt(ms: number): SceneNarrativeState {
  const time = ms % TOTAL_STORY_DURATION_MS;

  // 1. SCENE 1: THINKING (0ms – 2,800ms)
  // Boy sits alone, knees folded, hand on chin, breathing subtly. A lightbulb appears.
  if (time < 2800) {
    const breath = Math.sin((time / 1000) * Math.PI * 2) * 1.5;
    const gazeShift = time > 1500 ? 0.3 : -0.2;
    const pose = {
      ...BASE_POSES.thinking,
      torsoAngle: BASE_POSES.thinking.torsoAngle + breath * 0.4,
      torsoSquashY: BASE_POSES.thinking.torsoSquashY + breath * 0.015,
      gaze: { x: 0.6 + gazeShift, y: -0.8 },
      browLeft: { angle: time > 1800 ? 12 : -8, y: time > 1800 ? -5 : -2 },
      mouth: (time > 2000 ? 'smile' : 'pensive') as any
    };

    return {
      currentScene: 1,
      sceneName: 'Thinking',
      pose,
      blueprintState: 'empty',
      prototypeState: 'hidden',
      activeLightbulb: time > 1400 ? 1 : 0,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: 'none'
    };
  }

  // 2. SCENE 2: IDEA & STANDING TRANSITION (2,800ms – 5,000ms)
  // He pushes himself up, stands with weight & momentum, sees drafting paper.
  if (time < 5000) {
    const t = (time - 2800) / 2200;
    // Transition from thinking -> gettingUp -> excited
    let pose: CharacterJointState;
    if (t < 0.5) {
      pose = interpolateJointStates(BASE_POSES.thinking, BASE_POSES.gettingUp, t * 2);
    } else {
      pose = interpolateJointStates(BASE_POSES.gettingUp, BASE_POSES.excited, (t - 0.5) * 2, true);
    }

    return {
      currentScene: 2,
      sceneName: 'Idea Discovered',
      pose,
      blueprintState: 'empty',
      prototypeState: 'hidden',
      activeLightbulb: 1,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: 'none'
    };
  }

  // 3. SCENE 3: WALKING TO BLUEPRINT & KNEELING TO DRAW (5,000ms – 8,000ms)
  // Walks across to blueprint table and starts sketching.
  if (time < 8000) {
    const t = (time - 5000) / 3000;
    let pose: CharacterJointState;
    if (t < 0.55) {
      // Walking phase with rhythmic stride
      const walkT = t / 0.55;
      const stepCycle = Math.sin(walkT * Math.PI * 6);
      pose = {
        ...BASE_POSES.walking,
        x: lerp(120, 180, walkT),
        y: BASE_POSES.walking.y - Math.abs(Math.sin(walkT * Math.PI * 6)) * 6,
        leftThighAngle: BASE_POSES.walking.leftThighAngle + stepCycle * 25,
        rightThighAngle: BASE_POSES.walking.rightThighAngle - stepCycle * 25,
        hairBounce: stepCycle * 3
      };
    } else {
      // Transition from walking to kneeling and drawing
      const kneelT = (t - 0.55) / 0.45;
      pose = interpolateJointStates(BASE_POSES.walking, BASE_POSES.drawing, kneelT);
      pose.x = 180;
    }

    // Hand pen movement while drawing
    if (t >= 0.7) {
      const penWiggle = Math.sin(time * 0.02) * 8;
      pose.rightForearmAngle += penWiggle;
      pose.rightHandAngle += penWiggle * 0.6;
    }

    return {
      currentScene: 3,
      sceneName: 'Brainstorm & Sketch',
      pose,
      blueprintState: t > 0.75 ? 'rocket' : 'empty',
      prototypeState: 'hidden',
      activeLightbulb: 0,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: 'pen'
    };
  }

  // 4. SCENE 4: EVALUATING & CIRCLING WINNING IDEA (8,000ms – 11,200ms)
  // Looks at rocket drawing, shakes head, crosses it out, draws rover, circles with cyan loop!
  if (time < 11200) {
    const t = (time - 8000) / 3200;
    let pose = { ...BASE_POSES.drawing };

    if (t < 0.35) {
      // Crosses out rocket with red X
      const crossWiggle = Math.sin(time * 0.03) * 12;
      pose.rightForearmAngle += crossWiggle;
      pose.browLeft = { angle: -14, y: 3 };
      pose.mouth = 'pensive';
    } else if (t < 0.75) {
      // Draws rover & circles it
      const circleWiggle = Math.sin(time * 0.025) * 10;
      pose.rightForearmAngle += circleWiggle;
      pose.browLeft = { angle: 10, y: -4 };
      pose.mouth = 'smile';
    } else {
      // Reacts with excitement, starts rising
      const riseT = (t - 0.75) / 0.25;
      pose = interpolateJointStates(BASE_POSES.drawing, BASE_POSES.excited, riseT);
      pose.x = lerp(180, 205, riseT);
    }

    return {
      currentScene: 4,
      sceneName: 'Selecting Winning Concept',
      pose,
      blueprintState: t < 0.35 ? 'crossed' : t < 0.75 ? 'rover' : 'circled',
      prototypeState: 'hidden',
      activeLightbulb: t > 0.8 ? 2 : 0,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: t < 0.75 ? 'pen' : 'none'
    };
  }

  // 5. SCENE 5: WALKING TO WORKBENCH & ACTIVE BUILDING (11,200ms – 14,800ms)
  // Carries components, walks to workbench, attaches chassis and tightens wrench.
  if (time < 14800) {
    const t = (time - 11200) / 3600;
    let pose: CharacterJointState;

    if (t < 0.4) {
      const walkT = t / 0.4;
      const stepCycle = Math.sin(walkT * Math.PI * 6);
      pose = {
        ...BASE_POSES.walking,
        x: lerp(205, 320, walkT),
        y: BASE_POSES.walking.y - Math.abs(Math.sin(walkT * Math.PI * 6)) * 5,
        leftThighAngle: BASE_POSES.walking.leftThighAngle + stepCycle * 22,
        rightThighAngle: BASE_POSES.walking.rightThighAngle - stepCycle * 22
      };
    } else {
      // Active building with wrench torque
      const buildT = (t - 0.4) / 0.6;
      const torque = Math.sin(buildT * Math.PI * 8) * 12;
      pose = {
        ...BASE_POSES.building,
        x: 320,
        torsoAngle: BASE_POSES.building.torsoAngle + torque * 0.3,
        rightUpperArmAngle: BASE_POSES.building.rightUpperArmAngle + torque,
        rightForearmAngle: BASE_POSES.building.rightForearmAngle + torque * 1.2
      };
    }

    return {
      currentScene: 5,
      sceneName: 'Physical Prototype Building',
      pose,
      blueprintState: 'circled',
      prototypeState: t < 0.4 ? 'assembling' : 'assembled',
      activeLightbulb: 0,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: 'wrench'
    };
  }

  // 6. SCENE 6: TESTING & ANTICIPATION (14,800ms – 16,800ms)
  // Steps back, reaches out index finger, presses button, leans forward.
  if (time < 16800) {
    const t = (time - 14800) / 2000;
    const pose = {
      ...BASE_POSES.testing,
      x: 315,
      rightForearmAngle: BASE_POSES.testing.rightForearmAngle + Math.sin(t * Math.PI) * 8,
      browLeft: { angle: 8, y: -4 },
      eyeOpenness: 1.15 + (t > 0.6 ? 0.15 : 0)
    };

    return {
      currentScene: 6,
      sceneName: 'Testing Prototype',
      pose,
      blueprintState: 'circled',
      prototypeState: t > 0.6 ? 'shaking' : 'assembled',
      activeLightbulb: 0,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: 'none'
    };
  }

  // 7. SCENE 7: VIOLENT FAILURE & RECOIL SHOCK (16,800ms – 18,600ms)
  // Smoke erupts, part falls, boy recoil-jumps backward in shock!
  if (time < 18600) {
    const t = (time - 16800) / 1800;
    let pose: CharacterJointState;

    if (t < 0.45) {
      // Violent recoil jump
      const jumpT = t / 0.45;
      pose = {
        ...BASE_POSES.surprised,
        x: lerp(315, 255, jumpT),
        y: BASE_POSES.surprised.y - Math.sin(jumpT * Math.PI) * 20,
        hairBounce: Math.sin(jumpT * Math.PI * 4) * 8
      };
    } else {
      // Landing in shock, then shoulders droop
      const landT = (t - 0.45) / 0.55;
      pose = interpolateJointStates(BASE_POSES.surprised, BASE_POSES.disappointed, landT);
      pose.x = 255;
    }

    return {
      currentScene: 7,
      sceneName: 'Prototype Failure & Recoil',
      pose,
      blueprintState: 'crossed',
      prototypeState: 'exploding',
      activeLightbulb: 0,
      showCelebration: false,
      debrisOnFloor: true,
      heldTool: 'none'
    };
  }

  // 8. SCENE 8: LEARNING & THE EPIPHANY (18,600ms – 22,000ms)
  // Sits by failed part, picks up broken gear, compares with blueprint, realization strikes!
  if (time < 22000) {
    const t = (time - 18600) / 3400;
    let pose: CharacterJointState;

    if (t < 0.5) {
      // Kneels & examines broken gear
      const examT = t / 0.5;
      pose = interpolateJointStates(BASE_POSES.disappointed, BASE_POSES.examining, examT);
      // Subtle gear rotation in hand
      pose.rightHandAngle += Math.sin(examT * Math.PI * 3) * 15;
    } else {
      // Realization! Head tilts back, eyes widen, smiles, reaches for pen
      const realT = (t - 0.5) / 0.5;
      pose = interpolateJointStates(BASE_POSES.examining, BASE_POSES.realization, realT, true);
    }

    return {
      currentScene: 8,
      sceneName: 'Root Cause Epiphany',
      pose,
      blueprintState: t > 0.85 ? 'fixed' : 'crossed',
      prototypeState: 'broken',
      activeLightbulb: t > 0.55 ? 2 : 0,
      showCelebration: false,
      debrisOnFloor: true,
      heldTool: t < 0.6 ? 'gear' : 'pen'
    };
  }

  // 9. SCENE 9: THE COMEBACK & REBUILDING (22,000ms – 25,200ms)
  // Pushes up from floor, determined smirk, steps to workbench, replaces part correctly.
  if (time < 25200) {
    const t = (time - 22000) / 3200;
    let pose: CharacterJointState;

    if (t < 0.35) {
      // Pushes up to stand
      const riseT = t / 0.35;
      pose = interpolateJointStates(BASE_POSES.realization, BASE_POSES.determined, riseT);
      pose.x = lerp(250, 275, riseT);
    } else if (t < 0.6) {
      // Confident stride to workbench
      const walkT = (t - 0.35) / 0.25;
      pose = interpolateJointStates(BASE_POSES.determined, BASE_POSES.rebuilding, walkT);
      pose.x = lerp(275, 320, walkT);
    } else {
      // Precise rebuilding
      const rebuildT = (t - 0.6) / 0.4;
      const torque = Math.sin(rebuildT * Math.PI * 6) * 8;
      pose = {
        ...BASE_POSES.rebuilding,
        x: 320,
        rightUpperArmAngle: BASE_POSES.rebuilding.rightUpperArmAngle + torque,
        rightForearmAngle: BASE_POSES.rebuilding.rightForearmAngle + torque
      };
    }

    return {
      currentScene: 9,
      sceneName: 'Comeback & Rebuild',
      pose,
      blueprintState: 'fixed',
      prototypeState: t > 0.7 ? 'rebuilt' : 'broken',
      activeLightbulb: 0,
      showCelebration: false,
      debrisOnFloor: false,
      heldTool: t < 0.6 ? 'none' : 'wrench'
    };
  }

  // 10. SCENE 10: SECOND TEST & TRIUMPHANT SUCCESS (25,200ms – 27,200ms)
  // Presses button, energy hums, wheels rotate, ecstatic victory jump!
  if (time < 27200) {
    const t = (time - 25200) / 2000;
    let pose: CharacterJointState;

    if (t < 0.3) {
      // Testing anticipation
      pose = { ...BASE_POSES.testing, x: 315 };
    } else {
      // Joyful celebratory jump!
      const jumpT = (t - 0.3) / 0.7;
      const jumpArc = Math.sin(jumpT * Math.PI);
      pose = {
        ...BASE_POSES.celebrating,
        x: 310,
        y: BASE_POSES.celebrating.y - jumpArc * 24,
        hairBounce: jumpArc * 8
      };
    }

    return {
      currentScene: 10,
      sceneName: 'Triumph & Success',
      pose,
      blueprintState: 'fixed',
      prototypeState: 'active',
      activeLightbulb: 0,
      showCelebration: t > 0.4,
      debrisOnFloor: false,
      heldTool: 'none'
    };
  }

  // 11. SCENE 11: NEW IDEA & SEAMLESS LOOP (27,200ms – 28,000ms)
  // Land softly, gaze shifts upward, new lightbulb appears, chin touch, seamlessly flows back into Scene 1!
  const loopT = (time - 27200) / 800;
  const pose = interpolateJointStates(BASE_POSES.celebrating, BASE_POSES.thinking, loopT);
  pose.x = lerp(310, 120, easeInOutCubic(loopT));
  pose.y = lerp(220, 280, easeInOutCubic(loopT));

  return {
    currentScene: 11,
    sceneName: 'New Idea Begins',
    pose,
    blueprintState: 'empty',
    prototypeState: 'hidden',
    activeLightbulb: loopT > 0.4 ? 1 : 0,
    showCelebration: false,
    debrisOnFloor: false,
    heldTool: 'none'
  };
}

export type MouthExpression = 'pensive' | 'smile' | 'wideSmile' | 'focused' | 'shock' | 'smirk' | 'laugh';
export type HandGesture = 'open' | 'flat' | 'chin' | 'pen' | 'fist' | 'tool' | 'reach' | 'behindBack';

export interface CharacterJointState {
  // World root translation
  x: number;
  y: number;
  scaleX: number; // 1 or -1 for flipping facing direction

  // Torso / Spine
  torsoAngle: number;
  torsoSquashY: number; // 0.9 (squash) to 1.1 (stretch)

  // Head & Face
  headAngle: number;
  headOffset: { x: number; y: number };
  browLeft: { angle: number; y: number };
  browRight: { angle: number; y: number };
  eyeOpenness: number; // 0 (closed) to 1.4 (wide shock)
  gaze: { x: number; y: number }; // normalized -1 to 1
  mouth: MouthExpression;
  hairBounce: number; // secondary motion offset

  // Left Arm (anatomical left, screen left when facing front)
  leftShoulder: { angle: number; liftY: number };
  leftUpperArmAngle: number;
  leftForearmAngle: number;
  leftHandAngle: number;
  leftHand: HandGesture;

  // Right Arm
  rightShoulder: { angle: number; liftY: number };
  rightUpperArmAngle: number;
  rightForearmAngle: number;
  rightHandAngle: number;
  rightHand: HandGesture;

  // Left Leg
  leftThighAngle: number;
  leftKneeAngle: number;
  leftFootAngle: number;

  // Right Leg
  rightThighAngle: number;
  rightKneeAngle: number;
  rightFootAngle: number;
}

export type PoseName =
  | 'standing'
  | 'sitting'
  | 'thinking'
  | 'excited'
  | 'drawing'
  | 'walking'
  | 'building'
  | 'testing'
  | 'surprised'
  | 'disappointed'
  | 'examining'
  | 'realization'
  | 'gettingUp'
  | 'determined'
  | 'rebuilding'
  | 'celebrating';

export interface SceneNarrativeState {
  currentScene: number;
  sceneName: string;
  pose: CharacterJointState;
  blueprintState: 'empty' | 'rocket' | 'crossed' | 'rover' | 'circled' | 'fixed';
  prototypeState: 'hidden' | 'assembling' | 'assembled' | 'shaking' | 'exploding' | 'broken' | 'rebuilt' | 'active';
  activeLightbulb: 0 | 1 | 2;
  showCelebration: boolean;
  debrisOnFloor: boolean;
  heldTool: 'none' | 'pen' | 'wrench' | 'gear';
}

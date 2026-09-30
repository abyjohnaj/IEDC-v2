import React from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { BoyCharacterRig } from './BoyCharacterRig';
import { CharacterJointState, PoseName } from './characterRigTypes';

interface BoyCharacterRiveWrapperProps {
  rivSource?: string;
  pose: CharacterJointState;
  currentPoseName?: PoseName;
  heldTool?: 'none' | 'pen' | 'wrench' | 'gear';
}

export const BoyCharacterRiveWrapper: React.FC<BoyCharacterRiveWrapperProps> = ({
  rivSource,
  pose,
  currentPoseName = 'thinking',
  heldTool = 'none'
}) => {
  // If a binary .riv asset is provided, initialize Rive Canvas runtime
  const { rive, RiveComponent } = useRive(
    rivSource
      ? {
          src: rivSource,
          stateMachines: 'State Machine 1',
          autoplay: true
        }
      : {
          src: '', // empty when no .riv
          autoplay: false
        }
  );

  const sceneStateInput = useStateMachineInput(rive, 'State Machine 1', 'SceneState');

  React.useEffect(() => {
    if (sceneStateInput && currentPoseName) {
      // Send active pose state to Rive State Machine
      const stateIndexMap: Record<string, number> = {
        thinking: 1,
        excited: 2,
        drawing: 3,
        walking: 4,
        building: 5,
        testing: 6,
        surprised: 7,
        disappointed: 8,
        examining: 9,
        realization: 10,
        gettingUp: 11,
        determined: 12,
        rebuilding: 13,
        celebrating: 14
      };
      sceneStateInput.value = stateIndexMap[currentPoseName] || 0;
    }
  }, [currentPoseName, sceneStateInput]);

  // When a valid .riv binary exists, render RiveComponent
  if (rivSource && RiveComponent) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <RiveComponent />
      </div>
    );
  }

  // Default high-precision articulated 2D skeletal rig engine
  return <BoyCharacterRig pose={pose} heldTool={heldTool} />;
};

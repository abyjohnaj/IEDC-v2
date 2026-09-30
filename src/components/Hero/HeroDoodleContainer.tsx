import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateNarrativeAt, TOTAL_STORY_DURATION_MS } from '../Character/characterKinematics';
import { BoyCharacterRig } from '../Character/BoyCharacterRig';
import { DoodleEnvironment } from './DoodleEnvironment';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import '../../styles/heroDoodle.css';

const SCENE_MARKERS = [
  { name: '1. Think', timeMs: 0 },
  { name: '2. Idea', timeMs: 3200 },
  { name: '3. Draw', timeMs: 6500 },
  { name: '4. Select', timeMs: 9500 },
  { name: '5. Build', timeMs: 12500 },
  { name: '6. Test', timeMs: 15200 },
  { name: '7. Failure', timeMs: 17200 },
  { name: '8. Epiphany', timeMs: 19800 },
  { name: '9. Rebuild', timeMs: 23200 },
  { name: '10. Win!', timeMs: 26000 }
];

export const HeroDoodleContainer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentMs, setCurrentMs] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  // Animation Loop with true delta timing
  const animate = useCallback((timestamp: number) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const delta = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    accumulatedTimeRef.current = (accumulatedTimeRef.current + delta) % TOTAL_STORY_DURATION_MS;
    setCurrentMs(accumulatedTimeRef.current);

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsPlaying(false);
      setCurrentMs(26000); // show the victorious pose
      return;
    }

    if (isPlaying) {
      lastTimestampRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, animate]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    accumulatedTimeRef.current = val;
    setCurrentMs(val);
  };

  const jumpToTime = (ms: number) => {
    accumulatedTimeRef.current = ms;
    setCurrentMs(ms);
  };

  const narrativeState = evaluateNarrativeAt(currentMs);
  const progressPercent = (currentMs / TOTAL_STORY_DURATION_MS) * 100;

  return (
    <div className="hero-doodle-container" id="hero-doodle-container">
      {/* Quick Scene Jump Chips */}
      <div className="doodle-scene-chips">
        {SCENE_MARKERS.map((m, idx) => (
          <button
            key={idx}
            className={`doodle-scene-chip ${narrativeState.sceneName.toLowerCase().includes(m.name.split('.')[1].trim().toLowerCase()) ? 'active' : ''}`}
            onClick={() => jumpToTime(m.timeMs)}
            title={`Jump to ${m.name}`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="doodle-sketchpad" id="doodle-sketchpad-card">
        {/* Master Hand-Drawn SVG Art Canvas */}
        <svg
          className="doodle-svg-canvas"
          viewBox="0 0 650 420"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Hand-drawn articulated short film: Innovation and Entrepreneurship Journey"
          onClick={() => jumpToTime((currentMs + 3500) % TOTAL_STORY_DURATION_MS)}
        >
          {/* Environmental Props, Floor, Blueprint, Workbench, and Lightbulbs */}
          <DoodleEnvironment narrativeState={narrativeState} />

          {/* Articulated 2D Protagonist Boy Character */}
          <BoyCharacterRig
            pose={narrativeState.pose}
            heldTool={narrativeState.heldTool}
          />
        </svg>

        {/* Interactive Story Scrubber & Playback Controls */}
        <div className="doodle-controls-bar">
          <button
            className="doodle-ctrl-btn"
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause Story' : 'Play Story'}
            aria-label={isPlaying ? 'Pause Story' : 'Play Story'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            className="doodle-ctrl-btn"
            onClick={() => jumpToTime(0)}
            title="Restart Innovation Journey"
            aria-label="Restart Animation"
          >
            <RotateCcw size={14} />
          </button>

          <div className="doodle-scrubber-container">
            <span style={{ display: 'none' }}>Scrubber</span>
            <input
              type="range"
              min="0"
              max={TOTAL_STORY_DURATION_MS}
              value={currentMs}
              onChange={handleScrubberChange}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              aria-label="Animation Timeline Scrubber"
            />
          </div>

          <div className="doodle-scene-badge">
            <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
            {narrativeState.sceneName}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NewsletterEdition } from '../../types';
import { NewsletterBook } from './NewsletterBook';
import { DecorativeWood } from './DecorativeWood';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface RotatingBookshelfProps {
  editions: NewsletterEdition[];
  selectedEdition: NewsletterEdition | null;
  onSelectEdition: (edition: NewsletterEdition) => void;
  radius?: number;
}

export const RotatingBookshelf: React.FC<RotatingBookshelfProps> = ({
  editions,
  selectedEdition,
  onSelectEdition,
  radius = 175
}) => {
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const rigRef = useRef<HTMLDivElement>(null);
  const currentAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastXRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Main continuous 60/120fps animation loop with smooth lerp
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.05) {
          targetAngleRef.current += velocityRef.current;
          velocityRef.current *= 0.92;
        }
      }

      // Smooth exponential lerp toward targetAngle
      const diff = targetAngleRef.current - currentAngleRef.current;
      currentAngleRef.current += diff * 0.16;

      // Direct DOM update: zero React re-render lag during rotation
      if (rigRef.current) {
        rigRef.current.style.transform = `rotateX(4.5deg) rotateY(${currentAngleRef.current.toFixed(2)}deg)`;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // When a book is selected, smoothly rotate the shelf so that book faces the front (angle = 0)
  const rotateToEdition = useCallback((edition: NewsletterEdition) => {
    const targetBookAngle = (edition.angleIndex ?? 0) * 60;
    const current = currentAngleRef.current;
    const normalizedTarget = -targetBookAngle;
    const diff = ((normalizedTarget - (current % 360) + 540) % 360) - 180;
    
    velocityRef.current = 0;
    targetAngleRef.current = current + diff;
  }, []);

  // Pointer drag start
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setHasInteracted(true);
  };

  // Pointer drag move
  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const deltaX = clientX - lastXRef.current;
    const deltaTime = Math.max(now - lastTimeRef.current, 1);

    const angleDelta = deltaX * 0.42;
    targetAngleRef.current += angleDelta;

    velocityRef.current = (angleDelta / deltaTime) * 16.6;
    lastXRef.current = clientX;
    lastTimeRef.current = now;
  };

  // Pointer drag end - snap smoothly to nearest 60-degree bay
  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Coasting momentum
    targetAngleRef.current += velocityRef.current * 4.5;
    velocityRef.current = 0;

    // Snap to nearest 60-degree multiple
    targetAngleRef.current = Math.round(targetAngleRef.current / 60) * 60;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerDown(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX);
  };

  const onMouseUp = () => {
    handlePointerUp();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    handlePointerUp();
  };

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 4 || Math.abs(e.deltaY) > 4) {
      setHasInteracted(true);
      const delta = (e.deltaX !== 0 ? e.deltaX : e.deltaY) * -0.22;
      targetAngleRef.current += delta;
      targetAngleRef.current = Math.round(targetAngleRef.current / 60) * 60;
    }
  };

  const rotateLeft = () => {
    setHasInteracted(true);
    velocityRef.current = 0;
    targetAngleRef.current = Math.round((currentAngleRef.current + 60) / 60) * 60;
  };

  const rotateRight = () => {
    setHasInteracted(true);
    velocityRef.current = 0;
    targetAngleRef.current = Math.round((currentAngleRef.current - 60) / 60) * 60;
  };

  const tierYPositions: Record<number, number> = {
    1: 34,
    2: 189,
    3: 344,
    4: 499
  };

  return (
    <div className="bookshelf-stage-wrapper">
      <div
        className="bookshelf-3d-viewport"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        aria-label="3D Cylindrical Revolving Bookshelf"
      >
        {/* Revolving Cylinder Rig directly transformed via ref */}
        <div
          ref={rigRef}
          className={`bookshelf-revolving-rig ${selectedEdition ? 'has-selection' : ''}`}
          style={{
            transform: 'rotateX(4.5deg) rotateY(0deg)'
          }}
        >
          {/* Handcrafted Architectural Woodwork */}
          <DecorativeWood radius={radius} />

          {/* 3D Newsletter Volumes on 4 Tiers */}
          {editions.map((edition) => {
            const angle = (edition.angleIndex ?? 0) * 60;
            const topPos = tierYPositions[edition.tier || 1] || 34;
            const isSelected = selectedEdition?.id === edition.id;

            return (
              <NewsletterBook
                key={edition.id}
                edition={edition}
                isSelected={isSelected}
                radius={radius}
                tierTop={topPos}
                angle={angle}
                onSelect={(ed) => {
                  setHasInteracted(true);
                  onSelectEdition(ed);
                  rotateToEdition(ed);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Subtle First-Time Drag Hint */}
      {!hasInteracted && (
        <div className="first-time-hint">
          <MoveHorizontal size={18} />
          <span>↔ Drag to rotate the library shelf</span>
        </div>
      )}

      {/* Tactile Rotation Controls (Arrows) */}
      <div className="bookshelf-nav-controls">
        <button
          type="button"
          className="bookshelf-nav-btn"
          onClick={rotateLeft}
          aria-label="Rotate shelf counter-clockwise"
        >
          <ChevronLeft size={18} />
          <span>Previous Bay</span>
        </button>
        <button
          type="button"
          className="bookshelf-nav-btn"
          onClick={rotateRight}
          aria-label="Rotate shelf clockwise"
        >
          <span>Next Bay</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

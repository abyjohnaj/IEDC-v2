import React, { useEffect, useRef, useState } from 'react';
import '../../styles/paperRockets.css';

export const ScrollBigRocketTransition: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const renderGroupRef = useRef<SVGGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Scroll tracking and smooth interpolation (lerp) state
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      // The scroll distance over which the rocket completes its flight across the screen
      const triggerDistance = Math.min(window.innerHeight * 0.85, 750);
      
      // Progress goes from 0.0 to 1.15
      const p = Math.min(Math.max(scrollY / triggerDistance, 0), 1.2);
      targetProgressRef.current = p;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    // Animation loop for physics-based smooth flight motion
    const loop = () => {
      // Lerp progress for smooth acceleration and aerodynamic glide
      const diff = targetProgressRef.current - currentProgressRef.current;
      currentProgressRef.current += diff * 0.14;

      const p = currentProgressRef.current;
      const g = renderGroupRef.current;

      if (g) {
        // If rocket is parked before scroll (p < 0.005) or completely flown off (p > 1.15), hide
        if (p < 0.005 || p > 1.15) {
          g.innerHTML = '';
        } else {
          const W = window.innerWidth;
          const H = window.innerHeight;

          // Cubic Bezier Flight Trajectory from Bottom-Left to Top-Right
          const P0 = { x: -220, y: H + 220 };             // Bottom-Left Off-screen Launch
          const P1 = { x: W * 0.20, y: H * 0.68 };        // Lift-off upward arc
          const P2 = { x: W * 0.64, y: H * 0.30 };        // Diagonal cross-screen sweep
          const P3 = { x: W + 360, y: -300 };            // Top-Right Off-screen Exit

          // Cubic Bezier interpolation
          const t = Math.min(p, 1.08);
          const u = 1 - t;
          const tt = t * t;
          const uu = u * u;
          const uuu = uu * u;
          const ttt = tt * t;

          const rocketX = uuu * P0.x + 3 * uu * t * P1.x + 3 * u * tt * P2.x + ttt * P3.x;
          const rocketY = uuu * P0.y + 3 * uu * t * P1.y + 3 * u * tt * P2.y + ttt * P3.y;

          // Derivative for precise flight orientation angle (nose points along trajectory)
          const dx = 3 * uu * (P1.x - P0.x) + 6 * u * t * (P2.x - P1.x) + 3 * tt * (P3.x - P2.x);
          const dy = 3 * uu * (P1.y - P0.y) + 6 * u * t * (P2.y - P1.y) + 3 * tt * (P3.y - P2.y);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

          // Refined Dynamic Scale:
          // Starts at ~2.6x, expands to an impressive ~14.5x - 16x at center sweep (prominent without engulfing whole screen)
          const maxDim = Math.max(W, H);
          const peakScale = Math.max(maxDim / 95, 14.5);
          const zoomFactor = Math.sin(Math.min(t, 1.0) * Math.PI);
          const rocketScale = 2.6 + Math.pow(zoomFactor, 1.25) * (peakScale - 2.6);

          // Opacity: fade in quickly on launch, fade out cleanly when soaring off top-right
          let opacity = 1;
          if (p < 0.05) {
            opacity = p / 0.05;
          } else if (p > 0.90) {
            opacity = Math.max(0, 1 - (p - 0.90) / 0.18);
          }

          // Dynamic shadow offset scaling with altitude/proximity to camera
          const shadowOffsetX = (20 + zoomFactor * 32).toFixed(1);
          const shadowOffsetY = (35 + zoomFactor * 50).toFixed(1);

          // Render Clean Origami Paper Rocket & Shadow (No Trail)
          g.innerHTML = `
            <g style="opacity: ${opacity.toFixed(3)};">
              <!-- Soft Directional Airborne Shadow -->
              <g transform="translate(${Number(rocketX) + Number(shadowOffsetX)}, ${Number(rocketY) + Number(shadowOffsetY)}) scale(${(rocketScale * 0.92).toFixed(2)}) rotate(${angle})" opacity="0.22">
                <polygon points="56,0 0,-20 14,0 0,20" fill="#000000" filter="url(#big-rocket-drop-shadow)" />
              </g>

              <!-- Main Massive Origami Paper Rocket with Non-Scaling Crisp Crease Lines -->
              <g transform="translate(${rocketX.toFixed(1)}, ${rocketY.toFixed(1)}) scale(${rocketScale.toFixed(2)}) rotate(${angle})">
                <!-- Top Wing Facet -->
                <polygon
                  points="56,0 0,-22 14,0"
                  fill="url(#big-rocket-paper-top)"
                  stroke="#0f172a"
                  stroke-width="1.6"
                  vector-effect="non-scaling-stroke"
                  stroke-linejoin="round"
                />

                <!-- Center Spine Crease / Keel -->
                <polygon
                  points="56,0 14,0 0,0"
                  fill="url(#big-rocket-paper-mid)"
                  stroke="#0f172a"
                  stroke-width="1.3"
                  vector-effect="non-scaling-stroke"
                />

                <!-- Bottom Wing Facet (In shadow) -->
                <polygon
                  points="56,0 14,0 0,22"
                  fill="url(#big-rocket-paper-bottom)"
                  stroke="#0f172a"
                  stroke-width="1.6"
                  vector-effect="non-scaling-stroke"
                  stroke-linejoin="round"
                />

                <!-- Hollow Under-Fold Cavity (Top) -->
                <polygon
                  points="14,0 0,-22 5,-7 0,0"
                  fill="url(#big-rocket-paper-under)"
                  stroke="#0f172a"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />

                <!-- Hollow Under-Fold Cavity (Bottom) -->
                <polygon
                  points="14,0 0,22 5,7 0,0"
                  fill="url(#big-rocket-paper-under)"
                  stroke="#0f172a"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />

                <!-- Tactile Fold Dashed Detail Lines -->
                <line x1="18" y1="-7" x2="44" y2="-2" stroke="#0f172a" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" opacity="0.65" />
                <line x1="18" y1="7" x2="44" y2="2" stroke="#0f172a" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" opacity="0.65" />
              </g>
            </g>
          `;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <svg
      className="big-scroll-rocket-canvas"
      aria-hidden="true"
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      <defs>
        {/* Realistic Multi-Facet Shading Gradients for Big Paper Rocket */}
        <linearGradient id="big-rocket-paper-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#faf9f5" />
          <stop offset="75%" stopColor="#f3ede0" />
          <stop offset="100%" stopColor="#e8e2d2" />
        </linearGradient>

        <linearGradient id="big-rocket-paper-mid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8f6ee" />
          <stop offset="100%" stopColor="#ded9cb" />
        </linearGradient>

        <linearGradient id="big-rocket-paper-bottom" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2ded2" />
          <stop offset="60%" stopColor="#cfc8b8" />
          <stop offset="100%" stopColor="#b8b09d" />
        </linearGradient>

        <linearGradient id="big-rocket-paper-under" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a8a18f" />
          <stop offset="100%" stopColor="#87806e" />
        </linearGradient>

        <filter id="big-rocket-drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <g ref={renderGroupRef} id="big-rocket-render-group" />
    </svg>
  );
};

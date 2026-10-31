import React, { useEffect, useRef } from 'react';
import '../../styles/paperRockets.css';

interface RocketState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  scale: number;
  contrail: { x: number; y: number }[];
  rocketOpacity: number;
  trailOpacity: number;
  isOffScreen: boolean;
  trailLingerTime: number; // ms to pause after rocket disappears before trail starts fading
}

export const PaperRocketsStage: React.FC = () => {
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const rocketsRef = useRef<RocketState[]>([]);
  const nextLaunchRef = useRef<number>(1500);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const spawnRocket = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || 600;

      const startLeft = Math.random() > 0.35; // 65% spawn from left edge, 35% spawn from bottom left

      const startX = startLeft ? -60 : Math.random() * (width * 0.45);
      const startY = startLeft ? Math.random() * (height * 0.65) + 40 : height + 50;

      // Target across to the far right / top right
      const targetX = width + 100;
      const targetY = Math.random() * (height * 0.4);

      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 2.6 + Math.random() * 1.4;

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      rocketsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        angle,
        scale: 0.75 + Math.random() * 0.25,
        contrail: [],
        rocketOpacity: 0,
        trailOpacity: 0.85,
        isOffScreen: false,
        trailLingerTime: 300 // Brief 300ms pause after rocket exits screen
      });
    };

    const loop = (timestamp: number) => {
      const delta = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;

      // Count only currently flying rockets on screen
      const flyingCount = rocketsRef.current.filter(r => !r.isOffScreen).length;

      nextLaunchRef.current -= delta;
      if (nextLaunchRef.current <= 0 && flyingCount < 1) {
        spawnRocket();
        nextLaunchRef.current = 8000 + Math.random() * 6000;
      }

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || 600;

        rocketsRef.current.forEach(r => {
          if (!r.isOffScreen) {
            // --- 1. ROCKET IS FLYING ON SCREEN ---
            r.x += r.vx;
            r.y += r.vy;

            // Subtle aerodynamic draft wave
            r.y += Math.sin(timestamp * 0.003 + r.id) * 0.35;

            // Fade in rocket body quickly when entering
            if (r.rocketOpacity < 1) {
              r.rocketOpacity = Math.min(1, r.rocketOpacity + 0.06);
            }

            // CRITICAL: Rocket is on screen -> keep entire contrail intact!
            // Do NOT remove points from the tail while rocket is still visible.
            r.contrail.push({ x: r.x, y: r.y });

            // Check if rocket body has COMPLETELY flown off screen
            const isCompletelyOff = (
              r.x > width + 65 ||
              r.y < -65 ||
              r.y > height + 65 ||
              (r.vx < 0 && r.x < -65)
            );

            if (isCompletelyOff) {
              // The rocket has now completely disappeared from view!
              r.isOffScreen = true;
              r.rocketOpacity = 0;
            }
          } else {
            // --- 2. ROCKET HAS COMPLETELY DISAPPEARED ---
            // Only now does the trail begin to linger and then disappear
            if (r.trailLingerTime > 0) {
              r.trailLingerTime -= delta;
            } else {
              // Trail fades out smoothly
              r.trailOpacity -= 0.016 * (delta / 16.67);

              // Dissolve trail from the origin as smoke dissipates
              if (r.contrail.length > 2) {
                r.contrail.shift();
                if (r.contrail.length > 80) {
                  r.contrail.shift(); // accelerate slightly for very long trails
                }
              }
            }
          }
        });

        // Only remove the rocket entry AFTER the rocket has completely disappeared
        // AND the trail has fully faded out / disappeared
        rocketsRef.current = rocketsRef.current.filter(
          r => !r.isOffScreen || (r.trailOpacity > 0.02 && r.contrail.length > 1)
        );
      }

      // Render updated rockets and contrails to SVG group
      const g = document.getElementById('paper-rockets-render-group');
      if (g) {
        g.innerHTML = rocketsRef.current.map(r => {
          let contrailD = '';
          if (r.contrail.length > 2) {
            contrailD = `M ${r.contrail[0].x.toFixed(1)} ${r.contrail[0].y.toFixed(1)}`;
            for (let i = 1; i < r.contrail.length - 1; i++) {
              const xc = (r.contrail[i].x + r.contrail[i + 1].x) / 2;
              const yc = (r.contrail[i].y + r.contrail[i + 1].y) / 2;
              contrailD += ` Q ${r.contrail[i].x.toFixed(1)} ${r.contrail[i].y.toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
            }
            contrailD += ` L ${r.contrail[r.contrail.length - 1].x.toFixed(1)} ${r.contrail[r.contrail.length - 1].y.toFixed(1)}`;
          } else if (r.contrail.length === 2) {
            contrailD = `M ${r.contrail[0].x.toFixed(1)} ${r.contrail[0].y.toFixed(1)} L ${r.contrail[1].x.toFixed(1)} ${r.contrail[1].y.toFixed(1)}`;
          }

          return `
            <g class="paper-rocket-group">
              <!-- Persistent Flight Contrail: only disappears AFTER rocket completely disappears -->
              ${contrailD ? `
                <path
                  d="${contrailD}"
                  class="rocket-contrail"
                  stroke="#000000"
                  style="opacity: ${Math.max(0, r.trailOpacity).toFixed(3)}; stroke-opacity: ${Math.max(0, r.trailOpacity).toFixed(3)};"
                />
              ` : ''}

              <!-- Rocket Body (Only visible while on-screen) -->
              ${(!r.isOffScreen && r.rocketOpacity > 0) ? `
                <g style="opacity: ${r.rocketOpacity.toFixed(2)};">
                  <!-- Soft Airborne Ground Shadow -->
                  <g transform="translate(${r.x + 20}, ${r.y + 40}) scale(${r.scale * 0.85}) rotate(${r.angle})" opacity="0.18">
                    <polygon points="48,0 0,-16 10,0 0,16" fill="#000000" filter="url(#rocket-paper-shadow)" />
                  </g>

                  <!-- Main Origami Paper Rocket Body with Realistic Multi-Facet Folds -->
                  <g transform="translate(${r.x}, ${r.y}) scale(${r.scale}) rotate(${r.angle})">
                    <!-- Top Wing Facet -->
                    <polygon points="48,0 0,-18 12,0" fill="url(#rocket-paper-top)" stroke="#1c222c" stroke-width="1.2" stroke-linejoin="round" />
                    
                    <!-- Center Crease Keel Spine -->
                    <polygon points="48,0 12,0 0,0" fill="url(#rocket-paper-mid)" stroke="#1c222c" stroke-width="1" />
                    
                    <!-- Bottom Wing Facet (In shadow) -->
                    <polygon points="48,0 12,0 0,18" fill="url(#rocket-paper-bottom)" stroke="#1c222c" stroke-width="1.2" stroke-linejoin="round" />
                    
                    <!-- Hollow Under-Fold Cavity -->
                    <polygon points="12,0 0,-18 4,-6 0,0" fill="url(#rocket-paper-under)" stroke="#1c222c" stroke-width="0.8" />
                    <polygon points="12,0 0,18 4,6 0,0" fill="url(#rocket-paper-under)" stroke="#1c222c" stroke-width="0.8" />
                    
                    <!-- Pencil Sketch Accent Detail Lines -->
                    <line x1="16" y1="-5" x2="36" y2="-2" stroke="#1c222c" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.6" />
                    <line x1="16" y1="5" x2="36" y2="2" stroke="#1c222c" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.6" />
                  </g>
                </g>
              ` : ''}
            </g>
          `;
        }).join('');
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <svg ref={canvasRef} className="hero-paper-rockets-canvas" aria-hidden="true">
      <defs>
        {/* Multi-Faceted Realistic Paper Shading Gradients */}
        <linearGradient id="rocket-paper-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#faf9f4" />
          <stop offset="85%" stopColor="#f0ede2" />
          <stop offset="100%" stopColor="#e5e1d3" />
        </linearGradient>

        <linearGradient id="rocket-paper-mid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4f2e8" />
          <stop offset="100%" stopColor="#dedad0" />
        </linearGradient>

        <linearGradient id="rocket-paper-bottom" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2ded4" />
          <stop offset="65%" stopColor="#d0cbc0" />
          <stop offset="100%" stopColor="#bcb6a6" />
        </linearGradient>

        <linearGradient id="rocket-paper-under" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b2ad9d" />
          <stop offset="100%" stopColor="#969182" />
        </linearGradient>

        <filter id="rocket-paper-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <g id="paper-rockets-render-group" />
    </svg>
  );
};

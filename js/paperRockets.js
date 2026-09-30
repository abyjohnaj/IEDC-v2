/**
 * IEDC BMCE - Realistic Hand-Drawn Origami Paper Rockets Flight Engine
 * Features multi-faceted paper lighting, authentic hollow-tail fold anatomy,
 * dynamic real-time ground shadows, aerodynamic glider banking, and delicate sketch contrails.
 */

class PaperRocketsManager {
  constructor() {
    this.stage = document.getElementById('hero-paper-rockets-stage');
    this.heroSection = document.getElementById('home');
    this.timerId = null;
    this.isVisible = true;

    if (!this.stage || !this.heroSection) return;

    this.init();
  }

  init() {
    this.initDefs();
    this.updateDimensions();
    window.addEventListener('resize', () => this.updateDimensions());
    this.initVisibilityListener();

    // First paper rocket launches 1.4s after page load
    this.scheduleNext(1400);
  }

  initDefs() {
    if (!this.stage || document.getElementById('rocket-defs')) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.setAttribute('id', 'rocket-defs');
    defs.innerHTML = `
      <!-- Multi-Faceted Realistic Paper Shading Gradients -->
      <linearGradient id="rocket-paper-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="45%" stop-color="#faf9f4"/>
        <stop offset="85%" stop-color="#f0ede2"/>
        <stop offset="100%" stop-color="#e5e1d3"/>
      </linearGradient>

      <linearGradient id="rocket-paper-mid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f4f2e8"/>
        <stop offset="100%" stop-color="#dedad0"/>
      </linearGradient>

      <linearGradient id="rocket-paper-bottom" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e2ded4"/>
        <stop offset="65%" stop-color="#d0cbc0"/>
        <stop offset="100%" stop-color="#bcb6a6"/>
      </linearGradient>

      <linearGradient id="rocket-paper-under" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#b2ad9d"/>
        <stop offset="100%" stop-color="#969182"/>
      </linearGradient>

      <!-- Soft Ambient Airborne Shadow -->
      <filter id="rocket-paper-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="5" stdDeviation="4.5" flood-color="#1c222c" flood-opacity="0.16"/>
      </filter>

      <!-- Projected Ground Shadow (Casts onto Drafting Canvas) -->
      <filter id="rocket-ground-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4.2"/>
      </filter>
    `;
    this.stage.appendChild(defs);
  }

  updateDimensions() {
    if (!this.heroSection || !this.stage) return;
    this.width = this.heroSection.clientWidth || window.innerWidth;
    this.height = this.heroSection.clientHeight || 580;
    this.stage.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
  }

  initVisibilityListener() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });

      observer.observe(this.heroSection);
    }

    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
    });
  }

  scheduleNext(delay) {
    if (this.timerId) clearTimeout(this.timerId);
    const wait = delay !== undefined ? delay : (5500 + Math.random() * 4000);

    this.timerId = setTimeout(() => {
      if (this.isVisible) {
        this.launchRocket(false);

        // ~28% chance of an eager companion paper rocket following in formation
        if (Math.random() < 0.28) {
          setTimeout(() => {
            if (this.isVisible) this.launchRocket(true);
          }, 650);
        }
      }
      this.scheduleNext();
    }, wait);
  }

  generatePath(isFollower = false) {
    const W = this.width;
    const H = this.height;
    const isReverse = !isFollower && Math.random() < 0.18; // Occasional right-to-left glide

    if (isReverse) {
      const startX = W + 70;
      const startY = H * (0.45 + Math.random() * 0.35);
      const endX = -80;
      const endY = H * (0.15 + Math.random() * 0.28);
      const cp1X = W * 0.68;
      const cp1Y = startY - 45;
      const cp2X = W * 0.32;
      const cp2Y = endY + 65;
      return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    }

    // Left-to-Right Trajectories (3 distinct natural flights)
    const variant = Math.floor(Math.random() * 3);
    const offsetY = isFollower ? (Math.random() > 0.5 ? 36 : -36) : 0;

    if (variant === 0) {
      // Trajectory 1: Ascending Thermal Swoop (climbs across entire hero)
      const startX = -70;
      const startY = Math.min(H - 40, H * (0.72 + Math.random() * 0.16) + offsetY);
      const endX = W + 80;
      const endY = Math.max(30, H * (0.12 + Math.random() * 0.2) + offsetY);
      const cp1X = W * (0.28 + Math.random() * 0.08);
      const cp1Y = startY + 25;
      const cp2X = W * (0.64 + Math.random() * 0.08);
      const cp2Y = endY + 45;
      return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    } else if (variant === 1) {
      // Trajectory 2: Playful Low Swoop (dives near workbench then soars up)
      const startX = -70;
      const startY = Math.max(40, H * (0.28 + Math.random() * 0.15) + offsetY);
      const endX = W + 80;
      const endY = Math.max(40, H * (0.22 + Math.random() * 0.2) + offsetY);
      const cp1X = W * 0.35;
      const cp1Y = H * 0.82 + offsetY;
      const cp2X = W * 0.72;
      const cp2Y = H * 0.18 + offsetY;
      return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    } else {
      // Trajectory 3: High-Altitude Gentle Cruise
      const startX = -70;
      const startY = Math.max(50, H * (0.18 + Math.random() * 0.18) + offsetY);
      const endX = W + 80;
      const endY = Math.max(50, H * (0.28 + Math.random() * 0.22) + offsetY);
      const cp1X = W * 0.38;
      const cp1Y = startY - 25;
      const cp2X = W * 0.68;
      const cp2Y = endY + 35;
      return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    }
  }

  launchRocket(isFollower = false) {
    if (!this.stage) return;
    this.updateDimensions();

    const pathD = this.generatePath(isFollower);

    // Hidden sampling guide path
    const guidePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    guidePath.setAttribute('d', pathD);
    guidePath.setAttribute('fill', 'none');
    this.stage.appendChild(guidePath);

    const totalLen = guidePath.getTotalLength();
    if (!totalLen || isNaN(totalLen)) {
      guidePath.remove();
      return;
    }

    // 1. Dynamic Projected Ground Shadow (Casts onto the hero drafting canvas below)
    const groundShadow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    groundShadow.setAttribute('class', 'paper-rocket-ground-shadow');
    groundShadow.setAttribute('filter', 'url(#rocket-ground-blur)');
    groundShadow.style.pointerEvents = 'none';
    groundShadow.innerHTML = `
      <!-- Flattened 2D ground shadow silhouette -->
      <polygon points="52,-2 -20,-14 -8,2 4,32 -8,16" fill="#1c222c" opacity="0.07" />
    `;
    this.stage.appendChild(groundShadow);

    // 2. Visible Hand-Drawn Sketch Contrail Line
    const trail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    trail.setAttribute('class', 'paper-rocket-trail');
    trail.setAttribute('d', '');
    this.stage.appendChild(trail);

    // 3. High-Realism Folded Paper Dart Rocket
    const rocketGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rocketGroup.setAttribute('class', 'flying-paper-rocket');
    rocketGroup.setAttribute('filter', 'url(#rocket-paper-shadow)');

    const scale = isFollower ? (0.75 + Math.random() * 0.08) : (0.95 + Math.random() * 0.12);
    const duration = isFollower ? 4800 : (5100 + Math.random() * 1000);

    // Detailed Origami Folded Paper Model (Matching User Reference Image)
    rocketGroup.innerHTML = `
      <!-- Top Wing -->
      <polygon points="52,-2 -20,-14 -8,2" fill="#ffffff" stroke="#1c222c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- Center Keel Fold -->
      <polygon points="52,-2 -8,2 -8,16" fill="#f4f3ec" stroke="#1c222c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- Lower Wing -->
      <polygon points="52,-2 4,32 -8,16" fill="#ffffff" stroke="#1c222c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- Center Spine Fold Line -->
      <line x1="52" y1="-2" x2="-8" y2="2" stroke="#1c222c" stroke-width="2.2" stroke-linecap="round"/>

      <!-- Vertical Keel Back Fold Line -->
      <line x1="-8" y1="2" x2="-8" y2="16" stroke="#1c222c" stroke-width="2.2" stroke-linecap="round"/>

      <!-- Characteristic 3 Speed/Wind Dashes Behind Tail (Exactly as in Reference) -->
      <line x1="-25" y1="-8" x2="-20" y2="-8" stroke="#1c222c" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="-24" y1="5" x2="-14" y2="13" stroke="#1c222c" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="-9" y1="22" x2="-4" y2="24" stroke="#1c222c" stroke-width="2.2" stroke-linecap="round"/>
    `;
    this.stage.appendChild(rocketGroup);

    let startTime = null;
    let trailD = '';
    let lastSampleDist = -999;

    const animate = (now) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Realistic Glider Physics: Thrown with initial momentum, climbing against gravity,
      // decelerating slightly near crest, then entering equilibrium glide slope
      let ease;
      if (progress < 0.25) {
        // Initial throw boost
        ease = (progress / 0.25) * 0.32;
      } else if (progress < 0.5) {
        // Crest deceleration
        const t = (progress - 0.25) / 0.25;
        ease = 0.32 + t * 0.26 - Math.sin(t * Math.PI) * 0.04;
      } else {
        // Steady aerodynamic glide
        const t = (progress - 0.5) / 0.5;
        ease = 0.58 + t * 0.42;
      }

      const currentDist = ease * totalLen;
      const pt = guidePath.getPointAtLength(currentDist);

      // Lookahead points for flight tangent and turn rate
      const lookAhead = Math.min(currentDist + 8, totalLen);
      const nextPt = guidePath.getPointAtLength(lookAhead);
      const tangentAngle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI);

      // Lookahead further to detect curve rate for realistic banking roll
      const lookAheadFar = Math.min(currentDist + 24, totalLen);
      const farPt = guidePath.getPointAtLength(lookAheadFar);
      const farAngle = Math.atan2(farPt.y - nextPt.y, farPt.x - nextPt.x) * (180 / Math.PI);
      let dAngle = farAngle - tangentAngle;
      while (dAngle < -180) dAngle += 360;
      while (dAngle > 180) dAngle -= 360;

      // Realistic bank angle into turns
      const bank = Math.max(-22, Math.min(22, dAngle * 2.9));

      // Authentic aerodynamic angle-of-attack (nose slightly pitched above velocity vector for lift)
      const angleOfAttack = -3.5;

      // Organic micro-flutter of paper wings in moving airflow
      const flutter = Math.sin(progress * Math.PI * 14) * 1.5 + Math.sin(now * 0.015) * 1.1;

      const totalAngle = tangentAngle + angleOfAttack + flutter;

      // Realistic 3D perspective foreshortening when banking
      const scaleX = scale;
      const scaleY = scale * (1 - Math.abs(bank) * 0.012);

      rocketGroup.setAttribute(
        'transform',
        `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${totalAngle.toFixed(1)}) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) skewY(${(-bank * 0.45).toFixed(1)})`
      );

      // Project Dynamic Ground Shadow:
      // Altitude simulates height above drafting paper desk (around y = 380)
      const altitude = Math.max(20, 380 - pt.y);
      const altitudeRatio = Math.min(altitude / 340, 1);
      const shadowX = pt.x + 18 + altitudeRatio * 14;
      const shadowY = pt.y + 24 + altitudeRatio * 38;
      const shadowScale = scale * (0.95 + altitudeRatio * 0.25);
      const shadowScaleY = shadowScale * 0.45; // flattened on the table plane
      const shadowOpacity = Math.max(0.04, 0.13 - altitudeRatio * 0.06);

      groundShadow.setAttribute(
        'transform',
        `translate(${shadowX.toFixed(1)}, ${shadowY.toFixed(1)}) rotate(${(tangentAngle * 0.85).toFixed(1)}) scale(${shadowScale.toFixed(3)}, ${shadowScaleY.toFixed(3)})`
      );
      groundShadow.style.opacity = shadowOpacity.toFixed(3);

      // Add trail point every ~14px of travel
      if (Math.abs(currentDist - lastSampleDist) >= 14 || progress === 1) {
        lastSampleDist = currentDist;
        const rad = (totalAngle * Math.PI) / 180;
        // Tail anchor point behind the rocket fuselage and speed dashes
        const tailX = (pt.x - Math.cos(rad) * (24 * scale)).toFixed(1);
        const tailY = (pt.y - Math.sin(rad) * (24 * scale)).toFixed(1);

        if (!trailD) {
          trailD = `M ${tailX} ${tailY}`;
        } else {
          trailD += ` L ${tailX} ${tailY}`;
        }
        trail.setAttribute('d', trailD);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Flight finished: remove rocket & shadow, fade out contrail line
        rocketGroup.remove();
        groundShadow.remove();
        guidePath.remove();
        trail.style.opacity = '0';
        setTimeout(() => trail.remove(), 1900);
      }
    };

    requestAnimationFrame(animate);
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PaperRocketsManager());
} else {
  new PaperRocketsManager();
}

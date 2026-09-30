import React from 'react';

interface DecorativeWoodProps {
  radius?: number;
}

export const DecorativeWood: React.FC<DecorativeWoodProps> = ({ radius = 175 }) => {
  // 6 radial partition angles dividing the 6 bays around the cylinder
  const pilasterAngles = [30, 90, 150, 210, 270, 330];
  const bayAngles = [0, 60, 120, 180, 240, 300];
  
  // 4 shelf tiers + top crown and bottom plinth
  const tierHeights = [30, 185, 340, 495];
  const basePlinthHeight = 650;

  return (
    <>
      {/* Central Structural Wooden Pillar */}
      <div className="wood-center-pillar" />

      {/* Top Ornamental Turned Acorn Finial with Brass Collars */}
      <div className="wood-top-finial">
        <div className="finial-needle" />
        <div className="finial-tip" />
        <div className="finial-acorn" />
        <div className="finial-brass-collar" />
        <div className="finial-base" />
      </div>

      {/* Carved Classical Crown Cornice (Stepped Ogive Molding + Rosette Frieze) */}
      <div className="wood-crown-cornice">
        <div className="wood-crown-dome-step" />
        <div className="wood-crown-frieze" />
        <div className="wood-crown-bead-rim" />
      </div>

      {/* 4 Circular Shelf Tier Plates with Beveled 3D Rim and Lip Molding */}
      {tierHeights.map((topPos, idx) => (
        <div 
          key={`tier-plate-${idx}`} 
          className="shelf-tier-plate"
          style={{ top: `${topPos}px` }}
        >
          <div className="shelf-tier-top-surface" />
          <div className="shelf-tier-edge-rim" />
          <div className="shelf-tier-undershadow" />
        </div>
      ))}

      {/* 6 Carved Vertical Pilasters with Deep Relief Floral Carvings */}
      {pilasterAngles.map((angle, idx) => (
        <div
          key={`pilaster-${idx}`}
          className="carved-pilaster"
          style={{
            transform: `rotateY(${angle}deg) translateZ(${radius + 2}px)`
          }}
        >
          <div className="carved-pilaster-cap top" />
          <div className="carved-pilaster-relief" />
          <div className="carved-pilaster-fluting" />
          <div className="carved-pilaster-cap bottom" />
        </div>
      ))}

      {/* Turned Miniature Spindle Baluster Guardrails with Turned Brass Stanchions */}
      {tierHeights.map((topPos, tIdx) => {
        return bayAngles.map((angle, bIdx) => (
          <div
            key={`guardrail-${tIdx}-${bIdx}`}
            className="spindle-guardrail"
            style={{
              top: `${topPos + 130}px`,
              transform: `rotateY(${angle}deg) translateZ(${radius + 4}px)`
            }}
          >
            {/* Horizontal Retaining Top Bar */}
            <div className="guardrail-top-bar" />

            {/* Left and Right Turned Stanchion Posts */}
            <div className="guardrail-post left" />
            <div className="guardrail-post right" />

            {/* Turned Brass Spindles */}
            <div className="guardrail-baluster" />
            <div className="guardrail-baluster" />
            <div className="guardrail-baluster" />
            <div className="guardrail-baluster" />

            {/* Wooden Base Retention Ledge */}
            <div className="guardrail-base-ledge" />
          </div>
        ));
      })}

      {/* Molded Revolving Drum Base with Acanthus Floral Relief */}
      <div className="wood-base-plinth" style={{ top: `${basePlinthHeight}px` }}>
        <div className="wood-base-apron" />
        <div className="wood-base-molding" />
        <div className="wood-base-turntable-gap" />
      </div>

      {/* 4 Carved Victorian Cabriole Feet with Scrolled Knees & Ball-Claw */}
      <div className="wood-cabriole-feet" style={{ top: `${basePlinthHeight + 42}px` }}>
        <div className="cabriole-foot north" />
        <div className="cabriole-foot east" />
        <div className="cabriole-foot south" />
        <div className="cabriole-foot west" />
      </div>
    </>
  );
};

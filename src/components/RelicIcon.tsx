import React from 'react';
import relicsSpritesheet from '../assets/relics_spritesheet.png';

interface RelicIconProps {
  iconIndex?: number;
  className?: string;
  size?: number; // default 24
}

export const RelicIcon: React.FC<RelicIconProps> = ({ iconIndex, className, size = 24 }) => {
  const cn = `shrink-0 select-none pointer-events-none ${className || ''}`;

  if (iconIndex === undefined || iconIndex < 0) {
    return (
      <div 
        className={cn}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#1c1917',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      />
    );
  }

  // Map iconIndex to an 8x8 grid (64 items)
  const cols = 8;
  const col = iconIndex % cols;
  const row = Math.floor(iconIndex / cols) % cols;

  const posX = -(col * 100);
  const posY = -(row * 100);

  return (
    <div 
      className={cn}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${relicsSpritesheet})`,
        backgroundSize: '800% 800%',
        backgroundPosition: `${posX}% ${posY}%`,
        imageRendering: 'pixelated',
        display: 'inline-block'
      }}
    />
  );
};
export default RelicIcon;

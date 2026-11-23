import React from 'react';
import { 
  Swords, 
  Zap, 
  ShieldAlert, 
  Hammer, 
  Droplet, 
  Crown, 
  Sparkles, 
  Moon, 
  Shield, 
  Magnet, 
  Compass 
} from 'lucide-react';

interface SkillIconProps {
  iconId: string;
  className?: string;
  size?: number; // default 16
}

export const SkillIcon: React.FC<SkillIconProps> = ({ iconId, className, size = 16 }) => {
  const cn = `shrink-0 select-none ${className || ''}`;

  switch (iconId) {
    case 'whip':
      return <Swords size={size} className={`${cn} text-red-500`} />;
    case 'wand':
      return <Zap size={size} className={`${cn} text-purple-400`} />;
    case 'garlic':
      return <ShieldAlert size={size} className={`${cn} text-emerald-500`} />;
    case 'axe':
      return <Hammer size={size} className={`${cn} text-amber-600`} />;
    case 'holy_water':
      return <Droplet size={size} className={`${cn} text-blue-400`} />;
    
    // Ultimate skills
    case 'ultimate_duke':
      return <Crown size={size} className={`${cn} text-red-500`} />;
    case 'ultimate_countess':
      return <Sparkles size={size} className={`${cn} text-purple-400`} />;
    case 'ultimate_nightstalker':
      return <Moon size={size} className={`${cn} text-emerald-400`} />;
    case 'ultimate_brujah':
      return <Shield size={size} className={`${cn} text-cyan-400`} />;
    
    // Stat icons
    case 'attack':
      return <Swords size={size} className={`${cn} text-red-400`} />;
    case 'magnetRange':
      return <Magnet size={size} className={`${cn} text-indigo-400`} />;
    case 'speed':
      return <Compass size={size} className={`${cn} text-emerald-400`} />;
    
    default:
      // Fallback
      return <Sparkles size={size} className={`${cn} text-slate-400`} />;
  }
};

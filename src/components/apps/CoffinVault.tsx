import React from 'react';
import { Hero, RelicType } from '../../types/game';
import { Shield, Heart, Compass, Sparkles, Skull, Swords, Zap } from 'lucide-react';
import { RelicIcon } from '../RelicIcon';

interface CoffinVaultProps {
  player: Hero;
  onUnequipRelic: (type: RelicType) => void;
}

export const CoffinVault: React.FC<CoffinVaultProps> = ({ player, onUnequipRelic }) => {

  const xpPercent = Math.min(100, (player.xp / player.maxXp) * 100);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#94a3b8';
      case 'magic': return '#3b82f6';
      case 'rare': return '#fbbf24';
      case 'epic': return '#c084fc';
      case 'legendary': return '#ef4444';
      case 'cosmic': return '#f43f5e';
      default: return '#cbd5e1';
    }
  };

  const getRarityGlow = (rarity: string) => {
    const color = getRarityColor(rarity);
    return {
      border: `1.5px solid ${color}`,
      boxShadow: `0 0 12px ${color}50, inset 0 0 6px ${color}20`
    };
  };

  // Render an equipment slot
  const renderGearSlot = (slot: RelicType, label: string) => {
    const item = player.equipment[slot];
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <span className="text-[7px] text-slate-500 uppercase tracking-widest font-mono font-bold">{label} Slot</span>
        {item ? (
          <button
            onClick={() => onUnequipRelic(slot)}
            style={getRarityGlow(item.rarity)}
            className="w-full p-2.5 rounded bg-gradient-to-br from-slate-950 to-slate-900/80 hover:bg-red-950/10 flex items-center gap-3.5 text-left transition-all cursor-pointer select-none group relative"
          >
            <div className="w-8 h-8 rounded bg-black/50 border border-slate-900 flex items-center justify-center shrink-0">
              <RelicIcon iconIndex={item.iconIndex} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div 
                style={{ color: getRarityColor(item.rarity) }}
                className="font-serif text-[10px] font-bold truncate leading-none mb-1.5"
              >
                {item.name}
              </div>
              <div className="text-[7px] text-slate-400 font-mono flex gap-2">
                {Object.entries(item.stats).map(([stat, val]) => (
                  <span key={stat} className="uppercase">
                    +{val} {stat}
                  </span>
                ))}
              </div>
            </div>
            <span className="absolute right-2 top-2 text-[6px] text-slate-600 font-mono group-hover:text-red-400 transition-colors">
              CLICK TO UNEQUIP
            </span>
          </button>
        ) : (
          <div className="w-full p-4 rounded border border-dashed border-red-950/20 bg-slate-950/20 flex items-center justify-center text-center text-slate-600 font-mono text-[8px] uppercase tracking-wider">
            Empty {label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5 text-slate-200 overflow-hidden min-h-[380px] p-1">
      
      {/* Left Column: Character details and stats */}
      <div className="flex-1 flex flex-col gap-4 bg-slate-950/40 border border-red-950/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-red-500/20 bg-gradient-to-br from-red-950/20 to-slate-950 flex items-center justify-center">
            <Skull size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-serif text-xs font-bold text-slate-100 tracking-wide">{player.name}</h2>
            <div className="text-[8px] text-slate-450 font-mono uppercase mt-0.5">
              LVL {player.level} &bull; {player.class.toUpperCase()} CHAMPION
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full bg-slate-950 border border-slate-900/60 p-2.5">
          <div className="flex justify-between font-mono text-[7px] text-slate-500 uppercase leading-none mb-2">
            <span className="font-bold tracking-wide">Experience Points</span>
            <span className="text-slate-400">{player.xp} / {player.maxXp} XP</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-950">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-purple-650 transition-all duration-350"
              style={{ width: `${xpPercent}%`, boxShadow: '0 0 6px rgba(220,38,38,0.5)' }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 flex flex-col gap-2 font-mono text-[9px] mt-1">
          <h3 className="text-[7px] text-slate-500 uppercase tracking-widest font-mono border-b border-slate-900/60 pb-1 mb-1 font-bold">Combat Attributes</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Max Health', val: player.stats.maxHp, base: player.baseStats.maxHp, icon: <Heart size={10} className="text-red-500" /> },
              { label: 'Max Mana', val: player.stats.maxMana, base: player.baseStats.maxMana, icon: <Zap size={10} className="text-blue-400" /> },
              { label: 'Attack Power', val: player.stats.attack, base: player.baseStats.attack, icon: <Swords size={10} className="text-amber-500" /> },
              { label: 'Defense Rating', val: player.stats.defense, base: player.baseStats.defense, icon: <Shield size={10} className="text-cyan-400" /> },
              { label: 'Movement Speed', val: player.stats.speed, base: player.baseStats.speed, icon: <Compass size={10} className="text-emerald-400" />, isFloat: true },
              { label: 'Health Regen', val: player.stats.regen, base: player.baseStats.regen, icon: <Sparkles size={10} className="text-purple-400" /> }
            ].map(s => {
              const isBoosted = s.val > s.base;
              return (
                <div key={s.label} className="flex items-center justify-between p-2 bg-slate-950/70 border border-slate-900/40">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    {s.icon} <span className="text-[8.5px]">{s.label}</span>
                  </span>
                  <span className={`font-bold ${isBoosted ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {s.isFloat ? s.val.toFixed(2) : s.val}
                    {isBoosted && <span className="text-[7px] font-normal ml-0.5 text-emerald-500"> (+{Math.round(s.val - s.base)})</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Gear slots */}
      <div className="w-full md:w-1/2 flex flex-col gap-3 bg-slate-950/20 border border-red-950/5 p-4">
        <h3 className="text-[7px] text-slate-500 uppercase tracking-widest font-mono border-b border-slate-900/60 pb-1 mb-1 font-bold">Equipped Gear</h3>
        {renderGearSlot('weapon', 'Weapon')}
        {renderGearSlot('armor', 'Armor')}
        {renderGearSlot('accessory', 'Accessory')}
      </div>

    </div>
  );
};
export default CoffinVault;

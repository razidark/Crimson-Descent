import React from 'react';
import { BloodUpgrades } from '../../types/game';
import { Heart, Droplet, Zap, Shield, Activity } from 'lucide-react';

interface BloodAltarProps {
  blood: number;
  bloodUpgrades: BloodUpgrades;
  onBuyUpgrade: (key: keyof BloodUpgrades) => void;
}

interface UpgradeDef {
  key: keyof BloodUpgrades;
  name: string;
  lore: string;
  effectLabel: (rank: number) => string;
  costs: number[];
}

const UPGRADES: UpgradeDef[] = [
  {
    key: 'maxHp',
    name: 'Coven Sarcophagus',
    lore: 'The blood of ages reinforces each vessel.',
    effectLabel: (rank) => `+${rank * 10}% Max HP (all Kindred)`,
    costs: [10, 25, 50, 100, 200],
  },
  {
    key: 'lifesteal',
    name: 'Vampiric Fangs',
    lore: 'Every wound feeds the predator within.',
    effectLabel: (rank) => `+${rank} HP restored per weapon hit`,
    costs: [15, 35, 75, 150, 300],
  },
  {
    key: 'cdr',
    name: 'Shadow Step',
    lore: 'Celerity sharpened to a razored edge.',
    effectLabel: (rank) => `-${rank * 3}% weapon fire cooldowns`,
    costs: [20, 50, 100, 200, 400],
  },
  {
    key: 'xpMult',
    name: 'Tomb Magnetism',
    lore: 'Vitae Orbs drawn faster — knowledge absorbed faster.',
    effectLabel: (rank) => `+${rank * 5}% XP from Vitae Orb vacuum`,
    costs: [10, 25, 50, 100, 200],
  },
];

const MAX_RANK = 5;

const RankPips: React.FC<{ rank: number }> = ({ rank }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: MAX_RANK }).map((_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-sm border transition-all duration-300 ${
          i < rank
            ? 'bg-red-600 border-red-500 shadow-sm shadow-red-800'
            : 'bg-slate-900 border-slate-700'
        }`}
      />
    ))}
  </div>
);

export const BloodAltar: React.FC<BloodAltarProps> = ({ blood, bloodUpgrades, onBuyUpgrade }) => {
  const getUpgradeIcon = (key: keyof BloodUpgrades) => {
    switch (key) {
      case 'maxHp': return <Heart size={14} className="text-red-500" />;
      case 'lifesteal': return <Activity size={14} className="text-red-400" />;
      case 'cdr': return <Zap size={14} className="text-yellow-500" />;
      case 'xpMult': return <Shield size={14} className="text-purple-400" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-3 text-[10px] font-mono">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between border-b border-red-950/60 pb-1">
        <span className="text-red-400 font-serif text-xs font-bold tracking-widest uppercase">Blood Altar</span>
        <div className="flex items-center gap-1 bg-red-950/30 border border-red-900/40 rounded px-2 py-0.5 text-red-400">
          <Droplet size={10} className="text-red-500" />
          <span className="text-red-300 font-bold tabular-nums">{blood.toLocaleString()}</span>
          <span className="text-slate-500">Vitae</span>
        </div>
      </div>

      {/* ── LORE HEADER ── */}
      <div className="text-slate-600 italic text-[9px] leading-relaxed border-l-2 border-red-950 pl-2">
        "Permanent power, purchased in blood. These upgrades endure all runs."
      </div>

      {/* ── UPGRADES ── */}
      <div className="flex flex-col gap-2">
        {UPGRADES.map((upg) => {
          const rank = bloodUpgrades[upg.key] ?? 0;
          const isMaxed = rank >= MAX_RANK;
          const cost = isMaxed ? 0 : upg.costs[rank];
          const canAfford = blood >= cost;

          return (
            <div
              key={upg.key}
              className={`rounded border p-2.5 flex flex-col gap-2 transition-all duration-200 ${
                isMaxed
                  ? 'border-red-900/50 bg-red-950/10'
                  : 'border-slate-800/60 bg-black/20 hover:border-red-900/40'
              }`}
            >
              {/* Row 1: Icon + Name + Rank pips */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getUpgradeIcon(upg.key)}
                  <div className="flex flex-col">
                    <span className={`font-bold font-serif text-[10px] ${isMaxed ? 'text-red-400' : 'text-slate-300'}`}>
                      {upg.name}
                    </span>
                    <span className="text-slate-600 text-[8px] italic">{upg.lore}</span>
                  </div>
                </div>
                <RankPips rank={rank} />
              </div>

              {/* Row 2: Current effect + Buy button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 text-[8px] uppercase tracking-wide">Current</span>
                  <span className={`text-[9px] ${rank > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                    {rank > 0 ? upg.effectLabel(rank) : 'Not upgraded'}
                  </span>
                  {!isMaxed && (
                    <>
                      <span className="text-slate-500 text-[8px] uppercase tracking-wide mt-0.5">Next rank</span>
                      <span className="text-red-400/80 text-[9px]">{upg.effectLabel(rank + 1)}</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => !isMaxed && canAfford && onBuyUpgrade(upg.key)}
                  disabled={isMaxed || !canAfford}
                  className={`flex flex-col items-center justify-center rounded px-2 py-1.5 min-w-[52px] border transition-all duration-200 shrink-0 ${
                    isMaxed
                      ? 'border-red-900/30 bg-red-950/10 text-red-600 cursor-default'
                      : canAfford
                      ? 'border-red-800 bg-red-950/40 text-red-300 hover:bg-red-900/50 hover:text-red-200 cursor-pointer active:scale-95'
                      : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isMaxed ? (
                    <span className="text-[8px] uppercase tracking-widest">Maxed</span>
                  ) : (
                    <>
                      <span className="text-[8px] uppercase tracking-wider">Buy</span>
                      <span className="font-bold text-[9px] flex items-center gap-0.5">
                        <Droplet size={8} className="text-red-500" />{cost}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER NOTE ── */}
      <div className="text-slate-700 text-[8px] italic text-center pt-1 border-t border-slate-900">
        All upgrades persist across runs and zone resets.
      </div>

    </div>
  );
};

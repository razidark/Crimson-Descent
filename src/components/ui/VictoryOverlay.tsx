import React from 'react';
import { GameState } from '../../types/game';
import { Trophy, Clock, Skull, Coins, Droplet } from 'lucide-react';

interface VictoryOverlayProps {
  state: GameState;
  onClaimVictory: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({ state, onClaimVictory }) => {
  if (!state.showVictoryScreen) return null;

  const runStats = state.runStats || {
    runTime: 0,
    kills: { bat: 0, skeleton: 0, zombie: 0, ghost: 0, reaper: 0 },
    goldEarned: 0,
    bloodEarned: 0
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const totalKills = Object.values(runStats.kills).reduce((a, b) => a + b, 0);

  return (
    <div className="gothic-overlay-fullscreen">
      <div 
        className="relative max-w-lg w-full p-8 rounded-none flex flex-col items-center border-2"
        style={{
          backgroundColor: 'rgba(7, 3, 10, 0.96)',
          borderColor: '#d97706',
          borderImage: 'linear-gradient(to bottom, #d97706, #7f1d1d, #000) 1',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 50px rgba(245, 158, 11, 0.15)'
        }}
      >
        <div className="text-center mb-6">
          <Trophy size={48} className="text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-bounce" />
          <h2 className="text-3xl font-serif font-bold text-amber-500 tracking-[0.2em] uppercase drop-shadow-md">
            VICTORY ACHIEVED!
          </h2>
          <p className="text-slate-400 font-mono text-[9px] tracking-widest uppercase mt-2">
            The Blood Queen has fallen &bull; The night is yours
          </p>
        </div>

        {/* Stats Grid */}
        <div className="w-full flex flex-col gap-3.5 my-6 p-5 border border-red-950/40 bg-black/40 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-red-950/20 pb-2">
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-500" /> Survival Time</span>
            <span className="text-slate-200 font-bold">{formatTime(runStats.runTime)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-red-950/20 pb-2">
            <span className="flex items-center gap-1.5"><Skull size={14} className="text-red-500" /> Total Foes Slain</span>
            <span className="text-red-400 font-bold">{totalKills}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-red-950/20 pb-2">
            <span className="flex items-center gap-1.5"><Coins size={14} className="text-amber-500" /> Gold Harvested</span>
            <span className="text-amber-400 font-bold">+{runStats.goldEarned} Gold</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 pb-1">
            <span className="flex items-center gap-1.5"><Droplet size={14} className="text-red-500" /> Vitae Collected</span>
            <span className="text-red-300 font-bold">+{runStats.bloodEarned} Vitae</span>
          </div>
        </div>

        <button
          onClick={onClaimVictory}
          className="w-full py-4 rounded-none border border-amber-600 bg-amber-950/20 text-amber-200 hover:bg-amber-900/40 hover:text-white text-xs font-bold font-mono tracking-[0.2em] uppercase cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-amber-900/50"
        >
          CLAIM GLORY & RETURN TO COVEN
        </button>
      </div>
    </div>
  );
};

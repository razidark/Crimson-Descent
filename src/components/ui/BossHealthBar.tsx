import React from 'react';
import { GameState } from '../../types/game';

interface BossHealthBarProps {
  state: GameState;
}

export const BossHealthBar: React.FC<BossHealthBarProps> = ({ state }) => {
  if (!state.activeBoss) return null;

  const hpPercent = (state.activeBoss.hp / state.activeBoss.maxHp) * 100;

  return (
    <>
      {/* Cinematic Overlay */}
      {state.bossCinematic && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-1000">
          <div className="w-full bg-red-900/40 border-y-4 border-red-600/50 py-12 flex flex-col items-center justify-center animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.3)]">
            <h1 className="text-6xl font-serif text-red-500 font-bold uppercase tracking-[0.5em] drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
              WARNING
            </h1>
            <p className="mt-4 text-xl text-slate-300 font-mono tracking-widest uppercase">
              {state.bossCinematic.name} has arrived
            </p>
          </div>
        </div>
      )}

      {/* Persistent Boss Health Bar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1/2 z-[50] pointer-events-none">
        <div className="flex justify-between items-end mb-1 px-2">
          <span className="text-red-400 font-serif font-bold uppercase tracking-widest drop-shadow-md">
            {state.activeBoss.name}
          </span>
          <span className="text-red-300/80 font-mono text-xs drop-shadow-md">
            {Math.ceil(state.activeBoss.hp)} / {state.activeBoss.maxHp}
          </span>
        </div>
        
        <div className="relative w-full h-4 bg-gray-900/90 border-2 border-red-900/60 shadow-[0_0_15px_rgba(153,27,27,0.4)] rounded-sm overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-800 via-red-600 to-red-500 transition-all duration-300 ease-out"
            style={{ width: `${hpPercent}%` }}
          />
          {/* Highlight glare */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
        </div>
      </div>
    </>
  );
};

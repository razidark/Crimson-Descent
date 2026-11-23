import React from 'react';
import { Hero } from '../types/game';
import { Droplet, Terminal, Swords } from 'lucide-react';

export const CovenHUD: React.FC<{ heroes: Hero[] } & any> = ({ player, terminalLogs, state }) => {
  // Gracefully handle prop name compatibility
  const activePlayer = player || (state && state.player);
  const logs = terminalLogs || (state && state.terminalLogs) || [];

  if (!activePlayer) return null;

  const hpPercent = Math.min(100, (activePlayer.currentHp / activePlayer.stats.maxHp) * 100);
  const manaPercent = Math.min(100, (activePlayer.currentMana / activePlayer.stats.maxMana) * 100);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none text-slate-200 font-mono text-[10px]">
      {/* 1. Champion Profile */}
      <div className="flex flex-col gap-2 border-b border-red-950/20 pb-3 mb-3 bg-black/20 p-2.5 rounded-xl border border-red-950/5">
        <div className="flex justify-between items-baseline">
          <span className="font-serif text-[11px] font-bold text-red-400 tracking-wider">
            {activePlayer.name}
          </span>
          <span className="text-[8px] text-purple-400 font-bold">
            LVL {activePlayer.level}
          </span>
        </div>

        {/* Health Bar */}
        <div className="mt-1">
          <div className="flex justify-between text-[7px] text-slate-500 mb-0.5 leading-none uppercase">
            <span className="flex items-center gap-0.5"><HeartIcon /> Health</span>
            <span>{activePlayer.currentHp} / {activePlayer.stats.maxHp}</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-red-950/20 relative">
            <div 
              className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Mana Bar */}
        <div>
          <div className="flex justify-between text-[7px] text-slate-500 mb-0.5 leading-none uppercase">
            <span className="flex items-center gap-0.5"><ManaIcon /> Mana</span>
            <span>{activePlayer.currentMana} / {activePlayer.stats.maxMana}</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-blue-950/20 relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-300"
              style={{ width: `${manaPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Spells & Hotkeys */}
      <div className="flex flex-col gap-2 mb-3 bg-black/10 p-2.5 rounded-xl border border-red-950/5">
        <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mb-1">Active Spellbook</span>
        
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="flex items-center gap-1.5 text-[8px]">
              <Swords size={10} className="text-amber-500" /> Melee Slash
            </span>
            <span className="text-[7px] text-slate-500 uppercase">LEFT CLICK</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-900">
            <span className="flex items-center gap-1.5 text-[8px]">
              <Droplet size={10} className="text-red-500 animate-pulse" /> Blood Nova
            </span>
            <span className="text-[7px] text-slate-400 bg-red-950/35 px-1 rounded border border-red-900/20 font-bold">KEY [Q]</span>
          </div>
        </div>
      </div>

      {/* 3. Live Combat & System Logs */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/35 rounded-xl border border-red-950/10 p-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[7px] uppercase tracking-wider mb-2 shrink-0">
          <Terminal size={10} className="text-red-500" /> Live Combat Feed
        </div>
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 text-[7px] font-mono leading-normal text-slate-400">
          {logs.slice().reverse().map((log: string, i: number) => (
            <div 
              key={i} 
              className={`p-1.5 rounded bg-slate-950/20 border-l border-red-500/10 ${
                log.includes('☠️') ? 'text-red-500 bg-red-950/5' : 
                log.includes('🏛️') ? 'text-purple-400' :
                log.includes('🎒') ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);

const ManaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M13.4 2A10 10 0 0 0 2 13.4V20a2 2 0 0 0 2 2h6.6A10 10 0 0 0 22 10.6V4a2 2 0 0 0-2-2Z"/><path d="M2 20 10 12"/></svg>
);

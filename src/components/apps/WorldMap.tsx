import React from 'react';
import { Compass, Skull, BookOpen, Droplet, Crown, MapPin, ChevronRight } from 'lucide-react';

interface WorldMapProps {
  activeZone: number;
  onTravelToZone: (zoneIdx: number) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ activeZone, onTravelToZone }) => {
  const zones = [
    {
      idx: 0,
      name: 'Castle Drawbridge',
      desc: 'The outer gates of the castle. Haunted by Blood Bats and Skeletons.',
      icon: <Compass size={18} className="text-slate-400" />,
      color: 'from-slate-900 to-slate-950 border-slate-800',
      activeColor: 'border-slate-500 shadow-[0_0_15px_rgba(148,163,184,0.15)]'
    },
    {
      idx: 1,
      name: 'Forgotten Crypts',
      desc: 'Damp, underground tomb of ancient vampires. War Ghouls crawl the graves.',
      icon: <Skull size={18} className="text-purple-400" />,
      color: 'from-purple-950/40 to-slate-950 border-purple-950/60',
      activeColor: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
    },
    {
      idx: 2,
      name: 'Haunted Library',
      desc: 'Dracula\'s repository of dark magic. Whispering Wraiths guard the grimoires.',
      icon: <BookOpen size={18} className="text-amber-500" />,
      color: 'from-amber-950/30 to-slate-950 border-amber-950/55',
      activeColor: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
    },
    {
      idx: 3,
      name: 'Blood Altar',
      desc: 'The ritual chamber of the coven. Bathed in flowing crimson Vitae.',
      icon: <Droplet size={18} className="text-red-500" />,
      color: 'from-red-950/40 to-slate-950 border-red-950/60',
      activeColor: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
    },
    {
      idx: 4,
      name: 'Dracula\'s Throne',
      desc: 'The inner sanctum. Confront the Ductus under the great stained-glass window.',
      icon: <Crown size={18} className="text-yellow-500" />,
      color: 'from-yellow-950/30 to-slate-950 border-yellow-950/50',
      activeColor: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
    }
  ];

  return (
    <div className="flex flex-col h-full text-slate-200 p-1 min-h-[380px]">
      {/* Header */}
      <div className="border-b border-red-950/35 pb-2 mb-4 shrink-0">
        <h2 className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={12} className="text-red-500 animate-pulse" /> Dracula's Castle Navigation
        </h2>
        <p className="text-[8px] text-slate-500 font-mono mt-0.5">
          Teleport your coven to different areas of the castle. Each zone hosts distinct monsters and loot multipliers.
        </p>
      </div>

      {/* The Map Layout */}
      <div className="flex-1 flex flex-col justify-center gap-4 py-4 relative">
        {/* Visual Blood Path connecting nodes */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-slate-900 via-red-950 to-yellow-950/30 z-0 rounded hidden md:block" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 z-10">
          {zones.map((zone) => {
            const isActive = activeZone === zone.idx;
            return (
              <button
                key={zone.idx}
                onClick={() => onTravelToZone(zone.idx)}
                className={`text-left p-3 rounded-xl border bg-gradient-to-b flex flex-col justify-between min-h-[140px] transition-all duration-300 relative select-none cursor-pointer group hover:scale-[1.02] ${zone.color} ${
                  isActive 
                    ? `${zone.activeColor} bg-red-950/10` 
                    : 'hover:border-slate-700/60'
                }`}
              >
                {/* Active Indicator Pin */}
                {isActive && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-[6px] font-mono font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.5)] flex items-center gap-0.5 animate-bounce">
                    <MapPin size={6} />
                    <span>ACTIVE</span>
                  </span>
                )}

                {/* Node Icon */}
                <div className="w-9 h-9 rounded-lg bg-black/40 border border-slate-900 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-300">
                  {zone.icon}
                </div>

                {/* Node Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-[10px] font-bold text-slate-200 tracking-wide">{zone.name}</h3>
                    <p className="text-[7px] text-slate-500 font-mono mt-1 leading-normal">{zone.desc}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[7px] font-mono font-bold">
                    {isActive ? (
                      <span className="text-red-400 uppercase tracking-widest">COVEN FIGHTING</span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-slate-300 transition flex items-center gap-0.5 uppercase tracking-widest">
                        TELEPORT HERE <ChevronRight size={8} />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

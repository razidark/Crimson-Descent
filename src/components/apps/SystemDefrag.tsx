import React, { useState } from 'react';
import { Database } from 'lucide-react';

interface SystemDefragProps {
  grid: boolean[];
  onCleanCell: (idx: number) => void;
}

export const SystemDefrag: React.FC<SystemDefragProps> = ({ grid, onCleanCell }) => {
  const [cleaningIdx, setCleaningIdx] = useState<number | null>(null);

  const cleanCount = grid.filter(Boolean).length;
  const percentage = Math.round((cleanCount / grid.length) * 100);

  const handleCellClick = (idx: number) => {
    if (grid[idx] || cleaningIdx !== null) return;
    
    // Animate a short "cleaning" lag to make the click feel physical and interactive!
    setCleaningIdx(idx);
    setTimeout(() => {
      onCleanCell(idx);
      setCleaningIdx(null);
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-red-950/60 pb-2">
        <h2 className="text-sm font-semibold text-red-500 gothic-title flex items-center gap-1.5">
          <Database size={16} className="text-red-500" />
          DracOS Coffin Defragmenter
        </h2>
        <span className="text-[10px] text-slate-400 font-mono">Registry Optimizer v1.2</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Progress Bar */}
        <div className="md:col-span-2 glass-panel p-3 border-slate-900 bg-slate-950/60 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>Disk Optimization Cleanliness</span>
            <span className="text-red-400 font-mono">{cleanCount} / 64 Cells</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-red-950/40">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-purple-600 transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-bold font-mono text-slate-100 flex items-center gap-0.5">{percentage}%</span>
          </div>
        </div>

        {/* Buff details */}
        <div className="glass-panel p-3 border-slate-900 bg-slate-950/60 flex flex-col justify-center text-xs">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Active Registry Buff</div>
          <div className="text-slate-200 flex justify-between font-mono">
            <span>Gold Multiplier:</span>
            <span className="text-yellow-400 font-bold">+{percentage * 0.25}%</span>
          </div>
          <div className="text-slate-200 flex justify-between font-mono mt-0.5">
            <span>Blood Extraction:</span>
            <span className="text-red-400 font-bold">+{percentage * 0.15}%</span>
          </div>
        </div>
      </div>

      {/* Grid instructions */}
      <div className="text-[10px] text-slate-400 italic">
        * Instructions: Click on fragmented sectors (dark cells) to clean them. Fully defragmenting the grid triggers a massive gold and blood surge!
      </div>

      {/* The 8x8 Grid */}
      <div className="flex-1 flex items-center justify-center p-2 bg-black/40 rounded border border-red-950/30">
        <div className="grid grid-cols-8 gap-1.5 aspect-square max-w-[280px] w-full">
          {grid.map((isClean, idx) => {
            const isCleaning = cleaningIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={isClean || cleaningIdx !== null}
                className={`w-full aspect-square rounded transition-all duration-150 defrag-cell ${
                  isClean
                    ? 'bg-purple-950/50 border border-purple-500/30 shadow-[inset_0_0_6px_rgba(147,51,234,0.4)] cursor-default'
                    : isCleaning
                    ? 'cleaning'
                    : 'fragmented cursor-pointer'
                }`}
                title={isClean ? 'Optimized Sector' : 'Fragmented Sector - Click to Clean'}
              >
                <div
                  className={`w-full h-full rounded-sm transition-all ${
                    isClean 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 opacity-80' 
                      : isCleaning
                      ? 'bg-red-500'
                      : 'bg-red-950/20'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

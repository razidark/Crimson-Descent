import React, { useState, useEffect } from 'react';
import { RunStats, LifetimeStats, Hero } from '../../types/game';
import { Clock, Skull, Coins, Droplet, Trophy } from 'lucide-react';

interface CovenStatsProps {
  heroes: Hero[];
  runStats?: RunStats;
  lifetimeStats?: LifetimeStats;
  activeZone: number;
  wave: number;
  achievements: string[];
}

const HERO_CLAN: Record<string, { clan: string; color: string }> = {
  vlad:       { clan: 'Ventrue',  color: '#6ea8fe' },
  carmilla:   { clan: 'Tremere',  color: '#ea868f' },
  rook:       { clan: 'Gangrel',  color: '#f0a050' },
};

const ENEMY_DISPLAY: Record<string, string> = {
  bat:      'Blood Bat',
  skeleton: 'Revenant',
  zombie:   'War Ghoul',
  ghost:    'Wraith',
  reaper:   'Ductus',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CovenStats: React.FC<CovenStatsProps> = ({
  heroes,
  runStats,
  lifetimeStats,
  activeZone,
  wave,
  achievements,
}) => {
  const [elapsed, setElapsed] = useState(runStats?.runTime ?? 0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute total damage for DPS bar widths
  const totalDmg = Object.values(runStats?.damageDealt ?? {}).reduce((a, b) => a + b, 0) || 1;
  const totalKills = Object.values(runStats?.kills ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3 text-[10px] font-mono">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between border-b border-red-950/60 pb-1">
        <span className="text-red-400 font-serif text-xs font-bold tracking-widest uppercase">Coven Stats</span>
        <span className="text-slate-500">Zone {activeZone + 1} · Wave {wave}</span>
      </div>

      {/* ── RUN TIMER ── */}
      <div className="flex items-center justify-between bg-black/30 rounded px-2 py-1.5 border border-slate-800/50">
        <span className="text-slate-400 flex items-center gap-1">
          <Clock size={11} />
          <span>Run Time</span>
        </span>
        <span className="text-green-400 font-bold tabular-nums">{formatTime(elapsed)}</span>
      </div>

      {/* ── DPS BARS ── */}
      <div className="flex flex-col gap-1.5">
        <div className="text-slate-500 uppercase tracking-widest text-[9px]">Damage Dealt This Run</div>
        {heroes.map(hero => {
          const dmg = runStats?.damageDealt?.[hero.id] ?? 0;
          const pct = Math.round((dmg / totalDmg) * 100);
          const info = HERO_CLAN[hero.id] ?? { clan: hero.class, color: '#aaa' };
          return (
            <div key={hero.id} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[9px]">
                <span style={{ color: info.color }}>{hero.name}</span>
                <span className="text-slate-400">{dmg.toLocaleString()} dmg</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: info.color, opacity: 0.85 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── KILL BREAKDOWN ── */}
      <div className="flex flex-col gap-1">
        <div className="text-slate-500 uppercase tracking-widest text-[9px]">Kills This Run <span className="text-slate-600">({totalKills} total)</span></div>
        <div className="bg-black/20 rounded border border-slate-800/40 divide-y divide-slate-800/30">
          {Object.entries(runStats?.kills ?? {}).length === 0
            ? <div className="text-slate-600 px-2 py-1.5 italic">No kills yet.</div>
            : Object.entries(runStats?.kills ?? {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between px-2 py-1">
                <span className="text-slate-400">{ENEMY_DISPLAY[type] ?? type}</span>
                <span className="text-red-400 font-bold">{count}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── LIFETIME RECORDS ── */}
      <div className="flex flex-col gap-1">
        <div className="text-slate-500 uppercase tracking-widest text-[9px]">Lifetime Chronicle</div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: 'Total Kills',  value: (lifetimeStats?.kills ?? 0).toLocaleString(), icon: <Skull size={10} className="text-slate-500" /> },
            { label: 'Gold Earned',  value: (lifetimeStats?.gold ?? 0).toLocaleString(), icon: <Coins size={10} className="text-amber-500" /> },
            { label: 'Vitae Earned', value: (lifetimeStats?.blood ?? 0).toLocaleString(), icon: <Droplet size={10} className="text-red-500" /> },
            { label: 'Best Wave Z1', value: `W${lifetimeStats?.maxWaveReached?.[1] ?? 0}`, icon: <Trophy size={10} className="text-purple-500" /> },
            { label: 'Best Wave Z2', value: `W${lifetimeStats?.maxWaveReached?.[2] ?? 0}`, icon: <Trophy size={10} className="text-purple-500" /> },
            { label: 'Best Wave Z5', value: `W${lifetimeStats?.maxWaveReached?.[5] ?? 0}`, icon: <Trophy size={10} className="text-purple-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-black/20 border border-slate-800/40 rounded px-2 py-1 flex flex-col justify-between min-h-[36px]">
              <span className="text-slate-600 text-[8px] flex items-center gap-1">
                {icon}
                <span>{label}</span>
              </span>
              <span className="text-slate-300 font-bold text-[10px] mt-0.5">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACHIEVEMENTS ── */}
      <div className="flex flex-col gap-1 mt-1">
        <div className="text-slate-500 uppercase tracking-widest text-[9px]">Achievements</div>
        <div className="bg-black/20 rounded border border-slate-800/40 px-2 py-1.5 flex flex-wrap gap-1">
          {achievements && achievements.length > 0 ? (
            achievements.map((ach) => (
              <span key={ach} className="bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded text-[8px] border border-amber-500/30 flex items-center gap-1">
                <Trophy size={8} /> {ach}
              </span>
            ))
          ) : (
            <span className="text-slate-600 italic">No achievements yet.</span>
          )}
        </div>
      </div>

      {/* ── BLOOD EARNED THIS RUN ── */}
      <div className="flex items-center justify-between bg-black/30 rounded px-2 py-1.5 border border-red-950/40">
        <span className="text-slate-400 flex items-center gap-1">
          <Droplet size={11} className="text-red-500" />
          <span>Vitae this run</span>
        </span>
        <span className="text-red-400 font-bold">{(runStats?.bloodEarned ?? 0).toLocaleString()}</span>
      </div>

    </div>
  );
};

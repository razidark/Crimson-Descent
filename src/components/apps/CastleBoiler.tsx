import React, { useEffect, useState } from 'react';
import { Flame, Activity, ShieldAlert, Coins } from 'lucide-react';

interface CastleBoilerProps {
  overclockLevel: number;
  onSetOverclock: (level: number) => void;
  gold: number;
  silicon: number;
}

// Initial chart data is generated once at module scope so rendering stays pure.
const INITIAL_CHART = Array.from({ length: 20 }, () => 40 + Math.random() * 10);

export const CastleBoiler: React.FC<CastleBoilerProps> = ({
  overclockLevel,
  onSetOverclock,
  gold,
  silicon
}) => {
  const [pressure, setPressure] = useState(45);
  const [chartData, setChartData] = useState<number[]>(() => INITIAL_CHART);

  // Simulating real-time pressure spikes
  useEffect(() => {
    const timer = setInterval(() => {
      const targetBase = overclockLevel === 0 ? 30 : overclockLevel === 1 ? 65 : 92;
      const noise = (Math.random() - 0.5) * 8;
      const nextPressure = Math.min(100, Math.max(10, Math.round(targetBase + noise)));
      
      setPressure(nextPressure);
      setChartData(prev => [...prev.slice(1), nextPressure]);
    }, 800);
    return () => clearInterval(timer);
  }, [overclockLevel]);

  const maxPoints = 20;
  const width = 280;
  const height = 80;
  const points = chartData.map((val, idx) => {
    const x = (idx / (maxPoints - 1)) * width;
    // invert y coordinate since SVG (0,0) is top-left
    const y = height - (val / 100) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex-1 flex flex-col gap-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-red-950/60 pb-2">
        <h2 className="text-sm font-semibold text-red-500 gothic-title flex items-center gap-1.5">
          <Flame size={16} className="text-red-500 animate-pulse" />
          Castle Steam Boiler Manager
        </h2>
        <span className="text-[10px] text-slate-400 font-mono">Boiler Core #01</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status card */}
        <div className="glass-panel p-3 border-slate-900 bg-slate-950/60 flex flex-col gap-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Core Temperature</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold font-mono text-red-400">
            {overclockLevel === 0 ? '72°C' : overclockLevel === 1 ? '160°C' : '480°C'}
            {overclockLevel === 2 && (
              <span className="text-xs font-sans text-red-500 font-normal flex items-center gap-0.5 ml-1.5 animate-pulse">
                <Flame size={10} className="text-red-500" />
                <span>OVERHEAT</span>
              </span>
            )}
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                overclockLevel === 0 ? 'bg-green-500' : overclockLevel === 1 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
              }`}
              style={{ width: `${overclockLevel === 0 ? 25 : overclockLevel === 1 ? 60 : 100}%` }}
            />
          </div>
        </div>

        {/* Pressure card */}
        <div className="glass-panel p-3 border-slate-900 bg-slate-950/60 flex flex-col gap-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Boiler Pressure</div>
          <div className="flex items-baseline gap-1 text-2xl font-bold font-mono text-cyan-400">
            {pressure} psi
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                pressure < 40 ? 'bg-cyan-500' : pressure < 80 ? 'bg-yellow-500' : 'bg-rose-500 animate-bounce'
              }`}
              style={{ width: `${pressure}%` }}
            />
          </div>
        </div>

        {/* Resources card */}
        <div className="glass-panel p-3 border-slate-900 bg-slate-950/60 flex flex-col justify-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Boiler Fuels</div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span>Silicon Cores:</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              {silicon} <Activity size={10} className="text-cyan-400" />
            </span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono mt-1">
            <span>Ash Dust:</span>
            <span className="text-yellow-500 font-bold flex items-center gap-1">
              {gold} <Coins size={10} className="text-yellow-500" />
            </span>
          </div>
        </div>
      </div>

      {/* Real-time SVG chart */}
      <div className="glass-panel p-3 border-slate-900 bg-slate-950/80 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1"><Activity size={10} className="text-red-500 animate-pulse" /> Core Activity Monitor</span>
          <span>Refresh Rate: 800ms</span>
        </div>
        <div className="relative bg-black/60 rounded border border-red-950/30 p-1 flex items-center justify-center">
          <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none" className="overflow-visible">
            {/* Grid Lines */}
            <line x1="0" y1="20" x2="280" y2="20" stroke="rgba(239, 68, 68, 0.05)" strokeDasharray="3" />
            <line x1="0" y1="40" x2="280" y2="40" stroke="rgba(239, 68, 68, 0.05)" strokeDasharray="3" />
            <line x1="0" y1="60" x2="280" y2="60" stroke="rgba(239, 68, 68, 0.05)" strokeDasharray="3" />
            
            {/* Pressure Path */}
            <polyline
              fill="none"
              stroke={overclockLevel === 0 ? '#10b981' : overclockLevel === 1 ? '#fbbf24' : '#ef4444'}
              strokeWidth="2"
              points={points}
              className="transition-all duration-300"
            />
          </svg>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Select Thermal Combustion Grade</div>
        <div className="flex gap-2">
          {[
            { level: 0, title: 'CHILL', speed: '1.0x', desc: 'Standard speed' },
            { level: 1, title: 'BOIL', speed: '2.0x', desc: 'Double farming' },
            { level: 2, title: 'OVERLOAD', speed: '3.5x', desc: 'Hellfire speed' }
          ].map((mode) => {
            const isActive = overclockLevel === mode.level;
            return (
              <button
                key={mode.level}
                onClick={() => onSetOverclock(mode.level)}
                className={`gothic-btn flex-1 flex flex-col items-center justify-center p-2.5 transition cursor-pointer select-none rounded-none ${
                  isActive
                    ? 'border-red-500 bg-red-950/40 text-yellow-300 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                    : 'opacity-70'
                }`}
              >
                <span className="text-xs gothic-title">{mode.title}</span>
                <span className="text-lg font-mono font-bold">{mode.speed}</span>
                <span className="text-[9px] opacity-70 mt-0.5">{mode.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning Alert */}
      {overclockLevel === 2 && (
        <div className="border border-red-500/40 bg-red-950/20 text-red-400 p-2.5 rounded flex gap-2 items-center text-xs animate-pulse">
          <ShieldAlert size={16} className="shrink-0" />
          <span><strong>DANGER:</strong> Geothermal Boiler runs in critical phase. Extreme spawn rates and +250% execution speed may result in severe monster swarms!</span>
        </div>
      )}
    </div>
  );
};

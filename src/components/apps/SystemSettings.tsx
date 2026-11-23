import React from 'react';
import { Settings, Monitor, Volume2, ZoomIn, ZoomOut, Maximize, Activity, Music } from 'lucide-react';
import { GameSettings } from '../../types/game';

interface SystemSettingsProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ settings, onUpdateSettings }) => {
  const isElectron = (window as any).electronAPI?.isElectron;

  return (
    <div className="flex flex-col h-full bg-[#0a0710]/95 backdrop-blur-md text-slate-300 font-serif border border-slate-700/50 shadow-2xl">
      <div className="flex items-center px-4 py-3 bg-gradient-to-r from-red-950/40 to-black/60 border-b border-red-900/30">
        <Settings size={18} className="text-red-400 mr-2" />
        <h2 className="text-lg font-bold tracking-widest text-slate-200">SYSTEM SETTINGS</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-red-900/50 scrollbar-track-transparent">
        
        {/* Graphics & Visuals */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 tracking-widest border-b border-slate-800 pb-1 flex items-center">
            <Monitor size={14} className="mr-2 text-indigo-400" /> GRAPHICS & VISUALS
          </h3>
          
          <div className="flex flex-col gap-2 bg-slate-900/40 p-3 border border-slate-800/80 rounded transition-colors hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-bold text-sm">CRT Scanline Filter</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Retro visual overlay effect</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ scanlines: !settings.scanlines })}
                className={`px-4 py-1.5 rounded font-bold text-xs transition-all tracking-wider ${
                  settings.scanlines ? 'bg-red-900/40 text-red-300 border border-red-700/60 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-slate-900 text-slate-500 border border-slate-700/50'
                }`}
              >
                {settings.scanlines ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-slate-900/40 p-3 border border-slate-800/80 rounded transition-colors hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-bold text-sm">Graphics & Lighting Quality</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Raymarched AO (GTAO), Soft Shadows & Bloom</div>
              </div>
              <div className="flex gap-1 border border-slate-700 p-0.5 rounded bg-black/40">
                {(['low', 'med', 'high'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => onUpdateSettings({ graphicsQuality: q })}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all tracking-wider ${
                      settings.graphicsQuality === q
                        ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 bg-slate-900/40 p-3 border border-slate-800/80 rounded transition-colors hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-bold text-sm">Desktop Wallpaper</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Choose background theme</div>
              </div>
              <div className="flex gap-1 border border-slate-700 p-0.5 rounded bg-black/40">
                {(['mist', 'moon', 'terminal'] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => onUpdateSettings({ wallpaper: w })}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all tracking-wider ${
                      settings.wallpaper === w
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {isElectron && (
            <div className="flex items-center justify-between bg-slate-900/40 p-3 border border-slate-800/80 rounded transition-colors hover:border-slate-700">
              <div>
                <div className="text-slate-200 font-bold text-sm">Fullscreen Mode</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Toggle borderless fullscreen</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ fullscreen: !settings.fullscreen })}
                className={`px-4 py-1.5 rounded font-bold text-xs transition-all tracking-wider flex items-center ${
                  settings.fullscreen ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/60 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-slate-900 text-slate-500 border border-slate-700/50'
                }`}
              >
                <Maximize size={12} className="mr-1.5 opacity-70" />
                {settings.fullscreen ? 'FULLSCREEN' : 'WINDOWED'}
              </button>
            </div>
          )}
        </div>

        {/* Audio */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 tracking-widest border-b border-slate-800 pb-1 flex items-center">
            <Volume2 size={14} className="mr-2 text-emerald-400" /> AUDIO MIXER
          </h3>
          
          <div className="bg-slate-900/40 p-3 border border-slate-800/80 rounded space-y-4 transition-colors hover:border-slate-700">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music size={14} className="text-emerald-500/70" />
                  <span className="text-slate-200 font-bold text-sm">Music Volume</span>
                </div>
                <span className="text-xs font-mono text-emerald-400/80 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="h-px w-full bg-slate-800/50" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-orange-500/70" />
                  <span className="text-slate-200 font-bold text-sm">SFX Volume</span>
                </div>
                <span className="text-xs font-mono text-orange-400/80 bg-orange-950/30 px-2 py-0.5 rounded border border-orange-900/30">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none accent-orange-500 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Accessibility & UX */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 tracking-widest border-b border-slate-800 pb-1 flex items-center">
            <ZoomIn size={14} className="mr-2 text-cyan-400" /> ACCESSIBILITY
          </h3>
          
          <div className="bg-slate-900/40 p-3 border border-slate-800/80 rounded space-y-3 transition-colors hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-bold text-sm">Interface Scale</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Size of windows & HUD</div>
              </div>
              <div className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-900/40 px-2 py-0.5 rounded">
                {Math.round(settings.uiScale * 100)}%
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-black/30 p-2 rounded border border-slate-800/50">
              <button 
                onClick={() => onUpdateSettings({ uiScale: Math.max(0.75, settings.uiScale - 0.05) })}
                className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              >
                <ZoomOut size={16} />
              </button>
              <input 
                type="range" 
                min="0.75" max="1.25" step="0.05"
                value={settings.uiScale}
                onChange={(e) => onUpdateSettings({ uiScale: parseFloat(e.target.value) })}
                className="flex-1 h-1 bg-slate-700 rounded-full appearance-none outline-none accent-cyan-500 cursor-pointer"
              />
              <button 
                onClick={() => onUpdateSettings({ uiScale: Math.min(1.25, settings.uiScale + 0.05) })}
                className="p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

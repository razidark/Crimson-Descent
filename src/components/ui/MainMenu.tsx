import React, { useState } from 'react';
import { GameState } from '../../types/game';
import { Crown } from 'lucide-react';
import { SystemSettings } from '../apps/SystemSettings';

// Particle styles are generated once at module scope so rendering stays pure.
const PARTICLES = Array.from({ length: 25 }, () => ({
  width: `${2 + Math.random() * 4}px`,
  height: `${2 + Math.random() * 4}px`,
  left: `${Math.random() * 100}%`,
  top: `${50 + Math.random() * 50}%`,
  opacity: 0.35 + Math.random() * 0.4,
  animation: `title-float ${7 + Math.random() * 8}s ease-in-out infinite`,
  animationDelay: `${Math.random() * 5}s`,
}));


interface MainMenuProps {
  state: GameState;
  actions: any;
}

const MenuButton: React.FC<{ onClick: () => void; children: React.ReactNode; primary?: boolean }> = ({ onClick, children, primary }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 rounded border text-xs font-bold tracking-[0.15em] uppercase cursor-pointer active:scale-95 transition-all duration-200 shadow-lg ${
        primary 
          ? 'border-red-500 bg-red-950/40 text-red-200 hover:bg-red-900/60 hover:border-red-400 hover:shadow-red-900/50' 
          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-600 hover:shadow-slate-800/50'
      }`}
    >
      {children}
    </button>
  );
};

export const MainMenu: React.FC<MainMenuProps> = ({ state, actions }) => {
  const [menuTab, setMenuTab] = useState<'main' | 'options'>('main');

  return (
    <div className="title-screen fixed inset-0 z-[999999] flex flex-col items-center justify-center p-6 text-slate-200 select-none overflow-hidden relative"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #150510 0%, #060309 60%, #010003 100%)' }}
    >
      {/* Ambient glow layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.11) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      {/* Animated floating particles */}
      {PARTICLES.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none animate-pulse"
          style={{
            background: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#c084fc',
            width: PARTICLES[i].width,
            height: PARTICLES[i].height,
            left: PARTICLES[i].left,
            top: PARTICLES[i].top,
            opacity: PARTICLES[i].opacity,
            animation: PARTICLES[i].animation,
            animationDelay: PARTICLES[i].animationDelay,
          }}
        />
      ))}

      {/* Centered Gothic Menu Card (Locks width and centers content) */}
      <div 
        style={{
          width: '430px',
          padding: '44px 36px',
          borderRadius: '0px',
          backgroundColor: 'rgba(7, 3, 10, 0.94)',
          border: '3px solid #7f1d1d',
          borderImage: 'linear-gradient(to bottom, #d97706, #7f1d1d, #000) 1',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.96), 0 0 40px rgba(239, 68, 68, 0.18)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* Blood Moon Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 40% 35%, #ef4444 0%, #b91c1c 40%, #7f1d1d 70%, #450a0a 100%)',
              boxShadow: '0 0 60px rgba(239,68,68,0.35), inset 0 -6px 15px rgba(0,0,0,0.6)',
            }}
          >
            <Crown size={32} className="text-red-950/40" />
          </div>
          <div className="absolute inset-0 rounded-full border border-red-500/15 scale-[1.25] animate-pulse" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-bold text-red-500 tracking-[0.25em] uppercase"
            style={{ textShadow: '0 0 30px rgba(239,68,68,0.65), 0 2px 4px rgba(0,0,0,0.9)', margin: 0 }}
          >
            CRIMSON DESCENT
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase mt-3">
            GOTHIC ACTION RPG &mdash; 3D DUNGEON CRAWLER
          </p>
        </div>

        {menuTab === 'main' ? (
          /* Main Menu Options */
          <div className="flex flex-col gap-4 w-full">
            <MenuButton onClick={actions.enterDungeon} primary>
              CONTINUE GAME
            </MenuButton>

            <MenuButton onClick={actions.newGame}>
              NEW GAME
            </MenuButton>

            <div className="flex gap-4">
              <MenuButton onClick={() => { actions.saveGame(); alert('Game Saved!'); }}>
                SAVE GAME
              </MenuButton>
              <MenuButton onClick={() => { actions.loadGame(); alert('Game Loaded!'); }}>
                LOAD GAME
              </MenuButton>
            </div>
            
            <div className="flex gap-4">
              <MenuButton onClick={actions.exportSave}>
                EXPORT SAVE
              </MenuButton>
              <MenuButton onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e: any) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                      actions.importSave(re.target?.result as string);
                      alert('Save Imported!');
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}>
                IMPORT SAVE
              </MenuButton>
            </div>

            <MenuButton onClick={() => setMenuTab('options')}>
              OPTIONS & CONTROLS
            </MenuButton>

            <MenuButton onClick={() => window.close()}>
              QUIT TO DESKTOP
            </MenuButton>
          </div>
        ) : (
          /* Options & Controls Panel */
          <div className="flex flex-col gap-5 w-full">
            <div className="w-full h-[400px]">
              <SystemSettings
                settings={state.settings}
                onUpdateSettings={actions.updateSettings as any}
              />
            </div>

            <button
              onClick={() => setMenuTab('main')}
              className="w-full mt-2 py-3 rounded border border-red-900/30 text-red-200 hover:text-white text-xs font-bold tracking-[0.15em] uppercase cursor-pointer bg-red-950/20 active:scale-95 transition-all duration-200"
            >
              BACK TO MENU
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-6 text-[8px] text-slate-600 font-mono uppercase leading-relaxed tracking-widest">
        v{__APP_VERSION__} &bull; RZL APPS
      </div>
    </div>
  );
};

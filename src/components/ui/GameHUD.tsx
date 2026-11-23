import React from 'react';
import { GameState, Enemy } from '../../types/game';
import { DungeonMinimap } from '../DungeonMinimap';
import {
  Archive,
  Droplet,
  Map as MapIcon,
  User,
  Activity,
  Flame,
  Settings,
  Swords,
  Wind,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { BarChart2Icon } from 'lucide-react';
import { BossHealthBar } from './BossHealthBar';

export type PanelType = 'character' | 'stash' | 'map' | 'altar' | 'upgrades' | 'stats' | 'boiler' | 'settings' | null;

interface GameHUDProps {
  state: GameState;
  activeEnemies: Enemy[];
  actions: any;
  activePanel: PanelType;
  togglePanel: (panel: PanelType) => void;
  renderPanel: () => React.ReactNode;
}

export const GameHUD: React.FC<GameHUDProps> = ({ state, activeEnemies, actions, activePanel, togglePanel, renderPanel }) => {
  const hpPercent = Math.max(0, Math.min(100, (state.player.currentHp / state.player.stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (state.player.currentMana / state.player.stats.maxMana) * 100));

  return (
    <>
      {/* Boss Health Bar Overlay */}
      <BossHealthBar state={state} />

      {/* OBJECTIVE & QUICK TUTORIAL PANEL (Gothic Parchment Frame) */}
      <div 
        className="absolute z-20 flex flex-col gap-3 p-4 pointer-events-auto shadow-2xl animate-fade-in"
        style={{
          top: '76px',
          left: '20px',
          width: '290px',
          backgroundColor: 'rgba(9, 6, 12, 0.95)',
          border: '2px solid #78350f',
          borderImage: 'linear-gradient(to bottom, #d97706, #7f1d1d, #1c1917) 1',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.95), inset 0 0 15px rgba(120, 53, 15, 0.2)',
          color: '#e2e8f0'
        }}
      >
        {/* Objective Tracker */}
        <div style={{ borderBottom: '1px solid rgba(217, 119, 6, 0.25)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '9px', color: '#f59e0b', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '4px' }}>
            {state.inTown ? 'Sanctuary of Lorek' : 'Current Objective'}
          </span>
          {state.inTown ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block', boxShadow: '0 0 8px #38bdf8' }} />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 'bold', color: '#bae6fd' }}>
                  Prepare for the Rupture
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: 1.4 }}>
                Speak with Raziel, Thorne, or Lysandra [E]. Head North into the Crimson Rupture.
              </span>
            </div>
          ) : activeEnemies.filter(e => e.hp > 0).length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 'bold', color: '#f87171' }}>
                Slay all monsters: {activeEnemies.filter(e => e.hp > 0).length} left
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 'bold', color: '#86efac' }}>
                Floor Cleared! Press [M] to progress.
              </span>
            </div>
          )}
        </div>

        {/* Quick Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#94a3b8' }}>
          <span style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Controls</span>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Movement:</span> <span style={{ color: '#f1f5f9' }}>WASD / Arrows</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Shadow Dash:</span> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>[SPACE]</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Interact / Talk:</span> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>[E]</span></div>
          {state.inTown ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Sanctuary:</span> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Lorek</span></div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Town Portal:</span> <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>[T]</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Cleave Slash:</span> <span style={{ color: '#f87171' }}>Left-Click</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Blood Nova:</span> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>[Q]</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Hero Vault:</span> <span style={{ color: '#cbd5e1' }}>[C]</span></div>
        </div>
      </div>

      {/* PROXIMITY INTERACTION BANNER (DIABLO STYLE) */}
      {state.nearbyInteractable && (
        <div 
          className="absolute z-30 pointer-events-none flex flex-col items-center animate-bounce"
          style={{
            bottom: '135px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(6, 3, 9, 0.96)',
            border: '2px solid #d97706',
            padding: '8px 20px',
            boxShadow: '0 0 25px rgba(217, 119, 6, 0.4), inset 0 0 10px rgba(120, 53, 15, 0.3)'
          }}>
            <span style={{
              backgroundColor: '#f59e0b',
              color: '#050207',
              fontFamily: 'var(--font-mono)',
              fontWeight: '900',
              fontSize: '13px',
              padding: '2px 8px',
              letterSpacing: '0.1em'
            }}>
              [E]
            </span>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#fef3c7',
              letterSpacing: '0.05em'
            }}>
              {state.nearbyInteractable.actionLabel}
            </span>
          </div>
        </div>
      )}

      {/* FLOATING MINI-MAP HUD */}
      {state.roomsList && state.roomsList.length > 0 && (
        <DungeonMinimap rooms={state.roomsList} playerX={state.player.x} playerY={state.player.y} />
      )}

      {/* FLOATING INTERACTIVE PANELS (Vault, Stash, Map Overlays) */}
      {renderPanel()}

      {/* DIABLO-STYLE BOTTOM ACTION BELT & HEALTH/MANA GLOBES */}
      <div 
        className="absolute z-20 flex items-center gap-6 p-4 justify-between animate-slide-in"
        style={{
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'max-content',
          minWidth: '760px',
          backgroundColor: 'rgba(7, 4, 11, 0.96)',
          border: '2px solid #78350f',
          borderImage: 'linear-gradient(to right, #78350f, #dc2626, #78350f) 1',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.98), 0 0 35px rgba(220, 38, 38, 0.15)'
        }}
      >
        {/* Left: 3D Animated Health Globe */}
        <div className="gothic-globe-container" style={{ '--globe-glow': 'rgba(239, 68, 68, 0.45)' } as any}>
          <div className="gothic-globe-glare" />
          <div className="gothic-globe-liquid" style={{ height: `${hpPercent}%` }}>
            <div className="gothic-globe-wave-1" />
            <div className="gothic-globe-wave-2" />
          </div>
          <span className="z-10 font-mono text-[13px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] leading-none text-center">
            {state.player.currentHp}<br/><span className="text-[9px] text-red-300">HP</span>
          </span>
        </div>

        {/* Center: Skill Slots & Panel Toggles */}
        <div className="flex-1 flex flex-col items-center gap-3">
          {/* Quick Spell Slots */}
          <div className="flex items-center gap-4">
            {/* Melee Cleave */}
            <div className="flex flex-col items-center">
              <button
                style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(15, 10, 20, 0.85)',
                  border: '1px solid #78350f',
                  color: '#f59e0b',
                  cursor: 'pointer'
                }}
                title="Cleave Attack: Swings your Greatsword at foes"
              >
                <Swords size={20} />
              </button>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>[CLICK]</span>
            </div>

            {/* Shadow Dash */}
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 20, 35, 0.85)',
                  border: (state.player.dashCooldownLeft || 0) <= 0 ? '1px solid #0284c7' : '1px solid #1e293b',
                  color: (state.player.dashCooldownLeft || 0) <= 0 ? '#38bdf8' : '#475569',
                  boxShadow: (state.player.dashCooldownLeft || 0) <= 0 ? '0 0 12px rgba(6, 182, 212, 0.35)' : 'none'
                }}
                title="Shadow Dash: Phase forward with spectral invulnerability"
              >
                <Wind size={20} />
                {(state.player.dashCooldownLeft || 0) > 0 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#38bdf8'
                  }}>
                    {state.player.dashCooldownLeft?.toFixed(1)}s
                  </div>
                )}
              </div>
              <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px', fontWeight: 'bold' }}>[SPACE]</span>
            </div>

            {/* Blood Nova */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => actions.castSpell?.('blood_nova')}
                disabled={state.player.currentMana < 15}
                style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: state.player.currentMana >= 15 ? 'rgba(40, 10, 15, 0.85)' : 'rgba(15, 7, 10, 0.85)',
                  border: state.player.currentMana >= 15 ? '1px solid #b91c1c' : '1px solid #27272a',
                  color: state.player.currentMana >= 15 ? '#f87171' : '#52525b',
                  cursor: state.player.currentMana >= 15 ? 'pointer' : 'not-allowed',
                  boxShadow: state.player.currentMana >= 15 ? '0 0 12px rgba(220, 38, 38, 0.3)' : 'none'
                }}
                title="Blood Nova (Cost: 15 Mana)"
              >
                <Droplet size={20} />
              </button>
              <span style={{ fontSize: '9px', color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '4px', fontWeight: 'bold' }}>KEY [Q]</span>
            </div>

            {/* Town Portal [T] or Lore Chronicles */}
            {!state.inTown ? (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => actions.castTownPortal?.()}
                  style={{
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(8, 25, 40, 0.85)',
                    border: '1px solid #06b6d4',
                    color: '#67e8f9',
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)',
                    cursor: 'pointer'
                  }}
                  title="Town Portal: Open an azure portal back to Lorek"
                >
                  <Sparkles size={20} />
                </button>
                <span style={{ fontSize: '9px', color: '#67e8f9', fontFamily: 'var(--font-mono)', marginTop: '4px', fontWeight: 'bold' }}>KEY [T]</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => actions.openLoreIntro?.()}
                  style={{
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(30, 20, 10, 0.85)',
                    border: '1px solid #d97706',
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                  title="Chronicles of Wallachia: Revisit ancient lore"
                >
                  <BookOpen size={20} />
                </button>
                <span style={{ fontSize: '9px', color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '4px', fontWeight: 'bold' }}>LORE</span>
              </div>
            )}
          </div>

          {/* Quick Toggle Panel Buttons (Vault, Stash, Map, Altar, etc.) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(120, 53, 15, 0.3)', paddingTop: '10px', width: '100%', justifyContent: 'center' }}>
            {[
              { id: 'character', label: 'Vault', icon: <User size={13} />, hotkey: 'C' },
              { id: 'stash', label: 'Stash', icon: <Archive size={13} />, hotkey: 'I' },
              { id: 'map', label: 'Map', icon: <MapIcon size={13} />, hotkey: 'M' },
              { id: 'altar', label: 'Altar', icon: <Flame size={13} />, hotkey: 'H' },
              { id: 'upgrades', label: 'Upgrades', icon: <Activity size={13} />, hotkey: 'U' },
              { id: 'stats', label: 'Stats', icon: <BarChart2Icon size={13} /> },
              { id: 'boiler', label: 'Boiler', icon: <Flame size={13} /> },
              { id: 'settings', label: 'Settings', icon: <Settings size={13} /> }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => togglePanel(btn.id as PanelType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  backgroundColor: activePanel === btn.id ? 'rgba(127, 29, 29, 0.4)' : 'rgba(15, 10, 20, 0.6)',
                  border: activePanel === btn.id ? '1px solid #ef4444' : '1px solid #27272a',
                  color: activePanel === btn.id ? '#fca5a5' : '#94a3b8',
                  transition: 'all 0.2s ease'
                }}
                title={btn.hotkey ? `Toggle ${btn.label} [${btn.hotkey}]` : `Toggle ${btn.label}`}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: 3D Animated Mana Globe */}
        <div className="gothic-globe-container" style={{ '--globe-glow': 'rgba(59, 130, 246, 0.45)' } as any}>
          <div className="gothic-globe-glare" />
          <div className="gothic-globe-liquid" style={{ height: `${manaPercent}%` }}>
            <div className="gothic-globe-wave-1 gothic-globe-wave-1-mana" />
            <div className="gothic-globe-wave-2 gothic-globe-wave-2-mana" />
          </div>
          <span className="z-10 font-mono text-[13px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] leading-none text-center">
            {state.player.currentMana}<br/><span className="text-[9px] text-blue-300">MP</span>
          </span>
        </div>
      </div>
    </>
  );
};

export default GameHUD;

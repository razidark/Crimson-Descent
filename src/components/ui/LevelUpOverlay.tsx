import React from 'react';
import { GameState, UpgradeCard } from '../../types/game';
import { Swords, Heart, Zap, Crosshair, Shield } from 'lucide-react';

interface LevelUpOverlayProps {
  state: GameState;
  onSelectCard: (card: UpgradeCard) => void;
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ state, onSelectCard }) => {
  if (!state.showCardSelection || !state.cardOptions) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'slash': return <Swords size={32} />;
      case 'health': return <Heart size={32} />;
      case 'mana': return <Zap size={32} />;
      case 'crit': return <Crosshair size={32} />;
      case 'defense': return <Shield size={32} />;
      default: return <Zap size={32} />;
    }
  };

  return (
    <div className="gothic-overlay-fullscreen">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-amber-500 tracking-[0.25em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
          LEVEL UP!
        </h2>
        <p className="text-slate-400 font-mono tracking-widest uppercase mt-3">
          Level {state.player.level} Reached &mdash; Choose a Dark Pact
        </p>
      </div>

      <div className="flex gap-8 items-center justify-center">
        {state.cardOptions.map((card, idx) => (
          <button
            key={`${card.id}-${idx}`}
            onClick={() => onSelectCard(card)}
            className="group relative flex flex-col items-center w-64 h-96 p-6 rounded-none cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-4"
            style={{
              backgroundColor: 'rgba(7, 3, 10, 0.9)',
              border: '2px solid #581c87',
              borderImage: 'linear-gradient(to bottom, #d97706, #7f1d1d, #2e1065) 1',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(239,68,68,0.1)'
            }}
          >
            {/* Card Hover Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                 style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)' }} />
            
            <div className="text-amber-500 mb-6 mt-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-110">
              {getIcon(card.icon)}
            </div>

            <h3 className="text-lg font-serif font-bold text-red-400 text-center uppercase tracking-widest mb-4">
              {card.name}
            </h3>

            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-mono text-slate-300 text-center leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest border-t border-red-900/30 pt-4 w-full text-center">
              {card.type === 'stat_boost' ? 'Passive Stats' : 'Skill Mastery'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

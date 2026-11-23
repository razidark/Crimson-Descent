import React, { useState } from 'react';
import { GameState } from '../../types/game';
import { Sparkles, Hammer, FlaskConical, BookOpen, Shield, Swords, Heart, Droplet, X } from 'lucide-react';
import { playVampireSound } from '../../hooks/useGameState';

interface TownNPCModalProps {
  state: GameState;
  npc: 'sage' | 'blacksmith' | 'witch';
  onClose: () => void;
  actions: {
    upgradeWeapon?: () => boolean;
    upgradeArmor?: () => boolean;
    buyPotion?: (type: 'health' | 'mana' | 'portal') => boolean;
  };
}

export const TownNPCModal: React.FC<TownNPCModalProps> = ({ state, npc, onClose, actions }) => {
  const sfxVol = state.settings.sfxVolume ?? 0.8;
  const [selectedTopic, setSelectedTopic] = useState(0);

  const player = state.player;
  const slashWeapon = player.weapons.find(w => w.id === 'slash');
  const weaponLevel = slashWeapon ? slashWeapon.level : 1;
  const weaponCost = weaponLevel * 60;
  const armorCost = player.level * 50;

  // 1. Sage (Elder Raziel)
  if (npc === 'sage') {
    const topics = [
      {
        title: 'The Shattered Reaver & Kain',
        body: 'When the Soul Reaver shattered, its shockwave tore open the Crimson Rupture. Lord Kain was dragged into the underworld by abyssal tendrils. I gave my soul to purify his hand once... but in the long silence of eons, madness took him. My ghost cannot descend into the miasma below. You carry my blood and the spectral flame: you must be his mercy now.'
      },
      {
        title: 'The Shards of the Blade',
        body: 'The physical Reaver was broken into sacred shards, scattered among the floor guardians of the underworld. Slay them, and the Spectral Reaver coiled around your arm will absorb their essence, evolving into its true legendary form.'
      },
      {
        title: 'The Crimson Rupture',
        body: 'North of Lorek lies the yawning wound in the earth. The deeper you descend, the more violent the shifting spectral realms become. Whenever your soul tether wavers, invoke the Azure Town Portal to return to my fire.'
      }
    ];

    return (
      <div className="gothic-modal-backdrop">
        <div className="gothic-modal-window gothic-modal-window-cyan">
          {/* Header */}
          <div className="gothic-modal-header" style={{ borderBottomColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(3, 105, 161, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookOpen size={22} color="#38bdf8" />
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 'bold', color: '#bae6fd' }}>Raziel</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  Spectral Patriarch • Mentor of the Razielim
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="gothic-modal-body">
            <blockquote style={{
              fontStyle: 'italic',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.9rem',
              color: 'rgba(186, 230, 253, 0.95)',
              borderLeft: '3px solid #38bdf8',
              padding: '10px 14px',
              background: 'rgba(3, 105, 161, 0.15)',
              margin: 0
            }}>
              "Stay awhile, and listen, my child... I was once the right hand of Kain, before he was swallowed by the Crimson Rupture. You must descend where my ghost cannot tread. You must find our fallen king... and grant him peace."
            </blockquote>

            {/* Topics Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '8px' }}>
              {topics.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playVampireSound('click', sfxVol);
                    setSelectedTopic(idx);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    background: selectedTopic === idx ? 'rgba(3, 105, 161, 0.4)' : 'transparent',
                    color: selectedTopic === idx ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    borderBottom: selectedTopic === idx ? '2px solid #38bdf8' : '2px solid transparent',
                    fontWeight: selectedTopic === idx ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {/* Topic Narrative */}
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              lineHeight: 1.6,
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '16px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              minHeight: '100px'
            }}>
              {topics[selectedTopic].body}
            </div>

            {/* Raziel's Spectral Blessing */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(90deg, rgba(3, 105, 161, 0.25) 0%, rgba(0, 0, 0, 0.3) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} color="#38bdf8" />
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem', fontWeight: 'bold', color: '#bae6fd' }}>
                    Raziel's Spectral Blessing
                  </h4>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                    Infuses your soul with ethereal energy, restoring 30 Mana
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playVampireSound('heal', sfxVol);
                  state.player.currentMana = Math.min(state.player.stats.maxMana, state.player.currentMana + 30);
                  onClose();
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(3, 105, 161, 0.6)',
                  border: '1px solid #38bdf8',
                  color: '#f0f9ff',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Receive Blessing
              </button>
            </div>
          </div>

          <div className="gothic-modal-footer" style={{ borderTopColor: 'rgba(56, 189, 248, 0.2)', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              Farewell, Raziel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Blacksmith (Thorne)
  if (npc === 'blacksmith') {
    return (
      <div className="gothic-modal-backdrop">
        <div className="gothic-modal-window gothic-modal-window-amber">
          {/* Header */}
          <div className="gothic-modal-header" style={{ borderBottomColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(180, 83, 9, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Hammer size={22} color="#f59e0b" />
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 'bold', color: '#fef3c7' }}>Thorne the Bloodsmith</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  Master of Dark Metals
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'bold', background: 'rgba(120, 53, 15, 0.5)', padding: '4px 10px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                💰 {state.gold} GOLD
              </span>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="gothic-modal-body">
            <blockquote style={{
              fontStyle: 'italic',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.9rem',
              color: 'rgba(254, 243, 199, 0.95)',
              borderLeft: '3px solid #f59e0b',
              padding: '10px 14px',
              background: 'rgba(120, 53, 15, 0.2)',
              margin: 0
            }}>
              "Bring me gold and demon bone, Vlad! I'll hone your Greatsword until the Reaper himself flinches."
            </blockquote>

            {/* Upgrade Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Weapon Sharpening */}
              <div style={{
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', background: 'rgba(120, 53, 15, 0.4)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', display: 'flex' }}>
                    <Swords size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', fontWeight: 'bold', color: '#fef3c7', margin: 0 }}>
                      Hone Bloodcleaver (Rank {weaponLevel})
                    </h4>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0' }}>
                      +4 Attack Damage · +2% Critical Strike Rate
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold' }}>
                      Current Attack: {player.stats.attack}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    actions.upgradeWeapon?.();
                  }}
                  disabled={state.gold < weaponCost}
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: state.gold >= weaponCost ? 'pointer' : 'not-allowed',
                    background: state.gold >= weaponCost ? 'linear-gradient(90deg, #b45309, #78350f)' : '#1c1917',
                    border: state.gold >= weaponCost ? '1px solid #f59e0b' : '1px solid #292524',
                    color: state.gold >= weaponCost ? '#ffffff' : '#78716c',
                    fontWeight: 'bold'
                  }}
                >
                  Forge ({weaponCost} Gold)
                </button>
              </div>

              {/* Armor Tempering */}
              <div style={{
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', background: 'rgba(120, 53, 15, 0.4)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#38bdf8', display: 'flex' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', fontWeight: 'bold', color: '#fef3c7', margin: 0 }}>
                      Temper Blood Cuirass (Rank {player.level})
                    </h4>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0' }}>
                      +3 Defense · +20 Max Health Points
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold' }}>
                      Current Def: {player.stats.defense} · Max HP: {player.stats.maxHp}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    actions.upgradeArmor?.();
                  }}
                  disabled={state.gold < armorCost}
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: state.gold >= armorCost ? 'pointer' : 'not-allowed',
                    background: state.gold >= armorCost ? 'linear-gradient(90deg, #b45309, #78350f)' : '#1c1917',
                    border: state.gold >= armorCost ? '1px solid #f59e0b' : '1px solid #292524',
                    color: state.gold >= armorCost ? '#ffffff' : '#78716c',
                    fontWeight: 'bold'
                  }}
                >
                  Temper ({armorCost} Gold)
                </button>
              </div>
            </div>
          </div>

          <div className="gothic-modal-footer" style={{ borderTopColor: 'rgba(245, 158, 11, 0.2)', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              Back to Square
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Witch / Alchemist (Lysandra)
  return (
    <div className="gothic-modal-backdrop">
      <div className="gothic-modal-window gothic-modal-window-purple">
        {/* Header */}
        <div className="gothic-modal-header" style={{ borderBottomColor: 'rgba(168, 85, 247, 0.3)', background: 'rgba(88, 28, 135, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FlaskConical size={22} color="#c084fc" />
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 'bold', color: '#f3e8ff' }}>Lysandra the Witch</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Apothecary & Occult Brewer
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'bold', background: 'rgba(88, 28, 135, 0.5)', padding: '4px 10px', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
              💰 {state.gold} GOLD
            </span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="gothic-modal-body">
          <blockquote style={{
            fontStyle: 'italic',
            fontFamily: 'var(--font-serif)',
            fontSize: '0.9rem',
            color: 'rgba(243, 232, 255, 0.95)',
            borderLeft: '3px solid #c084fc',
            padding: '10px 14px',
            background: 'rgba(88, 28, 135, 0.2)',
            margin: 0
          }}>
            "The roots of the dying earth boil in my cauldron... Need a sip of vital blood or a phial of arcane essence?"
          </blockquote>

          {/* Shop Potions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Health Potion */}
            <div style={{
              padding: '14px 18px',
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', background: 'rgba(127, 29, 29, 0.5)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex' }}>
                  <Heart size={20} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                    Blood Draught of Vitality
                  </h4>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0' }}>
                    Restores 45 Health Points immediately
                  </p>
                </div>
              </div>
              <button
                onClick={() => actions.buyPotion?.('health')}
                disabled={state.gold < 25}
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: state.gold >= 25 ? 'pointer' : 'not-allowed',
                  background: state.gold >= 25 ? 'linear-gradient(90deg, #7e22ce, #581c87)' : '#1c1917',
                  border: state.gold >= 25 ? '1px solid #c084fc' : '1px solid #292524',
                  color: state.gold >= 25 ? '#ffffff' : '#78716c',
                  fontWeight: 'bold'
                }}
              >
                Buy (25 Gold)
              </button>
            </div>

            {/* Mana Potion */}
            <div style={{
              padding: '14px 18px',
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', background: 'rgba(3, 105, 161, 0.5)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex' }}>
                  <Droplet size={20} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                    Abyssal Spirit Phial
                  </h4>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0' }}>
                    Restores 35 Mana Points for spellcasting
                  </p>
                </div>
              </div>
              <button
                onClick={() => actions.buyPotion?.('mana')}
                disabled={state.gold < 20}
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: state.gold >= 20 ? 'pointer' : 'not-allowed',
                  background: state.gold >= 20 ? 'linear-gradient(90deg, #7e22ce, #581c87)' : '#1c1917',
                  border: state.gold >= 20 ? '1px solid #c084fc' : '1px solid #292524',
                  color: state.gold >= 20 ? '#ffffff' : '#78716c',
                  fontWeight: 'bold'
                }}
              >
                Buy (20 Gold)
              </button>
            </div>
          </div>
        </div>

        <div className="gothic-modal-footer" style={{ borderTopColor: 'rgba(168, 85, 247, 0.2)', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#cbd5e1',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}
          >
            Leave Apothecary
          </button>
        </div>
      </div>
    </div>
  );
};

export default TownNPCModal;

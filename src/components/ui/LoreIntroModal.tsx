import React, { useState } from 'react';
import { BookOpen, Skull, Flame, Shield, ArrowRight, X } from 'lucide-react';
import { playVampireSound } from '../../hooks/useGameState';

interface LoreIntroModalProps {
  onClose: () => void;
  sfxVolume?: number;
}

const CHAPTERS = [
  {
    icon: <Skull size={32} className="text-red-500 animate-pulse" />,
    tag: 'Chapter I',
    title: 'The Shattered Reaver',
    quote: '"I was the right hand of your redemption, Kain, and the scythe of your vengeance. For eons my soul slumbered within the steel... until it broke."',
    content: [
      'In the final reckoning against the Elder God, Raziel willingly surrendered his soul to the Reaver, purifying Kain of his corruption and leaving Nosgoth with a fragile sliver of hope.',
      'Yet time is a cruel wheel. An apocalyptic subterranean tremor tore through the foundations of the world, shattering the physical Soul Reaver into sacred fragments.',
      'The blade’s destruction ruptured the ancient seal. Violently expelled from the metal, Raziel’s soul was thrust back into material existence—while Kain was pulled into the abyssal depths below.'
    ]
  },
  {
    icon: <Flame size={32} className="text-cyan-400" />,
    tag: 'Chapter II',
    title: 'The Spectral Flame',
    quote: '"Neither living nor dead, I wander the ruins once more. And across the dark, I feel his pulse."',
    content: [
      'Awakening with his ethereal blue cowl and burning wraith eyes, Raziel discovers the Spectral Reaver coiled around his right arm—a ghost of the blade that hungers for the souls of the corrupted.',
      'Though stripped of his physical vessel, his phantom sinew pulses with ancient power. Each abomination he slays surrenders its raw Vitae to sustain his fragile hold on the mortal plane.',
      'Deep beneath the earth, a faint heartbeat echoes through the stone. Kain still lives, bound in the lowest circle of the underworld.'
    ]
  },
  {
    icon: <Shield size={32} className="text-amber-400" />,
    tag: 'Chapter III',
    title: 'The Hamlet of Lorek',
    quote: '"Before the descent into damnation, there remains one final sanctuary."',
    content: [
      'At the threshold of the abyss stands Lorek — a lonely hamlet where outcasts, scholars, and artisans gather around the campfire.',
      'Consult Raziel, the spectral wraith standing vigilant by the fire, to uncover the fate of the Reaver shards and the abyss below. Visit Thorne the Bloodsmith to temper your armaments, and seek out Lysandra the Witch for restorative draughts.',
      'Summon the Azure Town Portal whenever your soul tether flickers. The Catacombs await: descend through the darkness, reclaim the shards of the blade, and find Kain!'
    ]
  }
];

export const LoreIntroModal: React.FC<LoreIntroModalProps> = ({ onClose, sfxVolume = 0.8 }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const chapter = CHAPTERS[currentChapter];

  const handleNext = () => {
    if (currentChapter < CHAPTERS.length - 1) {
      playVampireSound('click', sfxVolume);
      setCurrentChapter(prev => prev + 1);
    } else {
      playVampireSound('levelUp', sfxVolume);
      onClose();
    }
  };

  const handleSkip = () => {
    playVampireSound('click', sfxVolume);
    onClose();
  };

  return (
    <div className="gothic-modal-backdrop">
      {/* Gothic Parchment Window */}
      <div className="gothic-modal-window" style={{ width: '700px' }}>
        {/* Top Header Bar */}
        <div className="gothic-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={20} color="#f59e0b" />
            <span style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.15em', color: '#fbbf24', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Chronicles of Wallachia · {chapter.tag}
            </span>
          </div>
          <button
            onClick={handleSkip}
            style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
          >
            <span>Skip</span>
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="gothic-modal-body">
          {/* Chapter Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(127, 29, 29, 0.3)', paddingBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(127, 29, 29, 0.25)', border: '1px solid rgba(185, 28, 28, 0.4)' }}>
              {chapter.icon}
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Gothic Prologue
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                {chapter.title}
              </h2>
            </div>
          </div>

          {/* Flavor Quote */}
          <blockquote style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: '#fde68a', fontSize: '14px', borderLeft: '3px solid #d97706', padding: '8px 16px', background: 'rgba(217, 119, 6, 0.08)', margin: 0 }}>
            {chapter.quote}
          </blockquote>

          {/* Narrative Paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'var(--font-serif)', fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1' }}>
            {chapter.content.map((p, idx) => (
              <p key={idx} style={{ margin: 0 }}>
                {p}
              </p>
            ))}
          </div>

          {/* Chapter Step Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', paddingTop: '10px' }}>
            {CHAPTERS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  playVampireSound('click', sfxVolume);
                  setCurrentChapter(i);
                }}
                style={{
                  height: '6px',
                  width: currentChapter === i ? '32px' : '10px',
                  backgroundColor: currentChapter === i ? '#ef4444' : '#334155',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="gothic-modal-footer">
          <button
            onClick={handleSkip}
            style={{ color: '#94a3b8', background: 'transparent', border: 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Skip to Town
          </button>

          <button
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 24px',
              background: 'linear-gradient(90deg, #991b1b 0%, #7f1d1d 100%)',
              border: '1px solid #ef4444',
              color: '#ffffff',
              fontFamily: 'var(--font-serif)',
              fontSize: '13px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.35)'
            }}
          >
            <span>{currentChapter < CHAPTERS.length - 1 ? 'Next Chapter' : 'Enter the Hamlet of Lorek'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default LoreIntroModal;

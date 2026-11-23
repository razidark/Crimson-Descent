import React, { useState } from 'react';
import { Relic, Hero, Stats, Rarity } from '../../types/game';
import { Trash2, Shield, Sword, Heart, Compass, Activity, Sparkles, UserPlus, Flame } from 'lucide-react';
import { RelicIcon } from '../RelicIcon';

interface CryptInventoryProps {
  inventory: Relic[];
  heroes: Hero[];
  onEquipRelic: (heroId: string, itemId: string) => void;
  onRecycleRelic: (itemId: string) => void;
  onFuseRelics: (itemIds: string[]) => void;
  gold: number;
}

export const CryptInventory: React.FC<CryptInventoryProps> = ({
  inventory,
  heroes,
  onEquipRelic,
  onRecycleRelic,
  onFuseRelics,
  gold,
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'fusion'>('vault');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [equipHeroId, setEquipHeroId] = useState<string>(heroes[0]?.id || '');
  
  // Fusion slot state (holds up to 3 relic IDs)
  const [fusionSlots, setFusionSlots] = useState<string[]>([]);

  const selectedItem = inventory.find(i => i.id === selectedItemId);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#94a3b8'; // Slate
      case 'magic': return '#3b82f6';  // Blue
      case 'rare': return '#fbbf24';   // Gold/Yellow
      case 'epic': return '#c084fc';   // Purple
      case 'legendary': return '#ef4444'; // Crimson
      case 'cosmic': return '#f43f5e';  // Rose-white
      default: return '#cbd5e1';
    }
  };

  const getRarityGlow = (rarity: string, isSelected: boolean) => {
    const baseColor = getRarityColor(rarity);
    const border = isSelected ? `2px solid ${baseColor}` : `1px solid rgba(255,255,255,0.12)`;
    let shadow = 'none';

    if (isSelected) {
      shadow = `0 0 14px ${baseColor}c0, inset 0 0 8px ${baseColor}40`;
    } else {
      // Passive glow based on rarity
      if (rarity === 'magic') shadow = '0 0 6px rgba(59, 130, 246, 0.2)';
      if (rarity === 'rare') shadow = '0 0 8px rgba(245, 158, 11, 0.25)';
      if (rarity === 'epic') shadow = '0 0 10px rgba(168, 85, 247, 0.35)';
      if (rarity === 'legendary') shadow = '0 0 12px rgba(239, 68, 68, 0.45)';
      if (rarity === 'cosmic') shadow = '0 0 14px rgba(244, 63, 94, 0.55)';
    }

    return { border, boxShadow: shadow };
  };

  const getFusionCost = (rarity: Rarity) => {
    const costMap = { common: 50, magic: 100, rare: 150, epic: 400, legendary: 1200, cosmic: 0 };
    return costMap[rarity] || 0;
  };

  const formatStatVal = (key: string, val: number) => {
    return key === 'speed' 
      ? `+${Math.round(val * 100)}%` 
      : key === 'skillCooldown' 
      ? `-${Math.round(val * 100)}%` 
      : `+${val}`;
  };

  const formatStat = (key: string, val: number, equippedItem?: Relic) => {
    const icons: { [k: string]: React.ReactNode } = {
      maxHp: <Heart size={10} className="text-red-500 inline" />,
      attack: <Sword size={10} className="text-amber-500 inline" />,
      defense: <Shield size={10} className="text-blue-500 inline" />,
      speed: <Compass size={10} className="text-emerald-500 inline" />,
      magnetRange: <Activity size={10} className="text-purple-500 inline" />,
      regen: <Sparkles size={10} className="text-pink-500 inline" />
    };
    
    const labels: { [k: string]: string } = {
      maxHp: 'Max HP',
      attack: 'Attack',
      defense: 'Defense',
      speed: 'Move Speed',
      magnetRange: 'Vacuum Range',
      regen: 'Regen Rate'
    };

    const equippedVal = equippedItem?.stats[key as keyof Stats] || 0;
    const diff = (val || 0) - (equippedVal || 0);
    const diffText = diff > 0 ? ` (+${Math.round(diff * 100) / 100})` : diff < 0 ? ` (${Math.round(diff * 100) / 100})` : '';
    const diffClass = diff > 0 ? 'text-green-400 font-bold' : diff < 0 ? 'text-red-400 font-bold' : 'text-slate-500';

    return (
      <div key={key} className="flex justify-between items-center text-[10px] font-mono text-slate-300 py-1 border-b border-slate-950/20">
        <span className="flex items-center gap-1.5">
          {icons[key]} <span className="text-slate-400">{labels[key] || key}</span>
        </span>
        <span className="font-bold flex items-center gap-1.5">
          <span>{formatStatVal(key, val)}</span>
          {equippedItem && diff !== 0 && (
            <span className={`text-[8px] ${diffClass}`}>{diffText}</span>
          )}
        </span>
      </div>
    );
  };

  // Dynamic Dark-Fantasy Lore Generator
  const getItemLore = (relic: Relic) => {
    if (relic.type === 'weapon') {
      if (relic.rarity === 'legendary' || relic.rarity === 'cosmic') {
        return '"An ancient blade whispered to have tasted the blood of Dracula himself. It hums with dark power."';
      }
      if (relic.rarity === 'epic' || relic.rarity === 'rare') {
        return '"Forged in the obsidian fires of the Castle Boiler, tempered in fresh vitae."';
      }
      return '"A sturdy steel weapon, scarred by battle but still sharp."';
    }
    if (relic.type === 'armor') {
      if (relic.rarity === 'legendary' || relic.rarity === 'cosmic') {
        return '"Woven from tattered shadow silk. It dampens the sound of your heartbeat, making you invisible in the dark."';
      }
      if (relic.rarity === 'epic' || relic.rarity === 'rare') {
        return '"Heavy steel pauldrons blessed by the coven\'s blood-priestesses."';
      }
      return '"A solid iron breastplate, scarred by skeletal claws."';
    }
    // Accessory
    if (relic.rarity === 'legendary' || relic.rarity === 'cosmic') {
      return '"A cursed amulet containing a single, pulsing drop of pure ancient vampire Vitae."';
    }
    if (relic.rarity === 'epic' || relic.rarity === 'rare') {
      return '"A ruby signet ring recovered from the library vault, humming with arcane mana."';
    }
    return '"A simple copper band, cold to the touch and worn by time."';
  };

  const handleEquip = () => {
    if (!selectedItemId || !equipHeroId) return;
    onEquipRelic(equipHeroId, selectedItemId);
    setSelectedItemId(null);
  };

  const handleRecycle = () => {
    if (!selectedItemId) return;
    onRecycleRelic(selectedItemId);
    setSelectedItemId(null);
  };

  const handleFusionSlotClick = (itemId: string) => {
    if (fusionSlots.includes(itemId)) {
      setFusionSlots(prev => prev.filter(id => id !== itemId));
    } else {
      if (fusionSlots.length >= 3) return;
      const targetItem = inventory.find(i => i.id === itemId);
      if (!targetItem || targetItem.rarity === 'cosmic') return;
      
      if (fusionSlots.length > 0) {
        const firstSlotted = inventory.find(i => i.id === fusionSlots[0]);
        if (firstSlotted && firstSlotted.rarity !== targetItem.rarity) {
          return; // Rarity mismatch
        }
      }
      setFusionSlots(prev => [...prev, itemId]);
    }
  };

  const executeFusion = () => {
    if (fusionSlots.length !== 3) return;
    const firstSlotted = inventory.find(i => i.id === fusionSlots[0]);
    if (!firstSlotted) return;
    const cost = getFusionCost(firstSlotted.rarity);
    if (gold < cost) return;

    onFuseRelics(fusionSlots);
    setFusionSlots([]);
  };

  const slots = Array.from({ length: 48 }, (_, idx) => inventory[idx] || null);

  const selectedHero = heroes.find(h => h.id === equipHeroId);
  const equippedItem = selectedItem && selectedHero ? selectedHero.equipment[selectedItem.type] : undefined;

  const firstSlotted = fusionSlots.length > 0 ? inventory.find(i => i.id === fusionSlots[0]) : null;
  const fusionCost = firstSlotted ? getFusionCost(firstSlotted.rarity) : 0;
  const canFuse = fusionSlots.length === 3 && gold >= fusionCost;

  return (
    <div className="flex-1 flex flex-col text-slate-200 overflow-hidden min-h-[380px]">
      {/* Tab Menu Header */}
      <div className="flex border-b border-red-950/35 pb-2.5 mb-3.5 gap-2">
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-4 py-2 text-[10px] font-mono rounded-none border transition-all cursor-pointer select-none font-bold uppercase tracking-wider ${
            activeTab === 'vault'
              ? 'border-red-500 bg-red-950/20 text-red-400'
              : 'border-slate-800/40 text-slate-400 hover:border-slate-700 bg-slate-950/20'
          }`}
        >
          Coffin Vault
        </button>
        <button
          onClick={() => setActiveTab('fusion')}
          className={`px-4 py-2 text-[10px] font-mono rounded-none border transition-all cursor-pointer select-none flex items-center gap-1.5 font-bold uppercase tracking-wider ${
            activeTab === 'fusion'
              ? 'border-purple-500 bg-purple-950/20 text-purple-400'
              : 'border-slate-800/40 text-slate-400 hover:border-slate-700 bg-slate-950/20'
          }`}
        >
          <Flame size={12} className="text-purple-400" />
          Fusion Altar
        </button>
      </div>

      {activeTab === 'vault' ? (
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Grid inventory */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coffin Storage</span>
              <span className="text-[9px] font-mono text-slate-500">Occupied: {inventory.length} / 48 Slots</span>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2.5 p-3 bg-black/55 rounded-none border border-red-950/20 max-h-[310px]">
              {slots.map((item, idx) => {
                if (!item) {
                  return (
                    <div key={`empty-${idx}`} className="gothic-stone-socket" />
                  );
                }
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(10, 5, 15, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease-in-out',
                      cursor: 'pointer',
                      ...getRarityGlow(item.rarity, isSelected)
                    }}
                    className={isSelected ? '' : 'hover:scale-105'}
                  >
                    <RelicIcon iconIndex={item.iconIndex} size={28} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Inspect Panel */}
          <div className="w-80 border-l border-red-950/40 pl-4 flex flex-col justify-between overflow-y-auto max-h-[340px]">
            {selectedItem ? (
              <div className="flex-1 flex flex-col gap-3 justify-between">
                
                {/* Gothic Tooltip Card */}
                <div 
                  style={{
                    backgroundColor: 'rgba(7, 4, 11, 0.95)',
                    border: '1px solid rgba(217, 119, 6, 0.28)', // Gold/Bronze trim
                    boxShadow: '0 8px 24px rgba(0,0,0,0.9), inset 0 0 15px rgba(239,68,68,0.05)',
                    borderRadius: '0px',
                    padding: '16px'
                  }}
                  className="space-y-3.5"
                >
                  {/* Title Header */}
                  <div className="flex items-center gap-3">
                    <span 
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        border: `1px solid ${getRarityColor(selectedItem.rarity)}`,
                        boxShadow: `0 0 10px ${getRarityColor(selectedItem.rarity)}30`
                      }}
                      className="shrink-0"
                    >
                      <RelicIcon iconIndex={selectedItem.iconIndex} size={30} />
                    </span>
                    <div>
                      <h3 
                        style={{
                          color: getRarityColor(selectedItem.rarity),
                          textShadow: `0 0 10px ${getRarityColor(selectedItem.rarity)}50`,
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--font-serif)',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {selectedItem.name}
                      </h3>
                      <span className="text-[8px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400 mt-1.5 inline-block tracking-wider">
                        {selectedItem.rarity} {selectedItem.type}
                      </span>
                    </div>
                  </div>

                  {/* Equipped comparison banner */}
                  {equippedItem && (
                    <div className="text-[9px] font-mono text-slate-500 bg-black/45 border border-slate-900/60 p-1.5 rounded-none flex justify-between items-center">
                      <span>Equipped: <span style={{ color: getRarityColor(equippedItem.rarity) }}>{equippedItem.name}</span></span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="bg-black/40 p-3 rounded-none border border-slate-950 space-y-1">
                    <div className="text-[8px] text-slate-500 uppercase font-mono border-b border-red-950/20 pb-1 mb-1.5 flex justify-between tracking-wider">
                      <span>Relic Stats</span>
                      {equippedItem && <span className="text-green-500 text-[7px] lowercase font-bold">(comparing)</span>}
                    </div>
                    {Object.entries(selectedItem.stats).map(([k, v]) => formatStat(k, v || 0, equippedItem))}
                  </div>

                  {/* Lore / Flavor Text */}
                  <div className="text-[9px] italic font-serif text-slate-500 text-center border-t border-red-950/25 pt-2.5 leading-relaxed">
                    {getItemLore(selectedItem)}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-red-950/20">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={equipHeroId}
                      onChange={(e) => setEquipHeroId(e.target.value)}
                      className="flex-1 bg-black/90 border border-red-950/50 rounded-none px-2 py-1.5 text-slate-300 text-[10px] font-mono outline-none cursor-pointer"
                    >
                      {heroes.map(h => (
                        <option key={h.id} value={h.id}>{h.name} (Lvl {h.level})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleEquip}
                      className="bg-purple-900/20 border border-purple-800 hover:bg-purple-600 hover:text-white px-4 py-1.5 text-[10px] rounded-none font-mono text-purple-400 font-bold tracking-wide transition flex items-center gap-1 cursor-pointer select-none"
                    >
                      <UserPlus size={10} />
                      Equip
                    </button>
                  </div>

                  <button
                    onClick={handleRecycle}
                    className="w-full bg-red-950/10 border border-red-900/40 hover:bg-red-600 hover:text-white text-red-450 py-2 rounded-none text-[10px] font-mono transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                  >
                    <Trash2 size={12} />
                    Recycle relic (Gain +{selectedItem.value} Gold)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs py-10">
                <span className="text-3xl mb-2 filter grayscale opacity-40">💍</span>
                <p className="font-serif italic text-slate-600">Select a relic from the coffin storage to inspect attributes, compare stats, or salvage it for gold.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FUSION ALTAR CONTENT */
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
          {/* Slotted Items Area */}
          <div className="flex-1 flex flex-col justify-between bg-black/45 rounded-none border border-purple-950/20 p-3.5 max-h-[320px]">
            <div>
              <h3 className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Flame size={12} className="text-purple-400" /> Transmutation Circle
              </h3>
              <p className="text-[9px] text-slate-450 leading-relaxed mb-3">
                Slot three relics of the **exact same rarity** from your storage. Transmutes them into a single random relic of the **next tier** (e.g. Common ➔ Magic).
              </p>

              {/* 3 Fusion circles */}
              <div className="flex justify-center items-center gap-5 my-4">
                {[0, 1, 2].map((slotIdx) => {
                  const itemId = fusionSlots[slotIdx];
                  const item = itemId ? inventory.find(i => i.id === itemId) : null;
                  return (
                    <button
                      key={slotIdx}
                      onClick={() => item && handleFusionSlotClick(item.id)}
                      className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center relative cursor-pointer transition ${
                        item 
                          ? `hover:scale-95` 
                          : 'border-dashed border-purple-950/40 bg-purple-950/5 hover:border-purple-800'
                      }`}
                      style={item ? getRarityGlow(item.rarity, false) : {}}
                    >
                      {item ? (
                        <>
                          <RelicIcon iconIndex={item.iconIndex} size={24} />
                          <span 
                            style={{ color: getRarityColor(item.rarity), borderColor: getRarityColor(item.rarity) }}
                            className="absolute -bottom-1 -right-1 text-[7px] bg-slate-950 border px-1.5 rounded-none font-mono uppercase font-bold"
                          >
                            {item.rarity.substring(0, 3)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] text-purple-900/60 font-mono">Slot {slotIdx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fusion trigger box */}
            <div className="border-t border-purple-950/30 pt-3">
              {firstSlotted && (
                <div className="flex justify-between items-center text-[10px] font-mono mb-2">
                  <span className="text-slate-400">Target Tier: <span className="font-semibold uppercase" style={{ color: getRarityColor(firstSlotted.rarity) }}>{firstSlotted.rarity}</span></span>
                  <span className="text-slate-450">Fee: <span className={`${gold >= fusionCost ? 'text-yellow-500 font-bold' : 'text-red-500 font-bold'}`}>{fusionCost} / {gold} Gold</span></span>
                </div>
              )}

              <button
                onClick={executeFusion}
                disabled={!canFuse}
                className={`w-full py-2 text-xs font-mono rounded-none font-bold uppercase transition flex items-center justify-center gap-1.5 select-none ${
                  canFuse
                    ? 'bg-purple-950 border border-purple-500 text-purple-200 hover:bg-purple-800 hover:text-white cursor-pointer active:scale-95'
                    : 'bg-slate-950/40 border border-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Flame size={14} className="text-purple-400" />
                Forge Transmutation Relic
              </button>
            </div>
          </div>

          {/* Relic select panel */}
          <div className="w-80 border-l border-purple-950/40 pl-4 flex flex-col overflow-hidden max-h-[320px]">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Slot storage items:</h4>
            <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 p-2 bg-black/45 rounded-none border border-purple-950/20">
              {inventory.map((item) => {
                const isSlotted = fusionSlots.includes(item.id);
                const isCosmic = item.rarity === 'cosmic';
                const isMatch = firstSlotted ? firstSlotted.rarity === item.rarity : true;
                const isDisabled = isCosmic || (!isMatch && !isSlotted);

                return (
                  <button
                    key={item.id}
                    onClick={() => !isDisabled && handleFusionSlotClick(item.id)}
                    disabled={isDisabled}
                    style={!isDisabled ? getRarityGlow(item.rarity, isSlotted) : {}}
                    className={`aspect-square rounded border transition flex flex-col items-center justify-center relative ${
                      isSlotted 
                        ? 'opacity-45 scale-95' 
                        : isDisabled 
                        ? 'opacity-25 border-slate-950 bg-slate-950/20 cursor-not-allowed scale-100' 
                        : 'hover:scale-105 cursor-pointer'
                    }`}
                    title={item.name}
                  >
                    <RelicIcon iconIndex={item.iconIndex} size={24} />
                  </button>
                );
              })}
              {inventory.length === 0 && (
                <div className="col-span-4 text-center text-slate-600 text-[10px] font-mono py-10">
                  Empty inventory
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CryptInventory;

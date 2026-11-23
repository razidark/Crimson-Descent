import React, { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { BattleArena } from './components/BattleArena';
import { CoffinVault } from './components/apps/CoffinVault';
import { CryptInventory } from './components/apps/CryptInventory';
import { BloodAltar } from './components/apps/BloodAltar';
import { CastleBoiler } from './components/apps/CastleBoiler';
import { SystemSettings } from './components/apps/SystemSettings';
import { CovenStats } from './components/apps/CovenStats';
import { CryptTree } from './components/apps/CryptTree';
import { WorldMap } from './components/apps/WorldMap';
import { GameHUD, PanelType } from './components/ui/GameHUD';
import { MainMenu } from './components/ui/MainMenu';
import { LevelUpOverlay } from './components/ui/LevelUpOverlay';
import { VictoryOverlay } from './components/ui/VictoryOverlay';
import { LoreIntroModal } from './components/ui/LoreIntroModal';
import { TownNPCModal } from './components/ui/TownNPCModal';
import { 
  Skull,
  Coins,
  Droplet,
  Key,
  Bomb,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const { state, floatingTexts, activeEnemies, bloodOrbs, actions } = useGameState();
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Update window title dynamically based on game version
  useEffect(() => {
    document.title = `Crimson Descent - v${__APP_VERSION__}`;
  }, []);

  // Bind keyboard hotkeys for toggling panels
  useEffect(() => {
    if (state.showTitleScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === 'c') {
        setActivePanel(prev => prev === 'character' ? null : 'character');
      } else if (key === 'i') {
        setActivePanel(prev => prev === 'stash' ? null : 'stash');
      } else if (key === 'b') {
        actions.dropBomb?.();
      } else if (key === 'm') {
        setActivePanel(prev => prev === 'map' ? null : 'map');
      } else if (key === 'h') {
        setActivePanel(prev => prev === 'altar' ? null : 'altar');
      } else if (key === 'u') {
        setActivePanel(prev => prev === 'upgrades' ? null : 'upgrades');
      } else if (key === 'q') {
        actions.castSpell?.('blood_nova');
      } else if (key === 't') {
        actions.castTownPortal?.();
      } else if (key === 'escape') {
        if (state.activeNPC) {
          actions.onCloseNPC?.();
        } else if (state.showLoreIntro) {
          actions.closeLoreIntro?.();
        } else {
          setActivePanel(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.showTitleScreen]);

  // Sync fullscreen state with Electron
  useEffect(() => {
    if ((window as any).electronAPI?.isElectron) {
      (window as any).electronAPI.setFullscreen(state.settings.fullscreen);
    }
  }, [state.settings.fullscreen]);

  const togglePanel = (panel: PanelType) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const renderPanel = () => {
    if (!activePanel) return null;

    let title = '';
    let content = null;
    let widthClass = 'w-96';

    if (activePanel === 'character') {
      title = 'COFFIN VAULT';
      content = <CoffinVault player={state.player} onUnequipRelic={actions.unequipRelic} />;
      widthClass = 'w-[450px]';
    } else if (activePanel === 'stash') {
      title = 'CRYPT INVENTORY';
      content = (
        <CryptInventory
          inventory={state.inventory}
          heroes={[state.player] as any}
          onEquipRelic={(_heroId, itemId) => {
            const relic = state.inventory.find(r => r.id === itemId);
            if (relic) actions.equipRelic(relic);
          }}
          onRecycleRelic={actions.recycleRelic}
          onFuseRelics={actions.fuseRelics}
          gold={state.gold}
        />
      );
      widthClass = 'w-[530px]';
    } else if (activePanel === 'map') {
      title = 'DUNGEON PATHWAYS';
      content = <WorldMap activeZone={state.activeZone} onTravelToZone={actions.travelToZone} />;
      widthClass = 'w-[540px]';
    } else if (activePanel === 'altar') {
      title = 'BLOOD ALTAR';
      content = (
        <BloodAltar
          blood={state.blood}
          bloodUpgrades={state.bloodUpgrades ?? { maxHp: 0, lifesteal: 0, cdr: 0, xpMult: 0 }}
          onBuyUpgrade={actions.buyBloodUpgrade}
        />
      );
      widthClass = 'w-96';
    } else if (activePanel === 'upgrades') {
      title = 'DISCIPLINE TREE';
      content = (
        <CryptTree
          cryptCoins={state.cryptCoins || 0}
          accountUpgrades={state.accountUpgrades || {}}
          onBuyUpgrade={actions.buyAccountUpgrade}
        />
      );
      widthClass = 'w-[440px]';
    } else if (activePanel === 'stats') {
      title = 'COVEN ARCHIVES';
      content = (
        <CovenStats
          heroes={[state.player] as any}
          runStats={state.runStats}
          lifetimeStats={state.lifetimeStats}
          activeZone={state.activeZone}
          wave={1}
          achievements={state.achievements || []}
        />
      );
      widthClass = 'w-96';
    } else if (activePanel === 'boiler') {
      title = 'SYSTEM CONTROL';
      content = (
        <CastleBoiler
          overclockLevel={0}
          onSetOverclock={actions.setOverclockLevel}
          gold={state.gold}
          silicon={0}
        />
      );
      widthClass = 'w-96';
    } else if (activePanel === 'settings') {
      title = 'SYSTEM SETTINGS';
      content = (
        <SystemSettings
          settings={state.settings}
          onUpdateSettings={actions.updateSettings}
        />
      );
      widthClass = 'w-80';
    }

    return (
      <div 
        className={`absolute z-30 ${widthClass} flex flex-col overflow-hidden text-slate-200 animate-slide-in gothic-window-panel`}
        style={{
          top: '64px',
          left: '16px',
          bottom: '80px',
          transform: `scale(${state.settings.uiScale})`,
          transformOrigin: 'top left'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-950/40 bg-black/40">
          <span className="font-serif text-[11px] font-bold text-red-400 tracking-wider uppercase">{title}</span>
          <button 
            onClick={() => setActivePanel(null)}
            className="p-1 hover:bg-red-950/30 rounded text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {content}
        </div>
      </div>
    );
  };

  // Render Gothic Title Screen / Main Menu
  if (state.showTitleScreen) {
    return <MainMenu state={state} actions={actions} />;
  }



  return (
    <div className={`game-client-container w-full h-full relative overflow-hidden select-none wallpaper-${state.settings.wallpaper}`}>
      {/* Visual Scanline Effect overlay */}
      {state.settings.scanlines && (
        <div className="scanline z-50 pointer-events-none" />
      )}
      <div className="desktop-grid-overlay z-40 pointer-events-none" />

      {/* 1. FULL-SCREEN BATTLE ARENA */}
      <BattleArena
        state={state}
        activeEnemies={activeEnemies}
        bloodOrbs={bloodOrbs}
        floatingTexts={floatingTexts}
        actions={actions as any}
      />

      {/* 2. FLOATING STATUS HEADER (Top Bar - Scaled Up) */}
      <header 
        className="absolute z-20 flex items-center justify-between pointer-events-none animate-slide-in"
        style={{ top: '20px', left: '20px', right: '20px' }}
      >
        {/* Floor Indicator */}
        <div className="flex items-center gap-3 bg-black/90 border border-red-950/60 p-3.5 shadow-2xl pointer-events-auto rounded-none">
          <div className="w-9 h-9 rounded-none bg-red-950/20 border border-red-500/20 flex items-center justify-center">
            <Skull size={16} className="text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider leading-none mb-1">
              {state.inTown ? 'SANCTUARY' : 'Dungeon Level'}
            </div>
            <div className="font-serif text-[12px] font-bold text-slate-200 tracking-wide">
              {state.inTown 
                ? 'THE HAMLET OF LOREK' 
                : `FLOOR ${state.activeZone + 1}: ${['Castle Gates', 'Forgotten Crypts', 'Haunted Library', 'Blood Altar', "Dracula's Throne"][state.activeZone]}`}
            </div>
          </div>
        </div>

        {/* Gold & Blood Currencies */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/90 border border-amber-950/60 px-4 py-2 shadow-2xl font-mono text-[12px]">
            <Coins size={13} className="text-amber-400" />
            <span className="text-amber-300 font-bold tabular-nums">{state.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/90 border border-red-950/60 px-4 py-2 shadow-2xl font-mono text-[12px]">
            <Droplet size={13} className="text-red-500" />
            <span className="text-red-300 font-bold tabular-nums">{state.blood.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/90 border border-slate-800 px-4 py-2 shadow-2xl font-mono text-[12px]">
            <Key size={13} className="text-amber-500" />
            <span className="text-slate-300 font-bold tabular-nums">{state.keys || 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/90 border border-slate-800 px-4 py-2 shadow-2xl font-mono text-[12px]">
            <Bomb size={13} className="text-slate-400" />
            <span className="text-slate-300 font-bold tabular-nums">{state.bombs || 0}</span>
          </div>
        </div>
      </header>

      <GameHUD 
        state={state} 
        activeEnemies={activeEnemies} 
        actions={actions} 
        activePanel={activePanel}
        togglePanel={togglePanel}
        renderPanel={renderPanel}
      />

      <LevelUpOverlay 
        state={state} 
        onSelectCard={(card) => {
          actions.selectUpgradeCard?.(card);
        }}
      />

      <VictoryOverlay 
        state={state} 
        onClaimVictory={() => {
          actions.claimVictory?.();
        }}
      />

      {/* Cinematic Lore Prologue (Diablo Style) */}
      {state.showLoreIntro && (
        <LoreIntroModal
          onClose={() => actions.closeLoreIntro?.()}
          sfxVolume={state.settings.sfxVolume}
        />
      )}

      {/* Town NPC Interactive Dialogue & Services Modal */}
      {state.activeNPC && (
        <TownNPCModal
          state={state}
          npc={state.activeNPC}
          onClose={() => actions.onCloseNPC?.()}
          actions={{
            upgradeWeapon: () => {
              const slash = state.player.weapons.find(w => w.id === 'slash');
              if (slash) actions.upgradeWeaponBlacksmith?.(slash.id);
              return true;
            },
            upgradeArmor: () => {
              actions.upgradeArmorBlacksmith?.();
              return true;
            },
            buyPotion: (type: 'health' | 'mana' | 'portal') => {
              if (type === 'health' || type === 'mana') {
                actions.buyPotionWitch?.(type);
              } else if (type === 'portal') {
                actions.castTownPortal?.();
              }
              return true;
            }
          }}
        />
      )}
    </div>
  );
};




export default App;

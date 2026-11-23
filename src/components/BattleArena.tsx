import React, { useEffect, useRef } from 'react';
import { GameState, Enemy, BloodOrb, FloatingText } from '../types/game';
import { GothicCanvasEngine } from '../engine/GothicCanvasEngine';

interface BattleArenaProps {
  state: GameState;
  activeEnemies: Enemy[];
  bloodOrbs: BloodOrb[];
  floatingTexts: FloatingText[];
  actions: {
    dealClickDamage: (enemyId: string) => void;
    pickUpItem: (itemId: string) => void;
    onPlayerMove?: (x: number, y: number, direct?: boolean) => void;
    dropBomb?: () => void;
    useKeyOnDoor?: (tx: number, tz: number) => void;
    enterPortal?: () => void;
    onOpenNPC?: (npc: 'sage' | 'blacksmith' | 'witch') => void;
    enterCatacombs?: () => void;
    castTownPortal?: () => void;
    useTownPortal?: () => void;
  };
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  state,
  activeEnemies,
  bloodOrbs,
  floatingTexts,
  actions
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GothicCanvasEngine | null>(null);

  // Initialize GothicCanvasEngine on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GothicCanvasEngine(canvasRef.current, {
      onEnemyClick: (enemyId) => {
        actions.dealClickDamage(enemyId);
      },
      onItemPick: (itemId) => {
        actions.pickUpItem(itemId);
      },
      onPlayerMove: (x, y, direct) => {
        actions.onPlayerMove?.(x, y, direct);
      },
      onDropBomb: () => {
        actions.dropBomb?.();
      },
      onUseKeyOnDoor: (tx, tz) => {
        actions.useKeyOnDoor?.(tx, tz);
      },
      onEnterPortal: () => {
        actions.enterPortal?.();
      },
      onOpenNPC: (npc) => {
        actions.onOpenNPC?.(npc);
      },
      onEnterCatacombs: () => {
        actions.enterCatacombs?.();
      },
      onCastTownPortal: () => {
        actions.castTownPortal?.();
      },
      onUseTownPortal: () => {
        actions.useTownPortal?.();
      }
    });

    engine.updateData(state, activeEnemies, bloodOrbs, floatingTexts);
    engine.updateGraphicsQuality(state.settings.graphicsQuality);
    engine.start();
    engineRef.current = engine;

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  // Update DarknessEngine when React state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateData(state, activeEnemies, bloodOrbs, floatingTexts);
      engineRef.current.updateGraphicsQuality(state.settings.graphicsQuality);
    }
  }, [state, activeEnemies, bloodOrbs, floatingTexts]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
export default BattleArena;

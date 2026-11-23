import React from 'react';
import { Shield, Coins, Box, Sparkles, Lock, Trophy, Star } from 'lucide-react';

import { ACCOUNT_UPGRADES } from './accountUpgrades';
import type { UpgradeNode } from './accountUpgrades';

export type { UpgradeNode };
export { ACCOUNT_UPGRADES };

interface CryptTreeProps {
  cryptCoins: number;
  accountUpgrades: { [nodeId: string]: boolean };
  onBuyUpgrade: (nodeId: string) => void;
}

export const CryptTree: React.FC<CryptTreeProps> = ({
  cryptCoins,
  accountUpgrades,
  onBuyUpgrade
}) => {
  const branches = [
    { key: 'foundation', name: 'Blood Foundation', desc: 'Direct combat stats and resilience boosts.' },
    { key: 'inventory', name: 'Casket Storage', desc: 'Stash capacities and item slots.' },
    { key: 'xp', name: 'Vitae Absorption', desc: 'Enhancements to experience rates.' },
    { key: 'economy', name: 'Gilded Coffins', desc: 'Increased gold yields from defeated foes.' },
    { key: 'loot', name: 'Dracula\'s Loot', desc: 'Item drop frequencies and quality.' }
  ] as const;

  const getBranchIcon = (branch: string) => {
    switch (branch) {
      case 'foundation': return <Shield size={13} className="text-red-500" />;
      case 'inventory': return <Box size={13} className="text-amber-500" />;
      case 'xp': return <Sparkles size={13} className="text-purple-500" />;
      case 'economy': return <Coins size={13} className="text-yellow-500" />;
      case 'loot': return <Trophy size={13} className="text-orange-500" />;
      default: return <Star size={13} />;
    }
  };

  return (
    <div className="flex flex-col h-full text-slate-200 overflow-hidden min-h-[380px] p-1">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-yellow-900/35 pb-2 mb-3 shrink-0 bg-yellow-950/10 p-2 rounded border border-yellow-900/10">
        <div>
          <h2 className="text-xs font-mono text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-yellow-500" /> Crypt Upgrades
          </h2>
          <p className="text-[8px] text-slate-400 font-mono mt-0.5">
            Spend Crypt Coins from bosses to unlock permanent account-wide bonuses.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-800/40 px-2.5 py-1 rounded font-mono">
          <Coins size={12} className="text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">{cryptCoins}</span>
          <span className="text-[8px] text-yellow-500 font-bold tracking-tight uppercase leading-none border-l border-yellow-800/40 pl-2">
            Coins
          </span>
        </div>
      </div>

      {/* Upgrades Container */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        {branches.map(br => {
          const nodes = ACCOUNT_UPGRADES.filter(n => n.branch === br.key);
          return (
            <div key={br.key} className="bg-slate-950/35 border border-slate-900 p-2.5 rounded flex flex-col gap-2.5">
              {/* Branch Header */}
              <div className="flex items-center gap-2 border-b border-slate-900 pb-1.5">
                <span className="p-1 rounded bg-black/40 border border-slate-900">
                  {getBranchIcon(br.key)}
                </span>
                <div>
                  <h3 className="text-[10px] font-bold text-slate-200 uppercase tracking-wide leading-none">{br.name}</h3>
                  <p className="text-[8px] text-slate-500 font-mono mt-0.5">{br.desc}</p>
                </div>
              </div>

              {/* Branch Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {nodes.map(node => {
                  const isUnlocked = accountUpgrades[node.id] || false;
                  const hasPrereq = !node.prereq || (accountUpgrades[node.prereq] || false);
                  const canAfford = cryptCoins >= node.cost;
                  const isBuyable = !isUnlocked && hasPrereq && canAfford;

                  return (
                    <button
                      key={node.id}
                      disabled={isUnlocked || !hasPrereq || !canAfford}
                      onClick={() => onBuyUpgrade(node.id)}
                      className={`text-left p-2 rounded border flex flex-col justify-between gap-1 transition-all duration-300 relative select-none min-h-[58px] ${
                        isUnlocked
                          ? 'bg-yellow-950/15 border-yellow-600/70 text-yellow-100 shadow-[0_0_6px_rgba(202,138,4,0.15)]'
                          : isBuyable
                          ? 'bg-slate-900/80 border-slate-700 hover:border-yellow-700/60 hover:bg-yellow-950/10 cursor-pointer active:scale-98'
                          : 'bg-slate-950/70 border-slate-950/60 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {/* Node Header */}
                      <div className="flex justify-between items-center w-full leading-none">
                        <span className={`font-serif text-[9px] font-bold tracking-wide ${isUnlocked ? 'text-yellow-400' : 'text-slate-300'}`}>
                          {node.name}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[7px] text-yellow-400 font-mono font-bold">● ACTIVE</span>
                        ) : (
                          <span className="text-[8px] text-yellow-500 font-mono font-bold flex items-center gap-0.5">
                            <Coins size={8} /> {node.cost}
                          </span>
                        )}
                      </div>

                      {/* Node Desc */}
                      <p className="text-[7px] text-slate-400 leading-normal font-mono">{node.desc}</p>

                      {/* Locked Overlay text if prereq missing */}
                      {!isUnlocked && !hasPrereq && (
                        <span className="text-[6px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-1">
                          <Lock size={7} /> Requires Prerequisite
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

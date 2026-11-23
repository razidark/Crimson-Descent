import React, { useState, useEffect } from 'react';
import { Skull, Crown, Star, Flame, Sparkles } from 'lucide-react';

interface Room {
  rx: number;
  rz: number;
  type: 'start' | 'normal' | 'treasure' | 'shop' | 'boss' | 'secret';
}

interface DungeonMinimapProps {
  rooms: Room[];
  playerX: number;
  playerY: number;
}

export const DungeonMinimap: React.FC<DungeonMinimapProps> = ({ rooms, playerX, playerY }) => {
  const [visitedRooms, setVisitedRooms] = useState<Set<string>>(new Set());

  // Calculate current room coordinates based on dungeonGenerator.ts tile math
  // Tile Size = 30. Rooms are spaced 9 tiles apart.
  const tileX = Math.floor(playerX / 30);
  const tileZ = Math.floor(playerY / 30);
  
  // Constrain bounds to prevent negative or out of bounds when on edges
  const currentRx = Math.max(0, Math.min(3, Math.floor(tileX / 9)));
  const currentRz = Math.max(0, Math.min(3, Math.floor(tileZ / 9)));

  const currentRoomKey = `${currentRx},${currentRz}`;

  // Update visited rooms when player enters a new room
  useEffect(() => {
    setVisitedRooms(prev => {
      if (!prev.has(currentRoomKey)) {
        const next = new Set(prev);
        next.add(currentRoomKey);
        
        // Also reveal adjacent rooms (but not their contents if not visited, unless we want full map)
        // In typical Isaac style, adjacent rooms are shown as empty squares until visited.
        // For simplicity, we just mark adjacent as "seen" but maybe we need a "visited" vs "seen" state.
        
        return next;
      }
      return prev;
    });
  }, [currentRoomKey]);

  // To do adjacent revealing, let's keep track of 'seen' rooms
  const [seenRooms, setSeenRooms] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSeenRooms(prev => {
      const next = new Set(prev);
      next.add(`${currentRx},${currentRz}`);
      next.add(`${currentRx + 1},${currentRz}`);
      next.add(`${currentRx - 1},${currentRz}`);
      next.add(`${currentRx},${currentRz + 1}`);
      next.add(`${currentRx},${currentRz - 1}`);
      return next;
    });
  }, [currentRoomKey]);

  // Create a 4x4 grid representation
  const grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null as Room | null));
  rooms.forEach(room => {
    if (room.rx >= 0 && room.rx < 4 && room.rz >= 0 && room.rz < 4) {
      grid[room.rz][room.rx] = room;
    }
  });

  const getRoomIcon = (type: Room['type']) => {
    switch (type) {
      case 'boss': return <Skull size={14} className="text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]" />;
      case 'treasure': return <Crown size={14} className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />;
      case 'shop': return <Star size={14} className="text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]" />;
      case 'secret': return <Sparkles size={14} className="text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.8)]" />;
      case 'start': return <Flame size={14} className="text-orange-400 opacity-60" />;
      default: return null;
    }
  };

  return (
    <div className="absolute top-6 right-6 z-40 p-3 rounded-lg border border-red-950/40 bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md pointer-events-none select-none animate-slide-in">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-red-900/30">
        <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Floor Map</span>
      </div>
      
      <div className="flex flex-col gap-1">
        {grid.map((row, z) => (
          <div key={`row-${z}`} className="flex gap-1">
            {row.map((room, x) => {
              const isCurrent = x === currentRx && z === currentRz;
              const isVisited = visitedRooms.has(`${x},${z}`);
              const isSeen = seenRooms.has(`${x},${z}`);
              
              if (!room) {
                // Empty space in grid
                return <div key={`cell-${x}-${z}`} className="w-8 h-8 opacity-0" />;
              }

              // Hide room if not seen, UNLESS it's a secret room (which stays hidden until entered)
              if (!isSeen && room.type !== 'start') {
                return <div key={`cell-${x}-${z}`} className="w-8 h-8 opacity-0" />;
              }
              
              if (room.type === 'secret' && !isVisited) {
                 return <div key={`cell-${x}-${z}`} className="w-8 h-8 opacity-0" />;
              }

              let bgClass = 'bg-slate-900 border-slate-800';
              if (isCurrent) {
                bgClass = 'bg-slate-800 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] scale-110 z-10';
              } else if (isVisited) {
                bgClass = 'bg-slate-900/80 border-slate-700';
              } else if (isSeen) {
                bgClass = 'bg-black border-slate-900/50 opacity-50'; // Greyed out, not yet entered
              }

              return (
                <div 
                  key={`cell-${x}-${z}`} 
                  className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all duration-300 ${bgClass}`}
                >
                  {isVisited || isCurrent ? getRoomIcon(room.type) : null}
                  
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-sm border-2 border-red-500/50 animate-ping opacity-50" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

import { Enemy, GroundItem, Relic } from '../types/game';

interface Room {
  rx: number;
  rz: number;
  type: 'start' | 'normal' | 'treasure' | 'shop' | 'boss' | 'secret';
}

export interface DungeonLayout {
  grid: number[][];
  enemies: Enemy[];
  groundItems: GroundItem[];
  roomsList: Room[];
  activeChest: import('../types/game').Chest | null;
  startX: number;
  startY: number;
}

export function generateDungeonLayout(
  floor: number,
  createRelic: (level: number) => Relic
): DungeonLayout {
  const mapWidth = 40;
  const mapHeight = 40;
  let activeChest: import('../types/game').Chest | null = null;
  
  // 1. Generate 4x4 room slots layout
  let rooms: Room[] = [];
  while (rooms.length < 6) {
    rooms = [{ rx: 1, rz: 1, type: 'start' }];
    const queue = [{ rx: 1, rz: 1 }];
    while (queue.length > 0 && rooms.length < 9) {
      const curr = queue.shift()!;
      const dirs = [
        { dx: 0, dz: -1 }, // North
        { dx: 0, dz: 1 },  // South
        { dx: -1, dz: 0 }, // East
        { dx: 1, dz: 0 }   // West
      ].sort(() => Math.random() - 0.5);
      
      for (const d of dirs) {
        const nx = curr.rx + d.dx;
        const nz = curr.rz + d.dz;
        if (nx >= 0 && nx < 4 && nz >= 0 && nz < 4) {
          if (!rooms.some(r => r.rx === nx && r.rz === nz)) {
            rooms.push({ rx: nx, rz: nz, type: 'normal' });
            queue.push({ rx: nx, rz: nz });
          }
        }
      }
    }
  }

  // Assign Boss Room (furthest from start room 1,1)
  const nonStartRooms = rooms.filter(r => !(r.rx === 1 && r.rz === 1));
  nonStartRooms.sort((a, b) => {
    const distA = Math.abs(a.rx - 1) + Math.abs(a.rz - 1);
    const distB = Math.abs(b.rx - 1) + Math.abs(b.rz - 1);
    return distB - distA; // Descending
  });
  
  if (nonStartRooms.length > 0) {
    nonStartRooms[0].type = 'boss';
  }

  // Assign Treasure Room (dead end or furthest remaining)
  const remainingRooms = nonStartRooms.slice(1);
  if (remainingRooms.length > 0) {
    remainingRooms[0].type = 'treasure';
  }

  // Assign Shop Room
  if (remainingRooms.length > 1) {
    remainingRooms[1].type = 'shop';
  }

  // Add one Secret Room next to normal rooms but walled off
  let secretRoomAdded = false;
  for (let z = 0; z < 4 && !secretRoomAdded; z++) {
    for (let x = 0; x < 4; x++) {
      if (!rooms.some(r => r.rx === x && r.rz === z)) {
        // Count adjacent occupied rooms
        let adjCount = 0;
        if (x > 0 && rooms.some(r => r.rx === x - 1 && r.rz === z)) adjCount++;
        if (x < 3 && rooms.some(r => r.rx === x + 1 && r.rz === z)) adjCount++;
        if (z > 0 && rooms.some(r => r.rx === x && r.rz === z - 1)) adjCount++;
        if (z < 3 && rooms.some(r => r.rx === x && r.rz === z + 1)) adjCount++;

        if (adjCount >= 1) {
          rooms.push({ rx: x, rz: z, type: 'secret' });
          secretRoomAdded = true;
          break;
        }
      }
    }
  }

  // 2. Map rooms to 40x40 tile grid
  // 1 = wall, 0 = floor
  const grid = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(1));

  const getTileCoords = (rx: number, rz: number) => {
    const startX = 2 + rx * 9;
    const endX = startX + 6;
    const startZ = 2 + rz * 9;
    const endZ = startZ + 6;
    return { startX, endX, startZ, endZ };
  };

  rooms.forEach(room => {
    const { startX, endX, startZ, endZ } = getTileCoords(room.rx, room.rz);
    for (let z = startZ; z <= endZ; z++) {
      for (let x = startX; x <= endX; x++) {
        grid[z][x] = 0; // Clear room floor
      }
    }

    // Put a central pillar in normal rooms sometimes
    if (room.type === 'normal' && Math.random() < 0.4) {
      const cx = startX + 3;
      const cz = startZ + 3;
      grid[cz][cx] = 2; // Pillar
    }
  });

  // 3. Connect doors (dig doorways in grid)
  const normalDoorways: { x1: number, z1: number, x2: number, z2: number }[] = [];

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const r1 = rooms[i];
      const r2 = rooms[j];

      // Secret rooms don't get normal doors mapped
      if (r1.type === 'secret' || r2.type === 'secret') continue;

      const dx = Math.abs(r1.rx - r2.rx);
      const dy = Math.abs(r1.rz - r2.rz);

      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        normalDoorways.push({ x1: r1.rx, z1: r1.rz, x2: r2.rx, z2: r2.rz });
      }
    }
  }

  // Dig doorways and place locks
  // Tile key:
  // 0 = floor
  // 3 = Gold Locked Door (Treasure Room)
  // 4 = Blue Locked Door (Shop Room)
  // 5 = Skull Locked Door (Boss Room)
  // 6 = Secret Wall (Secret Room)
  normalDoorways.forEach(door => {
    const r1 = rooms.find(r => r.rx === door.x1 && r.rz === door.z1)!;
    const r2 = rooms.find(r => r.rx === door.x2 && r.rz === door.z2)!;
    
    const coords1 = getTileCoords(r1.rx, r1.rz);
    const coords2 = getTileCoords(r2.rx, r2.rz);

    let doorType = 0; // Default open doorway
    if (r1.type === 'treasure' || r2.type === 'treasure') doorType = 3;
    else if (r1.type === 'shop' || r2.type === 'shop') doorType = 4;
    else if (r1.type === 'boss' || r2.type === 'boss') doorType = 5;

    if (r1.rx !== r2.rx) {
      // Horizontal door
      const leftCoords = r1.rx < r2.rx ? coords1 : coords2;
      
      const wallX = leftCoords.endX + 1;
      const zVal1 = leftCoords.startZ + 2;
      const zVal2 = leftCoords.startZ + 3;

      grid[zVal1][wallX] = doorType;
      grid[zVal2][wallX] = doorType;
      
      // Clear the doorway tiles leading up to it
      grid[zVal1][wallX - 1] = 0;
      grid[zVal2][wallX - 1] = 0;
      grid[zVal1][wallX + 1] = 0;
      grid[zVal2][wallX + 1] = 0;
    } else {
      // Vertical door
      const topCoords = r1.rz < r2.rz ? coords1 : coords2;
      
      const wallZ = topCoords.endZ + 1;
      const xVal1 = topCoords.startX + 2;
      const xVal2 = topCoords.startX + 3;

      grid[wallZ][xVal1] = doorType;
      grid[wallZ][xVal2] = doorType;

      grid[wallZ - 1][xVal1] = 0;
      grid[wallZ - 1][xVal2] = 0;
      grid[wallZ + 1][xVal1] = 0;
      grid[wallZ + 1][xVal2] = 0;
    }
  });

  // Dig secret walls (type 6) between secret room and any adjacent room
  const secretRoom = rooms.find(r => r.type === 'secret');
  if (secretRoom) {
    const sCoords = getTileCoords(secretRoom.rx, secretRoom.rz);
    // Find adjacent room
    const adj = rooms.find(r => r.type !== 'secret' && (Math.abs(r.rx - secretRoom.rx) + Math.abs(r.rz - secretRoom.rz) === 1));
    if (adj) {
      const aCoords = getTileCoords(adj.rx, adj.rz);
      if (secretRoom.rx !== adj.rx) {
        const leftCoords = secretRoom.rx < adj.rx ? sCoords : aCoords;
        const wallX = leftCoords.endX + 1;
        const zVal1 = leftCoords.startZ + 2;
        const zVal2 = leftCoords.startZ + 3;
        grid[zVal1][wallX] = 6; // Secret Wall!
        grid[zVal2][wallX] = 6;
      } else {
        const topCoords = secretRoom.rz < adj.rz ? sCoords : aCoords;
        const wallZ = topCoords.endZ + 1;
        const xVal1 = topCoords.startX + 2;
        const xVal2 = topCoords.startX + 3;
        grid[wallZ][xVal1] = 6; // Secret Wall!
        grid[wallZ][xVal2] = 6;
      }
    }
  }

  // 4. Spawn Enemies
  const enemies: Enemy[] = [];
  rooms.forEach(room => {
    const { startX, startZ } = getTileCoords(room.rx, room.rz);
    const roomCenterX = (startX + 3) * 30;
    const roomCenterZ = (startZ + 3) * 30;

    if (room.type === 'normal') {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let e = 0; e < count; e++) {
        const type = ['bat', 'skeleton', 'zombie', 'ghost'][Math.floor(Math.random() * 4)] as Enemy['type'];
        const maxHp = 20 + floor * 15;
        enemies.push({
          id: `enemy-${Date.now()}-${Math.random()}`,
          name: type.toUpperCase(),
          type,
          hp: maxHp,
          maxHp,
          attack: 8 + floor * 4,
          defense: 1 + floor * 2,
          speed: 0.02 + Math.random() * 0.012,
          xpValue: 15 + floor * 10,
          goldValue: 10 + floor * 8,
          state: 'idle',
          x: roomCenterX + (Math.random() - 0.5) * 60,
          y: roomCenterZ + (Math.random() - 0.5) * 60
        });
      }
    } else if (room.type === 'boss') {
      // Spawn Boss!
      const bossHp = 100 + floor * 120;
      enemies.push({
        id: 'boss-reaper',
        name: 'VAMPIRE LORD',
        type: 'reaper',
        hp: bossHp,
        maxHp: bossHp,
        attack: 16 + floor * 6,
        defense: 4 + floor * 3,
        speed: 0.024,
        xpValue: 100 + floor * 50,
        goldValue: 150 + floor * 100,
        state: 'idle',
        x: roomCenterX,
        y: roomCenterZ
      });
    }
  });

  // 5. Spawn Pedestals and GroundItems
  const groundItems: GroundItem[] = [];
  rooms.forEach(room => {
    const { startX, startZ } = getTileCoords(room.rx, room.rz);
    const roomCenterX = (startX + 3) * 30;
    const roomCenterZ = (startZ + 3) * 30;

    if (room.type === 'treasure') {
      activeChest = {
        id: `chest-${Date.now()}`,
        type: 'gothic',
        x: roomCenterX,
        y: roomCenterZ,
        isOpen: false
      };
    } else if (room.type === 'shop') {
      // 3 Pedestals in Shop: HP Refill, Key/Bomb, and random Relic
      // Pedestal 1: HP Refill (custom relic wrapper)
      const hpRelic: Relic = {
        id: 'shop-hp',
        name: 'Elixir of Life (Full HP)',
        type: 'accessory',
        rarity: 'magic',
        stats: { hp: 100 },
        value: 15,
        icon: 'orb'
      };
      groundItems.push({
        id: `pedestal-shop-hp-${Date.now()}`,
        itemCategory: 'relic',
        relic: hpRelic,
        x: roomCenterX - 45,
        y: roomCenterZ,
        beamAnimation: 1.0,
        price: 25,
        isPedestal: true
      });

      // Pedestal 2: Key (price 15) or Bomb (price 15)
      const keyRelic: Relic = {
        id: 'shop-key',
        name: 'Gothic Chest Key',
        type: 'accessory',
        rarity: 'magic',
        stats: {},
        value: 15,
        icon: 'key'
      };
      groundItems.push({
        id: `pedestal-shop-key-${Date.now()}`,
        itemCategory: 'relic',
        relic: keyRelic,
        x: roomCenterX,
        y: roomCenterZ,
        beamAnimation: 1.0,
        price: 15,
        isPedestal: true
      });

      // Pedestal 3: Relic (price 50)
      const shopRelic = createRelic(floor + 1);
      groundItems.push({
        id: `pedestal-shop-relic-${Date.now()}`,
        itemCategory: 'relic',
        relic: shopRelic,
        x: roomCenterX + 45,
        y: roomCenterZ,
        beamAnimation: 1.0,
        price: 45,
        isPedestal: true
      });
    }
  });

  // Vlad Spawns in Start Room (1, 1) center
  const startRoomCoords = getTileCoords(1, 1);
  const startX = (startRoomCoords.startX + 3) * 30;
  const startY = (startRoomCoords.startZ + 3) * 30;

  return {
    grid,
    enemies,
    groundItems,
    roomsList: rooms,
    activeChest,
    startX,
    startY
  };
}

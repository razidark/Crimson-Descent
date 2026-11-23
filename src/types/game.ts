export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number; // Movement speed
  critRate: number; // 0.0 to 1.0
  skillCooldown: number; // multiplier
  regen: number; // HP regen per tick
  manaRegen: number; // Mana regen per tick
}

export type RelicType = 'weapon' | 'armor' | 'accessory';
export type ItemType = RelicType;
export type Rarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary' | 'cosmic';

export interface Relic {
  id: string;
  name: string;
  type: RelicType;
  rarity: Rarity;
  stats: Partial<Stats>;
  value: number; // Recycle value in gold
  icon: string;
  iconIndex?: number;
}

// Dropped Item on the floor
export interface GroundItem {
  id: string;
  itemCategory: 'relic' | 'consumable' | 'material';
  relic?: Relic;
  consumable?: { type: 'health_potion' | 'mana_potion'; amount: number };
  material?: { type: 'bones' | 'iron_ore' | 'gold_ingot' | 'arcane_scroll'; count: number };
  x: number;
  y: number;
  beamAnimation: number; // For rendering the vertical light beam (relics)
  price?: number;
  isPedestal?: boolean;
}

export interface Chest {
  id: string;
  type: 'wooden' | 'iron' | 'gothic' | 'cosmic';
  x: number;
  y: number;
  isOpen: boolean;
}

export interface WeaponInstance {
  id: string; // 'slash' | 'blood_nova' | 'mana_bolt' | 'shadow_dash'
  name: string;
  level: number;
  baseDamage: number;
  cooldown: number; // in ms
  lastFired: number; // timestamp
  description: string;
  icon: string;
}

export interface Hero {
  id: string;
  name: string;
  class: 'duke' | 'countess' | 'nightstalker' | 'brujah';
  level: number;
  xp: number;
  maxXp: number;
  currentHp: number;
  currentMana: number;
  stats: Stats;
  baseStats: Stats;
  weapons: WeaponInstance[];
  equipment: {
    weapon?: Relic;
    armor?: Relic;
    accessory?: Relic;
  };
  state: 'idle' | 'moving' | 'attacking' | 'hurt' | 'dead';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  shield?: number;
  ultimateName?: string;
  ultimateIcon?: string;
  ultimateDesc?: string;
  ultimateCooldownLeft?: number;
  ultimateCooldownMax?: number;
  isInvulnerable?: boolean;
  dashCooldownLeft?: number;
  dashCooldownMax?: number;
}

export interface Enemy {
  id: string;
  name: string;
  type: 'bat' | 'skeleton' | 'zombie' | 'ghost' | 'reaper';
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  xpValue: number;
  goldValue: number;
  state: 'idle' | 'chasing' | 'attacking' | 'hurt' | 'dead';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  vx?: number;
  vy?: number;
  knockbackResist?: number;
}

export interface BloodOrb {
  id: string;
  x: number;
  y: number;
  xpValue: number;
  speed: number; // Pull speed
}

export interface FloatingText {
  id: string;
  text: string;
  type: 'damage' | 'crit' | 'heal' | 'xp' | 'shield' | 'mana';
  x: number;
  y: number;
  createdAt: number;
  life?: number;
}

export interface WindowState {
  isOpen: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Zone {
  level: number;
  name: string;
  recommendedLvl: number;
  bossName: string;
}

export interface UpgradeCard {
  id: string;
  type: 'weapon_upgrade' | 'weapon_unlock' | 'stat_boost';
  targetId: string;
  name: string;
  description: string;
  icon: string;
}

export interface BloodUpgrades {
  maxHp: number;
  lifesteal: number;
  cdr: number;
  xpMult: number;
}

export interface RunStats {
  runTime: number; // in seconds
  damageDealt: { [heroId: string]: number };
  kills: { [enemyType: string]: number };
  goldEarned: number;
  bloodEarned: number;
}

export interface LifetimeStats {
  kills: number;
  gold: number;
  blood: number;
  maxFloorReached: number;
  maxWaveReached: { [zoneLvl: number]: number };
}

export interface GameSettings {
  scanlines: boolean;
  fullscreen: boolean;
  uiScale: number;
  musicVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
  graphicsQuality: 'low' | 'med' | 'high';
  wallpaper: 'mist' | 'moon' | 'terminal';
}

export interface GameState {
  gold: number;
  blood: number; // Vitae
  cryptCoins: number;
  keys: number;
  bombs: number;
  activeBoss?: { name: string; hp: number; maxHp: number } | null;
  grid?: number[][];
  bombsList?: { id: string; x: number; y: number; timer: number }[];
  roomsList?: any[];
  accountUpgrades?: { [nodeId: string]: boolean };
  player: Hero;
  inventory: Relic[];
  groundItems: GroundItem[];
  activeZone: number; // Dungeon Floor (0 to 4)
  currentWave: number;
  activeApps: string[];
  windowStates: { [appKey: string]: WindowState };
  terminalLogs: string[];
  showCardSelection: boolean;
  cardOptions: UpgradeCard[];
  activeNotification: string | null;
  activeFlyout: 'vault' | 'console' | 'upgrade' | 'settings' | 'stats' | 'altar' | 'crypt_tree' | 'map' | null;
  bloodUpgrades?: BloodUpgrades;
  runStats?: RunStats;
  lifetimeStats?: LifetimeStats;
  achievements?: string[];
  activeChest?: Chest | null;
  zoom: number;
  isLocked: boolean;
  alwaysOnTop: boolean;
  lastSavedTime?: number;
  showTitleScreen?: boolean;
  settings: GameSettings;
  bossCinematic?: { name: string; timer: number };
  floatingTexts?: FloatingText[];
  hitStopUntil?: number;
  inTown: boolean;
  showLoreIntro?: boolean;
  activeNPC?: 'sage' | 'blacksmith' | 'witch' | null;
  townPortal?: {
    active: boolean;
    returnFloor: number;
    returnX: number;
    returnY: number;
    portalInTown?: boolean;
  } | null;
  nearbyInteractable?: {
    id: string;
    type: 'sage' | 'blacksmith' | 'witch' | 'catacombs' | 'fountain' | 'town_portal';
    name: string;
    actionLabel: string;
  } | null;
  showVictoryScreen?: boolean;
}

declare global {
  const __APP_VERSION__: string;
}

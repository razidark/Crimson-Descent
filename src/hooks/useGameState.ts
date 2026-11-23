import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Hero, Enemy, Relic, FloatingText, Stats, Rarity, BloodOrb, RelicType, BloodUpgrades } from '../types/game';
import { generateDungeonLayout } from './dungeonGenerator';

// Professional multi-layered procedural Web Audio synthesizer
let sharedAudioCtx: AudioContext | null = null;
let noiseBufferCache: AudioBuffer | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
};

const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (noiseBufferCache && noiseBufferCache.sampleRate === ctx.sampleRate) {
    return noiseBufferCache;
  }
  const bufferSize = ctx.sampleRate * 1.0; // 1 second of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBufferCache = buffer;
  return buffer;
};

export type SoundEffectType = 'hit' | 'heal' | 'drop' | 'levelUp' | 'click' | 'boss' | 'whip' | 'vacuum' | 'dash' | 'break';

export const playVampireSound = (type: SoundEffectType, volume: number) => {
  if (volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0, volume)), now);
  masterGain.connect(ctx.destination);

  try {
    if (type === 'hit') {
      // Layer 1: Sub-bass visceral thud (sine dive)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.16);
      subGain.gain.setValueAtTime(0.24, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.16);

      // Layer 2: Weapon metallic slash & crunch (filtered noise)
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = getNoiseBuffer(ctx);
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(650, now);
      bandpass.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      bandpass.Q.setValueAtTime(3.2, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.12);

      // Layer 3: Steel clash ring
      const metalOsc = ctx.createOscillator();
      const metalGain = ctx.createGain();
      metalOsc.type = 'triangle';
      metalOsc.frequency.setValueAtTime(420, now);
      metalOsc.frequency.exponentialRampToValueAtTime(210, now + 0.08);
      metalGain.gain.setValueAtTime(0.08, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      metalOsc.connect(metalGain);
      metalGain.connect(masterGain);
      metalOsc.start(now);
      metalOsc.stop(now + 0.08);

    } else if (type === 'whip') {
      // Swift Greatsword Cleave: Swept razor-air resonance
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(2600, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.2);
      filter.Q.setValueAtTime(4.5, now);
      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.01, now);
      whooshGain.gain.linearRampToValueAtTime(0.28, now + 0.06);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      noiseSource.connect(filter);
      filter.connect(whooshGain);
      whooshGain.connect(masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.2);

      // Low blade mass undertone
      const massOsc = ctx.createOscillator();
      const massGain = ctx.createGain();
      massOsc.type = 'sine';
      massOsc.frequency.setValueAtTime(180, now);
      massOsc.frequency.exponentialRampToValueAtTime(55, now + 0.18);
      massGain.gain.setValueAtTime(0.12, now);
      massGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      massOsc.connect(massGain);
      massGain.connect(masterGain);
      massOsc.start(now);
      massOsc.stop(now + 0.18);

    } else if (type === 'dash') {
      // Supernatural Shadow Mist Dash: Low resonant whoosh + phase drop
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.26);
      filter.Q.setValueAtTime(5.0, now);
      const dashGain = ctx.createGain();
      dashGain.gain.setValueAtTime(0.3, now);
      dashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      noiseSource.connect(filter);
      filter.connect(dashGain);
      dashGain.connect(masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.26);

      // Ghostly low phase dive
      const diveOsc = ctx.createOscillator();
      const diveGain = ctx.createGain();
      diveOsc.type = 'sine';
      diveOsc.frequency.setValueAtTime(190, now);
      diveOsc.frequency.exponentialRampToValueAtTime(38, now + 0.24);
      diveGain.gain.setValueAtTime(0.18, now);
      diveGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      diveOsc.connect(diveGain);
      diveGain.connect(masterGain);
      diveOsc.start(now);
      diveOsc.stop(now + 0.24);

    } else if (type === 'break') {
      // Shattering pottery urn / wooden crate
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(240, now + 0.22);
      filter.Q.setValueAtTime(2.0, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.22);

      // Ceramic crack crunch tones
      [280, 460].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.35, now + 0.12);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
      });

    } else if (type === 'heal') {
      // Luminous crimson restorative chime chord
      const freqs = [329.63, 440.0, 554.37, 659.25]; // E4, A4, C#5, E5
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const startTime = now + i * 0.04;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);
        g.gain.setValueAtTime(0.001, startTime);
        g.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });

    } else if (type === 'drop') {
      // Rare relic drop: Crystalline dual harmonic chime
      [1174.66, 1760.0].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
      });

    } else if (type === 'levelUp') {
      // Regal gothic fanfare progression
      const chords = [
        [220.0, 329.63, 440.0],       // A minor triad
        [261.63, 392.0, 523.25],       // C major triad
        [329.63, 493.88, 659.25],      // E minor triad
        [440.0, 554.37, 880.0]         // A major triumph peak
      ];
      chords.forEach((chord, step) => {
        const stepTime = now + step * 0.11;
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, stepTime);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2200, stepTime);
          g.gain.setValueAtTime(0.001, stepTime);
          g.gain.linearRampToValueAtTime(0.07, stepTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.4);
          osc.connect(filter);
          filter.connect(g);
          g.connect(masterGain);
          osc.start(stepTime);
          osc.stop(stepTime + 0.42);
        });
      });

    } else if (type === 'click') {
      // Crisp mechanical UI click
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.035);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.035);

    } else if (type === 'vacuum') {
      // Blood vacuum suction swirl
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.11);
      g.gain.setValueAtTime(0.04, now);
      g.gain.linearRampToValueAtTime(0.001, now + 0.11);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.11);

    } else if (type === 'boss') {
      // Apocalyptic low doom brass
      [55.0, 56.5].forEach((freq) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 0.65, now + 0.8);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);
        filter.frequency.linearRampToValueAtTime(120, now + 0.8);
        g.gain.setValueAtTime(0.18, now);
        g.gain.linearRampToValueAtTime(0.001, now + 0.8);
        osc.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.8);
      });
      // Sub-bass rumble
      const sub = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(42, now);
      subG.gain.setValueAtTime(0.25, now);
      subG.gain.linearRampToValueAtTime(0.001, now + 0.8);
      sub.connect(subG);
      subG.connect(masterGain);
      sub.start(now);
      sub.stop(now + 0.8);
    }
  } catch (e) {
    // Audio Context safety fallback
  }
};

const RELIC_NAMES = {
  weapon: ['Skull Cleaver', 'Gothic Rapier', 'Vampire Pike', 'Crucifix Blade', 'Blood Scythe'],
  armor: ['Crimson Plate Mail', 'Graveyard Shroud', 'Vampire Lord Regalia', 'Obsidian Guard'],
  accessory: ['Signet of Dracula', 'Blood Ruby Ring', 'Bat Eye Amulet', 'Shadow Talisman']
};

export const generateRandomRelic = (level: number): Relic => {
  const types: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let rarity: Rarity = 'common';
  const roll = Math.random();
  if (roll < 0.03) rarity = 'legendary';
  else if (roll < 0.15) rarity = 'epic';
  else if (roll < 0.45) rarity = 'rare';

  const nameList = RELIC_NAMES[type];
  const baseName = nameList[Math.floor(Math.random() * nameList.length)];
  const name = `${rarity.toUpperCase()} ${baseName}`;

  const multiplier = { common: 1, rare: 1.6, epic: 2.4, legendary: 3.8 }[rarity];
  const stats: Partial<Stats> = {};

  if (type === 'weapon') {
    stats.attack = Math.round(level * multiplier * (4 + Math.random() * 2));
    stats.critRate = Math.min(0.03 * multiplier, 0.4);
  } else if (type === 'armor') {
    stats.hp = Math.round(level * multiplier * (15 + Math.random() * 10));
    stats.defense = Math.round(level * multiplier * (2 + Math.random() * 2));
  } else {
    stats.mana = Math.round(level * multiplier * (10 + Math.random() * 8));
    stats.speed = Math.min(0.02 * multiplier, 0.15);
  }

  return {
    id: `relic-${Date.now()}-${Math.random()}`,
    name,
    type,
    rarity,
    stats,
    value: level * 12 * multiplier,
    icon: type === 'weapon' ? '⚔️' : type === 'armor' ? '🛡️' : '💍',
    iconIndex: Math.floor(Math.random() * 24)
  };
};

const INITIAL_STATS: Stats = {
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,
  attack: 10,
  defense: 5,
  speed: 0.10, // Increased player speed for fluid movement
  critRate: 0.05,
  skillCooldown: 1.0,
  regen: 1,
  manaRegen: 2
};

import { GameController } from '../engine/GameController';
import { ACCOUNT_UPGRADES } from '../components/apps/CryptTree';

export const useGameState = () => {
  const getInitialState = (): GameState => {
    const defaultPlayer: Hero = {
      id: 'vlad',
      name: 'Vlad Dragomir',
      class: 'duke',
      level: 1,
      xp: 0,
      maxXp: 100,
      currentHp: 100,
      currentMana: 50,
      stats: { ...INITIAL_STATS },
      baseStats: { ...INITIAL_STATS },
      weapons: [
        { id: 'slash', name: 'Claymore Swing', level: 1, baseDamage: 22, cooldown: 1200, lastFired: 0, description: 'Standard melee slash', icon: 'whip' },
        { id: 'blood_nova', name: 'Blood Nova', level: 1, baseDamage: 24, cooldown: 3000, lastFired: 0, description: 'Expanding ring of spikes', icon: 'ultimate_duke' }
      ],
      equipment: {},
      state: 'idle',
      x: 390,
      y: 390
    };

    return {
      gold: 150,
      blood: 0,
      cryptCoins: 0,
      keys: 1,
      bombs: 2,
      activeBoss: null,
      player: defaultPlayer,
      inventory: [],
      groundItems: [],
      activeZone: 0,
      inTown: true,
      showLoreIntro: true,
      activeNPC: null,
      townPortal: null,
      nearbyInteractable: null,
      currentWave: 1,
      runStats: {
        runTime: 0,
        damageDealt: { vlad: 0 },
        kills: { bat: 0, skeleton: 0, zombie: 0, ghost: 0, reaper: 0 },
        goldEarned: 0,
        bloodEarned: 0
      },
      lifetimeStats: {
        kills: 0,
        gold: 0,
        blood: 0,
        maxFloorReached: 1,
        maxWaveReached: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      achievements: [],
      activeApps: ['coven'],
      windowStates: {},
      
      terminalLogs: ['🌀 Guided by Raziel in Lorek. The Soul Reaver is shattered. Kain awaits in the dark.'],
      showCardSelection: false,
      cardOptions: [],
      activeNotification: null,
      activeFlyout: null,
      zoom: 1.0,
      isLocked: false,
      alwaysOnTop: false,
      showTitleScreen: true,
      settings: {
        scanlines: false,
        fullscreen: true,
        uiScale: 1.0,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        graphicsQuality: 'high',
        wallpaper: 'mist'
      }
    };
  };

  // The controller is created once via a lazy initializer; reading a ref during
  // render is not allowed by the React Compiler lint rules.
  const [controller] = useState(() => new GameController(getInitialState()));
  const controllerRef = useRef<GameController | null>(controller);

  const [stateReact, setStateReact] = useState<GameState>(controller.state);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [activeEnemies, setActiveEnemies] = useState<Enemy[]>([]);
  const [bloodOrbs, setBloodOrbs] = useState<BloodOrb[]>([]);

  const stateRef = useRef(stateReact);
  const enemiesRef = useRef(activeEnemies);
  const orbsRef = useRef(bloodOrbs);

  // Hook for actions to safely update the single source of truth (GameController state)
  const setState = useCallback((updater: (prev: GameState) => GameState | Partial<GameState>) => {
    controller.setState((prev: GameState) => {
      const result = updater(prev);
      return { ...prev, ...result };
    });
  }, [controller]);

  useEffect(() => { stateRef.current = stateReact; }, [stateReact]);
  useEffect(() => { enemiesRef.current = activeEnemies; }, [activeEnemies]);
  useEffect(() => { orbsRef.current = bloodOrbs; }, [bloodOrbs]);

  const addFloatingText = useCallback((text: string, type: FloatingText['type'], x: number, y: number) => {
    setFloatingTexts(prev => [
      ...prev,
      { id: `ft-${Date.now()}-${Math.random()}`, text, type, x, y, createdAt: Date.now() }
    ].slice(-40));
  }, []);

  const generateTownLayout = useCallback(() => {
    const mapWidth = 40;
    const mapHeight = 40;
    const grid = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(1));
    for (let z = 4; z <= 22; z++) {
      for (let x = 4; x <= 22; x++) {
        grid[z][x] = 0; // Cobblestone plaza
      }
    }

    if (controllerRef.current) {
      controllerRef.current.activeEnemies = [];
      controllerRef.current.bloodOrbs = [];
    }

    setActiveEnemies([]);
    setBloodOrbs([]);

    setState(prev => {
      const player = { ...prev.player };
      if (prev.townPortal && prev.townPortal.portalInTown) {
        player.x = 450;
        player.y = 360;
      } else {
        player.x = 390;
        player.y = 390;
      }
      player.targetX = undefined;
      player.targetY = undefined;
      player.currentHp = player.stats.maxHp;
      player.currentMana = player.stats.maxMana;

      return {
        ...prev,
        grid,
        bombsList: [],
        roomsList: [],
        activeBoss: null,
        groundItems: [],
        activeChest: null,
        player
      };
    });
  }, [setState]);

  const generateNewFloor = useCallback((floor: number) => {
    const layout = generateDungeonLayout(floor, generateRandomRelic);
    const boss = layout.enemies.find(e => e.type === 'reaper');
    const activeBoss = boss ? { name: boss.name, hp: boss.hp, maxHp: boss.hp } : null;

    if (controllerRef.current) {
      controllerRef.current.activeEnemies = layout.enemies;
      controllerRef.current.bloodOrbs = [];
    }

    setActiveEnemies(layout.enemies);
    setBloodOrbs([]);

    setState(prev => {
      const player = { ...prev.player };
      // If we entered via returning from town portal, we restore coords
      if (prev.townPortal && !prev.townPortal.portalInTown) {
        player.x = prev.townPortal.returnX;
        player.y = prev.townPortal.returnY;
      } else {
        player.x = layout.startX;
        player.y = layout.startY;
      }
      player.targetX = undefined;
      player.targetY = undefined;
      player.currentHp = player.stats.maxHp;

      return {
        ...prev,
        grid: layout.grid,
        bombsList: [],
        roomsList: layout.roomsList,
        activeBoss,
        groundItems: layout.groundItems,
        activeChest: layout.activeChest,
        player
      };
    });
  }, [setState]);

  // Set up floor trigger on load/change floor or town toggle
  useEffect(() => {
    if (stateReact.inTown) {
      generateTownLayout();
    } else {
      generateNewFloor(stateReact.activeZone);
    }
  }, [stateReact.inTown, stateReact.activeZone, generateTownLayout, generateNewFloor]);

  // Floating text decay
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingTexts(prev => prev.filter(ft => now - ft.createdAt < 800));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to GameController
  useEffect(() => {
    controller.start();
    const unsubscribe = controller.subscribe((newState) => {
      setStateReact(newState);
      setActiveEnemies([...controller.activeEnemies]);
      setBloodOrbs([...controller.bloodOrbs]);
      if (newState.floatingTexts) {
        setFloatingTexts([...newState.floatingTexts]);
      }
    });
    return () => {
      controller.stop();
      unsubscribe();
    };
  }, [controller]);
  // The game loop logic has been successfully migrated to GameController!

  const dealClickDamage = useCallback((enemyId: string) => {
    setActiveEnemies(prev => {
      return prev.map(enemy => {
        if (enemy.id !== enemyId || enemy.hp <= 0) return enemy;

        const player = stateRef.current.player;
        const dmg = Math.max(5, player.stats.attack - enemy.defense);
        const isCrit = Math.random() < player.stats.critRate;
        const finalDmg = isCrit ? dmg * 2 : dmg;

        addFloatingText(isCrit ? `💥 ${finalDmg}` : `${finalDmg}`, isCrit ? 'crit' : 'damage', enemy.x, enemy.y - 14);
        playVampireSound('hit', stateRef.current.settings.sfxVolume);

        // Handle death
        if (enemy.hp - finalDmg <= 0) {
          setTimeout(() => {
            setBloodOrbs(prevOrbs => [
              ...prevOrbs,
              { id: `orb-${Date.now()}-${Math.random()}`, x: enemy.x, y: enemy.y, xpValue: enemy.xpValue, speed: 0 }
            ]);
            // Chance to drop item
            if (Math.random() < 0.25) {
              let droppedItem: any;
              const roll = Math.random();
              if (roll < 0.2) {
                droppedItem = { itemCategory: 'consumable', consumable: { type: 'health_potion', amount: 30 } };
              } else if (roll < 0.4) {
                droppedItem = { itemCategory: 'consumable', consumable: { type: 'mana_potion', amount: 20 } };
              } else if (roll < 0.6) {
                droppedItem = { itemCategory: 'relic', relic: { id: 'shop-key', name: 'Gothic Chest Key', type: 'accessory' as const, rarity: 'magic' as const, stats: {}, value: 0, icon: 'key' } };
              } else if (roll < 0.8) {
                droppedItem = { itemCategory: 'relic', relic: { id: 'shop-bomb', name: 'Black Iron Bomb', type: 'accessory' as const, rarity: 'magic' as const, stats: {}, value: 0, icon: 'bomb' } };
              } else {
                droppedItem = { itemCategory: 'relic', relic: generateRandomRelic(stateRef.current.activeZone + 1) };
              }

              setState(s => ({
                ...s,
                groundItems: [
                  ...(s.groundItems || []),
                  { id: `item-${Date.now()}-${Math.random()}`, x: enemy.x, y: enemy.y, beamAnimation: 1.0, ...droppedItem }
                ]
              }));
            }
          }, 50);
        }

        return {
          ...enemy,
          hp: Math.max(0, enemy.hp - finalDmg),
          state: 'hurt' as const
        };
      }).filter(e => e.hp > 0);
    });
  }, [addFloatingText]);

  const pickUpItem = useCallback((itemId: string) => {
    setState(prev => {
      const item = prev.groundItems.find(i => i.id === itemId);
      if (!item) return prev;

      // 1. Check gold for shops
      if (item.price !== undefined && prev.gold < item.price) {
        addFloatingText('NEED GOLD!', 'shield', prev.player.x, prev.player.y - 30);
        return prev;
      }

      playVampireSound('drop', prev.settings.sfxVolume);
      
      const goldDeducted = item.price || 0;
      let updatedInventory = [...prev.inventory];
      const player = { ...prev.player };
      let newKeys = prev.keys;
      let newBombs = prev.bombs;

      // 2. Handle Custom consumables
      let itemName = 'Unknown Item';
      
      if (item.itemCategory === 'consumable' && item.consumable) {
        if (item.consumable.type === 'health_potion') {
          player.currentHp = Math.min(player.stats.maxHp, player.currentHp + item.consumable.amount);
          addFloatingText('HEALED!', 'heal', player.x, player.y - 20);
          itemName = 'Health Potion';
        } else if (item.consumable.type === 'mana_potion') {
          player.currentMana = Math.min(player.stats.maxMana, player.currentMana + item.consumable.amount);
          addFloatingText('MANA RESTORED!', 'mana', player.x, player.y - 20);
          itemName = 'Mana Potion';
        }
      } else if (item.itemCategory === 'material' && item.material) {
        itemName = item.material.type.replace('_', ' ');
      } else if (item.itemCategory === 'relic' && item.relic) {
        itemName = item.relic.name;
        if (item.relic.id === 'shop-hp' || item.relic.id === 'buy_hp') {
          player.currentHp = player.stats.maxHp;
          addFloatingText('MAX HP HEALED!', 'heal', player.x, player.y - 20);
        } else if (item.relic.id === 'shop-key') {
          newKeys += 1;
          addFloatingText('+1 Key', 'xp', player.x, player.y - 20);
        } else if (item.relic.id === 'shop-bomb') {
          newBombs += 1;
          addFloatingText('+1 Bomb', 'xp', player.x, player.y - 20);
        } else {
          updatedInventory = [...updatedInventory, item.relic].slice(0, 45);
        }
      }

      return {
        ...prev,
        gold: prev.gold - goldDeducted,
        keys: newKeys,
        bombs: newBombs,
        player,
        groundItems: prev.groundItems.filter(i => i.id !== itemId),
        inventory: updatedInventory,
        terminalLogs: [...prev.terminalLogs, `${item.price ? '🛒 Purchased' : '🎒 Picked up'}: ${itemName}`].slice(-30)
      };
    });
  }, [addFloatingText]);

  const equipRelic = useCallback((relic: Relic) => {
    setState(prev => {
      const player = { ...prev.player };
      const slot = relic.type as RelicType;
      const currentlyEquipped = player.equipment[slot];

      // Remove stats of currently equipped item
      if (currentlyEquipped) {
        Object.entries(currentlyEquipped.stats).forEach(([statKey, val]) => {
          const key = statKey as keyof Stats;
          if (typeof val === 'number') {
            player.stats[key] = (Number(player.stats[key]) || 0) - val;
          }
        });
      }

      // Add stats of newly equipped item
      Object.entries(relic.stats).forEach(([statKey, val]) => {
        const key = statKey as keyof Stats;
        if (typeof val === 'number') {
          player.stats[key] = (Number(player.stats[key]) || 0) + val;
        }
      });

      player.equipment[slot] = relic;

      // Filter relic out of inventory
      const updatedInventory = prev.inventory.filter(i => i.id !== relic.id);

      // Return old item to inventory if it existed
      if (currentlyEquipped) {
        updatedInventory.push(currentlyEquipped);
      }

      return {
        ...prev,
        player,
        inventory: updatedInventory
      };
    });
  }, []);

  const unequipRelic = useCallback((slot: RelicType) => {
    setState(prev => {
      const player = { ...prev.player };
      const relic = player.equipment[slot];
      if (!relic) return prev;

      // Remove stats
      Object.entries(relic.stats).forEach(([statKey, val]) => {
        const key = statKey as keyof Stats;
        if (typeof val === 'number') {
          player.stats[key] = (Number(player.stats[key]) || 0) - val;
        }
      });

      delete player.equipment[slot];

      return {
        ...prev,
        player,
        inventory: [...prev.inventory, relic].slice(0, 45)
      };
    });
  }, []);

  const castSpell = useCallback((spellId: string) => {
    const player = { ...stateRef.current.player };
    const spell = player.weapons.find(w => w.id === spellId);
    if (!spell || player.currentMana < 15) return;

    // Deduct mana
    player.currentMana = Math.max(0, player.currentMana - 15);

    // Blood Nova Effect
    if (spellId === 'blood_nova') {
      setActiveEnemies(prev => {
        return prev.map(enemy => {
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < 120) {
            const dmg = spell.baseDamage + player.stats.attack;
            addFloatingText(`💥 ${dmg}`, 'crit', enemy.x, enemy.y - 12);
            return { ...enemy, hp: Math.max(0, enemy.hp - dmg), state: 'hurt' as const };
          }
          return enemy;
        }).filter(e => e.hp > 0);
      });
      playVampireSound('whip', stateRef.current.settings.sfxVolume);
    }

    setState(prev => ({ ...prev, player }));
  }, [addFloatingText]);

  const travelToZone = useCallback((zoneIdx: number) => {
    setState(prev => {
      playVampireSound('click', prev.settings.sfxVolume);
      return {
        ...prev,
        activeZone: zoneIdx,
        terminalLogs: [...prev.terminalLogs, `Teleported to floor ${zoneIdx + 1}`].slice(-30)
      };
    });
  }, []);

  return {
    state: stateReact,
    floatingTexts,
    activeEnemies,
    bloodOrbs,
    actions: {
      enterDungeon: () => {
        setState(prev => ({ ...prev, showTitleScreen: false }));
      },
      newGame: () => {
        const defaultPlayer: Hero = {
          id: 'vlad',
          name: 'Vlad Dragomir',
          class: 'duke',
          level: 1,
          xp: 0,
          maxXp: 100,
          currentHp: 100,
          currentMana: 50,
          stats: { ...INITIAL_STATS },
          baseStats: { ...INITIAL_STATS },
          weapons: [
            { id: 'slash', name: 'Claymore Swing', level: 1, baseDamage: 12, cooldown: 800, lastFired: 0, description: 'Standard melee slash', icon: 'whip' },
            { id: 'blood_nova', name: 'Blood Nova', level: 1, baseDamage: 24, cooldown: 3000, lastFired: 0, description: 'Expanding ring of spikes', icon: 'ultimate_duke' }
          ],
          equipment: {},
          state: 'idle',
          x: 300,
          y: 300
        };
        setState(prev => ({
          ...prev,
          gold: 150,
          blood: 0,
          cryptCoins: 0,
          player: defaultPlayer,
          inventory: [],
          groundItems: [],
          activeZone: 0,
          currentWave: 1,
          showTitleScreen: false,
          showCardSelection: false,
          cardOptions: [],
          bossCinematic: undefined,
          activeBoss: null,
          showVictoryScreen: false
        }));
        
        if (controllerRef.current) {
          controllerRef.current.activeEnemies = [];
          controllerRef.current.bloodOrbs = [];
        }

        setActiveEnemies([]);
        setBloodOrbs([]);
        generateNewFloor(0);
      },
      dealClickDamage,
      pickUpItem,
      equipRelic,
      unequipRelic,
      castSpell,
      travelToZone,
      selectUpgradeCard: (card: any) => controller.selectUpgradeCard(card),
      selectHero: (_heroId: string) => {}, // Stub for compatibility
      openBossChest: () => {},
      levelUpHero: () => {},
      recycleRelic: (relicId: string) => {
        setState(prev => {
          const relic = prev.inventory.find(i => i.id === relicId);
          if (!relic) return prev;
          return {
            ...prev,
            gold: prev.gold + relic.value,
            inventory: prev.inventory.filter(i => i.id !== relicId)
          };
        });
      },
      unlockDisciplineNode: () => {},
      resetDisciplineNodes: () => {},
      buyBloodUpgrade: (key: keyof BloodUpgrades) => {
        const costTable = {
          maxHp: [10, 25, 50, 100, 200],
          lifesteal: [15, 35, 75, 150, 300],
          cdr: [20, 50, 100, 200, 400],
          xpMult: [10, 25, 50, 100, 200]
        };

        setState(prev => {
          const upgrades = { ...(prev.bloodUpgrades || { maxHp: 0, lifesteal: 0, cdr: 0, xpMult: 0 }) };
          const currentRank = upgrades[key] || 0;
          if (currentRank >= 5) return prev; // Max rank reached!

          const cost = costTable[key][currentRank];
          if (prev.blood >= cost) {
            upgrades[key] = currentRank + 1;
            
            const player = { ...prev.player };
            if (key === 'maxHp') {
              player.stats.maxHp = Math.round(player.baseStats.maxHp * (1 + upgrades.maxHp * 0.1));
              player.currentHp = Math.min(player.stats.maxHp, player.currentHp + 10);
            }

            playVampireSound('levelUp', prev.settings.sfxVolume);
            return {
              ...prev,
              blood: prev.blood - cost,
              bloodUpgrades: upgrades,
              player,
              terminalLogs: [...prev.terminalLogs, `🩸 Blood upgrade purchased: ${key} (Rank ${upgrades[key]})`].slice(-30)
            };
          }
          return prev;
        });
      },
      buyAccountUpgrade: (nodeId: string) => {
        const node = ACCOUNT_UPGRADES.find(n => n.id === nodeId);
        if (!node) return;

        setState(prev => {
          const upgrades = { ...(prev.accountUpgrades || {}) };
          if (upgrades[nodeId]) return prev;

          if (node.prereq && !upgrades[node.prereq]) {
            addFloatingText('REQUIRES PREREQUISITE!', 'shield', prev.player.x, prev.player.y - 30);
            return prev;
          }

          if (prev.cryptCoins >= node.cost) {
            upgrades[nodeId] = true;
            
            const player = { ...prev.player };
            if (nodeId === 'blood_pact_1') {
              player.stats.maxHp = Math.round(player.baseStats.maxHp * 1.15);
              player.stats.defense = Math.round(player.baseStats.defense * 1.15);
              player.currentHp = player.stats.maxHp;
            } else if (nodeId === 'blood_pact_2') {
              player.stats.maxHp = Math.round(player.baseStats.maxHp * 1.30);
              player.stats.defense = Math.round(player.baseStats.defense * 1.30);
              player.currentHp = player.stats.maxHp;
            }

            playVampireSound('levelUp', prev.settings.sfxVolume);
            return {
              ...prev,
              cryptCoins: prev.cryptCoins - node.cost,
              accountUpgrades: upgrades,
              player,
              terminalLogs: [...prev.terminalLogs, `🔓 Unlocked node: ${node.name}`].slice(-30)
            };
          } else {
            addFloatingText('NEED COINS!', 'shield', prev.player.x, prev.player.y - 30);
          }
          return prev;
        });
      },
      setOverclockLevel: () => {},
      executeTerminalCommand: () => {},
      focusWindow: () => {},
      minimizeWindow: () => {},
      toggleWindow: () => {},
      toggleMaximizeWindow: () => {},
      moveWindow: () => {},
      applyUpgradeCard: () => {},
      triggerUltimate: () => {},
      fuseRelics: () => {},
      setZoom: () => {},
      toggleLock: () => {},
      toggleAlwaysOnTop: () => {},
      
      cleanDefragCell: () => {},
      dropBomb: () => {
        setState(prev => {
          if (prev.bombs <= 0) {
            addFloatingText('NO BOMBS!', 'shield', prev.player.x, prev.player.y - 35);
            return prev;
          }
          
          const newBomb = {
            id: `bomb-${Date.now()}-${Math.random()}`,
            x: prev.player.x,
            y: prev.player.y,
            timer: 2.0
          };
          
          return {
            ...prev,
            bombs: prev.bombs - 1,
            bombsList: [...(prev.bombsList || []), newBomb]
          };
        });
      },
      useKeyOnDoor: (tx: number, tz: number) => {
        setState(prev => {
          const tile = prev.grid ? prev.grid[tz][tx] : 0;
          if (tile === 3 || tile === 4 || tile === 5) {
            if (prev.keys > 0) {
              const newGrid = prev.grid ? prev.grid.map(row => [...row]) : [];
              if (newGrid.length > 0) {
                newGrid[tz][tx] = 0;
              }
              playVampireSound('levelUp', prev.settings.sfxVolume);
              return {
                ...prev,
                keys: prev.keys - 1,
                grid: newGrid,
                terminalLogs: [...prev.terminalLogs, `🔑 Unlocked locked doorway at (${tx}, ${tz})`].slice(-30)
              };
            } else {
              addFloatingText('REQUIRES KEY!', 'shield', prev.player.x, prev.player.y - 30);
            }
          }
          return prev;
        });
      },
      openChest: () => {
        setState(prev => {
          if (!prev.activeChest || prev.activeChest.isOpen) return prev;
          
          if (prev.keys > 0) {
            playVampireSound('levelUp', prev.settings.sfxVolume);
            
            // Spawn relic on top of chest
            const relic = generateRandomRelic(prev.activeZone + 2);
            const newGroundItem = {
              id: `chest-loot-${Date.now()}`,
              itemCategory: 'relic' as const,
              relic,
              x: prev.activeChest.x,
              y: prev.activeChest.y + 10,
              beamAnimation: 1.0
            };

            addFloatingText('CHEST OPENED!', 'xp', prev.activeChest.x, prev.activeChest.y - 30);
            
            return {
              ...prev,
              keys: prev.keys - 1,
              activeChest: { ...prev.activeChest, isOpen: true },
              groundItems: [...(prev.groundItems || []), newGroundItem],
              terminalLogs: [...prev.terminalLogs, `🎁 Opened Gothic Chest!`].slice(-30)
            };
          } else {
            addFloatingText('REQUIRES KEY!', 'shield', prev.player.x, prev.player.y - 30);
            return prev;
          }
        });
      },
      enterPortal: () => {
        setState(prev => {
          const nextZone = prev.activeZone + 1;
          if (nextZone >= 5) {
            playVampireSound('levelUp', prev.settings.sfxVolume);
            return {
              ...prev,
              showVictoryScreen: true
            };
          }
          playVampireSound('levelUp', prev.settings.sfxVolume);
          return {
            ...prev,
            activeZone: nextZone,
            terminalLogs: [...prev.terminalLogs, `🏰 Entered trapdoor. Descended to floor ${nextZone + 1}`].slice(-30)
          };
        });
      },
      claimVictory: () => {
        setState(prev => {
          // Reset run but keep meta progression currencies and upgrades
          const defaultPlayer: Hero = {
            id: 'vlad',
            name: 'Vlad Dragomir',
            class: 'duke',
            level: 1,
            xp: 0,
            maxXp: 100,
            currentHp: 100,
            currentMana: 50,
            stats: { ...INITIAL_STATS },
            baseStats: { ...INITIAL_STATS },
            weapons: [
              { id: 'slash', name: 'Claymore Swing', level: 1, baseDamage: 12, cooldown: 800, lastFired: 0, description: 'Standard melee slash', icon: 'whip' },
              { id: 'blood_nova', name: 'Blood Nova', level: 1, baseDamage: 24, cooldown: 3000, lastFired: 0, description: 'Expanding ring of spikes', icon: 'ultimate_duke' }
            ],
            equipment: {},
            state: 'idle',
            x: 300,
            y: 300
          };
          
          return {
            ...prev,
            player: defaultPlayer,
            inventory: [],
            groundItems: [],
            activeZone: 0,
            currentWave: 1,
            showTitleScreen: true,
            showVictoryScreen: false
          };
        });
        setActiveEnemies([]);
        setBloodOrbs([]);
      },
      onPlayerMove: (x: number, y: number, direct?: boolean) => {
        setState(prev => {
          const player = { ...prev.player };
          if (direct) {
            player.x = x;
            player.y = y;
            player.targetX = undefined;
            player.targetY = undefined;
          } else {
            player.targetX = x;
            player.targetY = y;
          }
          return { ...prev, player };
        });
      },
      enterCatacombs: () => {
        setState(prev => ({
          ...prev,
          inTown: false,
          activeZone: 0,
          nearbyInteractable: null,
          terminalLogs: [...prev.terminalLogs, '⚔️ Entered the Catacombs (Floor 1). Stay vigilant!']
        }));
        playVampireSound('boss', stateRef.current.settings.sfxVolume);
      },
      castTownPortal: () => {
        if (stateRef.current.inTown) {
          addFloatingText('ALREADY IN SANCTUARY', 'shield', stateRef.current.player.x, stateRef.current.player.y - 20);
          return;
        }
        const currentFloor = stateRef.current.activeZone;
        const currentX = stateRef.current.player.x;
        const currentY = stateRef.current.player.y;
        
        setState(prev => ({
          ...prev,
          inTown: true,
          townPortal: {
            active: true,
            returnFloor: currentFloor,
            returnX: currentX,
            returnY: currentY,
            portalInTown: true
          },
          nearbyInteractable: null,
          terminalLogs: [...prev.terminalLogs, `🌀 Town Portal opened to Lorek from Floor ${currentFloor + 1}.`]
        }));
        addFloatingText('TOWN PORTAL!', 'xp', currentX, currentY - 20);
        playVampireSound('heal', stateRef.current.settings.sfxVolume);
      },
      useTownPortal: () => {
        const tp = stateRef.current.townPortal;
        if (!tp || !tp.active) return;
        
        setState(prev => {
          const player = { ...prev.player, x: tp.returnX, y: tp.returnY };
          return {
            ...prev,
            inTown: false,
            activeZone: tp.returnFloor,
            townPortal: null,
            nearbyInteractable: null,
            player,
            terminalLogs: [...prev.terminalLogs, `🌀 Stepped through Town Portal back to Floor ${tp.returnFloor + 1}.`]
          };
        });
        playVampireSound('heal', stateRef.current.settings.sfxVolume);
      },
      onOpenNPC: (npcId: 'sage' | 'blacksmith' | 'witch') => {
        setState(prev => ({ ...prev, activeNPC: npcId }));
        playVampireSound('click', stateRef.current.settings.sfxVolume);
      },
      onCloseNPC: () => {
        setState(prev => ({ ...prev, activeNPC: null }));
        playVampireSound('click', stateRef.current.settings.sfxVolume);
      },
      closeLoreIntro: () => {
        setState(prev => ({ ...prev, showLoreIntro: false }));
        playVampireSound('click', stateRef.current.settings.sfxVolume);
      },
      openLoreIntro: () => {
        setState(prev => ({ ...prev, showLoreIntro: true }));
        playVampireSound('click', stateRef.current.settings.sfxVolume);
      },
      upgradeWeaponBlacksmith: (weaponId: string) => {
        const cost = 75;
        if (stateRef.current.gold < cost) {
          addFloatingText('NOT ENOUGH GOLD', 'shield', stateRef.current.player.x, stateRef.current.player.y - 20);
          return;
        }
        setState(prev => {
          const weapons = prev.player.weapons.map(w => {
            if (w.id === weaponId) {
              return {
                ...w,
                level: w.level + 1,
                baseDamage: Math.round(w.baseDamage * 1.25)
              };
            }
            return w;
          });
          return {
            ...prev,
            gold: prev.gold - cost,
            player: {
              ...prev.player,
              weapons,
              stats: {
                ...prev.player.stats,
                attack: prev.player.stats.attack + 4
              }
            },
            terminalLogs: [...prev.terminalLogs, `⚒️ Thorne upgraded ${weaponId} to next tier (+4 ATK)!`]
          };
        });
        addFloatingText('WEAPON FORGED!', 'crit', stateRef.current.player.x, stateRef.current.player.y - 20);
        playVampireSound('hit', stateRef.current.settings.sfxVolume);
      },
      upgradeArmorBlacksmith: () => {
        const cost = 90;
        if (stateRef.current.gold < cost) {
          addFloatingText('NOT ENOUGH GOLD', 'shield', stateRef.current.player.x, stateRef.current.player.y - 20);
          return;
        }
        setState(prev => ({
          ...prev,
          gold: prev.gold - cost,
          player: {
            ...prev.player,
            stats: {
              ...prev.player.stats,
              defense: prev.player.stats.defense + 3,
              maxHp: prev.player.stats.maxHp + 25,
              hp: Math.min(prev.player.stats.maxHp + 25, prev.player.currentHp + 25)
            }
          },
          terminalLogs: [...prev.terminalLogs, `🛡️ Thorne reinforced armor (+3 DEF, +25 Max HP)!`]
        }));
        addFloatingText('ARMOR REINFORCED!', 'heal', stateRef.current.player.x, stateRef.current.player.y - 20);
        playVampireSound('hit', stateRef.current.settings.sfxVolume);
      },
      buyPotionWitch: (type: 'health' | 'mana') => {
        const cost = 30;
        if (stateRef.current.gold < cost) {
          addFloatingText('NOT ENOUGH GOLD', 'shield', stateRef.current.player.x, stateRef.current.player.y - 20);
          return;
        }
        setState(prev => {
          const player = { ...prev.player };
          if (type === 'health') {
            player.currentHp = Math.min(player.stats.maxHp, player.currentHp + 60);
          } else {
            player.currentMana = Math.min(player.stats.maxMana, (player.currentMana || 0) + 40);
          }
          return {
            ...prev,
            gold: prev.gold - cost,
            player,
            terminalLogs: [...prev.terminalLogs, `🧪 Lysandra concocted a ${type} draught!`]
          };
        });
        addFloatingText(`+${type.toUpperCase()} RESTORED+`, 'heal', stateRef.current.player.x, stateRef.current.player.y - 20);
        playVampireSound('heal', stateRef.current.settings.sfxVolume);
      },
      blessPlayerElder: () => {
        setState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            currentHp: prev.player.stats.maxHp,
            currentMana: prev.player.stats.maxMana + 20,
            stats: {
              ...prev.player.stats,
              maxMana: prev.player.stats.maxMana + 20
            }
          },
          terminalLogs: [...prev.terminalLogs, `📜 Raziel bestowed his Spectral Blessing (+20 Max Mana)!`]
        }));
        addFloatingText('ELDER BLESSING!', 'xp', stateRef.current.player.x, stateRef.current.player.y - 20);
        playVampireSound('levelUp', stateRef.current.settings.sfxVolume);
      },
      healAtFountain: () => {
        setState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            currentHp: prev.player.stats.maxHp,
            currentMana: prev.player.stats.maxMana
          }
        }));
        addFloatingText('+VITALITY RESTORED+', 'heal', stateRef.current.player.x, stateRef.current.player.y - 20);
        playVampireSound('heal', stateRef.current.settings.sfxVolume);
      },
      updateSettings: (newSettings: Partial<GameState['settings']>) => {
        setState(prev => ({
          ...prev,
          settings: { ...prev.settings, ...newSettings }
        }));
      },
      saveGame: () => {
        localStorage.setItem('taskbar_heroes_save', JSON.stringify(stateRef.current));
      },
      loadGame: () => {
        const saved = localStorage.getItem('taskbar_heroes_save');
        if (saved) {
          try {
            setState(JSON.parse(saved));
          } catch (e) {
            console.warn('Failed to parse saved game state:', e);
          }
        }
      },
      exportSave: () => {
        const data = JSON.stringify(stateRef.current);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskbar_heroes_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      importSave: (jsonStr: string) => {
        try {
          const loaded = JSON.parse(jsonStr);
          setState(loaded);
        } catch (e) {
          console.error("Invalid save file");
        }
      }
    }
  };
};

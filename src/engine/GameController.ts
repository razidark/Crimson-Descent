import { GameState, Enemy, FloatingText, BloodOrb } from '../types/game';
import { playVampireSound, generateRandomRelic } from '../hooks/useGameState'; // We can extract these later

export type GameEventListener = (state: GameState) => void;

export class GameController {
  public state: GameState;
  
  // High-frequency mutable state (read directly by DarknessEngine)
  public activeEnemies: Enemy[] = [];
  public bloodOrbs: BloodOrb[] = [];
  
  private listeners: Set<GameEventListener> = new Set();
  private lastTime: number = performance.now();
  private intervalId: any = null;
  
  // Used to prevent excessive UI renders. Only true when UI needs to update (e.g. HP changed, item picked up, zone changed)
  private needsUIRender = false;

  constructor(initialState: GameState) {
    this.state = initialState;
    this.activeEnemies = [];
    this.bloodOrbs = [];
  }

  public start() {
    if (this.intervalId) return;
    this.lastTime = performance.now();
    this.intervalId = setInterval(() => this.loop(), 30);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public subscribe(listener: GameEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyUI() {
    if (this.needsUIRender) {
      // Shallow copy so React detects a change
      this.listeners.forEach(listener => listener({ ...this.state }));
      this.needsUIRender = false;
    }
  }

  public forceUIRender() {
    this.needsUIRender = true;
    this.notifyUI();
  }

  public setState(updater: (prev: GameState) => GameState) {
    this.state = updater(this.state);
    this.forceUIRender();
  }

  // --- External Actions (called by React or DarknessEngine) ---

  public movePlayer(x: number, y: number, direct: boolean = false) {
    if (direct) {
      this.state.player.x = x;
      this.state.player.y = y;
      this.state.player.targetX = undefined;
      this.state.player.targetY = undefined;
    } else {
      this.state.player.targetX = x;
      this.state.player.targetY = y;
    }
  }

  private addFloatingText(text: string, type: FloatingText['type'], x: number, y: number) {
    if (!this.state.floatingTexts) this.state.floatingTexts = [];
    this.state.floatingTexts.push({ id: `ft-${Date.now()}-${Math.random()}`, text, type, x, y, life: 1.0, createdAt: Date.now() });
  }

  private checkStateCollision(x: number, z: number, r: number = 5): boolean {
    if (!this.state.grid) return true;
    const padding = r;
    const tileX1 = Math.floor((x - padding) / 30);
    const tileX2 = Math.floor((x + padding) / 30);
    const tileZ1 = Math.floor((z - padding) / 30);
    const tileZ2 = Math.floor((z + padding) / 30);

    for (let tz = tileZ1; tz <= tileZ2; tz++) {
      for (let tx = tileX1; tx <= tileX2; tx++) {
        const row = this.state.grid[tz];
        if (!row) return true;
        const tile = row[tx];
        // 0=floor, 1=wall, 2=pillar, 3,4,5=locked doors, 6=secret wall, 8=portal
        if (tile !== 0 && tile !== 8 && tile !== undefined) {
          return true; // Collision!
        }
      }
    }
    return false;
  }

  // --- Core Loop ---

  private loop() {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;
    if (this.state.showCardSelection) return;
    
    // Hit-stop micro pause
    if (this.state.hitStopUntil && now < this.state.hitStopUntil) {
      return; 
    }

    // Handle Cinematic Pause
    if (this.state.bossCinematic && this.state.bossCinematic.timer > 0) {
      this.state.bossCinematic.timer -= dt / 1000;
      if (this.state.bossCinematic.timer <= 0) {
        this.state.bossCinematic = undefined; // Cinematic ends
      }
      this.notifyUI();
      return; // Stop all AI and Combat during cinematic
    }

    this.updatePlayerMovement(dt);
    this.updateCombat(now);
    this.updateEnemyAI(dt);
    this.updateBloodOrbs(dt);
    this.updateBombs(dt);
    this.updateBossState();
    this.checkPlayerDeath();
    this.updateProximityChests();
    this.updateFloatingTexts(dt);
    this.checkAchievements();
    this.checkWaveEnd();
    
    this.notifyUI();
  }

  private updatePlayerMovement(dt: number) {
    const player = this.state.player;
    if (player.targetX !== undefined && player.targetY !== undefined) {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 2) {
        const moveDist = player.stats.speed * dt;
        if (dist <= moveDist) {
          player.x = player.targetX;
          player.y = player.targetY;
          player.targetX = undefined;
          player.targetY = undefined;
        } else {
          const proposedX = player.x + (dx / dist) * moveDist;
          const proposedY = player.y + (dy / dist) * moveDist;
          if (!this.checkStateCollision(proposedX, proposedY)) {
            player.x = proposedX;
            player.y = proposedY;
          } else {
            player.targetX = undefined;
            player.targetY = undefined;
            player.state = 'idle';
          }
        }
      } else {
        player.state = 'idle';
        player.targetX = undefined;
        player.targetY = undefined;
      }
    } else {
      player.state = 'idle';
    }
  }

  private updateCombat(now: number) {
    const player = this.state.player;
    const slashWeapon = player.weapons.find(w => w.id === 'slash');
    if (!slashWeapon) return;
    
    const cdr = this.state.bloodUpgrades?.cdr || 0;
    const cooldownReduction = 1 - cdr * 0.03;
    const weaponCooldown = slashWeapon.cooldown * cooldownReduction;
    
    if (now - (slashWeapon.lastFired || 0) >= weaponCooldown) {
      const closeEnemies = this.activeEnemies.filter(e => e.hp > 0 && Math.hypot(e.x - player.x, e.y - player.y) <= 35);
      if (closeEnemies.length > 0) {
        slashWeapon.lastFired = now;
        player.state = 'attacking';

        closeEnemies.forEach(enemy => {
          const baseDmg = Math.max(1, player.stats.attack - enemy.defense);
          const isCrit = Math.random() < player.stats.critRate;
          const finalDmg = isCrit ? baseDmg * 2 : baseDmg;

          enemy.hp = Math.max(0, enemy.hp - finalDmg);
          enemy.state = 'hurt';

          // Knockback
          const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          const knockbackForce = (isCrit ? 6 : 3) * (1 - (enemy.knockbackResist || 0));
          enemy.vx = Math.cos(angle) * knockbackForce;
          enemy.vy = Math.sin(angle) * knockbackForce;

          // Hit-Stop for visceral feel on crits
          if (isCrit) {
            this.state.hitStopUntil = now + 65; // 65ms pause
          }

          // Lifesteal Rank healing
          const lifestealRank = this.state.bloodUpgrades?.lifesteal || 0;
          if (lifestealRank > 0) {
            player.currentHp = Math.min(player.stats.maxHp, player.currentHp + lifestealRank);
          }

          this.state.runStats!.damageDealt.vlad = (this.state.runStats!.damageDealt.vlad || 0) + finalDmg;
          this.addFloatingText(isCrit ? `💥 ${finalDmg}` : `${finalDmg}`, isCrit ? 'crit' : 'damage', enemy.x, enemy.y - 12);
          playVampireSound('hit', this.state.settings.sfxVolume);

          if (enemy.hp <= 0) {
            this.handleEnemyDeath(enemy);
          }
        });
        
        // Render UI if needed
        this.needsUIRender = true; 
      }
    }
  }

  private handleEnemyDeath(enemy: Enemy) {
    this.state.runStats!.kills[enemy.type] = (this.state.runStats!.kills[enemy.type] || 0) + 1;
    this.state.lifetimeStats!.kills += 1;
    
    // Gilded Coffin gold multiplier upgrades
    let goldMultiplier = 1.0;
    if (this.state.accountUpgrades?.gilded_coffin_1) goldMultiplier += 0.15;
    if (this.state.accountUpgrades?.gilded_coffin_2) goldMultiplier += 0.30;
    const finalGold = Math.round(enemy.goldValue * goldMultiplier);

    this.state.runStats!.goldEarned += finalGold;
    this.state.lifetimeStats!.gold += finalGold;
    this.state.gold += finalGold;

    this.bloodOrbs.push({ id: `orb-${Date.now()}-${Math.random()}`, x: enemy.x, y: enemy.y, xpValue: enemy.xpValue, speed: 0 });
    
    // Dracula's Loot drop rate upgrades
    let dropChance = 0.25;
    if (this.state.accountUpgrades?.dracula_loot_1) dropChance += 0.10;
    if (this.state.accountUpgrades?.dracula_loot_2) dropChance += 0.25;

    if (Math.random() < dropChance) {
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
        droppedItem = { itemCategory: 'relic', relic: generateRandomRelic(this.state.activeZone + 1) };
      }
      
      if (!this.state.groundItems) this.state.groundItems = [];
      this.state.groundItems.push({ id: `item-${Date.now()}-${Math.random()}`, x: enemy.x, y: enemy.y, beamAnimation: 1.0, ...droppedItem } as any);
    }
    
    this.needsUIRender = true;
  }

  private updateEnemyAI(dt: number) {
    const player = this.state.player;
    let uiChanged = false;

    this.activeEnemies.forEach(enemy => {
      if (enemy.hp <= 0) return;

      const vx = enemy.vx || 0;
      const vy = enemy.vy || 0;

      // Apply Knockback velocity
      if (vx !== 0 || vy !== 0) {
        if (!this.checkStateCollision(enemy.x + vx, enemy.y + vy, 7.0)) {
          enemy.x += vx;
          enemy.y += vy;
        }
        enemy.vx = vx * 0.85; // Friction
        enemy.vy = vy * 0.85;
        if (Math.abs(enemy.vx) < 0.1) enemy.vx = 0;
        if (Math.abs(enemy.vy) < 0.1) enemy.vy = 0;
        return; // Don't process AI while being knocked back
      }

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      // Advanced Enemy AI Behaviours
      let attackRange = 15;
      const aggroRange = 200;
      let moveSpeed = enemy.speed;

      if (enemy.type === 'bat') {
        // Fast swarmers, erratic flanking movement
        moveSpeed = enemy.speed * 1.5;
        const flankOffset = Math.sin(performance.now() / 300) * 50; 
        if (dist > attackRange) {
          enemy.state = 'chasing';
          const angle = Math.atan2(dy, dx) + (flankOffset / dist);
          const proposedX = enemy.x + Math.cos(angle) * moveSpeed * dt;
          const proposedY = enemy.y + Math.sin(angle) * moveSpeed * dt;
          if (!this.checkStateCollision(proposedX, proposedY, 7.0)) {
            enemy.x = proposedX;
            enemy.y = proposedY;
          }
        }
      } 
      else if (enemy.type === 'skeleton') {
        // Archers/Ranged: Stays at distance
        attackRange = 120;
        if (dist > attackRange) {
          enemy.state = 'chasing';
          const proposedX = enemy.x + (dx / dist) * moveSpeed * dt;
          const proposedY = enemy.y + (dy / dist) * moveSpeed * dt;
          if (!this.checkStateCollision(proposedX, proposedY, 7.0)) {
            enemy.x = proposedX;
            enemy.y = proposedY;
          }
        } else if (dist < attackRange - 20) {
          // Backpedal if player gets too close
          const proposedX = enemy.x - (dx / dist) * moveSpeed * dt;
          const proposedY = enemy.y - (dy / dist) * moveSpeed * dt;
          if (!this.checkStateCollision(proposedX, proposedY, 7.0)) {
            enemy.x = proposedX;
            enemy.y = proposedY;
          }
        }
      }
      else {
        // Default Melee (Zombies, Reapers)
        enemy.knockbackResist = enemy.type === 'zombie' ? 0.7 : 0.2; // Zombies resist knockback
        if (dist < aggroRange && dist > attackRange) {
          enemy.state = 'chasing';
          const proposedX = enemy.x + (dx / dist) * moveSpeed * dt;
          const proposedY = enemy.y + (dy / dist) * moveSpeed * dt;

          if (!this.checkStateCollision(proposedX, proposedY, 7.0)) {
            enemy.x = proposedX;
            enemy.y = proposedY;
          } else {
            if (!this.checkStateCollision(proposedX, enemy.y, 7.0)) enemy.x = proposedX;
            else if (!this.checkStateCollision(enemy.x, proposedY, 7.0)) enemy.y = proposedY;
          }
        }
      }

      if (dist <= attackRange) {
        enemy.state = 'attacking';
        if (Math.random() < 0.025) {
          if (player.isInvulnerable) {
            this.addFloatingText('DODGED!', 'shield', player.x, player.y - 14);
            return;
          }
          const finalDmg = Math.max(1, enemy.attack - player.stats.defense);
          player.currentHp = Math.max(0, player.currentHp - finalDmg);
          this.addFloatingText(`-${finalDmg}`, 'damage', player.x, player.y - 12);
          playVampireSound('hit', this.state.settings.sfxVolume);
          uiChanged = true;
        }
      } else {
        enemy.state = 'idle';
      }
    });

    if (uiChanged) this.needsUIRender = true;
  }

  private updateBloodOrbs(_dt: number) {
    const player = this.state.player;
    let uiChanged = false;

    this.bloodOrbs.forEach(orb => {
      const dx = player.x - orb.x;
      const dy = player.y - orb.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 100) {
        const pullSpeed = Math.min(6, orb.speed + 0.4);
        orb.speed = pullSpeed;
        orb.x += (dx / dist) * pullSpeed;
        orb.y += (dy / dist) * pullSpeed;
      }
    });

    const consumedOrbs = this.bloodOrbs.filter(o => Math.hypot(player.x - o.x, player.y - o.y) < 8);
    if (consumedOrbs.length > 0) {
      this.bloodOrbs = this.bloodOrbs.filter(o => Math.hypot(player.x - o.x, player.y - o.y) >= 8);
      
      // Tomb Magnetism and Blood Scholar XP multiplier upgrades
      let xpMultiplier = 1.0;
      if (this.state.bloodUpgrades?.xpMult) xpMultiplier += this.state.bloodUpgrades.xpMult * 0.05;
      if (this.state.accountUpgrades?.blood_scholar_1) xpMultiplier += 0.10;
      if (this.state.accountUpgrades?.blood_scholar_2) xpMultiplier += 0.20;

      const baseXP = consumedOrbs.reduce((sum, o) => sum + o.xpValue, 0);
      const xpGained = Math.round(baseXP * xpMultiplier);

      player.xp += xpGained;
      this.state.blood += consumedOrbs.length;
      this.state.runStats!.bloodEarned += consumedOrbs.length;
      this.state.lifetimeStats!.blood += consumedOrbs.length;

      this.addFloatingText(`+${xpGained} XP`, 'xp', player.x, player.y - 20);
      playVampireSound('vacuum', this.state.settings.sfxVolume);

      if (player.xp >= player.maxXp) {
        player.level += 1;
        player.xp -= player.maxXp;
        player.maxXp = player.level * 120;
        
        // Base Level Up stats (reduced, as perks provide the main power now)
        player.stats.maxHp += 5;
        player.currentHp = player.stats.maxHp;
        
        this.addFloatingText('LEVEL UP!', 'xp', player.x, player.y - 30);
        playVampireSound('levelUp', this.state.settings.sfxVolume);

        // Trigger Roguelike Card Selection
        this.state.showCardSelection = true;
        this.state.cardOptions = this.generateUpgradeCards();
      }
      uiChanged = true;
    }

    if (uiChanged) this.needsUIRender = true;
  }

  private updateBombs(dt: number) {
    if (!this.state.bombsList) return;
    const player = this.state.player;
    let uiChanged = false;

    this.state.bombsList.forEach(b => b.timer -= dt / 1000);
    const explodingBombs = this.state.bombsList.filter(b => b.timer <= 0);
    this.state.bombsList = this.state.bombsList.filter(b => b.timer > 0);

    if (explodingBombs.length > 0) {
      explodingBombs.forEach(bomb => {
        this.activeEnemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - bomb.x, enemy.y - bomb.y);
          if (dist < 60) {
            const dmg = 80;
            this.addFloatingText(`💥 ${dmg}`, 'crit', enemy.x, enemy.y - 12);
            enemy.hp = Math.max(0, enemy.hp - dmg);
            enemy.state = 'hurt';
            if (enemy.hp <= 0) this.handleEnemyDeath(enemy);
            uiChanged = true;
          }
        });

        const playerDist = Math.hypot(player.x - bomb.x, player.y - bomb.y);
        if (playerDist < 45) {
          const selfDmg = 20;
          player.currentHp = Math.max(0, player.currentHp - selfDmg);
          this.addFloatingText(`-${selfDmg}`, 'damage', player.x, player.y - 12);
          uiChanged = true;
        }

        if (this.state.grid) {
          const bombTileX = Math.floor(bomb.x / 30 + 0.5);
          const bombTileZ = Math.floor(bomb.y / 30 + 0.5);
          for (let dz = -2; dz <= 2; dz++) {
            for (let dx = -2; dx <= 2; dx++) {
              const tx = bombTileX + dx;
              const tz = bombTileZ + dz;
              if (tx >= 0 && tx < 40 && tz >= 0 && tz < 40) {
                if (this.state.grid[tz] && this.state.grid[tz][tx] === 6) {
                  this.state.grid[tz][tx] = 0;
                  this.addFloatingText('SECRET OPENED!', 'xp', tx * 30, tz * 30 - 15);
                  playVampireSound('levelUp', this.state.settings.sfxVolume);
                  uiChanged = true;
                }
              }
            }
          }
        }
      });
    }

    if (uiChanged) this.needsUIRender = true;
  }

  private updateBossState() {
    // Detect any boss enemy (e.id has boss)
    const bossEnemy = this.activeEnemies.find(e => e.id.includes('boss'));
    if (bossEnemy) {
      this.state.activeBoss = { name: bossEnemy.name, hp: bossEnemy.hp, maxHp: bossEnemy.maxHp };
      this.needsUIRender = true;
    } else if (this.state.activeBoss) {
      this.state.activeBoss = null;
      this.state.cryptCoins = (this.state.cryptCoins || 0) + 1;
      this.state.terminalLogs.push(`🏆 Defeated Boss! Gained 1 Crypt Coin.`);
      const portalTileX = Math.floor(this.state.player.x / 30 + 0.5);
      const portalTileZ = Math.floor(this.state.player.y / 30 + 0.5);
      if (this.state.grid && this.state.grid[portalTileZ]) {
        this.state.grid[portalTileZ][portalTileX] = 8;
      }
      
      const relic = generateRandomRelic(this.state.activeZone + 2);
      this.state.groundItems.push({
        id: `pedestal-boss-reward-${Date.now()}`,
        itemCategory: 'relic',
        relic,
        x: this.state.player.x + 30,
        y: this.state.player.y,
        beamAnimation: 1.0,
        isPedestal: true
      } as any);
      
      this.addFloatingText('BOSS DEFEATED!', 'xp', this.state.player.x, this.state.player.y - 30);
      playVampireSound('levelUp', this.state.settings.sfxVolume);
      this.needsUIRender = true;
    }
  }

  private checkPlayerDeath() {
    if (this.state.player.currentHp <= 0) {
      this.state.player.currentHp = this.state.player.stats.maxHp;
      this.state.player.x = 420;
      this.state.player.y = 420;
      this.state.player.targetX = undefined;
      this.state.player.targetY = undefined;
      this.state.gold = Math.max(0, this.state.gold - 50);
      this.addFloatingText('RESPAWNED', 'heal', 420, 420);
      this.needsUIRender = true;
    }
  }

  private updateProximityChests() {
    const activeChest = this.state.activeChest;
    if (activeChest && !activeChest.isOpen) {
      const dist = Math.hypot(this.state.player.x - activeChest.x, this.state.player.y - activeChest.y);
      if (dist < 25) {
        if (this.state.keys > 0) {
          this.state.keys -= 1;
          activeChest.isOpen = true;
          const relic = generateRandomRelic(this.state.activeZone + 2);
          this.state.groundItems.push({
            id: `chest-loot-${Date.now()}`,
            itemCategory: 'relic',
            relic,
            x: activeChest.x,
            y: activeChest.y + 10,
            beamAnimation: 1.0
          });
          this.addFloatingText('CHEST OPENED!', 'xp', activeChest.x, activeChest.y - 30);
          playVampireSound('levelUp', this.state.settings.sfxVolume);
          this.needsUIRender = true;
        } else {
          if (Math.random() < 0.05) {
            this.addFloatingText('REQUIRES KEY!', 'shield', this.state.player.x, this.state.player.y - 30);
          }
        }
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    if (this.state.floatingTexts) {
      this.state.floatingTexts.forEach(ft => {
        if (ft.life !== undefined) ft.life -= dt / 1000;
        ft.y -= dt * 0.05;
      });
      this.state.floatingTexts = this.state.floatingTexts.filter(ft => ft.life !== undefined && ft.life > 0);
    }
  }

  private checkAchievements() {
    if (!this.state.achievements) this.state.achievements = [];
    
    const checkAchievement = (name: string, condition: boolean, rewardRelic: any) => {
      if (condition && !this.state.achievements!.includes(name)) {
        this.state.achievements!.push(name);
        this.addFloatingText(`🏆 ${name}`, 'crit', this.state.player.x, this.state.player.y - 40);
        playVampireSound('levelUp', this.state.settings.sfxVolume);
        this.state.groundItems.push({
          id: `ach-loot-${Date.now()}-${Math.random()}`,
          itemCategory: 'relic',
          relic: rewardRelic,
          x: this.state.player.x + (Math.random() * 40 - 20),
          y: this.state.player.y + (Math.random() * 40 - 20),
          beamAnimation: 1.0
        });
        this.needsUIRender = true;
      }
    };

    checkAchievement('First Blood', this.state.lifetimeStats!.kills >= 1, { id: 'ach_1', name: 'Ring of Blood', type: 'accessory', rarity: 'epic', stats: { maxHp: 20, attack: 2 }, value: 100, icon: '29' });
    checkAchievement('Wealthy', this.state.gold >= 200, { id: 'ach_2', name: 'Golden Chalice', type: 'accessory', rarity: 'legendary', stats: { defense: 5, regen: 2 }, value: 500, icon: '30' });
    checkAchievement('Vampire Lord', this.state.player.level >= 5, { id: 'ach_3', name: 'Crown of Darkness', type: 'armor', rarity: 'legendary', stats: { attack: 15, maxHp: 50 }, value: 1000, icon: '31' });
  }

  private checkWaveEnd() {
    if (this.state.inTown) return;
    if (this.activeEnemies.filter(e => e.hp > 0).length === 0 && !this.state.activeBoss) {
      this.state.currentWave += 1;
      this.state.terminalLogs.push(`Wave ${this.state.currentWave - 1} cleared.`);
      
      if (this.state.currentWave < 10) {
        // Spawn normal wave
        const count = 3 + this.state.currentWave * 2;
        for (let i = 0; i < count; i++) {
          const typeRoll = Math.random();
          const type = typeRoll < 0.3 ? 'bat' : typeRoll < 0.7 ? 'skeleton' : 'zombie';
          const hp = type === 'zombie' ? 120 : type === 'bat' ? 25 : 45;
          const speed = type === 'bat' ? 60 : type === 'zombie' ? 20 : 40;
          
          this.activeEnemies.push({
            id: `w${this.state.currentWave}-e${i}`,
            name: type.toUpperCase(),
            type,
            hp, maxHp: hp,
            attack: 5 + this.state.currentWave * 2,
            defense: 1 + this.state.currentWave,
            speed,
            xpValue: 15 + this.state.currentWave * 2,
            goldValue: 5,
            state: 'idle',
            x: this.state.player.x + (Math.random() - 0.5) * 400,
            y: this.state.player.y + (Math.random() - 0.5) * 400
          });
        }
        this.addFloatingText(`WAVE ${this.state.currentWave}`, 'xp', this.state.player.x, this.state.player.y - 50);
      } else if (this.state.currentWave === 10) {
        // Spawn Wave 10 Boss Cinematic
        this.state.bossCinematic = { name: 'Carmilla, The Blood Queen', timer: 4.0 }; // 4 seconds cinematic
        this.state.activeBoss = { name: 'Carmilla, The Blood Queen', hp: 3000, maxHp: 3000 };
        this.state.terminalLogs.push(`CRITICAL WARNING: Blood Queen detected.`);
        
        this.activeEnemies.push({
          id: `boss-carmilla`,
          name: 'Carmilla, The Blood Queen',
          type: 'reaper',
          hp: 3000, maxHp: 3000,
          attack: 35,
          defense: 15,
          speed: 65,
          xpValue: 2000,
          goldValue: 500,
          state: 'idle',
          x: this.state.player.x,
          y: this.state.player.y - 150 // Spawns directly in front of player
        });
      }
      this.needsUIRender = true;
    }
  }

  private generateUpgradeCards() {
    const cardPool = [
      { id: 'perk_atk', type: 'stat_boost' as const, targetId: 'attack', name: 'Demon Strength', description: '+3 Attack Damage', icon: 'slash' },
      { id: 'perk_hp', type: 'stat_boost' as const, targetId: 'maxHp', name: 'Vampiric Vitality', description: '+25 Max HP', icon: 'health' },
      { id: 'perk_def', type: 'stat_boost' as const, targetId: 'defense', name: 'Bone Armor', description: '+2 Defense', icon: 'defense' },
      { id: 'perk_speed', type: 'stat_boost' as const, targetId: 'speed', name: 'Celerity', description: '+15% Move Speed', icon: 'slash' },
      { id: 'perk_crit', type: 'stat_boost' as const, targetId: 'critRate', name: 'Lethal Strike', description: '+5% Critical Hit Rate', icon: 'crit' },
      { id: 'perk_mana', type: 'stat_boost' as const, targetId: 'maxMana', name: 'Eldritch Mind', description: '+20 Max Mana', icon: 'mana' }
    ];

    // Shuffle and pick 3 unique cards
    const shuffled = cardPool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  public selectUpgradeCard(card: any) {
    if (!this.state.showCardSelection) return;

    if (card.type === 'stat_boost') {
      if (card.targetId === 'attack') this.state.player.stats.attack += 3;
      else if (card.targetId === 'maxHp') {
        this.state.player.stats.maxHp += 25;
        this.state.player.currentHp += 25;
      }
      else if (card.targetId === 'defense') this.state.player.stats.defense += 2;
      else if (card.targetId === 'speed') this.state.player.stats.speed *= 1.15;
      else if (card.targetId === 'critRate') this.state.player.stats.critRate += 0.05;
      else if (card.targetId === 'maxMana') {
        this.state.player.stats.maxMana += 20;
        this.state.player.currentMana += 20;
      }
    }

    this.state.showCardSelection = false;
    this.state.cardOptions = [];
    playVampireSound('levelUp', this.state.settings.sfxVolume);
    this.forceUIRender();
  }
}

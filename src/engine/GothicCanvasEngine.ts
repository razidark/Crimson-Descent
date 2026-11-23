import { GameState, Enemy, BloodOrb, FloatingText } from '../types/game';
import { playVampireSound } from '../hooks/useGameState';

export interface GothicCanvasEngineOptions {
  onEnemyClick?: (enemyId: string) => void;
  onItemPick?: (itemId: string) => void;
  onPlayerMove?: (x: number, y: number, direct?: boolean) => void;
  onDropBomb?: () => void;
  onUseKeyOnDoor?: (tx: number, tz: number) => void;
  onEnterPortal?: () => void;
  onOpenNPC?: (npc: 'sage' | 'blacksmith' | 'witch') => void;
  onEnterCatacombs?: () => void;
  onCastTownPortal?: () => void;
  onUseTownPortal?: () => void;
}

interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'soul';
}

interface BloodDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}

export class GothicCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: GothicCanvasEngineOptions;

  // Game State
  private state: GameState | null = null;
  private enemies: Enemy[] = [];
  private bloodOrbs: BloodOrb[] = [];
  private floatingTexts: FloatingText[] = [];

  // Rendering Loop
  private animFrameId: number | null = null;
  private lastTime = performance.now();
  private isRunning = false;

  // Camera
  private cameraX = 390;
  private cameraY = 390;
  private zoom = 1.0;
  private screenShake = 0;

  // Controls & Mouse
  private mouseWorldX = 0;
  private mouseWorldY = 0;
  private mouseScreenX = 0;
  private mouseScreenY = 0;
  private keysPressed: Record<string, boolean> = {};

  // Combat Visual FX
  private attackAnimTime = 0;
  private isSwinging = false;
  private swingAngle = 0;
  private dashTrail: { x: number; y: number; alpha: number; angle: number }[] = [];
  private particles: Particle2D[] = [];
  private bloodDecals: BloodDecal[] = [];

  // Lighting Canvas (for dynamic 2D lighting halos & dark gothic ambient)
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  // Spritesheets
  private images: Record<string, HTMLImageElement> = {};
  public imagesLoaded = false;

  constructor(canvas: HTMLCanvasElement, options: GothicCanvasEngineOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.options = options;

    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    this.loadAssets();
    this.setupEvents();
    this.resize();
  }

  private loadAssets() {
    const assets = [
      { key: 'heroes', src: '/src/assets/heroes.png' },
      { key: 'enemies', src: '/src/assets/enemies.png' },
      { key: 'levels', src: '/src/assets/levels.png' },
      { key: 'bonfire', src: '/src/assets/bonfire.png' },
      { key: 'portal', src: '/src/assets/portal.png' },
      { key: 'skills', src: '/src/assets/skills.png' },
      { key: 'relics', src: '/src/assets/relics.png' }
    ];

    let loaded = 0;
    assets.forEach(a => {
      const img = new Image();
      img.src = a.src;
      img.onload = () => {
        loaded++;
        if (loaded >= assets.length) {
          this.imagesLoaded = true;
        }
      };
      this.images[a.key] = img;
    });
  }

  private setupEvents() {
    window.addEventListener('resize', this.onResize);

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseScreenX = e.clientX - rect.left;
      this.mouseScreenY = e.clientY - rect.top;
      this.mouseWorldX = (this.mouseScreenX - this.canvas.width / 2) / this.zoom + this.cameraX;
      this.mouseWorldY = (this.mouseScreenY - this.canvas.height / 2) / this.zoom + this.cameraY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.handlePrimaryClick();
      }
    });

    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.performShadowDash();
      } else if (e.key === 'e' || e.key === 'E') {
        this.handleInteract();
      } else if (e.key === 'q' || e.key === 'Q') {
        this.triggerBloodNovaEffect();
      } else if (e.key === 'b' || e.key === 'B') {
        this.options.onDropBomb?.();
      } else if (e.key === 't' || e.key === 'T') {
        if (!this.state?.inTown) {
          this.options.onCastTownPortal?.();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  }

  private onResize = () => {
    this.resize();
  };

  private resize() {
    const parent = this.canvas.parentElement || document.body;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.lightCanvas.width = w;
      this.lightCanvas.height = h;
      
      // Calculate dynamic zoom to ensure the game feels expansive and detailed
      this.zoom = Math.max(2.2, h / 380);
    }
  }

  public updateData(
    state: GameState,
    activeEnemies: Enemy[],
    bloodOrbs: BloodOrb[],
    floatingTexts: FloatingText[]
  ) {
    this.state = state;
    this.enemies = activeEnemies;
    this.bloodOrbs = bloodOrbs;
    this.floatingTexts = floatingTexts;
  }

  public updateGraphicsQuality(_quality: string) {
    // Canvas adapts dynamically
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.onResize);
  }

  // =========================================================================
  // MAIN TICK LOOP
  // =========================================================================
  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (!this.state) return;
    const player = this.state.player;

    // 1. Smooth Camera Tracking
    const targetCamX = player.x;
    const targetCamY = player.y;
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 8);
    this.cameraY += (targetCamY - this.cameraY) * Math.min(1, dt * 8);

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // 2. Continuous Keyboard Movement
    let moveX = 0;
    let moveY = 0;
    if (this.keysPressed['w'] || this.keysPressed['arrowup']) moveY -= 1;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) moveY += 1;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) moveX -= 1;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      const speed = player.stats.speed * 35 * dt;
      const nextX = player.x + (moveX / len) * speed;
      const nextY = player.y + (moveY / len) * speed;

      // Check collision with walls if in dungeon
      if (this.isWalkable(nextX, nextY)) {
        this.options.onPlayerMove?.(nextX, nextY, true);
      }
    }

    // 3. Attack Swing Animation
    if (this.isSwinging) {
      this.attackAnimTime += dt * 8;
      if (this.attackAnimTime >= 1.0) {
        this.isSwinging = false;
        this.attackAnimTime = 0;
      }
    }

    // 4. Dash Trails decay
    for (let i = this.dashTrail.length - 1; i >= 0; i--) {
      this.dashTrail[i].alpha -= dt * 3.5;
      if (this.dashTrail[i].alpha <= 0) {
        this.dashTrail.splice(i, 1);
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.shape === 'smoke') {
        p.vy -= 15 * dt; // rise
        p.size += dt * 8;
      }
    }

    // 6. Proximity Check for HUD Interaction Banner
    this.checkProximityInteractables();
  }

  private isWalkable(x: number, y: number): boolean {
    if (!this.state) return true;
    if (this.state.inTown) {
      // In Lorek: plaza is bounds 120..660
      return x >= 150 && x <= 630 && y >= 150 && y <= 630;
    }
    const grid = this.state.grid;
    if (!grid || grid.length === 0) return true;
    const tx = Math.floor(x / 30);
    const ty = Math.floor(y / 30);
    if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) return false;
    return grid[ty][tx] === 0;
  }

  private checkProximityInteractables() {
    if (!this.state) return;
    const p = this.state.player;

    if (this.state.inTown) {
      // Check NPCs
      const distRaziel = Math.hypot(p.x - 270, p.y - 300);
      const distSmith = Math.hypot(p.x - 510, p.y - 300);
      const distWitch = Math.hypot(p.x - 300, p.y - 480);
      const distGate = Math.hypot(p.x - 390, p.y - 180);

      if (distRaziel <= 55) {
        this.state.nearbyInteractable = { id: 'sage', type: 'sage', name: 'Raziel', actionLabel: 'Speak with Raziel' };
      } else if (distSmith <= 55) {
        this.state.nearbyInteractable = { id: 'blacksmith', type: 'blacksmith', name: 'Thorne the Bloodsmith', actionLabel: 'Consult Thorne the Bloodsmith' };
      } else if (distWitch <= 55) {
        this.state.nearbyInteractable = { id: 'witch', type: 'witch', name: 'Lysandra the Witch', actionLabel: 'Browse Lysandra\'s Potions' };
      } else if (distGate <= 60) {
        this.state.nearbyInteractable = { id: 'gate', type: 'catacombs', name: 'Catacombs Gate', actionLabel: 'Descend into the Crimson Rupture' };
      } else {
        this.state.nearbyInteractable = null;
      }
    }
  }

  private handleInteract() {
    if (this.state?.nearbyInteractable) {
      playVampireSound('click', this.state.settings.sfxVolume);
      const type = this.state.nearbyInteractable.type;
      if (type === 'sage') this.options.onOpenNPC?.('sage');
      else if (type === 'blacksmith') this.options.onOpenNPC?.('blacksmith');
      else if (type === 'witch') this.options.onOpenNPC?.('witch');
      else if (type === 'catacombs') this.options.onEnterCatacombs?.();
    }
  }

  private handlePrimaryClick() {
    if (!this.state) return;
    const player = this.state.player;

    // Check if clicked an enemy directly
    const clickedEnemy = this.enemies.find(e => e.hp > 0 && Math.hypot(e.x - this.mouseWorldX, e.y - this.mouseWorldY) <= 30);
    if (clickedEnemy) {
      this.options.onEnemyClick?.(clickedEnemy.id);
      this.triggerCleaveSlash(clickedEnemy.x, clickedEnemy.y);
      return;
    }

    // Check if clicked nearby ground item
    const clickedItem = this.state.groundItems?.find(it => Math.hypot(it.x - this.mouseWorldX, it.y - this.mouseWorldY) <= 25);
    if (clickedItem) {
      this.options.onItemPick?.(clickedItem.id);
      return;
    }

    // Otherwise, perform manual Cleave Attack in mouse direction
    this.triggerCleaveSlash(this.mouseWorldX, this.mouseWorldY);

    // Hit enemies in cleave arc
    const cleaveAngle = Math.atan2(this.mouseWorldY - player.y, this.mouseWorldX - player.x);
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist <= 55) {
        const angleToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
        let diff = Math.abs(angleToEnemy - cleaveAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff <= Math.PI * 0.45) {
          this.options.onEnemyClick?.(e.id);
          this.spawnBloodDecal(e.x, e.y, 14);
        }
      }
    });
  }

  private triggerCleaveSlash(targetX: number, targetY: number) {
    if (!this.state) return;
    this.isSwinging = true;
    this.attackAnimTime = 0;
    this.swingAngle = Math.atan2(targetY - this.state.player.y, targetX - this.state.player.x);
    playVampireSound('whip', this.state.settings.sfxVolume);
  }

  private performShadowDash() {
    if (!this.state) return;
    const player = this.state.player;
    if ((player.dashCooldownLeft || 0) > 0) return;

    player.dashCooldownLeft = 3.0;
    playVampireSound('dash', this.state.settings.sfxVolume);

    // Leave afterimage trail
    const angle = Math.atan2(this.mouseWorldY - player.y, this.mouseWorldX - player.x);
    const dist = 90;
    for (let s = 0; s < 4; s++) {
      this.dashTrail.push({
        x: player.x + Math.cos(angle) * (dist * (s / 4)),
        y: player.y + Math.sin(angle) * (dist * (s / 4)),
        alpha: 0.85,
        angle
      });
    }

    // Teleport player forward safely
    const targetX = player.x + Math.cos(angle) * dist;
    const targetY = player.y + Math.sin(angle) * dist;
    if (this.isWalkable(targetX, targetY)) {
      this.options.onPlayerMove?.(targetX, targetY, true);
    }
  }

  public triggerBloodNovaEffect() {
    if (!this.state) return;
    const p = this.state.player;
    this.screenShake = 12;
    playVampireSound('break', this.state.settings.sfxVolume);

    // Spawn outward flying blood sparks
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const spd = 120 + Math.random() * 80;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: i % 2 === 0 ? '#ef4444' : '#b91c1c',
        size: 3 + Math.random() * 3,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        shape: 'spark'
      });
    }
  }

  private spawnBloodDecal(x: number, y: number, radius = 12) {
    this.bloodDecals.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      radius: radius * (0.8 + Math.random() * 0.4),
      color: Math.random() > 0.4 ? '#450a0a' : '#7f1d1d',
      opacity: 0.65
    });
    if (this.bloodDecals.length > 80) this.bloodDecals.shift();
  }

  // =========================================================================
  // RENDERING PIPELINE
  // =========================================================================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
    }

    // 1. Clear background (Pitch dark gothic void)
    ctx.fillStyle = '#060308';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Center camera on player
    ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 2. Draw World Floor & Permanent Blood Decals
    if (this.state?.inTown) {
      this.renderTownFloor(ctx);
    } else {
      this.renderDungeonFloor(ctx);
    }

    // Draw Blood Decals on stone
    this.bloodDecals.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Draw Environment Structures (Town buildings, props, arches)
    if (this.state?.inTown) {
      this.renderTownStructures(ctx);
    } else {
      this.renderDungeonWalls(ctx);
    }

    // 4. Draw Ground Items & Blood Orbs
    this.renderGroundItems(ctx);
    this.renderBloodOrbs(ctx);

    // 5. Draw Dash Ghost Trails
    this.dashTrail.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-12, -18, 24, 36);
      ctx.restore();
    });

    // 6. Draw Enemies
    this.renderEnemies(ctx);

    // 7. Draw Player Character
    this.renderPlayer(ctx);

    // 8. Draw Weapon Slash Arc
    if (this.isSwinging) {
      this.renderSlashEffect(ctx);
    }

    // 9. Draw Particles (Sparks, Smoke, Nova)
    this.renderParticles(ctx);

    // 10. Draw Floating Damage & Heal Numbers
    this.renderFloatingTexts(ctx);

    ctx.restore();

    // 11. DYNAMIC GOTHIC LIGHTING PASS (Canvas Dark Vignette & Multi-Light Halos)
    this.renderLightingPass(w, h);
  }

  // =========================================================================
  // THE HAMLET OF LOREK (2D ENVIRONMENT & BUILDINGS)
  // =========================================================================
  private renderTownFloor(ctx: CanvasRenderingContext2D) {
    // Cobblestone Plaza (Center around 390, 390) - Expanded boundaries
    const minX = -100;
    const maxX = 880;
    const minY = -100;
    const maxY = 880;

    // Dark earth underlay
    ctx.fillStyle = '#0a080a';
    ctx.fillRect(minX - 100, minY - 100, (maxX - minX) + 200, (maxY - minY) + 200);

    // Cobblestone Paver Grid
    const tileSize = 32;
    for (let y = minY; y <= maxY; y += tileSize) {
      for (let x = minX; x <= maxX; x += tileSize) {
        const isOffset = (Math.floor(y / tileSize) % 2 === 1);
        const drawX = isOffset ? x + tileSize / 2 : x;
        const noise = Math.sin(x * 12.3 + y * 7.7) * Math.cos(x * 4.1 + y * 9.3);

        const tileGrad = ctx.createLinearGradient(drawX, y, drawX + tileSize, y + tileSize);
        if (noise > 0.3) {
          tileGrad.addColorStop(0, '#2d2429'); tileGrad.addColorStop(1, '#1f181c');
        } else if (noise < -0.3) {
          tileGrad.addColorStop(0, '#211a1f'); tileGrad.addColorStop(1, '#151014');
        } else {
          tileGrad.addColorStop(0, '#271f24'); tileGrad.addColorStop(1, '#1b1419');
        }
        
        ctx.fillStyle = tileGrad;
        ctx.beginPath();
        ctx.roundRect(drawX + 1, y + 1, tileSize - 2, tileSize - 2, 3);
        ctx.fill();
        
        ctx.strokeStyle = '#050405';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Ornate Sacred Stone Ring around Central Fountain (390, 390)
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 15;
    
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(390, 390, 68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(390, 390, 73, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(390, 390, 63, 0, Math.PI * 2);
    ctx.stroke();
    
    // Blood Runes on the ring
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    for(let i=0; i<8; i++) {
      const angle = (i/8) * Math.PI * 2;
      ctx.fillText('▼', 390 + Math.cos(angle)*68, 390 + Math.sin(angle)*68);
    }
    
    ctx.restore();
  }

  private renderTownStructures(ctx: CanvasRenderingContext2D) {
    const t = performance.now();

    // 1. Central Blood Well (390, 390)
    ctx.save();
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(390, 390, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Swirling Crimson Blood in basin
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(390, 390, 18, 0, Math.PI * 2);
    ctx.fill();

    // Gargoyle center column
    ctx.fillStyle = '#27272a';
    ctx.fillRect(386, 376, 8, 28);
    ctx.restore();

    // 2. The Roaring Campfire (300, 330)
    ctx.save();
    // Fire ring stones
    ctx.fillStyle = '#52525b';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(300 + Math.cos(a) * 16, 330 + Math.sin(a) * 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Burning logs
    ctx.fillStyle = '#29180c';
    ctx.fillRect(292, 326, 16, 8);
    // Flickering Flame
    const flicker = Math.sin(t / 100) * 3;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(300, 330, 9 + flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(300, 330, 5 + flicker * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. NPC: Raziel (The Spectral Patriarch / Sage) at (270, 300)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath();
    ctx.ellipse(270, 308, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const lecternGrad = ctx.createLinearGradient(282, 290, 296, 306);
    lecternGrad.addColorStop(0, '#475569'); lecternGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = lecternGrad;
    ctx.beginPath(); ctx.roundRect(280, 288, 18, 20, 2); ctx.fill();
    
    ctx.fillStyle = '#0ea5e9';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillRect(282, 284, 14, 8);
    ctx.shadowBlur = 0;

    const razielGrad = ctx.createLinearGradient(270, 270, 270, 306);
    razielGrad.addColorStop(0, '#0c4a6e');
    razielGrad.addColorStop(1, '#020617');
    ctx.fillStyle = razielGrad;
    ctx.beginPath();
    ctx.moveTo(270, 270);
    ctx.quadraticCurveTo(258, 290, 260, 306);
    ctx.lineTo(280, 306);
    ctx.quadraticCurveTo(282, 290, 270, 270);
    ctx.fill();

    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(270, 268, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7dd3fc';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.fillRect(266, 266, 3, 2);
    ctx.fillRect(271, 266, 3, 2);
    ctx.shadowBlur = 0;

    const bladePulse = Math.sin(t / 150) * 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(274, 282);
    ctx.lineTo(290 + bladePulse, 272);
    ctx.stroke();
    ctx.shadowBlur = 0;

    this.renderNPCNameTag(ctx, 'Raziel', 270, 250, '#38bdf8');
    ctx.restore();

    // 4. NPC: Thorne the Bloodsmith at (510, 300)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath();
    ctx.ellipse(510, 308, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const forgeGrad = ctx.createLinearGradient(524, 280, 550, 312);
    forgeGrad.addColorStop(0, '#292524'); forgeGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = forgeGrad;
    ctx.beginPath(); ctx.roundRect(522, 278, 30, 34, 4); ctx.fill();
    
    ctx.fillStyle = '#ea580c';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 15;
    ctx.fillRect(526, 290, 22, 14);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(490, 296); ctx.lineTo(510, 296);
    ctx.lineTo(508, 308); ctx.lineTo(492, 308);
    ctx.fill();
    
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.fillRect(492, 293, 14, 4);
    ctx.shadowBlur = 0;

    const thorneGrad = ctx.createLinearGradient(504, 284, 504, 306);
    thorneGrad.addColorStop(0, '#78350f'); thorneGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = thorneGrad;
    ctx.beginPath();
    ctx.roundRect(500, 282, 18, 24, 4);
    ctx.fill();
    
    ctx.fillStyle = '#292524';
    ctx.fillRect(502, 286, 14, 20);
    
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.arc(509, 276, 7.5, 0, Math.PI * 2);
    ctx.fill();

    this.renderNPCNameTag(ctx, 'Thorne', 510, 256, '#f59e0b');
    ctx.restore();

    // 5. NPC: Lysandra the Witch at (300, 480)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath();
    ctx.ellipse(300, 488, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const cauldronGrad = ctx.createRadialGradient(284, 482, 2, 284, 482, 14);
    cauldronGrad.addColorStop(0, '#3f3f46'); cauldronGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = cauldronGrad;
    ctx.beginPath();
    ctx.arc(284, 482, 14, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(284, 478, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#3b0764';
    ctx.beginPath(); ctx.roundRect(310, 472, 24, 18, 2); ctx.fill();
    
    ctx.fillStyle = '#ef4444'; ctx.fillRect(313, 466, 4, 8);
    ctx.fillStyle = '#06b6d4'; ctx.fillRect(320, 466, 4, 8);
    ctx.fillStyle = '#a855f7'; ctx.fillRect(327, 466, 4, 8);

    const witchGrad = ctx.createLinearGradient(300, 460, 300, 486);
    witchGrad.addColorStop(0, '#6b21a8'); witchGrad.addColorStop(1, '#3b0764');
    ctx.fillStyle = witchGrad;
    ctx.beginPath();
    ctx.moveTo(300, 456);
    ctx.quadraticCurveTo(288, 470, 290, 486);
    ctx.lineTo(310, 486);
    ctx.quadraticCurveTo(312, 470, 300, 456);
    ctx.fill();

    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.ellipse(300, 456, 12, 3.5, 0, 0, Math.PI * 2); 
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(300, 436);
    ctx.lineTo(292, 456);
    ctx.lineTo(308, 456);
    ctx.fill();

    this.renderNPCNameTag(ctx, 'Lysandra', 300, 424, '#c084fc');
    ctx.restore();

    // 6. The Catacombs Rupture Archway (390, 180)
    ctx.save();
    // Left & Right Stone Pillars
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(362, 150, 12, 48);
    ctx.fillRect(406, 150, 12, 48);
    // Top Arch Lintel
    ctx.fillRect(356, 142, 68, 14);

    // Swirling Purple Abyss Vortex
    const vortexScale = 1 + Math.sin(t / 200) * 0.08;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.75)';
    ctx.beginPath();
    ctx.ellipse(390, 174, 18 * vortexScale, 24 * vortexScale, 0, 0, Math.PI * 2);
    ctx.fill();

    this.renderNPCNameTag(ctx, 'The Crimson Rupture [E]', 390, 128, '#e879f9');
    ctx.restore();
  }

  private renderNPCNameTag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
    ctx.font = 'bold 11px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';

    // Black text glow
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(text, x + 1, y + 1);
    ctx.fillText(text, x - 1, y - 1);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // =========================================================================
  // PROCEDURAL CATACOMBS DUNGEON RENDERING
  // =========================================================================
  private renderDungeonFloor(ctx: CanvasRenderingContext2D) {
    if (!this.state?.grid) return;
    const grid = this.state.grid;
    const ts = 30;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0) {
          // Walkable stone floor
          const x = c * ts;
          const y = r * ts;
          const noise = Math.sin(c * 9.1 + r * 5.7);

          ctx.fillStyle = noise > 0.3 ? '#1f1924' : noise < -0.3 ? '#17121b' : '#1b1520';
          ctx.fillRect(x, y, ts, ts);

          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, ts, ts);
        }
      }
    }
  }

  private renderDungeonWalls(ctx: CanvasRenderingContext2D) {
    if (!this.state?.grid) return;
    const grid = this.state.grid;
    const ts = 30;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 1) {
          // Only render wall if it's adjacent to a floor (save performance and outline properly)
          const hasFloorNeighbor =
            (r > 0 && grid[r - 1][c] === 0) ||
            (r < grid.length - 1 && grid[r + 1][c] === 0) ||
            (c > 0 && grid[r][c - 1] === 0) ||
            (c < grid[0].length - 1 && grid[r][c + 1] === 0);

          if (hasFloorNeighbor) {
            const x = c * ts;
            const y = r * ts;

            // 3D-Shaded Wall Front
            ctx.fillStyle = '#0f0b14';
            ctx.fillRect(x, y, ts, ts);

            // Top rim highlight
            ctx.fillStyle = '#261e30';
            ctx.fillRect(x, y, ts, 4);

            // Carved stone brick lines
            ctx.strokeStyle = '#050308';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, ts, ts);
          }
        }
      }
    }
  }

  // =========================================================================
  // CHARACTERS, ENEMIES & PROPS
  // =========================================================================
  private renderPlayer(ctx: CanvasRenderingContext2D) {
    if (!this.state) return;
    const p = this.state.player;
    const isFacingLeft = (this.mouseWorldX < p.x);

    ctx.save();
    ctx.translate(p.x, p.y);

    // Glowing vampiric aura underneath
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
    aura.addColorStop(0, 'rgba(220, 38, 38, 0.45)');
    aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Deep Character Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isFacingLeft) ctx.scale(-1, 1);

    // Dynamic Flowing Crimson Cape
    const capeGrad = ctx.createLinearGradient(-12, -10, 12, 16);
    capeGrad.addColorStop(0, '#7f1d1d');
    capeGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = capeGrad;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.quadraticCurveTo(-18, 6, -14, 18);
    ctx.quadraticCurveTo(-2, 16, 4, 18);
    ctx.quadraticCurveTo(8, 6, 8, -6);
    ctx.fill();

    // Gothic Armor Plate Body
    const armorGrad = ctx.createLinearGradient(-8, -12, 8, 10);
    armorGrad.addColorStop(0, '#52525b');
    armorGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = armorGrad;
    ctx.beginPath();
    ctx.roundRect(-9, -10, 18, 20, 4);
    ctx.fill();
    
    // Extruded Gold Trim
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-9, -10, 18, 20, 4);
    ctx.stroke();

    // Ruby Core Emblem
    const rubyGrad = ctx.createRadialGradient(0, -3, 0, 0, -3, 4);
    rubyGrad.addColorStop(0, '#f87171');
    rubyGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = rubyGrad;
    ctx.beginPath();
    ctx.arc(0, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cowled Head
    const hoodGrad = ctx.createLinearGradient(-8, -20, 8, -8);
    hoodGrad.addColorStop(0, '#18181b');
    hoodGrad.addColorStop(1, '#000000');
    ctx.fillStyle = hoodGrad;
    ctx.beginPath();
    ctx.arc(0, -14, 7.5, Math.PI, Math.PI * 2);
    ctx.lineTo(6, -8);
    ctx.lineTo(-6, -8);
    ctx.closePath();
    ctx.fill();

    // Spectral Cyan Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(2.5, -15, 2.5, 2);
    ctx.fillRect(-2.5, -15, 2.5, 2);
    ctx.shadowBlur = 0;

    // Majestic Greatsword (Bloodcleaver)
    ctx.save();
    ctx.translate(10, -2);
    if (this.isSwinging) {
      const swingProgress = Math.sin(this.attackAnimTime * Math.PI);
      ctx.rotate(swingProgress * 2.2 - 0.6);
    } else {
      ctx.rotate(0.25); // Rest position
    }
    
    // Hilt & Pommel
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-2, 0, 4, 7);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(0, 8, 2.5, 0, Math.PI*2); ctx.fill();

    // Gold Crossguard
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.roundRect(-6, -3, 12, 3, 1); ctx.fill();

    // Steel Blade with Fuller
    const bladeGrad = ctx.createLinearGradient(0, -3, 0, -28);
    bladeGrad.addColorStop(0, '#94a3b8');
    bladeGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.lineTo(-1.5, -28);
    ctx.lineTo(0, -32);
    ctx.lineTo(1.5, -28);
    ctx.lineTo(3, -3);
    ctx.fill();
    
    // Glowing Blood Runes
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.fillRect(-0.5, -24, 1, 16);
    ctx.shadowBlur = 0;
    
    ctx.restore();
    ctx.restore();
  }

  private renderSlashEffect(ctx: CanvasRenderingContext2D) {
    if (!this.state) return;
    const p = this.state.player;
    const progress = this.attackAnimTime;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(this.swingAngle);

    const arcStart = -Math.PI * 0.45 + progress * 0.3;
    const arcEnd = Math.PI * 0.45;
    const radius = 42;

    ctx.beginPath();
    ctx.arc(0, 0, radius, arcStart, arcEnd);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, arcStart, arcEnd);
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;

      ctx.save();
      ctx.translate(e.x, e.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Monster depending on type
      switch (e.type) {
        case 'bat':
          this.renderBatEnemy(ctx);
          break;
        case 'skeleton':
          this.renderSkeletonEnemy(ctx);
          break;
        case 'reaper':
          this.renderReaperEnemy(ctx, e.name.toLowerCase().includes('queen') || e.maxHp > 300);
          break;
        default:
          this.renderZombieEnemy(ctx);
          break;
      }

      // Monster Mini Health Bar
      if (e.hp < e.maxHp) {
        const barW = 26;
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-barW / 2, -22, barW, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -22, barW * hpPct, 4);
      }

      ctx.restore();
    });
  }

  private renderBatEnemy(ctx: CanvasRenderingContext2D) {
    const t = performance.now();
    const wingY = Math.sin(t / 80) * 6;

    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-16, -wingY);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(16, -wingY);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    // Red Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -2, 2, 2);
    ctx.fillRect(1, -2, 2, 2);
  }

  private renderSkeletonEnemy(ctx: CanvasRenderingContext2D) {
    // Ribcage & skull
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2); // skull
    ctx.fill();

    ctx.fillRect(-3, -4, 6, 12); // spine
    for (let r = 0; r < 3; r++) {
      ctx.fillRect(-7, -2 + r * 3, 14, 1.5); // ribs
    }

    // Eye sockets
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-2, -11, 1.5, 2);
    ctx.fillRect(1, -11, 1.5, 2);

    // Rusted Sword
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8, -12, 2, 16);
  }

  private renderZombieEnemy(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#166534';
    ctx.fillRect(-6, -6, 12, 16);
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderReaperEnemy(ctx: CanvasRenderingContext2D, isBoss: boolean) {
    const scale = isBoss ? 1.6 : 1.0;
    ctx.scale(scale, scale);

    // Black Hooded Cowl
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-12, 10);
    ctx.lineTo(12, 10);
    ctx.closePath();
    ctx.fill();

    // Red Soul Glow Inside Hood
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-2, -10, 4, 3);

    // Scythe Blade
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(14, -22);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(14, -22, 12, 0, Math.PI * 0.6);
    ctx.fill();
  }

  private renderBloodOrbs(ctx: CanvasRenderingContext2D) {
    const t = performance.now();
    this.bloodOrbs.forEach(b => {
      const bob = Math.sin(t / 150 + b.x) * 3;
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y + bob, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(b.x - 1, b.y + bob - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderGroundItems(ctx: CanvasRenderingContext2D) {
    if (!this.state?.groundItems) return;
    this.state.groundItems.forEach(it => {
      ctx.save();
      // Light Pillar Beam
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(it.x - 4, it.y - 30, 8, 30);

      // Icon Token
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(it.x, it.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 1 - (p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 12px Cinzel, Georgia, serif';
      ctx.textAlign = 'center';

      let color = '#ffffff';
      if (ft.type === 'crit') color = '#fbbf24';
      else if (ft.type === 'heal') color = '#22c55e';
      else if (ft.type === 'damage') color = '#f87171';

      // Outline
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);

      ctx.fillStyle = color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  // =========================================================================
  // DYNAMIC 2D LIGHTING & VIGNETTE PASS
  // =========================================================================
  private renderLightingPass(w: number, h: number) {
    const lctx = this.lightCtx;
    lctx.clearRect(0, 0, w, h);

    // Deep gothic darkness base (vignette ambient)
    lctx.fillStyle = 'rgba(4, 2, 6, 0.88)';
    lctx.fillRect(0, 0, w, h);

    // Use 'destination-out' to punch warm lighting holes into the darkness
    lctx.globalCompositeOperation = 'destination-out';

    const screenPlayerX = ((this.state?.player.x ?? 0) - this.cameraX) * this.zoom + w / 2;
    const screenPlayerY = ((this.state?.player.y ?? 0) - this.cameraY) * this.zoom + h / 2;

    // 1. Player Torchlight Aura
    this.drawLightHole(lctx, screenPlayerX, screenPlayerY, 180 * this.zoom, 0.95);

    if (this.state?.inTown) {
      // 2. Central Campfire Glow (300, 330)
      const fireSX = (300 - this.cameraX) * this.zoom + w / 2;
      const fireSY = (330 - this.cameraY) * this.zoom + h / 2;
      this.drawLightHole(lctx, fireSX, fireSY, 220 * this.zoom, 0.98);

      // 3. Raziel's Spectral Blue Glow (270, 300)
      const razielSX = (270 - this.cameraX) * this.zoom + w / 2;
      const razielSY = (300 - this.cameraY) * this.zoom + h / 2;
      this.drawLightHole(lctx, razielSX, razielSY, 130 * this.zoom, 0.85);

      // 4. Thorne's Forge Glow (510, 300)
      const forgeSX = (510 - this.cameraX) * this.zoom + w / 2;
      const forgeSY = (300 - this.cameraY) * this.zoom + h / 2;
      this.drawLightHole(lctx, forgeSX, forgeSY, 140 * this.zoom, 0.85);

      // 5. Lysandra's Cauldron Glow (300, 480)
      const witchSX = (300 - this.cameraX) * this.zoom + w / 2;
      const witchSY = (480 - this.cameraY) * this.zoom + h / 2;
      this.drawLightHole(lctx, witchSX, witchSY, 120 * this.zoom, 0.85);

      // 6. Catacombs Rupture Vortex (390, 180)
      const gateSX = (390 - this.cameraX) * this.zoom + w / 2;
      const gateSY = (180 - this.cameraY) * this.zoom + h / 2;
      this.drawLightHole(lctx, gateSX, gateSY, 160 * this.zoom, 0.9);
    }

    lctx.globalCompositeOperation = 'source-over';

    // Draw the lighting layer over the game canvas
    this.ctx.drawImage(this.lightCanvas, 0, 0);
  }

  private drawLightHole(
    lctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    intensity: number
  ) {
    const grad = lctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    grad.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.6})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    lctx.fillStyle = grad;
    lctx.beginPath();
    lctx.arc(x, y, radius, 0, Math.PI * 2);
    lctx.fill();
  }
}

export default GothicCanvasEngine;

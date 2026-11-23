import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

import { GameState, Enemy, GroundItem, Chest, BloodOrb, FloatingText } from '../types/game';
import { playVampireSound } from '../hooks/useGameState';
import { DungeonGenerator, ThemeColors } from './DungeonGenerator';
import { VampireModel } from './VampireModel';
import { EnemyRenderer } from './EnemyRenderer';
import { ParticleManager } from './ParticleManager';

interface EngineOptions {
  onEnemyClick?: (enemyId: string) => void;
  onChestClick?: (chestId: string) => void;
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

export class DarknessEngine {
  private canvas: HTMLCanvasElement;
  private active: boolean = false;
  private animationFrameId: number = 0;
  private lastTime: number = 0;

  // Options & Callbacks
  private options: EngineOptions;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private gtaoPass?: GTAOPass;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Lighting & Raytraced Effects
  private playerLight!: THREE.PointLight;
  private playerSelfLight!: THREE.PointLight; // Dedicated character illumination
  private torchLights: THREE.PointLight[] = [];
  private lightningGroup = new THREE.Group();
  private lightningLight!: THREE.PointLight;
  private activeLightningBolts: {
    mesh: THREE.Group;
    lightIntensity: number;
    life: number;
    maxLife: number;
  }[] = [];
  private nextAmbientLightningTime: number = 8;

  // Audio
  private bgMusic: HTMLAudioElement | null = null;

  // Game Data
  private state: GameState | null = null;
  private enemies: Enemy[] = [];
  private groundItems: GroundItem[] = [];
  private activeChest: Chest | null = null;
  private lastHitStop: number = 0;

  // Visuals
  private lastMana: number | undefined = undefined;

  // Dungeon Map Grid
  private tileSize = 30;
  private mapWidth = 40;
  private mapHeight = 40;
  private grid: number[][] = []; // 0 = floor, 1 = wall, 2 = pillar
  private wallTorches: { x: number; z: number; animOffset: number }[] = [];

  // Player Model & Animation References
  private vampireModel!: VampireModel;
  private playerMesh!: THREE.Group;

  private playerFacingAngle = 0; // Smoothly lerped facing angle
  private attackAnimTime = 0;
  private isSwinging = false;
  private attackDuration = 0.45; // 450ms swing duration

  // Direct Keyboard Movement State
  private keysPressed: { [key: string]: boolean } = {};

  // Camera Mode State (Diablo Isometric vs. Skyrim Third Person vs. Minecraft First Person)
  private cameraMode: 'isometric' | 'thirdperson' | 'firstperson' = 'isometric';
  private cameraPitch = -0.15; // Vertical tilt for mouse look

  // Camera Orbit Rotation
  private cameraAngle = Math.PI / 4;
  private cameraAngleTarget = Math.PI / 4;
  private orbitRadius = 145;
  private orbitRadiusTarget = 145;
  private cameraShakeIntensity = 0;

  // Theme configuration based on Floor (Zone)
  private currentTheme!: ThemeColors;

  // Subsystem Managers
  private particleManager!: ParticleManager;
  private enemyRenderer!: EnemyRenderer;

  // 3D Meshes Cache
  private wallGroup = new THREE.Group();
  private pillarGroup = new THREE.Group();
  private floorMesh!: THREE.Mesh;
  private itemMeshes = new Map<string, THREE.Group>();
  private bombMeshes = new Map<string, THREE.Mesh>();
  private chestMesh: THREE.Group | null = null;

  // Breakable Barrels & Pottery Urns
  private barrelMeshes = new Map<string, THREE.Mesh>();
  private barrelsList: { id: string; x: number; z: number; isBroken: boolean; isUrn?: boolean }[] = [];

  // Spacebar Shadow Dash State
  private dashCooldown = 0;
  private dashCooldownMax = 1.25;
  private isDashing = false;
  private dashTimeRemaining = 0;
  private dashDuration = 0.22;
  private dashDirX = 0;
  private dashDirZ = 0;
  private afterimages: { group: THREE.Group; life: number; maxLife: number; materials: THREE.Material[] }[] = [];
  private lastAfterimageSpawn = 0;

  // 3D Crescent Greatsword Slash Arc
  private slashArcGroup = new THREE.Group();
  private slashArcOuterMesh!: THREE.Mesh;
  private slashArcInnerMesh!: THREE.Mesh;

  // Persistent Floor Blood Decals
  private floorBloodDecals: { group: THREE.Group; life: number }[] = [];

  // Smooth Camera Lookahead
  private camLookX = 0;
  private camLookZ = 0;
  private prevPlayerX = 0;
  private prevPlayerY = 0;
  private playerVelX = 0;
  private playerVelZ = 0;

  // Town Hub 3D Objects & NPCs
  private townObjects?: any;

  // Swaying ceiling decorations
  private swayingChains: THREE.Group[] = [];

  // Screen Flash
  private flashOverlay!: THREE.Mesh;
  private flashAlpha = 0;
  private flashColor = new THREE.Color('#ff0000');

  private consumablesTexture?: THREE.Texture;
  private consumablesMaterial?: THREE.SpriteMaterial;

  constructor(canvas: HTMLCanvasElement, options: EngineOptions = {}) {
    this.canvas = canvas;
    this.options = options;

    this.initThemePreset(0);
    this.initThree();

    this.particleManager = new ParticleManager(this.scene);
    this.enemyRenderer = new EnemyRenderer(this.scene);
    this.vampireModel = new VampireModel();
    this.playerMesh = this.vampireModel.group;
    this.scene.add(this.playerMesh);

    this.setupInput();

    window.addEventListener('resize', this.handleResize);
  }

  private initThemePreset(zoneIndex: number) {
    const themesList = [
      { floorBase: '#1f222b', wallBase: '#2a3547', puddle: '#0e7490', torch: '#38bdf8', ambient: '#2c354a' },
      { floorBase: '#161d1a', wallBase: '#23302b', puddle: '#15803d', torch: '#22c55e', ambient: '#203029' },
      { floorBase: '#2b0c13', wallBase: '#3b0413', puddle: '#701a75', torch: '#c084fc', ambient: '#3a1c2f' },
      { floorBase: '#1a050a', wallBase: '#140104', puddle: '#b91c1c', torch: '#ef4444', ambient: '#2d0f14' },
      { floorBase: '#08060a', wallBase: '#130d1d', puddle: '#ca8a04', torch: '#fbbf24', ambient: '#251531' }
    ];
    this.currentTheme = themesList[Math.min(zoneIndex, themesList.length - 1)];
  }

  private handleResize = () => {
    this.resize();
  };

  public resize() {
    const w = this.canvas.parentElement?.clientWidth || 1050;
    const h = this.canvas.parentElement?.clientHeight || 400;
    this.renderer.setSize(w, h, false);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
    if (this.gtaoPass) {
      this.gtaoPass.setSize(w, h);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private initThree() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Photorealistic ACES Filmic Tone Mapping for cinematic lighting curves
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = null;
    
    this.camera = new THREE.PerspectiveCamera(25, w / h, 10, 2500);
    this.scene.fog = new THREE.Fog('#060408', 250, 700);

    const ambientLight = new THREE.AmbientLight(this.currentTheme.ambient, 4.8);
    this.scene.add(ambientLight);

    this.playerLight = new THREE.PointLight('#ff9d5c', 95.0, 500, 1.1);
    this.playerLight.castShadow = true;
    this.playerLight.shadow.mapSize.width = 512;
    this.playerLight.shadow.mapSize.height = 512;
    this.playerLight.shadow.bias = -0.003;
    this.scene.add(this.playerLight);

    this.playerSelfLight = new THREE.PointLight('#ffeedd', 8.5, 100, 1.0);
    this.scene.add(this.playerSelfLight);

    // Dynamic Lightning Point Light & Group
    this.lightningLight = new THREE.PointLight('#67e8f9', 0, 850, 1.2);
    this.lightningLight.castShadow = true;
    this.lightningLight.shadow.mapSize.width = 512;
    this.lightningLight.shadow.mapSize.height = 512;
    this.lightningLight.shadow.bias = -0.002;
    this.scene.add(this.lightningLight);
    this.scene.add(this.lightningGroup);

    const flashGeo = new THREE.PlaneGeometry(2000, 2000);
    const flashMat = new THREE.MeshBasicMaterial({
      color: this.flashColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false
    });
    this.flashOverlay = new THREE.Mesh(flashGeo, flashMat);
    this.flashOverlay.position.set(0, 0, -10);
    this.camera.add(this.flashOverlay);
    this.scene.add(this.camera);

    // Setup Post-Processing Composer with GTAO & UnrealBloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Ground-Truth Ambient Occlusion (GTAO) - Screen-Space Raymarched Contact Shadows
    try {
      this.gtaoPass = new GTAOPass(this.scene, this.camera, w, h);
      this.gtaoPass.output = GTAOPass.OUTPUT.Default;
      this.gtaoPass.blendIntensity = 1.0;
      this.composer.addPass(this.gtaoPass);
    } catch (e) {
      console.warn('GTAOPass initialization fallback:', e);
    }
    
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.85, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);
    
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    const texLoader = new THREE.TextureLoader();
    this.consumablesTexture = texLoader.load('./src/assets/consumables.png');
    this.consumablesTexture.magFilter = THREE.NearestFilter;
    this.consumablesTexture.minFilter = THREE.NearestFilter;
    this.consumablesMaterial = new THREE.SpriteMaterial({ map: this.consumablesTexture, transparent: true });

    // 3D Crescent Greatsword Slash Arc Mesh (visceral blood cleave)
    this.slashArcGroup = new THREE.Group();
    this.slashArcGroup.visible = false;

    const outerGeo = new THREE.RingGeometry(11, 28, 42, 1, -Math.PI * 0.45, Math.PI * 0.9);
    const outerMat = new THREE.MeshBasicMaterial({
      color: '#dc2626',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.slashArcOuterMesh = new THREE.Mesh(outerGeo, outerMat);
    this.slashArcGroup.add(this.slashArcOuterMesh);

    const innerGeo = new THREE.RingGeometry(22, 27, 42, 1, -Math.PI * 0.38, Math.PI * 0.76);
    const innerMat = new THREE.MeshBasicMaterial({
      color: '#ffedd5',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.slashArcInnerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.slashArcGroup.add(this.slashArcInnerMesh);

    this.scene.add(this.slashArcGroup);
  }

  public updateGraphicsQuality(quality: 'low' | 'med' | 'high') {
    if (!this.renderer) return;

    if (quality === 'low') {
      this.renderer.shadowMap.enabled = false;
      if (this.bloomPass) this.bloomPass.strength = 0;
      if (this.gtaoPass) this.gtaoPass.enabled = false;
    } else if (quality === 'med') {
      this.renderer.shadowMap.enabled = true;
      this.playerLight.shadow.mapSize.width = 512;
      this.playerLight.shadow.mapSize.height = 512;
      if (this.bloomPass) this.bloomPass.strength = 0.5;
      if (this.gtaoPass) {
        this.gtaoPass.enabled = true;
        this.gtaoPass.blendIntensity = 0.65;
      }
    } else {
      this.renderer.shadowMap.enabled = true;
      this.playerLight.shadow.mapSize.width = 1024;
      this.playerLight.shadow.mapSize.height = 1024;
      if (this.bloomPass) this.bloomPass.strength = 0.95;
      if (this.gtaoPass) {
        this.gtaoPass.enabled = true;
        this.gtaoPass.blendIntensity = 1.15;
      }
    }
    
    if (this.playerLight.shadow.map) {
      this.playerLight.shadow.map.dispose();
      this.playerLight.shadow.map = null as any;
    }
  }

  private generateDungeon() {
    this.wallGroup.clear();
    this.pillarGroup.clear();
    if (this.floorMesh) {
      this.scene.remove(this.floorMesh);
    }
    if (this.chestMesh) {
      this.scene.remove(this.chestMesh);
    }
    this.bombMeshes.forEach(mesh => this.scene.remove(mesh));
    this.bombMeshes.clear();

    if (this.townObjects) {
      if (this.townObjects.npcs) {
        this.townObjects.npcs.forEach((n: any) => this.scene.remove(n.mesh));
      }
      if (this.townObjects.catacombsGate) this.scene.remove(this.townObjects.catacombsGate.mesh);
      if (this.townObjects.bloodFountain) this.scene.remove(this.townObjects.bloodFountain.mesh);
      if (this.townObjects.campfire) this.scene.remove(this.townObjects.campfire.mesh);
      if (this.townObjects.townPortalMesh) this.scene.remove(this.townObjects.townPortalMesh);
      this.townObjects = undefined;
    }

    const data = this.state?.inTown
      ? DungeonGenerator.generateTown(this.scene, this.tileSize, this.state.townPortal)
      : DungeonGenerator.generateDungeon(
          this.scene,
          this.tileSize,
          this.mapWidth,
          this.mapHeight,
          this.state ? this.state.activeZone : 0,
          this.activeChest,
          this.state?.grid || [],
          this.state?.roomsList || []
        );

    this.grid = data.grid;
    this.swayingChains = data.swayingChains;
    this.barrelMeshes = data.barrelMeshes;
    this.barrelsList = data.barrelsList;
    this.wallTorches = data.wallTorches;
    this.torchLights = data.torchLights;
    this.chestMesh = data.chestMesh;
    this.wallGroup = data.wallGroup;
    this.pillarGroup = data.pillarGroup;
    this.floorMesh = data.floorMesh;
    this.townObjects = data.townObjects;

    this.scene.add(this.wallGroup);
    this.scene.add(this.pillarGroup);
  }

  // The input listeners are stored so they can be removed again.
  // They used to be anonymous functions, which made them impossible to
  // detach: stopping the engine removed only the 'resize' listener, so the
  // pointer and keyboard listeners stayed attached to the canvas, the
  // document and the window. Restarting the game therefore stacked a new
  // set of listeners on top of the old ones -- one click was handled
  // several times and the old engine was never released.
  private onMouseDown = (e: MouseEvent) => {
    if (!this.state) return;
    if (this.cameraMode !== 'isometric') {
      if (!this.isSwinging) {
        this.isSwinging = true;
        this.attackAnimTime = 0;
        playVampireSound('whip', this.state.settings.sfxVolume);
      }

      const player = this.state.player;
      const closest = this.enemies
        .filter(e => e.hp > 0 && Math.hypot(e.x - player.x, e.y - player.y) <= 35)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
      if (closest) {
        this.options.onEnemyClick?.(closest.id);
      }
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const floorIntersects = this.raycaster.intersectObject(this.floorMesh);
    if (floorIntersects.length > 0) {
      const pt = floorIntersects[0].point;

      for (const barrel of this.barrelsList) {
        if (!barrel.isBroken) {
          const dist = Math.hypot(pt.x - barrel.x, pt.z - barrel.z);
          if (dist < 15) {
            this.smashBarrel(barrel);
            return;
          }
        }
      }

      for (const item of this.groundItems) {
        const dist = Math.hypot(pt.x - item.x, pt.z - item.y);
        if (dist < 18) {
          this.options.onItemPick?.(item.id);
          return;
        }
      }

      for (const enemy of this.enemies) {
        if (enemy.hp > 0) {
          const dist = Math.hypot(pt.x - enemy.x, pt.z - enemy.y);
          if (dist < 20) {
            if (!this.isSwinging) {
              this.isSwinging = true;
              this.attackAnimTime = 0;
              playVampireSound('whip', this.state.settings.sfxVolume);
            }
            this.options.onEnemyClick?.(enemy.id);
            return;
          }
        }
      }

      this.options.onPlayerMove?.(pt.x, pt.z);
    }
  };

  private onCanvasClick = () => {
    if (this.cameraMode === 'firstperson' || this.cameraMode === 'thirdperson') {
      this.canvas.requestPointerLock();
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.canvas) {
      const sensitivity = 0.0022;
      this.playerFacingAngle -= e.movementX * sensitivity;
      this.cameraPitch = Math.max(-0.6, Math.min(0.6, this.cameraPitch - e.movementY * sensitivity));
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keysPressed[key] = true;
    this.handleKeyDown(e);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keysPressed[key] = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.orbitRadiusTarget = Math.max(70, Math.min(250, this.orbitRadiusTarget + e.deltaY * 0.12));
  };

  private setupInput() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('click', this.onCanvasClick);
    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.key === ' ') {
      this.triggerDash();
    }

    if (e.key.toLowerCase() === 'e') {
      if (this.state?.nearbyInteractable) {
        this.handleInteract();
      } else {
        this.cameraAngleTarget -= Math.PI / 4;
      }
    }

    if (e.key.toLowerCase() === 't') {
      if (!this.state?.inTown) {
        this.options.onCastTownPortal?.();
      }
    }

    if (e.key.toLowerCase() === 'q') {
      this.cameraAngleTarget += Math.PI / 4;
    }
    if (e.key.toLowerCase() === 'b') {
      this.options.onDropBomb?.();
    }

    if (e.key.toLowerCase() === 'v') {
      if (this.cameraMode === 'isometric') {
        this.cameraMode = 'thirdperson';
        playVampireSound('click', this.state?.settings?.sfxVolume ?? 1);
      } else if (this.cameraMode === 'thirdperson') {
        this.cameraMode = 'firstperson';
        playVampireSound('click', this.state?.settings?.sfxVolume ?? 1);
      } else {
        this.cameraMode = 'isometric';
        playVampireSound('click', this.state?.settings?.sfxVolume ?? 1);
        if (document.pointerLockElement === this.canvas) {
          document.exitPointerLock();
        }
      }
    }
  };

  public handleInteract() {
    if (!this.state?.nearbyInteractable) return;
    const inter = this.state.nearbyInteractable;
    if (inter.type === 'catacombs') {
      this.options.onEnterCatacombs?.();
    } else if (inter.type === 'sage' || inter.type === 'blacksmith' || inter.type === 'witch') {
      this.options.onOpenNPC?.(inter.type);
    } else if (inter.type === 'town_portal') {
      this.options.onUseTownPortal?.();
    } else if (inter.type === 'fountain') {
      if (this.state) {
        this.state.player.currentHp = this.state.player.stats.maxHp;
        this.state.player.currentMana = this.state.player.stats.maxMana;
        this.triggerFlash('#ef4444');
        playVampireSound('heal', this.state.settings?.sfxVolume ?? 1);
        for (let i = 0; i < 24; i++) {
          this.spawnParticle(
            this.state.player.x,
            8,
            this.state.player.y,
            (Math.random() - 0.5) * 20,
            12 + Math.random() * 20,
            (Math.random() - 0.5) * 20,
            '#f43f5e',
            0.7,
            'spark'
          );
        }
      }
    }
  }

  public triggerDash() {
    if (!this.state || this.state.player.currentHp <= 0) return;
    if (this.dashCooldown > 0 || this.isDashing) return;

    let kx = 0;
    let kz = 0;
    if (this.keysPressed['w'] || this.keysPressed['arrowup']) kz -= 1;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) kz += 1;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) kx -= 1;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) kx += 1;

    let dirX = 0;
    let dirZ = 0;

    if (kx !== 0 || kz !== 0) {
      const angle = this.cameraAngle;
      const forwardX = -Math.sin(angle);
      const forwardZ = -Math.cos(angle);
      const rightX = Math.cos(angle);
      const rightZ = -Math.sin(angle);

      const moveX = forwardX * (-kz) + rightX * kx;
      const moveZ = forwardZ * (-kz) + rightZ * kx;
      const len = Math.hypot(moveX, moveZ);
      if (len > 0.01) {
        dirX = moveX / len;
        dirZ = moveZ / len;
      }
    }

    if (dirX === 0 && dirZ === 0) {
      dirX = Math.sin(this.playerFacingAngle);
      dirZ = Math.cos(this.playerFacingAngle);
    }

    this.dashDirX = dirX;
    this.dashDirZ = dirZ;
    this.isDashing = true;
    this.dashTimeRemaining = this.dashDuration;
    this.dashCooldown = this.dashCooldownMax;
    this.lastAfterimageSpawn = 0;

    this.state.player.isInvulnerable = true;
    this.state.player.dashCooldownLeft = this.dashCooldown;
    this.state.player.dashCooldownMax = this.dashCooldownMax;

    playVampireSound('dash', this.state.settings?.sfxVolume ?? 1);
    this.triggerShake(0.85);

    // Initial shadow mist explosion at player origin
    for (let i = 0; i < 16; i++) {
      const pAngle = Math.random() * Math.PI * 2;
      const pSpeed = 16 + Math.random() * 26;
      this.spawnParticle(
        this.state.player.x,
        10,
        this.state.player.y,
        Math.cos(pAngle) * pSpeed,
        6 + Math.random() * 16,
        Math.sin(pAngle) * pSpeed,
        '#7f1d1d',
        0.45,
        'smoke'
      );
    }
  }

  private spawnAfterimage(x: number, z: number, angle: number) {
    const afterimageGroup = new THREE.Group();
    afterimageGroup.position.set(x, 0, z);
    afterimageGroup.rotation.y = angle;

    const materials: THREE.Material[] = [];
    this.vampireModel.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const shadowMat = new THREE.MeshBasicMaterial({
          color: '#e11d48',
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        materials.push(shadowMat);
        const meshClone = new THREE.Mesh(child.geometry, shadowMat);
        meshClone.position.copy(child.position);
        meshClone.rotation.copy(child.rotation);
        meshClone.scale.copy(child.scale);
        afterimageGroup.add(meshClone);
      }
    });

    this.scene.add(afterimageGroup);
    this.afterimages.push({
      group: afterimageGroup,
      life: 0.35,
      maxLife: 0.35,
      materials
    });
  }

  public spawnFloorBloodDecal(x: number, z: number) {
    const decalGroup = new THREE.Group();
    decalGroup.position.set(x, 0.08, z);

    const radius = 4.5 + Math.random() * 3.5;
    const segments = 12;
    const circleGeo = new THREE.CircleGeometry(radius, segments);
    const posAttr = circleGeo.attributes.position;
    for (let i = 1; i < posAttr.count; i++) {
      const factor = 0.72 + Math.random() * 0.52;
      posAttr.setX(i, posAttr.getX(i) * factor);
      posAttr.setY(i, posAttr.getY(i) * factor);
    }
    posAttr.needsUpdate = true;

    const bloodColor = ['#3f0814', '#55081b', '#450a0a'][Math.floor(Math.random() * 3)];
    const mat = new THREE.MeshStandardMaterial({
      color: bloodColor,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    const mainSplatter = new THREE.Mesh(circleGeo, mat);
    mainSplatter.rotation.x = -Math.PI / 2;
    decalGroup.add(mainSplatter);

    const dropCount = 3 + Math.floor(Math.random() * 3);
    for (let d = 0; d < dropCount; d++) {
      const dropRadius = 0.7 + Math.random() * 1.1;
      const dropDist = radius + 2 + Math.random() * 7;
      const dropAngle = Math.random() * Math.PI * 2;
      const dropGeo = new THREE.CircleGeometry(dropRadius, 6);
      const dropMesh = new THREE.Mesh(dropGeo, mat);
      dropMesh.rotation.x = -Math.PI / 2;
      dropMesh.position.set(Math.cos(dropAngle) * dropDist, 0, Math.sin(dropAngle) * dropDist);
      decalGroup.add(dropMesh);
    }

    this.scene.add(decalGroup);
    this.floorBloodDecals.push({ group: decalGroup, life: 90.0 });

    if (this.floorBloodDecals.length > 45) {
      const oldest = this.floorBloodDecals.shift();
      if (oldest) {
        this.scene.remove(oldest.group);
        oldest.group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    }
  }

  private spawnParticle(x: number, y: number, z: number, vx: number, vy: number, vz: number, color: string, maxLife: number, type: any) {
    this.particleManager.spawnParticle(x, y, z, vx, vy, vz, color, maxLife, type);
  }

  private smashBarrel(barrel: { id: string; x: number; z: number; isBroken: boolean; isUrn?: boolean }) {
    this.particleManager.smashBarrel(barrel, this.barrelMeshes, (intensity) => this.triggerShake(intensity), this.state?.settings?.sfxVolume ?? 1, playVampireSound);
  }

  private playMusic() {
    try {
      this.bgMusic = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.volume = 0.35;
      if ((this.state?.settings?.musicVolume ?? 0) > 0) {
        this.bgMusic.play().catch(() => console.log('Audio autoplay blocked'));
      }
    } catch (e) {
      console.log('Audio init failed', e);
    }
  }

  public updateData(
    state: GameState,
    enemies: Enemy[],
    _bloodOrbs: BloodOrb[],
    _floatingTexts: FloatingText[]
  ) {
    const isFirstTime = !this.state;
    this.state = state;
    this.enemies = enemies;
    this.groundItems = state.groundItems || [];
    this.activeChest = state.activeChest || null;

    if (this.bgMusic) {
      this.bgMusic.volume = (state.settings?.musicVolume ?? 0) * 0.35;
      if (this.bgMusic.volume > 0 && this.bgMusic.paused) this.bgMusic.play().catch(() => {});
      else if (this.bgMusic.volume === 0 && !this.bgMusic.paused) this.bgMusic.pause();
    }

    if (isFirstTime) {
      this.initThemePreset(state.activeZone);
      this.generateDungeon();
      this.playMusic();
    }
  }

  public start() {
    this.active = true;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      if (!this.active) return;
      const dt = Math.min(0.08, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.update(dt);
      this.render();
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  public stop() {
    this.active = false;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);

    // Detach the input listeners too. They were registered with anonymous
    // functions, so they could not be removed and stayed attached to the
    // canvas, the document and the window for the life of the page --
    // every restart stacked another set on top.
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('click', this.onCanvasClick);
    document.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('wheel', this.onWheel);

    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic = null;
    }

    this.renderer.dispose();
    this.wallGroup.clear();
    this.pillarGroup.clear();

    this.particleManager.clear();
    this.enemyRenderer.clear();
    this.lightningGroup.clear();
    this.activeLightningBolts = [];
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
  }

  public triggerFlash(color: string) {
    this.flashColor.setStyle(color);
    const mat = this.flashOverlay.material as THREE.MeshBasicMaterial;
    mat.color.copy(this.flashColor);
    this.flashAlpha = 0.58;
  }

  public triggerShake(intensity: number) {
    this.cameraShakeIntensity = Math.min(6.5, this.cameraShakeIntensity + intensity);
  }

  private update(dt: number) {
    if (!this.state) return;

    if (this.state.hitStopUntil && this.state.hitStopUntil !== this.lastHitStop) {
      this.triggerShake(3.5);
      this.lastHitStop = this.state.hitStopUntil;
    }

    if (this.state.hitStopUntil && performance.now() < this.state.hitStopUntil) {
      return; // Freeze visual engine for visceral hit-stop
    }

    const parentW = this.canvas.parentElement?.clientWidth || 1050;
    const parentH = this.canvas.parentElement?.clientHeight || 400;
    if (this.canvas.width !== parentW || this.canvas.height !== parentH) {
      this.canvas.width = parentW;
      this.canvas.height = parentH;
      this.resize();
    }

    const player = this.state.player;

    // Track smoothed player velocity for dynamic camera lookahead
    if (this.prevPlayerX === 0 && this.prevPlayerY === 0) {
      this.prevPlayerX = player.x;
      this.prevPlayerY = player.y;
    }
    const rawVelX = (player.x - this.prevPlayerX) / Math.max(0.001, dt);
    const rawVelZ = (player.y - this.prevPlayerY) / Math.max(0.001, dt);
    this.prevPlayerX = player.x;
    this.prevPlayerY = player.y;

    this.playerVelX += (rawVelX - this.playerVelX) * 0.14;
    this.playerVelZ += (rawVelZ - this.playerVelZ) * 0.14;

    // Detect Blood Nova / Spell Cast via Mana Consumption
    if (this.lastMana !== undefined && player.stats.mana < this.lastMana - 5) {
      this.triggerLightningStrike(player.x, player.y, '#ef4444', 300);
    }
    this.lastMana = player.stats.mana;

    let kx = 0;
    let kz = 0;
    if (this.keysPressed['w'] || this.keysPressed['arrowup']) kz -= 1;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) kz += 1;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) kx -= 1;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) kx += 1;

    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp) {
        const ax = gp.axes[0];
        const ay = gp.axes[1];
        if (Math.hypot(ax, ay) > 0.22) {
          kx = ax;
          kz = ay;
        }
        if (gp.buttons[0].pressed) {
          const closest = this.enemies
            .filter(e => e.hp > 0)
            .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
          if (closest) {
            this.options.onEnemyClick?.(closest.id);
          }
        }
        if (gp.buttons[1]?.pressed || gp.buttons[2]?.pressed || gp.buttons[4]?.pressed || gp.buttons[5]?.pressed) {
          this.triggerDash();
        }
        break;
      }
    }

    if (kx !== 0 || kz !== 0) {
      const angle = this.cameraAngle;
      const forwardX = -Math.sin(angle);
      const forwardZ = -Math.cos(angle);
      const rightX = Math.cos(angle);
      const rightZ = -Math.sin(angle);

      const moveX = forwardX * (-kz) + rightX * kx;
      const moveZ = forwardZ * (-kz) + rightZ * kx;

      const len = Math.hypot(moveX, moveZ);
      if (len > 0.01) {
        const baseSpeed = (player.stats.speed || 0.075) * 1000;
        const dx = (moveX / len) * baseSpeed * dt;
        const dz = (moveZ / len) * baseSpeed * dt;

        let newX = player.x + dx;
        let newY = player.y + dz;

        const playerRadius = 8.5;
        const checkCollision = (px: number, py: number) => {
          const tileX = Math.floor(px / this.tileSize + 0.5);
          const tileZ = Math.floor(py / this.tileSize + 0.5);
          const solidTiles = [1, 2, 3, 4, 5, 6, 8];

          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              const x = tileX + dx;
              const z = tileZ + dz;
              if (x < 0 || x >= this.mapWidth || z < 0 || z >= this.mapHeight) continue;

              if (solidTiles.includes(this.grid[z][x])) {
                const minX = x * this.tileSize - this.tileSize / 2;
                const maxX = x * this.tileSize + this.tileSize / 2;
                const minZ = z * this.tileSize - this.tileSize / 2;
                const maxZ = z * this.tileSize + this.tileSize / 2;

                const closestX = Math.max(minX, Math.min(px, maxX));
                const closestZ = Math.max(minZ, Math.min(py, maxZ));

                const distX = px - closestX;
                const distZ = py - closestZ;
                const dist = Math.hypot(distX, distZ);

                if (dist < playerRadius) {
                  return { collided: true, closestX, closestZ, distX, distZ, dist };
                }
              }
            }
          }
          return { collided: false };
        };

        // Check & resolve collision for X
        let col = checkCollision(newX, player.y);
        if (col.collided && col.dist && col.dist > 0.01) {
          const overlap = playerRadius - col.dist;
          newX += (col.distX / col.dist) * overlap;
        } else if (col.collided) {
          newX = player.x;
        }

        // Check & resolve collision for Y
        col = checkCollision(newX, newY);
        if (col.collided && col.dist && col.dist > 0.01) {
          const overlap = playerRadius - col.dist;
          newY += (col.distZ / col.dist) * overlap;
        } else if (col.collided) {
          newY = player.y;
        }

        if (Math.hypot(newX - player.x, newY - player.y) > 0.01) {
          this.options.onPlayerMove?.(newX, newY, true);
        }
      }
    }

    // Update Dash Cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
      if (this.state) {
        this.state.player.dashCooldownLeft = this.dashCooldown;
        this.state.player.dashCooldownMax = this.dashCooldownMax;
      }
    }

    // Process Active Shadow Dash
    if (this.isDashing) {
      this.dashTimeRemaining -= dt;
      if (this.dashTimeRemaining <= 0) {
        this.isDashing = false;
        if (this.state) {
          this.state.player.isInvulnerable = false;
        }
      } else {
        const dashSpeed = (player.stats.speed || 0.075) * 1000 * 3.8;
        const dDx = this.dashDirX * dashSpeed * dt;
        const dDz = this.dashDirZ * dashSpeed * dt;
        let dNewX = player.x + dDx;
        let dNewY = player.y + dDz;

        const playerRadius = 8.5;
        const checkTileCollision = (px: number, py: number) => {
          const tileX = Math.floor(px / this.tileSize + 0.5);
          const tileZ = Math.floor(py / this.tileSize + 0.5);
          const solidTiles = [1, 2, 3, 4, 5, 6, 8];
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              const x = tileX + dx;
              const z = tileZ + dz;
              if (x < 0 || x >= this.mapWidth || z < 0 || z >= this.mapHeight) continue;
              if (solidTiles.includes(this.grid[z][x])) {
                const minX = x * this.tileSize - this.tileSize / 2;
                const maxX = x * this.tileSize + this.tileSize / 2;
                const minZ = z * this.tileSize - this.tileSize / 2;
                const maxZ = z * this.tileSize + this.tileSize / 2;
                const closestX = Math.max(minX, Math.min(px, maxX));
                const closestZ = Math.max(minZ, Math.min(py, maxZ));
                const distX = px - closestX;
                const distZ = py - closestZ;
                const dist = Math.hypot(distX, distZ);
                if (dist < playerRadius) return { hit: true, dist, distX, distZ };
              }
            }
          }
          return { hit: false };
        };

        let col = checkTileCollision(dNewX, player.y);
        if (col.hit && col.dist && col.dist > 0.01) {
          dNewX += (col.distX / col.dist) * (playerRadius - col.dist);
        } else if (col.hit) {
          dNewX = player.x;
        }

        col = checkTileCollision(dNewX, dNewY);
        if (col.hit && col.dist && col.dist > 0.01) {
          dNewY += (col.distZ / col.dist) * (playerRadius - col.dist);
        } else if (col.hit) {
          dNewY = player.y;
        }

        player.x = dNewX;
        player.y = dNewY;
        this.options.onPlayerMove?.(dNewX, dNewY, true);

        const nowMs = performance.now();
        if (nowMs - this.lastAfterimageSpawn > 42) {
          this.lastAfterimageSpawn = nowMs;
          this.spawnAfterimage(player.x, player.y, this.playerFacingAngle);
        }

        this.spawnParticle(
          player.x + (Math.random() - 0.5) * 4,
          7 + Math.random() * 8,
          player.y + (Math.random() - 0.5) * 4,
          -this.dashDirX * 14,
          2 + Math.random() * 8,
          -this.dashDirZ * 14,
          '#b91c1c',
          0.38,
          'smoke'
        );
      }
    }

    // Update active phantom afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const img = this.afterimages[i];
      img.life -= dt;
      if (img.life <= 0) {
        this.scene.remove(img.group);
        img.materials.forEach(m => m.dispose());
        this.afterimages.splice(i, 1);
      } else {
        const ratio = img.life / img.maxLife;
        img.materials.forEach(m => {
          (m as THREE.MeshBasicMaterial).opacity = ratio * 0.65;
        });
        img.group.scale.multiplyScalar(1.006);
      }
    }

    if (this.lastMana !== undefined && player.currentMana < this.lastMana) {
      this.particleManager.spawnBloodNovaRing(player.x, player.y, (intensity) => this.triggerShake(intensity), (color) => this.triggerFlash(color));
      playVampireSound('whip', this.state.settings.sfxVolume);
    }
    this.lastMana = player.currentMana;

    const playerRadius = 8.5;
    const tileX = Math.floor(player.x / this.tileSize + 0.5);
    const tileZ = Math.floor(player.y / this.tileSize + 0.5);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = tileX + dx;
        const z = tileZ + dz;
        if (x < 0 || x >= this.mapWidth || z < 0 || z >= this.mapHeight) continue;

        const solidTiles = [1, 2, 3, 4, 5, 6, 8];
        if (solidTiles.includes(this.grid[z][x])) {
          const minX = x * this.tileSize - this.tileSize / 2;
          const maxX = x * this.tileSize + this.tileSize / 2;
          const minZ = z * this.tileSize - this.tileSize / 2;
          const maxZ = z * this.tileSize + this.tileSize / 2;

          const closestX = Math.max(minX, Math.min(player.x, maxX));
          const closestZ = Math.max(minZ, Math.min(player.y, maxZ));

          const distX = player.x - closestX;
          const distZ = player.y - closestZ;
          const dist = Math.hypot(distX, distZ);

          if (dist < playerRadius) {
            const overlap = playerRadius - dist;
            if (dist > 0.01) {
              player.x += (distX / dist) * overlap;
              player.y += (distZ / dist) * overlap;
            } else {
              player.x += overlap;
            }
            this.options.onPlayerMove?.(player.x, player.y, true);
          }
        }
      }
    }

    this.playerMesh.position.x += (player.x - this.playerMesh.position.x) * 0.16;
    this.playerMesh.position.z += (player.y - this.playerMesh.position.z) * 0.16;

    if (player.state === 'attacking' && !this.isSwinging) {
      this.isSwinging = true;
      this.attackAnimTime = 0;
      playVampireSound('whip', this.state.settings?.sfxVolume ?? 1);
    }
    if (this.isSwinging) {
      this.attackAnimTime += dt;
      const t = Math.min(1.0, this.attackAnimTime / this.attackDuration);

      this.slashArcGroup.visible = true;
      this.slashArcGroup.position.set(player.x, 10.5, player.y);
      this.slashArcGroup.rotation.y = this.playerFacingAngle - Math.PI / 2 + (t - 0.2) * 1.8;
      this.slashArcGroup.rotation.x = 0.28;

      const scale = 0.8 + t * 0.45;
      this.slashArcGroup.scale.set(scale, scale, scale);

      let alpha: number;
      if (t < 0.2) {
        alpha = t / 0.2;
      } else if (t < 0.75) {
        alpha = 1.0 - (t - 0.2) / 0.55;
      } else {
        alpha = 0;
      }

      (this.slashArcOuterMesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.9;
      (this.slashArcInnerMesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.98;

      if (t > 0.15 && t < 0.45 && Math.random() < 0.6) {
        const swingAngle = this.playerFacingAngle + (Math.random() - 0.5) * 1.2;
        const dist = 18 + Math.random() * 8;
        this.spawnParticle(
          player.x + Math.sin(swingAngle) * dist,
          10 + (Math.random() - 0.5) * 4,
          player.y + Math.cos(swingAngle) * dist,
          Math.sin(swingAngle) * 8,
          2 + Math.random() * 4,
          Math.cos(swingAngle) * 8,
          '#f43f5e',
          0.25,
          'spark'
        );
      }

      if (this.attackAnimTime >= this.attackDuration) {
        this.isSwinging = false;
        this.attackAnimTime = 0;
        this.slashArcGroup.visible = false;
      }
    } else {
      this.slashArcGroup.visible = false;
    }

    // Breakable urns and barrels smash when swinging or dashing
    if (this.isSwinging || this.isDashing) {
      const slashRadius = this.isDashing ? 20 : 32;
      for (const barrel of this.barrelsList) {
        if (!barrel.isBroken) {
          const dist = Math.hypot(player.x - barrel.x, player.y - barrel.z);
          if (dist <= slashRadius) {
            this.smashBarrel(barrel);
          }
        }
      }
    }

    // Town Proximity & Interaction Checks
    if (this.state?.inTown && this.townObjects) {
      let foundInteractable: any = null;
      const px = player.x;
      const pz = player.y;

      // 1. Check NPCs
      if (this.townObjects.npcs) {
        for (const npc of this.townObjects.npcs) {
          const dist = Math.hypot(px - npc.x, pz - npc.z);
          if (dist <= 28) {
            foundInteractable = {
              id: npc.id,
              type: npc.id,
              name: npc.name,
              actionLabel: `Speak with ${npc.name}`
            };
            break;
          }
        }
      }

      // 2. Check Catacombs Gate
      if (!foundInteractable && this.townObjects.catacombsGate) {
        const gate = this.townObjects.catacombsGate;
        const dist = Math.hypot(px - gate.x, pz - gate.z);
        if (dist <= 34) {
          foundInteractable = {
            id: 'gate',
            type: 'catacombs',
            name: 'Catacombs Gate',
            actionLabel: 'Descend into Forgotten Crypts (Floor 1)'
          };
        }
      }

      // 3. Check Blood Fountain
      if (!foundInteractable && this.townObjects.bloodFountain) {
        const f = this.townObjects.bloodFountain;
        const dist = Math.hypot(px - f.x, pz - f.z);
        if (dist <= 28) {
          foundInteractable = {
            id: 'fountain',
            type: 'fountain',
            name: 'Fountain of Vitality',
            actionLabel: 'Drink from Blood Well (Restore HP & Mana)'
          };
        }
      }

      // 4. Check Town Portal
      if (!foundInteractable && this.state.townPortal?.active) {
        const tpX = 15 * this.tileSize;
        const tpZ = 15 * this.tileSize;
        const dist = Math.hypot(px - tpX, pz - tpZ);
        if (dist <= 28) {
          foundInteractable = {
            id: 'town_portal',
            type: 'town_portal',
            name: 'Azure Town Portal',
            actionLabel: `Return to Dungeon Floor ${(this.state.townPortal.returnFloor || 0) + 1}`
          };
        }
      }

      this.state.nearbyInteractable = foundInteractable;
    } else {
      if (this.state && this.state.nearbyInteractable) {
        this.state.nearbyInteractable = null;
      }
    }

    if (this.cameraMode !== 'isometric') {
      this.playerMesh.rotation.y = this.playerFacingAngle;
    } else {
      const targetFacingAngle = Math.atan2(
        player.x - this.playerMesh.position.x,
        player.y - this.playerMesh.position.z
      );
      if (Math.hypot(player.x - this.playerMesh.position.x, player.y - this.playerMesh.position.z) > 1.2) {
        const diff = targetFacingAngle - this.playerFacingAngle;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.playerFacingAngle += normalizedDiff * 0.28;
      }
      this.playerMesh.rotation.y = this.playerFacingAngle;
    }

    this.vampireModel.update(
      dt,
      player.state,
      player.x,
      player.y,
      this.cameraPitch,
      this.cameraMode,
      this.isSwinging,
      this.attackAnimTime,
      this.attackDuration,
      (x, y, z, vx, vy, vz, color, life, type) => this.spawnParticle(x, y, z, vx, vy, vz, color, life, type)
    );

    const time = performance.now();
    const lanternFlicker = Math.sin(time / 140) * 4.5 + Math.sin(time / 65) * 1.8;
    this.playerLight.intensity = 75.0 + lanternFlicker;
    const jiggleX = Math.sin(time / 180) * 0.22;
    const jiggleZ = Math.cos(time / 130) * 0.22;
    this.playerLight.position.set(player.x + jiggleX, 14.5, player.y + jiggleZ);
    this.playerSelfLight.position.set(player.x, 24, player.y);

    let camShakeX = 0;
    let camShakeY = 0;
    if (this.cameraShakeIntensity > 0.02) {
      camShakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 10;
      camShakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 10;
      this.cameraShakeIntensity *= 0.9;
    }

    if (this.cameraMode === 'firstperson') {
      const cx = player.x + Math.sin(this.playerFacingAngle) * 2;
      const cz = player.y + Math.cos(this.playerFacingAngle) * 2;
      const cy = 21.0;

      this.camera.position.set(cx + camShakeX, cy + camShakeY, cz);
      
      const targetX = cx + Math.sin(this.playerFacingAngle) * 100 * Math.cos(this.cameraPitch);
      const targetZ = cz + Math.cos(this.playerFacingAngle) * 100 * Math.cos(this.cameraPitch);
      const targetY = cy + Math.sin(this.cameraPitch) * 100;
      this.camera.lookAt(targetX, targetY, targetZ);

      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.near = 140;
        this.scene.fog.far = 480;
      }
    } else if (this.cameraMode === 'thirdperson') {
      const dist = 38;
      const cx = player.x - Math.sin(this.playerFacingAngle) * dist * Math.cos(this.cameraPitch);
      const cz = player.y - Math.cos(this.playerFacingAngle) * dist * Math.cos(this.cameraPitch);
      const cy = 25.0 + Math.sin(this.cameraPitch) * dist;

      this.camera.position.set(cx + camShakeX, cy + camShakeY, cz);

      const lookTargetX = player.x + Math.sin(this.playerFacingAngle) * 12;
      const lookTargetZ = player.y + Math.cos(this.playerFacingAngle) * 12;
      this.camera.lookAt(lookTargetX, 15, lookTargetZ);

      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.near = 140;
        this.scene.fog.far = 480;
      }
    } else {
      this.cameraAngle += (this.cameraAngleTarget - this.cameraAngle) * 0.08;
      this.orbitRadius += (this.orbitRadiusTarget - this.orbitRadius) * 0.08;

      if (this.camLookX === 0 && this.camLookZ === 0) {
        this.camLookX = player.x;
        this.camLookZ = player.y;
      }

      // Smooth camera lookahead velocity anticipation
      const lookaheadTargetX = player.x + Math.max(-28, Math.min(28, this.playerVelX * 0.16));
      const lookaheadTargetZ = player.y + Math.max(-28, Math.min(28, this.playerVelZ * 0.16));

      this.camLookX += (lookaheadTargetX - this.camLookX) * 0.08;
      this.camLookZ += (lookaheadTargetZ - this.camLookZ) * 0.08;

      const camHeight = this.orbitRadius * 1.25;
      const cx = this.camLookX + Math.sin(this.cameraAngle) * this.orbitRadius;
      const cz = this.camLookZ + Math.cos(this.cameraAngle) * this.orbitRadius;

      this.camera.position.set(cx + camShakeX, camHeight, cz + camShakeY);
      this.camera.lookAt(this.camLookX, 4, this.camLookZ);

      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.near = this.orbitRadius * 1.5;
        this.scene.fog.far = this.orbitRadius * 4.5;
      }
    }

    this.torchLights.forEach((light, idx) => {
      const offset = this.wallTorches[idx]?.animOffset || 0;
      const t = performance.now() + offset;
      const torchFlicker = Math.sin(t / 160) * 2.2 + Math.sin(t / 70) * 0.9;
      light.intensity = 12.0 + torchFlicker;

      const torch = this.wallTorches[idx];
      if (torch) {
        const jX = Math.sin(t / 120) * 0.15;
        const jZ = Math.cos(t / 100) * 0.15;
        light.position.set(torch.x + jX, 18, torch.z + 3 + jZ);

        if (Math.random() < 0.1) {
          const vx = (Math.random() - 0.5) * 0.8;
          const vy = 1.0 + Math.random() * 1.5;
          const vz = (Math.random() - 0.5) * 0.8 + 1.0;
          this.spawnParticle(torch.x, 18, torch.z + 3, vx, vy, vz, this.currentTheme.torch, 0.6 + Math.random() * 0.5, 'fire');
        }
        if (Math.random() < 0.06) {
          const vx = (Math.random() - 0.5) * 0.4;
          const vy = 2.0 + Math.random() * 1.5;
          const vz = (Math.random() - 0.5) * 0.4;
          this.spawnParticle(torch.x, 20, torch.z + 3, vx, vy, vz, '#475569', 1.2 + Math.random() * 0.8, 'smoke');
        }
      }
    });

    this.swayingChains.forEach((chain, cIdx) => {
      const offset = cIdx * 450;
      chain.rotation.z = Math.sin((performance.now() + offset) / 600) * 0.07;
      chain.rotation.x = Math.cos((performance.now() + offset) / 750) * 0.04;
    });

    if (Math.random() < 0.08) {
      const dx = player.x + (Math.random() - 0.5) * 140;
      const dy = 5 + Math.random() * 30;
      const dz = player.y + (Math.random() - 0.5) * 140;
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = (Math.random() - 0.5) * 0.8;
      const vz = (Math.random() - 0.5) * 1.5;
      this.spawnParticle(dx, dy, dz, vx, vy, vz, '#cbd5e1', 3.0 + Math.random() * 2.0, 'dust');
    }



    // Wall Torch Smoke
    this.torchLights.forEach(light => {
      if (Math.random() < 0.05) {
        this.particleManager.spawnTorchSmoke(light.position.x, light.position.y, light.position.z);
      }
    });

    this.particleManager.update(dt, this.cameraAngle);



    // 1. Sync door unlocks from grid (remove unlocked door meshes)
    for (let z = 0; z < this.mapHeight; z++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (this.grid[z]?.[x] === 0) {
          const doorMesh = this.scene.getObjectByName(`door-${x}-${z}`);
          if (doorMesh) {
            this.scene.remove(doorMesh);
            this.particleManager.spawnSparks(x * this.tileSize, 9, z * this.tileSize, 15);
            playVampireSound('levelUp', this.state.settings.sfxVolume);
          }
        }
      }
    }

    // 2. Proximity triggers for locking doors and portals
    const currentTileX = Math.floor(player.x / this.tileSize + 0.5);
    const currentTileZ = Math.floor(player.y / this.tileSize + 0.5);

    if (this.grid[currentTileZ]?.[currentTileX] === 8) {
      this.options.onEnterPortal?.();
    }

    const doorTypes = [3, 4, 5];
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = currentTileX + dx;
        const tz = currentTileZ + dz;
        if (tx >= 0 && tx < this.mapWidth && tz >= 0 && tz < this.mapHeight) {
          const tile = this.grid[tz]?.[tx];
          if (tile && doorTypes.includes(tile)) {
            this.options.onUseKeyOnDoor?.(tx, tz);
          }
        }
      }
    }

    this.update3DEnemies(dt);
    this.update3DItems();
    this.update3DChest();
    this.update3DBombs();
    this.updateLightning(dt);

    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 1.8;
      const mat = this.flashOverlay.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, this.flashAlpha);
    }
  }

  // Realistic Procedural Branching Lightning Engine
  public triggerLightningStrike(targetX: number, targetZ: number, color = '#67e8f9', intensity = 220) {
    const boltGroup = new THREE.Group();
    const startX = targetX + (Math.random() - 0.5) * 35;
    const startY = 85;
    const startZ = targetZ + (Math.random() - 0.5) * 35;

    const generateSegments = (p1: THREE.Vector3, p2: THREE.Vector3, depth: number, jitter: number): THREE.Vector3[] => {
      if (depth === 0) return [p1, p2];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      // Perpendicular jitter offset
      const perp = new THREE.Vector3(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * (jitter * 0.4),
        (Math.random() - 0.5) * jitter
      );
      mid.add(perp);
      const left = generateSegments(p1, mid, depth - 1, jitter * 0.55);
      const right = generateSegments(mid, p2, depth - 1, jitter * 0.55);
      return left.slice(0, left.length - 1).concat(right);
    };

    const mainPts = generateSegments(
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(targetX, 0.5, targetZ),
      5,
      22
    );

    // 1. Intense White Hot Core
    const coreGeo = new THREE.BufferGeometry().setFromPoints(mainPts);
    const coreMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const coreLine = new THREE.Line(coreGeo, coreMat);
    boltGroup.add(coreLine);

    // 2. High-Energy Electric Corona Glow Line
    const coronaGeo = new THREE.BufferGeometry().setFromPoints(mainPts);
    const coronaMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      linewidth: 5,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const coronaLine = new THREE.Line(coronaGeo, coronaMat);
    coronaLine.scale.set(1.02, 1.0, 1.02);
    boltGroup.add(coronaLine);

    // 3. Procedural Branch Forks
    for (let b = 0; b < 3; b++) {
      const branchIndex = Math.floor(mainPts.length * (0.2 + b * 0.25));
      const branchStart = mainPts[branchIndex];
      if (branchStart) {
        const branchEnd = new THREE.Vector3(
          branchStart.x + (Math.random() - 0.5) * 35,
          Math.max(0, branchStart.y - 25 - Math.random() * 20),
          branchStart.z + (Math.random() - 0.5) * 35
        );
        const branchPts = generateSegments(branchStart, branchEnd, 3, 14);
        const branchGeo = new THREE.BufferGeometry().setFromPoints(branchPts);
        const branchLine = new THREE.Line(branchGeo, coronaMat);
        boltGroup.add(branchLine);
      }
    }

    this.lightningGroup.add(boltGroup);
    this.lightningLight.position.set(targetX, 15, targetZ);
    this.lightningLight.color.setStyle(color);
    this.lightningLight.intensity = intensity;

    this.activeLightningBolts.push({
      mesh: boltGroup,
      lightIntensity: intensity,
      life: 0.32,
      maxLife: 0.32
    });

    this.particleManager.spawnSparks(targetX, 2, targetZ, 26);
    this.triggerShake(2.8);
    this.triggerFlash(color);
    if (this.state) {
      playVampireSound('hit', (this.state.settings?.sfxVolume ?? 0.8) * 1.15);
    }
  }

  private updateLightning(dt: number) {
    // 1. Fade & Flicker Active Lightning Bolts
    let maxLightIntensity = 0;
    for (let i = this.activeLightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.activeLightningBolts[i];
      bolt.life -= dt;
      if (bolt.life <= 0) {
        this.lightningGroup.remove(bolt.mesh);
        // Dispose geometries
        bolt.mesh.traverse((obj) => {
          if (obj instanceof THREE.Line) {
            obj.geometry.dispose();
          }
        });
        this.activeLightningBolts.splice(i, 1);
      } else {
        const progress = bolt.life / bolt.maxLife;
        // Electric jitter flicker
        const flicker = (Math.random() > 0.3 ? 1.0 : 0.4) * progress;
        bolt.mesh.traverse((obj) => {
          if (obj instanceof THREE.Line && obj.material instanceof THREE.Material) {
            obj.material.opacity = Math.max(0, flicker);
          }
        });
        maxLightIntensity = Math.max(maxLightIntensity, bolt.lightIntensity * progress * flicker);
      }
    }

    this.lightningLight.intensity = maxLightIntensity;

    // 2. Ambient Dungeon Lightning Strike Cycle (Dramatic atmospheric flashes)
    this.nextAmbientLightningTime -= dt;
    if (this.nextAmbientLightningTime <= 0) {
      this.nextAmbientLightningTime = 14 + Math.random() * 18;
      if (this.state?.player) {
        // Strike a random floor position near the player or a random enemy
        const target = this.enemies.find(e => e.hp > 0 && Math.random() < 0.4) || {
          x: this.state.player.x + (Math.random() - 0.5) * 80,
          y: this.state.player.y + (Math.random() - 0.5) * 80
        };
        const strikeColors = ['#67e8f9', '#a855f7', '#f43f5e', '#38bdf8'];
        const chosenColor = strikeColors[Math.floor(Math.random() * strikeColors.length)];
        this.triggerLightningStrike(target.x, target.y, chosenColor, 240);
      }
    }
  }

  private update3DEnemies(dt: number) {
    this.enemyRenderer.update(
      this.enemies,
      dt,
      this.state ? this.state.activeZone : 0,
      this.cameraAngle,
      this.state ? this.state.player.x : 0,
      this.tileSize,
      this.mapWidth,
      this.mapHeight,
      this.grid,
      {
        spawnBloodSplatter: (x, y, z, count) => this.particleManager.spawnBloodSplatter(x, y, z, count),
        spawn3DDamageNumber: (x, y, z, amount) => this.particleManager.spawn3DDamageNumber(x, y, z, amount),
        flashEnemy: (group) => this.enemyRenderer.flashEnemy(group),
        spawnParticle: (x, y, z, vx, vy, vz, color, life, type) => this.particleManager.spawnParticle(x, y, z, vx, vy, vz, color, life, type),
        onEnemyDeath: (x, z) => this.spawnFloorBloodDecal(x, z)
      }
    );
  }

  private update3DItems() {
    const activeIds = new Set(this.groundItems.map(i => i.id));

    for (const [id, group] of this.itemMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.itemMeshes.delete(id);
      }
    }

    for (const item of this.groundItems) {
      let group = this.itemMeshes.get(item.id);

      if (!group) {
        group = new THREE.Group();

        let color = '#ffffff';
        if (item.itemCategory === 'relic' && item.relic) {
          if (item.relic.rarity === 'magic') color = '#3b82f6';
          if (item.relic.rarity === 'rare') color = '#fbbf24';
          if (item.relic.rarity === 'epic') color = '#c084fc';
          if (item.relic.rarity === 'legendary') color = '#ef4444';
          
          const orbGeo = new THREE.SphereGeometry(2.5, 6, 6);
          const orbMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5 });
          const orb = new THREE.Mesh(orbGeo, orbMat);
          orb.position.y = 4;
          group.add(orb);
        } else if (item.itemCategory === 'consumable') {
          color = item.consumable?.type === 'health_potion' ? '#ef4444' : '#3b82f6';
          if (this.consumablesMaterial) {
            const sprite = new THREE.Sprite(this.consumablesMaterial.clone());
            sprite.scale.set(12, 12, 1);
            sprite.position.y = 6;
            
            // Assuming 2x2 grid, let's say health is index 0, mana is index 1
            if (sprite.material.map) {
              const tex = sprite.material.map.clone();
              tex.needsUpdate = true;
              tex.repeat.set(0.5, 0.5);
              if (item.consumable?.type === 'health_potion') {
                tex.offset.set(0, 0.5);
              } else {
                tex.offset.set(0.5, 0.5);
              }
              sprite.material.map = tex;
            }
            group.add(sprite);
          }
        } else {
          color = '#a8a29e';
        }

        const beamGeo = new THREE.CylinderGeometry(1.5, 1.5, 110, 8, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 55;
        group.add(beam);

        this.scene.add(group);
        this.itemMeshes.set(item.id, group);
      }

      const bob = Math.sin(performance.now() / 150) * 1.2;
      group.position.set(item.x, bob, item.y);
    }
  }


  private update3DChest() {
    if (this.activeChest) {
      if (!this.chestMesh) {
        this.chestMesh = new THREE.Group();

        const chestGeo = new THREE.BoxGeometry(16, 11, 10);
        const chestMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.8 });
        const body = new THREE.Mesh(chestGeo, chestMat);
        body.castShadow = true;
        body.receiveShadow = true;
        this.chestMesh.add(body);

        const trimMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.85, roughness: 0.2 });
        const trimLGeo = new THREE.BoxGeometry(1.5, 11.5, 10.5);
        
        const trimL = new THREE.Mesh(trimLGeo, trimMat);
        trimL.position.set(-6, 0.1, 0);
        this.chestMesh.add(trimL);

        const trimR = new THREE.Mesh(trimLGeo, trimMat);
        trimR.position.set(6, 0.1, 0);
        this.chestMesh.add(trimR);

        const lid = new THREE.Group();
        lid.position.set(0, 5.5, -5); // Hinge position at back-top

        const lidBodyGeo = new THREE.CylinderGeometry(5.5, 5.5, 16, 12, 1, false, 0, Math.PI);
        const lidBody = new THREE.Mesh(lidBodyGeo, chestMat);
        lidBody.rotation.z = Math.PI / 2;
        lidBody.position.set(0, 0, 5); // Offset relative to hinge
        lidBody.castShadow = true;
        lid.add(lidBody);

        const lockGeo = new THREE.BoxGeometry(3.0, 3.0, 1.5);
        const lock = new THREE.Mesh(lockGeo, trimMat);
        lock.position.set(0, 0, 10.35); // Front of lid relative to hinge
        lid.add(lock);

        this.chestMesh.add(lid);
        this.chestMesh.userData.lid = lid;

        this.scene.add(this.chestMesh);
      }
      this.chestMesh.position.set(this.activeChest.x, 5.5, this.activeChest.y);
      
      const lid = this.chestMesh.userData.lid as THREE.Group;
      if (lid) {
        if (this.activeChest.isOpen) {
          lid.rotation.x = THREE.MathUtils.lerp(lid.rotation.x, -Math.PI / 2.2, 0.1);
        } else {
          lid.rotation.x = THREE.MathUtils.lerp(lid.rotation.x, 0, 0.1);
        }
      }
    } else {
      if (this.chestMesh) {
        this.scene.remove(this.chestMesh);
        this.chestMesh = null;
      }
    }
  }

  private update3DBombs() {
    if (!this.state) return;
    const bombs = this.state.bombsList || [];
    const activeIds = new Set(bombs.map(b => b.id));

    // Remove exploded bombs
    for (const [id, mesh] of this.bombMeshes.entries()) {
      if (!activeIds.has(id)) {
        const x = mesh.position.x;
        const z = mesh.position.z;
        
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 10 + Math.random() * 25;
          const vx = Math.cos(angle) * speed;
          const vz = Math.sin(angle) * speed;
          const vy = 5 + Math.random() * 12;
          this.particleManager.spawnParticle(x, 3, z, vx, vy, vz, '#f97316', 0.6 + Math.random() * 0.4, 'fire');
        }
        
        this.particleManager.spawnSparks(x, 4, z, 15);
        this.triggerLightningStrike(x, z, '#f97316', 240);
        this.triggerShake(2.5);
        this.triggerFlash('#78350f');
        playVampireSound('hit', this.state.settings.sfxVolume);

        this.scene.remove(mesh);
        this.bombMeshes.delete(id);
      }
    }

    // Spawn / Update active bombs
    bombs.forEach(bomb => {
      let mesh = this.bombMeshes.get(bomb.id);
      if (!mesh) {
        const bombGeo = new THREE.DodecahedronGeometry(2.5, 1);
        const bombMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8, metalness: 0.5 });
        mesh = new THREE.Mesh(bombGeo, bombMat);
        mesh.position.set(bomb.x, 2.5, bomb.y);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.bombMeshes.set(bomb.id, mesh);
      }
      
      const pulse = 1.0 + Math.sin(performance.now() * (5.0 - bomb.timer) * 1.5) * 0.18;
      mesh.scale.set(pulse, pulse, pulse);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (pulse > 1.05) {
        mat.emissive.setHex(0xef4444);
        mat.emissiveIntensity = 0.8;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }

  private render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
export default DarknessEngine;

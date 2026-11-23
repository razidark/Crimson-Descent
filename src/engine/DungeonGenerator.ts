import * as THREE from 'three';
import { Chest } from '../types/game';

export interface ThemeColors {
  floorBase: string;
  wallBase: string;
  puddle: string;
  torch: string;
  ambient: string;
}

export const themes: ThemeColors[] = [
  // Floor 1: Castle Gates (Cold blue-grey)
  { floorBase: '#1f222b', wallBase: '#2a3547', puddle: '#0e7490', torch: '#38bdf8', ambient: '#2c354a' },
  // Floor 2: Forgotten Crypts (Rotten green-grey)
  { floorBase: '#161d1a', wallBase: '#23302b', puddle: '#15803d', torch: '#22c55e', ambient: '#203029' },
  // Floor 3: Haunted Library (Royal crimson-mahogany)
  { floorBase: '#2b0c13', wallBase: '#3b0413', puddle: '#701a75', torch: '#c084fc', ambient: '#3a1c2f' },
  // Floor 4: Blood Altar (Obsidian blood-red)
  { floorBase: '#1a050a', wallBase: '#140104', puddle: '#b91c1c', torch: '#ef4444', ambient: '#2d0f14' },
  // Floor 5: Dracula's Throne (Royal black marble)
  { floorBase: '#08060a', wallBase: '#130d1d', puddle: '#ca8a04', torch: '#fbbf24', ambient: '#251531' }
];

export interface DungeonData {
  grid: number[][];
  swayingChains: THREE.Group[];
  barrelMeshes: Map<string, THREE.Mesh>;
  barrelsList: { id: string; x: number; z: number; isBroken: boolean; isUrn?: boolean }[];
  wallTorches: { x: number; z: number; animOffset: number }[];
  torchLights: THREE.PointLight[];
  chestMesh: THREE.Group | null;
  wallGroup: THREE.Group;
  pillarGroup: THREE.Group;
  floorMesh: THREE.Mesh;
  townObjects?: {
    npcs: { id: 'sage' | 'blacksmith' | 'witch'; x: number; z: number; name: string; mesh: THREE.Group }[];
    catacombsGate: { x: number; z: number; mesh: THREE.Group };
    bloodFountain: { x: number; z: number; mesh: THREE.Group };
    campfire: { x: number; z: number; mesh: THREE.Group };
    townPortalMesh?: THREE.Group | null;
  };
}

export class DungeonGenerator {
  public static createGlowTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  public static createStoneTexture(isFloor: boolean, theme: ThemeColors): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = isFloor ? theme.floorBase : theme.wallBase;
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 2 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  public static createStoneBumpTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, 256, 256);

    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = 2 + Math.random() * 5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  public static createStoneRoughnessTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#8e8e8e';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);

    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = 2 + Math.random() * 5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private static createArchway(scene: THREE.Scene, x: number, z: number, rotation: number, stoneBumpTex: THREE.Texture) {
    const archGroup = new THREE.Group();
    archGroup.position.set(x, 0, z);
    archGroup.rotation.y = rotation;

    const stoneMat = new THREE.MeshStandardMaterial({ 
      color: '#1a181e', 
      bumpMap: stoneBumpTex,
      bumpScale: 1.2,
      roughness: 0.9 
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.9, roughness: 0.1 });

    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 3), stoneMat);
    pillarL.position.set(-9, 10, 0);
    pillarL.castShadow = true;
    pillarL.receiveShadow = true;
    archGroup.add(pillarL);

    const capL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 3.6), goldTrimMat);
    capL.position.set(-9, 20, 0);
    archGroup.add(capL);

    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 3), stoneMat);
    pillarR.position.set(9, 10, 0);
    pillarR.castShadow = true;
    pillarR.receiveShadow = true;
    archGroup.add(pillarR);

    const capR = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 3.6), goldTrimMat);
    capR.position.set(9, 20, 0);
    archGroup.add(capR);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(22, 3, 4), stoneMat);
    archTop.position.set(0, 21.5, 0);
    archTop.castShadow = true;
    archGroup.add(archTop);

    const keystone = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5, 4.8), goldTrimMat);
    keystone.position.set(0, 21.8, 0);
    keystone.castShadow = true;
    archGroup.add(keystone);

    scene.add(archGroup);
  }

  private static createOverheadArch(scene: THREE.Scene, x: number, z: number, rotation: number, swayingChains: THREE.Group[]) {
    const archGroup = new THREE.Group();
    archGroup.position.set(x, 0, z);
    archGroup.rotation.y = rotation;

    const stoneMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
    
    const segments = 10;
    const radius = 15;
    const heightOffset = 22;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI;
      const ax = Math.cos(angle) * radius;
      const ay = Math.sin(angle) * radius + heightOffset;

      const block = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 4.0), stoneMat);
      block.position.set(ax, ay, 0);
      block.rotation.z = angle - Math.PI / 2;
      block.castShadow = true;
      block.receiveShadow = true;
      archGroup.add(block);
    }

    const chain = new THREE.Group();
    chain.position.set(0, heightOffset + radius - 2, 0);
    chain.name = 'swayingChain';
    const chainLinkGeo = new THREE.BoxGeometry(0.3, 1.8, 0.3);
    const ironMat = new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.9 });
    for (let c = 0; c < 5; c++) {
      const link = new THREE.Mesh(chainLinkGeo, ironMat);
      link.position.y = -c * 1.5;
      chain.add(link);
    }
    archGroup.add(chain);
    swayingChains.push(chain);

    scene.add(archGroup);
  }

  public static generateDungeon(
    scene: THREE.Scene,
    tileSize: number,
    mapWidth: number,
    mapHeight: number,
    activeZone: number,
    activeChest: Chest | null,
    grid: number[][],
    roomsList: any[]
  ): DungeonData {
    const theme = themes[activeZone] || themes[0];
    const swayingChains: THREE.Group[] = [];
    const barrelMeshes = new Map<string, THREE.Mesh>();
    const barrelsList: { id: string; x: number; z: number; isBroken: boolean; isUrn?: boolean }[] = [];
    const wallTorches: { x: number; z: number; animOffset: number }[] = [];
    const torchLights: THREE.PointLight[] = [];
    let chestMesh: THREE.Group | null = null;

    let wallCount = 0;
    let pillarCount = 0;

    interface Room { x: number; z: number; w: number; h: number; type: 'start' | 'crypt' | 'library' | 'altar' | 'throne' | 'normal' }
    const rooms: Room[] = roomsList.map(r => {
      const rx = r.rx;
      const rz = r.rz;
      const startX = 2 + rx * 9;
      const startZ = 2 + rz * 9;
      
      let type: Room['type'] = 'normal';
      if (r.type === 'start') type = 'start';
      else if (r.type === 'treasure') type = 'altar';
      else if (r.type === 'shop') type = 'library';
      else if (r.type === 'boss') type = 'throne';
      else if (r.type === 'secret') type = 'crypt';

      return {
        x: startX,
        z: startZ,
        w: 7,
        h: 7,
        type
      };
    });

    let zoneType: Room['type'] = 'normal';
    if (activeZone === 1) zoneType = 'crypt';
    if (activeZone === 2) zoneType = 'library';
    if (activeZone === 3) zoneType = 'altar';
    if (activeZone === 4) zoneType = 'throne';

    // Count wall & pillar allocations
    for (let z = 0; z < mapHeight; z++) {
      for (let x = 0; x < mapWidth; x++) {
        if (grid[z][x] === 1) wallCount++;
        if (grid[z][x] === 2) pillarCount++;
      }
    }

    const wallTex = this.createStoneTexture(false, theme);
    const floorTex = this.createStoneTexture(true, theme);
    const floorRoughTex = this.createStoneRoughnessTexture();
    const stoneBumpTex = this.createStoneBumpTexture();

    const wallMat = new THREE.MeshStandardMaterial({ 
      map: wallTex, 
      bumpMap: stoneBumpTex, 
      bumpScale: 1.6,
      roughness: 0.85 
    });

    const trimMat = new THREE.MeshStandardMaterial({ color: '#1c1917', metalness: 0.8, roughness: 0.2 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.9, roughness: 0.1 });

    // Decorative geometries
    const tombstoneGeo = new THREE.BoxGeometry(3.5, 6.5, 1.8);
    const tombstoneMat = new THREE.MeshStandardMaterial({ 
      color: '#4b5563', 
      bumpMap: stoneBumpTex,
      bumpScale: 1.0,
      roughness: 0.9 
    });

    const rockGeos = [
      new THREE.BoxGeometry(1.5, 1.2, 1.5),
      new THREE.BoxGeometry(2.2, 1.8, 2.0),
      new THREE.BoxGeometry(1.0, 0.8, 1.1)
    ];
    const rockMat = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.95 });

    const bookshelfGeo = new THREE.BoxGeometry(12, 18, 4);
    const bookshelfMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 });

    const sarcophagusGeo = new THREE.BoxGeometry(11, 5, 16);
    const sarcophagusMat = new THREE.MeshStandardMaterial({ 
      color: '#374151', 
      bumpMap: stoneBumpTex,
      bumpScale: 1.2,
      roughness: 0.85 
    });

    // Instanced Walls & Pillars
    const wallGroup = new THREE.Group();
    const coreGeo = new THREE.BoxGeometry(tileSize * 0.96, 36, tileSize * 0.96);
    const topTrimGeo = new THREE.BoxGeometry(tileSize * 1.04, 3, tileSize * 1.04);
    const bottomTrimGeo = new THREE.BoxGeometry(tileSize * 1.04, 2, tileSize * 1.04);
    const brickGeo = new THREE.BoxGeometry(9, 4, 1.8);

    const instCore = new THREE.InstancedMesh(coreGeo, wallMat, wallCount);
    const instTopTrim = new THREE.InstancedMesh(topTrimGeo, trimMat, wallCount);
    const instBottomTrim = new THREE.InstancedMesh(bottomTrimGeo, trimMat, wallCount);
    const instBricks = new THREE.InstancedMesh(brickGeo, wallMat, wallCount * 8);

    instCore.castShadow = true;
    instCore.receiveShadow = true;
    instTopTrim.castShadow = true;
    instBottomTrim.receiveShadow = true;
    instBricks.castShadow = true;
    instBricks.receiveShadow = true;

    wallGroup.add(instCore);
    wallGroup.add(instTopTrim);
    wallGroup.add(instBottomTrim);
    wallGroup.add(instBricks);

    const pillarGroup = new THREE.Group();
    const columnGeo = new THREE.CylinderGeometry(5.5, 5.5, 33, 8);
    const pillarBaseGeo = new THREE.BoxGeometry(13, 2, 13);
    const columnMat = new THREE.MeshStandardMaterial({ color: '#1a1426', bumpMap: stoneBumpTex, bumpScale: 1.4, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.8, roughness: 0.2 });

    const instColumn = new THREE.InstancedMesh(columnGeo, columnMat, pillarCount || 1);
    const instPillarBase = new THREE.InstancedMesh(pillarBaseGeo, goldMat, pillarCount || 1);
    const instPillarCapital = new THREE.InstancedMesh(pillarBaseGeo, goldMat, pillarCount || 1);

    instColumn.castShadow = true;
    instColumn.receiveShadow = true;
    instPillarBase.receiveShadow = true;
    instPillarCapital.castShadow = true;

    pillarGroup.add(instColumn);
    pillarGroup.add(instPillarBase);
    pillarGroup.add(instPillarCapital);

    let wallIdx = 0;
    let brickIdx = 0;
    let pillarIdx = 0;

    const dummy = new THREE.Object3D();

    for (let z = 0; z < mapHeight; z++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = grid[z][x];
        const wx = x * tileSize;
        const wz = z * tileSize;

        if (tile === 1) {
          dummy.position.set(wx, 18, wz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          instCore.setMatrixAt(wallIdx, dummy.matrix);

          dummy.position.set(wx, 18 + 16.5, wz);
          dummy.updateMatrix();
          instTopTrim.setMatrixAt(wallIdx, dummy.matrix);

          dummy.position.set(wx, 18 - 17, wz);
          dummy.updateMatrix();
          instBottomTrim.setMatrixAt(wallIdx, dummy.matrix);

          const faces = [
            { nx: 0, nz: 1, rotY: 0 },
            { nx: 0, nz: -1, rotY: Math.PI },
            { nx: 1, nz: 0, rotY: Math.PI / 2 },
            { nx: -1, nz: 0, rotY: -Math.PI / 2 }
          ];

          faces.forEach(face => {
            for (let b = 0; b < 2; b++) {
              const bx = (Math.random() - 0.5) * (tileSize - 12);
              const by = 18 - 12 + Math.random() * 24;
              const offset = tileSize / 2 + 0.5;

              const px = wx + face.nx * offset + (face.nz * bx);
              const py = by;
              const pz = wz + face.nz * offset + (-face.nx * bx);

              dummy.position.set(px, py, pz);
              dummy.rotation.set(0, face.rotY + (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05);
              dummy.updateMatrix();
              instBricks.setMatrixAt(brickIdx++, dummy.matrix);
            }
          });

          wallIdx++;
        } else if (tile === 2) {
          dummy.position.set(wx, 18, wz);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          instColumn.setMatrixAt(pillarIdx, dummy.matrix);

          dummy.position.set(wx, 18 - 17, wz);
          dummy.updateMatrix();
          instPillarBase.setMatrixAt(pillarIdx, dummy.matrix);

          dummy.position.set(wx, 18 + 17, wz);
          dummy.updateMatrix();
          instPillarCapital.setMatrixAt(pillarIdx, dummy.matrix);

          pillarIdx++;
        } else if (tile === 3 || tile === 4 || tile === 5) {
          const doorColor = tile === 3 ? '#ca8a04' : tile === 4 ? '#2563eb' : '#b91c1c';
          const doorMat = new THREE.MeshStandardMaterial({
            color: doorColor,
            emissive: doorColor,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
          });
          const archMat = new THREE.MeshStandardMaterial({ color: '#1c1917', metalness: 0.7, roughness: 0.3 });
          const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 18, 3), archMat);
          const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 18, 3), archMat);
          const topArch = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 3), archMat);
          const doorPane = new THREE.Mesh(new THREE.BoxGeometry(12, 16, 1.2), doorMat);
          
          const doorGrp = new THREE.Group();
          doorGrp.name = `door-${x}-${z}`;
          
          leftPillar.position.set(-7, 9, 0);
          rightPillar.position.set(7, 9, 0);
          topArch.position.set(0, 18.5, 0);
          doorPane.position.set(0, 8, 0);
          
          leftPillar.castShadow = true;
          rightPillar.castShadow = true;
          topArch.castShadow = true;
          doorPane.castShadow = true;
          
          doorGrp.add(leftPillar, rightPillar, topArch, doorPane);
          doorGrp.position.set(wx, 0, wz);
          
          const leftWall = x > 0 && grid[z][x - 1] === 1;
          const rightWall = x < mapWidth - 1 && grid[z][x + 1] === 1;
          if (leftWall || rightWall) {
            doorGrp.rotation.y = Math.PI / 2;
          }
          scene.add(doorGrp);
        } else if (tile === 8) {
          const portalMat = new THREE.MeshStandardMaterial({
            color: '#7e22ce',
            emissive: '#6b21a8',
            emissiveIntensity: 0.8,
            roughness: 0.1
          });
          const portalRing = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.4, 32), portalMat);
          portalRing.position.set(wx, 0.2, wz);
          portalRing.name = `portal-${x}-${z}`;
          scene.add(portalRing);
          
          const pLight = new THREE.PointLight('#a855f7', 10, 45, 1.5);
          pLight.position.set(wx, 6, wz);
          scene.add(pLight);
        } else {
          // Breakable Props: Wooden Barrels & Gothic Pottery Urns
          if (Math.random() < 0.045) {
            const isUrn = Math.random() < 0.5;
            const bId = isUrn ? `urn-${x}-${z}` : `barrel-${x}-${z}`;
            let propMesh: THREE.Mesh;
            if (isUrn) {
              const urnGeo = new THREE.CylinderGeometry(3.2, 5.0, 9.5, 8);
              const urnMat = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.72, metalness: 0.1 });
              propMesh = new THREE.Mesh(urnGeo, urnMat);
              propMesh.position.set(wx, 4.75, wz);

              const rimGeo = new THREE.CylinderGeometry(3.6, 3.2, 1.8, 8);
              const rimMat = new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.65 });
              const rim = new THREE.Mesh(rimGeo, rimMat);
              rim.position.y = 5.0;
              propMesh.add(rim);
            } else {
              const barrelGeo = new THREE.CylinderGeometry(5, 5.5, 11, 8);
              const barrelMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
              propMesh = new THREE.Mesh(barrelGeo, barrelMat);
              propMesh.position.set(wx, 5.5, wz);
            }

            propMesh.castShadow = true;
            propMesh.receiveShadow = true;
            scene.add(propMesh);

            barrelMeshes.set(bId, propMesh);
            barrelsList.push({ id: bId, x: wx, z: wz, isBroken: false, isUrn });
          }

          // Tombstones
          if (zoneType === 'crypt' && Math.random() < 0.03) {
            const tombstone = new THREE.Mesh(tombstoneGeo, tombstoneMat);
            tombstone.position.set(wx + (Math.random() - 0.5) * 8, 3.25, wz + (Math.random() - 0.5) * 8);
            tombstone.rotation.set(
              (Math.random() - 0.5) * 0.15,
              Math.random() * Math.PI,
              (Math.random() - 0.5) * 0.15
            );
            tombstone.castShadow = true;
            tombstone.receiveShadow = true;
            scene.add(tombstone);
          }

          // Rock Debris
          if (Math.random() < 0.02) {
            const rockCount = 2 + Math.floor(Math.random() * 3);
            const rx = wx + (Math.random() - 0.5) * 10;
            const rz = wz + (Math.random() - 0.5) * 10;
            for (let r = 0; r < rockCount; r++) {
              const rockGeo = rockGeos[Math.floor(Math.random() * rockGeos.length)];
              const rock = new THREE.Mesh(rockGeo, rockMat);
              rock.position.set(
                rx + (Math.random() - 0.5) * 4,
                0.5,
                rz + (Math.random() - 0.5) * 4
              );
              rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
              rock.castShadow = true;
              scene.add(rock);
            }
          }

          // Wall Torches list
          if (z < mapHeight - 1 && grid[z + 1][x] === 0 && Math.random() < 0.15) {
            wallTorches.push({
              x: wx,
              z: wz + tileSize / 2,
              animOffset: Math.random() * 1000
            });
          }
        }
      }
    }

    // Overhead arches
    for (let z = 1; z < mapHeight - 1; z++) {
      for (let x = 1; x < mapWidth - 1; x++) {
        if (grid[z][x] === 0 && grid[z][x - 1] === 1 && grid[z][x + 1] === 1) {
          if (z % 3 === 0) {
            this.createOverheadArch(scene, x * tileSize, z * tileSize, 0, swayingChains);
          }
        } else if (grid[z][x] === 0 && grid[z - 1][x] === 1 && grid[z + 1][x] === 1) {
          if (x % 3 === 0) {
            this.createOverheadArch(scene, x * tileSize, z * tileSize, Math.PI / 2, swayingChains);
          }
        }
      }
    }

    // Special rooms decoration
    rooms.forEach(room => {
      const rx = (room.x + room.w / 2) * tileSize;
      const rz = (room.z + room.h / 2) * tileSize;

      if (room.type !== 'start') {
        const midX = Math.floor(room.x + room.w / 2) * tileSize;
        const topZ = room.z * tileSize;
        const bottomZ = (room.z + room.h) * tileSize;
        this.createArchway(scene, midX, topZ, 0, stoneBumpTex);
        this.createArchway(scene, midX, bottomZ, 0, stoneBumpTex);
      }

      // Chandelier
      const chandelier = new THREE.Group();
      chandelier.position.set(rx, 28, rz);
      
      const chanGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 4);
      const ironMat = new THREE.MeshStandardMaterial({ color: '#1c1917', metalness: 0.9 });
      const chan = new THREE.Mesh(chanGeo, ironMat);
      chan.position.y = 4;
      chandelier.add(chan);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.6, 8, 24), ironMat);
      ring.rotation.x = Math.PI / 2;
      chandelier.add(ring);

      const candleGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6);
      const candleMat = new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.9 });
      const flameGeo = new THREE.SphereGeometry(0.7, 6, 6);
      const flameMat = new THREE.MeshBasicMaterial({ color: '#ff7f00' });
      const orangeGlowTex = this.createGlowTexture('rgba(251, 191, 36, 0.35)');

      for (let c = 0; c < 4; c++) {
        const angle = (c / 4) * Math.PI * 2;
        const cx = Math.cos(angle) * 6;
        const cz = Math.sin(angle) * 6;

        const candle = new THREE.Mesh(candleGeo, candleMat);
        candle.position.set(cx, 1.25, cz);
        candle.castShadow = true;
        chandelier.add(candle);

        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(cx, 2.7, cz);
        chandelier.add(flame);

        const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: orangeGlowTex, blending: THREE.AdditiveBlending }));
        corona.position.set(cx, 2.7, cz);
        corona.scale.set(6, 6, 1);
        chandelier.add(corona);
      }

      scene.add(chandelier);

      const roomLight = new THREE.PointLight(theme.torch, 18.0, 180, 1.3);
      roomLight.position.set(rx, 26, rz);
      roomLight.castShadow = true;
      roomLight.shadow.mapSize.width = 256;
      roomLight.shadow.mapSize.height = 256;
      scene.add(roomLight);
      torchLights.push(roomLight);

      if (room.type === 'library') {
        for (let bx = room.x + 1; bx < room.x + room.w - 1; bx++) {
          const bs1 = new THREE.Mesh(bookshelfGeo, bookshelfMat);
          bs1.position.set(bx * tileSize, 9, room.z * tileSize + 3);
          bs1.castShadow = true;
          scene.add(bs1);

          const bs2 = new THREE.Mesh(bookshelfGeo, bookshelfMat);
          bs2.position.set(bx * tileSize, 9, (room.z + room.h - 1) * tileSize - 3);
          bs2.castShadow = true;
          scene.add(bs2);
        }
        // 3 Shop pedestals
        const pedMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.8, metalness: 0.6 });
        const xs = [rx - 45, rx, rx + 45];
        xs.forEach(px => {
          const pedBase = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 4, 8), pedMat);
          pedBase.position.set(px, 2, rz);
          pedBase.castShadow = true;
          pedBase.receiveShadow = true;
          scene.add(pedBase);
        });
      } else if (room.type === 'crypt') {
        const tomb = new THREE.Mesh(sarcophagusGeo, sarcophagusMat);
        tomb.position.set(rx, 2.5, rz);
        tomb.rotation.y = Math.PI / 2;
        tomb.castShadow = true;
        tomb.receiveShadow = true;
        scene.add(tomb);
      } else if (room.type === 'altar') {
        // Treasure Pedestal
        const pedMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.8, metalness: 0.7 });
        const pedBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 4.8, 8), pedMat);
        pedBase.position.set(rx, 2.4, rz);
        pedBase.castShadow = true;
        pedBase.receiveShadow = true;
        scene.add(pedBase);

        const goldTrim = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.6, 8), goldTrimMat);
        goldTrim.position.set(rx, 4.8, rz);
        goldTrim.castShadow = true;
        scene.add(goldTrim);
      } else if (room.type === 'throne') {
        const throneGrp = new THREE.Group();
        throneGrp.position.set(rx, 0, rz);

        const carpetGeo = new THREE.PlaneGeometry(12, 30);
        const carpetMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.9 });
        const carpet = new THREE.Mesh(carpetGeo, carpetMat);
        carpet.rotation.x = -Math.PI / 2;
        carpet.position.set(0, 0.1, 8);
        throneGrp.add(carpet);

        const seatGeo = new THREE.BoxGeometry(8, 5, 8);
        const seatMat = new THREE.MeshStandardMaterial({ color: '#3f200f', roughness: 0.85 });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.y = 2.5;
        seat.castShadow = true;
        throneGrp.add(seat);

        const backrestGeo = new THREE.BoxGeometry(8, 17, 1.5);
        const goldMat = new THREE.MeshStandardMaterial({ color: '#ca8a04', metalness: 0.85, roughness: 0.25 });
        const backrest = new THREE.Mesh(backrestGeo, goldMat);
        backrest.position.set(0, 11, -3.25);
        backrest.castShadow = true;
        throneGrp.add(backrest);

        const padGeo = new THREE.BoxGeometry(6, 13, 0.6);
        const padMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.9 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(0, 10.5, -2.4);
        throneGrp.add(pad);

        scene.add(throneGrp);
      }
    });

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(mapWidth * tileSize, mapHeight * tileSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughnessMap: floorRoughTex,
      bumpMap: stoneBumpTex,
      bumpScale: 1.5,
      metalness: 0.55,
      roughness: 1.0
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(
      ((mapWidth - 1) * tileSize) / 2,
      0,
      ((mapHeight - 1) * tileSize) / 2
    );
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Wall Torches
    const torchGlowTex = this.createGlowTexture('rgba(251, 140, 0, 0.45)');
    wallTorches.forEach(t => {
      const torchGroup = new THREE.Group();
      torchGroup.position.set(t.x, 16, t.z + 1);

      const mountGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 6);
      const mountMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
      const mount = new THREE.Mesh(mountGeo, mountMat);
      mount.position.set(0, 0, 1.5);
      mount.rotation.x = Math.PI / 4;
      mount.castShadow = true;
      torchGroup.add(mount);

      const ringGeo = new THREE.CylinderGeometry(0.8, 0.8, 1, 6);
      const ringMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 1.5, 3.25);
      torchGroup.add(ring);

      const flameGeo = new THREE.SphereGeometry(1.2, 6, 6);
      const flameMat = new THREE.MeshBasicMaterial({ color: theme.torch });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 2.3, 3.25);
      flame.name = 'flameCore';
      torchGroup.add(flame);

      const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: torchGlowTex, blending: THREE.AdditiveBlending }));
      corona.position.set(0, 2.3, 3.25);
      corona.scale.set(10, 10, 1);
      torchGroup.add(corona);

      scene.add(torchGroup);

      const torchLight = new THREE.PointLight(theme.torch, 12.0, 100, 1.6);
      torchLight.position.set(t.x, 18.5, t.z + 4.25);
      torchLight.castShadow = false;
      scene.add(torchLight);
      torchLights.push(torchLight);
    });

    // Puddles
    const puddleGeo = new THREE.RingGeometry(0, 7.5, 16);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: theme.puddle,
      metalness: 1.0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.7
    });

    rooms.forEach(room => {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let p = 0; p < count; p++) {
        const px = (room.x + 1.5 + Math.random() * (room.w - 3)) * tileSize;
        const pz = (room.z + 1.5 + Math.random() * (room.h - 3)) * tileSize;

        const puddle = new THREE.Mesh(puddleGeo, puddleMat);
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(px, 0.05, pz);
        puddle.receiveShadow = true;
        scene.add(puddle);
      }
    });

    // Spawn Chest if exists in activeChest state
    if (activeChest) {
      chestMesh = new THREE.Group();
      chestMesh.position.set(activeChest.x, 0, activeChest.y);
      chestMesh.name = 'chestMesh';

      // Chest Body
      const cBodyGeo = new THREE.BoxGeometry(7, 5.5, 5.5);
      const cBodyMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.75 });
      const cBody = new THREE.Mesh(cBodyGeo, cBodyMat);
      cBody.position.y = 2.75;
      cBody.castShadow = true;
      chestMesh.add(cBody);

      // Chest Lid
      const cLidGeo = new THREE.BoxGeometry(7.4, 2.5, 6);
      const cLidMat = new THREE.MeshStandardMaterial({ color: '#78350f', metalness: 0.3, roughness: 0.6 });
      const cLid = new THREE.Mesh(cLidGeo, cLidMat);
      cLid.name = 'chestLid';
      cLid.position.set(0, 5.5, 0);
      cLid.castShadow = true;
      chestMesh.add(cLid);

      // Gold lock
      const lockGeo = new THREE.BoxGeometry(1.6, 2.2, 0.8);
      const lock = new THREE.Mesh(lockGeo, goldTrimMat);
      lock.position.set(0, 4.25, 2.85);
      chestMesh.add(lock);

      scene.add(chestMesh);
    }

    return {
      grid,
      swayingChains,
      barrelMeshes,
      barrelsList,
      wallTorches,
      torchLights,
      chestMesh,
      wallGroup,
      pillarGroup,
      floorMesh
    };
  }

  public static generateTown(
    scene: THREE.Scene,
    tileSize: number = 30,
    townPortal?: { active: boolean; returnFloor: number; returnX: number; returnY: number } | null
  ): DungeonData {
    const mapWidth = 26;
    const mapHeight = 26;
    const grid: number[][] = [];
    for (let z = 0; z < mapHeight; z++) {
      grid[z] = [];
      for (let x = 0; x < mapWidth; x++) {
        // Center plaza is walkable floor (0), borders are solid stone buildings (1)
        if (x >= 4 && x <= 21 && z >= 4 && z <= 21) {
          grid[z][x] = 0;
        } else {
          grid[z][x] = 1;
        }
      }
    }

    const wallGroup = new THREE.Group();
    const pillarGroup = new THREE.Group();
    const swayingChains: THREE.Group[] = [];
    const barrelMeshes = new Map<string, THREE.Mesh>();
    const barrelsList: { id: string; x: number; z: number; isBroken: boolean; isUrn?: boolean }[] = [];
    const wallTorches: { x: number; z: number; animOffset: number }[] = [];
    const torchLights: THREE.PointLight[] = [];

    // Floor Mesh: Warm Gothic Cobblestone Square
    const floorGeo = new THREE.PlaneGeometry(mapWidth * tileSize, mapHeight * tileSize, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#26211e',
      roughness: 0.88,
      metalness: 0.12
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set((mapWidth * tileSize) / 2, 0, (mapHeight * tileSize) / 2);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Border Town Walls & Timber Cottages
    const wallGeo = new THREE.BoxGeometry(tileSize, 32, tileSize);
    const wallMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
    const roofGeo = new THREE.ConeGeometry(tileSize * 0.72, 16, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#450a0a', roughness: 0.75 });

    for (let z = 0; z < mapHeight; z++) {
      for (let x = 0; x < mapWidth; x++) {
        if (grid[z][x] === 1) {
          const wx = x * tileSize + tileSize / 2;
          const wz = z * tileSize + tileSize / 2;
          const house = new THREE.Mesh(wallGeo, wallMat);
          house.position.set(wx, 16, wz);
          house.castShadow = true;
          house.receiveShadow = true;
          wallGroup.add(house);

          if ((x + z) % 3 === 0) {
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(wx, 40, wz);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            wallGroup.add(roof);
          }
        }
      }
    }

    const npcs: { id: 'sage' | 'blacksmith' | 'witch'; x: number; z: number; name: string; mesh: THREE.Group }[] = [];

    // 1. Central Blood Well / Fountain of Vitality (Center of Town at 390, 390)
    const bloodFountainMesh = new THREE.Group();
    const fX = 13 * tileSize;
    const fZ = 13 * tileSize;
    bloodFountainMesh.position.set(fX, 0, fZ);
    // Stone basin
    const basinGeo = new THREE.CylinderGeometry(14, 16, 6, 16);
    const basinMat = new THREE.MeshStandardMaterial({ color: '#44403c', roughness: 0.8 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 3;
    basin.castShadow = true;
    bloodFountainMesh.add(basin);
    // Glowing liquid inside
    const liquidGeo = new THREE.CylinderGeometry(12.5, 12.5, 1.2, 16);
    const liquidMat = new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#991b1b', emissiveIntensity: 0.8, roughness: 0.2 });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = 5.2;
    bloodFountainMesh.add(liquid);
    // Central gargoyle pillar
    const centerPillar = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 16, 8), basinMat);
    centerPillar.position.y = 10;
    centerPillar.castShadow = true;
    bloodFountainMesh.add(centerPillar);
    // Fountain light
    const fLight = new THREE.PointLight('#ef4444', 18, 90, 1.4);
    fLight.position.set(0, 12, 0);
    bloodFountainMesh.add(fLight);
    scene.add(bloodFountainMesh);

    // 2. Town Campfire
    const campfireMesh = new THREE.Group();
    const cX = 10 * tileSize;
    const cZ = 11 * tileSize;
    campfireMesh.position.set(cX, 0, cZ);
    const fireStoneGeo = new THREE.DodecahedronGeometry(1.8);
    const fireStoneMat = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const stone = new THREE.Mesh(fireStoneGeo, fireStoneMat);
      const angle = (i / 8) * Math.PI * 2;
      stone.position.set(Math.cos(angle) * 6, 1, Math.sin(angle) * 6);
      campfireMesh.add(stone);
    }
    const logMat = new THREE.MeshStandardMaterial({ color: '#29180c', roughness: 0.95 });
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 8, 5), logMat);
      log.rotation.z = 0.5;
      log.rotation.y = (l / 4) * Math.PI;
      log.position.y = 2;
      campfireMesh.add(log);
    }
    const fireLight = new THREE.PointLight('#f97316', 28, 120, 1.2);
    fireLight.position.set(0, 5, 0);
    campfireMesh.add(fireLight);
    scene.add(campfireMesh);

    // 3. NPC: Raziel (The Spectral Sage / Deckard Cain & Tyrael of Lorek)
    const sageMesh = new THREE.Group();
    const sX = 9 * tileSize;
    const sZ = 10 * tileSize;
    sageMesh.position.set(sX, 0, sZ);
    const robeMat = new THREE.MeshStandardMaterial({ color: '#0c4a6e', roughness: 0.6 });
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 4.2, 14, 8), robeMat);
    robe.position.y = 7;
    robe.castShadow = true;
    sageMesh.add(robe);
    // Head with wraith cowl
    const cowl = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.5 }));
    cowl.position.y = 15;
    sageMesh.add(cowl);
    // Glowing spectral eyes / soul wisps
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), eyeMat);
    eyeL.position.set(-0.8, 15.2, 2.2);
    sageMesh.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), eyeMat);
    eyeR.position.set(0.8, 15.2, 2.2);
    sageMesh.add(eyeR);
    // Ancient glowing tome on stone lectern
    const lectern = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 3), basinMat);
    lectern.position.set(0, 4, 4.5);
    lectern.castShadow = true;
    sageMesh.add(lectern);
    const tomeGeo = new THREE.BoxGeometry(3.6, 0.8, 2.6);
    const tomeMat = new THREE.MeshStandardMaterial({ color: '#0369a1', emissive: '#0284c7', emissiveIntensity: 0.8 });
    const tome = new THREE.Mesh(tomeGeo, tomeMat);
    tome.position.set(0, 8.4, 4.5);
    sageMesh.add(tome);
    const sageLight = new THREE.PointLight('#38bdf8', 12, 45, 1.4);
    sageLight.position.set(0, 10, 4.5);
    sageMesh.add(sageLight);
    scene.add(sageMesh);
    npcs.push({ id: 'sage', x: sX, z: sZ, name: 'Raziel', mesh: sageMesh });

    // 4. NPC: Thorne the Bloodsmith
    const smithMesh = new THREE.Group();
    const smX = 17 * tileSize;
    const smZ = 10 * tileSize;
    smithMesh.position.set(smX, 0, smZ);
    const smithBodyMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7 });
    const smithBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 14, 4), smithBodyMat);
    smithBody.position.y = 7;
    smithBody.castShadow = true;
    smithMesh.add(smithBody);
    // Head
    const sHead = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 3.5), new THREE.MeshStandardMaterial({ color: '#d4a373' }));
    sHead.position.y = 15.5;
    smithMesh.add(sHead);
    // Heavy Anvil
    const anvilMat = new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.85, roughness: 0.25 });
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(5.5, 6.5, 3.5), anvilMat);
    anvil.position.set(0, 3.25, 4.5);
    anvil.castShadow = true;
    smithMesh.add(anvil);
    // Forge Coals
    const coalsGeo = new THREE.BoxGeometry(7, 4, 7);
    const coalsMat = new THREE.MeshStandardMaterial({ color: '#ea580c', emissive: '#dc2626', emissiveIntensity: 0.9 });
    const coals = new THREE.Mesh(coalsGeo, coalsMat);
    coals.position.set(5.5, 2, 0);
    smithMesh.add(coals);
    const smithLight = new THREE.PointLight('#f97316', 15, 60, 1.3);
    smithLight.position.set(5.5, 7, 0);
    smithMesh.add(smithLight);
    scene.add(smithMesh);
    npcs.push({ id: 'blacksmith', x: smX, z: smZ, name: 'Thorne the Bloodsmith', mesh: smithMesh });

    // 5. NPC: Lysandra the Witch / Alchemist
    const witchMesh = new THREE.Group();
    const wX = 10 * tileSize;
    const wZ = 16 * tileSize;
    witchMesh.position.set(wX, 0, wZ);
    const witchRobeMat = new THREE.MeshStandardMaterial({ color: '#581c87', roughness: 0.75 });
    const witchRobe = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 4.2, 13.5, 8), witchRobeMat);
    witchRobe.position.y = 6.75;
    witchRobe.castShadow = true;
    witchMesh.add(witchRobe);
    // Pointed Witch Hat
    const hat = new THREE.Mesh(new THREE.ConeGeometry(3.5, 6.5, 8), witchRobeMat);
    hat.position.y = 16.5;
    witchMesh.add(hat);
    // Bubbling Witch Cauldron
    const cauldronMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.7, roughness: 0.4 });
    const cauldron = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8), cauldronMat);
    cauldron.position.set(0, 3.8, 5);
    cauldron.scale.y = 0.8;
    witchMesh.add(cauldron);
    const brewMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#16a34a', emissiveIntensity: 0.8 });
    const brew = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.6, 12), brewMat);
    brew.position.set(0, 5.2, 5);
    witchMesh.add(brew);
    const witchLight = new THREE.PointLight('#22c55e', 14, 55, 1.4);
    witchLight.position.set(0, 8, 5);
    witchMesh.add(witchLight);
    scene.add(witchMesh);
    npcs.push({ id: 'witch', x: wX, z: wZ, name: 'Lysandra the Witch', mesh: witchMesh });

    // 6. The Grand Catacombs Gate / Descent Archway (North side at 390, 180)
    const catacombsGateMesh = new THREE.Group();
    const gX = 13 * tileSize;
    const gZ = 6 * tileSize;
    catacombsGateMesh.position.set(gX, 0, gZ);
    const archMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.85 });
    // Left & Right Pillars
    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(5.5, 26, 5.5), archMat);
    pLeft.position.set(-11, 13, 0);
    pLeft.castShadow = true;
    catacombsGateMesh.add(pLeft);
    const pRight = new THREE.Mesh(new THREE.BoxGeometry(5.5, 26, 5.5), archMat);
    pRight.position.set(11, 13, 0);
    pRight.castShadow = true;
    catacombsGateMesh.add(pRight);
    // Top Arch Lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(28, 6, 6), archMat);
    lintel.position.set(0, 24, 0);
    lintel.castShadow = true;
    catacombsGateMesh.add(lintel);
    // Swirling Purple Abyss Portal
    const portalDiscMat = new THREE.MeshBasicMaterial({
      color: '#a855f7',
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const portalDisc = new THREE.Mesh(new THREE.CircleGeometry(9.5, 16), portalDiscMat);
    portalDisc.position.set(0, 12, 0);
    catacombsGateMesh.add(portalDisc);
    // Gate Light
    const gateLight = new THREE.PointLight('#c084fc', 24, 80, 1.3);
    gateLight.position.set(0, 13, 2);
    catacombsGateMesh.add(gateLight);
    scene.add(catacombsGateMesh);

    // 7. Azure Town Portal (if return portal active)
    let townPortalMesh: THREE.Group | null = null;
    if (townPortal && townPortal.active) {
      townPortalMesh = new THREE.Group();
      const tpX = 15 * tileSize;
      const tpZ = 15 * tileSize;
      townPortalMesh.position.set(tpX, 0, tpZ);

      const tpRingGeo = new THREE.TorusGeometry(8, 1.4, 12, 24);
      const tpRingMat = new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(tpRingGeo, tpRingMat);
      ring.position.y = 8.5;
      townPortalMesh.add(ring);

      const tpLight = new THREE.PointLight('#38bdf8', 20, 60, 1.4);
      tpLight.position.set(0, 8.5, 0);
      townPortalMesh.add(tpLight);
      scene.add(townPortalMesh);
    }

    return {
      grid,
      swayingChains,
      barrelMeshes,
      barrelsList,
      wallTorches,
      torchLights,
      chestMesh: null,
      wallGroup,
      pillarGroup,
      floorMesh,
      townObjects: {
        npcs,
        catacombsGate: { x: gX, z: gZ, mesh: catacombsGateMesh },
        bloodFountain: { x: fX, z: fZ, mesh: bloodFountainMesh },
        campfire: { x: cX, z: cZ, mesh: campfireMesh },
        townPortalMesh
      }
    };
  }
}
export default DungeonGenerator;

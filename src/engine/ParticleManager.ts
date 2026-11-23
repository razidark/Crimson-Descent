import * as THREE from 'three';

export interface DamageBillboard {
  mesh: THREE.Mesh;
  vy: number;
  life: number;
  maxLife: number;
}

export class ParticleManager {
  private scene: THREE.Scene;
  public damageBillboards: DamageBillboard[] = [];
  
  // High Performance Instanced Rendering Arrays
  private MAX_INSTANCES = 1500;
  
  private instancedMeshes: {
    blood: THREE.InstancedMesh;
    spark: THREE.InstancedMesh;
    fire: THREE.InstancedMesh;
    trail: THREE.InstancedMesh;
    dust: THREE.InstancedMesh;
    smoke: THREE.InstancedMesh;
    mist: THREE.InstancedMesh;
    debris: THREE.InstancedMesh;
  };
  
  private particleState: Record<string, {
    active: boolean[];
    life: number[];
    maxLife: number[];
    vx: number[];
    vy: number[];
    vz: number[];
    rotX: number[];
    rotY: number[];
    rotZ: number[];
    startX: number[];
    startY: number[];
    startZ: number[];
    color: THREE.Color[];
    baseSize: number;
  }> = {};

  private particleGeo = new THREE.DodecahedronGeometry(1, 0);
  private mistGeo = new THREE.PlaneGeometry(1, 1);
  private debrisGeo = new THREE.BoxGeometry(2.5, 1, 1);
  
  private dummy = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Create Instanced Meshes
    this.instancedMeshes = {
      blood: new THREE.InstancedMesh(this.particleGeo, new THREE.MeshBasicMaterial({ transparent: true }), this.MAX_INSTANCES),
      spark: new THREE.InstancedMesh(this.particleGeo, new THREE.MeshBasicMaterial({ transparent: true }), this.MAX_INSTANCES),
      fire: new THREE.InstancedMesh(this.particleGeo, new THREE.MeshBasicMaterial({ transparent: true }), this.MAX_INSTANCES),
      trail: new THREE.InstancedMesh(this.particleGeo, new THREE.MeshBasicMaterial({ transparent: true }), this.MAX_INSTANCES),
      dust: new THREE.InstancedMesh(this.particleGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.25 }), this.MAX_INSTANCES),
      smoke: new THREE.InstancedMesh(this.particleGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35 }), this.MAX_INSTANCES),
      mist: new THREE.InstancedMesh(this.mistGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, visible: false }), 1),
      debris: new THREE.InstancedMesh(this.debrisGeo, new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9, transparent: true }), this.MAX_INSTANCES)
    };

    // Enable shadows where appropriate
    this.instancedMeshes.blood.castShadow = true;
    this.instancedMeshes.debris.castShadow = true;
    
    // Disable frustum culling for instanced meshes to prevent disappearing particles
    for (const key in this.instancedMeshes) {
      const mesh = this.instancedMeshes[key as keyof typeof this.instancedMeshes];
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      
      this.particleState[key] = {
        active: new Array(this.MAX_INSTANCES).fill(false),
        life: new Array(this.MAX_INSTANCES).fill(0),
        maxLife: new Array(this.MAX_INSTANCES).fill(0),
        vx: new Array(this.MAX_INSTANCES).fill(0),
        vy: new Array(this.MAX_INSTANCES).fill(0),
        vz: new Array(this.MAX_INSTANCES).fill(0),
        rotX: new Array(this.MAX_INSTANCES).fill(0),
        rotY: new Array(this.MAX_INSTANCES).fill(0),
        rotZ: new Array(this.MAX_INSTANCES).fill(0),
        startX: new Array(this.MAX_INSTANCES).fill(0),
        startY: new Array(this.MAX_INSTANCES).fill(0),
        startZ: new Array(this.MAX_INSTANCES).fill(0),
        color: new Array(this.MAX_INSTANCES).fill(new THREE.Color()),
        baseSize: this.getBaseSize(key)
      };

      // Hide all instances initially by setting scale to 0
      this.dummy.scale.setScalar(0);
      for (let i = 0; i < this.MAX_INSTANCES; i++) {
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  private getBaseSize(type: string): number {
    switch (type) {
      case 'dust': return 0.4;
      case 'spark': return 0.5;
      case 'blood': return 1.0;
      case 'trail': return 0.7;
      case 'smoke': return 1.2;
      case 'mist': return 18.0;
      case 'debris': return 1.0;
      default: return 0.8;
    }
  }

  public clear() {
    this.damageBillboards.forEach(db => this.scene.remove(db.mesh));
    this.damageBillboards = [];
    
    // Hide all instanced particles
    for (const key in this.instancedMeshes) {
      const state = this.particleState[key];
      const mesh = this.instancedMeshes[key as keyof typeof this.instancedMeshes];
      
      state.active.fill(false);
      this.dummy.scale.setScalar(0);
      for (let i = 0; i < this.MAX_INSTANCES; i++) {
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    color: string,
    maxLife: number,
    type: 'fire' | 'blood' | 'spark' | 'dust' | 'trail' | 'smoke' | 'mist' | 'debris',
    rotX = 0, rotY = 0, rotZ = 0
  ) {
    const state = this.particleState[type];
    const mesh = this.instancedMeshes[type];
    
    // Find first inactive slot
    let idx = state.active.findIndex(a => !a);
    if (idx === -1) {
      // Replace oldest
      idx = Math.floor(Math.random() * this.MAX_INSTANCES);
    }
    
    state.active[idx] = true;
    state.life[idx] = 0;
    state.maxLife[idx] = maxLife;
    state.startX[idx] = x;
    state.startY[idx] = type === 'mist' ? 1.2 : y;
    state.startZ[idx] = z;
    state.vx[idx] = vx;
    state.vy[idx] = vy;
    state.vz[idx] = vz;
    state.rotX[idx] = rotX;
    state.rotY[idx] = rotY;
    state.rotZ[idx] = rotZ;
    state.color[idx] = new THREE.Color(color);
    
    if (mesh.instanceColor) {
      mesh.setColorAt(idx, state.color[idx]);
      mesh.instanceColor.needsUpdate = true;
    }
  }

  public spawnBloodSplatter(x: number, y: number, z: number, count: number) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 6;
      const vy = 4 + Math.random() * 6;
      const vz = (Math.random() - 0.5) * 6;
      const color = Math.random() > 0.4 ? '#b91c1c' : '#7f1d1d';
      this.spawnParticle(x, y, z, vx, vy, vz, color, 0.8 + Math.random() * 0.7, 'blood');
    }
  }

  public spawnSparks(x: number, y: number, z: number, count: number) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 5;
      const vy = 3 + Math.random() * 4;
      const vz = (Math.random() - 0.5) * 5;
      this.spawnParticle(x, y, z, vx, vy, vz, '#fbbf24', 0.4 + Math.random() * 0.4, 'spark');
    }
  }

  public spawnMist(_px: number, _pz: number, _radius: number = 30) {
    return;
  }

  public spawnTorchSmoke(x: number, y: number, z: number) {
    if (Math.random() > 0.4) return;
    const vx = (Math.random() - 0.5) * 1.2;
    const vy = 1.5 + Math.random() * 2.0;
    const vz = (Math.random() - 0.5) * 1.2;
    this.spawnParticle(x, y, z, vx, vy, vz, '#374151', 1.2 + Math.random() * 0.8, 'smoke');
  }

  public spawnBloodNovaRing(
    px: number,
    pz: number,
    triggerShake: (intensity: number) => void,
    triggerFlash: (color: string) => void
  ) {
    for (let i = 0; i < 45; i++) {
      const angle = (i / 45) * Math.PI * 2;
      const speed = 75 + Math.random() * 25;
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;
      const vy = (Math.random() - 0.5) * 4.0;
      this.spawnParticle(
        px, 4, pz, vx, vy, vz,
        Math.random() > 0.4 ? '#ef4444' : '#b91c1c', 
        0.6 + Math.random() * 0.4, 'trail'
      );
    }
    triggerShake(2.0);
    triggerFlash('#7f1d1d');
  }

  public spawn3DDamageNumber(x: number, y: number, z: number, amount: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.font = 'bold 38px monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`-${amount}`, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    const geo = new THREE.PlaneGeometry(16, 8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 22, z);
    this.scene.add(mesh);
    
    this.damageBillboards.push({
      mesh,
      vy: 14.0,
      life: 0,
      maxLife: 0.7
    });
  }

  public smashBarrel(
    barrel: { id: string; x: number; z: number; isBroken: boolean; isUrn?: boolean },
    barrelMeshes: Map<string, THREE.Mesh>,
    triggerShake: (intensity: number) => void,
    volume: number,
    playVampireSound: (type: 'hit' | 'heal' | 'drop' | 'levelUp' | 'click' | 'boss' | 'whip' | 'vacuum' | 'dash' | 'break', volume: number) => void
  ) {
    barrel.isBroken = true;
    const mesh = barrelMeshes.get(barrel.id);
    if (mesh) {
      this.scene.remove(mesh);
      barrelMeshes.delete(barrel.id);
    }

    triggerShake(barrel.isUrn ? 1.4 : 1.1);
    playVampireSound('break', volume);

    const fragmentCount = barrel.isUrn ? 14 : 10;
    for (let i = 0; i < fragmentCount; i++) {
      const col = barrel.isUrn
        ? ['#c2410c', '#ea580c', '#9a3412', '#fdba74'][i % 4]
        : ['#78350f', '#92400e', '#b45309'][i % 3];
      this.spawnParticle(
        barrel.x, 5.5, barrel.z,
        (Math.random() - 0.5) * 48.0,
        32.0 + Math.random() * 45.0,
        (Math.random() - 0.5) * 48.0,
        col,
        1.6,
        'debris',
        Math.random() * 2.2, Math.random() * 2.2, Math.random() * 2.2
      );
    }
    this.spawnSparks(barrel.x, 5.5, barrel.z, barrel.isUrn ? 12 : 8);
  }

  public update(dt: number, cameraAngle: number) {
    const t = performance.now();

    for (const key in this.instancedMeshes) {
      const state = this.particleState[key];
      const mesh = this.instancedMeshes[key as keyof typeof this.instancedMeshes];
      let needsUpdate = false;
      
      for (let i = 0; i < this.MAX_INSTANCES; i++) {
        if (!state.active[i]) continue;
        needsUpdate = true;
        
        state.life[i] += dt;
        const pct = state.life[i] / state.maxLife[i];
        
        if (state.life[i] >= state.maxLife[i]) {
          state.active[i] = false;
          this.dummy.scale.setScalar(0);
          this.dummy.updateMatrix();
          mesh.setMatrixAt(i, this.dummy.matrix);
          continue;
        }

        // Apply physics
        state.startX[i] += state.vx[i] * dt;
        state.startY[i] += state.vy[i] * dt;
        state.startZ[i] += state.vz[i] * dt;
        
        this.dummy.position.set(state.startX[i], state.startY[i], state.startZ[i]);
        let size = state.baseSize;

        if (key === 'fire') {
          state.vy[i] += dt * 1.5;
          size *= (1 - pct);
        } else if (key === 'smoke') {
          state.vy[i] += dt * 0.5;
          state.vx[i] += Math.sin(t / 100 + state.startY[i]) * 0.05;
          size *= (1.2 * (1 + pct * 0.8));
        } else if (key === 'mist') {
          state.vx[i] += Math.sin(t / 300) * 0.02;
          state.rotZ[i] += dt * 0.08;
          this.dummy.rotation.set(-Math.PI / 2, 0, state.rotZ[i]);
        } else if (key === 'blood') {
          state.vy[i] -= 9.8 * dt * 2.5;
          if (state.startY[i] <= 0.5) {
            state.startY[i] = 0.5;
            state.vy[i] = -state.vy[i] * 0.35;
            state.vx[i] *= 0.65;
            state.vz[i] *= 0.65;
          }
          size *= (1 - pct);
        } else if (key === 'spark') {
          state.vy[i] -= 9.8 * dt * 1.5;
          size *= (0.5 * (1 - pct));
        } else if (key === 'trail') {
          size *= (0.7 * (1 - pct));
        } else if (key === 'debris') {
          state.rotX[i] += state.rotX[i] * dt;
          state.rotY[i] += state.rotY[i] * dt;
          state.rotZ[i] += state.rotZ[i] * dt;
          this.dummy.rotation.set(state.rotX[i], state.rotY[i], state.rotZ[i]);
          
          state.vy[i] -= 9.8 * dt * 3.0;
          if (state.startY[i] <= 1.0) {
            state.startY[i] = 1.0;
            state.vy[i] = -state.vy[i] * 0.4;
            state.vx[i] *= 0.6;
            state.vz[i] *= 0.6;
          }
        }

        this.dummy.scale.setScalar(size);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      
      if (needsUpdate) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    }

    // 2. Update Damage Billboards
    this.damageBillboards.forEach(db => {
      db.mesh.position.y += db.vy * dt;
      db.life += dt;
      const pct = db.life / db.maxLife;
      const mat = db.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - pct;
      db.mesh.rotation.y = cameraAngle;
    });

    const deadDB = this.damageBillboards.filter(db => db.life >= db.maxLife);
    deadDB.forEach(db => this.scene.remove(db.mesh));
    this.damageBillboards = this.damageBillboards.filter(db => db.life < db.maxLife);
  }
}
export default ParticleManager;

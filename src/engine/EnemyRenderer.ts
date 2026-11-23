import * as THREE from 'three';
import { Enemy } from '../types/game';

export interface EnemyRendererCallbacks {
  spawnBloodSplatter: (x: number, y: number, z: number, count: number) => void;
  spawn3DDamageNumber: (x: number, y: number, z: number, amount: number) => void;
  flashEnemy: (group: THREE.Group) => void;
  spawnParticle: (x: number, y: number, z: number, vx: number, vy: number, vz: number, color: string, life: number, type: 'fire' | 'blood' | 'spark' | 'dust' | 'trail' | 'smoke' | 'mist') => void;
  onEnemyDeath?: (x: number, z: number) => void;
}

export class EnemyRenderer {
  private scene: THREE.Scene;
  public enemyMeshes = new Map<string, THREE.Group>();
  public enemyLastHp = new Map<string, number>();
  public flashTimers = new Map<string, number>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public clear() {
    for (const group of this.enemyMeshes.values()) {
      this.scene.remove(group);
    }
    this.enemyMeshes.clear();
    this.enemyLastHp.clear();
    this.flashTimers.clear();
  }

  public update(
    enemies: Enemy[],
    _dt: number,
    activeZone: number,
    cameraAngle: number,
    playerX: number,
    tileSize: number,
    mapWidth: number,
    mapHeight: number,
    grid: number[][],
    callbacks: EnemyRendererCallbacks
  ) {
    const activeIds = new Set(enemies.map(e => e.id));

    // Remove dead/missing enemies
    for (const [id, group] of this.enemyMeshes.entries()) {
      if (!activeIds.has(id)) {
        if (callbacks.onEnemyDeath) {
          callbacks.onEnemyDeath(group.position.x, group.position.z);
        }
        this.scene.remove(group);
        this.enemyMeshes.delete(id);
        this.enemyLastHp.delete(id);
        this.flashTimers.delete(id);
      }
    }

    // Add / Update active enemies
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;

      // --- Enemy Wall Collision Check ---
      const enemyRadius = 6.0;
      const eTileX = Math.floor(enemy.x / tileSize);
      const eTileZ = Math.floor(enemy.y / tileSize);

      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = eTileX + dx;
          const z = eTileZ + dz;
          if (x < 0 || x >= mapWidth || z < 0 || z >= mapHeight) continue;

          if (grid[z][x] === 1 || grid[z][x] === 2) {
            const minX = x * tileSize - tileSize / 2;
            const maxX = x * tileSize + tileSize / 2;
            const minZ = z * tileSize - tileSize / 2;
            const maxZ = z * tileSize + tileSize / 2;

            const closestX = Math.max(minX, Math.min(enemy.x, maxX));
            const closestZ = Math.max(minZ, Math.min(enemy.y, maxZ));

            const distX = enemy.x - closestX;
            const distZ = enemy.y - closestZ;
            const dist = Math.hypot(distX, distZ);

            if (dist < enemyRadius) {
              const overlap = enemyRadius - dist;
              if (dist > 0.01) {
                enemy.x += (distX / dist) * overlap;
                enemy.y += (distZ / dist) * overlap;
              } else {
                enemy.x += overlap;
              }
            }
          }
        }
      }

      let group = this.enemyMeshes.get(enemy.id);

      if (!group) {
        group = new THREE.Group();
        
        // 3D Floating Health Bar
        const hbGroup = new THREE.Group();
        hbGroup.position.set(0, 20.5, 0);
        hbGroup.name = 'healthBar';
        
        const bgGeo = new THREE.BoxGeometry(7, 0.7, 0.2);
        const bgMat = new THREE.MeshBasicMaterial({ color: '#7f1d1d' });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.userData.isUI = true;
        hbGroup.add(bg);
        
        const fgGeo = new THREE.BoxGeometry(7, 0.7, 0.2);
        const fgMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
        const fg = new THREE.Mesh(fgGeo, fgMat);
        fg.position.z = 0.1;
        fg.name = 'fg';
        fg.userData.isUI = true;
        hbGroup.add(fg);
        
        group.add(hbGroup);

        if (enemy.type === 'bat') {
          // --- HIGH FIDELITY 3D VAMPIRE BAT ---
          const batMat = new THREE.MeshStandardMaterial({ color: '#2e1065', roughness: 0.6, metalness: 0.2 });
          const wingMembraneMat = new THREE.MeshStandardMaterial({
            color: '#1e0b4b',
            roughness: 0.7,
            side: THREE.DoubleSide
          });
          const eyeMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

          // Torso & Furry Chest
          const bodyGeo = new THREE.ConeGeometry(2.4, 5.5, 7);
          const body = new THREE.Mesh(bodyGeo, batMat);
          body.rotation.x = Math.PI / 2.2;
          body.castShadow = true;
          group.add(body);

          // Head with fanged snout
          const headGeo = new THREE.SphereGeometry(2.0, 8, 8);
          const head = new THREE.Mesh(headGeo, batMat);
          head.position.set(0, 1.2, 3.2);
          group.add(head);

          // Pointed Ears
          for (const s of [-1, 1]) {
            const earGeo = new THREE.ConeGeometry(0.65, 2.2, 4);
            const ear = new THREE.Mesh(earGeo, batMat);
            ear.position.set(s * 1.3, 3.0, 3.0);
            ear.rotation.z = -s * 0.35;
            ear.rotation.x = -0.2;
            group.add(ear);

            // Glowing Predator Eyes
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), eyeMat);
            eye.position.set(s * 0.75, 1.4, 4.8);
            group.add(eye);

            // Fangs
            const fang = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
            fang.position.set(s * 0.45, 0.4, 4.8);
            fang.rotation.x = Math.PI;
            group.add(fang);
          }

          // Articulated Left Wing
          const leftWingGroup = new THREE.Group();
          leftWingGroup.position.set(-1.8, 1.2, 0.5);
          leftWingGroup.name = 'leftWing';

          const wingArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 6, 6), batMat);
          wingArmL.position.set(-3, 0.5, 0);
          wingArmL.rotation.z = Math.PI / 2.6;
          leftWingGroup.add(wingArmL);

          const membraneL = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5, 2, 2), wingMembraneMat);
          membraneL.position.set(-4.2, -1.2, 0);
          membraneL.rotation.x = Math.PI / 2;
          membraneL.castShadow = true;
          leftWingGroup.add(membraneL);
          group.add(leftWingGroup);

          // Articulated Right Wing
          const rightWingGroup = new THREE.Group();
          rightWingGroup.position.set(1.8, 1.2, 0.5);
          rightWingGroup.name = 'rightWing';

          const wingArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 6, 6), batMat);
          wingArmR.position.set(3, 0.5, 0);
          wingArmR.rotation.z = -Math.PI / 2.6;
          rightWingGroup.add(wingArmR);

          const membraneR = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5, 2, 2), wingMembraneMat);
          membraneR.position.set(4.2, -1.2, 0);
          membraneR.rotation.x = Math.PI / 2;
          membraneR.castShadow = true;
          rightWingGroup.add(membraneR);
          group.add(rightWingGroup);

        } else if (enemy.type === 'ghost') {
          // --- HIGH FIDELITY SPECTRAL WRAITH ---
          const ghostMat = new THREE.MeshStandardMaterial({
            color: '#a5f3fc',
            emissive: '#0891b2',
            emissiveIntensity: 0.65,
            transparent: true,
            opacity: 0.62,
            roughness: 0.15,
            metalness: 0.1,
            side: THREE.DoubleSide
          });
          const innerSoulMat = new THREE.MeshBasicMaterial({ color: '#cffafe' });

          // Hooded Head with hollow shadow
          const hoodGeo = new THREE.CylinderGeometry(2.4, 3.8, 5, 8, 1, false);
          const hood = new THREE.Mesh(hoodGeo, ghostMat);
          hood.position.y = 14.5;
          group.add(hood);

          // Pulsing Soul Wisp / Core inside
          const soulCore = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), innerSoulMat);
          soulCore.position.set(0, 11, 0.2);
          soulCore.name = 'soulCore';
          group.add(soulCore);

          // Ethereal Eyes
          const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
          const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), eyeMat);
          eyeL.position.set(-1.0, 14.2, 2.2);
          const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), eyeMat);
          eyeR.position.set(1.0, 14.2, 2.2);
          group.add(eyeL);
          group.add(eyeR);

          // Undulating Spectral Shroud Robes
          const robeGeo = new THREE.CylinderGeometry(3.0, 5.2, 11, 8, 2, true);
          const robe = new THREE.Mesh(robeGeo, ghostMat);
          robe.position.y = 6.5;
          robe.name = 'spectralRobe';
          group.add(robe);

          // Slender Skeletal Ghost Arms
          const armGeo = new THREE.CylinderGeometry(0.4, 0.25, 7.5, 6);
          const leftArm = new THREE.Mesh(armGeo, ghostMat);
          leftArm.position.set(-4.2, 10, 1.5);
          leftArm.rotation.set(0.6, 0, 0.3);
          leftArm.name = 'leftArm';
          group.add(leftArm);

          const rightArm = new THREE.Mesh(armGeo, ghostMat);
          rightArm.position.set(4.2, 10, 1.5);
          rightArm.rotation.set(0.6, 0, -0.3);
          rightArm.name = 'rightArm';
          group.add(rightArm);

        } else if (enemy.type === 'reaper') {
          // --- MAJESTIC DARK ARCHON / REAPER BOSS ---
          const armorMat = new THREE.MeshStandardMaterial({ color: '#09050d', metalness: 0.85, roughness: 0.25 });
          const goldTrimMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.9, roughness: 0.15 });
          const boneMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.7 });
          const soulFlameMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

          // Armored Torso with Spiked Gorget
          const torsoGeo = new THREE.CylinderGeometry(4.5, 3.4, 13, 8);
          const torso = new THREE.Mesh(torsoGeo, armorMat);
          torso.position.y = 9;
          torso.castShadow = true;
          group.add(torso);

          // Gold Trimmed Pectoral Crest
          const crestGeo = new THREE.BoxGeometry(3.8, 2.2, 1.0);
          const crest = new THREE.Mesh(crestGeo, goldTrimMat);
          crest.position.set(0, 12, 3.8);
          group.add(crest);

          // Horned Cowl & Void Face
          const cowlGeo = new THREE.SphereGeometry(4.2, 10, 10);
          const cowl = new THREE.Mesh(cowlGeo, armorMat);
          cowl.position.y = 17.5;
          group.add(cowl);

          // Curved Demon Horns
          for (const s of [-1, 1]) {
            const hornGeo = new THREE.ConeGeometry(0.85, 4.5, 6);
            const horn = new THREE.Mesh(hornGeo, armorMat);
            horn.position.set(s * 2.8, 21.0, 0.5);
            horn.rotation.z = -s * 0.65;
            horn.rotation.x = -0.3;
            group.add(horn);

            // Menacing Glowing Red Eyes
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.6), soulFlameMat);
            eye.position.set(s * 1.3, 17.5, 3.9);
            group.add(eye);
          }

          // Massive Shadow Wings (Arch-Demon silhouette)
          for (const s of [-1, 1]) {
            const wingGroup = new THREE.Group();
            wingGroup.position.set(s * 3.5, 14, -2.5);
            wingGroup.name = s === -1 ? 'bossLeftWing' : 'bossRightWing';

            for (let f = 0; f < 4; f++) {
              const feather = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 10 + f * 2.5, 0.4),
                new THREE.MeshStandardMaterial({ color: '#130a1c', roughness: 0.6, metalness: 0.4 })
              );
              feather.position.set(s * (3.5 + f * 2.5), 1.5 - f * 1.2, -f * 0.6);
              feather.rotation.z = -s * (0.4 + f * 0.2);
              feather.castShadow = true;
              wingGroup.add(feather);
            }
            group.add(wingGroup);
          }

          // Ornate Gigantic Soul Scythe
          const scytheGroup = new THREE.Group();
          scytheGroup.position.set(6.5, 9, 3);
          scytheGroup.name = 'bossScythe';

          // Carved Staff
          const staffGeo = new THREE.CylinderGeometry(0.5, 0.6, 26, 8);
          const staff = new THREE.Mesh(staffGeo, armorMat);
          staff.position.y = 8;
          scytheGroup.add(staff);

          // Golden Skull Socket
          const socketMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 6, 6), goldTrimMat);
          socketMesh.position.set(0, 19.5, 0);
          scytheGroup.add(socketMesh);

          // Curved Bone Soul Blade
          const bladeCurveGeo = new THREE.TorusGeometry(8.5, 0.65, 6, 16, Math.PI / 1.8);
          const blade = new THREE.Mesh(bladeCurveGeo, boneMat);
          blade.position.set(-6.5, 18, 0);
          blade.rotation.z = Math.PI / 1.3;
          blade.castShadow = true;
          scytheGroup.add(blade);

          // Soul-Flame Glowing Blade Edge
          const bladeEdgeGeo = new THREE.TorusGeometry(8.7, 0.25, 4, 16, Math.PI / 1.8);
          const bladeEdge = new THREE.Mesh(bladeEdgeGeo, soulFlameMat);
          bladeEdge.position.set(-6.5, 18, 0.05);
          bladeEdge.rotation.z = Math.PI / 1.3;
          scytheGroup.add(bladeEdge);

          group.add(scytheGroup);

        } else if (enemy.type === 'skeleton') {
          // --- ANATOMICAL SKELETON WARRIOR ---
          const boneMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.7, metalness: 0.05 });
          const ironMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.85 });
          const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
          const redGlow = new THREE.MeshBasicMaterial({ color: '#ef4444' });

          // Spine & Vertebrae
          const spineGeo = new THREE.CylinderGeometry(0.7, 0.9, 11, 6);
          const spine = new THREE.Mesh(spineGeo, boneMat);
          spine.position.y = 7.5;
          spine.castShadow = true;
          group.add(spine);

          // 3D Ribcage (Curved rib pairs)
          for (let r = 0; r < 4; r++) {
            const ribGeo = new THREE.TorusGeometry(2.4 - r * 0.15, 0.35, 4, 10, Math.PI * 1.5);
            const rib = new THREE.Mesh(ribGeo, boneMat);
            rib.position.set(0, 8.5 + r * 1.8, 0.2);
            rib.rotation.x = Math.PI / 2;
            rib.castShadow = true;
            group.add(rib);
          }

          // Pelvis
          const pelvisGeo = new THREE.BoxGeometry(4.2, 1.4, 2.8);
          const pelvis = new THREE.Mesh(pelvisGeo, boneMat);
          pelvis.position.y = 3.8;
          group.add(pelvis);

          // Detailed Skull with Jaw
          const skullGeo = new THREE.SphereGeometry(2.4, 8, 8);
          const skull = new THREE.Mesh(skullGeo, boneMat);
          skull.position.set(0, 16.2, 0.2);
          skull.castShadow = true;
          group.add(skull);

          // Jaw & Teeth
          const jawGeo = new THREE.BoxGeometry(2.0, 0.9, 2.2);
          const jaw = new THREE.Mesh(jawGeo, boneMat);
          jaw.position.set(0, 14.5, 0.8);
          group.add(jaw);

          // Burning Red Eye Embers in Sockets
          for (const s of [-1, 1]) {
            const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), redGlow);
            eyeSocket.position.set(s * 0.85, 16.3, 2.2);
            group.add(eyeSocket);
          }

          // Left Arm + Round Wooden Buckler Shield
          const leftArmGroup = new THREE.Group();
          leftArmGroup.position.set(-3.8, 13, 0);
          leftArmGroup.name = 'leftArm';
          const boneArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 7, 6), boneMat);
          boneArmL.position.y = -3.5;
          leftArmGroup.add(boneArmL);

          // Wooden Shield with Iron Rim and Center Boss
          const shieldRim = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 0.6, 12), ironMat);
          shieldRim.rotation.x = Math.PI / 2;
          shieldRim.position.set(0, -4.5, 1.8);
          leftArmGroup.add(shieldRim);

          const shieldWood = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.7, 12), woodMat);
          shieldWood.rotation.x = Math.PI / 2;
          shieldWood.position.set(0, -4.5, 1.8);
          leftArmGroup.add(shieldWood);

          const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), ironMat);
          shieldBoss.position.set(0, -4.5, 2.3);
          leftArmGroup.add(shieldBoss);
          group.add(leftArmGroup);

          // Right Arm + Notched Iron Longsword
          const rightArmGroup = new THREE.Group();
          rightArmGroup.position.set(3.8, 13, 0);
          rightArmGroup.name = 'rightArm';
          const boneArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 7, 6), boneMat);
          boneArmR.position.y = -3.5;
          rightArmGroup.add(boneArmR);

          const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 13, 1.2), ironMat);
          swordBlade.position.set(0, -4, 4);
          swordBlade.rotation.x = 0.5;
          swordBlade.castShadow = true;
          rightArmGroup.add(swordBlade);
          group.add(rightArmGroup);

        } else {
          // --- HULKING GHOUL / ABOMINATION ---
          const ghoulMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.85, metalness: 0.1 });
          const spineMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 });
          const eyeMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
          const bloodMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.4, metalness: 0.3 });

          // Muscular Hunched Torso
          const torsoGeo = new THREE.BoxGeometry(8, 12, 8.5);
          const torso = new THREE.Mesh(torsoGeo, ghoulMat);
          torso.position.set(0, 6.5, 1);
          torso.rotation.x = 0.35;
          torso.castShadow = true;
          group.add(torso);

          // Protruding Bone Spikes along the Spine
          for (let s = 0; s < 5; s++) {
            const spikeGeo = new THREE.ConeGeometry(0.65, 3.2, 5);
            const spike = new THREE.Mesh(spikeGeo, spineMat);
            spike.position.set(0, 3 + s * 2.2, -4.2 - s * 0.4);
            spike.rotation.x = -Math.PI / 3;
            torso.add(spike);
          }

          // Deformed Skull & Slack Fanged Jaw
          const headGeo = new THREE.BoxGeometry(5.2, 5.2, 5.4);
          const head = new THREE.Mesh(headGeo, ghoulMat);
          head.position.set(0, 13, 4.2);
          head.castShadow = true;
          group.add(head);

          // Toxic Green Eyes
          for (const s of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.6), eyeMat);
            eye.position.set(s * 1.4, 13.5, 6.8);
            group.add(eye);
          }

          // Left Arm with Wrist Chains
          const leftArmGroup = new THREE.Group();
          leftArmGroup.position.set(-5.5, 8.5, 2);
          leftArmGroup.name = 'leftArm';
          const lClaw = new THREE.Mesh(new THREE.BoxGeometry(2.4, 11, 2.4), ghoulMat);
          lClaw.position.y = -4;
          lClaw.castShadow = true;
          leftArmGroup.add(lClaw);
          group.add(leftArmGroup);

          // Right Arm: Massive Mutated Talons (Blood-crusted bone claws)
          const rightArmGroup = new THREE.Group();
          rightArmGroup.position.set(5.5, 8.5, 2);
          rightArmGroup.name = 'rightArm';
          const rClaw = new THREE.Mesh(new THREE.BoxGeometry(3.2, 11, 3.2), ghoulMat);
          rClaw.position.y = -4;
          rClaw.castShadow = true;
          rightArmGroup.add(rClaw);

          // 3 Giant Razor Bone Talons
          for (let t = 0; t < 3; t++) {
            const talonGeo = new THREE.ConeGeometry(0.7, 4.2, 4);
            const talon = new THREE.Mesh(talonGeo, bloodMat);
            talon.position.set(-1.1 + t * 1.1, -11, 0.4);
            talon.rotation.x = Math.PI;
            talon.castShadow = true;
            rightArmGroup.add(talon);
          }
          group.add(rightArmGroup);
        }

        this.scene.add(group);
        this.enemyMeshes.set(enemy.id, group);
        this.enemyLastHp.set(enemy.id, enemy.hp);
      }

      // Check if enemy took damage -> Trigger particles & damage numbers
      const lastHp = this.enemyLastHp.get(enemy.id);
      if (lastHp !== undefined && enemy.hp < lastHp) {
        const damage = lastHp - enemy.hp;
        const hover = enemy.type === 'bat' || enemy.type === 'ghost' ? 10 : 7;
        
        callbacks.spawnBloodSplatter(enemy.x, hover, enemy.y, Math.min(12, 3 + damage));
        callbacks.spawn3DDamageNumber(enemy.x, hover, enemy.y, damage);
        
        this.flashTimers.set(enemy.id, 0.25);
        if (callbacks.flashEnemy) callbacks.flashEnemy(group);

        for (let t = 0; t < 5; t++) {
          const arcAngle = (t - 2) * 0.3;
          const tx = enemy.x - Math.sin(cameraAngle + arcAngle) * 8;
          const tz = enemy.y - Math.cos(cameraAngle + arcAngle) * 8;
          callbacks.spawnParticle(tx, hover + (Math.random() - 0.5) * 2, tz, 0, 1.5, 0, '#fca5a5', 0.3, 'trail');
        }
      }
      this.enemyLastHp.set(enemy.id, enemy.hp);

      // Lerp positioning
      const hoverHeight = enemy.type === 'bat' || enemy.type === 'ghost' ? 10 : 0;
      const bob = enemy.type === 'ghost' || enemy.type === 'bat' ? Math.sin(performance.now() / 120) * 1.8 : 0;
      const targetY = hoverHeight + bob;
      group.position.x += (enemy.x - group.position.x) * 0.14;
      group.position.y += (targetY - group.position.y) * 0.14;
      group.position.z += (enemy.y - group.position.z) * 0.14;

      // Animate enemy limbs
      if (enemy.type === 'bat') {
        const leftWing = group.getObjectByName('leftWing');
        const rightWing = group.getObjectByName('rightWing');
        const wingFlap = Math.sin(performance.now() / 70) * 0.75;
        if (leftWing) leftWing.rotation.z = wingFlap;
        if (rightWing) rightWing.rotation.z = -wingFlap;
      } else if (enemy.type === 'reaper') {
        const bLeftWing = group.getObjectByName('bossLeftWing');
        const bRightWing = group.getObjectByName('bossRightWing');
        const scythe = group.getObjectByName('bossScythe');
        const wingBeat = Math.sin(performance.now() / 250) * 0.25;
        if (bLeftWing) bLeftWing.rotation.y = wingBeat;
        if (bRightWing) bRightWing.rotation.y = -wingBeat;
        if (scythe) scythe.rotation.x = Math.sin(performance.now() / 300) * 0.15;
      } else {
        const lArm = group.getObjectByName('leftArm');
        const rArm = group.getObjectByName('rightArm');
        const swing = Math.sin(performance.now() / 110) * 0.45;
        if (lArm) lArm.rotation.x = swing;
        if (rArm) rArm.rotation.x = -swing;
      }

      // Update Health Bar
      const hb = group.getObjectByName('healthBar');
      if (hb) {
        const fg = hb.getObjectByName('fg');
        if (fg) {
          const maxHp = 20 + activeZone * 15;
          const hpRatio = Math.max(0, enemy.hp / maxHp);
          fg.scale.x = hpRatio;
          fg.position.x = -3.5 * (1 - hpRatio);
        }
        hb.rotation.y = cameraAngle - group.rotation.y;
      }
      
      // Update Flash Material
      let flashTime = this.flashTimers.get(enemy.id) || 0;
      if (flashTime > 0) {
        flashTime -= _dt;
        this.flashTimers.set(enemy.id, flashTime);
        
        const flashIntensity = Math.max(0, flashTime / 0.25); // 0 to 1
        
        group.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.userData.isUI) {
            const mat = child.material;
            if (mat && mat.emissive) {
              if (enemy.type === 'ghost') {
                mat.emissive.setHex(0x06b6d4).lerp(new THREE.Color('#ffffff'), flashIntensity);
                mat.emissiveIntensity = 0.5 + flashIntensity * 1.5;
              } else {
                mat.emissive.setHex(0xff0000);
                mat.emissiveIntensity = flashIntensity * 1.5;
              }
            }
          }
        });
      } else {
        // Reset emissive
        group.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.userData.isUI) {
            const mat = child.material;
            if (mat && mat.emissive) {
              if (enemy.type === 'ghost') {
                mat.emissive.setHex(0x06b6d4);
                mat.emissiveIntensity = 0.5;
              } else {
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0;
              }
            }
          }
        });
      }

      // Look at player
      group.rotation.y = playerX < enemy.x ? Math.PI : 0;
    }
  }

  public flashEnemy(_group: THREE.Group) {
    // Left empty since we handle it in update() natively now
  }
}
export default EnemyRenderer;

import * as THREE from 'three';

export class VampireModel {
  public group: THREE.Group;
  public swordMesh!: THREE.Mesh;
  public capeMesh!: THREE.Mesh;
  public torchMesh!: THREE.Group;
  private playerAnimTime = 0;

  // Spring-Damper physics variables for lantern sway
  private lanternSwayAngle = 0;
  private lanternSwayVelocity = 0;

  constructor() {
    this.group = new THREE.Group();
    this.buildModel();
  }

  private createGlowTexture(color: string): THREE.CanvasTexture {
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

  private buildModel() {
    const plateMat = new THREE.MeshStandardMaterial({
      color: '#27272a',
      metalness: 0.85,
      roughness: 0.2
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.9, roughness: 0.1 });
    const bootMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.8, roughness: 0.3 });

    // Chest Plate (Fluted Segmented Gothic Plate Armor)
    const body = new THREE.Group();
    body.position.y = 11;
    body.name = 'chest';
    this.group.add(body);

    // Articulated fluted chest segments
    for (let i = 0; i < 3; i++) {
      const segGeo = new THREE.CylinderGeometry(4.7 - i * 0.4, 4.4 - i * 0.4, 3.8, 16);
      const segment = new THREE.Mesh(segGeo, plateMat);
      segment.position.y = 5.0 - i * 3.4;
      segment.castShadow = true;
      segment.receiveShadow = true;
      body.add(segment);

      // Gold Filigree Ribs on each plate
      for (const r of [-1.5, 0, 1.5]) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 0.4), goldTrimMat);
        rib.position.set(r, 5.0 - i * 3.4, 4.4 - i * 0.4);
        body.add(rib);
      }
    }

    // Glowing Crimson Bat Crest & Heart Gem on Chest
    const crestGroup = new THREE.Group();
    crestGroup.position.set(0, 3.5, 4.5);

    // Center faceted ruby gem
    const rubyGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.MeshStandardMaterial({
        color: '#dc2626',
        emissive: '#ef4444',
        emissiveIntensity: 1.8,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    crestGroup.add(rubyGem);

    // Bat wings flanking the crest
    for (const s of [-1, 1]) {
      const wingGeo = new THREE.BoxGeometry(2.2, 0.9, 0.4);
      const wing = new THREE.Mesh(wingGeo, goldTrimMat);
      wing.position.set(s * 1.8, 0.3, 0);
      wing.rotation.z = s * 0.35;
      crestGroup.add(wing);
    }
    body.add(crestGroup);

    // Gold Trimmed Thigh Tassets
    const tassetMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.9, roughness: 0.1 });
    for (let i = 0; i < 2; i++) {
      const tasset = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.5, 0.6), tassetMat);
      const angleOffset = i === 0 ? -0.2 : 0.2;
      tasset.position.set(i === 0 ? -2.2 : 2.2, -3.2, 1.2);
      tasset.rotation.z = angleOffset;
      tasset.rotation.x = 0.25;
      tasset.name = i === 0 ? 'leftTasset' : 'rightTasset';
      body.add(tasset);
    }

    // Segmented Gothic Legs with Spiked Poleyns (Knees)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-2.2, 5, 0);
    leftLeg.name = 'leftLeg';
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 4, 8), bootMat);
    thighL.position.y = -1.5;
    thighL.castShadow = true;
    leftLeg.add(thighL);
    const kneeL = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), goldTrimMat);
    kneeL.position.set(0, -3.5, 0.4);
    leftLeg.add(kneeL);
    // Spiked knee spike
    const kneeSpikeL = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 4), goldTrimMat);
    kneeSpikeL.position.set(0, -3.5, 1.4);
    kneeSpikeL.rotation.x = Math.PI / 2;
    leftLeg.add(kneeSpikeL);
    const shinL = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 4.5, 8), bootMat);
    shinL.position.y = -5.8;
    shinL.castShadow = true;
    leftLeg.add(shinL);
    const footL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 3.4), bootMat);
    footL.position.set(0, -7.5, 0.9);
    footL.castShadow = true;
    leftLeg.add(footL);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(2.2, 5, 0);
    rightLeg.name = 'rightLeg';
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 4, 8), bootMat);
    thighR.position.y = -1.5;
    thighR.castShadow = true;
    rightLeg.add(thighR);
    const kneeR = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), goldTrimMat);
    kneeR.position.set(0, -3.5, 0.4);
    rightLeg.add(kneeR);
    // Spiked knee spike
    const kneeSpikeR = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 4), goldTrimMat);
    kneeSpikeR.position.set(0, -3.5, 1.4);
    kneeSpikeR.rotation.x = Math.PI / 2;
    rightLeg.add(kneeSpikeR);
    const shinR = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 4.5, 8), bootMat);
    shinR.position.y = -5.8;
    shinR.castShadow = true;
    rightLeg.add(shinR);
    const footR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 3.4), bootMat);
    footR.position.set(0, -7.5, 0.9);
    footR.castShadow = true;
    rightLeg.add(footR);
    this.group.add(rightLeg);

    // Pauldrons
    const pauldronGeo = new THREE.BoxGeometry(3.8, 3.8, 4.2);
    const pauldronMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.9, roughness: 0.15 });
    const spikeGeo = new THREE.ConeGeometry(0.8, 3.2, 5);
    const spikeMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8 });

    const leftPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    leftPauldron.position.set(-6.2, 15, 0);
    leftPauldron.name = 'leftPauldron';
    const spikeL1 = new THREE.Mesh(spikeGeo, spikeMat);
    spikeL1.position.set(-0.8, 2.8, 0);
    leftPauldron.add(spikeL1);
    this.group.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    rightPauldron.position.set(6.2, 15, 0);
    rightPauldron.name = 'rightPauldron';
    const spikeR1 = new THREE.Mesh(spikeGeo, spikeMat);
    spikeR1.position.set(0.8, 2.8, 0);
    rightPauldron.add(spikeR1);
    this.group.add(rightPauldron);

    // Segmented gauntlet arms
    const sleeveMat = new THREE.MeshStandardMaterial({ color: '#581c87', roughness: 0.7 });
    
    const leftArm = new THREE.Group();
    leftArm.position.set(-6.2, 10, 0);
    leftArm.name = 'leftArm';
    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 4, 8), sleeveMat);
    upperArmL.position.y = 2;
    upperArmL.castShadow = true;
    leftArm.add(upperArmL);
    const gauntletL = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 4, 8), plateMat);
    gauntletL.position.y = -2;
    gauntletL.castShadow = true;
    leftArm.add(gauntletL);
    const elbowL = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), goldTrimMat);
    elbowL.position.y = 0;
    leftArm.add(elbowL);
    this.group.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(6.2, 10, 1);
    rightArm.name = 'rightArm';
    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 4, 8), sleeveMat);
    upperArmR.position.y = 2;
    upperArmR.castShadow = true;
    rightArm.add(upperArmR);
    const gauntletR = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 4, 8), plateMat);
    gauntletR.position.y = -2;
    gauntletR.castShadow = true;
    rightArm.add(gauntletR);
    const elbowR = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), goldTrimMat);
    elbowR.position.y = 0;
    rightArm.add(elbowR);
    this.group.add(rightArm);

    // Open helmet + face
    const helm = new THREE.Group();
    helm.position.y = 20.5;
    helm.name = 'helmet';
    this.group.add(helm);

    const skinMat = new THREE.MeshStandardMaterial({ color: '#ece5db', roughness: 0.6, metalness: 0.1 });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), skinMat);
    headMesh.name = 'vampireHead';
    helm.add(headMesh);

    // Glowing eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const eyeGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-1.1, 0.8, 2.8);
    helm.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(1.1, 0.8, 2.8);
    helm.add(rightEye);

    // Hair
    const hairMat = new THREE.MeshStandardMaterial({ color: '#0d0714', roughness: 0.8 });
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(3.8, 12, 12), hairMat);
    hairBack.position.set(0, 0.5, -0.8);
    helm.add(hairBack);
    for (let p = 0; p < 3; p++) {
      const bang = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.5, 4), hairMat);
      bang.position.set(-1.6 + p * 1.6, 2.2, 2.5);
      bang.rotation.x = 0.5;
      bang.rotation.z = -0.2 + p * 0.2;
      helm.add(bang);
    }

    // Mouth + fangs
    const mouthMat = new THREE.MeshBasicMaterial({ color: '#18181b' });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.1), mouthMat);
    mouth.position.set(0, -1.2, 3.2);
    helm.add(mouth);
    const fangGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
    const leftFang = new THREE.Mesh(fangGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    leftFang.position.set(-0.5, -1.3, 3.25);
    leftFang.rotation.x = Math.PI;
    helm.add(leftFang);
    const rightFang = new THREE.Mesh(fangGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    rightFang.position.set(0.5, -1.3, 3.25);
    rightFang.rotation.x = Math.PI;
    helm.add(rightFang);

    // Crown
    const crownRingGeo = new THREE.CylinderGeometry(3.4, 3.7, 0.8, 8, 1, true);
    const crownRing = new THREE.Mesh(crownRingGeo, goldTrimMat);
    crownRing.position.y = 3.0;
    helm.add(crownRing);
    for (let s = 0; s < 5; s++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 4), goldTrimMat);
      const angle = (s / 5) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 3.3, 3.8, Math.sin(angle) * 3.3);
      spike.rotation.x = 0.2;
      spike.rotation.y = -angle;
      helm.add(spike);
    }

    // Plume
    const plumeMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.8 });
    for (let p = 0; p < 5; p++) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.2 - p * 0.12, 6, 6), plumeMat);
      sphere.position.set(0, 4.2 + Math.sin(p * 0.5) * 1.2, -1.5 - p * 1.5);
      helm.add(sphere);
    }

    // Dummy visor
    const visorGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const visorMat = new THREE.MeshBasicMaterial({ color: '#ef4444', visible: false });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 20.5, 1.8);
    visor.name = 'visor';
    this.group.add(visor);

    // Waving velvet cape with higher subdivision for fluid cloth physics
    const capeGeo = new THREE.PlaneGeometry(12, 20, 6, 6);
    const capeMat = new THREE.MeshStandardMaterial({
      color: '#450a0a',
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    this.capeMesh = new THREE.Mesh(capeGeo, capeMat);
    this.capeMesh.position.set(0, 10, -5.5);
    this.capeMesh.rotation.x = 0.12;
    this.group.add(this.capeMesh);

    // Gothic Collar
    const collarGeo = new THREE.BoxGeometry(7.5, 3.5, 1.2);
    const collarMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.8 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 15.5, -4.5);
    collar.rotation.x = -0.25;
    this.group.add(collar);

    // Dracula Legendary Greatsword ("Bloodcleaver")
    const swordGroup = new THREE.Group();
    swordGroup.position.set(7.5, 10, 3);
    swordGroup.rotation.set(0.3, 0, -0.3);
    swordGroup.name = 'swordGroup';

    // Double-edged steel blade
    const bladeGeo = new THREE.BoxGeometry(1.6, 17, 0.45);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.95,
      roughness: 0.12
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 8.5;
    blade.castShadow = true;
    swordGroup.add(blade);

    // Tapered Sword Tip
    const tipGeo = new THREE.ConeGeometry(0.85, 3.5, 4);
    const tip = new THREE.Mesh(tipGeo, bladeMat);
    tip.position.set(0, 18, 0);
    tip.rotation.y = Math.PI / 4;
    swordGroup.add(tip);

    // Glowing Blood Fuller Channel
    const fullerGeo = new THREE.BoxGeometry(0.45, 14, 0.55);
    const fullerMat = new THREE.MeshStandardMaterial({
      color: '#dc2626',
      emissive: '#ef4444',
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
    const fuller = new THREE.Mesh(fullerGeo, fullerMat);
    fuller.position.y = 8.0;
    swordGroup.add(fuller);

    // 5 Glowing Demonic Runes carved along the blade
    const runeMat = new THREE.MeshBasicMaterial({ color: '#fca5a5' });
    for (let r = 0; r < 5; r++) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 0.65), runeMat);
      rune.position.set(0, 3 + r * 2.6, 0);
      swordGroup.add(rune);
    }

    // Winged Bat Crossguard
    for (const s of [-1, 1]) {
      const wingGuard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 1.4), goldTrimMat);
      wingGuard.position.set(s * 2.2, 0, 0);
      wingGuard.rotation.z = s * 0.32;
      wingGuard.castShadow = true;
      swordGroup.add(wingGuard);

      const guardTip = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 4), goldTrimMat);
      guardTip.position.set(s * 4.4, 0.7, 0);
      guardTip.rotation.z = -s * Math.PI / 3;
      swordGroup.add(guardTip);
    }

    // Leather-wrapped Grip
    const gripGeo = new THREE.CylinderGeometry(0.55, 0.5, 4.5, 8);
    const gripMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -2.25;
    swordGroup.add(grip);

    // Faceted Ruby Pommel
    const pommelGeo = new THREE.OctahedronGeometry(1.1, 0);
    const pommelMat = new THREE.MeshStandardMaterial({
      color: '#dc2626',
      emissive: '#ef4444',
      emissiveIntensity: 1.8,
      metalness: 0.9,
      roughness: 0.1
    });
    const pommel = new THREE.Mesh(pommelGeo, pommelMat);
    pommel.position.y = -4.8;
    swordGroup.add(pommel);

    this.group.add(swordGroup);
    this.swordMesh = blade;

    // Ornate Hanging Gothic Hexagonal Glass Lantern
    this.torchMesh = new THREE.Group();
    this.torchMesh.position.set(-7.5, 11, 2);
    this.torchMesh.name = 'torchMesh';

    const bracket = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: '#1c1917' }));
    bracket.position.set(-2, 3, 0);
    this.torchMesh.add(bracket);

    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5, 4), new THREE.MeshStandardMaterial({ color: '#44403c', metalness: 0.9 }));
    chain.position.set(-4.2, 1.5, 0);
    this.torchMesh.add(chain);

    const lantern = new THREE.Group();
    lantern.position.set(-4.2, -2, 0);
    lantern.name = 'hangingLantern';

    const cageFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 5.5, 6, 1, true),
      new THREE.MeshStandardMaterial({ color: '#1c1917', metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide })
    );
    lantern.add(cageFrame);

    const glassMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
      metalness: 0.9
    });
    const glassPanes = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.4, 5.3, 6, 1),
      glassMat
    );
    lantern.add(glassPanes);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.2, 1.2, 6), goldTrimMat);
    topCap.position.y = 2.85;
    lantern.add(topCap);

    const handleGeo = new THREE.TorusGeometry(0.8, 0.25, 4, 12);
    const handle = new THREE.Mesh(handleGeo, goldTrimMat);
    handle.position.y = 3.6;
    handle.rotation.x = Math.PI / 2;
    lantern.add(handle);

    const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.0, 1.0, 6), goldTrimMat);
    bottomCap.position.y = -2.85;
    lantern.add(bottomCap);

    const soulFlameMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const soulFlame = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), soulFlameMat);
    soulFlame.name = 'flameCore';
    soulFlame.position.y = 0;
    lantern.add(soulFlame);

    const blueGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.createGlowTexture('rgba(56, 189, 248, 0.4)'),
      blending: THREE.AdditiveBlending
    }));
    blueGlow.scale.set(12, 12, 1);
    blueGlow.name = 'glowCorona';
    lantern.add(blueGlow);

    this.torchMesh.add(lantern);
    this.group.add(this.torchMesh);
  }

  public update(
    dt: number,
    playerState: string,
    playerX: number,
    playerY: number,
    cameraPitch: number,
    cameraMode: string,
    isSwinging: boolean,
    attackAnimTime: number,
    attackDuration: number,
    spawnParticleCallback?: (x: number, y: number, z: number, vx: number, vy: number, vz: number, color: string, maxLife: number, type: 'fire' | 'blood' | 'spark' | 'dust' | 'trail' | 'smoke' | 'mist') => void
  ) {
    const chest = this.group.getObjectByName('chest');
    const helmet = this.group.getObjectByName('helmet');
    const visor = this.group.getObjectByName('visor');
    const swordGroup = this.group.getObjectByName('swordGroup');

    const isFirstPerson = cameraMode === 'firstperson';
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh && child.name !== 'fg') {
        const isSwordPart = !!(child === this.swordMesh || (child.parent && child.parent.name === 'swordGroup') || (child.parent && child.parent.parent && child.parent.parent.name === 'swordGroup'));
        child.visible = isFirstPerson ? isSwordPart : true;
      }
    });

    let sweep = 0;
    let verticalDip = 0;
    let bladeTilt = 0.3;

    if (isSwinging) {
      const progress = attackAnimTime / attackDuration;
      if (progress < 0.25) {
        const p = progress / 0.25;
        sweep = -0.4 * p;
        verticalDip = 0.2 * p;
        bladeTilt = 0.3 - 0.2 * p;
      } else if (progress < 0.75) {
        const p = (progress - 0.25) / 0.5;
        sweep = -0.4 + 1.8 * p;
        verticalDip = 0.2 - 0.9 * p;
        bladeTilt = 0.1 + 0.8 * Math.sin(p * Math.PI);
      } else {
        const p = (progress - 0.75) / 0.25;
        sweep = 1.4 * (1 - p);
        verticalDip = -0.7 * (1 - p);
        bladeTilt = 0.9 * (1 - p) + 0.3 * p;
      }
    }

    let bob: number;

    if (playerState === 'moving') {
      this.playerAnimTime += dt;
      const angle = this.playerAnimTime * 4.5;

      this.group.rotation.x = 0.12;
      this.group.rotation.z = Math.sin(angle) * 0.03;

      bob = Math.abs(Math.sin(angle)) * 0.7;
      if (chest) chest.position.y = 11 + bob;
      if (helmet) helmet.position.y = 20.5 + bob;
      if (visor) visor.position.y = 20.5 + bob;

      const lArm = this.group.getObjectByName('leftArm');
      const rArm = this.group.getObjectByName('rightArm');
      if (lArm) {
        lArm.position.y = 10 + bob;
        lArm.rotation.x = Math.sin(angle) * 0.3;
      }
      if (rArm) {
        rArm.position.y = 10 + bob;
        rArm.rotation.x = -Math.sin(angle) * 0.3;
      }

      const lLeg = this.group.getObjectByName('leftLeg');
      const rLeg = this.group.getObjectByName('rightLeg');
      if (lLeg) lLeg.rotation.x = Math.sin(angle) * 0.45;
      if (rLeg) rLeg.rotation.x = -Math.sin(angle) * 0.45;

      const lTasset = chest?.getObjectByName('leftTasset');
      const rTasset = chest?.getObjectByName('rightTasset');
      if (lTasset) lTasset.rotation.x = 0.25 + Math.sin(angle) * 0.08;
      if (rTasset) rTasset.rotation.x = 0.25 - Math.sin(angle) * 0.08;

      this.swordMesh.rotation.x = 0.3 + Math.sin(angle) * 0.2;
      if (swordGroup) {
        if (!isFirstPerson) {
          swordGroup.position.set(7.5, 10, 3);
          swordGroup.rotation.set(0.3, 0, -0.3);
          if (!isSwinging) {
            swordGroup.rotation.y = Math.sin(angle) * 0.3;
            swordGroup.rotation.z = -0.3 + Math.cos(angle) * 0.18;
          }
        }
      }

      const capePos = this.capeMesh.geometry.attributes.position;
      for (let i = 0; i < capePos.count; i++) {
        const py = capePos.getY(i);
        const wave = Math.sin(this.playerAnimTime * 9 + py * 0.5) * 0.3;
        capePos.setZ(i, wave);
      }
      this.capeMesh.geometry.attributes.position.needsUpdate = true;

      // Spawning walk particles
      if (spawnParticleCallback) {
        if (Math.random() < 0.35) {
          const isFacingRight = Math.cos(this.group.rotation.y) > 0;
          const trailX = playerX + (isFacingRight ? 8 : -8) + (Math.random() - 0.5) * 2;
          const trailY = 8 + Math.sin(angle) * 4;
          const trailZ = playerY + 3 + (Math.random() - 0.5) * 2;
          spawnParticleCallback(trailX, trailY, trailZ, 0, 1.0, 0, '#ef4444', 0.4, 'trail');
        }

        if (Math.random() < 0.25) {
          const isFacingRight = Math.cos(this.group.rotation.y) > 0;
          const emberX = playerX + (isFacingRight ? -6 : 6) + (Math.random() - 0.5) * 0.5;
          const emberZ = playerY + 2 + (Math.random() - 0.5) * 0.5;
          spawnParticleCallback(emberX, 13.5 + bob, emberZ, (Math.random() - 0.5) * 0.8, 1.5 + Math.random(), (Math.random() - 0.5) * 0.8 - 1.0, '#f97316', 0.6 + Math.random() * 0.4, 'fire');
        }
      }

    } else {
      this.group.rotation.x = 0;
      this.group.rotation.z = 0;

      if (chest) chest.position.y = 11;
      if (helmet) helmet.position.y = 20.5;
      if (visor) visor.position.y = 20.5;

      const lArm = this.group.getObjectByName('leftArm');
      const rArm = this.group.getObjectByName('rightArm');
      if (lArm) {
        lArm.position.y = 10;
        lArm.rotation.x = 0;
      }
      if (rArm) {
        rArm.position.y = 10;
        rArm.rotation.x = 0;
      }

      const lLeg = this.group.getObjectByName('leftLeg');
      const rLeg = this.group.getObjectByName('rightLeg');
      if (lLeg) lLeg.rotation.x = 0;
      if (rLeg) rLeg.rotation.x = 0;

      const lTasset = chest?.getObjectByName('leftTasset');
      const rTasset = chest?.getObjectByName('rightTasset');
      if (lTasset) lTasset.rotation.x = 0.25;
      if (rTasset) rTasset.rotation.x = 0.25;

      this.swordMesh.rotation.x = 0.3;
      if (swordGroup) {
        if (!isFirstPerson) {
          swordGroup.position.set(7.5, 10, 3);
          swordGroup.rotation.set(0.3, 0, -0.3);
        }
      }
    }

    if (isSwinging && swordGroup) {
      if (isFirstPerson) {
        swordGroup.position.set(
          4.0 * Math.cos(this.group.rotation.y) + 6.0 * Math.sin(this.group.rotation.y),
          13.5 - 11,
          4.0 * -Math.sin(this.group.rotation.y) + 6.0 * Math.cos(this.group.rotation.y)
        );
        swordGroup.rotation.y = this.group.rotation.y + Math.PI / 4 + sweep;
        swordGroup.rotation.x = 0.3 + cameraPitch + verticalDip;
      } else {
        swordGroup.rotation.y = sweep;
        swordGroup.rotation.z = -0.3 + verticalDip;
        this.swordMesh.rotation.x = bladeTilt;
      }

      if (spawnParticleCallback) {
        const progress = attackAnimTime / attackDuration;
        if (progress >= 0.25 && progress <= 0.75) {
          for (let t = 0; t < 3; t++) {
            const offset = (t - 1) * 2.5;
            const tx = playerX + Math.sin(this.group.rotation.y + sweep) * (12 + offset);
            const tz = playerY + Math.cos(this.group.rotation.y + sweep) * (12 + offset);
            const ty = (isFirstPerson ? 16 : 7) + verticalDip * 5;
            spawnParticleCallback(tx, ty, tz, 0, 0.5, 0, '#ef4444', 0.25, 'trail');
          }
        }
      }
    }

    if (isFirstPerson && swordGroup && !isSwinging) {
      const forwardX = Math.sin(this.group.rotation.y);
      const forwardZ = Math.cos(this.group.rotation.y);
      const rightX = Math.cos(this.group.rotation.y);
      const rightZ = -Math.sin(this.group.rotation.y);

      swordGroup.position.set(
        4.0 * rightX + 6.0 * forwardX,
        13.5 - 11,
        4.0 * rightZ + 6.0 * forwardZ
      );
      swordGroup.rotation.set(0.3 + cameraPitch, this.group.rotation.y + Math.PI / 4, -0.3);
    }

    // Swaying Hanging Lantern Physics
    const hangingLantern = this.torchMesh.getObjectByName('hangingLantern');
    if (hangingLantern) {
      let targetSway = 0;
      if (playerState === 'moving') {
        targetSway = Math.sin(this.playerAnimTime * 14) * 0.5;
      }

      const springConstant = 12.0;
      const dampingConstant = 4.5;
      const accel = (targetSway - this.lanternSwayAngle) * springConstant - this.lanternSwayVelocity * dampingConstant;
      this.lanternSwayVelocity += accel * dt;
      this.lanternSwayAngle += this.lanternSwayVelocity * dt;

      hangingLantern.rotation.z = this.lanternSwayAngle;
      hangingLantern.rotation.x = playerState === 'moving' ? 0.15 : 0;

      const corona = hangingLantern.getObjectByName('glowCorona');
      if (corona) {
        const pulse = 12 + Math.sin(performance.now() / 55) * 1.5;
        corona.scale.set(pulse, pulse, 1);
      }
    }
  }
}
export default VampireModel;

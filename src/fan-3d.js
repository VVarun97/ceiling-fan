import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLOR_DEFINITIONS, MODEL_DEFINITIONS } from './store.js';

/**
 * Procedural Texture Generator
 * Generates ultra-sharp, realistic wood and metal PBR textures on the fly.
 */
class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  createWoodTexture(type = 'walnut') {
    const key = `wood-${type}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const isWalnut = type === 'walnut';
    const baseDark = isWalnut ? '#2a160c' : '#73583c';
    const baseMid = isWalnut ? '#482a17' : '#9b7d5a';
    const baseLight = isWalnut ? '#633c22' : '#bfa17d';
    const grainColor = isWalnut ? 'rgba(20, 10, 5, 0.45)' : 'rgba(70, 50, 30, 0.35)';

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, baseDark);
    grad.addColorStop(0.3, baseMid);
    grad.addColorStop(0.7, baseLight);
    grad.addColorStop(1, baseDark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Procedural wavy wood growth rings & grain
    for (let y = 0; y < canvas.height; y += 2) {
      const frequency = 0.008;
      const wave = Math.sin(y * frequency) * 40 + Math.sin(y * frequency * 2.3) * 15;
      ctx.strokeStyle = grainColor;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y + wave * 0.1);
      ctx.bezierCurveTo(
        canvas.width * 0.3, y + wave,
        canvas.width * 0.7, y - wave * 0.8,
        canvas.width, y + wave * 0.2
      );
      ctx.stroke();
    }

    // Micro-fibers / grain lines
    ctx.fillStyle = grainColor;
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const length = 15 + Math.random() * 60;
      ctx.fillRect(x, y, length, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1);
    this.cache.set(key, texture);
    return texture;
  }

  createBrushedMetalTexture() {
    const key = 'metal-brushed';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle brushed striations
    for (let i = 0; i < 3000; i++) {
      const y = Math.random() * canvas.height;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, y, canvas.width, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  createCeilingTexture(type = 'white') {
    const key = `ceiling-${type}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'concrete') {
      ctx.fillStyle = '#3a3a40';
      ctx.fillRect(0, 0, 512, 512);
      // Noise and pores
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const rad = Math.random() * 2;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'wood') {
      // Wood slats ceiling
      ctx.fillStyle = '#1c1612';
      ctx.fillRect(0, 0, 512, 512);
      const slatWidth = 32;
      for (let x = 0; x < 512; x += slatWidth) {
        ctx.fillStyle = '#4a3320';
        ctx.fillRect(x + 3, 0, slatWidth - 6, 512);
        ctx.fillStyle = '#2d1d12';
        ctx.fillRect(x, 0, 3, 512); // groove
      }
    } else if (type === 'dark') {
      ctx.fillStyle = '#111215';
      ctx.fillRect(0, 0, 512, 512);
    } else {
      // Modern white plaster
      ctx.fillStyle = '#ededf0';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillStyle = 'rgba(0,0,0,0.015)';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set(key, texture);
    return texture;
  }
}

/**
 * 3D Ceiling Fan Engine
 */
export class CeilingFanScene {
  constructor(containerEl, onTelemetryUpdate = null) {
    this.container = containerEl;
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.textures = new TextureFactory();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1115);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      42,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, -1.2, 4.4);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 8;
    this.controls.minDistance = 1.5;
    this.controls.target.set(0, 0.2, 0);
    this.controls.maxPolarAngle = Math.PI - 0.1; // allow full orbit

    // Groups
    this.fanRoot = new THREE.Group();
    this.rotorGroup = new THREE.Group(); // Rotating part
    this.bladesGroup = new THREE.Group();
    this.downrodGroup = new THREE.Group();
    this.lightKitGroup = new THREE.Group();
    this.scene.add(this.fanRoot);
    this.fanRoot.add(this.rotorGroup);
    this.rotorGroup.add(this.bladesGroup);

    // Dynamic Materials Reference
    this.bladeMaterials = [];
    this.motorMaterials = [];
    this.accentMaterials = [];

    // Fan State
    this.fanSpeed = 2; // 0 to 5
    this.targetAngularVelocity = 12.5; // rad/s
    this.currentAngularVelocity = 12.5;
    this.direction = 1; // 1 = summer (counter-clockwise), -1 = winter (clockwise)
    this.bladeCount = 3;
    this.bladeSpanScale = 1.0;
    this.downrodLengthInches = 6;
    this.hasHaloRing = false;

    // Light State
    this.lightOn = true;
    this.lightKelvin = 2700;
    this.lightBrightness = 0.85;

    // Airflow Particles
    this.particlesActive = true;
    this.particleSystem = null;

    // Room Context
    this.ceilingMesh = null;
    this.roomBackdropMesh = null;

    // Init components
    this.setupLighting();
    this.buildCeiling();
    this.buildFanModel();
    this.buildAirflowParticles();

    // Event listeners
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Animation Loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // 1. Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    // 2. Key Light (Soft directional from top-front-right)
    this.keyLight = new THREE.DirectionalLight(0xfff8f0, 2.2);
    this.keyLight.position.set(3, 4, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 15;
    this.keyLight.shadow.camera.left = -3;
    this.keyLight.shadow.camera.right = 3;
    this.keyLight.shadow.camera.top = 3;
    this.keyLight.shadow.camera.bottom = -3;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // 3. Fill Light (Cooler tone from opposite side)
    this.fillLight = new THREE.DirectionalLight(0xe0e8ff, 1.0);
    this.fillLight.position.set(-4, 2, -2);
    this.scene.add(this.fillLight);

    // 4. Subtle Upward Bounce Light
    this.bounceLight = new THREE.DirectionalLight(0xffeacc, 0.4);
    this.bounceLight.position.set(0, -5, 1);
    this.scene.add(this.bounceLight);

    // 5. Integrated Fan Point Light (illuminates the fan itself and room)
    this.fanPointLight = new THREE.PointLight(0xffb766, 2.5, 8, 1.2);
    this.fanPointLight.position.set(0, -0.4, 0);
    this.fanPointLight.castShadow = true;
    this.fanPointLight.shadow.mapSize.width = 1024;
    this.fanPointLight.shadow.mapSize.height = 1024;
    this.fanPointLight.shadow.bias = -0.001;
    this.scene.add(this.fanPointLight);
  }

  buildCeiling() {
    // Ceiling surface plane
    const ceilingGeo = new THREE.PlaneGeometry(16, 16);
    this.ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xf2f2f5,
      roughness: 0.85,
      metalness: 0.05,
      map: this.textures.createCeilingTexture('white')
    });

    this.ceilingMesh = new THREE.Mesh(ceilingGeo, this.ceilingMat);
    this.ceilingMesh.rotation.x = Math.PI / 2;
    this.ceilingMesh.position.y = 1.4; // Ceiling height
    this.ceilingMesh.receiveShadow = true;
    this.scene.add(this.ceilingMesh);

    // Subtle Architectural Ceiling Recessed Light Glow Ring
    const trimGeo = new THREE.RingGeometry(0.85, 0.9, 48);
    const trimMat = new THREE.MeshBasicMaterial({
      color: 0x44444a,
      side: THREE.DoubleSide
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.rotation.x = Math.PI / 2;
    trimMesh.position.y = 1.398;
    this.scene.add(trimMesh);
  }

  setCeilingTexture(type) {
    if (!this.ceilingMat) return;
    this.ceilingMat.map = this.textures.createCeilingTexture(type);
    if (type === 'concrete') {
      this.ceilingMat.color.setHex(0x909095);
      this.scene.background.setHex(0x0e1014);
    } else if (type === 'wood') {
      this.ceilingMat.color.setHex(0x9a7b58);
      this.scene.background.setHex(0x140f0c);
    } else if (type === 'dark') {
      this.ceilingMat.color.setHex(0x18181c);
      this.scene.background.setHex(0x0a0b0d);
    } else {
      this.ceilingMat.color.setHex(0xf2f2f5);
      this.scene.background.setHex(0x0f1115);
    }
    this.ceilingMat.needsUpdate = true;
  }

  buildFanModel() {
    // Clear dynamic materials
    this.bladeMaterials = [];
    this.motorMaterials = [];
    this.accentMaterials = [];

    // Position fan root below ceiling
    this.fanRoot.position.set(0, 0.5, 0);

    // 1. Canopy (Mount to ceiling)
    this.canopyGroup = new THREE.Group();
    const canopyGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.2, 32);
    this.canopyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.2,
      roughness: 0.6
    });
    this.motorMaterials.push(this.canopyMat);
    const canopyMesh = new THREE.Mesh(canopyGeo, this.canopyMat);
    canopyMesh.position.y = 0.8;
    canopyMesh.castShadow = true;
    this.canopyGroup.add(canopyMesh);
    this.fanRoot.add(this.canopyGroup);

    // 2. Downrod Assembly
    this.downrodGroup = new THREE.Group();
    this.updateDownrodGeometry(this.downrodLengthInches);
    this.fanRoot.add(this.downrodGroup);

    // 3. Motor Housing (Static upper yoke & lower rotor hub)
    const upperYokeGeo = new THREE.CylinderGeometry(0.2, 0.38, 0.22, 32);
    this.upperYokeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.3,
      roughness: 0.5
    });
    this.motorMaterials.push(this.upperYokeMat);
    const upperYoke = new THREE.Mesh(upperYokeGeo, this.upperYokeMat);
    upperYoke.position.y = 0.18;
    this.fanRoot.add(upperYoke);

    // 4. Rotating Hub and Motor Body (Part of rotorGroup)
    // Motor cylindrical shell with rounded bevels
    const motorRadius = 0.65;
    const motorHeight = 0.35;
    const motorGeo = new THREE.CylinderGeometry(motorRadius, motorRadius * 0.95, motorHeight, 48);
    this.motorBodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.25,
      roughness: 0.5
    });
    this.motorMaterials.push(this.motorBodyMat);
    const motorMesh = new THREE.Mesh(motorGeo, this.motorBodyMat);
    motorMesh.castShadow = true;
    motorMesh.receiveShadow = true;
    this.rotorGroup.add(motorMesh);

    // Motor Architectural Accent Ring (Metallic trim line around motor)
    const ringGeo = new THREE.TorusGeometry(motorRadius + 0.015, 0.02, 16, 48);
    this.accentRingMat = new THREE.MeshStandardMaterial({
      color: 0xcca152,
      metalness: 0.85,
      roughness: 0.25
    });
    this.accentMaterials.push(this.accentRingMat);
    const accentRing = new THREE.Mesh(ringGeo, this.accentRingMat);
    accentRing.rotation.x = Math.PI / 2;
    this.rotorGroup.add(accentRing);

    // 5. Light Kit Dome (Frosted Glass Diffuser)
    const lensGeo = new THREE.CylinderGeometry(motorRadius * 0.78, motorRadius * 0.65, 0.1, 48);
    this.lightLensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
      emissive: 0xffb766,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.92
    });
    this.lightLensMesh = new THREE.Mesh(lensGeo, this.lightLensMat);
    this.lightLensMesh.position.y = -motorHeight / 2 - 0.04;
    this.rotorGroup.add(this.lightLensMesh);

    // Lens Accent Bezel Trim
    const bezelGeo = new THREE.TorusGeometry(motorRadius * 0.78 + 0.01, 0.02, 16, 48);
    const bezelMesh = new THREE.Mesh(bezelGeo, this.accentRingMat);
    bezelMesh.rotation.x = Math.PI / 2;
    bezelMesh.position.y = -motorHeight / 2 - 0.04;
    this.rotorGroup.add(bezelMesh);

    // 6. Build the Fan Blades
    this.rebuildBlades();
  }

  updateDownrodGeometry(inches) {
    // Clear old downrod meshes
    while (this.downrodGroup.children.length > 0) {
      this.downrodGroup.remove(this.downrodGroup.children[0]);
    }

    this.downrodLengthInches = inches;
    const lengthMap = {
      0: 0.12,  // Flush hugger
      6: 0.5,   // Standard
      12: 0.9,  // 12" drop
      24: 1.4   // 24" drop
    };
    const rodLength = lengthMap[inches] || 0.5;

    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, rodLength, 24);
    this.downrodMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.3,
      roughness: 0.5
    });
    this.motorMaterials.push(this.downrodMat);

    const rodMesh = new THREE.Mesh(rodGeo, this.downrodMat);
    rodMesh.position.y = 0.28 + rodLength / 2;
    rodMesh.castShadow = true;
    this.downrodGroup.add(rodMesh);

    // Position canopy above downrod
    if (this.canopyGroup) {
      this.canopyGroup.position.y = rodLength - 0.5;
    }
  }

  rebuildBlades() {
    // Remove existing blades
    while (this.bladesGroup.children.length > 0) {
      this.bladesGroup.remove(this.bladesGroup.children[0]);
    }
    this.bladeMaterials = [];

    const numBlades = this.bladeCount;
    const baseSpan = 2.2 * this.bladeSpanScale; // Length of blade from center
    const bladePitch = 0.22; // ~13 degree aerodynamic pitch angle

    // Common blade material
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.15,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    this.bladeMaterials.push(bladeMat);

    for (let i = 0; i < numBlades; i++) {
      const angle = (i / numBlades) * Math.PI * 2;
      const bladeArmGroup = new THREE.Group();
      bladeArmGroup.rotation.y = angle;

      // Precision Blade Iron / Bracket
      const bracketGeo = new THREE.BoxGeometry(0.35, 0.035, 0.09);
      const bracketMat = new THREE.MeshStandardMaterial({
        color: 0x111113,
        metalness: 0.7,
        roughness: 0.35
      });
      this.accentMaterials.push(bracketMat);
      const bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.x = 0.58;
      bracket.castShadow = true;
      bladeArmGroup.add(bracket);

      // Bolts detail on bracket
      const boltGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12);
      const bolt1 = new THREE.Mesh(boltGeo, this.accentRingMat);
      bolt1.position.set(0.68, 0.02, 0.025);
      const bolt2 = new THREE.Mesh(boltGeo, this.accentRingMat);
      bolt2.position.set(0.68, 0.02, -0.025);
      bladeArmGroup.add(bolt1, bolt2);

      // Aerodynamic Curved Airfoil Fan Blade Geometry
      // We shape the blade using an ExtrudeGeometry with an aerodynamic cross-section
      const shape = new THREE.Shape();
      const bladeLength = baseSpan;
      const rootWidth = 0.28;
      const tipWidth = 0.19;

      shape.moveTo(0, -rootWidth / 2);
      // Gentle curve along leading edge
      shape.bezierCurveTo(
        bladeLength * 0.4, -rootWidth * 0.55,
        bladeLength * 0.8, -tipWidth * 0.7,
        bladeLength, -tipWidth / 2
      );
      // Rounded tip
      shape.quadraticCurveTo(
        bladeLength + 0.08, 0,
        bladeLength, tipWidth / 2
      );
      // Trailing aerodynamic edge
      shape.bezierCurveTo(
        bladeLength * 0.7, tipWidth * 0.65,
        bladeLength * 0.3, rootWidth * 0.5,
        0, rootWidth / 2
      );
      shape.closePath();

      const extrudeSettings = {
        depth: 0.018,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.008
      };

      const bladeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      bladeGeo.center();

      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
      bladeMesh.rotation.x = Math.PI / 2 + bladePitch; // Aerodynamic pitch angle
      bladeMesh.position.x = 0.68 + bladeLength / 2;
      bladeMesh.position.y = 0.01;
      bladeMesh.castShadow = true;
      bladeMesh.receiveShadow = true;

      bladeArmGroup.add(bladeMesh);
      this.bladesGroup.add(bladeArmGroup);
    }

    // Optional Halo Light Ring for Halo Smart Model
    if (this.hasHaloRing) {
      const haloGeo = new THREE.TorusGeometry(baseSpan + 0.72, 0.035, 16, 64);
      this.haloMat = new THREE.MeshStandardMaterial({
        color: 0xfff0d0,
        emissive: 0xffd27d,
        emissiveIntensity: 1.2,
        roughness: 0.2
      });
      const haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
      haloMesh.rotation.x = Math.PI / 2;
      this.rotorGroup.add(haloMesh);
    }

    // Reapply active finish
    if (this.currentColorDef) {
      this.applyColorConfig(this.currentColorDef, this.isDualTone);
    }
  }

  buildAirflowParticles() {
    // 220 aerodynamic wind vortex particles
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const ySpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const r = 0.4 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const y = -0.2 - Math.random() * 2.8;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      radii[i] = r;
      angles[i] = angle;
      ySpeeds[i] = 0.8 + Math.random() * 1.5;
      alphas[i] = 0.2 + Math.random() * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleData = { radii, angles, ySpeeds, alphas, count: particleCount };

    // Point material
    const particleMat = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(geometry, particleMat);
    this.scene.add(this.particleSystem);
  }

  updateAirflowParticles(delta) {
    if (!this.particleSystem) return;
    if (!this.particlesActive || this.currentAngularVelocity === 0) {
      this.particleSystem.visible = false;
      return;
    }
    this.particleSystem.visible = true;

    const positions = this.particleSystem.geometry.attributes.position.array;
    const { radii, angles, ySpeeds, count } = this.particleData;
    const speedRatio = Math.abs(this.currentAngularVelocity) / 25; // 0 to 1
    const isDowndraft = this.direction === 1;

    for (let i = 0; i < count; i++) {
      // Swirl angle follows fan rotor
      angles[i] += this.currentAngularVelocity * delta * 0.45;

      // Vertical flow: downward for summer cooling, upward for winter warmth
      if (isDowndraft) {
        positions[i * 3 + 1] -= ySpeeds[i] * delta * (1.2 + speedRatio * 3.5);
        if (positions[i * 3 + 1] < -3.2) {
          positions[i * 3 + 1] = -0.2; // reset to top
        }
      } else {
        positions[i * 3 + 1] += ySpeeds[i] * delta * (1.2 + speedRatio * 3.5);
        if (positions[i * 3 + 1] > -0.2) {
          positions[i * 3 + 1] = -3.2; // reset to bottom
        }
      }

      // Conical vortex expansion
      const yNorm = Math.abs(positions[i * 3 + 1]) / 3.0;
      const currentRadius = radii[i] * (1.0 + yNorm * 0.6);

      positions[i * 3] = Math.cos(angles[i]) * currentRadius;
      positions[i * 3 + 2] = Math.sin(angles[i]) * currentRadius;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.material.opacity = 0.2 + speedRatio * 0.55;
  }

  /**
   * Apply selected Color / Finish directly to the 3D spinning ceiling fan
   */
  applyColorConfig(colorDef, isDualTone = false) {
    this.currentColorDef = colorDef;
    this.isDualTone = isDualTone;

    const primaryHex = parseInt(colorDef.hex.replace('#', '0x'), 16);
    const motorHex = parseInt(colorDef.motorColor.replace('#', '0x'), 16);
    const accentHex = parseInt(colorDef.accentColor.replace('#', '0x'), 16);

    // 1. Update Blade Materials
    this.bladeMaterials.forEach((mat) => {
      if (colorDef.isWood) {
        mat.map = this.textures.createWoodTexture(colorDef.woodType || 'walnut');
        mat.color.setHex(0xffffff); // allow texture tint
        mat.roughness = colorDef.roughness;
        mat.metalness = colorDef.metalness;
      } else {
        mat.map = null;
        mat.color.setHex(primaryHex);
        mat.roughness = colorDef.roughness;
        mat.metalness = colorDef.metalness;
      }
      mat.needsUpdate = true;
    });

    // 2. Update Motor / Canopy Materials
    this.motorMaterials.forEach((mat) => {
      if (isDualTone) {
        // High-contrast pairing (e.g. Brushed Brass or Satin Onyx for motor)
        const contrastHex = colorDef.id === 'matte-black' ? 0xcca152 : 0x18181b;
        mat.color.setHex(contrastHex);
        mat.metalness = colorDef.id === 'matte-black' ? 0.85 : 0.2;
        mat.roughness = 0.4;
      } else {
        mat.color.setHex(motorHex);
        mat.metalness = colorDef.metalness;
        mat.roughness = colorDef.roughness;
      }
      mat.needsUpdate = true;
    });

    // 3. Update Accent Details (Rings, Bolts, Trim)
    this.accentMaterials.forEach((mat) => {
      mat.color.setHex(accentHex);
      mat.metalness = 0.85;
      mat.roughness = 0.25;
      mat.needsUpdate = true;
    });
  }

  setBladeCount(count) {
    if (this.bladeCount === count) return;
    this.bladeCount = count;
    this.rebuildBlades();
  }

  setBladeSpan(inches) {
    const scaleMap = { 44: 0.85, 52: 1.0, 60: 1.25 };
    this.bladeSpanScale = scaleMap[inches] || 1.0;
    this.rebuildBlades();
  }

  setDownrodLength(inches) {
    this.updateDownrodGeometry(inches);
  }

  setModel(modelId) {
    const model = MODEL_DEFINITIONS[modelId] || MODEL_DEFINITIONS['vortex-v1'];
    this.hasHaloRing = !!model.hasHaloRing;
    this.rebuildBlades();
  }

  setSpeed(speedLevel) {
    this.fanSpeed = Math.max(0, Math.min(5, speedLevel));
    // Speed to rad/s mapping:
    // Speed 0: 0 rad/s
    // Speed 1: 6.8 rad/s (~65 RPM)
    // Speed 2: 12.5 rad/s (~120 RPM)
    // Speed 3: 18.3 rad/s (~175 RPM)
    // Speed 4: 24.1 rad/s (~230 RPM)
    // Speed 5: 30.4 rad/s (~290 RPM)
    const velocityMap = [0, 6.8, 12.5, 18.3, 24.1, 30.4];
    this.targetAngularVelocity = velocityMap[this.fanSpeed];
  }

  setDirection(direction) {
    // 'summer' = counter-clockwise (downward airflow) -> 1
    // 'winter' = clockwise (upward airflow) -> -1
    this.direction = direction === 'summer' ? 1 : -1;
  }

  setLightState(isOn, kelvin = 2700, brightness = 85) {
    this.lightOn = isOn;
    this.lightKelvin = kelvin;
    this.lightBrightness = brightness / 100;

    if (!this.fanPointLight || !this.lightLensMat) return;

    if (!this.lightOn) {
      this.fanPointLight.intensity = 0;
      this.lightLensMat.emissiveIntensity = 0.05;
      return;
    }

    // Kelvin to Hex color
    let lightColorHex = 0xffb766; // 2700K Warm
    if (kelvin >= 5500) {
      lightColorHex = 0xe0f2fe; // 6000K Crisp Daylight
    } else if (kelvin >= 3500) {
      lightColorHex = 0xfff4e6; // 4000K Neutral
    }

    this.fanPointLight.color.setHex(lightColorHex);
    this.fanPointLight.intensity = 3.0 * this.lightBrightness;

    this.lightLensMat.emissive.setHex(lightColorHex);
    this.lightLensMat.emissiveIntensity = 0.4 + this.lightBrightness * 0.9;
  }

  setCameraView(viewName) {
    if (!this.camera || !this.controls) return;
    const target = this.controls.target;

    switch (viewName) {
      case 'bottom': // Looking straight up at ceiling fan vortex
        this.animateCameraTo(new THREE.Vector3(0, -3.2, 0.01), new THREE.Vector3(0, 0.4, 0));
        break;
      case 'side': // Horizontal architectural elevation
        this.animateCameraTo(new THREE.Vector3(0, 0.35, 4.2), new THREE.Vector3(0, 0.35, 0));
        break;
      case 'room': // Zoomed out in room context
        this.animateCameraTo(new THREE.Vector3(2.4, -0.6, 5.8), new THREE.Vector3(0, 0.2, 0));
        break;
      case 'perspective':
      default:
        this.animateCameraTo(new THREE.Vector3(0, -1.2, 4.4), new THREE.Vector3(0, 0.2, 0));
        break;
    }
  }

  animateCameraTo(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startLook = this.controls.target.clone();
    const duration = 800; // ms
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerpVectors(startLook, targetLookAt, ease);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Realistic rotational inertia physics:
    // Fan smoothly accelerates or coasts to a stop
    const targetVel = this.targetAngularVelocity * this.direction;
    const lerpFactor = this.fanSpeed === 0 ? 1.2 : 2.0; // coasts longer when slowing down
    this.currentAngularVelocity += (targetVel - this.currentAngularVelocity) * delta * lerpFactor;

    // Spin the rotor assembly
    this.rotorGroup.rotation.y += this.currentAngularVelocity * delta;

    // Airflow particles simulation
    this.updateAirflowParticles(delta);

    // Controls update
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Telemetry updates for HUD (RPM, CFM, dB)
    if (this.onTelemetryUpdate) {
      const actualRpm = Math.abs(Math.round((this.currentAngularVelocity / (Math.PI * 2)) * 60));
      const cfmRatio = actualRpm / 290;
      const actualCfm = Math.round(1800 + cfmRatio * 5050);
      const actualDb = (16.2 + (actualRpm / 290) * 12.8).toFixed(1);

      this.onTelemetryUpdate({
        rpm: actualRpm,
        cfm: actualRpm > 10 ? actualCfm : 0,
        db: actualRpm > 10 ? actualDb : '14.0',
        speed: this.fanSpeed
      });
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}

import * as THREE from 'three';
import { SeededRandom } from './SeededRandom.ts';

/**
 * Procedural Deterministic Signal Field & Star-to-Data Morphing
 * Features:
 * - 1,200 celestial stars morphing into frequency traces
 * - 280+ reproducible signal ribbons organized in known families
 * - Background thermal noise floor with controllable congestion
 * - The Protagonist Anomalous Signal with diagonal drift and warm gold emergence
 */
export class SignalField {
  public readonly group: THREE.Group;

  // Star to data morphing system
  private starPoints: THREE.Points;
  private starCelestialPositions: Float32Array;
  private starDataPositions: Float32Array;
  private starCurrentPositions: Float32Array;
  private starMaterial: THREE.PointsMaterial;
  private numStars = 1200;

  // Known signal ribbons
  private ribbonLines: THREE.LineSegments;
  private ribbonPositions: Float32Array;
  private ribbonBaseColors: Float32Array;
  private ribbonMaterial: THREE.LineBasicMaterial;
  private numRibbons = 260;

  // Background noise particles (complexity / overwhelm phase)
  private noisePoints: THREE.Points;
  private noiseMaterial: THREE.PointsMaterial;
  private numNoise = 800;

  // The Protagonist Anomalous Signal
  private heroSignalLine: THREE.Line;
  private heroGlowLine: THREE.Line;
  private heroMaterial: THREE.LineBasicMaterial;
  private heroGlowMaterial: THREE.LineBasicMaterial;

  // Connective Precursor Signal Points (Gentle transition into observation data)
  private precursorPoints: THREE.Points;
  private precursorMaterial: THREE.PointsMaterial;
  private numPrecursors = 84;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SignalField';

    const rng = new SeededRandom(1420405);

    // 1. Celestial Stars & Star-to-Data Morphing
    const starGeo = new THREE.BufferGeometry();
    this.starCelestialPositions = new Float32Array(this.numStars * 3);
    this.starDataPositions = new Float32Array(this.numStars * 3);
    this.starCurrentPositions = new Float32Array(this.numStars * 3);

    for (let i = 0; i < this.numStars; i++) {
      // Celestial position (distant night sky dome)
      const u = rng.next();
      const v = rng.next();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = rng.range(120, 260);

      const cx = radius * Math.sin(phi) * Math.cos(theta);
      const cy = Math.abs(radius * Math.cos(phi)) + 8; // Mostly upper sky
      const cz = -Math.abs(radius * Math.sin(phi) * Math.sin(theta));

      this.starCelestialPositions[i * 3 + 0] = cx;
      this.starCelestialPositions[i * 3 + 1] = cy;
      this.starCelestialPositions[i * 3 + 2] = cz;

      // Data space position: aligned into discrete frequency channels and depths
      const channelIndex = rng.int(-24, 24);
      const channelX = channelIndex * 4.2 + rng.gaussian(0, 0.4);
      const depthZ = rng.range(-60, -320);
      const heightY = 20 + rng.gaussian(0, 7);

      this.starDataPositions[i * 3 + 0] = channelX;
      this.starDataPositions[i * 3 + 1] = heightY;
      this.starDataPositions[i * 3 + 2] = depthZ;

      // Initialize current at celestial
      this.starCurrentPositions[i * 3 + 0] = cx;
      this.starCurrentPositions[i * 3 + 1] = cy;
      this.starCurrentPositions[i * 3 + 2] = cz;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(this.starCurrentPositions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xcad5e2,
      size: 1.5,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.starPoints = new THREE.Points(starGeo, this.starMaterial);
    this.group.add(this.starPoints);

    // 2. Procedural Known Signal Population Ribbons
    // Distributed in depth between Z = -90 and Z = -330
    const ribbonVerts: number[] = [];
    const ribbonCols: number[] = [];

    for (let i = 0; i < this.numRibbons; i++) {
      const familyType = rng.int(0, 3);
      const centerZ = rng.range(-90, -320);
      const channelX = rng.range(-70, 70);
      const baseY = 20 + rng.range(-15, 15);
      const lengthZ = rng.range(18, 48);
      const numSegments = 16;

      // Choose family morphology:
      // 0: Stationary carrier (straight along Z with small phase ripple)
      // 1: Satellite orbital sweep (S-curve across X)
      // 2: Pulsar / harmonic intermittent comb
      // 3: Broadband drift packet
      const sweepFactor = familyType === 1 ? rng.range(-6, 6) : 0;
      const freqRipple = rng.range(0.1, 0.5);

      for (let s = 0; s < numSegments; s++) {
        const t1 = s / numSegments;
        const t2 = (s + 1) / numSegments;

        const z1 = centerZ - t1 * lengthZ;
        const z2 = centerZ - t2 * lengthZ;

        let x1 = channelX;
        let x2 = channelX;
        let y1 = baseY;
        let y2 = baseY;

        if (familyType === 1) {
          x1 += Math.sin(t1 * Math.PI) * sweepFactor;
          x2 += Math.sin(t2 * Math.PI) * sweepFactor;
        } else if (familyType === 0) {
          x1 += Math.sin(t1 * Math.PI * 4 * freqRipple) * 0.4;
          x2 += Math.sin(t2 * Math.PI * 4 * freqRipple) * 0.4;
        } else if (familyType === 2) {
          y1 += Math.sin(t1 * Math.PI * 8) * 0.8;
          y2 += Math.sin(t2 * Math.PI * 8) * 0.8;
        }

        ribbonVerts.push(x1, y1, z1, x2, y2, z2);

        // Cool palette: scientific blue (0x376A9B), slate (0x5C89B7), subtle gray (0x7B8D9E)
        const tone = rng.next();
        let r = 0.22,
          g = 0.38,
          b = 0.58;
        if (tone > 0.6) {
          r = 0.36;
          g = 0.54;
          b = 0.72;
        } else if (tone < 0.25) {
          r = 0.16;
          g = 0.26;
          b = 0.38;
        }

        ribbonCols.push(r, g, b, r, g, b);
      }
    }

    this.ribbonPositions = new Float32Array(ribbonVerts);
    this.ribbonBaseColors = new Float32Array(ribbonCols);

    const ribbonGeo = new THREE.BufferGeometry();
    ribbonGeo.setAttribute('position', new THREE.BufferAttribute(this.ribbonPositions, 3));
    ribbonGeo.setAttribute('color', new THREE.BufferAttribute(this.ribbonBaseColors, 3));

    this.ribbonMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ribbonLines = new THREE.LineSegments(ribbonGeo, this.ribbonMaterial);
    this.group.add(this.ribbonLines);

    // 3. Background Thermal Noise Floor Particles
    const noiseGeo = new THREE.BufferGeometry();
    const noisePos = new Float32Array(this.numNoise * 3);
    for (let i = 0; i < this.numNoise; i++) {
      noisePos[i * 3 + 0] = rng.range(-80, 80);
      noisePos[i * 3 + 1] = 20 + rng.range(-20, 20);
      noisePos[i * 3 + 2] = rng.range(-140, -320);
    }
    noiseGeo.setAttribute('position', new THREE.BufferAttribute(noisePos, 3));
    this.noiseMaterial = new THREE.PointsMaterial({
      color: 0x5a738c,
      size: 1.0,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.noisePoints = new THREE.Points(noiseGeo, this.noiseMaterial);
    this.group.add(this.noisePoints);

    // 4. The Protagonist Hero Anomalous Signal
    // Lies directly in the flight corridor around Z = -260 to -340
    // Distinct diagonal frequency drift slope dF/dt
    const heroSegs = 64;
    const heroVerts: number[] = [];
    const startZ = -250;
    const endZ = -340;
    const startX = 6.2;
    const endX = -3.4; // Slants across frequency channels!
    const heroBaseY = 20.0;

    for (let s = 0; s <= heroSegs; s++) {
      const u = s / heroSegs;
      const z = startZ + u * (endZ - startZ);
      // Linear drift + very subtle coherent harmonic modulation
      const x = startX + u * (endX - startX) + Math.sin(u * Math.PI * 16) * 0.12;
      const y = heroBaseY + Math.cos(u * Math.PI * 4) * 0.35;
      heroVerts.push(x, y, z);
    }

    const heroGeo = new THREE.BufferGeometry();
    heroGeo.setAttribute('position', new THREE.Float32BufferAttribute(heroVerts, 3));

    // Core crisp ribbon
    this.heroMaterial = new THREE.LineBasicMaterial({
      color: 0x5c89b7,
      transparent: true,
      opacity: 0.0,
      linewidth: 1,
    });
    this.heroSignalLine = new THREE.Line(heroGeo, this.heroMaterial);
    this.group.add(this.heroSignalLine);

    // Warm gold halo outline for anomaly emergence
    this.heroGlowMaterial = new THREE.LineBasicMaterial({
      color: 0xc19348,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    this.heroGlowLine = new THREE.Line(heroGeo, this.heroGlowMaterial);
    this.heroGlowLine.scale.set(1.02, 1.02, 1.0);
    this.group.add(this.heroGlowLine);

    // 5. Connective Precursor Signal Trace Points
    // Flanking the observation corridor, leaving the central text area (|x| < 6.8) clear
    const precursorRng = new SeededRandom(1420701);
    const precursorGeo = new THREE.BufferGeometry();
    const precursorPos = new Float32Array(this.numPrecursors * 3);
    for (let i = 0; i < this.numPrecursors; i++) {
      const side = precursorRng.next() > 0.5 ? 1 : -1;
      const px = side * precursorRng.range(7.2, 30.0);
      const py = precursorRng.range(8.0, 26.0);
      const pz = precursorRng.range(-35.0, -115.0);

      precursorPos[i * 3 + 0] = px;
      precursorPos[i * 3 + 1] = py;
      precursorPos[i * 3 + 2] = pz;
    }
    precursorGeo.setAttribute('position', new THREE.BufferAttribute(precursorPos, 3));

    this.precursorMaterial = new THREE.PointsMaterial({
      color: 0x7da4cc,
      size: 1.4,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.precursorPoints = new THREE.Points(precursorGeo, this.precursorMaterial);
    this.group.add(this.precursorPoints);
  }

  /**
   * Update field state based on scroll progress and time
   */
  public update(progress: number, time: number) {
    // 1. Stars to Data Morphing (0.18 -> 0.38)
    const morphProgress = THREE.MathUtils.smoothstep(progress, 0.18, 0.38);
    const starPos = this.starPoints.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.numStars; i++) {
      const idx = i * 3;
      const cx = this.starCelestialPositions[idx];
      const cy = this.starCelestialPositions[idx + 1];
      const cz = this.starCelestialPositions[idx + 2];

      const dx = this.starDataPositions[idx];
      const dy = this.starDataPositions[idx + 1];
      const dz = this.starDataPositions[idx + 2];

      starPos[idx] = THREE.MathUtils.lerp(cx, dx, morphProgress);
      starPos[idx + 1] = THREE.MathUtils.lerp(cy, dy, morphProgress);
      starPos[idx + 2] = THREE.MathUtils.lerp(cz, dz, morphProgress);
    }
    this.starPoints.geometry.attributes.position.needsUpdate = true;

    // Star opacity fades down after data transition
    const starsFadeOut = 1 - THREE.MathUtils.smoothstep(progress, 0.45, 0.65);
    this.starMaterial.opacity =
      (0.2 + starsFadeOut * 0.7) * (1 - THREE.MathUtils.smoothstep(progress, 0.85, 0.95));

    // 2. Known Signal Population Ribbons
    // Fades in (0.24 -> 0.38), reaches peak density during overwhelm (0.45 -> 0.62)
    const popIn = THREE.MathUtils.smoothstep(progress, 0.24, 0.38);
    // THE QUIET MOMENT (0.65 -> 0.76): Background signals fade out dramatically!
    const quietProgress = THREE.MathUtils.smoothstep(progress, 0.65, 0.76);
    const popQuietFactor = 1.0 - quietProgress * 0.94; // Drop down to 0.06

    this.ribbonMaterial.opacity = popIn * popQuietFactor * 0.75;

    // 3. Background Thermal Noise Floor
    // Elevates during complexity / overwhelm (0.48 -> 0.62), then completely collapses
    const noiseIn = THREE.MathUtils.smoothstep(progress, 0.44, 0.56);
    const noiseOut = 1 - THREE.MathUtils.smoothstep(progress, 0.64, 0.72);
    this.noiseMaterial.opacity = noiseIn * noiseOut * 0.45;

    // 4. The Protagonist Hero Signal
    // Emerges around 0.32, persists through the entire journey
    const heroIn = THREE.MathUtils.smoothstep(progress, 0.3, 0.42);

    // When everything quiets (0.65 -> 0.76), hero transitions into warm gold!
    const heroDeviation = THREE.MathUtils.smoothstep(progress, 0.64, 0.76);
    const heroSpectrogramTransition = 1 - THREE.MathUtils.smoothstep(progress, 0.86, 0.93);

    // Hero color morph from cool slate to warm gold
    const coolColor = new THREE.Color(0x7da4cc);
    const warmGoldColor = new THREE.Color(0xd4a359);
    const activeColor = coolColor.clone().lerp(warmGoldColor, heroDeviation);

    this.heroMaterial.color.copy(activeColor);
    this.heroMaterial.opacity = heroIn * heroSpectrogramTransition * (0.6 + heroDeviation * 0.4);

    // Warm glow activates during deviation and investigation
    this.heroGlowMaterial.opacity = heroDeviation * heroSpectrogramTransition * 0.55;

    // Subtle breathing drift on the hero signal
    this.heroSignalLine.position.y = Math.sin(time * 0.8) * 0.15;
    this.heroGlowLine.position.y = this.heroSignalLine.position.y;

    // 5. Connective Precursor Signal Trace Emergence (0.13 -> 0.26)
    // Subtly emerges as the planet leaves and first narrative statement is absorbed,
    // providing the subconscious feeling of observation data beginning to form.
    const precursorIn = THREE.MathUtils.smoothstep(progress, 0.13, 0.18);
    const precursorOut = 1 - THREE.MathUtils.smoothstep(progress, 0.22, 0.28);
    this.precursorMaterial.opacity = precursorIn * precursorOut * 0.55;
  }
}

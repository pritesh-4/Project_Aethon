import * as THREE from 'three';

/**
 * Electromagnetic Radio Beam & Wavefront Field
 * Subtle volumetric wavefront rings, electromagnetic stream particles,
 * and faint propagation structure emanating from the radio telescope dish.
 */
export class RadioBeam {
  public readonly group: THREE.Group;
  private wavefrontRings: THREE.LineLoop[] = [];
  private ringSpeeds: number[] = [];
  private beamParticles: THREE.Points;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private numParticles = 480;
  private materialRings: THREE.LineBasicMaterial;
  private materialParticles: THREE.PointsMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'RadioBeam';

    // Positioned aligned with celestial star center
    this.group.position.set(0, 3.2, 0);

    // 1. Concentric Electromagnetic Wavefront Rings
    const numRings = 16;
    this.materialRings = new THREE.LineBasicMaterial({
      color: 0x5c89b7,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    const ringSegments = 48;
    for (let i = 0; i < numRings; i++) {
      const ringGeo = new THREE.BufferGeometry();
      const ringVerts: number[] = [];
      const baseRadius = 2.0 + i * 2.2;

      for (let s = 0; s <= ringSegments; s++) {
        const theta = (s / ringSegments) * Math.PI * 2;
        ringVerts.push(Math.cos(theta) * baseRadius, Math.sin(theta) * baseRadius, 0);
      }
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ringVerts, 3));
      const ringMesh = new THREE.LineLoop(ringGeo, this.materialRings.clone());

      // Space rings out along beam direction (-Z, tilted upward)
      const dist = 5 + i * 8.5;
      ringMesh.position.set(0, 0, -dist);
      this.wavefrontRings.push(ringMesh);
      this.ringSpeeds.push(1.0 + (i % 3) * 0.2);
      this.group.add(ringMesh);
    }

    // 2. Faint Volumetric Stream Particles along the beam envelope
    const particleGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    this.particleVelocities = new Float32Array(this.numParticles);

    for (let i = 0; i < this.numParticles; i++) {
      const z = -Math.random() * 140;
      // Cone radius expands with distance along Z
      const coneRadius = 1.5 + Math.abs(z) * 0.18;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * coneRadius;

      this.particlePositions[i * 3 + 0] = Math.cos(angle) * r;
      this.particlePositions[i * 3 + 1] = Math.sin(angle) * r;
      this.particlePositions[i * 3 + 2] = z;

      this.particleVelocities[i] = 12 + Math.random() * 18;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.materialParticles = new THREE.PointsMaterial({
      color: 0x7da4cc,
      size: 1.2,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.beamParticles = new THREE.Points(particleGeo, this.materialParticles);
    this.group.add(this.beamParticles);

    // Initial beam tilt aimed up toward the southern sky
    this.group.rotation.x = 0.55;
  }

  /**
   * Update wavefront propagation and particle flow
   */
  public update(progress: number, time: number, delta: number) {
    // Beam emerges as dish elevates (0.08 -> 0.24) and stays active into signal entry (0.38)
    const beamIn = THREE.MathUtils.smoothstep(progress, 0.08, 0.2);
    const beamOut = 1 - THREE.MathUtils.smoothstep(progress, 0.32, 0.44);
    const beamAlpha = beamIn * beamOut;

    // Synchronize beam orientation with telescope elevation
    const tiltProg = THREE.MathUtils.smoothstep(progress, 0.04, 0.22);
    this.group.rotation.x = 0.55 + tiltProg * 0.55;

    // Update wavefront rings
    this.wavefrontRings.forEach((ring, idx) => {
      const ringMat = ring.material as THREE.LineBasicMaterial;
      const wavePhase = (time * 0.8 * this.ringSpeeds[idx] + idx * 0.3) % 1;
      const pulseOpacity = (0.08 + Math.sin(wavePhase * Math.PI) * 0.22) * beamAlpha;
      ringMat.opacity = pulseOpacity;

      // Subtle breathing scale
      const s = 1.0 + Math.sin(time * 1.5 + idx) * 0.05;
      ring.scale.set(s, s, 1);
    });

    // Update particle stream
    this.materialParticles.opacity = beamAlpha * 0.45;
    if (beamAlpha > 0.01) {
      const pos = this.beamParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.numParticles; i++) {
        // Stream particles outwards along -Z
        pos[i * 3 + 2] -= this.particleVelocities[i] * delta * 2.2;

        // Wrap around when reaching far end
        if (pos[i * 3 + 2] < -140) {
          pos[i * 3 + 2] = -2;
          const coneRadius = 1.5;
          const angle = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * coneRadius;
          pos[i * 3 + 0] = Math.cos(angle) * r;
          pos[i * 3 + 1] = Math.sin(angle) * r;
        }
      }
      this.beamParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

import * as THREE from 'three';

/**
 * Time-Frequency Spectrogram Surface & Soft Atmospheric Quiet Zone
 * - Dynamic high-resolution waterfall spectrogram plane with feathered edges
 * - Volumetric soft atmospheric halo mesh behind the observation plane
 * - Dual undulating quiet-zone boundary waves (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~)
 * - Frequency (X) and Time (Y) axes with calibration markings
 * - Distinct diagonal drift track with warm gold thermal intensity
 * - Scientific figure annotations with fine leader lines
 * - Precision candidate lock reticle
 */
export class SpectrogramPlane {
  public readonly group: THREE.Group;
  private planeMesh: THREE.Mesh;
  private planeMaterial: THREE.MeshBasicMaterial;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  // Soft atmospheric halo & quiet zone boundary waves
  private haloMesh: THREE.Mesh;
  private haloMaterial: THREE.MeshBasicMaterial;
  private waveLineTop: THREE.Line;
  private waveLineBottom: THREE.Line;
  private waveMaterial: THREE.LineBasicMaterial;

  // Scientific Figure Annotation groups
  private annotationsGroup: THREE.Group;
  private annotationLines: THREE.LineSegments;
  private reticleGroup: THREE.Group;
  private reticleMaterial: THREE.LineBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SpectrogramPlane';

    // Positioned at the destination of the flight corridor
    this.group.position.set(0, 20, -342);

    // 1. Soft Atmospheric Quiet Zone Halo Mesh (Placed behind the spectrogram)
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 512;
    haloCanvas.height = 512;
    const hctx = haloCanvas.getContext('2d');
    if (hctx) {
      const hGrad = hctx.createRadialGradient(256, 256, 20, 256, 256, 250);
      hGrad.addColorStop(0.0, 'rgba(55, 106, 155, 0.45)');
      hGrad.addColorStop(0.35, 'rgba(30, 60, 90, 0.28)');
      hGrad.addColorStop(0.65, 'rgba(212, 163, 89, 0.12)'); // subtle warm aura
      hGrad.addColorStop(1.0, 'rgba(7, 11, 16, 0.0)');
      hctx.fillStyle = hGrad;
      hctx.fillRect(0, 0, 512, 512);
    }
    const haloTexture = new THREE.CanvasTexture(haloCanvas);

    const haloGeo = new THREE.PlaneGeometry(54, 36);
    this.haloMaterial = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.haloMesh = new THREE.Mesh(haloGeo, this.haloMaterial);
    this.haloMesh.position.set(0, 0, -0.6);
    this.group.add(this.haloMesh);

    // 2. High-Resolution Waterfall Spectrogram Texture (1024 x 640)
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 640;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for spectrogram');
    this.ctx = ctx;

    this.renderSpectrogramTexture(0, 0);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Plane geometry facing camera: Width 36, Height 22.5
    const planeGeo = new THREE.PlaneGeometry(36, 22.5);
    this.planeMaterial = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.planeMesh = new THREE.Mesh(planeGeo, this.planeMaterial);
    this.group.add(this.planeMesh);

    // 3. Undulating Quiet Zone Boundary Waveforms (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~)
    const waveSegments = 64;
    const waveWidth = 42;
    const topWaveVerts: number[] = [];
    const botWaveVerts: number[] = [];

    for (let s = 0; s <= waveSegments; s++) {
      const u = s / waveSegments;
      const x = (u - 0.5) * waveWidth;
      const yWave = Math.sin(u * Math.PI * 12) * 0.45;
      topWaveVerts.push(x, 12.8 + yWave, 0.1);
      botWaveVerts.push(x, -12.8 + yWave, 0.1);
    }

    const topWaveGeo = new THREE.BufferGeometry();
    topWaveGeo.setAttribute('position', new THREE.Float32BufferAttribute(topWaveVerts, 3));
    const botWaveGeo = new THREE.BufferGeometry();
    botWaveGeo.setAttribute('position', new THREE.Float32BufferAttribute(botWaveVerts, 3));

    this.waveMaterial = new THREE.LineBasicMaterial({
      color: 0x5c89b7,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    this.waveLineTop = new THREE.Line(topWaveGeo, this.waveMaterial);
    this.waveLineBottom = new THREE.Line(botWaveGeo, this.waveMaterial);
    this.group.add(this.waveLineTop);
    this.group.add(this.waveLineBottom);

    // 4. Scientific Figure Annotations & Leader Lines (Pure 3D geometry)
    this.annotationsGroup = new THREE.Group();

    // Leader lines connecting anomalous track to annotations
    const lineGeo = new THREE.BufferGeometry();
    // 4 leader lines (start -> elbow -> end)
    const lineVerts = [
      // Annotation 1: Frequency Drift (top right of track)
      2.0, 4.0, 0.2, 4.5, 6.2, 0.2, 4.5, 6.2, 0.2, 9.5, 6.2, 0.2,

      // Annotation 2: Persistent (middle left of track)
      -1.2, 0.5, 0.2, -3.5, 1.8, 0.2, -3.5, 1.8, 0.2, -8.5, 1.8, 0.2,

      // Annotation 3: Low Catalog Similarity (lower left)
      -3.0, -3.5, 0.2, -5.5, -5.0, 0.2, -5.5, -5.0, 0.2, -10.5, -5.0, 0.2,

      // Annotation 4: Low RFI Likelihood (bottom right)
      -1.0, -4.5, 0.2, 2.5, -6.5, 0.2, 2.5, -6.5, 0.2, 8.0, -6.5, 0.2,
    ];
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xc19348,
      transparent: true,
      opacity: 0.0,
    });
    this.annotationLines = new THREE.LineSegments(lineGeo, lineMat);
    this.annotationsGroup.add(this.annotationLines);

    this.group.add(this.annotationsGroup);

    // 5. Precision Candidate Lock Reticle
    this.reticleGroup = new THREE.Group();
    const reticleGeo = new THREE.BufferGeometry();
    const rVerts: number[] = [];

    // Corner brackets around anomaly box (box from x: -4 to 3, y: -5 to 5)
    const bx1 = -4.2,
      bx2 = 3.2,
      by1 = -5.2,
      by2 = 5.2;
    const clen = 1.2;

    // Top-left corner
    rVerts.push(bx1, by2 - clen, 0.3, bx1, by2, 0.3);
    rVerts.push(bx1, by2, 0.3, bx1 + clen, by2, 0.3);
    // Top-right corner
    rVerts.push(bx2 - clen, by2, 0.3, bx2, by2, 0.3);
    rVerts.push(bx2, by2, 0.3, bx2, by2 - clen, 0.3);
    // Bottom-left corner
    rVerts.push(bx1, by1 + clen, 0.3, bx1, by1, 0.3);
    rVerts.push(bx1, by1, 0.3, bx1 + clen, by1, 0.3);
    // Bottom-right corner
    rVerts.push(bx2 - clen, by1, 0.3, bx2, by1, 0.3);
    rVerts.push(bx2, by1, 0.3, bx2, by1 + clen, 0.3);

    // Center fiducial marks
    rVerts.push(-0.6, 0.0, 0.3, 0.6, 0.0, 0.3);
    rVerts.push(0.0, -0.6, 0.3, 0.0, 0.6, 0.3);

    reticleGeo.setAttribute('position', new THREE.Float32BufferAttribute(rVerts, 3));
    this.reticleMaterial = new THREE.LineBasicMaterial({
      color: 0xd4a359,
      transparent: true,
      opacity: 0.0,
      linewidth: 1,
    });
    const reticleMesh = new THREE.LineSegments(reticleGeo, this.reticleMaterial);
    this.reticleGroup.add(reticleMesh);

    this.group.add(this.reticleGroup);
  }

  /**
   * Draw dynamic high-fidelity radio spectrogram texture onto internal canvas
   * with soft feathered atmospheric edges for seamless blending into the cosmic void.
   */
  private renderSpectrogramTexture(time: number, candidateLockProgress: number) {
    const c = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Base dark instrument canvas
    c.fillStyle = '#0a1017';
    c.fillRect(0, 0, w, h);

    // 2. Faint FFT frequency channel grid
    c.strokeStyle = 'rgba(74, 98, 122, 0.18)';
    c.lineWidth = 1;
    const gridCols = 16;
    for (let i = 0; i <= gridCols; i++) {
      const gx = (i / gridCols) * (w - 120) + 70;
      c.beginPath();
      c.moveTo(gx, 40);
      c.lineTo(gx, h - 50);
      c.stroke();
    }

    const gridRows = 10;
    for (let j = 0; j <= gridRows; j++) {
      const gy = (j / gridRows) * (h - 90) + 40;
      c.beginPath();
      c.moveTo(70, gy);
      c.lineTo(w - 50, gy);
      c.stroke();
    }

    // 3. Thermal background noise floor (procedural Johnson-Nyquist speckles)
    const imgData = c.getImageData(70, 40, w - 120, h - 90);
    const data = imgData.data;
    const noiseDim = 1.0 - candidateLockProgress * 0.75; // Quiets during candidate lock

    for (let k = 0; k < data.length; k += 4) {
      if ((k / 4) % 3 === 0) {
        const noiseVal = Math.floor((Math.random() * 26 + 6) * noiseDim);
        data[k] = 12 + noiseVal * 0.4; // R
        data[k + 1] = 20 + noiseVal * 0.7; // G
        data[k + 2] = 30 + noiseVal; // B
        data[k + 3] = 255;
      }
    }
    c.putImageData(imgData, 70, 40);

    // 4. The Anomalous Drift Track (The protagonist signal in time-frequency space)
    c.save();
    c.shadowColor = '#d4a359';
    c.shadowBlur = 12;

    const microTimeJitter = Math.sin(time * 1.5) * 0.8;
    // Diagonal track: from (startX, startY) to (endX, endY)
    const x1 = w * 0.58 + microTimeJitter;
    const y1 = 60;
    const x2 = w * 0.38 + microTimeJitter;
    const y2 = h - 70;

    // Draw wide soft envelope
    const grad = c.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0.0, 'rgba(92, 137, 183, 0.4)');
    grad.addColorStop(0.4, 'rgba(212, 163, 89, 0.85)');
    grad.addColorStop(0.65, 'rgba(240, 192, 104, 0.95)');
    grad.addColorStop(1.0, 'rgba(212, 163, 89, 0.75)');

    c.strokeStyle = grad;
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();

    // Draw intense core carrier line (warm white-gold)
    c.shadowBlur = 4;
    c.strokeStyle = '#fff5de';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();

    // Subtle sideband harmonics
    c.strokeStyle = 'rgba(92, 137, 183, 0.28)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x1 + 16, y1);
    c.lineTo(x2 + 16, y2);
    c.moveTo(x1 - 16, y1);
    c.lineTo(x2 - 16, y2);
    c.stroke();
    c.restore();

    // 5. Scientific Axis Markings & Labels
    c.fillStyle = '#6a7e8f';
    c.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    c.textAlign = 'right';

    // Time axis ticks (vertical)
    const timeLabels = ['300s', '240s', '180s', '120s', '60s', '0s'];
    timeLabels.forEach((lbl, idx) => {
      const ty = (idx / (timeLabels.length - 1)) * (h - 90) + 44;
      c.fillText(lbl, 60, ty);
    });

    // Time axis label
    c.save();
    c.translate(22, h * 0.5);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.fillText('TIME (s) // OBS_INTERVAL', 0, 0);
    c.restore();

    // Frequency axis ticks (horizontal)
    c.textAlign = 'center';
    const freqLabels = ['1420.400', '1420.402', '1420.404', '1420.406', '1420.408', '1420.410'];
    freqLabels.forEach((lbl, idx) => {
      const fx = (idx / (freqLabels.length - 1)) * (w - 120) + 70;
      c.fillText(lbl, fx, h - 30);
    });

    // Frequency axis title
    c.fillText('FREQUENCY (MHz) // L-BAND TOPOCENTRIC', w * 0.5, h - 12);

    // Header metadata readout
    c.textAlign = 'left';
    c.fillStyle = '#94a3b8';
    c.fillText('DATASET: CH-1420 // WATERFALL INTEGRATION', 70, 26);
    c.textAlign = 'right';
    c.fillStyle = '#c19348';
    c.fillText('Δf/Δt: -0.32 Hz/s (DRIFT CONFIRMED)', w - 50, 26);

    // 6. Feathered Soft Atmospheric Perimeter Vignette (Softening outer rectangle edges)
    c.save();
    const gradV = c.createLinearGradient(0, 0, 0, h);
    gradV.addColorStop(0.0, 'rgba(10, 16, 23, 1.0)');
    gradV.addColorStop(0.06, 'rgba(10, 16, 23, 0.0)');
    gradV.addColorStop(0.94, 'rgba(10, 16, 23, 0.0)');
    gradV.addColorStop(1.0, 'rgba(10, 16, 23, 1.0)');
    c.fillStyle = gradV;
    c.fillRect(0, 0, w, h);

    const gradH = c.createLinearGradient(0, 0, w, 0);
    gradH.addColorStop(0.0, 'rgba(10, 16, 23, 1.0)');
    gradH.addColorStop(0.05, 'rgba(10, 16, 23, 0.0)');
    gradH.addColorStop(0.95, 'rgba(10, 16, 23, 0.0)');
    gradH.addColorStop(1.0, 'rgba(10, 16, 23, 1.0)');
    c.fillStyle = gradH;
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  /**
   * Update Spectrogram and Annotations based on scroll progress and time
   */
  public update(progress: number, time: number) {
    // Spectrogram plane emerges as camera enters deep signal (0.78 -> 0.85)
    // and stays persistent throughout investigation quiet zone (0.85 -> 0.96)
    const specIn = THREE.MathUtils.smoothstep(progress, 0.76, 0.84);
    const specOut = 1 - THREE.MathUtils.smoothstep(progress, 0.98, 1.0);
    const planeOpacity = specIn * specOut;
    this.planeMaterial.opacity = planeOpacity;

    // Atmospheric halo glows behind spectrogram with gentle breathing pulse
    const haloPulse = 1.0 + Math.sin(time * 0.8) * 0.04;
    this.haloMesh.scale.set(haloPulse, haloPulse, 1.0);
    this.haloMaterial.opacity = planeOpacity * 0.85;

    // Undulating quiet zone boundary waves (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~)
    const waveAlpha = specIn * specOut * 0.65;
    this.waveMaterial.opacity = waveAlpha;

    // Refresh dynamic texture occasionally
    if (planeOpacity > 0.05 && Math.floor(time * 6) % 3 === 0) {
      const lockProg = THREE.MathUtils.smoothstep(progress, 0.92, 0.98);
      this.renderSpectrogramTexture(time, lockProg);
      this.texture.needsUpdate = true;
    }

    // Scientific Figure Annotations appear during camera dive (0.84 -> 0.95)
    const annotIn = THREE.MathUtils.smoothstep(progress, 0.83, 0.88);
    const annotOut = 1 - THREE.MathUtils.smoothstep(progress, 0.96, 1.0);
    const annotOpacity = annotIn * annotOut;
    (this.annotationLines.material as THREE.LineBasicMaterial).opacity = annotOpacity * 0.85;

    // Candidate Lock Reticle activates at climax (0.93 -> 1.00)
    const lockIn = THREE.MathUtils.smoothstep(progress, 0.93, 0.97);
    this.reticleMaterial.opacity = lockIn * 0.9;

    // Subtle breathing pulse on the reticle
    const pulse = 1.0 + Math.sin(time * 2.0) * 0.015 * lockIn;
    this.reticleGroup.scale.set(pulse, pulse, 1.0);
  }
}

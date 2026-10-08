import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ObservatoryTelescope } from './three/ObservatoryTelescope.ts';
import { RadioBeam } from './three/RadioBeam.ts';
import { SignalField } from './three/SignalField.ts';
import { SpectrogramPlane } from './three/SpectrogramPlane.ts';
import { CameraController } from './three/CameraController.ts';

interface SceneCanvasProps {
  progress: number;
  velocity: number;
  reducedMotion: boolean;
  onWebGLError?: () => void;
}

export function SceneCanvas({ progress, velocity, reducedMotion, onWebGLError }: SceneCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(progress);
  const velocityRef = useRef(velocity);
  const reducedMotionRef = useRef(reducedMotion);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Update refs on prop changes without triggering re-initialization
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Initialize Three.js WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      onWebGLError?.();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x070b10, 1.0);
    container.appendChild(renderer.domElement);

    // 2. Setup Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b10, 0.0035);

    // 3. Setup Camera & Continuous Controller
    const camera = new THREE.PerspectiveCamera(
      44,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    const cameraController = new CameraController(camera);

    // 4. Lighting Rig
    // Starlight ambient fill
    const ambientLight = new THREE.AmbientLight(0x182635, 0.85);
    scene.add(ambientLight);

    // High altitude astronomical rim light
    const rimLight = new THREE.DirectionalLight(0x4a6b8a, 1.2);
    rimLight.position.set(-15, 45, 20);
    scene.add(rimLight);

    // Subtle warm point light focused on the anomalous region
    const anomalyLight = new THREE.PointLight(0xd4a359, 0, 80);
    anomalyLight.position.set(0, 20, -320);
    scene.add(anomalyLight);

    // 5. Construct Scene Subsystems
    const telescope = new ObservatoryTelescope();
    scene.add(telescope.group);

    const radioBeam = new RadioBeam();
    scene.add(radioBeam.group);

    const signalField = new SignalField();
    scene.add(signalField.group);

    const spectrogram = new SpectrogramPlane();
    scene.add(spectrogram.group);

    // 6. Pointer interaction listener (subtle parallax)
    const handlePointerMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.x = nx;
      mouseRef.current.y = ny;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // 7. Window Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Master Animation Loop
    let animationFrameId: number;
    let prevTime = performance.now();
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - prevTime) * 0.001, 0.1);
      prevTime = currentTime;
      const totalTime = (currentTime - startTime) * 0.001;
      const p = progressRef.current;
      const vel = velocityRef.current;
      const isReduced = reducedMotionRef.current;

      // Update Camera along the continuous narrative path
      cameraController.update(p, mouseRef.current.x, mouseRef.current.y, vel, isReduced);

      // Update Observatory Telescope dish orientation
      telescope.update(p, totalTime);

      // Update Radio Beam wavefronts and volumetric particles
      radioBeam.update(p, totalTime, delta);

      // Update Procedural Signal Field and Star Morphing
      signalField.update(p, totalTime);

      // Update Time-Frequency Spectrogram and Annotations
      spectrogram.update(p, totalTime);

      // Modulate Anomaly warm light based on deviation progress (0.65 -> 0.95)
      const anomalyIntensity = THREE.MathUtils.smoothstep(p, 0.65, 0.78) * 1.8;
      anomalyLight.intensity = anomalyIntensity;

      // Render Frame
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onWebGLError]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 h-full w-full pointer-events-none z-10"
      aria-hidden="true"
    />
  );
}

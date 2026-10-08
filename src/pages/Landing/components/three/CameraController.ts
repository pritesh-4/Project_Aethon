import * as THREE from 'three';

interface CameraWaypoint {
  progress: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

/**
 * Continuous Choreographed Camera Controller
 * Guarantees C1 spatial continuity, zero teleportation, pointer parallax,
 * and velocity inertia across the entire [0, 1] narrative scroll journey.
 */
export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private waypoints: CameraWaypoint[];

  // Dynamic tracking state
  private currentPos = new THREE.Vector3();
  private currentTarget = new THREE.Vector3();
  private mouseOffset = new THREE.Vector2();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    // Define continuous narrative trajectory waypoints
    this.waypoints = [
      {
        progress: 0.0,
        position: new THREE.Vector3(0, 0, 36),
        target: new THREE.Vector3(0, 3, 0),
        fov: 44,
      },
      {
        progress: 0.12,
        position: new THREE.Vector3(0, 4.5, 23),
        target: new THREE.Vector3(0, 6.5, 0),
        fov: 46,
      },
      {
        progress: 0.24,
        position: new THREE.Vector3(0, 16.5, -6),
        target: new THREE.Vector3(0, 24, -60),
        fov: 48,
      },
      {
        progress: 0.38,
        position: new THREE.Vector3(0, 22, -85),
        target: new THREE.Vector3(0, 21, -170),
        fov: 50,
      },
      {
        progress: 0.52,
        position: new THREE.Vector3(8.5, 21.2, -175),
        target: new THREE.Vector3(0, 20.5, -260),
        fov: 52,
      },
      {
        progress: 0.64,
        position: new THREE.Vector3(4.8, 20.8, -235),
        target: new THREE.Vector3(1.2, 20.2, -310),
        fov: 50,
      },
      {
        progress: 0.74,
        position: new THREE.Vector3(2.0, 20.4, -286),
        target: new THREE.Vector3(0.4, 20.1, -342),
        fov: 46,
      },
      {
        progress: 0.82,
        position: new THREE.Vector3(0.8, 20.25, -320),
        target: new THREE.Vector3(0.2, 20.05, -342),
        fov: 43,
      },
      {
        progress: 0.88,
        position: new THREE.Vector3(0.4, 20.15, -331),
        target: new THREE.Vector3(0.08, 20.02, -342),
        fov: 40,
      },
      {
        progress: 0.93,
        position: new THREE.Vector3(0.15, 20.08, -336.5),
        target: new THREE.Vector3(0.0, 20.0, -342),
        fov: 38,
      },
      {
        progress: 1.0,
        position: new THREE.Vector3(0.0, 20.0, -332),
        target: new THREE.Vector3(0.0, 20.0, -342),
        fov: 42,
      },
    ];

    // Initialize camera position
    this.currentPos.copy(this.waypoints[0].position);
    this.currentTarget.copy(this.waypoints[0].target);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Update camera for current scroll progress, mouse offset, and scroll velocity
   */
  public update(
    progress: number,
    mouseX: number,
    mouseY: number,
    velocity: number,
    reducedMotion: boolean
  ) {
    const p = Math.max(0, Math.min(1, progress));

    // Find bounding waypoints for current p
    let idx = 0;
    while (idx < this.waypoints.length - 2 && this.waypoints[idx + 1].progress <= p) {
      idx++;
    }

    const w0 = this.waypoints[idx];
    const w1 = this.waypoints[idx + 1];

    const range = w1.progress - w0.progress;
    const localT = range > 0 ? (p - w0.progress) / range : 0;
    // Hermite smoothstep for C1 transition between waypoints
    const easeT = THREE.MathUtils.smoothstep(localT, 0, 1);

    // Interpolate base trajectory position, target, and FOV
    const desiredPos = new THREE.Vector3().lerpVectors(w0.position, w1.position, easeT);
    const desiredTarget = new THREE.Vector3().lerpVectors(w0.target, w1.target, easeT);
    const desiredFov = THREE.MathUtils.lerp(w0.fov, w1.fov, easeT);

    // Apply subtle pointer parallax (subdued if reducedMotion active)
    const parallaxWeight = reducedMotion ? 0.05 : 0.8;
    this.mouseOffset.x += (mouseX * parallaxWeight - this.mouseOffset.x) * 0.08;
    this.mouseOffset.y += (mouseY * (parallaxWeight * 0.6) - this.mouseOffset.y) * 0.08;

    // Apply scroll velocity inertia (forward momentum on rapid scroll)
    const velocityOffsetZ = reducedMotion ? 0 : -velocity * 4.5;

    desiredPos.x += this.mouseOffset.x;
    desiredPos.y += this.mouseOffset.y;
    desiredPos.z += velocityOffsetZ;

    // Smoothly blend current camera state towards desired state
    const lerpRate = reducedMotion ? 0.25 : 0.12;
    this.currentPos.lerp(desiredPos, lerpRate);
    this.currentTarget.lerp(desiredTarget, lerpRate);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);

    if (Math.abs(this.camera.fov - desiredFov) > 0.1) {
      this.camera.fov = desiredFov;
      this.camera.updateProjectionMatrix();
    }
  }
}

import * as THREE from 'three';

/**
 * Realistic scientifically-proportioned Parabolic Radio Telescope Dish
 * with concrete pedestal, elevation yoke mount, ribbed parabolic reflector,
 * quadripod support struts, prime focus feed horn, and low desert horizon.
 */
export class ObservatoryTelescope {
  public readonly group: THREE.Group;
  private elevationGroup: THREE.Group;
  private dishMesh: THREE.Mesh;
  private horizonMesh: THREE.Mesh;
  private hazeMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ObservatoryTelescope';

    // Positioned in front of opening camera view
    this.group.position.set(0, -6, 0);

    // 1. Materials with realistic astronomical observatory properties
    // Restrained dark graphite / navy metallic surface
    const structuralMat = new THREE.MeshStandardMaterial({
      color: 0x141f28,
      roughness: 0.72,
      metalness: 0.35,
    });

    const dishMat = new THREE.MeshStandardMaterial({
      color: 0x1b2834,
      roughness: 0.65,
      metalness: 0.4,
      side: THREE.DoubleSide,
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0f171e,
      roughness: 0.8,
      metalness: 0.2,
    });

    const metalStrutMat = new THREE.MeshStandardMaterial({
      color: 0x223242,
      roughness: 0.5,
      metalness: 0.6,
    });

    // 2. Concrete Pedestal & Azimuth Base
    const pedestalGroup = new THREE.Group();

    // Foundation slab
    const slabGeo = new THREE.CylinderGeometry(8, 8.5, 1.2, 16);
    const slabMesh = new THREE.Mesh(slabGeo, darkAccentMat);
    slabMesh.position.y = 0.6;
    pedestalGroup.add(slabMesh);

    // Azimuth turntable ring
    const turntableGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.8, 32);
    const turntableMesh = new THREE.Mesh(turntableGeo, structuralMat);
    turntableMesh.position.y = 1.6;
    pedestalGroup.add(turntableMesh);

    // Azimuth ring tick markings (delicate ring of line segments)
    const tickGeo = new THREE.BufferGeometry();
    const tickPositions: number[] = [];
    const numTicks = 64;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i / numTicks) * Math.PI * 2;
      const r1 = 5.0;
      const r2 = i % 4 === 0 ? 5.35 : 5.25;
      tickPositions.push(
        Math.cos(angle) * r1,
        2.01,
        Math.sin(angle) * r1,
        Math.cos(angle) * r2,
        2.01,
        Math.sin(angle) * r2
      );
    }
    tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPositions, 3));
    const tickMat = new THREE.LineBasicMaterial({
      color: 0x3d566e,
      transparent: true,
      opacity: 0.45,
    });
    const tickLines = new THREE.LineSegments(tickGeo, tickMat);
    pedestalGroup.add(tickLines);

    // Yoke base pillar
    const pillarGeo = new THREE.CylinderGeometry(3.6, 4.2, 2.2, 16);
    const pillarMesh = new THREE.Mesh(pillarGeo, structuralMat);
    pillarMesh.position.y = 3.1;
    pedestalGroup.add(pillarMesh);

    // Yoke arms (left and right elevation support columns)
    const yokeArmGeo = new THREE.BoxGeometry(1.6, 5.0, 2.4);

    const leftArm = new THREE.Mesh(yokeArmGeo, structuralMat);
    leftArm.position.set(-3.8, 6.0, 0);
    pedestalGroup.add(leftArm);

    const rightArm = new THREE.Mesh(yokeArmGeo, structuralMat);
    rightArm.position.set(3.8, 6.0, 0);
    pedestalGroup.add(rightArm);

    // Elevation axle pivot housings
    const axleHousingGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.2, 24);
    const leftHousing = new THREE.Mesh(axleHousingGeo, darkAccentMat);
    leftHousing.rotation.z = Math.PI / 2;
    leftHousing.position.set(-4.6, 8.0, 0);
    pedestalGroup.add(leftHousing);

    const rightHousing = new THREE.Mesh(axleHousingGeo, darkAccentMat);
    rightHousing.rotation.z = Math.PI / 2;
    rightHousing.position.set(4.6, 8.0, 0);
    pedestalGroup.add(rightHousing);

    this.group.add(pedestalGroup);

    // 3. Elevation Rotational Group (Dish + Feed Structure)
    // Pivot center is at y = 8.0
    this.elevationGroup = new THREE.Group();
    this.elevationGroup.position.set(0, 8.0, 0);
    // Initial tilt: looking up at ~40 degrees
    this.elevationGroup.rotation.x = -0.65;

    // Rear counterweight and elevation torque sector gear
    const counterweightGeo = new THREE.BoxGeometry(4.0, 2.2, 3.2);
    const counterweightMesh = new THREE.Mesh(counterweightGeo, darkAccentMat);
    counterweightMesh.position.set(0, -1.2, -2.6);
    this.elevationGroup.add(counterweightMesh);

    // Dish backing space frame (concentric structural rings behind reflector)
    const backHubGeo = new THREE.CylinderGeometry(2.2, 2.8, 2.0, 16);
    backHubGeo.rotateX(Math.PI / 2);
    const backHub = new THREE.Mesh(backHubGeo, structuralMat);
    backHub.position.set(0, 0, -1.0);
    this.elevationGroup.add(backHub);

    // Parabolic Reflector Geometry: z(r) = r^2 / (4 * f)
    // Radius R = 9.0, focal length f = 5.5 => depth = 9^2 / (4 * 5.5) = 3.68
    const f = 5.5;
    const dishRadius = 8.8;
    const radialSegments = 40;
    const ringSegments = 18;

    const dishPoints: THREE.Vector2[] = [];
    for (let i = 0; i <= ringSegments; i++) {
      const r = (i / ringSegments) * dishRadius;
      const depth = (r * r) / (4 * f);
      // Create lathe profile: (x, y) where x is radius, y is axial depth along Z
      dishPoints.push(new THREE.Vector2(r, depth));
    }

    const dishLatheGeo = new THREE.LatheGeometry(dishPoints, radialSegments);
    // Orient lathe so axis points forward (+Z)
    dishLatheGeo.rotateX(-Math.PI / 2);

    this.dishMesh = new THREE.Mesh(dishLatheGeo, dishMat);
    this.dishMesh.position.set(0, 0, 0);
    this.elevationGroup.add(this.dishMesh);

    // Concentric panel seam rings on the dish face
    const seamGroup = new THREE.Group();
    for (let s = 1; s <= 4; s++) {
      const seamR = (s / 4.5) * dishRadius;
      const seamZ = (seamR * seamR) / (4 * f);
      const seamGeo = new THREE.RingGeometry(seamR - 0.02, seamR + 0.02, 64);
      const seamMesh = new THREE.Mesh(
        seamGeo,
        new THREE.MeshBasicMaterial({
          color: 0x3d5469,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
        })
      );
      seamMesh.position.set(0, 0, seamZ + 0.02);
      seamGroup.add(seamMesh);
    }
    this.elevationGroup.add(seamGroup);

    // Outer perimeter rim girder
    const rimGeo = new THREE.TorusGeometry(dishRadius, 0.18, 8, 48);
    const maxDepth = (dishRadius * dishRadius) / (4 * f);
    const rimMesh = new THREE.Mesh(rimGeo, structuralMat);
    rimMesh.position.set(0, 0, maxDepth);
    this.elevationGroup.add(rimMesh);

    // 4. Quadripod Feed Support Struts & Prime Focus Horn
    // Strut attachment points near rim: 4 points at 45, 135, 225, 315 deg
    const feedFocusZ = f + 0.5; // Focal point
    const feedCanisterGeo = new THREE.CylinderGeometry(0.7, 0.9, 1.4, 16);
    feedCanisterGeo.rotateX(Math.PI / 2);
    const feedCanister = new THREE.Mesh(feedCanisterGeo, metalStrutMat);
    feedCanister.position.set(0, 0, feedFocusZ);
    this.elevationGroup.add(feedCanister);

    // Sub-reflector apex cone
    const apexGeo = new THREE.ConeGeometry(0.65, 0.8, 16);
    apexGeo.rotateX(-Math.PI / 2);
    const apexMesh = new THREE.Mesh(apexGeo, darkAccentMat);
    apexMesh.position.set(0, 0, feedFocusZ - 0.7);
    this.elevationGroup.add(apexMesh);

    // 4 Quadripod legs connecting rim to feed canister
    const strutAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    strutAngles.forEach((ang) => {
      const rx = Math.cos(ang) * (dishRadius * 0.88);
      const ry = Math.sin(ang) * (dishRadius * 0.88);
      const rz = (dishRadius * 0.88 * (dishRadius * 0.88)) / (4 * f);

      const start = new THREE.Vector3(rx, ry, rz);
      const end = new THREE.Vector3(0, 0, feedFocusZ);
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();

      const strutLegGeo = new THREE.CylinderGeometry(0.08, 0.12, len, 8);
      strutLegGeo.rotateX(Math.PI / 2);
      const strutLeg = new THREE.Mesh(strutLegGeo, metalStrutMat);

      strutLeg.position.copy(start).addScaledVector(dir, 0.5);
      strutLeg.lookAt(end);
      this.elevationGroup.add(strutLeg);
    });

    this.group.add(this.elevationGroup);

    // 5. Ground Plane & Distant Soft Horizon
    const groundGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080e14,
      roughness: 0.95,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = 0;
    this.group.add(groundMesh);

    // Distant mountain/horizon silhouette billboard
    const horizonGeo = new THREE.PlaneGeometry(240, 32);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x070c12,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    this.horizonMesh.position.set(0, 10, -90);
    this.group.add(this.horizonMesh);

    // Subtle atmospheric haze plane along horizon
    const hazeGeo = new THREE.PlaneGeometry(260, 48);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0x172b3c,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
    this.hazeMesh.position.set(0, 18, -85);
    this.group.add(this.hazeMesh);
  }

  /**
   * Update telescope orientation based on scroll progress and time
   * As scroll progresses (0.0 -> 0.22), the dish elevates upward to scan the sky
   */
  public update(progress: number, time: number) {
    // Telescope rests during 0.0 - 0.04, then tilts up towards zenith between 0.04 - 0.22
    const tiltProg = THREE.MathUtils.smoothstep(progress, 0.04, 0.22);

    // Base elevation: -0.65 radians (~37 deg) -> -1.25 radians (~72 deg zenith pointing)
    const baseElevation = -0.65 - tiltProg * 0.6;
    // Tiny micro-vibration / settling oscillation
    const microSway = Math.sin(time * 0.4) * 0.003 * (1 - tiltProg);
    this.elevationGroup.rotation.x = baseElevation + microSway;

    // Very slight azimuth tracking drift
    this.elevationGroup.rotation.y = Math.sin(time * 0.25) * 0.015;

    // As camera moves past the observatory (prog > 0.25), dim the observatory into deep background
    const fadeOut = 1 - THREE.MathUtils.smoothstep(progress, 0.28, 0.48);
    this.group.position.y = -6 - (1 - fadeOut) * 8;
  }

  public getFeedWorldPosition(target: THREE.Vector3): THREE.Vector3 {
    return target.setFromMatrixPosition(this.elevationGroup.matrixWorld);
  }
}

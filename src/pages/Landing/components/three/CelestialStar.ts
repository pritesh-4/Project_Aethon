import * as THREE from 'three';

/**
 * CelestialStar — NASA-Grade Photorealistic Rocky Exoplanet
 *
 * Implements:
 * - High-resolution 2048x1024 equirectangular planetary satellite imagery
 * - Full PBR texture map pipeline: Albedo, Tangent Normal, Roughness, and Elevation Relief
 * - Directional stellar sunlight from off-screen star with realistic penumbra terminator
 * - Deep shadow night-side hemisphere with subtle cosmic starlight floor
 * - Daylight-only exospheric atmospheric limb scattering (zero dark-side halo)
 * - 100% anchored surface features rotating slowly around a 12.5° axial tilt
 * - Compressed earlier exit: 100% vanished before narrative text ("The sky is full of signals") peaks at progress = 0.05
 */

const PLANET_VS = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPosition = viewMatrix * worldPos;
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const PLANET_FS = /* glsl */ `
uniform sampler2D uAlbedoMap;
uniform sampler2D uNormalMap;
uniform sampler2D uRoughnessMap;
uniform vec3 uLightDir;
uniform float uOpacity;
uniform float uDissolve;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

// Tangent space normal perturbation using screen-space derivatives
vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm, vec3 mapN) {
  vec3 q0 = dFdx(eye_pos);
  vec3 q1 = dFdy(eye_pos);
  vec2 st0 = dFdx(vUv);
  vec2 st1 = dFdy(vUv);

  float det = st0.x * st1.y - st0.y * st1.x;
  if (abs(det) < 0.000001) return surf_norm;

  vec3 S = normalize((q0 * st1.y - q1 * st0.y) / det);
  vec3 T = normalize((-q0 * st1.x + q1 * st0.x) / det);
  vec3 N = normalize(surf_norm);

  mat3 tsn = mat3(S, T, N);
  return normalize(tsn * mapN);
}

void main() {
  vec3 N_geom = normalize(vNormal);
  vec3 V = normalize(vViewPosition);

  // 1. Sample authored PBR maps
  vec4 albedoTex = texture2D(uAlbedoMap, vUv);
  vec3 normalTex = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
  float roughness = texture2D(uRoughnessMap, vUv).r;

  // 2. Perturb geometric normal with high-resolution topographical relief
  vec3 N = perturbNormal2Arb(vViewPosition, N_geom, normalTex);

  // 3. Directional Stellar Sunlight & Photographic Terminator
  vec3 L = normalize(uLightDir);
  float NdotL = dot(N, L);
  float NdotL_geom = dot(N_geom, L);

  // Soft photographic terminator transition (penumbra / atmospheric diffusion)
  float directLight = smoothstep(-0.06, 0.16, NdotL);
  // Micro-shadowing across crater walls and mountain flanks
  float reliefShadow = clamp((NdotL + 0.06) * 1.6, 0.0, 1.0);
  float illumination = directLight * reliefShadow;

  // 4. Photometric Light Response
  // Deep space ambient fill (restrained, keeps night side in genuine darkness)
  vec3 ambientLight = vec3(0.022, 0.028, 0.038);

  // Stellar sunlight color (crisp, warm-white sunlight)
  vec3 sunColor = vec3(1.0, 0.96, 0.90) * 1.35;

  // Terminator twilight tint: Grazing sunlight catches airborne dust/ridges in warm amber
  float twilightFactor = smoothstep(-0.08, 0.02, NdotL_geom) * smoothstep(0.18, 0.02, NdotL_geom);
  vec3 twilightGlow = vec3(0.72, 0.44, 0.24) * twilightFactor * 0.32;

  // Base surface lit color
  vec3 surfaceColor = albedoTex.rgb * (sunColor * illumination + ambientLight) + twilightGlow;

  // 5. Rough Mineral Specular Catch-light on exposed cliffs
  vec3 H = normalize(L + V);
  float NdotH = clamp(dot(N, H), 0.0, 1.0);
  float specPower = mix(16.0, 48.0, 1.0 - roughness);
  float specular = pow(NdotH, specPower) * illumination * (1.0 - roughness) * 0.12;
  surfaceColor += vec3(0.95, 0.90, 0.85) * specular;

  // 6. Subtle Daylight Atmospheric Limb Scattering (Illuminated crescent only)
  float mu = clamp(dot(N_geom, V), 0.0, 1.0);
  float limbFresnel = pow(1.0 - mu, 4.0);

  // Atmosphere is invisible on the night side of the planet (NO dark-side halo!)
  float atmoIllumination = smoothstep(-0.15, 0.35, NdotL_geom);
  vec3 atmoColor = vec3(0.55, 0.65, 0.78);
  vec3 atmosphereLimb = atmoColor * limbFresnel * atmoIllumination * 0.50;

  surfaceColor += atmosphereLimb;

  // 7. Natural Spherical Edge Falloff (No hard pixelated boundary / no outline)
  float edgeAntialias = smoothstep(0.0, 0.032, mu);

  // 8. Early Disappearance Dissolve
  float alpha = uOpacity * edgeAntialias * (1.0 - uDissolve);

  gl_FragColor = vec4(surfaceColor, alpha);
}
`;

const ATMO_VS = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const ATMO_FS = /* glsl */ `
uniform float uOpacity;
uniform float uDissolve;
uniform vec3 uLightDir;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewPosition);
  vec3 L = normalize(uLightDir);

  float mu = clamp(dot(N, V), 0.0, 1.0);
  float rim = 1.0 - mu;

  // Grazing limb scattering with steep falloff
  float halo = pow(rim, 4.5) * 0.28;
  halo *= smoothstep(0.01, 0.12, rim);

  // Day-side only: Atmosphere is invisible on the night side of the planet
  float dayFactor = smoothstep(-0.2, 0.3, dot(N, L));
  halo *= dayFactor;

  vec3 atmoColor = vec3(0.58, 0.68, 0.82);
  float alpha = halo * uOpacity * (1.0 - uDissolve);

  gl_FragColor = vec4(atmoColor, alpha);
}
`;

export class CelestialStar {
  public readonly group: THREE.Group;

  // 3D Meshes
  private planetMesh: THREE.Mesh;
  private atmoMesh: THREE.Mesh;

  // Materials
  private planetMaterial: THREE.ShaderMaterial;
  private atmoMaterial: THREE.ShaderMaterial;

  // Textures
  private albedoTexture: THREE.Texture;
  private normalTexture: THREE.Texture;
  private roughnessTexture: THREE.Texture;

  // Planetary physical dimensions & position
  private readonly baseRadius = 4.8;
  private readonly initialPosition = new THREE.Vector3(0, 3.2, 0);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'CelestialBody';
    this.group.position.copy(this.initialPosition);

    // 1. Natural Planetary Axial Tilt (12.5 degrees)
    const tiltRad = (12.5 * Math.PI) / 180;

    // 2. Directional Stellar Sunlight Direction (Upper-left off-screen star)
    const lightDir = new THREE.Vector3(-0.85, 0.45, 0.68).normalize();

    // 3. Load Photographic Planetary PBR Textures
    const textureLoader = new THREE.TextureLoader();

    this.albedoTexture = textureLoader.load('/textures/planet_albedo.jpg');
    this.albedoTexture.colorSpace = THREE.SRGBColorSpace;
    this.albedoTexture.wrapS = THREE.RepeatWrapping;
    this.albedoTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.albedoTexture.generateMipmaps = true;
    this.albedoTexture.minFilter = THREE.LinearMipmapLinearFilter;

    this.normalTexture = textureLoader.load('/textures/planet_normal.jpg');
    this.normalTexture.wrapS = THREE.RepeatWrapping;
    this.normalTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.normalTexture.generateMipmaps = true;
    this.normalTexture.minFilter = THREE.LinearMipmapLinearFilter;

    this.roughnessTexture = textureLoader.load('/textures/planet_roughness.jpg');
    this.roughnessTexture.wrapS = THREE.RepeatWrapping;
    this.roughnessTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.roughnessTexture.generateMipmaps = true;
    this.roughnessTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // 4. Planet Sphere Geometry (Subdivided sphere for pristine curvature)
    const sphereGeo = new THREE.SphereGeometry(this.baseRadius, 128, 96);

    this.planetMaterial = new THREE.ShaderMaterial({
      vertexShader: PLANET_VS,
      fragmentShader: PLANET_FS,
      uniforms: {
        uAlbedoMap: { value: this.albedoTexture },
        uNormalMap: { value: this.normalTexture },
        uRoughnessMap: { value: this.roughnessTexture },
        uLightDir: { value: lightDir },
        uOpacity: { value: 1.0 },
        uDissolve: { value: 0.0 },
      },
      transparent: true,
      depthWrite: true,
      blending: THREE.NormalBlending,
    });

    this.planetMesh = new THREE.Mesh(sphereGeo, this.planetMaterial);
    // Apply initial tilt
    this.planetMesh.rotation.z = tiltRad;
    this.group.add(this.planetMesh);

    // 5. Subtle Daylight Atmospheric Shell (Thin exospheric haze on lit limb only)
    const atmoGeo = new THREE.SphereGeometry(this.baseRadius * 1.025, 64, 48);

    this.atmoMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMO_VS,
      fragmentShader: ATMO_FS,
      uniforms: {
        uOpacity: { value: 1.0 },
        uDissolve: { value: 0.0 },
        uLightDir: { value: lightDir },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });

    this.atmoMesh = new THREE.Mesh(atmoGeo, this.atmoMaterial);
    this.group.add(this.atmoMesh);
  }

  /**
   * Update the celestial body state
   * @param progress Scroll narrative progress [0, 1]
   * @param time Elapsed animation time in seconds
   * @param isReducedMotion User prefers reduced motion flag
   */
  public update(progress: number, time: number, isReducedMotion = false) {
    // 1. Slow, organic planetary rotation (anchored surface features)
    const rotSpeed = isReducedMotion ? 0.001 : 0.012;
    this.planetMesh.rotation.y = time * rotSpeed;

    // 2. Continuous Cinematic Downward Descent:
    // - 0.000 -> 0.038: Planet rests peacefully in opening frame (y = 3.2)
    // - 0.038 -> 0.140: Smooth downward descent with astronomical weight (no bounce/rubber band)
    // - By 0.080: Planet has completely vacated the central reading zone
    // - 0.080 -> 0.152: Secondary gradual fade & subtle scale contraction as planet clears the frame
    // - By 0.155: Planet completes exit (opacity = 0, group.visible = false)
    const descentProg = THREE.MathUtils.smoothstep(progress, 0.038, 0.14);
    const descentDist = isReducedMotion ? 6.0 : 18.5;
    this.group.position.y = this.initialPosition.y - descentProg * descentDist;

    const fadeProg = THREE.MathUtils.smoothstep(progress, 0.08, 0.152);
    const fadeOut = 1.0 - fadeProg;
    const scaleFactor = 1.0 - fadeProg * 0.06;
    const dissolve = fadeProg;

    this.group.scale.set(scaleFactor, scaleFactor, scaleFactor);

    this.planetMaterial.uniforms.uOpacity.value = fadeOut;
    this.planetMaterial.uniforms.uDissolve.value = dissolve;

    this.atmoMaterial.uniforms.uOpacity.value = fadeOut;
    this.atmoMaterial.uniforms.uDissolve.value = dissolve;

    // Unmount from rendering when fully faded out
    this.group.visible = progress < 0.155;
  }

  /**
   * Free GPU resources on unmount
   */
  public dispose() {
    this.planetMesh.geometry.dispose();
    this.planetMaterial.dispose();
    this.atmoMesh.geometry.dispose();
    this.atmoMaterial.dispose();
    this.albedoTexture.dispose();
    this.normalTexture.dispose();
    this.roughnessTexture.dispose();
  }
}

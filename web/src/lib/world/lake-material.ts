import { Matrix4, ShaderMaterial, UniformsLib, UniformsUtils, type IUniform, type Texture } from "three";

import { LAKE_COLORS, WATER } from "./constants";
import { glslFloat, linearVec3, vec3Literal } from "./glsl";
import { SUN_UNIT } from "./sky";

/**
 * The water.
 *
 * What makes a lake read as water is what it reflects, and how much: straight down it
 * shows its own dark body and the bank through the shallows; toward a grazing angle it
 * turns into a mirror of the far shore and the sky. This material does that physically -
 * Schlick's Fresnel with water's F0 of 0.02 - over a ripple field computed in the shader
 * from gradient noise, so no texture repeats across it. The reflection is the planar pass
 * drawn by `LakeReflection`; where that pass is off (the river, or a weak device) the
 * surface reflects a model of the sky instead. See design.md D4 of elevate-world-realism.
 *
 * Vertex attributes: `depth` (0 at the bank .. 1 in open water), `foam` (0 .. 1, blends to
 * the vertex colour - the white water on the falls).
 */

export interface LakeUniforms {
  [name: string]: IUniform;
  uTime: IUniform<number>;
  uReflection: IUniform<Texture | null>;
  uReflectionMatrix: IUniform<Matrix4>;
  /** 1 while the planar pass is drawing, 0 to reflect the sky model alone. */
  uReflectionWeight: IUniform<number>;
}

const VERTEX_SHADER = /* glsl */ `
  attribute float depth;
  attribute float foam;

  uniform mat4 uReflectionMatrix;

  varying vec3 vWorldPosition;
  varying vec4 vReflectCoord;
  varying float vDepth;
  varying float vFoam;
  varying vec3 vTint;

  #include <fog_pars_vertex>

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vReflectCoord = uReflectionMatrix * worldPosition;
    vDepth = depth;
    vFoam = foam;
    vTint = color;

    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

/** Gradient noise with analytic derivatives (Inigo Quilez): returns value, d/dx, d/dy. */
const NOISE_GLSL = /* glsl */ `
  vec2 waterHash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  vec3 noised(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);

    vec2 ga = waterHash(i);
    vec2 gb = waterHash(i + vec2(1.0, 0.0));
    vec2 gc = waterHash(i + vec2(0.0, 1.0));
    vec2 gd = waterHash(i + vec2(1.0, 1.0));

    float va = dot(ga, f);
    float vb = dot(gb, f - vec2(1.0, 0.0));
    float vc = dot(gc, f - vec2(0.0, 1.0));
    float vd = dot(gd, f - vec2(1.0, 1.0));

    float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * (va - vb - vc + vd);
    vec2 derivative = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd)
      + du * (u.yx * (va - vb - vc + vd) + vec2(vb, vc) - va);
    return vec3(value, derivative);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uReflection;
  uniform float uReflectionWeight;

  varying vec3 vWorldPosition;
  varying vec4 vReflectCoord;
  varying float vDepth;
  varying float vFoam;
  varying vec3 vTint;

  #include <fog_pars_fragment>

  ${NOISE_GLSL}

  const vec3 SUN = ${vec3Literal(SUN_UNIT.x, SUN_UNIT.y, SUN_UNIT.z)};

  // The slope of the water surface: five octaves of drifting gradient noise, each turned
  // against the last so no direction repeats. The fine octaves fade with distance, or far
  // water sparkles with detail smaller than a pixel.
  vec2 rippleSlope(vec2 p, float distanceToEye) {
    vec2 slope = vec2(0.0);
    float amplitude = 1.0;
    float frequency = ${glslFloat(WATER.rippleFrequency)};
    mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
    float detail = 1.0 - smoothstep(${glslFloat(WATER.detailNear)}, ${glslFloat(WATER.detailFar)}, distanceToEye);
    for (int octave = 0; octave < 5; octave++) {
      float drift = uTime * ${glslFloat(WATER.driftSpeed)} * (1.0 + 0.35 * float(octave));
      vec3 n = noised(p * frequency + vec2(drift, drift * 0.63));
      float fade = octave < 2 ? 1.0 : detail;
      slope += n.yz * frequency * amplitude * fade;
      p = turn * p;
      amplitude *= 0.5;
      frequency *= 2.07;
    }
    // Wind lays calm patches and ruffled ones across a lake; one strength everywhere reads
    // as a texture.
    float gust = 0.45 + 0.9 * smoothstep(-0.35, 0.45, noised(vWorldPosition.xz * 0.012 + uTime * 0.01).x);
    return slope * gust;
  }

  // The sky a ripple reflects when the planar pass is not drawing.
  vec3 skyModel(vec3 direction) {
    vec3 zenith = ${linearVec3(LAKE_COLORS.zenith)};
    #ifdef USE_FOG
      vec3 horizon = aerialColor(direction);
    #else
      vec3 horizon = ${linearVec3(LAKE_COLORS.horizon)};
    #endif
    return mix(horizon, zenith, smoothstep(0.02, 0.5, direction.y));
  }

  void main() {
    vec3 toEye = cameraPosition - vWorldPosition;
    float distanceToEye = length(toEye);
    vec3 V = toEye / distanceToEye;

    vec2 slope = rippleSlope(vWorldPosition.xz, distanceToEye) * ${glslFloat(WATER.rippleHeight)};
    vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));

    // Schlick's approximation, with water's own reflectance at normal incidence.
    float cosine = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - cosine, 5.0);

    vec3 R = reflect(-V, N);
    vec3 reflection = skyModel(normalize(vec3(R.x, max(R.y, 0.0), R.z)));
    #ifdef PLANAR_REFLECTION
      vec2 reflectUv = vReflectCoord.xy / vReflectCoord.w + N.xz * ${glslFloat(WATER.distortion)};
      vec3 planar = texture2D(uReflection, reflectUv).rgb;
      reflection = mix(reflection, planar, uReflectionWeight);
    #endif

    // The body of the water: the bank shows through the shallows, then the colour deepens.
    vec3 body = mix(${linearVec3(LAKE_COLORS.bed)}, ${linearVec3(LAKE_COLORS.shallow)}, smoothstep(0.0, 0.18, vDepth));
    body = mix(body, ${linearVec3(LAKE_COLORS.deep)}, smoothstep(0.15, 0.8, vDepth));

    vec3 color = mix(body, reflection, fresnel);

    // The sun's glitter path: a hard highlight off every ripple facing it.
    float glint = pow(max(dot(R, SUN), 0.0), ${glslFloat(WATER.glitterSharpness)});
    color += ${linearVec3(LAKE_COLORS.glitter)} * glint * ${glslFloat(WATER.glitterStrength)};

    color = mix(color, vTint, vFoam);
    gl_FragColor = vec4(color, 1.0);

    #include <fog_fragment>
  }
`;

interface LakeMaterialOptions {
  /** Whether this surface samples the planar reflection pass - the lake does, the river cannot. */
  readonly planar: boolean;
}

/** A water material and its uniforms, typed, for the reflection pass that drives them. */
export interface LakeMaterial {
  readonly material: ShaderMaterial;
  readonly uniforms: LakeUniforms;
}

export function createLakeMaterial(time: IUniform<number>, options: LakeMaterialOptions): LakeMaterial {
  // The shared clock goes in as the same object the scene advances, not a copy.
  const uniforms: LakeUniforms = {
    ...UniformsUtils.clone(UniformsLib.fog),
    uTime: time,
    uReflection: { value: null },
    uReflectionMatrix: { value: new Matrix4() },
    uReflectionWeight: { value: 0 },
  };

  const material = new ShaderMaterial({
    name: options.planar ? "SaltopiaLake" : "SaltopiaRiver",
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    defines: options.planar ? { PLANAR_REFLECTION: "" } : {},
    vertexColors: true,
    fog: true,
  });

  return { material, uniforms };
}

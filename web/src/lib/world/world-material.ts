import { MeshStandardMaterial, type IUniform, type Texture } from "three";

import { SURFACE_FINISH, WORLD_COLORS } from "./constants";
import { glslFloat, linearVec3, vec3Literal } from "./glsl";
import { SUN_UNIT } from "./sky";
import { ATLAS_TILES_PER_SIDE, SURFACE } from "./textures";

/**
 * The material every textured mesh in the neighbourhood shares.
 *
 * A standard PBR material with the atlas as its map, extended so that each vertex picks
 * its own tile through the `surface` attribute and repeats within it. Water tiles
 * scroll with time, which is what makes the river read as flowing.
 *
 * The surface also sets the finish: glass is smooth and mirrors the sky, metal is
 * metallic, tile has a sheen, plaster and foliage are matt - one roughness for a whole
 * town made every window a dull grey panel. At golden hour a share of the windows is lit
 * from inside. See design.md D7 of elevate-world-realism.
 *
 * One material for everything is what keeps instancing and a single draw call per
 * model, while still letting a barn have plank walls and a tile roof.
 */

interface WorldMaterialOptions {
  readonly flatShading: boolean;
  /** Shared clock, advanced by the scene each frame. Defaults to WORLD_CLOCK. */
  readonly time?: IUniform<number>;
}

/**
 * The clock every water surface scrolls by. One canvas, one clock: a module-level
 * uniform that the scene advances each frame, rather than a value threaded through
 * React state that must never be mutated.
 */
export const WORLD_CLOCK: IUniform<number> = { value: 0 };

const TILE_FRACTION = glslFloat(1 / ATLAS_TILES_PER_SIDE);

function isSurface(name: keyof typeof SURFACE): string {
  return `(abs(vSurface - ${glslFloat(SURFACE[name])}) < 0.5)`;
}

/** Value noise in 3D, for the leaves: foliage is shaded in world space, not from the atlas. */
const LEAF_NOISE = /* glsl */ `
float leafHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float leafNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(leafHash(i), leafHash(i + vec3(1, 0, 0)), f.x), mix(leafHash(i + vec3(0, 1, 0)), leafHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(leafHash(i + vec3(0, 0, 1)), leafHash(i + vec3(1, 0, 1)), f.x), mix(leafHash(i + vec3(0, 1, 1)), leafHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
`;

/**
 * Replaces three's map sampling with atlas-tile sampling - except for foliage, which the
 * atlas's tile of round leaves turned into a pattern of bricks across every crown. Leaves
 * take a world-space noise instead: clumps of light and shade that do not repeat.
 */
const MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
if (${isSurface("foliage")}) {
  float leaves = leafNoise(vWorldSurfacePosition * ${glslFloat(SURFACE_FINISH.leafScale)}) * 0.6
    + leafNoise(vWorldSurfacePosition * ${glslFloat(SURFACE_FINISH.leafScale * 2.7)}) * 0.4;
  diffuseColor.rgb *= 0.72 + 0.42 * leaves;
} else {
  float tileIndex = floor(vSurface + 0.5);
  vec2 tileOrigin = vec2(mod(tileIndex, ${ATLAS_TILES_PER_SIDE}.0), floor(tileIndex / ${ATLAS_TILES_PER_SIDE}.0)) * ${TILE_FRACTION};
  vec2 scrolled = vMapUv;
  if (tileIndex == ${SURFACE.water}.0) {
    scrolled.y -= uTime * 0.12;
  }
  // Inset slightly so mip levels never bleed a neighbouring tile across the seam.
  vec2 tileUv = fract(scrolled) * 0.96 + 0.02;
  vec4 sampledDiffuseColor = texture2D(map, tileOrigin + tileUv * ${TILE_FRACTION});
  diffuseColor *= sampledDiffuseColor;
}
#endif
`;

const ROUGHNESS_FRAGMENT = /* glsl */ `
#include <roughnessmap_fragment>
if (${isSurface("glass")}) roughnessFactor = ${glslFloat(SURFACE_FINISH.glassRoughness)};
else if (${isSurface("water")}) roughnessFactor = ${glslFloat(SURFACE_FINISH.waterRoughness)};
else if (${isSurface("metal")}) roughnessFactor = ${glslFloat(SURFACE_FINISH.metalRoughness)};
else if (${isSurface("tiles")} || ${isSurface("slate")}) roughnessFactor = ${glslFloat(SURFACE_FINISH.tileRoughness)};
`;

const METALNESS_FRAGMENT = /* glsl */ `
#include <metalnessmap_fragment>
if (${isSurface("metal")}) metalnessFactor = ${glslFloat(SURFACE_FINISH.metalMetalness)};
`;

// A window lit from inside: one hash per window-sized cell of the world, so each house has
// a few lit and a few dark, and the pattern does not repeat from house to house. Leaves
// seen against a low sun glow at their edges, where the light comes through them.
const EMISSIVE_FRAGMENT = /* glsl */ `
#include <emissivemap_fragment>
if (${isSurface("foliage")}) {
  vec3 toEye = normalize(vViewPosition);
  vec3 sunView = normalize((viewMatrix * vec4(${vec3Literal(SUN_UNIT.x, SUN_UNIT.y, SUN_UNIT.z)}, 0.0)).xyz);
  float against = pow(max(dot(-toEye, sunView), 0.0), 5.0);
  float edge = 1.0 - abs(dot(normal, toEye));
  totalEmissiveRadiance += diffuseColor.rgb * ${linearVec3(WORLD_COLORS.sunlight)} * against * edge * ${glslFloat(SURFACE_FINISH.leafTransmission)};
}
if (${isSurface("glass")}) {
  vec3 cell = floor(vWorldSurfacePosition * ${glslFloat(SURFACE_FINISH.windowCell)});
  float lit = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  totalEmissiveRadiance += ${linearVec3(WORLD_COLORS.windowLight)} * ${glslFloat(SURFACE_FINISH.windowGlow)} * step(1.0 - ${glslFloat(SURFACE_FINISH.litShare)}, lit);
}
`;

export function createWorldMaterial(atlas: Texture, options: WorldMaterialOptions): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    map: atlas,
    vertexColors: true,
    flatShading: options.flatShading,
    roughness: 0.94,
    metalness: 0,
  });

  const time = options.time ?? WORLD_CLOCK;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float surface;\nvarying float vSurface;\nvarying vec3 vWorldSurfacePosition;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvSurface = surface;")
      .replace(
        "#include <worldpos_vertex>",
        // Computed here rather than read from three's `worldPosition`, which exists only
        // when shadows or an environment are on.
        `#include <worldpos_vertex>
        vec4 surfaceWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          surfaceWorld = instanceMatrix * surfaceWorld;
        #endif
        vWorldSurfacePosition = (modelMatrix * surfaceWorld).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nvarying float vSurface;\nvarying vec3 vWorldSurfacePosition;\n${LEAF_NOISE}`)
      .replace("#include <map_fragment>", MAP_FRAGMENT)
      .replace("#include <roughnessmap_fragment>", ROUGHNESS_FRAGMENT)
      .replace("#include <metalnessmap_fragment>", METALNESS_FRAGMENT)
      .replace("#include <emissivemap_fragment>", EMISSIVE_FRAGMENT);
  };

  // Materials that patch their shader must announce it, or three reuses a program
  // compiled for a plain MeshStandardMaterial.
  material.customProgramCacheKey = () => `saltopia-atlas-${options.flatShading ? "flat" : "smooth"}`;

  return material;
}

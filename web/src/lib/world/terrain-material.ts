import { MeshStandardMaterial, type Texture } from "three";

import { LAKE, TERRAIN_SHADING, WORLD_COLORS } from "./constants";
import { glslFloat, linearVec3 } from "./glsl";

/**
 * The terrain's material: vertex colours for the fields, the grass texture in world space
 * at two scales, earth on the steep banks, and the waterline drawn per pixel.
 *
 * This is a river, not a beach: the grass runs down to the water and the bank is a strip
 * of wet earth, not sand. It is shaded per pixel because at one vertex every 2.4 units a
 * strip this narrow came out as a sawtooth along every diagonal stretch of shore. The
 * shader gets the ground height and the signed distance to the water interpolated
 * instead, so the line is as smooth as the slope.
 *
 * The grass is sampled in world space rather than through the mesh's UVs, so the terrain
 * and the far land beyond it - which has no UVs - share one texture without a seam, and at
 * two scales under a slow brightness noise so the tile never repeats at the hub's distance.
 */

/** How far above the water the wet bank reaches, and how far it fades below it. */
const BANK = {
  top: 0.55,
  wet: -0.5,
  /** No bank at all this far from the water, whatever the height says. */
  farthest: 12,
} as const;

const VERTEX_PARS = /* glsl */ `
attribute float shore;
varying float vShore;
varying float vGroundY;
varying vec2 vGroundXZ;
varying vec3 vGroundNormal;
`;

const VERTEX_MAIN = /* glsl */ `
vShore = shore;
vGroundY = transformed.y;
vGroundXZ = (modelMatrix * vec4(transformed, 1.0)).xz;
vGroundNormal = normalize(mat3(modelMatrix) * objectNormal);
`;

const FRAGMENT_PARS = /* glsl */ `
varying float vShore;
varying float vGroundY;
varying vec2 vGroundXZ;
varying vec3 vGroundNormal;

float groundHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float groundNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(groundHash(i), groundHash(i + vec2(1.0, 0.0)), u.x), mix(groundHash(i + vec2(0.0, 1.0)), groundHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

const MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
{
  vec3 fine = texture2D(map, vGroundXZ / ${glslFloat(TERRAIN_SHADING.fineTile)}).rgb;
  vec3 broad = texture2D(map, vGroundXZ / ${glslFloat(TERRAIN_SHADING.broadTile)} + vec2(0.37, 0.61)).rgb;
  float macro = groundNoise(vGroundXZ / ${glslFloat(TERRAIN_SHADING.macroScale)}) * 0.6
    + groundNoise(vGroundXZ / ${glslFloat(TERRAIN_SHADING.macroScale * 0.37)}) * 0.4;
  diffuseColor.rgb *= fine * broad * 1.12 * (1.0 - ${glslFloat(TERRAIN_SHADING.macroAmount)} + 2.0 * ${glslFloat(TERRAIN_SHADING.macroAmount)} * macro);
}
#endif
`;

const FRAGMENT_GROUND = /* glsl */ `
{
  // Earth shows where the ground is too steep to hold grass: channel banks, cuttings.
  float steep = 1.0 - smoothstep(${glslFloat(TERRAIN_SHADING.steepFrom)}, ${glslFloat(TERRAIN_SHADING.steepTo)}, vGroundNormal.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, ${linearVec3(WORLD_COLORS.bankEarth)}, steep * 0.75);

  float above = vGroundY - ${glslFloat(LAKE.level)};
  float band = (1.0 - smoothstep(0.1, ${glslFloat(BANK.top)}, above)) * smoothstep(${glslFloat(BANK.wet)}, 0.05, above);
  band *= 1.0 - smoothstep(${glslFloat(BANK.farthest - 4)}, ${glslFloat(BANK.farthest)}, vShore);
  diffuseColor.rgb = mix(diffuseColor.rgb, ${linearVec3(WORLD_COLORS.wetBank)}, band * 0.55);
}
`;

export function createTerrainMaterial(grass: Texture): MeshStandardMaterial {
  // Smooth-shaded. Flat-shaded, every slope became a zig-zag of light and dark
  // triangles: a wall of facets along the channel bank, a ladder of pale rungs along
  // any road on an embankment. The buildings and trees keep their facets.
  const material = new MeshStandardMaterial({
    map: grass,
    vertexColors: true,
    flatShading: false,
    roughness: 1,
    metalness: 0,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_PARS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_MAIN}`);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_PARS}`)
      .replace("#include <map_fragment>", MAP_FRAGMENT)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_GROUND}`);
  };

  // A patched shader needs its own program, or three hands back one compiled for a
  // plain MeshStandardMaterial.
  material.customProgramCacheKey = () => "saltopia-terrain";

  return material;
}

import { Color, MeshStandardMaterial, type Texture } from "three";

import { LAKE, WORLD_COLORS } from "./constants";

/**
 * The terrain's material: vertex colours for grass, straw and lake bed, with the
 * waterline drawn in the fragment shader.
 *
 * This is a river, not a beach: the grass runs down to the water and the bank is a
 * strip of wet earth, not sand. It is shaded per pixel because at one vertex every 2.4
 * units a strip this narrow came out as a sawtooth along every diagonal stretch of
 * shore. The shader gets the ground height and the signed distance to the water
 * interpolated instead, so the line is as smooth as the slope.
 */

const WET_BANK = new Color(WORLD_COLORS.wetBank);

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
`;

const VERTEX_MAIN = /* glsl */ `
vShore = shore;
vGroundY = transformed.y;
`;

const FRAGMENT_PARS = /* glsl */ `
uniform vec3 uBank;
varying float vShore;
varying float vGroundY;
`;

const FRAGMENT_BEACH = /* glsl */ `
{
  float above = vGroundY - ${LAKE.level.toFixed(2)};
  float band = (1.0 - smoothstep(0.1, ${BANK.top.toFixed(2)}, above)) * smoothstep(${BANK.wet.toFixed(2)}, 0.05, above);
  band *= 1.0 - smoothstep(${(BANK.farthest - 4).toFixed(1)}, ${BANK.farthest.toFixed(1)}, vShore);
  diffuseColor.rgb = mix(diffuseColor.rgb, uBank, band * 0.55);
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
    shader.uniforms.uBank = { value: WET_BANK };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_PARS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_MAIN}`);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_PARS}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_BEACH}`);
  };

  // A patched shader needs its own program, or three hands back one compiled for a
  // plain MeshStandardMaterial.
  material.customProgramCacheKey = () => "saltopia-terrain";

  return material;
}

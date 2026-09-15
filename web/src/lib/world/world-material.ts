import { MeshStandardMaterial, type IUniform, type Texture } from "three";

import { ATLAS_TILES_PER_SIDE, SURFACE } from "./textures";

/**
 * The material every textured mesh in the neighbourhood shares.
 *
 * A standard PBR material with the atlas as its map, extended so that each vertex picks
 * its own tile through the `surface` attribute and repeats within it. Water tiles
 * scroll with time, which is what makes the river read as flowing.
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

const TILE_FRACTION = (1 / ATLAS_TILES_PER_SIDE).toFixed(4);

/** Replaces three's map sampling with atlas-tile sampling. */
const MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
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
#endif
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
      .replace("#include <common>", "#include <common>\nattribute float surface;\nvarying float vSurface;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvSurface = surface;");

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying float vSurface;")
      .replace("#include <map_fragment>", MAP_FRAGMENT);
  };

  // Materials that patch their shader must announce it, or three reuses a program
  // compiled for a plain MeshStandardMaterial.
  material.customProgramCacheKey = () => `serranopolis-atlas-${options.flatShading ? "flat" : "smooth"}`;

  return material;
}

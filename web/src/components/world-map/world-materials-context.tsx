"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo } from "react";
import type { MeshStandardMaterial, ShaderMaterial, Texture } from "three";

import { createLakeMaterial } from "@/lib/world/lake-material";
import { createAtlasTexture, createGrassTexture } from "@/lib/world/textures";
import { WORLD_CLOCK, createWorldMaterial } from "@/lib/world/world-material";

/**
 * The shared materials every textured mesh draws with, created once per canvas.
 *
 * Sharing them is what keeps the scene at one program and a handful of materials;
 * the clock they share is what makes every water surface scroll in step.
 */

export interface WorldMaterials {
  readonly atlas: Texture;
  readonly grass: Texture;
  readonly flat: MeshStandardMaterial;
  readonly smooth: MeshStandardMaterial;
  /** The lake and the river: reflection, glitter and ripples. */
  readonly lake: ShaderMaterial;
}

const WorldMaterialsContext = createContext<WorldMaterials | null>(null);

export function WorldMaterialsProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const materials = useMemo<WorldMaterials>(() => {
    const atlas = createAtlasTexture();
    return {
      atlas,
      grass: createGrassTexture(64),
      flat: createWorldMaterial(atlas, { flatShading: true }),
      smooth: createWorldMaterial(atlas, { flatShading: false }),
      lake: createLakeMaterial(atlas, WORLD_CLOCK),
    };
  }, []);

  useFrame((_, delta) => {
    WORLD_CLOCK.value += delta;
  });

  return <WorldMaterialsContext.Provider value={materials}>{children}</WorldMaterialsContext.Provider>;
}

export function useWorldMaterials(): WorldMaterials {
  const materials = useContext(WorldMaterialsContext);
  if (!materials) {
    throw new Error("useWorldMaterials must be used inside a WorldMaterialsProvider.");
  }
  return materials;
}

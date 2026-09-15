"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo } from "react";
import type { MeshStandardMaterial, Texture } from "three";

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
  readonly water: MeshStandardMaterial;
}

const WorldMaterialsContext = createContext<WorldMaterials | null>(null);

export function WorldMaterialsProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const materials = useMemo<WorldMaterials>(() => {
    const atlas = createAtlasTexture();

    const water = createWorldMaterial(atlas, { flatShading: false });
    water.transparent = true;
    water.opacity = 0.94;
    water.roughness = 0.32;
    water.metalness = 0.05;

    return {
      atlas,
      grass: createGrassTexture(64),
      flat: createWorldMaterial(atlas, { flatShading: true }),
      smooth: createWorldMaterial(atlas, { flatShading: false }),
      water,
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

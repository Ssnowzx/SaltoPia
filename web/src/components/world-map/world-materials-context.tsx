"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo } from "react";
import type { MeshStandardMaterial, Texture } from "three";

import { type LakeMaterial, createLakeMaterial } from "@/lib/world/lake-material";
import { createRoadMaterial } from "@/lib/world/road-material";
import { createAsphaltTexture, createEarthTexture } from "@/lib/world/road-textures";
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
  /** Every road surface: asphalt, paving, kerbs, earth, with the markings painted in. */
  readonly road: MeshStandardMaterial;
  /** The lake: planar reflection, glitter and ripples. */
  readonly lake: LakeMaterial;
  /** The river below the dam, which is not a plane and reflects the sky model alone. */
  readonly river: LakeMaterial;
}

const WorldMaterialsContext = createContext<WorldMaterials | null>(null);

interface WorldMaterialsProviderProps {
  readonly children: React.ReactNode;
  /** Holds the water still - world-appearance spec, ambient motion. */
  readonly reducedMotion: boolean;
}

export function WorldMaterialsProvider({ children, reducedMotion }: WorldMaterialsProviderProps): React.ReactElement {
  const materials = useMemo<WorldMaterials>(() => {
    const atlas = createAtlasTexture();
    const grass = createGrassTexture(64);
    return {
      atlas,
      grass,
      road: createRoadMaterial({ asphalt: createAsphaltTexture(), earth: createEarthTexture(), grass }),
      flat: createWorldMaterial(atlas, { flatShading: true }),
      smooth: createWorldMaterial(atlas, { flatShading: false }),
      lake: createLakeMaterial(WORLD_CLOCK, { planar: true }),
      river: createLakeMaterial(WORLD_CLOCK, { planar: false }),
    };
  }, []);

  useFrame((_, delta) => {
    if (!reducedMotion) WORLD_CLOCK.value += delta;
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

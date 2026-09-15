"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Euler, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from "three";

import { WORLD_COLORS } from "@/lib/world/constants";
import { createMountainsGeometry } from "@/lib/world/mountains";
import {
  LANDMARKS,
  MODEL_REGISTRY,
  MODEL_SHADING,
  type ModelKey,
  type Placement,
  createScatter,
  groundHeightFor,
} from "@/lib/world/neighborhood-layout";
import {
  createRailGeometry,
  createRiverGeometry,
  createRoadGeometry,
  createWaterfallFoamGeometry,
} from "@/lib/world/roads";
import { createTerrainGeometry } from "@/lib/world/terrain";

import { useWorldMaterials } from "./world-materials-context";

/**
 * Everything standing in the valley.
 *
 * Scenery is grouped by model and drawn with one InstancedMesh per group, so a forest
 * of hundreds of trees costs a handful of draw calls rather than hundreds - required by
 * the world-map spec.
 */

/** Builds the transform for one placement. */
function matrixFor(placement: Placement): Matrix4 {
  return new Matrix4().compose(
    new Vector3(placement.x, groundHeightFor(placement), placement.z),
    new Quaternion().setFromEuler(new Euler(0, placement.rotationY, 0)),
    new Vector3(placement.scale, placement.scale, placement.scale),
  );
}

interface InstancedGroupProps {
  readonly model: ModelKey;
  readonly placements: readonly Placement[];
}

/** One instanced batch: every copy of a single model, in a single draw call. */
function InstancedGroup({ model, placements }: InstancedGroupProps): React.ReactElement | null {
  const meshRef = useRef<InstancedMesh>(null);
  const materials = useWorldMaterials();
  const geometry = useMemo(() => {
    try {
      return MODEL_REGISTRY[model]();
    } catch (error) {
      // A model that fails to build must not blank the scene - world-map spec.
      console.error(`Failed to build model "${model}":`, error);
      return null;
    }
  }, [model]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    placements.forEach((placement, index) => {
      mesh.setMatrixAt(index, matrixFor(placement));
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  if (!geometry || placements.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, MODEL_SHADING[model] === "smooth" ? materials.smooth : materials.flat, placements.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

export function Neighborhood(): React.ReactElement {
  const materials = useWorldMaterials();

  const terrainGeometry = useMemo(() => createTerrainGeometry(), []);
  const terrainMaterial = useMemo(
    () => new MeshStandardMaterial({ map: materials.grass, vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }),
    [materials.grass],
  );
  const groundMaterial = useMemo(
    () => new MeshStandardMaterial({ color: WORLD_COLORS.straw, roughness: 1, metalness: 0 }),
    [],
  );

  const mountainsGeometry = useMemo(() => createMountainsGeometry(), []);
  const roadGeometry = useMemo(() => createRoadGeometry(), []);
  const railGeometry = useMemo(() => createRailGeometry(), []);
  const riverGeometry = useMemo(() => createRiverGeometry(), []);
  const foamGeometry = useMemo(() => createWaterfallFoamGeometry(), []);

  // Landmarks and scatter are placed the same way; grouping them together means a model
  // used by both still shares one batch.
  const groups = useMemo(() => {
    const all: readonly Placement[] = [...LANDMARKS, ...createScatter()];
    const byModel = new Map<ModelKey, Placement[]>();

    for (const placement of all) {
      const existing = byModel.get(placement.model);
      if (existing) {
        existing.push(placement);
      } else {
        byModel.set(placement.model, [placement]);
      }
    }

    return [...byModel.entries()];
  }, []);

  return (
    <group>
      {/* Distant ground under the terrain's edge, so the horizon is land dissolving into
          haze rather than a hard line with nothing beyond it. */}
      <mesh position={[0, -14, 0]} rotation={[-Math.PI / 2, 0, 0]} material={groundMaterial}>
        <planeGeometry args={[2400, 2400]} />
      </mesh>

      <mesh geometry={terrainGeometry} material={terrainMaterial} receiveShadow />
      <mesh geometry={mountainsGeometry} material={materials.flat} castShadow receiveShadow />
      <mesh geometry={roadGeometry} material={materials.flat} receiveShadow />
      <mesh geometry={railGeometry} material={materials.flat} receiveShadow />
      <mesh geometry={riverGeometry} material={materials.water} />
      <mesh geometry={foamGeometry} material={materials.smooth} />

      {groups.map(([model, placements]) => (
        <InstancedGroup key={model} model={model} placements={placements} />
      ))}
    </group>
  );
}

"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

import { WATER_LEVEL, WORLD_COLORS } from "@/lib/world/constants";
import {
  LANDMARKS,
  MODEL_REGISTRY,
  type ModelKey,
  type Placement,
  createScatter,
  groundHeightFor,
} from "@/lib/world/neighborhood-layout";
import { createRiverGeometry, createTerrainGeometry } from "@/lib/world/terrain";

/**
 * Everything standing in the valley.
 *
 * Scenery is grouped by model and drawn with one InstancedMesh per group, so a forest
 * of 250 trees costs a handful of draw calls rather than 250 - required by the
 * world-map spec.
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
      args={[geometry, undefined, placements.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </instancedMesh>
  );
}

export function Neighborhood(): React.ReactElement {
  const terrainGeometry = useMemo(() => createTerrainGeometry(), []);
  const riverGeometry = useMemo(() => createRiverGeometry(), []);

  // Landmarks and scatter are placed the same way; grouping them together means a model
  // used by both - a rock at a lookout, say - still shares one batch.
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
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
      </mesh>

      {/* The river, following its own course rather than flooding the valley. */}
      <mesh geometry={riverGeometry} position={[0, WATER_LEVEL, 0]}>
        <meshStandardMaterial
          color={WORLD_COLORS.water}
          roughness={0.25}
          metalness={0.1}
          transparent
          opacity={0.94}
        />
      </mesh>

      {groups.map(([model, placements]) => (
        <InstancedGroup key={model} model={model} placements={placements} />
      ))}
    </group>
  );
}

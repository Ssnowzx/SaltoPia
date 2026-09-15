"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { Euler, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from "three";

import { SKY_COLORS } from "@/lib/world/constants";
import { createHillsGeometry } from "@/lib/world/hills";
import {
  LANDMARKS,
  LAWNS,
  MODEL_REGISTRY,
  MODEL_SHADING,
  type ModelKey,
  type Placement,
  createScatter,
  groundHeightFor,
} from "@/lib/world/neighborhood-layout";
import {
  createLakeSurfaceGeometry,
  createLawnGeometry,
  createRiverGeometry,
  createRoadGeometry,
  createWaterfallFoamGeometry,
} from "@/lib/world/roads";
import { createTerrainGeometry } from "@/lib/world/terrain";

import { useWorldMaterials } from "./world-materials-context";

/**
 * Everything standing in the valley and floating on the lake.
 *
 * Scenery is grouped by model and drawn with one InstancedMesh per group, so a forest
 * of hundreds of trees costs a handful of draw calls rather than hundreds - required by
 * the world-map spec.
 */

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
  // The plane beyond the terrain's edge takes the haze colour, not a ground colour:
  // in straw it read as a slab of desert across the top of the frame.
  const groundMaterial = useMemo(
    () => new MeshStandardMaterial({ color: SKY_COLORS.haze, roughness: 1, metalness: 0, fog: true }),
    [],
  );

  const hillsGeometry = useMemo(() => createHillsGeometry(), []);
  const roadGeometry = useMemo(() => createRoadGeometry(), []);
  const lawnGeometry = useMemo(() => createLawnGeometry(LAWNS), []);
  const lakeGeometry = useMemo(() => createLakeSurfaceGeometry(), []);
  const riverGeometry = useMemo(() => createRiverGeometry(), []);
  const foamGeometry = useMemo(() => createWaterfallFoamGeometry(), []);

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
        <planeGeometry args={[3000, 3000]} />
      </mesh>

      <mesh geometry={terrainGeometry} material={terrainMaterial} receiveShadow />
      {/* The far hills are beyond any useful shadow frustum; asking them to receive
          shadow only invites the map's edge to show on them. */}
      <mesh geometry={hillsGeometry} material={materials.flat} />
      <mesh geometry={lawnGeometry} material={materials.flat} receiveShadow />
      {/*
        Roads take the smooth material, not the flat one. `flatShading` recomputes the
        normal per face in the shader and ignores the upright normals the road geometry
        carries, which striped every carriageway with its own quads.
      */}
      <mesh geometry={roadGeometry} material={materials.smooth} receiveShadow />
      <mesh geometry={lakeGeometry} material={materials.lake} />
      <mesh geometry={riverGeometry} material={materials.lake} />
      <mesh geometry={foamGeometry} material={materials.smooth} />

      {groups.map(([model, placements]) => (
        <InstancedGroup key={model} model={model} placements={placements} />
      ))}
    </group>
  );
}

"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { BufferGeometry, InstancedMesh } from "three";
import { Color, Euler, Matrix4, type Object3D, Quaternion, Vector3 } from "three";

import { REFLECTION, VEGETATION_TINT } from "@/lib/world/constants";

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
  createRiverGeometry,
  createRoadStructureGeometry,
  createWaterfallFoamGeometry,
} from "@/lib/world/roads";
import { createOuterLandGeometry } from "@/lib/world/outer-land";
import { roadSurfaceGeometry } from "@/lib/world/road-surfaces";
import { createTerrainGeometry, lakeDistance } from "@/lib/world/terrain";
import { createTerrainMaterial } from "@/lib/world/terrain-material";

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

/** The models that grow: each copy takes its own shade, so a wood is many greens. */
const VEGETATION: ReadonlySet<ModelKey> = new Set<ModelKey>(["araucaria", "araucariaB", "araucariaYoung", "conifer", "broadleaf", "broadleafWarm", "bush", "palm"]);

/**
 * A seeded shade for one tree: a little lighter or darker, a little warmer or cooler.
 * Read from its position, so the same tree is the same shade on every load.
 */
function vegetationTint(placement: Placement, target: Color): Color {
  const lightness = 1 + (hashUnit(placement.x * 12.9898 + placement.z * 78.233) - 0.5) * 2 * VEGETATION_TINT.lightness;
  const warmth = (hashUnit(placement.x * 39.3468 + placement.z * 11.135) - 0.5) * 2 * VEGETATION_TINT.warmth;
  return target.setRGB(lightness * (1 + warmth), lightness * (1 + warmth * 0.35), lightness * (1 - warmth));
}

function hashUnit(value: number): number {
  const s = Math.sin(value) * 43758.5453;
  return s - Math.floor(s);
}

interface InstancedGroupProps {
  readonly model: ModelKey;
  readonly placements: readonly Placement[];
  /** The layer the group draws on: the far woods sit where the lake's mirror cannot see. */
  readonly layer: number;
}

/**
 * One geometry per model, however many groups draw it - the woods near the lake and the
 * woods far from it are the same trees.
 */
const GEOMETRIES = new Map<ModelKey, BufferGeometry | null>();

function geometryFor(model: ModelKey): BufferGeometry | null {
  if (GEOMETRIES.has(model)) return GEOMETRIES.get(model) ?? null;
  let geometry: BufferGeometry | null = null;
  try {
    geometry = MODEL_REGISTRY[model]();
  } catch (error) {
    // A model that fails to build must not blank the scene - world-map spec.
    console.error(`Failed to build model "${model}":`, error);
  }
  GEOMETRIES.set(model, geometry);
  return geometry;
}

function InstancedGroup({ model, placements, layer }: InstancedGroupProps): React.ReactElement | null {
  const meshRef = useRef<InstancedMesh>(null);
  const materials = useWorldMaterials();
  const geometry = useMemo(() => geometryFor(model), [model]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const tint = new Color();
    placements.forEach((placement, index) => {
      mesh.setMatrixAt(index, matrixFor(placement));
      if (VEGETATION.has(model)) mesh.setColorAt(index, vegetationTint(placement, tint));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.layers.set(layer);
  }, [model, placements, layer]);

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

/** Moves a water mesh onto the layer the reflection pass skips. */
function onWaterLayer(mesh: Object3D): void {
  mesh.layers.set(REFLECTION.waterLayer);
}

export function Neighborhood(): React.ReactElement {
  const materials = useWorldMaterials();

  // The yards are mown into the terrain's own colour; a separate disc mesh read as a sticker.
  const terrainGeometry = useMemo(() => createTerrainGeometry(LAWNS), []);
  const terrainMaterial = useMemo(() => createTerrainMaterial(materials.grass), [materials.grass]);
  const outerLandGeometry = useMemo(() => createOuterLandGeometry(), []);
  const roadGeometry = useMemo(() => roadSurfaceGeometry(), []);
  const roadStructureGeometry = useMemo(() => createRoadStructureGeometry(), []);
  const lakeGeometry = useMemo(() => createLakeSurfaceGeometry(), []);
  const riverGeometry = useMemo(() => createRiverGeometry(), []);
  const foamGeometry = useMemo(() => createWaterfallFoamGeometry(), []);

  // Grouped by model, and the woods split by whether the lake could ever show them: the
  // mirror pass draws the scene again, and drawing thousands of trees that no reflection
  // reaches cost as much as the rest of the frame - design.md D4 of elevate-world-realism.
  const groups = useMemo(() => {
    const all: readonly Placement[] = [...LANDMARKS, ...createScatter()];
    const byKey = new Map<string, { model: ModelKey; layer: number; placements: Placement[] }>();
    for (const placement of all) {
      const far = VEGETATION.has(placement.model) && lakeDistance(placement.x, placement.z) > REFLECTION.reach;
      const layer = far ? REFLECTION.unreflectedLayer : 0;
      const key = `${placement.model}:${layer}`;
      const existing = byKey.get(key);
      if (existing) existing.placements.push(placement);
      else byKey.set(key, { model: placement.model, layer, placements: [placement] });
    }
    return [...byKey.entries()];
  }, []);

  return (
    <group>
      <mesh geometry={terrainGeometry} material={terrainMaterial} receiveShadow />
      {/* The land beyond the map, out to the horizon. It reaches past any useful shadow
          frustum, so it takes none - see design.md D3 of elevate-world-realism. */}
      <mesh geometry={outerLandGeometry} material={terrainMaterial} />
      {/* Road surfaces take their own material, which paints the markings - design.md D6
          of elevate-world-realism. The bridges are stone and timber, on the atlas. */}
      <mesh geometry={roadGeometry} material={materials.road} receiveShadow />
      <mesh geometry={roadStructureGeometry} material={materials.smooth} receiveShadow />
      {/* On the water layer, which the lake's own reflection pass leaves out. */}
      <mesh geometry={lakeGeometry} material={materials.lake.material} onUpdate={onWaterLayer} />
      <mesh geometry={riverGeometry} material={materials.river.material} onUpdate={onWaterLayer} />
      <mesh geometry={foamGeometry} material={materials.smooth} />

      {groups.map(([key, group]) => (
        <InstancedGroup key={key} model={group.model} placements={group.placements} layer={group.layer} />
      ))}
    </group>
  );
}

"use client";

import { useFrame, useThree } from "@react-three/fiber";
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
  SIMPLE_MODEL_REGISTRY,
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
import { type Batch, DETAIL_REFRESH_DISTANCE, type TreeCopies, assignDetail, packBatches } from "@/lib/world/tree-detail";

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
 * One geometry per model and detail, however many groups draw it - the woods near the lake
 * and the woods far from it are the same trees.
 */
const GEOMETRIES = new Map<string, BufferGeometry | null>();

function buildOnce(key: string, build: (() => BufferGeometry) | undefined): BufferGeometry | null {
  if (GEOMETRIES.has(key)) return GEOMETRIES.get(key) ?? null;
  let geometry: BufferGeometry | null = null;
  try {
    geometry = build ? build() : null;
  } catch (error) {
    // A model that fails to build must not blank the scene - world-map spec.
    console.error(`Failed to build model "${key}":`, error);
  }
  GEOMETRIES.set(key, geometry);
  return geometry;
}

function geometryFor(model: ModelKey): BufferGeometry | null {
  return buildOnce(model, MODEL_REGISTRY[model]);
}

function simpleGeometryFor(model: ModelKey): BufferGeometry | null {
  return buildOnce(`${model}:simple`, SIMPLE_MODEL_REGISTRY[model]);
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

/** Every copy's matrix and, for growing things, its own shade - worked out once. */
function treeCopies(model: ModelKey, placements: readonly Placement[]): TreeCopies {
  const matrices = new Float32Array(placements.length * 16);
  const tints = VEGETATION.has(model) ? new Float32Array(placements.length * 3) : null;
  const tint = new Color();
  placements.forEach((placement, index) => {
    matrixFor(placement).toArray(matrices, index * 16);
    if (tints) vegetationTint(placement, tint).toArray(tints, index * 3);
  });
  return { matrices, tints, full: new Uint8Array(placements.length) };
}

const WHITE = new Color(1, 1, 1);

/** The layer, and the tint buffer before the first frame: added later, it needs a new shader. */
function prepareBatch(mesh: InstancedMesh, layer: number, tinted: boolean): void {
  mesh.layers.set(layer);
  if (tinted && !mesh.instanceColor) mesh.setColorAt(0, WHITE);
}

function batchOf(mesh: InstancedMesh): Batch {
  return { matrices: mesh.instanceMatrix.array, tints: mesh.instanceColor?.array ?? null };
}

function showBatch(mesh: InstancedMesh, count: number): void {
  mesh.count = count;
  mesh.visible = count > 0;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function fillBatches(copies: TreeCopies, full: InstancedMesh, simple: InstancedMesh): void {
  const counts = packBatches(copies, batchOf(full), batchOf(simple));
  showBatch(full, counts.full);
  showBatch(simple, counts.simple);
}

const REFRESH_SQUARED = DETAIL_REFRESH_DISTANCE * DETAIL_REFRESH_DISTANCE;

/**
 * A tree model drawn as two batches: the copies near the camera in full, the rest simple.
 * The copies are reassigned whenever the camera has moved a couple of metres - design.md D3
 * of speed-up-the-hub.
 */
function DetailedInstancedGroup({ model, placements, layer }: InstancedGroupProps): React.ReactElement | null {
  const fullRef = useRef<InstancedMesh>(null);
  const simpleRef = useRef<InstancedMesh>(null);
  const lastLook = useRef(new Vector3());
  const get = useThree((state) => state.get);
  const materials = useWorldMaterials();
  const fullGeometry = useMemo(() => geometryFor(model), [model]);
  const simpleGeometry = useMemo(() => simpleGeometryFor(model), [model]);
  const copies = useMemo(() => treeCopies(model, placements), [model, placements]);

  useLayoutEffect(() => {
    const full = fullRef.current;
    const simple = simpleRef.current;
    if (!full || !simple) return;
    prepareBatch(full, layer, copies.tints !== null);
    prepareBatch(simple, layer, copies.tints !== null);
    const { position } = get().camera;
    assignDetail(copies, position.x, position.y, position.z);
    fillBatches(copies, full, simple);
    lastLook.current.copy(position);
  }, [copies, layer, get]);

  useFrame(({ camera }) => {
    const full = fullRef.current;
    const simple = simpleRef.current;
    if (!full || !simple || camera.position.distanceToSquared(lastLook.current) < REFRESH_SQUARED) return;
    lastLook.current.copy(camera.position);
    if (assignDetail(copies, camera.position.x, camera.position.y, camera.position.z)) fillBatches(copies, full, simple);
  });

  if (!fullGeometry || !simpleGeometry || placements.length === 0) return null;
  const material = MODEL_SHADING[model] === "smooth" ? materials.smooth : materials.flat;

  return (
    <>
      <instancedMesh ref={fullRef} args={[fullGeometry, material, placements.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={simpleRef} args={[simpleGeometry, material, placements.length]} castShadow receiveShadow frustumCulled={false} />
    </>
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

      {groups.map(([key, group]) =>
        SIMPLE_MODEL_REGISTRY[group.model] ? (
          <DetailedInstancedGroup key={key} model={group.model} placements={group.placements} layer={group.layer} />
        ) : (
          <InstancedGroup key={key} model={group.model} placements={group.placements} layer={group.layer} />
        ),
      )}
    </group>
  );
}

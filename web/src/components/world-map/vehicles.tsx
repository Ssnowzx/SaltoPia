"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferGeometry, Mesh } from "three";
import { CatmullRomCurve3, DoubleSide, MeshBasicMaterial, Vector3 } from "three";

import { box, merge, post } from "@/lib/world/builders";
import { LAKE, RAIL, ROAD, UFO_PORT, VEHICLES, WORLD_COLORS } from "@/lib/world/constants";
import { createSailboatGeometry, createYachtGeometry, wheel } from "@/lib/world/props";
import { CAR_CURVE, SAILBOAT_CURVE, TRAIN_CURVE, YACHT_CURVE, surfaceHeightAt } from "@/lib/world/roads";
import { terrainHeightAt } from "@/lib/world/terrain";
import { SAUCER_HOVER, createBeamGeometry, createSaucerGeometry } from "@/lib/world/ufo-port";

import { useWorldMaterials } from "./world-materials-context";

/**
 * Everything that moves: the pickup on the street, the train along the south edge,
 * and the boats on the lake.
 *
 * All follow their curve by arc length and face along the tangent. Vehicles are built
 * facing +Z, which is the axis `Object3D.lookAt` turns toward its target.
 */

function createPickupGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(1.5, 0.42, 3.0, WORLD_COLORS.carBody, 0, 0.62, 0, 0, "metal"),
    box(1.4, 0.8, 1.2, WORLD_COLORS.carCab, 0, 1.22, 0.55, 0, "metal"),
    box(1.42, 0.4, 1.0, WORLD_COLORS.slateDark, 0, 1.3, 0.55, 0, "glass"),
    box(1.4, 0.36, 0.75, WORLD_COLORS.carBody, 0, 1.0, 1.4, 0, "metal"),
    box(0.1, 0.36, 1.35, WORLD_COLORS.carBody, -0.7, 1.0, -0.75, 0, "metal"),
    box(0.1, 0.36, 1.35, WORLD_COLORS.carBody, 0.7, 1.0, -0.75, 0, "metal"),
    box(1.5, 0.36, 0.1, WORLD_COLORS.carBody, 0, 1.0, -1.45, 0, "metal"),
  ];
  for (const x of [-0.35, 0, 0.35]) {
    const log = post(0.16, 0.16, 1.2, 5, WORLD_COLORS.timberDark, 0, 0, 0, "bark");
    log.rotateX(Math.PI / 2);
    log.translate(x, 1.0, -0.75);
    parts.push(log);
  }
  for (const [x, z] of [[-0.82, 0.95], [0.82, 0.95], [-0.82, -0.95], [0.82, -0.95]] as const) {
    parts.push(wheel(x, 0.34, z, 0.34));
  }
  return merge(parts);
}

function createLocomotiveGeometry(): BufferGeometry {
  const boiler = post(0.62, 0.62, 2.2, 10, WORLD_COLORS.trainBody, 0, 0, 0, "metal");
  boiler.rotateX(Math.PI / 2);
  boiler.translate(0, 1.55, 0.6);
  const parts: BufferGeometry[] = [
    box(1.7, 1.2, 3.8, WORLD_COLORS.trainBody, 0, 1.15, 0, 0, "metal"),
    boiler,
    box(1.9, 1.3, 1.3, WORLD_COLORS.trainBody, 0, 2.2, -1.1, 0, "metal"),
    box(2.0, 0.14, 1.45, WORLD_COLORS.trainRoof, 0, 2.9, -1.1, 0, "metal"),
    post(0.2, 0.28, 0.9, 6, WORLD_COLORS.tileDark, 0, 1.75, 1.2, "metal"),
    box(1.6, 0.5, 0.3, WORLD_COLORS.trainRoof, 0, 0.75, 2.0, 0, "metal"),
    box(0.5, 0.5, 0.06, WORLD_COLORS.lantern, 0, 1.6, 1.92, 0, "glass"),
  ];
  for (const z of [-1.2, 0, 1.2]) {
    parts.push(wheel(-0.9, 0.42, z, 0.42));
    parts.push(wheel(0.9, 0.42, z, 0.42));
  }
  return merge(parts);
}

function createWagonGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(1.7, 1.15, 3.3, WORLD_COLORS.trainWagon, 0, 1.12, 0, 0, "planks"),
    box(1.85, 0.12, 3.45, WORLD_COLORS.tileDark, 0, 1.76, 0, 0, "metal"),
    box(1.75, 0.3, 3.35, WORLD_COLORS.timberDark, 0, 1.0, 0, 0, "metal"),
  ];
  for (const z of [-1.15, 1.15]) {
    parts.push(wheel(-0.9, 0.42, z, 0.42));
    parts.push(wheel(0.9, 0.42, z, 0.42));
  }
  return merge(parts);
}

/** Positions a mesh on a curve at arc-length fraction `t`, facing along it. */
function placeOnCurve(mesh: Mesh, curve: CatmullRomCurve3, t: number, heightAt: (x: number, z: number) => number, scratch: Vector3): void {
  const clamped = Math.min(1, Math.max(0, t));
  const point = curve.getPointAt(clamped);
  const tangent = curve.getTangentAt(clamped);
  const y = heightAt(point.x, point.z);
  mesh.position.set(point.x, y, point.z);
  scratch.set(point.x + tangent.x, y, point.z + tangent.z);
  mesh.lookAt(scratch);
}

export function Vehicles(): React.ReactElement {
  const pickup = useMemo(() => createPickupGeometry(), []);
  const locomotive = useMemo(() => createLocomotiveGeometry(), []);
  const wagon = useMemo(() => createWagonGeometry(), []);
  const yacht = useMemo(() => createYachtGeometry(), []);
  const sailboat = useMemo(() => createSailboatGeometry(WORLD_COLORS.wine), []);
  const saucer = useMemo(() => createSaucerGeometry(), []);
  const beam = useMemo(() => createBeamGeometry(), []);
  const beamMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: WORLD_COLORS.lantern,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const portGround = useMemo(() => terrainHeightAt(UFO_PORT.x, UFO_PORT.z), []);
  const { flat: material } = useWorldMaterials();

  const carRef = useRef<Mesh>(null);
  const yachtRef = useRef<Mesh>(null);
  const sailboatRef = useRef<Mesh>(null);
  const trainRefs = useRef<(Mesh | null)[]>([]);
  const saucerRef = useRef<Mesh>(null);
  const scratch = useMemo(() => new Vector3(), []);

  const carLength = useMemo(() => CAR_CURVE.getLength(), []);
  const trainLength = useMemo(() => TRAIN_CURVE.getLength(), []);
  const yachtLength = useMemo(() => YACHT_CURVE.getLength(), []);
  const sailboatLength = useMemo(() => SAILBOAT_CURVE.getLength(), []);

  const onRoad = (x: number, z: number): number => surfaceHeightAt(x, z) + ROAD.lift;
  const onRails = (x: number, z: number): number => surfaceHeightAt(x, z) + RAIL.lift + 0.22;
  const onWater = (): number => LAKE.level;

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    if (carRef.current) {
      placeOnCurve(carRef.current, CAR_CURVE, ((elapsed * VEHICLES.carSpeed) / carLength) % 1, onRoad, scratch);
    }
    if (yachtRef.current) {
      placeOnCurve(yachtRef.current, YACHT_CURVE, ((elapsed * VEHICLES.boatSpeed) / yachtLength) % 1, onWater, scratch);
      yachtRef.current.rotation.z = Math.sin(elapsed * 1.3) * 0.02;
    }
    if (sailboatRef.current) {
      placeOnCurve(sailboatRef.current, SAILBOAT_CURVE, ((elapsed * VEHICLES.boatSpeed * 0.7) / sailboatLength) % 1, onWater, scratch);
      sailboatRef.current.rotation.z = 0.08 + Math.sin(elapsed * 0.9) * 0.04;
    }

    // The saucer holds station over the pad, bobbing and turning slowly.
    if (saucerRef.current) {
      saucerRef.current.position.set(
        UFO_PORT.x + SAUCER_HOVER.x + Math.sin(elapsed * 0.25) * 1.6,
        portGround + SAUCER_HOVER.y + Math.sin(elapsed * 0.6) * 0.7,
        UFO_PORT.z + SAUCER_HOVER.z + Math.cos(elapsed * 0.25) * 1.6,
      );
      saucerRef.current.rotation.y = elapsed * 0.35;
      saucerRef.current.rotation.z = Math.sin(elapsed * 0.4) * 0.05;
    }

    // The train shuttles: out along the line, then back, holding clear of both ends so
    // the wagons behind the locomotive never run off the rails.
    const cars = 3;
    const margin = VEHICLES.trainCarSpacing * cars;
    const range = trainLength - margin * 2;
    const cycle = range * 2;
    const phase = (elapsed * VEHICLES.trainSpeed) % cycle;
    const headDistance = margin + (phase < range ? phase : cycle - phase);
    const direction = phase < range ? 1 : -1;

    for (let index = 0; index < cars; index += 1) {
      const mesh = trainRefs.current[index];
      if (!mesh) continue;
      const distance = headDistance - direction * index * VEHICLES.trainCarSpacing;
      placeOnCurve(mesh, TRAIN_CURVE, distance / trainLength, onRails, scratch);
      if (direction < 0) mesh.rotateY(Math.PI);
    }
  });

  return (
    <group>
      <mesh ref={carRef} geometry={pickup} material={material} castShadow />
      <mesh ref={yachtRef} geometry={yacht} material={material} castShadow />
      <mesh ref={sailboatRef} geometry={sailboat} material={material} castShadow />
      <mesh ref={saucerRef} geometry={saucer} material={material} castShadow />
      <mesh geometry={beam} material={beamMaterial} position={[UFO_PORT.x, portGround + 0.6, UFO_PORT.z]} />
      {[locomotive, wagon, wagon].map((geometry, index) => (
        <mesh
          key={`train-${index}`}
          ref={(mesh) => {
            trainRefs.current[index] = mesh;
          }}
          geometry={geometry}
          material={material}
          castShadow
        />
      ))}
    </group>
  );
}

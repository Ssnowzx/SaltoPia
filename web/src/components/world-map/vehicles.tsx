"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferGeometry, Mesh } from "three";
import { CatmullRomCurve3, CylinderGeometry, MeshStandardMaterial, Vector3 } from "three";

import { box, merge, paint, post } from "@/lib/world/builders";
import { RAIL, ROAD, VEHICLES, WORLD_COLORS } from "@/lib/world/constants";
import { CAR_CURVE, TRAIN_CURVE, surfaceHeightAt } from "@/lib/world/roads";

/**
 * The pickup on the circuit and the train through the station.
 *
 * Both follow their curve by arc length, sample the road surface for height every
 * frame, and face along the tangent. Vehicles are built facing +Z, which is the axis
 * `Object3D.lookAt` turns toward its target.
 */

/** A wheel lying on its side, axle along X. */
function wheel(x: number, y: number, z: number, radius: number): BufferGeometry {
  const geometry = new CylinderGeometry(radius, radius, radius * 0.9, 8);
  geometry.rotateZ(Math.PI / 2);
  geometry.translate(x, y, z);
  return paint(geometry, WORLD_COLORS.wheel);
}

function createPickupGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(1.5, 0.42, 3.0, WORLD_COLORS.carBody, 0, 0.62, 0),
    box(1.4, 0.8, 1.2, WORLD_COLORS.carCab, 0, 1.22, 0.55),
    box(1.4, 0.36, 0.75, WORLD_COLORS.carBody, 0, 1.0, 1.4),
    box(0.1, 0.36, 1.35, WORLD_COLORS.carBody, -0.7, 1.0, -0.75),
    box(0.1, 0.36, 1.35, WORLD_COLORS.carBody, 0.7, 1.0, -0.75),
    box(1.5, 0.36, 0.1, WORLD_COLORS.carBody, 0, 1.0, -1.45),
  ];

  // Firewood in the bed.
  for (const x of [-0.35, 0, 0.35]) {
    const log = post(0.16, 0.16, 1.2, 5, WORLD_COLORS.timberDark, 0, 0, 0);
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
  const parts: BufferGeometry[] = [
    box(1.7, 1.2, 3.8, WORLD_COLORS.trainBody, 0, 1.15, 0),
    post(0.62, 0.62, 2.2, 10, WORLD_COLORS.trainBody, 0, 0, 0),
    box(1.9, 1.3, 1.3, WORLD_COLORS.trainBody, 0, 2.2, -1.1),
    box(2.0, 0.14, 1.45, WORLD_COLORS.trainRoof, 0, 2.9, -1.1),
    post(0.2, 0.28, 0.9, 6, WORLD_COLORS.tileDark, 0, 1.75, 1.2),
    box(1.6, 0.5, 0.3, WORLD_COLORS.trainRoof, 0, 0.75, 2.0),
    box(0.5, 0.5, 0.06, WORLD_COLORS.lantern, 0, 1.6, 1.92),
  ];

  // The boiler lies along Z; post() builds it vertical, so lay it down and lift it.
  const boiler = parts[1];
  boiler.rotateX(Math.PI / 2);
  boiler.translate(0, 1.55, 0.6);

  for (const z of [-1.2, 0, 1.2]) {
    parts.push(wheel(-0.9, 0.42, z, 0.42));
    parts.push(wheel(0.9, 0.42, z, 0.42));
  }

  return merge(parts);
}

function createWagonGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    box(1.7, 1.15, 3.3, WORLD_COLORS.trainWagon, 0, 1.12, 0),
    box(1.85, 0.12, 3.45, WORLD_COLORS.tileDark, 0, 1.76, 0),
    box(1.75, 0.3, 3.35, WORLD_COLORS.timberDark, 0, 1.0, 0),
  ];

  for (const z of [-1.15, 1.15]) {
    parts.push(wheel(-0.9, 0.42, z, 0.42));
    parts.push(wheel(0.9, 0.42, z, 0.42));
  }

  return merge(parts);
}

/** Positions a mesh on a curve at arc-length fraction `t`, facing along it. */
function placeOnCurve(mesh: Mesh, curve: CatmullRomCurve3, t: number, lift: number, scratch: Vector3): void {
  const clamped = Math.min(1, Math.max(0, t));
  const point = curve.getPointAt(clamped);
  const tangent = curve.getTangentAt(clamped);
  const y = surfaceHeightAt(point.x, point.z) + lift;

  mesh.position.set(point.x, y, point.z);
  scratch.set(point.x + tangent.x, y, point.z + tangent.z);
  mesh.lookAt(scratch);
}

export function Vehicles(): React.ReactElement {
  const pickup = useMemo(() => createPickupGeometry(), []);
  const locomotive = useMemo(() => createLocomotiveGeometry(), []);
  const wagon = useMemo(() => createWagonGeometry(), []);
  const material = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }),
    [],
  );

  const carRef = useRef<Mesh>(null);
  const trainRefs = useRef<(Mesh | null)[]>([]);
  const scratch = useMemo(() => new Vector3(), []);

  const carLength = useMemo(() => CAR_CURVE.getLength(), []);
  const trainLength = useMemo(() => TRAIN_CURVE.getLength(), []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    if (carRef.current) {
      const t = ((elapsed * VEHICLES.carSpeed) / carLength) % 1;
      placeOnCurve(carRef.current, CAR_CURVE, t, ROAD.lift, scratch);
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
      placeOnCurve(mesh, TRAIN_CURVE, distance / trainLength, RAIL.lift + 0.22, scratch);
      if (direction < 0) mesh.rotateY(Math.PI);
    }
  });

  return (
    <group>
      <mesh ref={carRef} geometry={pickup} material={material} castShadow />
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

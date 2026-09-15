"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferGeometry, Mesh } from "three";
import { CatmullRomCurve3, DoubleSide, MeshBasicMaterial, Vector3 } from "three";

import { box, merge, post } from "@/lib/world/builders";
import { LAKE, ROAD, UFO_PORT, VEHICLES, WORLD_COLORS } from "@/lib/world/constants";
import { createSailboatGeometry, createYachtGeometry, wheel } from "@/lib/world/props";
import { CAR_CURVE, SAILBOAT_CURVE, YACHT_CURVE, surfaceHeightAt } from "@/lib/world/roads";
import { smoothstep, terrainHeightAt } from "@/lib/world/terrain";
import { CAROUSEL, FERRIS_WHEEL, createCarouselGeometry, createFerrisWheelGeometry } from "@/lib/world/attractions";
import { siteAt } from "@/lib/world/sites";
import { LANDING, RADAR, SAUCER_HOVER, createBeamGeometry, createRadarDishGeometry, createSaucerGeometry } from "@/lib/world/ufo-port";

import { useWorldMaterials } from "./world-materials-context";

/**
 * Everything that moves: the pickup on the street, the boats on the lake, and the
 * saucer holding station over the UFO port.
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

/** How fast the rides turn, radians per second. */
const RIDES = { wheelSpeed: 0.22, carouselSpeed: 0.55 } as const;

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
  const radarDish = useMemo(() => createRadarDishGeometry(), []);
  const ferrisWheel = useMemo(() => createFerrisWheelGeometry(), []);
  const carousel = useMemo(() => createCarouselGeometry(), []);
  const park = useMemo(() => {
    const site = siteAt("parque-caveiras");
    const ground = terrainHeightAt(site.x, site.z);
    return {
      wheel: [site.x + FERRIS_WHEEL.x, ground + FERRIS_WHEEL.y, site.z + FERRIS_WHEEL.z] as const,
      carousel: [site.x + CAROUSEL.x, ground + CAROUSEL.y, site.z + CAROUSEL.z] as const,
    };
  }, []);
  const portGround = useMemo(() => terrainHeightAt(UFO_PORT.x, UFO_PORT.z), []);
  const { flat: material } = useWorldMaterials();

  const carRef = useRef<Mesh>(null);
  const yachtRef = useRef<Mesh>(null);
  const sailboatRef = useRef<Mesh>(null);
  const saucerRef = useRef<Mesh>(null);
  const landingRef = useRef<Mesh>(null);
  const radarRef = useRef<Mesh>(null);
  const beamRef = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null);
  const wheelRef = useRef<Mesh>(null);
  const carouselRef = useRef<Mesh>(null);
  const scratch = useMemo(() => new Vector3(), []);

  const carLength = useMemo(() => CAR_CURVE.getLength(), []);
  const yachtLength = useMemo(() => YACHT_CURVE.getLength(), []);
  const sailboatLength = useMemo(() => SAILBOAT_CURVE.getLength(), []);

  const onRoad = (x: number, z: number): number => surfaceHeightAt(x, z) + ROAD.lift;
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

    // The fairground rides turn.
    if (wheelRef.current) wheelRef.current.rotation.z = -elapsed * RIDES.wheelSpeed;
    if (carouselRef.current) carouselRef.current.rotation.y = elapsed * RIDES.carouselSpeed;

    // The radar sweeps; the beam breathes.
    if (radarRef.current) radarRef.current.rotation.y = elapsed * 0.45;
    if (beamRef.current) beamRef.current.material.opacity = 0.17 + Math.sin(elapsed * 2.1) * 0.06;

    // A second saucer comes down onto the apron, waits, and climbs away again.
    if (landingRef.current) {
      const phase = (elapsed / LANDING.periodSeconds) % 1;
      const descent = 1 - smoothstep(0.02, 0.4, phase);
      const climb = smoothstep(0.58, 0.92, phase);
      const height = LANDING.bottom + (LANDING.top - LANDING.bottom) * Math.max(descent, climb);
      const drift = Math.max(descent, climb);
      landingRef.current.position.set(
        UFO_PORT.x + LANDING.x + Math.sin(elapsed * 0.9) * 0.4 * drift,
        portGround + height,
        UFO_PORT.z + LANDING.z + Math.cos(elapsed * 0.7) * 0.4 * drift,
      );
      landingRef.current.rotation.y = -elapsed * 0.6;
      landingRef.current.rotation.z = Math.sin(elapsed * 0.5) * 0.04 * drift;
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

  });

  return (
    <group>
      <mesh ref={carRef} geometry={pickup} material={material} castShadow />
      <mesh ref={yachtRef} geometry={yacht} material={material} castShadow />
      <mesh ref={sailboatRef} geometry={sailboat} material={material} castShadow />
      <mesh ref={saucerRef} geometry={saucer} material={material} castShadow />
      <mesh ref={landingRef} geometry={saucer} material={material} castShadow />
      <mesh ref={wheelRef} geometry={ferrisWheel} material={material} position={[...park.wheel]} castShadow />
      <mesh ref={carouselRef} geometry={carousel} material={material} position={[...park.carousel]} castShadow />
      <mesh ref={radarRef} geometry={radarDish} material={material} position={[UFO_PORT.x + RADAR.x, portGround + RADAR.y, UFO_PORT.z + RADAR.z]} castShadow />
      <mesh ref={beamRef} geometry={beam} material={beamMaterial} position={[UFO_PORT.x, portGround + 0.6, UFO_PORT.z]} />
    </group>
  );
}

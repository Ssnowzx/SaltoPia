"use client";

import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { type Camera, type Group, Raycaster, Vector2, Vector3 } from "three";

import type { CharacterConfig } from "@/lib/walk/characters";
import { setVisitor, withCrowd } from "@/lib/walk/crowd";
import { type Walker, directionFromCamera, stepWalker } from "@/lib/walk/movement";
import { routeBetween, walkWorld, warmWalkGrid } from "@/lib/walk/navigator";
import { siteFootprints } from "@/lib/walk/obstacles";
import type { Point } from "@/lib/walk/pathfinding";
import { areaAt, arrivalAreas } from "@/lib/walk/visits";
import { WALK } from "@/lib/world/constants";

import { WalkCamera } from "./walk-camera";
import { WalkCharacter } from "./walk-character";
import type { GroundPicker, RouteRequest, StickInput, WalkKey } from "./walk-input";

/**
 * Walk mode inside the canvas: steps the walker every frame from keys, stick or route,
 * places the character, and reports the place it has arrived at. See the walk-mode spec.
 */

interface WalkSceneProps {
  readonly config: CharacterConfig;
  readonly creating: boolean;
  readonly walker: { current: Walker };
  readonly stick: { readonly current: StickInput };
  readonly route: RouteRequest | null;
  readonly greeting: number;
  readonly picker: { current: GroundPicker | null };
  readonly onArea: (slug: string | null) => void;
}

/** Before the follow camera (0.2), which reads where the walker ended up. */
const WALK_PRIORITY = 0.1;
/** Past this, a route is run rather than walked. */
const RUN_ROUTE_BEYOND = 30;

/**
 * Writes into a ref the parent owns. The walker and the picker are the parent's, handed down
 * so it can save the walk or pick the ground; the frame loop is what keeps them current.
 */
function store<T>(holder: { current: T }, value: T): void {
  holder.current = value;
}

/** Marches a camera ray against the ground; bisects the step that crossed it. */
function pickGround(camera: Camera, ndcX: number, ndcY: number, heightAt: (x: number, z: number) => number): Point | null {
  const ray = new Raycaster();
  ray.setFromCamera(new Vector2(ndcX, ndcY), camera);
  const { origin, direction } = ray.ray;
  const at = (t: number): Vector3 => origin.clone().addScaledVector(direction, t);
  let previous = 0;
  for (let t = 1; t < 900; t += 1.5) {
    const point = at(t);
    if (point.y > heightAt(point.x, point.z)) {
      previous = t;
      continue;
    }
    let low = previous;
    let high = t;
    for (let step = 0; step < 8; step += 1) {
      const mid = (low + high) / 2;
      const probe = at(mid);
      if (probe.y > heightAt(probe.x, probe.z)) low = mid;
      else high = mid;
    }
    const hit = at(high);
    return { x: hit.x, z: hit.z };
  }
  return null;
}

/** The ground direction the walker wants this frame, and whether it runs. */
function wantedDirection(camera: Camera, forward: number, right: number, route: { current: Point[] | null }, walker: Walker): { x: number; z: number; run: boolean } {
  if (forward !== 0 || right !== 0) {
    route.current = null;
    const view = camera.getWorldDirection(new Vector3());
    return { ...directionFromCamera(forward, right, view.x, view.z), run: false };
  }
  const waypoints = route.current;
  if (!waypoints || waypoints.length === 0) return { x: 0, z: 0, run: false };
  const next = waypoints[0];
  const dx = next.x - walker.x;
  const dz = next.z - walker.z;
  const distance = Math.hypot(dx, dz);
  if (distance < WALK.waypointReach) {
    waypoints.shift();
    if (waypoints.length === 0) route.current = null;
    return { x: 0, z: 0, run: false };
  }
  const remaining = waypoints.reduce((sum, point, index) => sum + (index === 0 ? distance : Math.hypot(point.x - waypoints[index - 1].x, point.z - waypoints[index - 1].z)), 0);
  return { x: dx / distance, z: dz / distance, run: remaining > RUN_ROUTE_BEYOND };
}

export function WalkScene({ config, creating, walker, stick, route, greeting, picker, onArea }: WalkSceneProps): React.ReactElement {
  const [, getKeys] = useKeyboardControls<WalkKey>();
  const get = useThree((state) => state.get);
  const body = useRef<Group>(null);
  const waypoints = useRef<Point[] | null>(null);
  const currentArea = useRef<string | null>(null);
  const areas = useMemo(() => arrivalAreas(siteFootprints()), []);
  // The townsfolk stand in the walker's way; the route grid is built without them.
  const world = useMemo(() => withCrowd(walkWorld()), []);

  useEffect(() => warmWalkGrid(), []);
  useEffect(() => () => setVisitor(null), []);

  useEffect(() => {
    if (route) waypoints.current = routeBetween(walker.current, route.target);
  }, [route, walker]);

  useEffect(() => {
    store(picker, (ndcX: number, ndcY: number) => pickGround(get().camera, ndcX, ndcY, world.heightAt));
    return () => store(picker, null);
  }, [get, picker, world]);

  useFrame(({ camera }, delta) => {
    const keys = getKeys();
    const forward = creating ? 0 : Number(keys.forward) - Number(keys.backward) + stick.current.forward;
    const right = creating ? 0 : Number(keys.right) - Number(keys.left) + stick.current.right;
    const wanted = creating ? { x: 0, z: 0, run: false } : wantedDirection(camera, forward, right, waypoints, walker.current);
    const run = wanted.run || keys.run || stick.current.run;
    store(walker, stepWalker(walker.current, { directionX: wanted.x, directionZ: wanted.z, run }, Math.min(delta, 0.05), world));

    const { x, z, heading } = walker.current;
    setVisitor(walker.current);
    body.current?.position.set(x, world.heightAt(x, z), z);
    body.current?.rotation.set(0, heading, 0);

    const slug = areaAt(x, z, areas)?.slug ?? null;
    if (slug !== currentArea.current) {
      currentArea.current = slug;
      onArea(slug);
    }
  }, WALK_PRIORITY);

  return (
    <>
      <group ref={body}>
        {/* A model that fails to download leaves the walk without a body, not the hub
            without a world. */}
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <WalkCharacter config={config} walker={walker} greeting={greeting} />
          </Suspense>
        </ErrorBoundary>
      </group>
      <WalkCamera walker={walker} creating={creating} />
    </>
  );
}

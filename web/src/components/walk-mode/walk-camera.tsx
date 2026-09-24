"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Camera, TOUCH, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { Walker } from "@/lib/walk/movement";
import { walkWorld } from "@/lib/walk/navigator";
import { CAMERA, WALK_CAMERA } from "@/lib/world/constants";

/**
 * The camera that follows the character: an orbit round its head the visitor turns by
 * dragging and pulls nearer or further with the wheel. Each frame the camera is moved by
 * the character's own displacement, so it follows without undoing the visitor's orbit.
 * See design.md D5 of add-walking-character.
 */

interface WalkCameraProps {
  readonly walker: { readonly current: Walker };
  /** In the creator the camera stands in front of the character, close. */
  readonly creating: boolean;
}

/** Where the camera looks: the character's head. */
function headOf(walker: Walker, target: Vector3): Vector3 {
  return target.set(walker.x, walkWorld().heightAt(walker.x, walker.z) + WALK_CAMERA.lookHeight, walker.z);
}

/** Puts the camera behind the character - or, in the creator, in front of it. */
function frame(camera: Camera, walker: Walker, creating: boolean, head: Vector3): void {
  const distance = creating ? WALK_CAMERA.creatorDistance : WALK_CAMERA.startDistance;
  const side = creating ? 1 : -1;
  camera.position.set(
    head.x + Math.sin(walker.heading) * distance * side + (creating ? Math.cos(walker.heading) * 1.2 : 0),
    head.y + (creating ? WALK_CAMERA.creatorLift : WALK_CAMERA.startLift),
    head.z + Math.cos(walker.heading) * distance * side,
  );
}

/** Back to the composed wide shot, for the aerial rig to take over. */
function restoreAerial(camera: Camera): void {
  camera.position.set(CAMERA.initialPosition[0], CAMERA.initialPosition[1], CAMERA.initialPosition[2]);
  camera.lookAt(CAMERA.target[0], CAMERA.target[1], CAMERA.target[2]);
}

function follow(controls: OrbitControlsImpl, camera: Camera, head: Vector3, last: Vector3): void {
  camera.position.add(new Vector3().subVectors(head, last));
  controls.target.copy(head);
  controls.update();
  // Never under the ground, however the visitor turns it.
  const floor = walkWorld().heightAt(camera.position.x, camera.position.z) + WALK_CAMERA.groundClearance;
  if (camera.position.y < floor) camera.position.y = floor;
  last.copy(head);
}

/** After the walker has moved (0.1) and before the lake's reflection is drawn (0.5). */
const CAMERA_PRIORITY = 0.2;

export function WalkCamera({ walker, creating }: WalkCameraProps): React.ReactElement {
  const controls = useRef<OrbitControlsImpl>(null);
  const get = useThree((state) => state.get);
  const last = useRef(new Vector3());

  useEffect(() => {
    const { camera } = get();
    const head = headOf(walker.current, new Vector3());
    frame(camera, walker.current, creating, head);
    last.current.copy(head);
    controls.current?.target.copy(head);
    controls.current?.update();
  }, [get, walker, creating]);

  useEffect(() => () => restoreAerial(get().camera), [get]);

  useFrame(({ camera }) => {
    if (!controls.current) return;
    follow(controls.current, camera, headOf(walker.current, new Vector3()), last.current);
  }, CAMERA_PRIORITY);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={false}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
      minDistance={creating ? WALK_CAMERA.creatorMinDistance : WALK_CAMERA.minDistance}
      maxDistance={WALK_CAMERA.maxDistance}
      minPolarAngle={WALK_CAMERA.minPolarAngle}
      maxPolarAngle={WALK_CAMERA.maxPolarAngle}
    />
  );
}

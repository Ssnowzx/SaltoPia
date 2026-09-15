"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PerspectiveCamera } from "three";

import { CAMERA } from "@/lib/world/constants";

/**
 * Keeps the whole town in frame whatever shape the viewport is.
 *
 * The composition is authored for a wide screen. A phone held upright is half as wide
 * for the same height, and a camera set up for 16:9 shows a strip of foreground and cuts
 * the lake and the plateau off the sides. Rather than move the camera per device, the
 * vertical field of view widens as the viewport narrows, so the horizontal field - which
 * is what the composition is built across - stays what it was meant to be.
 *
 * The distance limits follow: a narrow screen has to sit further back before it holds
 * the same amount of world.
 */

/** The aspect the camera's numbers were composed for. */
const REFERENCE_ASPECT = 16 / 9;

/** Past this the view would tip toward the sky rather than the town. */
const MAX_FOV = 86;

export function ViewportFraming(): null {
  // The camera is read through the store's getter rather than returned by the hook: it
  // is about to be mutated, and a value a hook hands back is not ours to change.
  const getState = useThree((state) => state.get);
  const { width, height } = useThree((state) => state.size);

  useEffect(() => {
    const { camera, controls } = getState();
    if (!(camera instanceof PerspectiveCamera)) return;

    const widen = Math.max(1, REFERENCE_ASPECT / (width / height));

    // Widening the vertical field by the aspect shortfall holds the horizontal field
    // constant, which is the one the town is composed across.
    const referenceHalf = Math.tan((CAMERA.fov * Math.PI) / 360);
    camera.fov = Math.min(MAX_FOV, (Math.atan(referenceHalf * widen) * 360) / Math.PI);
    camera.updateProjectionMatrix();

    const orbit = controls as OrbitControlsImpl | null;
    if (orbit) {
      orbit.minDistance = CAMERA.minDistance * Math.min(widen, 1.35);
      orbit.maxDistance = CAMERA.maxDistance * Math.min(widen, 1.5);
      orbit.update();
    }
  }, [getState, width, height]);

  return null;
}

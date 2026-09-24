"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { HalfFloatType, LinearFilter, PerspectiveCamera, WebGLRenderTarget } from "three";

import { LAKE, REFLECTION } from "@/lib/world/constants";
import { applyObliqueClip, placeMirrorCamera, reflectionTextureMatrix } from "@/lib/world/planar-reflection";

import { useWorldMaterials } from "./world-materials-context";

/**
 * The lake's planar reflection pass.
 *
 * Every frame, after the camera has moved and before the composer draws, the scene is
 * rendered once more from the camera's mirror image under the water, into a half-float
 * target at a fraction of the screen's resolution. The water sits on a layer the mirror
 * camera does not draw, and an oblique near plane at the surface keeps the lake bed out.
 * See design.md D4 of elevate-world-realism.
 */

/**
 * After the camera rig (default priority 0) and before the composer's render (priority 1),
 * so the reflection is of this frame's camera, not the last one's.
 */
const REFLECTION_PRIORITY = 0.5;

interface LakeReflectionProps {
  /** Share of the drawing buffer the reflection renders at; 0 turns the pass off. */
  readonly scale?: number;
}

export function LakeReflection({ scale = REFLECTION.scale }: LakeReflectionProps): null {
  const get = useThree((state) => state.get);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  // Held in a ref: its uniforms are written every frame, which is three's business.
  const lake = useRef(useWorldMaterials().lake);

  const mirror = useMemo(() => new PerspectiveCamera(), []);
  const target = useMemo(
    () =>
      new WebGLRenderTarget(1, 1, {
        type: HalfFloatType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        generateMipmaps: false,
        depthBuffer: true,
      }),
    [],
  );

  // The mirror camera draws layer 0 only, so it leaves the water out.
  useEffect(() => {
    mirror.layers.set(0);
  }, [mirror]);

  useEffect(() => {
    const pixelRatio = get().gl.getPixelRatio();
    target.setSize(Math.max(1, Math.round(width * pixelRatio * scale)), Math.max(1, Math.round(height * pixelRatio * scale)));
  }, [get, target, width, height, scale]);

  useEffect(() => {
    const { uniforms } = lake.current;
    uniforms.uReflection.value = target.texture;
    return () => {
      uniforms.uReflection.value = null;
      uniforms.uReflectionWeight.value = 0;
      target.dispose();
    };
  }, [target]);

  useFrame(({ gl, scene, camera }) => {
    const { uniforms } = lake.current;
    // The main camera draws everything; the mirror camera leaves out the water and the
    // woods too far from the lake to be reflected in it.
    camera.layers.enable(REFLECTION.waterLayer);
    camera.layers.enable(REFLECTION.unreflectedLayer);
    if (scale <= 0 || !(camera instanceof PerspectiveCamera)) {
      uniforms.uReflectionWeight.value = 0;
      return;
    }

    placeMirrorCamera(camera, mirror, LAKE.level);
    reflectionTextureMatrix(mirror, uniforms.uReflectionMatrix.value);
    applyObliqueClip(mirror, LAKE.level, REFLECTION.clipBias);

    const previousTarget = gl.getRenderTarget();
    const shadowAutoUpdate = gl.shadowMap.autoUpdate;
    // The main pass keeps the shadow map; the mirror reuses it rather than paying for a
    // shadow pass of its own. The sun does not move, so a frame's lag changes nothing.
    gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(target);
    gl.clear();
    gl.render(scene, mirror);
    gl.setRenderTarget(previousTarget);
    gl.shadowMap.autoUpdate = shadowAutoUpdate;

    uniforms.uReflectionWeight.value = 1;
  }, REFLECTION_PRIORITY);

  return null;
}

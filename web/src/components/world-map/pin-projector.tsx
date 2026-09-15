"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";

import { PIN } from "@/lib/world/constants";
import { terrainHeightAt } from "@/lib/world/terrain";
import type { Place } from "@/types";

import type { PinNodes } from "./pin-overlay";

/**
 * Projects each place's world anchor to screen space every frame and writes it to the
 * pin's DOM node. Runs inside the canvas so it has the live camera; writes straight to
 * the node so React never re-renders on camera movement. See design.md D3.
 */

interface PinProjectorProps {
  readonly places: readonly Place[];
  readonly nodes: PinNodes;
  /** Hidden during camera flights and before the visitor starts exploring. */
  readonly hidden: boolean;
}

export function PinProjector({ places, nodes, hidden }: PinProjectorProps): null {
  const { camera, size } = useThree();
  const projected = useMemo(() => new Vector3(), []);

  const anchors = useMemo(
    () =>
      places.map((place) => ({
        slug: place.slug,
        x: place.worldPosition.x,
        y: terrainHeightAt(place.worldPosition.x, place.worldPosition.z) + PIN.anchorHeight,
        z: place.worldPosition.z,
      })),
    [places],
  );

  useFrame(() => {
    for (const anchor of anchors) {
      const node = nodes.current.get(anchor.slug);
      if (!node) continue;

      projected.set(anchor.x, anchor.y, anchor.z).project(camera);
      const behindCamera = projected.z > 1;
      const x = ((projected.x + 1) / 2) * size.width;
      const y = ((1 - projected.y) / 2) * size.height;

      node.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      node.dataset.visible = String(!hidden && !behindCamera);
    }
  });

  return null;
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferAttribute, BufferGeometry, Mesh } from "three";
import { Color, MeshBasicMaterial } from "three";

import { blob, merge } from "@/lib/world/builders";
import { CLOUDS, WORLD_COLORS, WORLD_SEED } from "@/lib/world/constants";
import { createRandom } from "@/lib/world/noise";

/**
 * Clouds drifting high over the valley. A bank of mist on the far shore was tried and
 * read as sheets of glass lying on the water; it is gone.
 *
 * Each cloud is a handful of low-poly blobs merged into one mesh and coloured coral,
 * lighter on top, like the reference's sunset clouds. They drift east and wrap, which
 * is the small continuous motion that keeps the world from reading as a still image
 * even when the camera is parked.
 */

interface CloudState {
  x: number;
  readonly y: number;
  readonly z: number;
  readonly scale: number;
  readonly speed: number;
  readonly variant: number;
}

/** Grades a cloud's vertex colours from its shaded underside to its lit top. */
function shadeByHeight(geometry: BufferGeometry, bottom: string, top: string): BufferGeometry {
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return geometry;

  const positions = geometry.attributes.position;
  const colors = geometry.attributes.color as BufferAttribute;
  const low = new Color(bottom);
  const high = new Color(top);
  const range = bounds.max.y - bounds.min.y || 1;

  for (let index = 0; index < positions.count; index += 1) {
    const t = (positions.getY(index) - bounds.min.y) / range;
    const eased = t * t * (3 - 2 * t);
    const color = low.clone().lerp(high, eased);
    colors.setXYZ(index, color.r, color.g, color.b);
  }
  colors.needsUpdate = true;
  return geometry;
}

function createCloudGeometry(seed: number, bottom: string, top: string): BufferGeometry {
  const random = createRandom(seed);
  const puffs = 5 + Math.floor(random() * 3);
  const parts: BufferGeometry[] = [];
  let x = 0;

  for (let index = 0; index < puffs; index += 1) {
    const radius = 2.2 + random() * 2.6;
    parts.push(blob(radius, WORLD_COLORS.cloud, x, radius * 0.1 + random() * 0.8, (random() - 0.5) * 2.2, 0.6, 1));
    x += radius * 1.05;
  }

  const geometry = merge(parts);
  geometry.center();
  return shadeByHeight(geometry, bottom, top);
}

export function Clouds(): React.ReactElement {
  const cloudGeometries = useMemo(
    () => [0, 1, 2].map((index) => createCloudGeometry(WORLD_SEED + index * 17, WORLD_COLORS.cloudShade, WORLD_COLORS.cloud)),
    [],
  );

  // Unlit: a lit flat-shaded cloud turns into a grey-brown lump against a bright sky.
  // The shading is baked into the vertex colours, underside to top.
  const material = useMemo(() => new MeshBasicMaterial({ vertexColors: true, fog: true }), []);

  const clouds = useMemo<CloudState[]>(() => {
    const random = createRandom(WORLD_SEED + 99);
    return Array.from({ length: CLOUDS.count }, (_, index) => ({
      x: (random() - 0.5) * CLOUDS.spread,
      y: CLOUDS.minHeight + random() * (CLOUDS.maxHeight - CLOUDS.minHeight),
      z: -260 + random() * 300,
      // Rounded puffs, as in the reference - distinct shapes, not streaks.
      scale: 1.5 + random() * 1.6,
      speed: CLOUDS.driftSpeed * (0.6 + random() * 0.8),
      variant: index % 3,
    }));
  }, []);


  const cloudRefs = useRef<(Mesh | null)[]>([]);

  useFrame((_, delta) => {
    clouds.forEach((cloud, index) => {
      cloud.x += cloud.speed * delta;
      if (cloud.x > CLOUDS.spread / 2 + 30) cloud.x = -CLOUDS.spread / 2 - 30;
      cloudRefs.current[index]?.position.set(cloud.x, cloud.y, cloud.z);
    });
  });

  return (
    <group>
      {clouds.map((cloud, index) => (
        <mesh
          key={`cloud-${index}`}
          ref={(mesh) => {
            cloudRefs.current[index] = mesh;
          }}
          geometry={cloudGeometries[cloud.variant]}
          material={material}
          position={[cloud.x, cloud.y, cloud.z]}
          scale={[cloud.scale * 1.15, cloud.scale * 0.78, cloud.scale]}
        />
      ))}

    </group>
  );
}

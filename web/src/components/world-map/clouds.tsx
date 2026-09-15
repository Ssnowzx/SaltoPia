"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferGeometry, Mesh } from "three";
import { MeshStandardMaterial } from "three";

import { blob, merge } from "@/lib/world/builders";
import { CLOUDS, MIST, WORLD_COLORS, WORLD_SEED } from "@/lib/world/constants";
import { createRandom } from "@/lib/world/noise";

/**
 * Clouds drifting over the valley, and the bank of mist behind the lookout.
 *
 * Each cloud is a handful of low-poly blobs merged into one mesh. They drift east and
 * wrap, which is the small continuous motion that keeps the world from reading as a
 * still image even when the camera is parked.
 */

interface CloudState {
  x: number;
  readonly y: number;
  readonly z: number;
  readonly scale: number;
  readonly speed: number;
  readonly variant: number;
}

function createCloudGeometry(seed: number): BufferGeometry {
  const random = createRandom(seed);
  const puffs = 5 + Math.floor(random() * 3);
  const parts: BufferGeometry[] = [];
  let x = 0;

  for (let index = 0; index < puffs; index += 1) {
    const radius = 2.2 + random() * 2.6;
    const color = random() > 0.7 ? WORLD_COLORS.cloudShade : WORLD_COLORS.cloud;
    parts.push(blob(radius, color, x, radius * 0.1 + random() * 0.8, (random() - 0.5) * 2.2, 0.6, 1));
    x += radius * 1.05;
  }

  const geometry = merge(parts);
  geometry.center();
  return geometry;
}

export function Clouds(): React.ReactElement {
  const geometries = useMemo(
    () => [0, 1, 2].map((index) => createCloudGeometry(WORLD_SEED + index * 17)),
    [],
  );

  const material = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
    [],
  );

  const mistMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        roughness: 1,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    [],
  );

  const clouds = useMemo<CloudState[]>(() => {
    const random = createRandom(WORLD_SEED + 99);
    return Array.from({ length: CLOUDS.count }, (_, index) => ({
      x: (random() - 0.5) * CLOUDS.spread,
      y: CLOUDS.minHeight + random() * (CLOUDS.maxHeight - CLOUDS.minHeight),
      z: -130 + random() * 210,
      scale: 1 + random() * 1.5,
      speed: CLOUDS.driftSpeed * (0.6 + random() * 0.8),
      variant: index % 3,
    }));
  }, []);

  const mist = useMemo(() => {
    const random = createRandom(WORLD_SEED + 7);
    return Array.from({ length: MIST.count }, (_, index) => ({
      x: -132 + (index / (MIST.count - 1)) * 264 + (random() - 0.5) * 14,
      y: MIST.height + (random() - 0.5) * 4,
      z: MIST.nearZ + random() * (MIST.farZ - MIST.nearZ),
      scaleX: 3.0 + random() * 1.6,
      scaleY: 0.22 + random() * 0.12,
      scaleZ: 1.6 + random() * 0.9,
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
          geometry={geometries[cloud.variant]}
          material={material}
          position={[cloud.x, cloud.y, cloud.z]}
          scale={cloud.scale}
          castShadow
        />
      ))}

      {mist.map((bank, index) => (
        <mesh
          key={`mist-${index}`}
          geometry={geometries[bank.variant]}
          material={mistMaterial}
          position={[bank.x, bank.y, bank.z]}
          scale={[bank.scaleX, bank.scaleY, bank.scaleZ]}
        />
      ))}
    </group>
  );
}

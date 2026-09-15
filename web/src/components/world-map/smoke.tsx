"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { IcosahedronGeometry, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from "three";

import { SMOKE, WORLD_COLORS } from "@/lib/world/constants";
import { SMOKE_SOURCES } from "@/lib/world/landmarks";
import { terrainHeightAt } from "@/lib/world/terrain";

/**
 * Chimney and fire smoke, as one instanced batch of puffs.
 *
 * Each puff cycles: born at its source, it rises, drifts east on the wind, swells, and
 * shrinks away at the end of its life so it never pops. Scale carries the fade because
 * opacity cannot vary per instance without a custom shader.
 */

interface Puff {
  readonly sourceIndex: number;
  readonly phase: number;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function Smoke(): React.ReactElement {
  const meshRef = useRef<InstancedMesh>(null);

  const geometry = useMemo(() => new IcosahedronGeometry(0.5, 0), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: WORLD_COLORS.smoke,
        flatShading: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    [],
  );

  const sources = useMemo(
    () =>
      SMOKE_SOURCES.map((source) => ({
        ...source,
        y: terrainHeightAt(source.x, source.z) + source.heightAboveGround,
      })),
    [],
  );

  const puffs = useMemo<Puff[]>(
    () =>
      sources.flatMap((_, sourceIndex) =>
        Array.from({ length: SMOKE.puffsPerSource }, (_, index) => ({
          sourceIndex,
          phase: (index / SMOKE.puffsPerSource) * SMOKE.lifeSeconds + sourceIndex * 0.7,
        })),
      ),
    [sources],
  );

  const matrix = useMemo(() => new Matrix4(), []);
  const position = useMemo(() => new Vector3(), []);
  const scale = useMemo(() => new Vector3(), []);
  const rotation = useMemo(() => new Quaternion(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();

    puffs.forEach((puff, index) => {
      const source = sources[puff.sourceIndex];
      const age = (elapsed + puff.phase) % SMOKE.lifeSeconds;

      const rise = age * SMOKE.riseSpeed * source.intensity;
      const wander = Math.sin(age * 1.7 + puff.phase) * 0.35;
      const wind = age * 0.45;

      const size =
        (0.35 + age * 0.5) * source.intensity * (1 - smoothstep(SMOKE.lifeSeconds * 0.72, SMOKE.lifeSeconds, age));

      position.set(source.x + wind + wander, source.y + rise, source.z + wander * 0.5);
      scale.setScalar(Math.max(0.001, size));
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, puffs.length]}
      frustumCulled={false}
    />
  );
}

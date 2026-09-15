"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { Mesh } from "three";
import { BackSide, Color, ShaderMaterial, Vector3 } from "three";

import { SKY_COLORS, WORLD_COLORS } from "@/lib/world/constants";

/**
 * The sky - late golden hour over the campos, per design.md D6 - and the sun.
 *
 * A gradient on an inverted sphere rather than a flat background colour: the horizon
 * band is what sells the altitude, and a solid colour behind low-poly terrain reads as
 * a missing texture. The sun sits low behind the serra so the peaks cut across it.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uHigh;
  uniform vec3 uMid;
  uniform vec3 uLow;
  uniform vec3 uHaze;
  uniform float uRadius;

  varying vec3 vWorldPosition;

  void main() {
    // Normalised height up the dome, 0 at the horizon and 1 overhead.
    float h = clamp(vWorldPosition.y / uRadius, -1.0, 1.0);

    // Three stops from horizon to zenith, then a haze band pooled at the horizon
    // itself - that band is the mist sitting in the valley.
    vec3 color = mix(uLow, uMid, smoothstep(0.0, 0.14, h));
    color = mix(color, uHigh, smoothstep(0.1, 0.55, h));
    color = mix(uHaze, color, smoothstep(-0.06, 0.1, h));

    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Where the sun sits, as a direction from the origin. Low, and behind the peaks. */
const SUN_DIRECTION = new Vector3(0.02, 0.26, -1).normalize();

interface SkyDomeProps {
  readonly radius?: number;
}

export function SkyDome({ radius = 420 }: SkyDomeProps): React.ReactElement {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uHigh: { value: new Color(SKY_COLORS.high) },
          uMid: { value: new Color(SKY_COLORS.mid) },
          uLow: { value: new Color(SKY_COLORS.low) },
          uHaze: { value: new Color(SKY_COLORS.haze) },
          uRadius: { value: radius },
        },
      }),
    [radius],
  );

  const sunPosition = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(radius * 0.92), [radius]);
  const sunRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  // A circle faces +Z; lookAt turns that toward the valley.
  useLayoutEffect(() => {
    sunRef.current?.lookAt(0, 0, 0);
    glowRef.current?.lookAt(0, 0, 0);
  }, []);

  return (
    <group>
      <mesh material={material} renderOrder={-2}>
        <sphereGeometry args={[radius, 32, 16]} />
      </mesh>

      <mesh ref={glowRef} position={sunPosition} renderOrder={-1}>
        <circleGeometry args={[radius * 0.24, 40]} />
        <meshBasicMaterial color={WORLD_COLORS.sun} transparent opacity={0.28} depthWrite={false} fog={false} />
      </mesh>

      <mesh ref={sunRef} position={sunPosition} renderOrder={-1}>
        <circleGeometry args={[radius * 0.1, 40]} />
        <meshBasicMaterial color={WORLD_COLORS.sun} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

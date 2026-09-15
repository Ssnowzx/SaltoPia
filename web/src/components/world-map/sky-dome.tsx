"use client";

import { useMemo } from "react";
import { BackSide, Color, ShaderMaterial } from "three";

import { SKY_COLORS } from "@/lib/world/constants";

/**
 * The sky - late golden hour over the campos, per design.md D6.
 *
 * A gradient on an inverted sphere rather than a flat background colour: the horizon
 * band is what sells the altitude, and a solid colour behind low-poly terrain reads as
 * a missing texture.
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
    vec3 color = mix(uLow, uMid, smoothstep(0.0, 0.28, h));
    color = mix(color, uHigh, smoothstep(0.22, 0.75, h));
    color = mix(uHaze, color, smoothstep(-0.06, 0.12, h));

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface SkyDomeProps {
  readonly radius?: number;
}

export function SkyDome({ radius = 400 }: SkyDomeProps): React.ReactElement {
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

  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[radius, 32, 16]} />
    </mesh>
  );
}

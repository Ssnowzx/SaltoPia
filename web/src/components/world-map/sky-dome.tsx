"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { IUniform, Mesh } from "three";
import { AdditiveBlending, BackSide, Color, ShaderMaterial, Vector3 } from "three";

import { SKY_COLORS, SUN_DIRECTION, WORLD_COLORS } from "@/lib/world/constants";

/** The rays' own clock - a module-level uniform, so advancing it mutates no React value. */
const RAYS_TIME: IUniform<number> = { value: 0 };

/**
 * The sky and the sun.
 *
 * A gradient on an inverted sphere: orange overhead, gold where the sun sits low over
 * the hills. The sun is a disc with a soft glow and a slow fan of rays - the rays are
 * what make the frame read as late afternoon rather than as a lamp.
 */

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uHigh;
  uniform vec3 uMid;
  uniform vec3 uLow;
  uniform vec3 uHaze;
  uniform vec3 uSunDirection;
  uniform float uRadius;
  varying vec3 vWorldPosition;

  void main() {
    vec3 direction = normalize(vWorldPosition);
    float h = clamp(vWorldPosition.y / uRadius, -1.0, 1.0);

    // The camera sees only the band just above the horizon, so the gradient has to
    // warm to orange within a few degrees or the sky reads as haze.
    vec3 color = mix(uLow, uMid, smoothstep(0.0, 0.07, h));
    color = mix(color, uHigh, smoothstep(0.06, 0.3, h));
    color = mix(uHaze, color, smoothstep(-0.17, 0.11, h));

    // The sky warms toward the sun.
    float toward = max(dot(direction, normalize(uSunDirection)), 0.0);
    color = mix(color, uLow, pow(toward, 6.0) * 0.55);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/** The disc is well over white so it alone crosses the bloom threshold. */
const SUN_HDR = new Color(WORLD_COLORS.sun).multiplyScalar(3.2);

const RAYS_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv - 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RAYS_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float r = length(vUv) * 2.0;
    float angle = atan(vUv.y, vUv.x);
    float rays = pow(abs(sin(angle * 9.0 + uTime * 0.04)), 5.0) * 0.7 + pow(abs(sin(angle * 23.0 - uTime * 0.03)), 8.0) * 0.5;
    float falloff = smoothstep(1.0, 0.1, r);
    float core = smoothstep(0.35, 0.0, r) * 0.6;
    gl_FragColor = vec4(uColor, (rays * falloff * 0.42 + core));
  }
`;

interface SkyDomeProps {
  readonly radius?: number;
}

export function SkyDome({ radius = 760 }: SkyDomeProps): React.ReactElement {
  const sunDirection = useMemo(() => new Vector3(SUN_DIRECTION.x, SUN_DIRECTION.y, SUN_DIRECTION.z).normalize(), []);

  const skyMaterial = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        uniforms: {
          uHigh: { value: new Color(SKY_COLORS.high) },
          uMid: { value: new Color(SKY_COLORS.mid) },
          uLow: { value: new Color(SKY_COLORS.low) },
          uHaze: { value: new Color(SKY_COLORS.haze) },
          uSunDirection: { value: sunDirection },
          uRadius: { value: radius },
        },
      }),
    [radius, sunDirection],
  );

  const raysMaterial = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: RAYS_VERTEX,
        fragmentShader: RAYS_FRAGMENT,
        uniforms: {
          uColor: { value: new Color(WORLD_COLORS.sun) },
          uTime: RAYS_TIME,
        },
      }),
    [],
  );

  const sunPosition = useMemo(() => sunDirection.clone().multiplyScalar(radius * 0.9), [radius, sunDirection]);
  const sunRef = useRef<Mesh>(null);
  const raysRef = useRef<Mesh>(null);

  useLayoutEffect(() => {
    sunRef.current?.lookAt(0, 0, 0);
    raysRef.current?.lookAt(0, 0, 0);
  }, []);

  useFrame((_, delta) => {
    RAYS_TIME.value += delta;
  });

  return (
    <group>
      <mesh material={skyMaterial} renderOrder={-3}>
        <sphereGeometry args={[radius, 40, 20]} />
      </mesh>

      <mesh ref={raysRef} position={sunPosition} material={raysMaterial} renderOrder={-2}>
        <planeGeometry args={[radius * 0.95, radius * 0.95]} />
      </mesh>

      <mesh ref={sunRef} position={sunPosition} renderOrder={-1}>
        <circleGeometry args={[radius * 0.075, 40]} />
        <meshBasicMaterial color={SUN_HDR} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

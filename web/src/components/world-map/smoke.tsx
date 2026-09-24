"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, NormalBlending, type Points, ShaderMaterial, UniformsLib, UniformsUtils } from "three";

import { SMOKE, WORLD_COLORS } from "@/lib/world/constants";
import { SMOKE_SOURCES } from "@/lib/world/landmarks";
import { terrainHeightAt } from "@/lib/world/terrain";

/**
 * Chimney and fire smoke, as soft billboards.
 *
 * Each puff is a point sprite with a soft, ragged edge that is born small and dense at its
 * source, rises, drifts east on the wind, swells and thins to nothing. Solid puffs - even
 * faceted ones - read as white stones floating over the roofs. Under reduced motion the
 * plume holds still. See design.md D9 of elevate-world-realism.
 */

interface SmokeProps {
  readonly reducedMotion: boolean;
}

interface Puff {
  readonly sourceIndex: number;
  readonly phase: number;
}

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aAge;
  uniform float uScale;
  varying float vAge;
  varying float vSeed;
  #include <fog_pars_vertex>

  void main() {
    vAge = aAge;
    vSeed = fract(position.x * 0.37 + position.z * 0.71);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // World size to pixels: the projection's focal length times the drawing buffer's height.
    gl_PointSize = aSize * uScale * projectionMatrix[1][1] / max(-mvPosition.z, 0.001);
    #include <fog_vertex>
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAge;
  varying float vSeed;
  #include <fog_pars_fragment>

  float puffNoise(vec2 p) {
    return fract(sin(dot(floor(p), vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 centred = gl_PointCoord - 0.5;
    float radius = length(centred) * 2.0;
    // A ragged rim: the edge breathes with a coarse noise, so no puff is a perfect disc.
    float rim = 0.78 + 0.22 * puffNoise(centred * 6.0 + vSeed * 17.0);
    float body = 1.0 - smoothstep(0.25 * rim, rim, radius);
    float life = smoothstep(0.0, 0.12, vAge) * (1.0 - smoothstep(0.55, 1.0, vAge));
    float alpha = body * life * uOpacity;
    if (alpha < 0.01) discard;
    // Newer smoke is warmer and denser; older smoke has taken the colour of the air.
    gl_FragColor = vec4(uColor * (1.0 - 0.18 * vAge), alpha);
    #include <fog_fragment>
  }
`;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function Smoke({ reducedMotion }: SmokeProps): React.ReactElement {
  const pointsRef = useRef<Points>(null);
  const drawingHeight = useThree((state) => state.size.height * state.viewport.dpr);

  const sources = useMemo(
    () => SMOKE_SOURCES.map((source) => ({ ...source, y: terrainHeightAt(source.x, source.z) + source.heightAboveGround })),
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

  const geometry = useMemo(() => {
    const buffer = new BufferGeometry();
    buffer.setAttribute("position", new BufferAttribute(new Float32Array(puffs.length * 3), 3));
    buffer.setAttribute("aSize", new BufferAttribute(new Float32Array(puffs.length), 1));
    buffer.setAttribute("aAge", new BufferAttribute(new Float32Array(puffs.length), 1));
    return buffer;
  }, [puffs]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          { uColor: { value: new Color(WORLD_COLORS.smoke) }, uOpacity: { value: SMOKE.opacity }, uScale: { value: 1 } },
        ]),
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        fog: true,
      }),
    [],
  );

  // Held in a ref: the buffers are rewritten every frame, which is three's business.
  const buffers = useRef({ geometry, material, elapsed: 0 });

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const plume = buffers.current;
    if (!reducedMotion) plume.elapsed += delta;
    const elapsed = plume.elapsed;
    const positions = plume.geometry.getAttribute("position");
    const sizes = plume.geometry.getAttribute("aSize");
    const ages = plume.geometry.getAttribute("aAge");

    puffs.forEach((puff, index) => {
      const source = sources[puff.sourceIndex];
      const age = (elapsed + puff.phase) % SMOKE.lifeSeconds;
      const share = age / SMOKE.lifeSeconds;
      const rise = age * SMOKE.riseSpeed * source.intensity;
      const wander = Math.sin(age * 1.7 + puff.phase) * 0.35;
      const wind = age * SMOKE.windSpeed * (0.4 + smoothstep(0, 0.6, share));
      positions.setXYZ(index, source.x + wind + wander, source.y + rise, source.z + wander * 0.5);
      sizes.setX(index, (SMOKE.birthSize + share * SMOKE.growth) * source.intensity);
      ages.setX(index, share);
    });

    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    ages.needsUpdate = true;
    plume.material.uniforms.uScale.value = drawingHeight / 2;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}

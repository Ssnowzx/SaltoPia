import { Color, ShaderMaterial, UniformsLib, UniformsUtils, Vector3, type IUniform, type Texture } from "three";

import { LAKE_COLORS, SUN_DIRECTION } from "./constants";
import { ATLAS_TILES_PER_SIDE, SURFACE } from "./textures";

/**
 * The water.
 *
 * What makes a lake read as water at map distance is not its colour but what it
 * reflects: the surface goes from its own blue near the viewer to the colour of the sky
 * at a grazing angle, with the sun laying a glitter path across it. This material does
 * exactly that - a Fresnel blend toward the sunset, a specular path toward the sun, and
 * two scrolling ripple layers from the atlas water tile to keep it moving.
 *
 * Vertex attributes: `depth` (0 shore .. 1 deep), `foam` (0 .. 1, blends to the vertex
 * colour, used for the white water on the falls).
 */

const TILE = 1 / ATLAS_TILES_PER_SIDE;
const WATER_TILE_ORIGIN = {
  x: (SURFACE.water % ATLAS_TILES_PER_SIDE) * TILE,
  y: Math.floor(SURFACE.water / ATLAS_TILES_PER_SIDE) * TILE,
};

const VERTEX_SHADER = /* glsl */ `
  attribute float depth;
  attribute float foam;

  varying vec3 vWorldPosition;
  varying float vDepth;
  varying float vFoam;
  varying vec3 vTint;

  #include <fog_pars_vertex>

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vDepth = depth;
    vFoam = foam;
    vTint = color;

    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform vec3 uSunDirection;

  varying vec3 vWorldPosition;
  varying float vDepth;
  varying float vFoam;
  varying vec3 vTint;

  #include <fog_pars_fragment>

  const vec2 TILE_ORIGIN = vec2(${WATER_TILE_ORIGIN.x.toFixed(4)}, ${WATER_TILE_ORIGIN.y.toFixed(4)});
  const float TILE_SIZE = ${TILE.toFixed(4)};

  float ripple(vec2 uv) {
    return texture2D(uAtlas, TILE_ORIGIN + (fract(uv) * 0.96 + 0.02) * TILE_SIZE).r;
  }

  void main() {
    vec2 p = vWorldPosition.xz * 0.05;
    float h1 = ripple(p + vec2(uTime * 0.014, uTime * 0.021));
    float h2 = ripple(p * 1.9 - vec2(uTime * 0.019, uTime * 0.011));
    float bump = (h1 + h2) * 0.5;

    // Ripples tilt the normal a little, which is what breaks the reflection up.
    vec3 N = normalize(vec3((h1 - h2) * 0.4, 1.0, (h2 - h1) * 0.3));
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // The reflection is kept partial: a lake that goes fully to sky colour at a
    // grazing angle turns pale, and the turquoise is the point.
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.6);
    vec3 base = mix(uShallow, uDeep, vDepth);
    vec3 color = mix(base, uSky, clamp(fresnel * 0.55, 0.0, 0.55));

    vec3 R = reflect(-V, N);
    float glitter = pow(max(dot(R, normalize(uSunDirection)), 0.0), 140.0);
    color += uSun * glitter * 1.5;

    color *= 0.9 + bump * 0.2;
    color = mix(color, vTint, vFoam);

    gl_FragColor = vec4(color, 0.96);

    #include <fog_fragment>
  }
`;

export function createLakeMaterial(atlas: Texture, time: IUniform<number>): ShaderMaterial {
  const uniforms = UniformsUtils.merge([
    UniformsLib.fog,
    {
      uAtlas: { value: null },
      uDeep: { value: new Color(LAKE_COLORS.deep) },
      uShallow: { value: new Color(LAKE_COLORS.shallow) },
      uSky: { value: new Color(LAKE_COLORS.reflection) },
      uSun: { value: new Color(LAKE_COLORS.glitter) },
      uSunDirection: { value: new Vector3(SUN_DIRECTION.x, SUN_DIRECTION.y, SUN_DIRECTION.z).normalize() },
    },
  ]);

  // merge() clones every uniform; the shared clock and the texture go in afterwards so
  // they stay the same objects the rest of the scene updates.
  uniforms.uTime = time;
  uniforms.uAtlas.value = atlas;

  return new ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    vertexColors: true,
    transparent: true,
    fog: true,
  });
}

import { Color, ShaderMaterial, UniformsLib, UniformsUtils, Vector3, type IUniform, type Texture } from "three";

import { LAKE_COLORS, SKY_COLORS, SUN_DIRECTION } from "./constants";
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
  uniform vec3 uSkyHigh;
  uniform vec3 uSkyMid;
  uniform vec3 uSkyLow;
  uniform vec3 uSkyHaze;
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

  // The same gradient the sky dome draws, by direction. Kept in step by hand.
  vec3 skyColor(vec3 direction) {
    float h = direction.y;
    vec3 color = mix(uSkyLow, uSkyMid, smoothstep(0.0, 0.07, h));
    color = mix(color, uSkyHigh, smoothstep(0.06, 0.3, h));
    color = mix(uSkyHaze, color, smoothstep(-0.06, 0.025, h));
    float toward = max(dot(direction, normalize(uSunDirection)), 0.0);
    return mix(color, uSkyLow, pow(toward, 6.0) * 0.55);
  }

  void main() {
    vec2 p = vWorldPosition.xz * 0.05;
    float h1 = ripple(p + vec2(uTime * 0.014, uTime * 0.021));
    float h2 = ripple(p * 1.9 - vec2(uTime * 0.019, uTime * 0.011));
    float bump = (h1 + h2) * 0.5;

    // The normal is the ripple field's gradient. A difference of two unrelated samples
    // is noise, and the glitter it produced was noise too.
    float e = 0.02;
    vec2 q1 = p + vec2(uTime * 0.014, uTime * 0.021);
    vec2 q2 = p * 1.9 - vec2(uTime * 0.019, uTime * 0.011);
    float dx = (ripple(q1 + vec2(e, 0.0)) - ripple(q1 - vec2(e, 0.0))) + (ripple(q2 + vec2(e, 0.0)) - ripple(q2 - vec2(e, 0.0))) * 0.5;
    float dz = (ripple(q1 + vec2(0.0, e)) - ripple(q1 - vec2(0.0, e))) + (ripple(q2 + vec2(0.0, e)) - ripple(q2 - vec2(0.0, e))) * 0.5;
    vec3 N = normalize(vec3(-dx * 1.3, 1.0, -dz * 1.3));
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // The sheet reflects the sky it lies under: turquoise close by, where the eye looks
    // steeply into it, and the sunset's peach and gold toward the far shore, where the
    // angle is grazing. A constant tint gave a flat cyan cut-out in a golden frame.
    vec3 R = reflect(-V, N);
    vec3 sky = skyColor(normalize(vec3(R.x, max(R.y, 0.02), R.z)));
    float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 base = mix(uShallow, uDeep, vDepth);
    vec3 color = mix(base, sky, clamp(fresnel * 1.5, 0.0, 0.42));

    float glitter = pow(max(dot(R, normalize(uSunDirection)), 0.0), 240.0);
    color += uSun * glitter * 0.8;

    color *= 0.9 + bump * 0.2;
    color = mix(color, vTint, vFoam);

    gl_FragColor = vec4(color, 1.0);

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
      uSkyHigh: { value: new Color(SKY_COLORS.high) },
      uSkyMid: { value: new Color(SKY_COLORS.mid) },
      uSkyLow: { value: new Color(SKY_COLORS.low) },
      uSkyHaze: { value: new Color(SKY_COLORS.haze) },
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
    fog: true,
  });
}

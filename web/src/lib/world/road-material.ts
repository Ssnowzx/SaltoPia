import { DoubleSide, MeshStandardMaterial, type Texture } from "three";

import { ROAD_COLORS, ROAD_SHADING } from "./constants";
import { glslFloat, linearVec3 } from "./glsl";
import { ROAD_KIND } from "./road-surfaces";

/**
 * The material every road surface draws with: asphalt, paving, kerbs, earth, gravel and
 * car parks, told apart per vertex by `roadInfo.x`.
 *
 * Markings are drawn here, from each vertex's position across and along its road, not laid
 * as ribbons of their own - a separate line mesh is one more layer to fight the carriageway
 * for depth, and it cannot know where a junction starts. Where a junction starts is baked
 * into `roadInfo.y` when the geometry is built (see road-junctions.ts). Unpaved edges fade
 * into the grass by blending toward the terrain's own colour, carried in the vertex colour,
 * so no transparency is needed. See design.md D6 of elevate-world-realism.
 *
 * Attributes: `roadFrame` = (metres across from the centreline, metres along, half-width),
 * `roadInfo` = (kind, marking weight, edge lines, crossing), `color` = the terrain's colour
 * under the vertex.
 */

interface RoadTextures {
  readonly asphalt: Texture;
  readonly earth: Texture;
  readonly grass: Texture;
}

const VERTEX_PARS = /* glsl */ `
attribute vec3 roadFrame;
attribute vec4 roadInfo;
varying vec3 vRoadFrame;
varying vec4 vRoadInfo;
varying vec2 vRoadXZ;
`;

const VERTEX_MAIN = /* glsl */ `
vRoadFrame = roadFrame;
vRoadInfo = roadInfo;
vRoadXZ = (modelMatrix * vec4(transformed, 1.0)).xz;
`;

const FRAGMENT_PARS = /* glsl */ `
uniform sampler2D uAsphalt;
uniform sampler2D uEarth;
uniform sampler2D uGrass;
varying vec3 vRoadFrame;
varying vec4 vRoadInfo;
varying vec2 vRoadXZ;

bool isKind(float kind, float value) {
  return abs(kind - value) < 0.5;
}

// A painted band of half-width w around d = 0, antialiased by the pixel's own footprint.
float paintBand(float d, float w) {
  float footprint = fwidth(d);
  return 1.0 - smoothstep(w - footprint, w + footprint, d);
}
`;

const K = ROAD_KIND;

const FRAGMENT_SURFACE = /* glsl */ `
float roadRoughness = 0.9;
{
  float kind = vRoadInfo.x;
  float lateral = vRoadFrame.x;
  float along = vRoadFrame.y;
  float halfWidth = vRoadFrame.z;
  float marking = vRoadInfo.y;
  float edgeLines = vRoadInfo.z;
  float crossing = vRoadInfo.w;
  vec3 terrain = diffuseColor.rgb;
  vec3 grass = terrain * texture2D(uGrass, vRoadXZ / ${glslFloat(ROAD_SHADING.grassFineTile)}).rgb
    * texture2D(uGrass, vRoadXZ / ${glslFloat(ROAD_SHADING.grassBroadTile)} + vec2(0.37, 0.61)).rgb * 1.12;
  float tarmac = texture2D(uAsphalt, vRoadXZ / ${glslFloat(ROAD_SHADING.asphaltTile)}).r;
  float soil = texture2D(uEarth, vRoadXZ / ${glslFloat(ROAD_SHADING.earthTile)}).r;
  vec3 color;

  if (isKind(kind, ${glslFloat(K.asphalt)}) || isKind(kind, ${glslFloat(K.parking)})) {
    // Asphalt: grain, darker polished wheel tracks, and the paint.
    color = ${linearVec3(ROAD_COLORS.asphalt)} * (0.62 + 0.76 * tarmac);
    // The polished wheel tracks belong to one road's lanes; inside a junction two roads
    // overlap, so they fade out with the markings or each road's shows through the other.
    float wheel = exp(-pow((abs(lateral) - halfWidth * 0.5) / 0.55, 2.0)) * marking;
    color *= 1.0 - 0.12 * wheel;
    roadRoughness = 0.82 - 0.1 * wheel;
    float wear = 0.7 + 0.3 * texture2D(uAsphalt, vRoadXZ / 1.7).r;
    float paint = 0.0;
    vec3 paintColor = ${linearVec3(ROAD_COLORS.line)};

    if (isKind(kind, ${glslFloat(K.parking)})) {
      // A car park: one bay line every bay's width, across the rows.
      float bay = abs(fract(along / ${glslFloat(ROAD_SHADING.bayWidth)} + 0.5) - 0.5) * ${glslFloat(ROAD_SHADING.bayWidth)};
      paint = paintBand(bay, 0.06) * step(abs(abs(lateral) - halfWidth * 0.5), halfWidth * 0.5 - 0.25);
    } else {
      float dash = step(fract(along / ${glslFloat(ROAD_SHADING.dashPeriod)}), ${glslFloat(ROAD_SHADING.dashShare)});
      float centre = paintBand(abs(lateral), ${glslFloat(ROAD_SHADING.centreHalfWidth)}) * dash * marking;
      float edge = paintBand(abs(abs(lateral) - (halfWidth - ${glslFloat(ROAD_SHADING.edgeInset)})), ${glslFloat(ROAD_SHADING.edgeHalfWidth)}) * edgeLines * marking;
      float zebra = crossing * step(0.5, fract(lateral / ${glslFloat(ROAD_SHADING.zebraPitch)} + 0.25)) * step(abs(lateral), halfWidth - 0.4);
      color = mix(color, ${linearVec3(ROAD_COLORS.centre)}, centre * wear);
      paint = max(edge, zebra);
    }
    color = mix(color, paintColor, paint * wear);
    roadRoughness = mix(roadRoughness, 0.55, paint);
  } else if (isKind(kind, ${glslFloat(K.pavement)})) {
    // Pavement: concrete slabs a metre square, the joints darker.
    vec2 slab = abs(fract(vec2(along, lateral) / ${glslFloat(ROAD_SHADING.slab)}) - 0.5);
    float joint = smoothstep(0.47, 0.495, max(slab.x, slab.y));
    color = ${linearVec3(ROAD_COLORS.pavement)} * (0.84 + 0.32 * tarmac) * (1.0 - 0.28 * joint);
    roadRoughness = 0.92;
  } else if (isKind(kind, ${glslFloat(K.kerb)})) {
    color = ${linearVec3(ROAD_COLORS.kerb)} * (0.86 + 0.28 * tarmac);
    roadRoughness = 0.88;
  } else if (isKind(kind, ${glslFloat(K.verge)})) {
    color = grass;
    roadRoughness = 1.0;
  } else {
    // Earth and gravel: ruts where the wheels run, grass down the middle, and the edges
    // giving way to the field.
    bool gravel = isKind(kind, ${glslFloat(K.gravel)});
    vec3 ground = gravel ? ${linearVec3(ROAD_COLORS.gravel)} : ${linearVec3(ROAD_COLORS.earth)};
    color = ground * (0.62 + 0.76 * soil);
    if (!gravel) {
      float rut = exp(-pow((abs(lateral) - halfWidth * 0.42) / 0.33, 2.0));
      color *= 1.0 - 0.22 * rut;
      float median = 1.0 - smoothstep(0.2, 0.5, abs(lateral));
      color = mix(color, grass, median * 0.6);
    }
    float edge = smoothstep(halfWidth * 0.55, halfWidth, abs(lateral) + (soil - 0.5) * 0.9);
    color = mix(color, grass, edge);
    roadRoughness = 1.0;
  }
  diffuseColor.rgb = color;
}
`;

export function createRoadMaterial(textures: RoadTextures): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    // Kerb faces run both ways round the network; drawn two-sided, no winding can hide one.
    side: DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAsphalt = { value: textures.asphalt };
    shader.uniforms.uEarth = { value: textures.earth };
    shader.uniforms.uGrass = { value: textures.grass };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_PARS}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_MAIN}`);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_PARS}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_SURFACE}`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = roadRoughness;");
  };

  material.customProgramCacheKey = () => "saltopia-road";
  return material;
}

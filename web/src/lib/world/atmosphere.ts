import { ShaderChunk, Vector3 } from "three";

import { ATMOSPHERE, SUN_DIRECTION } from "./constants";
import { glslFloat, linearVec3 } from "./glsl";

/**
 * Aerial perspective: the light the air scatters between the eye and whatever it looks at.
 *
 * Three's fog blends toward one colour whichever way the camera looks, and a sunset sky is
 * not one colour: toward the sun the horizon is gold, away from it the air is a cool,
 * violet-grey. With one fog colour the land toward the sun stayed cold and the land away
 * from it glowed, and the horizon showed as a band wherever the two disagreed.
 *
 * The in-scatter colour here depends on the direction of view, and the sky shader blends
 * to the same function just below the horizon - so land at infinity and sky at the horizon
 * are one colour by construction. See design.md D2.
 */

const SUN = new Vector3(SUN_DIRECTION.x, 0, SUN_DIRECTION.z).normalize();

/**
 * GLSL shared by the fog chunks and the sky: the in-scatter colour for a view direction,
 * and how much of it a given distance adds. Colours are linear, in the same scale as the
 * sky's own radiance after its exposure.
 */
export const AERIAL_GLSL = /* glsl */ `
vec3 aerialColor(vec3 direction) {
  vec2 horizontal = direction.xz;
  float horizontalLength = max(length(horizontal), 1e-4);
  float toward = max(dot(horizontal / horizontalLength, vec2(${glslFloat(SUN.x)}, ${glslFloat(SUN.z)})), 0.0);
  vec3 color = mix(${linearVec3(ATMOSPHERE.away)}, ${linearVec3(ATMOSPHERE.side)}, smoothstep(0.0, 0.55, toward));
  color = mix(color, ${linearVec3(ATMOSPHERE.sunward)}, pow(toward, 8.0));
  return color * ${glslFloat(ATMOSPHERE.brightness)};
}

float aerialAmount(float span, float near, float far) {
  float t = max(span - near, 0.0) / max(far - near, 1.0);
  return 1.0 - exp(-pow(t * ${glslFloat(ATMOSPHERE.falloff)}, ${glslFloat(ATMOSPHERE.curve)}));
}
`;

const FOG_PARS_VERTEX = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogDirection;
#endif
`;

// The world-space view vector, recovered from the view-space position by the transpose of
// the view rotation. `mvPosition` already carries the instance matrix, so instanced trees
// get the right direction without knowing they are instanced.
const FOG_VERTEX = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogDirection = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;
#endif
`;

const FOG_PARS_FRAGMENT = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogDirection;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  ${AERIAL_GLSL}
#endif
`;

const FOG_FRAGMENT = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp(- fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogFactor = aerialAmount(length(vFogDirection), fogNear, fogFar);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, aerialColor(normalize(vFogDirection)), fogFactor);
#endif
`;

let installed = false;

/**
 * Replaces three's fog chunks with aerial perspective, for every material compiled after
 * the call. Idempotent. The uniform names are three's own, so a scene's `Fog` still drives
 * the near and far distances and nothing else needs to know.
 */
export function installAerialPerspective(): void {
  if (installed) return;
  installed = true;
  ShaderChunk.fog_pars_vertex = FOG_PARS_VERTEX;
  ShaderChunk.fog_vertex = FOG_VERTEX;
  ShaderChunk.fog_pars_fragment = FOG_PARS_FRAGMENT;
  ShaderChunk.fog_fragment = FOG_FRAGMENT;
}

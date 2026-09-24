import { BackSide, ShaderMaterial, UniformsUtils, Vector3, type IUniform } from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

import { AERIAL_GLSL } from "./atmosphere";
import { ENVIRONMENT, SKY, SUN_DIRECTION } from "./constants";
import { glslFloat, vec3Literal } from "./glsl";

/**
 * The sky: the Preetham analytic daylight model and the lit cloud layer that ships with
 * three's `Sky`, on a material of our own - the shader definition is used, not the class.
 *
 * Below the horizon the sky hands over to the aerial-perspective colour the fog uses, so
 * the land dissolving into distance and the sky above it meet without a band. See
 * design.md D1 and D2 of elevate-world-realism.
 */

/** The shape of a shader definition such as `Sky.SkyShader`, which three types as `object`. */
interface ShaderDefinition {
  readonly uniforms: Record<string, IUniform>;
  readonly vertexShader: string;
  readonly fragmentShader: string;
}

function isShaderDefinition(value: object): value is ShaderDefinition {
  return "uniforms" in value && "vertexShader" in value && "fragmentShader" in value;
}

const SKY_SHADER: ShaderDefinition = (() => {
  const definition = Sky.SkyShader;
  if (!isShaderDefinition(definition)) throw new Error("three's Sky.SkyShader is not a shader definition.");
  return definition;
})();

/** The sky's clock, advanced by the scene; held still under reduced motion. */
export const SKY_CLOCK: IUniform<number> = { value: 0 };

const ORIGINAL_OUTPUT = "gl_FragColor = vec4( texColor, 1.0 );";

const HORIZON_OUTPUT = /* glsl */ `
  texColor *= ${glslFloat(SKY.exposure)};
  // A photographer's grade: the analytic sky is right about brightness and a little grey
  // about colour at a sun this low, which reads as smog rather than as a sunset.
  float skyLuma = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
  texColor = max(mix(vec3(skyLuma), texColor, ${glslFloat(SKY.saturation)}), 0.0);
  texColor *= ${vec3Literal(SKY.tint.r, SKY.tint.g, SKY.tint.b)};
  // Hand over to the air's own colour through the last few degrees above the horizon.
  float belowHorizon = 1.0 - smoothstep(-0.015, 0.05, direction.y);
  texColor = mix(texColor, aerialColor(direction), belowHorizon);
  texColor = min(texColor, vec3(${glslFloat(SKY.ceiling)}));
  #ifdef ENVIRONMENT_CEILING
    // The glow around a low sun runs to hundreds; baked into the environment it turned
    // every rough surface facing the sun into an orange mirror.
    texColor = min(texColor, vec3(ENVIRONMENT_CEILING));
  #endif
  gl_FragColor = vec4( texColor, 1.0 );
`;

function skyFragmentShader(): string {
  const source = SKY_SHADER.fragmentShader;
  if (!source.includes(ORIGINAL_OUTPUT)) {
    throw new Error("three's sky shader changed shape; the horizon hand-over cannot be applied.");
  }
  return source.replace("void main() {", `${AERIAL_GLSL}\nvoid main() {`).replace(ORIGINAL_OUTPUT, HORIZON_OUTPUT);
}

/** The sun as a unit vector - the same direction the key light and the water use. */
export const SUN_UNIT = new Vector3(SUN_DIRECTION.x, SUN_DIRECTION.y, SUN_DIRECTION.z).normalize();

/**
 * Builds the sky material.
 *
 * @param showSun - Whether to draw the sun disc. The environment map leaves it out: the
 *   key light already carries the sun, and a disc in the reflections doubles it.
 */
export function createSkyMaterial(showSun = true): ShaderMaterial {
  const uniforms = UniformsUtils.clone(SKY_SHADER.uniforms);
  uniforms.turbidity.value = SKY.turbidity;
  uniforms.rayleigh.value = SKY.rayleigh;
  uniforms.mieCoefficient.value = SKY.mieCoefficient;
  uniforms.mieDirectionalG.value = SKY.mieDirectionalG;
  uniforms.cloudCoverage.value = SKY.cloudCoverage;
  uniforms.cloudDensity.value = SKY.cloudDensity;
  uniforms.cloudElevation.value = SKY.cloudElevation;
  uniforms.cloudScale.value = SKY.cloudScale;
  uniforms.cloudSpeed.value = SKY.cloudSpeed;
  uniforms.showSunDisc.value = showSun ? 1 : 0;
  uniforms.sunPosition.value = SUN_UNIT.clone();
  // Shared, so the drawn sky and anything else reading the clock agree.
  uniforms.time = SKY_CLOCK;

  return new ShaderMaterial({
    name: "SaltopiaSky",
    uniforms,
    vertexShader: SKY_SHADER.vertexShader,
    fragmentShader: skyFragmentShader(),
    side: BackSide,
    depthWrite: false,
    defines: showSun ? {} : { ENVIRONMENT_CEILING: glslFloat(ENVIRONMENT.ceiling) },
  });
}

import { Color } from "three";

/**
 * Small helpers for writing constants into GLSL source.
 *
 * Shader constants are baked from `constants.ts` rather than passed as uniforms where they
 * never change: the palette stays defined in one place, and the compiled program carries no
 * uniform nobody updates.
 */

/** A number as a GLSL float literal - always with a decimal point, which GLSL requires. */
export function glslFloat(value: number, digits = 4): string {
  return value.toFixed(digits);
}

/** An sRGB hex colour as a linear `vec3` literal, the space lighting happens in. */
export function linearVec3(hex: string): string {
  const color = new Color(hex);
  return `vec3(${glslFloat(color.r)}, ${glslFloat(color.g)}, ${glslFloat(color.b)})`;
}

/** Three components as a `vec3` literal. */
export function vec3Literal(x: number, y: number, z: number): string {
  return `vec3(${glslFloat(x)}, ${glslFloat(y)}, ${glslFloat(z)})`;
}

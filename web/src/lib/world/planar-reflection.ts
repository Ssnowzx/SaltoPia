import { Matrix4, Plane, type PerspectiveCamera, Vector3, Vector4 } from "three";

/**
 * The geometry of a mirror in a horizontal plane - the lake's reflection.
 *
 * Pure functions over three's math types, so the arithmetic is tested on its own and the
 * render pass that uses it is left with nothing but bookkeeping. The approach is the one
 * three's `Reflector` takes, without its habit of rendering inside `onBeforeRender`, which
 * runs once per scene render and so twice a frame once ambient occlusion renders the scene
 * again. See design.md D4 of elevate-world-realism.
 */

const UP = new Vector3(0, 1, 0);

/** Maps clip space [-1, 1] to texture space [0, 1]. */
const CLIP_TO_TEXTURE = new Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);

/** Reflects a point through the horizontal plane at `height`. */
export function mirrorPoint(point: Vector3, height: number, target = new Vector3()): Vector3 {
  return target.set(point.x, 2 * height - point.y, point.z);
}

/**
 * Places `mirror` as the reflection of `source` in the plane y = `height`: position
 * mirrored, view direction and up vector reflected, projection copied.
 */
export function placeMirrorCamera(source: PerspectiveCamera, mirror: PerspectiveCamera, height: number): void {
  source.updateMatrixWorld();

  const position = new Vector3().setFromMatrixPosition(source.matrixWorld);
  const forward = new Vector3(0, 0, -1).transformDirection(source.matrixWorld);
  const up = new Vector3(0, 1, 0).transformDirection(source.matrixWorld);

  mirrorPoint(position, height, mirror.position);
  forward.reflect(UP);
  up.reflect(UP);

  mirror.up.copy(up);
  mirror.lookAt(mirror.position.clone().add(forward));
  mirror.near = source.near;
  mirror.far = source.far;
  mirror.updateMatrixWorld();
  mirror.projectionMatrix.copy(source.projectionMatrix);
  mirror.projectionMatrixInverse.copy(source.projectionMatrixInverse);
}

/**
 * Projects a world position into the mirror camera's image, as texture coordinates
 * before the perspective divide. Written into `target`, which is returned.
 */
export function reflectionTextureMatrix(mirror: PerspectiveCamera, target = new Matrix4()): Matrix4 {
  return target.copy(CLIP_TO_TEXTURE).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
}

/**
 * Replaces the mirror camera's near plane with the water plane (Lengyel's oblique
 * clipping), so nothing below the surface - the lake bed, a hull's underside - is drawn
 * into the reflection.
 *
 * @param bias - Lowers the plane a little so the shoreline does not open a seam.
 */
export function applyObliqueClip(mirror: PerspectiveCamera, height: number, bias: number): void {
  const plane = new Plane(UP.clone(), -height).applyMatrix4(mirror.matrixWorldInverse);
  const clip = new Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
  const projection = mirror.projectionMatrix;
  const e = projection.elements;

  const q = new Vector4(
    (Math.sign(clip.x) + e[8]) / e[0],
    (Math.sign(clip.y) + e[9]) / e[5],
    -1,
    (1 + e[10]) / e[14],
  );
  clip.multiplyScalar(2 / clip.dot(q));

  e[2] = clip.x;
  e[6] = clip.y;
  e[10] = clip.z + 1 - bias;
  e[14] = clip.w;
  mirror.projectionMatrixInverse.copy(projection).invert();
}

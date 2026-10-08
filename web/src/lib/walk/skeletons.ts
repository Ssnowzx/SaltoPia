import { AttachedBindMode, Matrix4, type Object3D, type Skeleton, SkinnedMesh } from "three";

/**
 * One skeleton for every part of a person.
 *
 * Cloning a person gives each skinned part its own copy of the skeleton - twelve or so per
 * person - and three recomputes every skeleton and uploads its bone texture on every render:
 * 177 skeletons for fifteen townsfolk made a long frame every few frames. The parts share
 * their bones but not their inverse bind matrices, because mesh quantization folds a
 * different dequantization into each part's. That difference is one matrix M for every
 * bone, `I_ref · M = I_part`, so it moves into the part's bind matrix instead - three skins
 * with `bone · I · bindMatrix` - and the part draws exactly where it did. See design.md D4
 * of speed-up-the-hub.
 */

/** How closely, relative to its size, each element must agree for the difference to be one matrix. */
const TOLERANCE = 1e-4;

function sameBones(reference: Skeleton, part: Skeleton): boolean {
  return reference.bones.length === part.bones.length && reference.bones.every((bone, index) => bone === part.bones[index]);
}

function agrees(actual: Matrix4, expected: Matrix4): boolean {
  return actual.elements.every((value, index) => Math.abs(value - expected.elements[index]) <= TOLERANCE * Math.max(1, Math.abs(expected.elements[index])));
}

/** The matrix M with `I_ref · M = I_part` for every bone, or null when no single one does. */
function bindDifference(reference: Skeleton, part: Skeleton): Matrix4 | null {
  const difference = reference.boneInverses[0].clone().invert().multiply(part.boneInverses[0]);
  const product = new Matrix4();
  const holds = reference.boneInverses.every((inverse, index) => agrees(product.multiplyMatrices(inverse, difference), part.boneInverses[index]));
  return holds ? difference : null;
}

/**
 * Binds every skinned part under `root` to the first part's skeleton, where the part moves
 * with the same bones and its binds differ by one matrix; any other part keeps its own.
 * Returns how many skeletons the parts use afterwards.
 */
export function shareSkeleton(root: Object3D): number {
  const parts: SkinnedMesh[] = [];
  root.traverse((node) => {
    if (node instanceof SkinnedMesh) parts.push(node);
  });
  const reference = parts[0]?.skeleton;
  if (!reference) return 0;

  const used = new Set<Skeleton>();
  for (const part of parts) {
    const own = part.skeleton;
    const difference = own !== reference && part.bindMode === AttachedBindMode && sameBones(reference, own) ? bindDifference(reference, own) : null;
    if (difference) {
      part.bindMatrix.premultiply(difference);
      part.skeleton = reference;
      own.dispose();
    }
    used.add(part.skeleton);
  }
  return used.size;
}

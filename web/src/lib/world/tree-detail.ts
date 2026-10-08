import type { TypedArray } from "three";

/**
 * Which copies of a tree are drawn in full and which simple, by their distance from the
 * camera, and the packing of each copy's matrix and tint into the batch of its detail.
 *
 * Two tree models are 92% of the world's triangles, drawn again for the sun's shadow and
 * the lake's mirror; far from the camera a simpler build of the same tree reads the same.
 * Pure, so it is tested without a scene. See design.md D3 of speed-up-the-hub.
 */

/** A tree becomes full inside this distance from the camera, in metres... */
export const FULL_DETAIL_WITHIN = 200;

/** ...and simple again only beyond this one, so a tree at the edge does not flicker. */
export const SIMPLE_DETAIL_BEYOND = 230;

/** How far the camera moves, in metres, before the trees are looked at again. */
export const DETAIL_REFRESH_DISTANCE = 2;

const FULL_WITHIN_SQUARED = FULL_DETAIL_WITHIN * FULL_DETAIL_WITHIN;
const SIMPLE_BEYOND_SQUARED = SIMPLE_DETAIL_BEYOND * SIMPLE_DETAIL_BEYOND;

/** Where a matrix keeps its translation. */
const TRANSLATION = 12;
const MATRIX_SIZE = 16;
const TINT_SIZE = 3;

/** Every copy of one tree group, in layout order. */
export interface TreeCopies {
  /** Each copy's world matrix, sixteen numbers apiece. */
  readonly matrices: Float32Array;
  /** Each copy's tint, three numbers apiece, or null for a group drawn untinted. */
  readonly tints: Float32Array | null;
  /** 1 where the copy is drawn in full, 0 where it is drawn simple. */
  readonly full: Uint8Array;
}

/** The instance buffers of one batch - an instanced mesh's own arrays. */
export interface Batch {
  readonly matrices: TypedArray;
  readonly tints: TypedArray | null;
}

/** Reassigns each copy by its distance from the camera, keeping the margin; true if any changed. */
export function assignDetail(copies: TreeCopies, cameraX: number, cameraY: number, cameraZ: number): boolean {
  const { matrices, full } = copies;
  let changed = false;
  for (let copy = 0; copy < full.length; copy += 1) {
    const at = copy * MATRIX_SIZE + TRANSLATION;
    const dx = matrices[at] - cameraX;
    const dy = matrices[at + 1] - cameraY;
    const dz = matrices[at + 2] - cameraZ;
    const squared = dx * dx + dy * dy + dz * dz;
    const next = full[copy] === 1 ? Number(squared <= SIMPLE_BEYOND_SQUARED) : Number(squared < FULL_WITHIN_SQUARED);
    if (next !== full[copy]) {
      full[copy] = next;
      changed = true;
    }
  }
  return changed;
}

/** Packs every copy into the full or the simple batch; returns how many each now holds. */
export function packBatches(copies: TreeCopies, full: Batch, simple: Batch): { readonly full: number; readonly simple: number } {
  const counts = { full: 0, simple: 0 };
  for (let copy = 0; copy < copies.full.length; copy += 1) {
    const isFull = copies.full[copy] === 1;
    const batch = isFull ? full : simple;
    const slot = isFull ? counts.full++ : counts.simple++;
    batch.matrices.set(copies.matrices.subarray(copy * MATRIX_SIZE, (copy + 1) * MATRIX_SIZE), slot * MATRIX_SIZE);
    if (copies.tints && batch.tints) batch.tints.set(copies.tints.subarray(copy * TINT_SIZE, (copy + 1) * TINT_SIZE), slot * TINT_SIZE);
  }
  return counts;
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Bone, BufferGeometry, Float32BufferAttribute, Group, Matrix4, MeshBasicMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from "three";

import { shareSkeleton } from "@/lib/walk/skeletons";

/** Hips, thigh and shin, in their rest pose. */
function legBones(): Bone[] {
  const hips = new Bone();
  hips.position.set(0, 1, 0);
  const thigh = new Bone();
  thigh.position.set(0.2, -0.1, 0);
  const shin = new Bone();
  shin.position.set(0, -0.45, 0);
  hips.add(thigh);
  thigh.add(shin);
  return [hips, thigh, shin];
}

const TRUE_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [0.2, 0.8, 0],
  [0.2, 0.5, 0.05],
  [0.25, 0.2, 0],
];

/**
 * A part of a person stored the way gltfpack stores it: positions quantized by `dequantize`'s
 * inverse, and the dequantization folded into the skin's inverse bind matrices.
 */
function quantizedPart(bones: readonly Bone[], dequantize: Matrix4, perBone: (index: number) => Matrix4 = () => new Matrix4()): SkinnedMesh {
  const inverse = dequantize.clone().invert();
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(TRUE_POSITIONS.flatMap((point) => new Vector3(...point).applyMatrix4(inverse).toArray()), 3));
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute([0, 1, 0, 0, 1, 2, 0, 0, 2, 0, 0, 0], 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute([0.5, 0.5, 0, 0, 0.3, 0.7, 0, 0, 1, 0, 0, 0], 4));
  const part = new SkinnedMesh(geometry, new MeshBasicMaterial());
  bones[0].updateMatrixWorld(true);
  const inverses = bones.map((bone, index) => bone.matrixWorld.clone().invert().multiply(dequantize).multiply(perBone(index)));
  part.bind(new Skeleton([...bones], inverses), new Matrix4());
  return part;
}

function person(parts: (bones: readonly Bone[]) => readonly SkinnedMesh[]): { readonly root: Group; readonly bones: readonly Bone[]; readonly parts: readonly SkinnedMesh[] } {
  const bones = legBones();
  const root = new Group();
  root.add(bones[0]);
  const made = parts(bones);
  for (const part of made) root.add(part);
  return { root, bones, parts: made };
}

/** Where a part's vertices are drawn, skinned, in the person's frame. */
function skinned(part: SkinnedMesh): Vector3[] {
  part.updateMatrixWorld(true);
  return TRUE_POSITIONS.map((_, index) => part.applyBoneTransform(index, new Vector3().fromBufferAttribute(part.geometry.getAttribute("position"), index)));
}

const DEQUANTIZE = new Matrix4().makeScale(0.004, 0.003, 0.005).setPosition(-0.3, 0.1, 0.2);

describe("one skeleton per person", () => {
  it("should draw every part where it was once its parts share one skeleton", () => {
    // ARRANGE - two parts quantized differently, the leg bent at the hip and the knee.
    const { root, bones, parts } = person((legs) => [quantizedPart(legs, new Matrix4()), quantizedPart(legs, DEQUANTIZE)]);
    bones[1].rotation.set(0.6, 0, 0.2);
    bones[2].rotation.set(-0.9, 0, 0);
    root.updateMatrixWorld(true);
    const before = skinned(parts[1]);

    // ACT
    const skeletons = shareSkeleton(root);

    // ASSERT
    const after = skinned(parts[1]);
    assert.equal(skeletons, 1);
    assert.equal(parts[1].skeleton, parts[0].skeleton);
    assert.ok(after.every((point, index) => point.distanceTo(before[index]) < 1e-5), `moved by ${Math.max(...after.map((point, index) => point.distanceTo(before[index])))}`);
  });

  it("should leave a part its own skeleton when its binds differ by more than one matrix", () => {
    // ARRANGE - the third bone's bind is off on its own.
    const { root, parts } = person((legs) => [quantizedPart(legs, new Matrix4()), quantizedPart(legs, DEQUANTIZE, (index) => (index === 2 ? new Matrix4().makeTranslation(0, 0.05, 0) : new Matrix4()))]);
    const own = parts[1].skeleton;

    // ACT
    const skeletons = shareSkeleton(root);

    // ASSERT
    assert.equal(skeletons, 2);
    assert.equal(parts[1].skeleton, own);
  });

  it("should leave a part on other bones its own skeleton", () => {
    // ARRANGE - a second part on a rig of its own.
    const { root, parts } = person((legs) => [quantizedPart(legs, new Matrix4())]);
    const stranger = legBones();
    const strangerPart = quantizedPart(stranger, DEQUANTIZE);
    root.add(stranger[0], strangerPart);

    // ACT
    const skeletons = shareSkeleton(root);

    // ASSERT
    assert.equal(skeletons, 2);
    assert.notEqual(strangerPart.skeleton, parts[0].skeleton);
  });
});

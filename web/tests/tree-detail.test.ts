import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Box3, type BufferGeometry, Matrix4, Vector3 } from "three";

import { MODEL_REGISTRY, SIMPLE_MODEL_REGISTRY } from "@/lib/world/neighborhood-layout";
import { type Batch, FULL_DETAIL_WITHIN, SIMPLE_DETAIL_BEYOND, type TreeCopies, assignDetail, packBatches } from "@/lib/world/tree-detail";

function triangles(geometry: BufferGeometry): number {
  return (geometry.index ? geometry.index.count : geometry.getAttribute("position").count) / 3;
}

function bounds(geometry: BufferGeometry): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

/** The largest gap between two boxes' corners, as a share of the first box's height. */
function outlineDrift(full: Box3, simple: Box3): number {
  const height = full.getSize(new Vector3()).y;
  const gaps = [full.min.x - simple.min.x, full.min.y - simple.min.y, full.min.z - simple.min.z, full.max.x - simple.max.x, full.max.y - simple.max.y, full.max.z - simple.max.z];
  return Math.max(...gaps.map(Math.abs)) / height;
}

describe("trees at two levels of detail", () => {
  it("should draw a distant araucária with under a third of the full tree's triangles", () => {
    // ARRANGE
    const full = MODEL_REGISTRY.araucaria();

    // ACT
    const simple = SIMPLE_MODEL_REGISTRY.araucaria?.();

    // ASSERT
    assert.ok(simple);
    assert.equal(triangles(full), 2668);
    assert.equal(triangles(simple), 768);
  });

  it("should draw a distant broadleaf tree with under a third of the full tree's triangles", () => {
    // ARRANGE
    const full = MODEL_REGISTRY.broadleaf();

    // ACT
    const simple = SIMPLE_MODEL_REGISTRY.broadleaf?.();

    // ASSERT
    assert.ok(simple);
    assert.equal(triangles(full), 664);
    assert.equal(triangles(simple), 184);
  });

  it("should keep every simple tree's outline within a twentieth of its height", () => {
    // ARRANGE
    const models = ["araucaria", "araucariaB", "broadleaf", "broadleafWarm"] as const;

    // ACT
    const drifts = models.map((model) => {
      const simple = SIMPLE_MODEL_REGISTRY[model]?.();
      return { model, drift: simple ? outlineDrift(bounds(MODEL_REGISTRY[model]()), bounds(simple)) : Number.POSITIVE_INFINITY };
    });

    // ASSERT
    assert.deepEqual(
      drifts.filter(({ drift }) => drift > 0.05),
      [],
    );
  });

  it("should keep a simple tree's attributes, so it shares the full tree's material", () => {
    // ARRANGE
    const full = MODEL_REGISTRY.araucariaB();

    // ACT
    const simple = SIMPLE_MODEL_REGISTRY.araucariaB?.();

    // ASSERT
    assert.ok(simple);
    assert.deepEqual(Object.keys(simple.attributes).sort(), Object.keys(full.attributes).sort());
  });
});

describe("choosing each tree's detail", () => {
  /** Copies standing on the X axis at the given distances from the origin, each tinted by its index. */
  function copiesAt(distances: readonly number[]): TreeCopies {
    const matrices = new Float32Array(distances.length * 16);
    const tints = new Float32Array(distances.length * 3);
    distances.forEach((distance, index) => {
      matrices.set(new Matrix4().makeTranslation(distance, 0, 0).elements, index * 16);
      tints.set([index, index, index], index * 3);
    });
    return { matrices, tints, full: new Uint8Array(distances.length) };
  }

  function batch(capacity: number): Batch {
    return { matrices: new Float32Array(capacity * 16), tints: new Float32Array(capacity * 3) };
  }

  it("should draw a tree near the camera in full and one far from it simple", () => {
    // ARRANGE
    const copies = copiesAt([FULL_DETAIL_WITHIN - 10, SIMPLE_DETAIL_BEYOND + 10]);

    // ACT
    assignDetail(copies, 0, 0, 0);

    // ASSERT
    assert.deepEqual([...copies.full], [1, 0]);
  });

  it("should leave a tree inside the margin as it was, whichever way the camera came", () => {
    // ARRANGE - the same distance, one tree last drawn full and one last drawn simple.
    const between = (FULL_DETAIL_WITHIN + SIMPLE_DETAIL_BEYOND) / 2;
    const copies = copiesAt([between, between]);
    copies.full[0] = 1;

    // ACT
    const changed = assignDetail(copies, 0, 0, 0);

    // ASSERT
    assert.equal(changed, false);
    assert.deepEqual([...copies.full], [1, 0]);
  });

  it("should report a change only when a tree crosses into the other detail", () => {
    // ARRANGE
    const copies = copiesAt([50]);
    assignDetail(copies, 0, 0, 0);

    // ACT
    const stayed = assignDetail(copies, 1, 0, 0);
    const left = assignDetail(copies, -SIMPLE_DETAIL_BEYOND, 0, 0);

    // ASSERT
    assert.equal(stayed, false);
    assert.equal(left, true);
    assert.equal(copies.full[0], 0);
  });

  it("should pack every tree once, with its tint, into the batch of its detail", () => {
    // ARRANGE
    const copies = copiesAt([10, 500, 20, 600]);
    assignDetail(copies, 0, 0, 0);
    const full = batch(4);
    const simple = batch(4);

    // ACT
    const counts = packBatches(copies, full, simple);

    // ASSERT
    assert.deepEqual(counts, { full: 2, simple: 2 });
    assert.deepEqual([full.matrices[12], full.matrices[28], simple.matrices[12], simple.matrices[28]], [10, 20, 500, 600]);
    assert.deepEqual([...(full.tints ?? []).slice(0, 6)], [0, 0, 0, 2, 2, 2]);
    assert.deepEqual([...(simple.tints ?? []).slice(0, 6)], [1, 1, 1, 3, 3, 3]);
  });
});

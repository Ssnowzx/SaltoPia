import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PerspectiveCamera, Vector3, Vector4 } from "three";

import { applyObliqueClip, mirrorPoint, placeMirrorCamera, reflectionTextureMatrix } from "@/lib/world/planar-reflection";

const WATER = 0.6;

function hubCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(52, 16 / 9, 0.5, 1400);
  camera.position.set(44, 104, 226);
  camera.lookAt(44, 2, -45);
  camera.updateMatrixWorld();
  return camera;
}

/** Normalised device coordinates of a world point through a camera's view and projection. */
function toNdc(camera: PerspectiveCamera, point: Vector3): Vector3 {
  const clip = new Vector4(point.x, point.y, point.z, 1)
    .applyMatrix4(camera.matrixWorldInverse)
    .applyMatrix4(camera.projectionMatrix);
  return new Vector3(clip.x / clip.w, clip.y / clip.w, clip.z / clip.w);
}

describe("planar reflection", () => {
  it("should mirror a point above the water to the same depth below it", () => {
    // ARRANGE
    const point = new Vector3(10, WATER + 7, -3);

    // ACT
    const mirrored = mirrorPoint(point, WATER);

    // ASSERT
    assert.equal(mirrored.x, 10);
    assert.ok(Math.abs(mirrored.y - (WATER - 7)) < 1e-9);
    assert.equal(mirrored.z, -3);
  });

  it("should place the mirror camera below the water, looking up at the scene", () => {
    // ARRANGE
    const source = hubCamera();
    const mirror = new PerspectiveCamera();

    // ACT
    placeMirrorCamera(source, mirror, WATER);
    const forward = new Vector3(0, 0, -1).transformDirection(mirror.matrixWorld);

    // ASSERT
    assert.ok(Math.abs(mirror.position.y - (2 * WATER - 104)) < 1e-9);
    assert.ok(forward.y > 0);
  });

  it("should see a point on the water where the real camera sees it", () => {
    // ARRANGE
    const source = hubCamera();
    const mirror = new PerspectiveCamera();
    placeMirrorCamera(source, mirror, WATER);
    const onWater = new Vector3(-20, WATER, 30);

    // ACT
    const real = toNdc(source, onWater);
    const reflected = toNdc(mirror, onWater);

    // ASSERT
    // A camera is a rotation and a mirror is not, so the mirror camera's image is the
    // reflection flipped left to right. The water samples it through the same camera,
    // so the flip cancels; what matters is that the point lands at the mirrored spot.
    assert.ok(Math.abs(real.x + reflected.x) < 1e-6);
    assert.ok(Math.abs(real.y - reflected.y) < 1e-6);
  });

  it("should map a point on the water into the unit texture square", () => {
    // ARRANGE
    const source = hubCamera();
    const mirror = new PerspectiveCamera();
    placeMirrorCamera(source, mirror, WATER);
    const matrix = reflectionTextureMatrix(mirror);

    // ACT
    const coord = new Vector4(0, WATER, -20, 1).applyMatrix4(matrix);
    const u = coord.x / coord.w;
    const v = coord.y / coord.w;

    // ASSERT
    assert.ok(u > 0 && u < 1 && v > 0 && v < 1);
  });

  it("should clip what lies under the water and keep what stands above it", () => {
    // ARRANGE
    const source = hubCamera();
    const mirror = new PerspectiveCamera();
    placeMirrorCamera(source, mirror, WATER);
    applyObliqueClip(mirror, WATER, 0);

    // ACT
    const lakeBed = toNdc(mirror, new Vector3(0, WATER - 3, -20));
    const boat = toNdc(mirror, new Vector3(0, WATER + 3, -20));

    // ASSERT
    assert.ok(lakeBed.z < -1, `lake bed ndc z ${lakeBed.z}`);
    assert.ok(boat.z > -1 && boat.z < 1, `boat ndc z ${boat.z}`);
  });
});

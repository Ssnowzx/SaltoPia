import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AnimationClip, Bone, Group, Quaternion, QuaternionKeyframeTrack, Vector3 } from "three";

import { advanceCharacterAnimation, createCharacterAnimation, disposeCharacterAnimation, updateLocomotion } from "@/lib/walk/character-animation";
import { WALK } from "@/lib/world/constants";

/** A rig like the six people's: the same bone names in every model. */
function rig(): { readonly root: Group; readonly thigh: Bone } {
  const root = new Group();
  const hips = new Bone();
  hips.name = "Hips";
  const thigh = new Bone();
  thigh.name = "UpperLegL";
  hips.add(thigh);
  root.add(hips);
  return { root, thigh };
}

/** A leg swinging forward and back about X. */
function swing(name: string, degrees: number): AnimationClip {
  const forward = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (degrees * Math.PI) / 180);
  const back = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (-degrees * Math.PI) / 180);
  const values = [...forward.toArray(), ...back.toArray(), ...forward.toArray()];
  return new AnimationClip(name, 1, [new QuaternionKeyframeTrack("UpperLegL.quaternion", [0, 0.5, 1], values)]);
}

const CLIPS = [swing("Idle", 4), swing("Walk", 35), swing("Run", 50), swing("Wave", 2)];

describe("character animation", () => {
  it("should move the legs of a second person after the first has been replaced", () => {
    // ARRANGE - the first person walks, then the visitor picks another with the same rig.
    const first = rig();
    const firstAnimation = createCharacterAnimation(first.root, CLIPS);
    updateLocomotion(firstAnimation, WALK.walkSpeed, 0);
    advanceCharacterAnimation(firstAnimation, 0.1);
    disposeCharacterAnimation(firstAnimation);
    const second = rig();
    const rest = second.thigh.quaternion.clone();
    const secondAnimation = createCharacterAnimation(second.root, CLIPS);

    // ACT - a tenth of a second into the stride, well before the swing passes the rest pose.
    updateLocomotion(secondAnimation, WALK.walkSpeed, 0);
    advanceCharacterAnimation(secondAnimation, 0.1);

    // ASSERT
    assert.ok(second.thigh.quaternion.angleTo(rest) > 0.1, `the second thigh turned by ${second.thigh.quaternion.angleTo(rest)} rad`);
  });

  it("should pose a new person at once rather than blending from its rest pose", () => {
    // ARRANGE
    const person = rig();
    const animation = createCharacterAnimation(person.root, CLIPS);
    const walkStart = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (35 * Math.PI) / 180);

    // ACT - the first frame of walking.
    updateLocomotion(animation, WALK.walkSpeed, 0);
    advanceCharacterAnimation(animation, 0);

    // ASSERT
    assert.ok(person.thigh.quaternion.angleTo(walkStart) < 0.01, `off the walk's first pose by ${person.thigh.quaternion.angleTo(walkStart)} rad`);
  });

  it("should let go of the bones it bound when it is disposed", () => {
    // ARRANGE
    const person = rig();
    const animation = createCharacterAnimation(person.root, CLIPS);
    updateLocomotion(animation, WALK.walkSpeed, 0);
    advanceCharacterAnimation(animation, 0.1);

    // ACT
    disposeCharacterAnimation(animation);

    // ASSERT
    assert.equal(animation.mixer.stats.actions.total, 0);
    assert.equal(animation.mixer.stats.bindings.total, 0);
  });
});

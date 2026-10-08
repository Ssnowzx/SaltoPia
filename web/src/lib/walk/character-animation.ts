import { type AnimationAction, type AnimationClip, AnimationMixer, LoopOnce, type Object3D } from "three";

import { WALK } from "@/lib/world/constants";

/**
 * The visitor's character's animation: a mixer of its own, rooted on the model it animates,
 * standing, walking or running to match the speed and waving on a greeting.
 *
 * Each model gets its own mixer. three caches what an animation binds to by root and track
 * name, and the six people share one rig: a mixer kept across a change of person went on
 * posing the first person's bones, and the new person's legs stood still. See design.md D1
 * of speed-up-the-hub.
 */

const CLIPS = ["Idle", "Walk", "Run", "Wave"] as const;

export type CharacterClip = (typeof CLIPS)[number];

/** How long a crossfade between clips takes, in seconds. */
const CROSSFADE = 0.25;

/** Below this speed, in metres per second, the character stands. */
const STANDING_SPEED = 0.25;

/** How far a clip's pace follows the character's speed. */
const WALK_PACE = { min: 0.6, max: 1.4 } as const;
const RUN_PACE = { min: 0.8, max: 1.3 } as const;

/** Mutated by the frame loop - three's business, not React's. */
export interface CharacterAnimation {
  readonly root: Object3D;
  readonly mixer: AnimationMixer;
  readonly actions: ReadonlyMap<CharacterClip, AnimationAction>;
  playing: AnimationAction | null;
  /** Until when, in milliseconds, a wave holds over standing still. */
  waveUntil: number;
}

export function createCharacterAnimation(root: Object3D, clips: readonly AnimationClip[]): CharacterAnimation {
  const mixer = new AnimationMixer(root);
  const actions = new Map<CharacterClip, AnimationAction>();
  for (const name of CLIPS) {
    const clip = clips.find((candidate) => candidate.name === name);
    if (clip) actions.set(name, mixer.clipAction(clip));
  }
  return { root, mixer, actions, playing: null, waveUntil: 0 };
}

/** Stops every clip and lets go of everything the mixer bound on the model. */
export function disposeCharacterAnimation(animation: CharacterAnimation): void {
  animation.mixer.stopAllAction();
  animation.mixer.uncacheRoot(animation.root);
}

/**
 * Crossfades to an action - or, when nothing plays yet, starts it at full weight, so a new
 * person stands at once instead of blending in from its rest pose.
 */
function crossfadeTo(animation: CharacterAnimation, next: AnimationAction): void {
  const previous = animation.playing;
  next.reset();
  if (previous && previous !== next) {
    next.fadeIn(CROSSFADE);
    previous.fadeOut(CROSSFADE);
  }
  next.play();
  animation.playing = next;
}

function clipFor(speed: number): "Idle" | "Walk" | "Run" {
  if (speed < STANDING_SPEED) return "Idle";
  return speed < (WALK.walkSpeed + WALK.runSpeed) / 2 ? "Walk" : "Run";
}

function pace(ratio: number, range: { readonly min: number; readonly max: number }): number {
  return Math.min(range.max, Math.max(range.min, ratio));
}

/** Waves once; standing still holds the wave until it ends. `now` is in milliseconds. */
export function playWave(animation: CharacterAnimation, now: number): void {
  const wave = animation.actions.get("Wave");
  if (!wave) return;
  wave.setLoop(LoopOnce, 1);
  wave.clampWhenFinished = true;
  crossfadeTo(animation, wave);
  animation.waveUntil = now + wave.getClip().duration * 1000;
}

/** Stands, walks or runs to match the speed, its pace following the speed. */
export function updateLocomotion(animation: CharacterAnimation, speed: number, now: number): void {
  if (now < animation.waveUntil && speed < STANDING_SPEED) return;
  const clip = clipFor(speed);
  const next = animation.actions.get(clip);
  if (!next) return;
  if (animation.playing !== next) crossfadeTo(animation, next);
  if (clip === "Walk") next.timeScale = pace(speed / WALK.walkSpeed, WALK_PACE);
  if (clip === "Run") next.timeScale = pace(speed / WALK.runSpeed, RUN_PACE);
}

export function advanceCharacterAnimation(animation: CharacterAnimation, delta: number): void {
  animation.mixer.update(delta);
}

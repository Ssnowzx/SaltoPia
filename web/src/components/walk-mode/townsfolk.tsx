"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { type AnimationAction, type AnimationClip, AnimationMixer, type Group, type Material, Mesh, type Object3D, SkinnedMesh } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

import { runWhenIdle } from "@/lib/idle-work";
import { CHARACTERS, CHARACTER_KEYS, type CharacterKey } from "@/lib/walk/characters";
import { leaveCrowd, placeInCrowd, visitorPosition } from "@/lib/walk/crowd";
import { prepareWalkWorld, walkWorld } from "@/lib/walk/navigator";
import { type TownsfolkClip, type TownspersonSpec, type TownspersonState, initialState, stepTownsperson, townsfolkPlans } from "@/lib/walk/townsfolk";
import { WALK } from "@/lib/world/constants";

import { applyColours, cloneMaterial } from "./recolour";
import { characterScale } from "./walk-character";

/**
 * The community's people: the same six CC0 people as the visitor's character, each a clone
 * with its own bones, colours and animation, strolling or standing as its plan says. They
 * arrive after the world has been drawn. See design.md of add-living-townsfolk.
 */

interface TownsfolkProps {
  readonly reducedMotion: boolean;
}

const CLIPS: readonly TownsfolkClip[] = ["Idle", "Walk", "Wave", "Interact"];

/** How long a crossfade between clips takes, in seconds. */
const CROSSFADE = 0.3;

/** Beyond this distance from the camera a person casts no shadow and animates at a lower rate. */
const NEAR = 70;
/** Far away, the mixer is advanced once every so many frames, with the time gathered since. */
const FAR_FRAME_INTERVAL = 4;
/** Room round the rest pose for swinging arms, so a gesture is never culled. */
const BOUNDS_MARGIN = 1.25;
/** The grid heights are cached at, in metres: a stroller treads the same ground every lap. */
const HEIGHT_CELL = 0.25;

interface Rig {
  readonly root: Object3D;
  readonly mixer: AnimationMixer;
  readonly actions: ReadonlyMap<TownsfolkClip, AnimationAction>;
  readonly meshes: readonly Mesh[];
}

/** What the frame loop keeps between frames - three's business, not React's. */
interface Runtime {
  state: TownspersonState;
  playing: AnimationAction | null;
  frame: number;
  gathered: number;
}

const HEIGHTS = new Map<string, number>();

/** The height the feet stand at, cached on a fine grid: a lookup crosses every road. */
function heightAt(x: number, z: number): number {
  const key = `${Math.round(x / HEIGHT_CELL)},${Math.round(z / HEIGHT_CELL)}`;
  const cached = HEIGHTS.get(key);
  if (cached !== undefined) return cached;
  const height = walkWorld().heightAt(x, z);
  HEIGHTS.set(key, height);
  return height;
}

/** Clones a model with its own bones and its own materials, recoloured and scaled. */
function buildRig(scene: Object3D, animations: readonly AnimationClip[], spec: TownspersonSpec): Rig {
  const root = cloneSkinned(scene);
  root.updateMatrixWorld(true);
  root.scale.setScalar(characterScale(root));

  const copies = new Map<Material, Material>();
  const byName: Record<string, Material> = {};
  const copyOf = (material: Material): Material => {
    const existing = copies.get(material);
    if (existing) return existing;
    const copy = cloneMaterial(material);
    copies.set(material, copy);
    byName[copy.name] = copy;
    return copy;
  };
  const meshes: Mesh[] = [];
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.material = Array.isArray(node.material) ? node.material.map(copyOf) : copyOf(node.material);
    node.castShadow = true;
    node.receiveShadow = true;
    meshes.push(node);
  });
  applyColours(byName, spec.model, spec.outfit, spec.skin);

  const mixer = new AnimationMixer(root);
  const actions = new Map<TownsfolkClip, AnimationAction>();
  for (const name of CLIPS) {
    const clip = animations.find((candidate) => candidate.name === name);
    if (clip) actions.set(name, mixer.clipAction(clip));
  }
  return { root, mixer, actions, meshes };
}

/**
 * Bounds from the rest pose, with room for the arms: culled against them, a person off
 * screen costs nothing in any pass - the view, the shadow or the lake's mirror.
 */
function fitBounds(rig: Rig): void {
  rig.root.updateMatrixWorld(true);
  for (const mesh of rig.meshes) {
    if (!(mesh instanceof SkinnedMesh)) continue;
    mesh.computeBoundingSphere();
    if (mesh.boundingSphere) mesh.boundingSphere.radius *= BOUNDS_MARGIN;
  }
}

function play(rig: Rig, runtime: Runtime, clip: TownsfolkClip, speed: number): void {
  const next = rig.actions.get(clip) ?? rig.actions.get("Idle");
  if (!next) return;
  if (runtime.playing !== next) {
    next.reset().fadeIn(CROSSFADE).play();
    runtime.playing?.fadeOut(CROSSFADE);
    runtime.playing = next;
  }
  if (clip === "Walk") next.timeScale = Math.min(1.2, Math.max(0.6, speed / WALK.walkSpeed));
}

/** Advances the animation: every frame nearby, every few frames far away. */
function animate(rig: Rig, runtime: Runtime, delta: number, near: boolean): void {
  runtime.frame += 1;
  runtime.gathered += delta;
  if (!near && runtime.frame % FAR_FRAME_INTERVAL !== 0) return;
  rig.mixer.update(runtime.gathered);
  runtime.gathered = 0;
}

function setShadows(rig: Rig, cast: boolean): void {
  if (rig.meshes[0]?.castShadow === cast) return;
  for (const mesh of rig.meshes) mesh.castShadow = cast;
}

function place(group: Group | null, state: TownspersonState): void {
  if (!group) return;
  group.position.set(state.x, heightAt(state.x, state.z), state.z);
  group.rotation.set(0, state.heading, 0);
}

interface TownspersonProps {
  readonly spec: TownspersonSpec;
  readonly scene: Object3D;
  readonly animations: readonly AnimationClip[];
  readonly reducedMotion: boolean;
}

function Townsperson({ spec, scene, animations, reducedMotion }: TownspersonProps): React.ReactElement {
  const group = useRef<Group>(null);
  const rig = useMemo(() => buildRig(scene, animations, spec), [scene, animations, spec]);
  // Each starts its frame count at its own number, so the far ones do not all animate on
  // the same frame.
  const runtime = useRef<Runtime>({ state: initialState(spec), playing: null, frame: Number(spec.id.replace(/\D/g, "")) || 0, gathered: 0 });

  useLayoutEffect(() => {
    place(group.current, runtime.current.state);
    fitBounds(rig);
  }, [rig]);

  useEffect(() => () => {
    rig.mixer.stopAllAction();
    leaveCrowd(spec.id);
  }, [rig, spec.id]);

  useFrame(({ camera, clock }, delta) => {
    const current = runtime.current;
    current.state = stepTownsperson(current.state, spec, clock.elapsedTime, Math.min(delta, 0.05), visitorPosition(), reducedMotion);
    place(group.current, current.state);
    placeInCrowd(spec.id, current.state.x, current.state.z);
    const near = camera.position.distanceTo(group.current?.position ?? camera.position) < NEAR;
    setShadows(rig, near);
    play(rig, current, current.state.clip, current.state.speed);
    animate(rig, current, delta, near);
  });

  return (
    <group ref={group}>
      <primitive object={rig.root} />
    </group>
  );
}

/** Everyone drawn from one model, which loads on its own. */
function ModelCrowd({ model, people, reducedMotion }: { readonly model: CharacterKey; readonly people: readonly TownspersonSpec[]; readonly reducedMotion: boolean }): React.ReactElement {
  // Draco off, meshopt on - as for the visitor's character.
  const gltf = useGLTF(CHARACTERS[model].path, false, true);
  return (
    <>
      {people.map((spec) => (
        <Townsperson key={spec.id} spec={spec} scene={gltf.scene} animations={gltf.animations} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}

/**
 * Builds the walk world the townsfolk stand on in idle moments, a slice at a time - built in
 * one go it held a frame for 140 ms - and reports when it is ready.
 */
function useWalkWorldReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => runWhenIdle(prepareWalkWorld, () => setReady(true)), []);
  return ready;
}

export function Townsfolk({ reducedMotion }: TownsfolkProps): React.ReactElement | null {
  const ready = useWalkWorldReady();
  const byModel = useMemo(() => {
    const people = townsfolkPlans();
    return CHARACTER_KEYS.map((model) => ({ model, people: people.filter((person) => person.model === model) })).filter((group) => group.people.length > 0);
  }, []);
  if (!ready) return null;
  return (
    <>
      {byModel.map(({ model, people }) => (
        // A model that fails to arrive leaves its people out; it must not take the hub with it.
        <ErrorBoundary key={model} fallback={null}>
          <Suspense fallback={null}>
            <ModelCrowd model={model} people={people} reducedMotion={reducedMotion} />
          </Suspense>
        </ErrorBoundary>
      ))}
    </>
  );
}

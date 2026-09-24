"use client";

import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { type AnimationAction, Box3, type Color, type Group, LoopOnce, type Material, Mesh, MeshStandardMaterial, type Object3D, Vector3 } from "three";

import { CHARACTERS, type CharacterConfig, OUTFIT_COLORS, SKIN_TONES, displayName } from "@/lib/walk/characters";
import type { Walker } from "@/lib/walk/movement";
import { WALK } from "@/lib/world/constants";

/**
 * The visitor's character: a CC0 person loaded when walk mode opens, recoloured to the
 * visitor's choices, scaled to 1.75 m, and animated standing, walking or running to match
 * its speed. See design.md D1 of add-walking-character.
 */

interface WalkCharacterProps {
  readonly config: CharacterConfig;
  /** Read every frame for the speed the animation follows. */
  readonly walker: { readonly current: Walker };
  /** Bumped to make the character wave - on arriving somewhere, on being created. */
  readonly greeting: number;
}

/** How far over the head the name floats, in metres. */
const NAME_TAG_LIFT = 0.3;

/** How long a crossfade between clips takes, in seconds. */
const CROSSFADE = 0.25;

/** Each material's own colour, kept so "Original" can put it back. */
const ORIGINAL_COLORS = new WeakMap<Material, Color>();

function recolour(material: Material, hex: string | null): void {
  if (!(material instanceof MeshStandardMaterial)) return;
  if (!ORIGINAL_COLORS.has(material)) ORIGINAL_COLORS.set(material, material.color.clone());
  const original = ORIGINAL_COLORS.get(material);
  if (hex === null) {
    if (original) material.color.copy(original);
  } else {
    material.color.set(hex);
  }
}

function clipFor(speed: number): "Idle" | "Walk" | "Run" {
  if (speed < 0.25) return "Idle";
  return speed < (WALK.walkSpeed + WALK.runSpeed) / 2 ? "Walk" : "Run";
}

/** The animation state, mutated by the frame loop - three's business, not React's. */
interface AnimationState {
  actions: Partial<Record<string, AnimationAction | null>>;
  playing: AnimationAction | null;
  waveUntil: number;
}

function prepareScene(scene: Object3D): void {
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    // A skinned mesh's bounds are its bind pose; walking out of them made it vanish.
    node.frustumCulled = false;
  });
}

function applyColours(materials: Record<string, Material>, config: CharacterConfig): void {
  const model = CHARACTERS[config.model];
  for (const name of model.outfitMaterials) {
    const material = materials[name];
    if (material) recolour(material, OUTFIT_COLORS[config.outfit].hex);
  }
  const skin = materials[model.skinMaterial];
  if (skin) recolour(skin, SKIN_TONES[config.skin].hex);
}

function playWave(state: AnimationState): void {
  const wave = state.actions.Wave;
  if (!wave) return;
  wave.reset().setLoop(LoopOnce, 1).fadeIn(CROSSFADE).play();
  wave.clampWhenFinished = true;
  state.playing?.fadeOut(CROSSFADE);
  state.playing = wave;
  state.waveUntil = performance.now() + wave.getClip().duration * 1000;
}

function updateLocomotion(state: AnimationState, speed: number): void {
  if (performance.now() < state.waveUntil && speed < 0.25) return;
  const clip = clipFor(speed);
  const next = state.actions[clip];
  if (!next) return;
  if (state.playing !== next) {
    next.reset().fadeIn(CROSSFADE).play();
    state.playing?.fadeOut(CROSSFADE);
    state.playing = next;
  }
  if (clip === "Walk") next.timeScale = Math.min(1.4, Math.max(0.6, speed / WALK.walkSpeed));
  if (clip === "Run") next.timeScale = Math.min(1.3, Math.max(0.8, speed / WALK.runSpeed));
}

export function WalkCharacter({ config, walker, greeting }: WalkCharacterProps): React.ReactElement {
  // Draco off: drei would fetch its decoder from a CDN. The files are meshopt-compressed,
  // and that decoder ships in the bundle.
  const gltf = useGLTF(CHARACTERS[config.model].path, false, true);
  const rig = useRef<Group>(null);
  const { actions } = useAnimations(gltf.animations, rig);
  const animation = useRef<AnimationState>({ actions, playing: null, waveUntil: 0 });

  const scale = useMemo(() => {
    const height = new Box3().setFromObject(gltf.scene).getSize(new Vector3()).y;
    return height > 0 ? WALK.height / height : 1;
  }, [gltf.scene]);

  useLayoutEffect(() => prepareScene(gltf.scene), [gltf.scene]);
  useLayoutEffect(() => applyColours(gltf.materials, config), [gltf.materials, config]);

  useEffect(() => {
    animation.current.actions = actions;
    animation.current.playing = null;
  }, [actions]);

  useEffect(() => {
    if (greeting > 0) playWave(animation.current);
  }, [greeting]);

  useFrame(() => updateLocomotion(animation.current, walker.current.speed));

  return (
    <group>
      <group ref={rig} scale={scale}>
        <primitive object={gltf.scene} />
      </group>
      <Html position={[0, WALK.height + NAME_TAG_LIFT, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap rounded-full bg-mist/90 px-2.5 py-0.5 font-sans text-xs font-bold text-bark shadow-md">
          {displayName(config)}
        </span>
      </Html>
    </group>
  );
}

"use client";

import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Box3, Mesh, type Object3D, Vector3 } from "three";

import {
  type CharacterAnimation,
  advanceCharacterAnimation,
  createCharacterAnimation,
  disposeCharacterAnimation,
  playWave,
  updateLocomotion,
} from "@/lib/walk/character-animation";
import { CHARACTERS, type CharacterConfig, displayName } from "@/lib/walk/characters";
import type { Walker } from "@/lib/walk/movement";
import { WALK } from "@/lib/world/constants";

import { applyColours } from "./recolour";

/**
 * The visitor's character: a CC0 person loaded when walk mode opens, recoloured to the
 * visitor's choices, scaled to 1.75 m, and animated standing, walking or running to match
 * its speed. See design.md D1 of add-walking-character and D1 of speed-up-the-hub.
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

/** The scale that makes a character's model its height, from the model's own bounds. */
export function characterScale(scene: Object3D): number {
  const height = new Box3().setFromObject(scene).getSize(new Vector3()).y;
  return height > 0 ? WALK.height / height : 1;
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

export function WalkCharacter({ config, walker, greeting }: WalkCharacterProps): React.ReactElement {
  // Draco off: drei would fetch its decoder from a CDN. The files are meshopt-compressed,
  // and that decoder ships in the bundle.
  const gltf = useGLTF(CHARACTERS[config.model].path, false, true);
  const animation = useRef<CharacterAnimation | null>(null);

  const scale = useMemo(() => characterScale(gltf.scene), [gltf.scene]);

  useLayoutEffect(() => prepareScene(gltf.scene), [gltf.scene]);
  useLayoutEffect(() => applyColours(gltf.materials, config.model, config.outfit, config.skin), [gltf.materials, config]);

  // A mixer of its own for each person, let go with it: one kept across a change of person
  // went on posing the previous person's bones.
  useLayoutEffect(() => {
    const created = createCharacterAnimation(gltf.scene, gltf.animations);
    animation.current = created;
    return () => {
      disposeCharacterAnimation(created);
      animation.current = null;
    };
  }, [gltf.scene, gltf.animations]);

  useEffect(() => {
    if (greeting > 0 && animation.current) playWave(animation.current, performance.now());
  }, [greeting]);

  useFrame((_, delta) => {
    const current = animation.current;
    if (!current) return;
    updateLocomotion(current, walker.current.speed, performance.now());
    advanceCharacterAnimation(current, delta);
  });

  return (
    <group>
      <group scale={scale}>
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

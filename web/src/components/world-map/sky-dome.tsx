"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BoxGeometry, CircleGeometry, Color, Mesh, MeshBasicMaterial, PMREMGenerator, Scene } from "three";

import { ENVIRONMENT, SKY } from "@/lib/world/constants";
import { SKY_CLOCK, createSkyMaterial } from "@/lib/world/sky";

/**
 * The sky and the light it throws.
 *
 * The sky is drawn with the Preetham model and its cloud layer; the sun is the model's
 * own HDR disc, which alone crosses the bloom threshold. Once at load the same sky, with
 * the sun left out, is baked into a prefiltered environment map: every lit surface takes
 * its ambient light and its reflections from it, so the shade under an eave and the sky
 * in a window are the sky that is actually there. See design.md D1 of elevate-world-realism.
 */

interface SkyDomeProps {
  /** Holds the clouds still - world-appearance spec, ambient motion. */
  readonly reducedMotion: boolean;
}

/** How far below the environment's centre the bounce-light ground sits. */
const ENVIRONMENT_GROUND_DEPTH = 40;
/** Blur of the prefiltered environment's sharpest level, in radians. */
const ENVIRONMENT_SIGMA = 0.02;

/**
 * Bakes the sky into `scene.environment`. A scene of its own - the sky box without its sun,
 * and a ground disc for bounce light - so the environment never contains the world itself.
 */
function useSkyEnvironment(): void {
  // Read through the store's getter: the scene is three's to mutate, not React's.
  const get = useThree((state) => state.get);

  useEffect(() => {
    const { gl, scene } = get();
    const generator = new PMREMGenerator(gl);
    const environmentScene = new Scene();
    const skyMaterial = createSkyMaterial(false);
    const skyGeometry = new BoxGeometry(1, 1, 1);
    const sky = new Mesh(skyGeometry, skyMaterial);
    sky.scale.setScalar(SKY.scale);
    environmentScene.add(sky);

    const groundMaterial = new MeshBasicMaterial({ color: new Color(ENVIRONMENT.ground) });
    const groundGeometry = new CircleGeometry(SKY.scale, 32);
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -ENVIRONMENT_GROUND_DEPTH;
    environmentScene.add(ground);

    const target = generator.fromScene(environmentScene, ENVIRONMENT_SIGMA, 0.1, SKY.scale * 2);
    scene.environment = target.texture;
    scene.environmentIntensity = ENVIRONMENT.intensity;

    return () => {
      scene.environment = null;
      target.dispose();
      generator.dispose();
      skyMaterial.dispose();
      skyGeometry.dispose();
      groundMaterial.dispose();
      groundGeometry.dispose();
    };
  }, [get]);
}

export function SkyDome({ reducedMotion }: SkyDomeProps): React.ReactElement {
  const material = useMemo(() => createSkyMaterial(true), []);

  useSkyEnvironment();

  useFrame((_, delta) => {
    if (!reducedMotion) SKY_CLOCK.value += delta;
  });

  return (
    // The sky's vertex shader pins every fragment to the far plane, so the box only has
    // to enclose the camera; it is never culled, because its bounds are irrelevant.
    <mesh material={material} scale={SKY.scale} frustumCulled={false} renderOrder={-1}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useRef, useState } from "react";
import { PCFSoftShadowMap } from "three";

import { SiteHeader } from "@/components/site-header";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CAMERA, FOG, RENDERER, SKY_COLORS, WORLD_COLORS } from "@/lib/world/constants";
import type { Place } from "@/types";

import { CameraRig } from "./camera-rig";
import { Clouds } from "./clouds";
import { IntroOverlay } from "./intro-overlay";
import { Neighborhood } from "./neighborhood";
import { PinOverlay, type PinNodes } from "./pin-overlay";
import { PinProjector } from "./pin-projector";
import { PlaceCard } from "./place-card";
import { PostEffects } from "./post-effects";
import { SkyDome } from "./sky-dome";
import { Smoke } from "./smoke";
import { Vehicles } from "./vehicles";
import { WorldMaterialsProvider } from "./world-materials-context";

/**
 * The 3D neighbourhood hub.
 *
 * Owns the canvas and the state the scene and the interface share: whether the
 * visitor has started exploring, which place the camera is flying to, and whether a
 * flight is in progress.
 */

interface WorldMapProps {
  readonly places: readonly Place[];
}

export function WorldMap({ places }: WorldMapProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
  const [exploring, setExploring] = useState(false);
  const [focus, setFocus] = useState<Place | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const pinNodes: PinNodes = useRef(new Map());

  const handleFlightStart = useCallback(() => setIsFlying(true), []);
  const handleFlightEnd = useCallback(() => setIsFlying(false), []);
  const handleExplore = useCallback(() => setExploring(true), []);
  const handleClose = useCallback(() => setFocus(null), []);

  const cardOpen = focus !== null && !isFlying;

  return (
    <div className="relative h-full w-full">
      {/* The wrapper takes the blur when a modal dialog opens; the place card is not
          modal - the point of the flight is to see the place sharp behind it. */}
      <div className="h-full w-full transition-[filter] duration-300 ease-out">
        <Canvas
          // Capped so a dense display cannot multiply fragment cost - world-map spec.
          dpr={[1, RENDERER.maxPixelRatio]}
          shadows={{ type: PCFSoftShadowMap }}
          camera={{
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
            position: [...CAMERA.initialPosition],
          }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[SKY_COLORS.haze]} />
          <fog attach="fog" args={[SKY_COLORS.haze, FOG.near, FOG.far]} />

          {/* Low warm sun from the side, cool bounce from the sky. */}
          <directionalLight
            position={[-70, 96, 58]}
            intensity={2.2}
            color="#ffd9a0"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-140}
            shadow-camera-right={140}
            shadow-camera-top={140}
            shadow-camera-bottom={-140}
            shadow-camera-far={460}
            shadow-bias={-0.0005}
            shadow-normalBias={0.06}
            shadow-intensity={0.75}
          />
          <hemisphereLight args={[SKY_COLORS.high, WORLD_COLORS.grass, 1.3]} position={[0, 60, 0]} />
          <ambientLight intensity={0.7} color={SKY_COLORS.haze} />

          <Suspense fallback={null}>
            <WorldMaterialsProvider>
              <SkyDome />
              <Neighborhood />
              <Clouds />
              <Vehicles />
              <Smoke />
            </WorldMaterialsProvider>
            <PostEffects />
          </Suspense>

          <PinProjector places={places} nodes={pinNodes} hidden={!exploring || isFlying} />

          <CameraRig
            focus={focus}
            reducedMotion={reducedMotion}
            onFlightStart={handleFlightStart}
            onFlightEnd={handleFlightEnd}
          />
        </Canvas>
      </div>

      {exploring ? <PinOverlay places={places} nodes={pinNodes} onSelect={setFocus} /> : null}
      {exploring ? <SiteHeader places={places} /> : null}
      {cardOpen && focus ? <PlaceCard place={focus} onClose={handleClose} /> : null}
      {exploring ? null : <IntroOverlay onExplore={handleExplore} />}
    </div>
  );
}

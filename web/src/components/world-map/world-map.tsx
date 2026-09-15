"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CAMERA, RENDERER, SKY_COLORS, WORLD_COLORS } from "@/lib/world/constants";
import type { Place } from "@/types";

import { CameraRig } from "./camera-rig";
import { Neighborhood } from "./neighborhood";
import { SkyDome } from "./sky-dome";

/**
 * The 3D neighbourhood hub.
 *
 * Owns the canvas and the one piece of state the scene and the interface both need:
 * which place, if any, the camera is currently flying to.
 */

interface WorldMapProps {
  readonly places: readonly Place[];
}

export function WorldMap({ places }: WorldMapProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
  const [focus, setFocus] = useState<Place | null>(null);
  const [isFlying, setIsFlying] = useState(false);

  const handleFlightStart = useCallback(() => setIsFlying(true), []);
  const handleFlightEnd = useCallback(() => setIsFlying(false), []);

  return (
    <div className="relative h-full w-full">
      <Canvas
        // Capped so a dense display cannot multiply fragment cost - world-map spec.
        dpr={[1, RENDERER.maxPixelRatio]}
        shadows
        camera={{
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
          position: [...CAMERA.initialPosition],
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[SKY_COLORS.haze]} />
        <fog attach="fog" args={[SKY_COLORS.haze, 430, 1150]} />

        {/* Low warm sun from behind the ridge, cool bounce from the sky. */}
        <directionalLight
          position={[-70, 96, 58]}
          intensity={2.4}
          color="#ffd9a0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-130}
          shadow-camera-right={130}
          shadow-camera-top={130}
          shadow-camera-bottom={-130}
          shadow-camera-far={420}
          shadow-bias={-0.0006}
          shadow-normalBias={0.05}
        />
        <hemisphereLight
          args={[SKY_COLORS.high, WORLD_COLORS.grass, 1.5]}
          position={[0, 60, 0]}
        />
        <ambientLight intensity={0.85} color={SKY_COLORS.haze} />

        <Suspense fallback={null}>
          <SkyDome />
          <Neighborhood />
        </Suspense>

        <CameraRig
          focus={focus}
          reducedMotion={reducedMotion}
          onFlightStart={handleFlightStart}
          onFlightEnd={handleFlightEnd}
        />
      </Canvas>

      {/*
        Temporary controls while the pin overlay is built. These are the flight targets
        the pins will trigger, exercised from plain buttons so the camera work can be
        verified before the overlay exists.
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 p-4">
        {places.map((place) => (
          <button
            key={place.slug}
            type="button"
            onClick={() => setFocus(place)}
            disabled={isFlying}
            className="pointer-events-auto rounded-full bg-mist/90 px-3 py-1.5 text-xs font-semibold text-bark shadow-sm transition-transform duration-200 hover:scale-105 disabled:opacity-40"
          >
            {place.name}
          </button>
        ))}
      </div>
    </div>
  );
}

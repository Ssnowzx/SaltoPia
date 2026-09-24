"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type DirectionalLight, Object3D, PCFShadowMap } from "three";

import { SiteHeader } from "@/components/site-header";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { installAerialPerspective } from "@/lib/world/atmosphere";
import { CAMERA, FOG, QUALITY_TIERS, SHADOW, SKY_COLORS, SUN_LIGHT } from "@/lib/world/constants";
import type { Place } from "@/types";

import { CameraRig } from "./camera-rig";
import { IntroOverlay } from "./intro-overlay";
import { LakeReflection } from "./lake-reflection";
import { Neighborhood } from "./neighborhood";
import { PinOverlay, type PinNodes } from "./pin-overlay";
import { PinProjector } from "./pin-projector";
import { PlaceCard } from "./place-card";
import { PostEffects } from "./post-effects";
import { useQualityTier } from "./quality-tier";
import { SceneReady } from "./scene-ready";
import { ViewportFraming } from "./viewport-framing";
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

/**
 * The key light, aimed at the middle of the community. A directional light shines at
 * its target, and the default target is the origin - out in the bay.
 */
function SunLight(): React.ReactElement {
  const lightRef = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);

  useEffect(() => {
    target.position.set(SUN_TARGET.x, SUN_TARGET.y, SUN_TARGET.z);
    target.updateMatrixWorld();
    const light = lightRef.current;
    if (light) light.target = target;
  }, [target]);

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={lightRef}
        position={[SUN_LIGHT.position.x, SUN_LIGHT.position.y, SUN_LIGHT.position.z]}
        intensity={SUN_LIGHT.intensity}
        color={SUN_LIGHT.color}
        castShadow
        // The frustum has to contain everything that receives shadow: past its edge a
        // fragment samples outside the depth map and comes back fully shadowed, which
        // once drew a dark slab with a hard diagonal edge across half the frame.
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-380}
        shadow-camera-right={380}
        shadow-camera-top={380}
        shadow-camera-bottom={-380}
        shadow-camera-near={1}
        shadow-camera-far={1400}
        shadow-bias={-0.0003}
        // One shadow texel is about 0.19 world units here; the bias has to clear the
        // roads' own depth without lifting the shadows off the trees' feet.
        shadow-normalBias={0.5}
        shadow-intensity={0.82}
        shadow-radius={SHADOW.radius}
      />
    </>
  );
}

// Every material compiled from here on takes aerial perspective instead of flat fog.
installAerialPerspective();

/** How long the entry waits for the world before opening regardless. */
const ENTRY_TIMEOUT_MS = 8000;

/** Session-storage key set once the visitor has entered the world. */
const EXPLORED_KEY = "saltopia:explored";

/**
 * Whether this load is a return to the hub from inside the site.
 *
 * The flag alone is not enough: it lives for the whole tab session, so once the visitor
 * had entered the world, every later reload skipped the title state and the site
 * appeared to jump straight into the map. Only a browser-back, or a navigation whose
 * referrer is one of our own pages, counts as coming back. A reload, a typed address or
 * a fresh visit opens on the title, which is what the page-transitions spec asks for.
 */
function readExplored(): boolean {
  try {
    if (window.sessionStorage.getItem(EXPLORED_KEY) !== "1") return false;

    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entry?.type === "back_forward") return true;
    if (entry?.type === "reload") return false;
    return document.referrer.startsWith(`${window.location.origin}/`);
  } catch {
    // Storage or the timing entry can be unavailable; the title state simply plays.
    return false;
  }
}

/** Session storage raises no events within a tab; the value is read once per render. */
function subscribeToNothing(): () => void {
  return () => undefined;
}

/** Where the key light points: the middle of the community. */
const SUN_TARGET = SUN_LIGHT.target;

/**
 * The frame rates the performance monitor holds between: it steps quality down only on a
 * sustained drop under the lower bound. At its default of 50 the development build, which
 * runs well under the production one, dropped a fast machine to the lowest tier at once.
 */
function performanceBounds(): [number, number] {
  return [QUALITY_FLOOR_FPS, QUALITY_CEILING_FPS];
}

const QUALITY_FLOOR_FPS = 30;
const QUALITY_CEILING_FPS = 60;

export function WorldMap({ places }: WorldMapProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
  const { tier, decline } = useQualityTier();
  const quality = QUALITY_TIERS[tier];
  const [entered, setEntered] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  // A backstop: if the first frame never arrives - a device that cannot build the scene,
  // a context that fails - the way in opens anyway rather than leaving the visitor on a
  // sky that never clears. This is judged live on a machine nobody has tested.
  useEffect(() => {
    const timer = window.setTimeout(() => setSceneReady(true), ENTRY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);
  // Coming back from a place page must not replay the title state - page-transitions
  // spec. The flag lives in session storage, which survives the full-document
  // navigation, and is read as external state so the first client render agrees with
  // the server's.
  const exploredBefore = useSyncExternalStore(subscribeToNothing, readExplored, () => false);
  const exploring = entered || exploredBefore;
  const [focus, setFocus] = useState<Place | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const pinNodes: PinNodes = useRef(new Map());

  const handleFlightStart = useCallback(() => setIsFlying(true), []);
  const handleFlightEnd = useCallback(() => setIsFlying(false), []);
  const handleExplore = useCallback(() => {
    setEntered(true);
    try {
      window.sessionStorage.setItem(EXPLORED_KEY, "1");
    } catch {
      // Storage can be unavailable; nothing to remember.
    }
  }, []);
  const handleClose = useCallback(() => setFocus(null), []);

  const cardOpen = focus !== null && !isFlying;

  // Read in the card's effect, not here: a ref's value is not something a render may
  // look at, and the node it points to is written by the projector every frame.
  const getPinNode = useCallback((slug: string) => pinNodes.current.get(slug) ?? null, []);

  return (
    // The quality tier in use, readable from the page - for tests and for asking "which
    // tier is the demo machine on?" without opening the console.
    <div className="relative h-full w-full" data-quality={tier}>
      {/* A hair of blur while the card is open: enough to sit the card forward without
          losing the place the camera just flew to, which is the point of the flight. */}
      <div
        className={`h-full w-full touch-none transition-[filter] duration-300 ease-out ${cardOpen ? "blur-[3px]" : ""}`}
      >
        <Canvas
          // Capped so a dense display cannot multiply fragment cost - world-map spec.
          dpr={[1, quality.maxPixelRatio]}
          shadows={{ type: PCFShadowMap }}
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

          {/* The warm key is the sun; the fill is the sky itself, baked into the
              environment by SkyDome - no hemisphere or ambient stand-ins. */}
          <SunLight />

          <Suspense fallback={null}>
            <WorldMaterialsProvider reducedMotion={reducedMotion}>
              <SkyDome reducedMotion={reducedMotion} />
              <Neighborhood />
              <LakeReflection scale={quality.reflection} />
              <Vehicles />
              <Smoke reducedMotion={reducedMotion} />
            </WorldMaterialsProvider>
            {/* Keyed on the tier: a new composer for each. Taking the AO pass out of a
              running composer left its multisampled buffer resolving into a depth texture
              of another format - every frame failed to blit and the canvas froze on its
              last image while the pins went on moving over it. */}
            <PostEffects key={tier} ambientOcclusion={quality.ambientOcclusion} />
            <SceneReady onReady={handleSceneReady} />
          </Suspense>

          {/* Steps quality down after a sustained drop in frame rate, never back up, so the
              image does not oscillate - design.md D10 of elevate-world-realism. */}
          <PerformanceMonitor bounds={performanceBounds} onDecline={decline} />
          <ViewportFraming />
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
      {cardOpen && focus ? <PlaceCard place={focus} onClose={handleClose} getReturnFocus={getPinNode} /> : null}
      {exploring ? null : <IntroOverlay onExplore={handleExplore} ready={sceneReady} />}
    </div>
  );
}

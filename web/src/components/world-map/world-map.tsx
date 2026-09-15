"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { type DirectionalLight, Object3D, PCFShadowMap } from "three";

import { SiteHeader } from "@/components/site-header";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CAMERA, FOG, RENDERER, SKY_COLORS } from "@/lib/world/constants";
import type { Place } from "@/types";

import { CameraRig } from "./camera-rig";
import { Clouds } from "./clouds";
import { IntroOverlay } from "./intro-overlay";
import { Neighborhood } from "./neighborhood";
import { PinOverlay, type PinNodes } from "./pin-overlay";
import { PinProjector } from "./pin-projector";
import { PlaceCard } from "./place-card";
import { PostEffects } from "./post-effects";
import { SceneReady } from "./scene-ready";
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
        position={[96, 118, 44]}
        intensity={2.5}
        color="#ffd6a2"
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
      />
    </>
  );
}

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
const SUN_TARGET = { x: 50, y: 0, z: 10 } as const;

export function WorldMap({ places }: WorldMapProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
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

  return (
    <div className="relative h-full w-full">
      {/* The wrapper takes the blur when a modal dialog opens; the place card is not
          modal - the point of the flight is to see the place sharp behind it. */}
      <div className="h-full w-full transition-[filter] duration-300 ease-out">
        <Canvas
          // Capped so a dense display cannot multiply fragment cost - world-map spec.
          dpr={[1, RENDERER.maxPixelRatio]}
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

          {/* Warm key from the sun's side, cool sky fill: the contrast between the two is
              what makes a sunset read as a sunset rather than a single orange. */}
          <SunLight />
          <directionalLight position={[110, 40, -160]} intensity={0.9} color="#ffb070" />
          <hemisphereLight args={["#8a97c4", "#5a4a30", 0.6]} position={[0, 60, 0]} />
          <ambientLight intensity={0.16} color="#d9c6ad" />

          <Suspense fallback={null}>
            <WorldMaterialsProvider>
              <SkyDome />
              <Neighborhood />
              <Clouds />
              <Vehicles />
              <Smoke />
            </WorldMaterialsProvider>
            <PostEffects />
            <SceneReady onReady={handleSceneReady} />
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
      {exploring ? null : <IntroOverlay onExplore={handleExplore} ready={sceneReady} />}
    </div>
  );
}

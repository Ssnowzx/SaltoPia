"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";

import { CAMERA, DRIFT, FLIGHT } from "@/lib/world/constants";
import { terrainHeightAt } from "@/lib/world/terrain";
import type { Place } from "@/types";

/**
 * Camera behaviour for the hub: a bounded arc, idle drift, and flights to a place.
 *
 * The world is built to be seen from the south, like the reference, so the orbit is
 * held to an arc rather than a full circle. Drift is a slow sway inside that arc from
 * wherever the visitor left the camera.
 *
 * All three behaviours live here because they contend for the same camera - a flight
 * has to suspend drift, and drift has to know when the visitor last touched anything.
 */

interface CameraRigProps {
  /** The place to frame, or null to leave the camera where the visitor put it. */
  readonly focus: Place | null;
  /** When true, flights resolve instantly and drift never runs. */
  readonly reducedMotion: boolean;
  /** Fired when a flight settles, so pins can come back. */
  readonly onFlightEnd?: () => void;
  /** Fired when a flight begins, so pins can hide. */
  readonly onFlightStart?: () => void;
}

/** Keeps the drift from pressing against the azimuth stops. */
const DRIFT_MARGIN = 0.03;

/** Where the orbit target may go: over the map, between the water and the ridge tops. */
const TARGET_BOUNDS = { minX: -230, maxX: 240, minZ: -300, maxZ: 190, minY: -2, maxY: 60 } as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CameraRig({
  focus,
  reducedMotion,
  onFlightStart,
  onFlightEnd,
}: CameraRigProps): React.ReactElement {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  /** Clock time of the visitor's last gesture, in seconds. */
  const lastInteractionRef = useRef(0);
  /** The tween currently moving the camera, so a new flight can supersede it. */
  const flightRef = useRef<gsap.core.Timeline | null>(null);
  /** Where the sway is centred and when it began, set each time drift resumes. */
  const driftRef = useRef<{ base: number; startedAt: number } | null>(null);

  // Only gestures count as interaction. The `change` event also fires for the drift
  // itself, and listening to it would make the drift cancel its own next frame.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const markInteraction = (): void => {
      lastInteractionRef.current = performance.now() / 1000;
      driftRef.current = null;
    };

    controls.addEventListener("start", markInteraction);
    controls.addEventListener("end", markInteraction);

    return () => {
      controls.removeEventListener("start", markInteraction);
      controls.removeEventListener("end", markInteraction);
    };
  }, []);

  // Fly to the focused place.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !focus) return;

    // A flight already running is cancelled from where it is, not queued - world-map spec.
    flightRef.current?.kill();
    driftRef.current = null;

    // Heights are relative to the ground, not absolute. A seeded Y of 0 is "at the
    // place", and reading it as an absolute put the camera's target 18 units under the
    // plateau at the UFO port, so the flight ended inside the apron.
    const groundAtPlace = terrainHeightAt(focus.worldPosition.x, focus.worldPosition.z);
    const groundAtCamera = terrainHeightAt(focus.cameraPosition.x, focus.cameraPosition.z);

    const destination = new Vector3(
      focus.cameraPosition.x,
      Math.max(groundAtCamera, groundAtPlace) + focus.cameraPosition.y,
      focus.cameraPosition.z,
    );
    const lookAt = new Vector3(
      focus.worldPosition.x,
      groundAtPlace + focus.worldPosition.y + 2,
      focus.worldPosition.z,
    );

    if (reducedMotion) {
      camera.position.copy(destination);
      controls.target.copy(lookAt);
      controls.update();
      onFlightEnd?.();
      return;
    }

    onFlightStart?.();

    const timeline = gsap.timeline({
      onComplete: () => {
        flightRef.current = null;
        lastInteractionRef.current = performance.now() / 1000;
        onFlightEnd?.();
      },
    });

    // The flight arcs: a straight tween from the hub to a place on the plateau passes
    // through the ridge on the way. The path is a quadratic Bezier whose control point
    // is lifted above both ends by a share of the distance.
    const start = camera.position.clone();
    const startTarget = controls.target.clone();
    const distance = start.distanceTo(destination);
    const control = start.clone().lerp(destination, 0.5);
    control.y = Math.max(start.y, destination.y) + distance * FLIGHT.arcLift;
    const progress = { value: 0 };
    const scratch = new Vector3();

    timeline.to(progress, {
      value: 1,
      duration: Math.min(FLIGHT.maxDurationSeconds, FLIGHT.durationSeconds + distance * FLIGHT.secondsPerUnit),
      ease: FLIGHT.ease,
      onUpdate: () => {
        const t = progress.value;
        const u = 1 - t;
        scratch.copy(start).multiplyScalar(u * u);
        scratch.addScaledVector(control, 2 * u * t);
        scratch.addScaledVector(destination, t * t);
        camera.position.copy(scratch);
        controls.target.copy(startTarget).lerp(lookAt, t);
        controls.update();
      },
    });

    flightRef.current = timeline;

    return () => {
      timeline.kill();
      flightRef.current = null;
    };
  }, [focus, reducedMotion, camera, onFlightStart, onFlightEnd]);

  // Idle drift: resumes after the visitor has been still, never during a flight.
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const now = performance.now() / 1000;
    const idle =
      !reducedMotion &&
      flightRef.current === null &&
      now - lastInteractionRef.current > DRIFT.resumeAfterSeconds;

    if (idle) {
      driftRef.current ??= { base: controls.getAzimuthalAngle(), startedAt: now };
      const { base, startedAt } = driftRef.current;
      const sway = Math.sin((now - startedAt) * DRIFT.speed) * DRIFT.amplitude;
      controls.setAzimuthalAngle(
        clamp(base + sway, CAMERA.minAzimuthAngle + DRIFT_MARGIN, CAMERA.maxAzimuthAngle - DRIFT_MARGIN),
      );
    } else {
      driftRef.current = null;
    }

    // Zooming toward the cursor moves the target, so it is held inside the map: pointed
    // at the sky, it would otherwise walk off the terrain.
    controls.target.x = clamp(controls.target.x, TARGET_BOUNDS.minX, TARGET_BOUNDS.maxX);
    controls.target.z = clamp(controls.target.z, TARGET_BOUNDS.minZ, TARGET_BOUNDS.maxZ);
    controls.target.y = clamp(controls.target.y, TARGET_BOUNDS.minY, TARGET_BOUNDS.maxY);

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      // Panning would let the visitor slide the town out of frame, which the spec forbids.
      enablePan={false}
      // The wheel dollies toward whatever is under the cursor, so a zoom is aimed.
      zoomToCursor
      enableDamping
      dampingFactor={0.06}
      minDistance={CAMERA.minDistance}
      maxDistance={CAMERA.maxDistance}
      minPolarAngle={CAMERA.minPolarAngle}
      maxPolarAngle={CAMERA.maxPolarAngle}
      minAzimuthAngle={CAMERA.minAzimuthAngle}
      maxAzimuthAngle={CAMERA.maxAzimuthAngle}
      target={[CAMERA.target[0], CAMERA.target[1], CAMERA.target[2]]}
    />
  );
}

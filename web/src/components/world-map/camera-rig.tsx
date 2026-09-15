"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";

import { CAMERA, DRIFT, FLIGHT } from "@/lib/world/constants";
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

    const destination = new Vector3(
      focus.cameraPosition.x,
      focus.cameraPosition.y,
      focus.cameraPosition.z,
    );
    const lookAt = new Vector3(
      focus.worldPosition.x,
      focus.worldPosition.y,
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

    timeline.to(
      camera.position,
      {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        duration: FLIGHT.durationSeconds,
        ease: FLIGHT.ease,
      },
      0,
    );

    timeline.to(
      controls.target,
      {
        x: lookAt.x,
        y: lookAt.y,
        z: lookAt.z,
        duration: FLIGHT.durationSeconds,
        ease: FLIGHT.ease,
        onUpdate: () => controls.update(),
      },
      0,
    );

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

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      // Panning would let the visitor slide the town out of frame, which the spec forbids.
      enablePan={false}
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

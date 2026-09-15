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
 * Camera behaviour for the hub: bounded orbit, idle drift, and flights to a place.
 *
 * All three are here rather than spread across the scene because they contend for the
 * same camera - a flight has to suspend drift, and drift has to know when the visitor
 * last touched anything. Splitting them up is how they end up fighting.
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

export function CameraRig({
  focus,
  reducedMotion,
  onFlightStart,
  onFlightEnd,
}: CameraRigProps): React.ReactElement {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  /** Timestamp of the visitor's last interaction, in seconds of clock time. */
  const lastInteractionRef = useRef(0);
  /** The tween currently moving the camera, so a new flight can supersede it. */
  const flightRef = useRef<gsap.core.Timeline | null>(null);

  // Register interaction so drift knows to stand down.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const markInteraction = (): void => {
      lastInteractionRef.current = performance.now() / 1000;
    };

    controls.addEventListener("start", markInteraction);
    controls.addEventListener("change", markInteraction);

    return () => {
      controls.removeEventListener("start", markInteraction);
      controls.removeEventListener("change", markInteraction);
    };
  }, []);

  // Fly to the focused place.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !focus) return;

    // A flight already running is cancelled from where it is, not queued - world-map spec.
    flightRef.current?.kill();

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

  // Idle drift. Resumes only after the visitor has been still, and never during a flight.
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const idle =
      performance.now() / 1000 - lastInteractionRef.current > DRIFT.resumeAfterSeconds;

    controls.autoRotate = !reducedMotion && idle && flightRef.current === null;
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
      autoRotateSpeed={DRIFT.speed * 60}
      target={[CAMERA.target[0], CAMERA.target[1], CAMERA.target[2]]}
    />
  );
}

"use client";

import { useRef } from "react";

import type { StickInput } from "./walk-input";

/**
 * A thumb stick for touch screens: push to walk, push to the rim to run. It writes the
 * shared stick input the frame loop reads; nothing here renders per frame but the knob.
 */

interface TouchJoystickProps {
  readonly stick: StickInput;
}

/** The stick's travel, in CSS pixels, and the share of it past which the walker runs. */
const TRAVEL = 44;
const RUN_BEYOND = 0.85;

function setStick(stick: StickInput, forward: number, right: number): void {
  stick.forward = forward;
  stick.right = right;
  stick.run = Math.hypot(forward, right) > RUN_BEYOND;
}

export function TouchJoystick({ stick }: TouchJoystickProps): React.ReactElement {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);

  const move = (event: React.PointerEvent): void => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.min(TRAVEL, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    if (knob.current) knob.current.style.transform = `translate(${x}px, ${y}px)`;
    setStick(stick, -y / TRAVEL, x / TRAVEL);
  };

  const release = (): void => {
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
    setStick(stick, 0, 0);
  };

  return (
    <div
      ref={base}
      aria-hidden="true"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      className="pointer-events-auto absolute bottom-6 left-6 z-10 flex h-32 w-32 touch-none items-center justify-center rounded-full border-2 border-mist/70 bg-bark/25 backdrop-blur-sm"
    >
      <div ref={knob} className="h-14 w-14 rounded-full bg-mist/90 shadow-lg" />
    </div>
  );
}

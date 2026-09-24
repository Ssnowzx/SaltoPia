"use client";

import { useSyncExternalStore } from "react";

import type { Place } from "@/types";

import { readCoarsePointer, subscribeToNothing } from "../world-map/quality-tier";
import { CharacterCreator } from "./character-creator";
import { TouchJoystick } from "./touch-joystick";
import type { WalkModeState } from "./use-walk-mode";
import { WalkHud } from "./walk-hud";

/**
 * Walk mode's interface, outside the canvas: the way in from the map, the creator, the HUD
 * and, on a touch screen, the stick.
 */

interface WalkLayerProps {
  readonly walk: WalkModeState;
  readonly places: readonly Place[];
  readonly cardOpen: boolean;
  readonly onVisit: (place: Place) => void;
}

export function WalkLayer({ walk, places, cardOpen, onVisit }: WalkLayerProps): React.ReactElement | null {
  const coarse = useSyncExternalStore(subscribeToNothing, readCoarsePointer, () => false);
  const arrivedAt = walk.area ? (places.find((place) => place.slug === walk.area) ?? null) : null;

  if (walk.mode === "air") {
    return cardOpen ? null : (
      <button
        type="button"
        onClick={walk.enter}
        className="absolute right-3 bottom-4 z-10 rounded-pill bg-teal-deep px-5 py-3 font-sans text-xs font-bold tracking-[0.1em] text-mist uppercase shadow-[0_12px_30px_rgba(23,76,83,0.35)] transition-transform duration-200 hover:scale-105 hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none sm:right-6 sm:bottom-6"
      >
        Passear a pé
      </button>
    );
  }

  if (walk.mode === "create") {
    return <CharacterCreator config={walk.config} onChange={walk.setConfig} onConfirm={walk.confirm} onCancel={walk.exit} />;
  }

  return (
    <>
      <WalkHud places={places} arrivedAt={arrivedAt} visited={walk.visited} cardOpen={cardOpen} onVisit={onVisit} onRouteTo={walk.walkToPlace} onExit={walk.exit} />
      {coarse ? <TouchJoystick stick={walk.stick.current} /> : null}
    </>
  );
}

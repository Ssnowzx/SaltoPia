"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { type CharacterConfig, DEFAULT_CHARACTER } from "@/lib/walk/characters";
import type { Walker } from "@/lib/walk/movement";
import { standingPointNear } from "@/lib/walk/navigator";
import type { Point } from "@/lib/walk/pathfinding";
import { type SavedWalk, loadCharacter, loadPassport, loadWalk, saveCharacter, savePassport, saveWalk } from "@/lib/walk/storage";
import { WALK_SPAWN } from "@/lib/world/constants";
import type { Place } from "@/types";

import { subscribeToNothing } from "../world-map/quality-tier";
import { type GroundPicker, type RouteRequest, type StickInput, createStickInput } from "./walk-input";

/**
 * Walk mode's state: which mode the hub is in, the character, the walker, the passport, the
 * place arrived at, the route asked for. Read from storage through cached snapshots, so the
 * first client render agrees with the server's and the values keep their identity. See the
 * walk-mode spec and design.md D2 and D8 of add-walking-character.
 */

export type HubMode = "air" | "create" | "walk";

const EMPTY_PASSPORT: readonly string[] = [];
let savedWalkSnapshot: SavedWalk | null | undefined;
let characterSnapshot: CharacterConfig | null | undefined;
let passportSnapshot: readonly string[] | undefined;

function readSavedWalk(): SavedWalk | null {
  if (savedWalkSnapshot === undefined) savedWalkSnapshot = loadWalk();
  return savedWalkSnapshot;
}

function readCharacter(): CharacterConfig | null {
  if (characterSnapshot === undefined) characterSnapshot = loadCharacter();
  return characterSnapshot;
}

function readPassport(): readonly string[] {
  passportSnapshot ??= loadPassport();
  return passportSnapshot;
}

function spawnWalker(): Walker {
  const point = standingPointNear(WALK_SPAWN.x, WALK_SPAWN.z);
  return { x: point.x, z: point.z, heading: WALK_SPAWN.heading, speed: 0 };
}

export interface WalkModeState {
  readonly mode: HubMode;
  readonly config: CharacterConfig;
  readonly walker: { current: Walker };
  readonly stick: { readonly current: StickInput };
  readonly picker: { current: GroundPicker | null };
  readonly visited: readonly string[];
  readonly area: string | null;
  readonly route: RouteRequest | null;
  readonly greeting: number;
  readonly setConfig: (config: CharacterConfig) => void;
  readonly enter: () => void;
  readonly confirm: () => void;
  readonly exit: () => void;
  readonly arrive: (slug: string | null) => void;
  readonly walkTo: (point: Point) => void;
  readonly walkToPlace: (place: Place) => void;
}

export function useWalkMode(exploredBefore: boolean): WalkModeState {
  const saved = useSyncExternalStore(subscribeToNothing, readSavedWalk, () => null);
  const storedCharacter = useSyncExternalStore(subscribeToNothing, readCharacter, () => null);
  const storedPassport = useSyncExternalStore(subscribeToNothing, readPassport, () => EMPTY_PASSPORT);

  const [chosenMode, setChosenMode] = useState<HubMode | null>(null);
  const [chosenConfig, setChosenConfig] = useState<CharacterConfig | null>(null);
  const [visitedState, setVisitedState] = useState<readonly string[] | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteRequest | null>(null);
  const [greeting, setGreeting] = useState(0);

  // Coming back from a page opened on foot resumes the walk - walk-mode spec.
  const resuming = exploredBefore && saved !== null;
  const mode: HubMode = chosenMode ?? (resuming ? "walk" : "air");
  const config = chosenConfig ?? saved?.character ?? storedCharacter ?? DEFAULT_CHARACTER;
  const visited = visitedState ?? storedPassport;

  const walker = useRef<Walker>(saved ? { x: saved.x, z: saved.z, heading: saved.heading, speed: 0 } : { x: WALK_SPAWN.x, z: WALK_SPAWN.z, heading: WALK_SPAWN.heading, speed: 0 });
  const stick = useRef<StickInput>(createStickInput());
  const resumedFrom = useRef<SavedWalk | null>(null);

  // The first render hydrates with the server's snapshot, which has no saved walk, so the
  // walker starts at the spawn; the saved place is put back once the client's snapshot is
  // in - as a layout effect, before the follow camera frames the walker.
  useLayoutEffect(() => {
    if (!resuming || !saved || resumedFrom.current === saved) return;
    resumedFrom.current = saved;
    walker.current = { x: saved.x, z: saved.z, heading: saved.heading, speed: 0 };
  }, [resuming, saved]);
  const picker = useRef<GroundPicker | null>(null);

  const enter = useCallback(() => {
    walker.current = spawnWalker();
    setChosenMode("create");
    setGreeting((count) => count + 1);
  }, []);

  const confirm = useCallback(() => {
    saveCharacter(config);
    setChosenMode("walk");
    setGreeting((count) => count + 1);
  }, [config]);

  const exit = useCallback(() => {
    saveWalk(null);
    setChosenMode("air");
    setArea(null);
    setRoute(null);
  }, []);

  const arrive = useCallback(
    (slug: string | null) => {
      setArea(slug);
      if (!slug || visited.includes(slug)) return;
      const next = [...visited, slug];
      setVisitedState(next);
      savePassport(next);
      setGreeting((count) => count + 1);
    },
    [visited],
  );

  const walkTo = useCallback((point: Point) => setRoute((previous) => ({ target: point, serial: (previous?.serial ?? 0) + 1 })), []);
  const walkToPlace = useCallback((place: Place) => walkTo({ x: place.worldPosition.x, z: place.worldPosition.z }), [walkTo]);

  // Leaving for a page from walk mode keeps the walk, to resume on the way back.
  useEffect(() => {
    if (mode !== "walk") return;
    const keep = (): void => saveWalk({ character: config, x: walker.current.x, z: walker.current.z, heading: walker.current.heading });
    window.addEventListener("pagehide", keep);
    return () => window.removeEventListener("pagehide", keep);
  }, [mode, config]);

  return { mode, config, walker, stick, picker, visited, area, route, greeting, setConfig: setChosenConfig, enter, confirm, exit, arrive, walkTo, walkToPlace };
}

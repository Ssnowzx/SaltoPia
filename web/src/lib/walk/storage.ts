import { type CharacterConfig, parseCharacter } from "./characters";

/**
 * What the browser remembers of walk mode. Every access is guarded: storage can be missing,
 * full or forbidden, and then the walk simply starts fresh. See design.md D8 of
 * add-walking-character.
 */

const CHARACTER_KEY = "saltopia:character";
const PASSPORT_KEY = "saltopia:passport";
const WALK_KEY = "saltopia:walk";

function read(storage: () => Storage, key: string): unknown {
  try {
    const raw = storage().getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // Nothing to remember with.
  }
}

const local = (): Storage => window.localStorage;
const session = (): Storage => window.sessionStorage;

export function loadCharacter(): CharacterConfig | null {
  return parseCharacter(read(local, CHARACTER_KEY));
}

export function saveCharacter(config: CharacterConfig): void {
  write(local, CHARACTER_KEY, config);
}

export function loadPassport(): readonly string[] {
  const value = read(local, PASSPORT_KEY);
  return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === "string") : [];
}

export function savePassport(slugs: readonly string[]): void {
  write(local, PASSPORT_KEY, slugs);
}

/** A walk left for a page, to be resumed on the way back. */
export interface SavedWalk {
  readonly character: CharacterConfig;
  readonly x: number;
  readonly z: number;
  readonly heading: number;
}

export function loadWalk(): SavedWalk | null {
  const value = read(session, WALK_KEY);
  if (typeof value !== "object" || value === null) return null;
  const record: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  const character = parseCharacter(record.character);
  const { x, z, heading } = record;
  if (!character || typeof x !== "number" || typeof z !== "number" || typeof heading !== "number") return null;
  return { character, x, z, heading };
}

export function saveWalk(walk: SavedWalk | null): void {
  write(session, WALK_KEY, walk);
}

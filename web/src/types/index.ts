/**
 * Shared domain types.
 *
 * These are the contract the rest of the application codes against. The database is
 * one way to fill them, not the definition of them - see design.md, which treats the
 * data source as replaceable without any spec changing.
 */

import type { CSSProperties } from "react";

/**
 * Inline style that also sets custom properties - `--drift`, `--i`. React's own type has
 * no room for them, and widening it here beats asserting at every call site.
 */
export type StyleWithVariables = CSSProperties & { readonly [variable: `--${string}`]: string | number };

/** A three-dimensional point in the neighbourhood's world space. */
export interface WorldPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** What kind of thing an experience is. Mirrors the `experience_kind` enum. */
export type ExperienceKind = "FOOD" | "TRAIL" | "TOUR" | "EVENT" | "STAY";

/** Something to do or eat at a place. */
export interface Experience {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly kind: ExperienceKind;
  readonly durationMinutes: number | null;
  readonly placeSlug: string;
}

/** A point of interest on the 3D neighbourhood map. */
export interface Place {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly crestImage: string;
  readonly heroImage: string;
  /** A short offer the place is running, or null. Shown on the pin and on the card. */
  readonly offer: string | null;
  /** The colour this place's page is built around. */
  readonly accent: string;
  /** Where the map pin is anchored in world space. */
  readonly worldPosition: WorldPosition;
  /** Where the camera lands when flying to this place. */
  readonly cameraPosition: WorldPosition;
  readonly experiences: readonly Experience[];
}

/** One thing on a place's menu. */
export interface MenuItem {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly tag: string | null;
  /** The photograph, or null while it has not arrived - the page draws a stand-in. */
  readonly image: string | null;
}

/**
 * A place's menu. Kept apart from `Place` on purpose: `Place` travels to the hub with
 * every pin, and the hub has no use for 135 dishes.
 */
export interface PlaceMenu {
  readonly title: string;
  readonly lede: string;
  readonly items: readonly MenuItem[];
}

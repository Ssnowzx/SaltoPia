/**
 * Shared domain types.
 *
 * These are the contract the rest of the application codes against. The database is
 * one way to fill them, not the definition of them - see design.md, which treats the
 * data source as replaceable without any spec changing.
 */

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
  /** Where the map pin is anchored in world space. */
  readonly worldPosition: WorldPosition;
  /** Where the camera lands when flying to this place. */
  readonly cameraPosition: WorldPosition;
  readonly experiences: readonly Experience[];
}

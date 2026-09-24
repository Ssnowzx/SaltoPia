/**
 * The people a visitor can walk as, and what can be changed about them.
 *
 * Six CC0 characters by Quaternius sharing one rig and one set of clips - see
 * `public/models/CREDITS.md`. Each lists the material that is its outfit and the one that is
 * its skin, so the creator can recolour them. See design.md D1 of add-walking-character.
 */

export const CHARACTER_KEYS = ["woman-casual", "man-casual", "woman-hiker", "man-hiker", "woman-formal", "man-farmer"] as const;

export type CharacterKey = (typeof CHARACTER_KEYS)[number];

export interface CharacterModel {
  readonly key: CharacterKey;
  /** What the creator calls them - read by the visitor, so in Portuguese. */
  readonly label: string;
  readonly path: string;
  /** Materials recoloured by the outfit choice. */
  readonly outfitMaterials: readonly string[];
  readonly skinMaterial: string;
}

export const CHARACTERS: Readonly<Record<CharacterKey, CharacterModel>> = {
  "woman-casual": { key: "woman-casual", label: "Moradora", path: "/models/characters/woman-casual.glb", outfitMaterials: ["White"], skinMaterial: "Skin" },
  "man-casual": { key: "man-casual", label: "Morador", path: "/models/characters/man-casual.glb", outfitMaterials: ["Purple"], skinMaterial: "Skin" },
  "woman-hiker": { key: "woman-hiker", label: "Trilheira", path: "/models/characters/woman-hiker.glb", outfitMaterials: ["LightGreen"], skinMaterial: "Skin" },
  "man-hiker": { key: "man-hiker", label: "Trilheiro", path: "/models/characters/man-hiker.glb", outfitMaterials: ["Green"], skinMaterial: "Skin" },
  "woman-formal": { key: "woman-formal", label: "Anfitriã", path: "/models/characters/woman-formal.glb", outfitMaterials: ["LimeGreen"], skinMaterial: "Skin" },
  "man-farmer": { key: "man-farmer", label: "Tropeiro", path: "/models/characters/man-farmer.glb", outfitMaterials: ["LightBlue"], skinMaterial: "Skin" },
};

/** Outfit colours, from the region's own palette. `null` keeps the model's own. */
export const OUTFIT_COLORS: ReadonlyArray<{ readonly label: string; readonly hex: string | null }> = [
  { label: "Original", hex: null },
  { label: "Terracota", hex: "#b5543a" },
  { label: "Araucária", hex: "#2f5d46" },
  { label: "Lago", hex: "#2d5f8a" },
  { label: "Pinhão", hex: "#c9953a" },
  { label: "Vinho", hex: "#7b2d3f" },
];

export const SKIN_TONES: ReadonlyArray<{ readonly label: string; readonly hex: string }> = [
  { label: "Clara", hex: "#f0c8a4" },
  { label: "Média clara", hex: "#d9a37b" },
  { label: "Média", hex: "#b57a52" },
  { label: "Morena", hex: "#8c583a" },
  { label: "Escura", hex: "#5c3925" },
];

/** A character as the visitor made it. */
export interface CharacterConfig {
  readonly model: CharacterKey;
  /** Index into OUTFIT_COLORS. */
  readonly outfit: number;
  /** Index into SKIN_TONES. */
  readonly skin: number;
  readonly name: string;
}

export const NAME_MAX_LENGTH = 16;
export const DEFAULT_NAME = "Visitante";

export const DEFAULT_CHARACTER: CharacterConfig = { model: "woman-casual", outfit: 0, skin: 1, name: "" };

function isCharacterKey(value: unknown): value is CharacterKey {
  return typeof value === "string" && (CHARACTER_KEYS as readonly string[]).includes(value);
}

function inRange(value: unknown, length: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length;
}

/** Reads a stored character back, or null when it is missing or malformed. */
export function parseCharacter(value: unknown): CharacterConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const record: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  if (!isCharacterKey(record.model) || !inRange(record.outfit, OUTFIT_COLORS.length) || !inRange(record.skin, SKIN_TONES.length)) return null;
  const name = typeof record.name === "string" ? record.name.slice(0, NAME_MAX_LENGTH) : "";
  return { model: record.model, outfit: record.outfit, skin: record.skin, name };
}

/** The name shown over the character's head. */
export function displayName(config: CharacterConfig): string {
  return config.name.trim() || DEFAULT_NAME;
}

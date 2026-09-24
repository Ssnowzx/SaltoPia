import { type Color, type Material, MeshStandardMaterial } from "three";

import { CHARACTERS, type CharacterKey, OUTFIT_COLORS, SKIN_TONES } from "@/lib/walk/characters";

/**
 * Recolouring a character's materials to an outfit and a skin tone. Shared by the visitor's
 * character and the townsfolk, which clone the same materials: the colour a material was
 * loaded with is remembered for it and for every copy of it, so "Original" can put it back
 * even on a copy made after the visitor had recoloured the source.
 */

const ORIGINAL_COLORS = new WeakMap<Material, Color>();

function remember(material: Material): void {
  if (material instanceof MeshStandardMaterial && !ORIGINAL_COLORS.has(material)) ORIGINAL_COLORS.set(material, material.color.clone());
}

function recolour(material: Material, hex: string | null): void {
  if (!(material instanceof MeshStandardMaterial)) return;
  remember(material);
  const original = ORIGINAL_COLORS.get(material);
  if (hex === null) {
    if (original) material.color.copy(original);
  } else {
    material.color.set(hex);
  }
}

/** A copy of a material that remembers the source's own colour as its original. */
export function cloneMaterial(material: Material): Material {
  remember(material);
  const copy = material.clone();
  const original = ORIGINAL_COLORS.get(material);
  if (original) ORIGINAL_COLORS.set(copy, original.clone());
  return copy;
}

/** Sets a character's outfit and skin on its materials, found by their names. */
export function applyColours(materials: Readonly<Record<string, Material>>, model: CharacterKey, outfit: number, skin: number): void {
  const character = CHARACTERS[model];
  for (const name of character.outfitMaterials) {
    const material = materials[name];
    if (material) recolour(material, OUTFIT_COLORS[outfit].hex);
  }
  const skinMaterial = materials[character.skinMaterial];
  if (skinMaterial) recolour(skinMaterial, SKIN_TONES[skin].hex);
}

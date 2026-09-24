"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { QUALITY_ORDER, type QualityTier } from "@/lib/world/constants";

/**
 * The hub's quality tier, for a demo on hardware nobody has tested.
 *
 * A device with a coarse pointer - a phone, a tablet - starts one tier down. The tier only
 * ever steps down within a session, when the performance monitor reports a sustained drop,
 * so the image never oscillates. `?quality=high|medium|low` pins it, for the presentation
 * machine and for captures. See design.md D10 of elevate-world-realism.
 */

const PINNED_PARAMETER = "quality";

function isTier(value: string | null): value is QualityTier {
  return value === "high" || value === "medium" || value === "low";
}

function readPinned(): QualityTier | null {
  try {
    const value = new URLSearchParams(window.location.search).get(PINNED_PARAMETER);
    return isTier(value) ? value : null;
  } catch {
    return null;
  }
}

export function readCoarsePointer(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/** Neither value changes while the page is open; each is read once per render. */
export function subscribeToNothing(): () => void {
  return () => undefined;
}

export interface QualityTierState {
  readonly tier: QualityTier;
  /** Steps one tier down, unless the tier is pinned or already the lowest. */
  readonly decline: () => void;
}

export function useQualityTier(): QualityTierState {
  const pinned = useSyncExternalStore(subscribeToNothing, readPinned, () => null);
  const coarse = useSyncExternalStore(subscribeToNothing, readCoarsePointer, () => false);
  const [declines, setDeclines] = useState(0);

  const decline = useCallback(() => setDeclines((count) => Math.min(count + 1, QUALITY_ORDER.length - 1)), []);

  if (pinned) return { tier: pinned, decline };
  const start = coarse ? 1 : 0;
  return { tier: QUALITY_ORDER[Math.min(start + declines, QUALITY_ORDER.length - 1)], decline };
}

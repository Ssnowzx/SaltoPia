"use client";

import { useEffect, useState } from "react";

import type { Place } from "@/types";

/**
 * Walk mode's interface over the world: the place the character has arrived at and the way
 * to visit it, the list of places to walk to, the passport, and the way back to the map.
 * See the walk-mode spec, "Visiting establishments on foot" and "The passport".
 */

interface WalkHudProps {
  readonly places: readonly Place[];
  readonly arrivedAt: Place | null;
  readonly visited: readonly string[];
  /** True while a place card is open, so the visit key does nothing behind it. */
  readonly cardOpen: boolean;
  readonly onVisit: (place: Place) => void;
  readonly onRouteTo: (place: Place) => void;
  readonly onExit: () => void;
}

const PILL =
  "pointer-events-auto rounded-pill bg-mist/95 px-4 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-teal-deep uppercase shadow-[0_8px_24px_rgba(46,36,28,0.22)] transition-colors duration-200 hover:bg-white focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none";

function PlaceList({ places, visited, onRouteTo, onClose }: { readonly places: readonly Place[]; readonly visited: readonly string[]; readonly onRouteTo: (place: Place) => void; readonly onClose: () => void }): React.ReactElement {
  return (
    <div role="dialog" aria-label="Lugares para visitar" className="pointer-events-auto mt-2 max-h-[52svh] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-card bg-mist/95 p-3 shadow-[0_18px_40px_rgba(46,36,28,0.25)]">
      <ul className="flex flex-col gap-1">
        {places.map((place) => (
          <li key={place.slug}>
            <button
              type="button"
              onClick={() => {
                onRouteTo(place);
                onClose();
              }}
              className="flex w-full items-center justify-between gap-3 rounded-button px-3 py-2 text-left font-sans text-sm text-bark hover:bg-white focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none"
            >
              <span className={visited.includes(place.slug) ? "font-bold text-teal-deep" : ""}>{place.name}</span>
              <span className="shrink-0 text-[11px] font-bold tracking-[0.08em] text-teal uppercase">{visited.includes(place.slug) ? "✓ visitado" : "ir até lá"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WalkHud({ places, arrivedAt, visited, cardOpen, onVisit, onRouteTo, onExit }: WalkHudProps): React.ReactElement {
  const [listOpen, setListOpen] = useState(false);
  const complete = visited.length >= places.length && places.length > 0;

  useEffect(() => {
    if (!arrivedAt || cardOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "e" || event.key === "E") onVisit(arrivedAt);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [arrivedAt, cardOpen, onVisit]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute top-[88px] left-3 sm:left-6">
        <button type="button" aria-expanded={listOpen} onClick={() => setListOpen((open) => !open)} className={PILL}>
          Passaporte {visited.length}/{places.length} · Lugares
        </button>
        {listOpen ? <PlaceList places={places} visited={visited} onRouteTo={onRouteTo} onClose={() => setListOpen(false)} /> : null}
      </div>

      <div className="absolute top-[88px] right-3 sm:right-6">
        <button type="button" onClick={onExit} className={PILL}>
          Sair do passeio
        </button>
      </div>

      {arrivedAt && !cardOpen ? (
        <div role="status" className="pointer-events-auto absolute inset-x-3 bottom-44 mx-auto sm:bottom-6 flex w-fit max-w-[calc(100vw-24px)] flex-wrap items-center justify-center gap-3 rounded-card bg-mist/95 px-5 py-3 shadow-[0_18px_40px_rgba(46,36,28,0.25)]">
          <p className="font-sans text-sm text-bark">
            Você chegou a <strong className="text-araucaria">{arrivedAt.name}</strong>
          </p>
          <button
            type="button"
            onClick={() => onVisit(arrivedAt)}
            className="rounded-button bg-teal-deep px-5 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-mist uppercase hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none"
          >
            Visitar <span className="opacity-70 [@media(pointer:coarse)]:hidden">(E)</span>
          </button>
        </div>
      ) : null}

      {complete ? (
        <p role="status" className="absolute inset-x-3 top-[140px] mx-auto w-fit rounded-pill bg-wine px-4 py-2 text-center font-sans text-xs font-bold tracking-[0.08em] text-mist uppercase shadow-lg">
          Você conheceu toda Saltopia!
        </p>
      ) : null}
    </div>
  );
}

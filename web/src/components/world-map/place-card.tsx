"use client";

import { useEffect, useRef } from "react";

import type { Place } from "@/types";

/**
 * The card that opens once the camera has flown to a place.
 *
 * Choosing a pin does not navigate - this card is where the visitor decides to. Escape
 * and the close action return them to free exploration. See the map-pins spec.
 */

interface PlaceCardProps {
  readonly place: Place;
  readonly onClose: () => void;
}

export function PlaceCard({ place, onClose }: PlaceCardProps): React.ReactElement {
  const visitRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    visitRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-labelledby="place-card-title"
      className="pointer-events-auto absolute top-1/2 right-6 w-[min(360px,calc(100vw-48px))] -translate-y-1/2 overflow-hidden rounded-card bg-mist shadow-[0_24px_60px_rgba(46,36,28,0.28)] motion-safe:animate-[card-in_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
    >
      <div className="bg-lake/25 px-7 pt-7 pb-5 text-center">
        <p className="font-script text-2xl text-teal">Bem-vindo a</p>
        <h2 id="place-card-title" className="mt-1 font-sans text-xl font-extrabold tracking-[0.04em] text-araucaria uppercase">
          {place.name}
        </h2>
      </div>
      <div className="px-7 py-6 text-center">
        <p className="font-sans text-sm font-semibold text-teal">{place.tagline}</p>
        <p className="mt-3 line-clamp-4 font-sans text-sm leading-relaxed text-bark">{place.description}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            ref={visitRef}
            href={`/${place.slug}`}
            className="rounded-button bg-teal-deep px-7 py-3 font-sans text-sm font-bold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none"
          >
            Visitar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-xs font-bold tracking-[0.1em] text-teal uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Fechar
          </button>
        </div>
      </div>
    </aside>
  );
}

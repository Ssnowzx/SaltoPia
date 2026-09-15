"use client";

import { useEffect, useRef } from "react";

import type { Place } from "@/types";

/**
 * The card that opens once the camera has flown to a place.
 *
 * Choosing a pin does not navigate - this card is where the visitor decides to. Escape
 * and the close action return them to free exploration. See the map-pins spec.
 *
 * On a phone it is a sheet along the bottom rather than a panel at the right: at 393px
 * a centred panel covered the place the camera had just flown to, and sat under the
 * header. Along the bottom the place stays in view above it.
 *
 * The panel is anchored between the header and the foot of the window rather than
 * centred on the window, and centres itself in whatever band that leaves. Centred on the
 * window it ran under the header on a phone held sideways, where there are only 393
 * pixels of height to share.
 */

interface PlaceCardProps {
  readonly place: Place;
  readonly onClose: () => void;
}

export function PlaceCard({ place, onClose }: PlaceCardProps): React.ReactElement {
  const visitRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Without `preventScroll` the browser scrolls the card to bring the focused link
    // into view, and on a short screen that pushed the place's name out of the top.
    visitRef.current?.focus({ preventScroll: true });

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
      className="place-card pointer-events-auto absolute inset-x-3 bottom-3 max-h-[62svh] overflow-y-auto rounded-card bg-mist shadow-[0_24px_60px_rgba(46,36,28,0.28)] sm:inset-x-auto sm:top-[92px] sm:right-6 sm:bottom-4 sm:my-auto sm:h-fit sm:max-h-[calc(100svh-108px)] sm:w-[min(360px,calc(100vw-48px))]"
    >
      <div className="bg-lake/25 px-6 pt-5 pb-4 text-center sm:px-7 sm:pt-7 sm:pb-5">
        <p className="font-script text-xl text-teal sm:text-2xl">Bem-vindo a</p>
        <h2 id="place-card-title" className="mt-1 font-sans text-lg font-extrabold tracking-[0.04em] text-araucaria uppercase sm:text-xl">
          {place.name}
        </h2>
      </div>
      <div className="px-6 py-5 text-center sm:px-7 sm:py-6">
        <p className="font-sans text-sm font-semibold text-teal">{place.tagline}</p>
        <p className="mt-3 line-clamp-3 font-sans text-sm leading-relaxed text-bark sm:line-clamp-4">{place.description}</p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:mt-6">
          <a
            ref={visitRef}
            href={`/${place.slug}`}
            className="w-full rounded-button bg-teal-deep px-7 py-3.5 font-sans text-sm font-bold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none sm:w-auto"
          >
            Visitar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-sans text-xs font-bold tracking-[0.1em] text-teal uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Fechar
          </button>
        </div>
      </div>
    </aside>
  );
}

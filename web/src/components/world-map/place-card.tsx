"use client";

import { useEffect, useRef } from "react";

import { PlaceCrest } from "@/components/content/place-crest";
import { placeTheme } from "@/components/content/place-theme";
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
  /** Finds the pin the card was opened from, so the keyboard goes back where it was. */
  readonly getReturnFocus?: (slug: string) => HTMLElement | null;
}

/** Everything inside the card that the keyboard can land on, in document order. */
function focusableWithin(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
}

export function PlaceCard({ place, onClose, getReturnFocus }: PlaceCardProps): React.ReactElement {
  const cardRef = useRef<HTMLElement>(null);
  const visitRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Without `preventScroll` the browser scrolls the card to bring the focused link
    // into view, and on a short screen that pushed the place's name out of the top.
    visitRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Tab cycles inside the card. Left loose it walked into the pins behind, which
      // move every frame, so the keyboard ended up somewhere the visitor cannot see.
      if (event.key !== "Tab" || !cardRef.current) return;
      const stops = focusableWithin(cardRef.current);
      if (stops.length === 0) return;
      const edge = event.shiftKey ? stops[0] : stops[stops.length - 1];
      if (document.activeElement !== edge) return;
      event.preventDefault();
      (event.shiftKey ? stops[stops.length - 1] : stops[0]).focus({ preventScroll: true });
    };

    // Tab at the edge is not enough on its own: anything that moves focus - the pins
    // behind, which the projector rewrites every frame - takes it out of the card and
    // the visitor is left steering something they cannot see. Whatever the cause, focus
    // that lands outside comes straight back.
    const onFocusIn = (event: FocusEvent): void => {
      const card = cardRef.current;
      if (!card || card.contains(event.target as Node)) return;
      (focusableWithin(card)[0] ?? card).focus({ preventScroll: true });
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      getReturnFocus?.(place.slug)?.focus({ preventScroll: true });
    };
  }, [onClose, getReturnFocus, place.slug]);

  return (
    <aside
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-card-title"
      style={placeTheme(place.accent)}
      className="place-card pointer-events-auto absolute inset-x-3 bottom-3 max-h-[62svh] overflow-y-auto rounded-card bg-mist shadow-[0_24px_60px_color-mix(in_srgb,var(--color-night)_30%,transparent)] sm:inset-x-auto sm:top-[92px] sm:right-6 sm:bottom-4 sm:my-auto sm:h-fit sm:max-h-[calc(100svh-108px)] sm:w-[min(360px,calc(100vw-48px))]"
    >
      {/* The card is the door to the place's page, so it is painted the colour that page
          opens in - the iris then opens onto the colour the visitor was already looking at. */}
      <div className="flex items-center gap-4 bg-[var(--place-accent)] px-6 pt-5 pb-4 text-left text-mist sm:px-7 sm:pt-6 sm:pb-5">
        <PlaceCrest slug={place.slug} name={place.name} accent={place.accent} className="w-14 shrink-0 drop-shadow-[0_6px_12px_color-mix(in_srgb,var(--color-night)_35%,transparent)] sm:w-16" />
        <div>
          <p className="font-script text-xl text-[var(--place-wash)] sm:text-2xl">Bem-vindo a</p>
          <h2 id="place-card-title" className="mt-0.5 font-sans text-lg leading-tight font-extrabold tracking-[0.04em] uppercase sm:text-xl">
            {place.name}
          </h2>
        </div>
      </div>
      <div className="px-6 py-5 text-center sm:px-7 sm:py-6">
        {place.offer ? (
          <p className="mx-auto mb-4 w-fit rounded-pill bg-wine px-3.5 py-1.5 font-sans text-[11px] font-bold tracking-[0.1em] text-mist uppercase">
            {place.offer}
          </p>
        ) : null}
        <p className="font-sans text-sm font-extrabold text-[var(--place-ink)]">{place.tagline}</p>
        <p className="mt-3 line-clamp-3 font-sans text-sm leading-relaxed text-bark sm:line-clamp-4">{place.description}</p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:mt-6">
          <a
            ref={visitRef}
            href={`/${place.slug}`}
            className="w-full rounded-button bg-[var(--place-accent)] px-7 py-3.5 font-sans text-sm font-bold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:bg-[var(--place-deep)] focus-visible:ring-4 focus-visible:ring-[var(--place-accent)]/35 focus-visible:outline-none sm:w-auto"
          >
            Visitar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-sans text-xs font-bold tracking-[0.1em] text-[var(--place-ink)] uppercase underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Fechar
          </button>
        </div>
      </div>
    </aside>
  );
}

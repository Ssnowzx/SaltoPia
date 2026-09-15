"use client";

import type { MutableRefObject } from "react";

import type { Place } from "@/types";

import { DEFAULT_PIN_ICON, PIN_ICONS } from "./pin-icons";

/**
 * The map pins: interface, not scenery.
 *
 * Each pin is a button in an absolute layer above the canvas. The projector inside the
 * canvas writes its screen position into `style.transform` every frame and toggles
 * `data-visible`; nothing here re-renders while the camera moves. See design.md D3.
 */

/** The nodes the projector positions, keyed by place slug. */
export type PinNodes = MutableRefObject<Map<string, HTMLElement>>;

interface PinOverlayProps {
  readonly places: readonly Place[];
  readonly nodes: PinNodes;
  readonly onSelect: (place: Place) => void;
}

export function PinOverlay({ places, nodes, onSelect }: PinOverlayProps): React.ReactElement {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-label="Pontos de interesse">
      {places.map((place) => (
        <button
          key={place.slug}
          type="button"
          ref={(element) => {
            if (element) {
              nodes.current.set(place.slug, element);
            } else {
              nodes.current.delete(place.slug);
            }
          }}
          data-visible="false"
          onClick={() => onSelect(place)}
          aria-label={place.offer ? `${place.name} - ${place.offer}` : place.name}
          className="pin group pointer-events-auto absolute top-0 left-0 flex cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-0 will-change-transform focus-visible:outline-none"
        >
          {/* An offer marks its pin with a ribbon and a slow ring. Only a few places
              carry one, which is what makes them catch the eye; the pin itself is
              untouched, so a map full of ribbons is not what the visitor sees. */}
          {place.offer ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-pill bg-wine px-2.5 py-[3px] font-sans text-[10px] font-bold tracking-[0.1em] whitespace-nowrap text-mist uppercase shadow-[0_4px_10px_rgba(46,36,28,0.35)] ring-2 ring-mist"
            >
              {place.offer}
            </span>
          ) : null}
          <svg
            width="46"
            height="64"
            viewBox="0 0 54 75"
            aria-hidden="true"
            className="origin-bottom drop-shadow-[0_6px_10px_rgba(46,36,28,0.35)] transition-transform duration-200 ease-in-out group-hover:scale-115 group-focus-visible:scale-115"
          >
            {place.offer ? (
              <circle cx="27" cy="26" r="16" fill="none" stroke="var(--color-wine)" strokeWidth="2.5" className="pin-ring" />
            ) : null}
            <path
              d="M27 2C13.2 2 3 12.4 3 26.2 3 44.4 27 72 27 72s24-27.6 24-45.8C51 12.4 40.8 2 27 2z"
              fill="var(--color-gold)"
              stroke="var(--color-mist)"
              strokeWidth="2.5"
            />
            <circle cx="27" cy="26" r="14" fill="var(--color-mist)" />
            <g transform="translate(15 14) scale(1)" fill="var(--color-teal-deep)">
              <path d={PIN_ICONS[place.slug] ?? DEFAULT_PIN_ICON} />
            </g>
          </svg>
          {/* The label appears on hover and focus, as in the reference - nine labels
              at once would collide where the landmarks sit close together. */}
          <span className="rounded-pill bg-mist px-2.5 py-1 font-sans text-[11px] font-bold tracking-[0.06em] whitespace-nowrap text-bark uppercase opacity-0 shadow-sm ring-2 ring-transparent transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-visible:ring-teal">
            {place.name}
          </span>
        </button>
      ))}
    </div>
  );
}

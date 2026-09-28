"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { stampedAt } from "@/lib/menu-layout";
import { pauseSmoothScroll, resumeSmoothScroll } from "@/lib/smooth-scroll";
import type { MenuItem, StyleWithVariables } from "@/types";

import { PhotoStandIn } from "./photo-stand-in";
import { PlaceCrest } from "./place-crest";

interface MenuPlace {
  readonly slug: string;
  readonly name: string;
  readonly accent: string;
}

interface MenuGridProps {
  readonly place: MenuPlace;
  readonly menuTitle: string;
  readonly items: readonly MenuItem[];
}

/**
 * The menu's cards, and the larger view one of them opens.
 *
 * The cards sit in a wrapping flex row rather than a grid so that a last row that is not
 * full centres itself. The larger view is the browser's own modal dialog: it brings the
 * focus trap, Escape and the top layer, and the page only has to keep the scroll still
 * and hand focus back to the card that opened it.
 */
export function MenuGrid({ place, menuTitle, items }: MenuGridProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // The dialog is shown once its content has rendered, so it never opens on the previous
  // item for a frame.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (openIndex === null || !dialog || dialog.open) return;
    dialog.showModal();
    pauseSmoothScroll();
  }, [openIndex]);

  const handleClosed = useCallback((): void => {
    setOpenIndex(null);
    resumeSmoothScroll();
    // Browsers disagree on where focus goes when a modal dialog closes; say it outright.
    openerRef.current?.focus();
  }, []);

  const open = (index: number, opener: HTMLButtonElement): void => {
    openerRef.current = opener;
    setOpenIndex(index);
  };

  const close = (): void => dialogRef.current?.close();

  // A click that lands on the dialog itself rather than on its content is a click on the
  // backdrop around it.
  const closeOnBackdrop = (event: React.MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) close();
  };

  const item = openIndex === null ? null : items[openIndex];

  return (
    <>
      <ul className="mt-14 flex flex-wrap justify-center gap-8">
        {items.map((entry, index) => {
          const style: StyleWithVariables = { "--i": index };
          return (
            <li key={entry.slug} data-stagger style={style} className="w-full sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-4rem)/3)]">
              <MenuCard place={place} item={entry} stamped={stampedAt(index) && entry.image !== null} onOpen={(opener) => open(index, opener)} />
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={handleClosed}
        onClick={closeOnBackdrop}
        aria-labelledby="menu-dialog-title"
        data-lenis-prevent
        className="menu-dialog m-auto max-h-[92svh] w-[min(92vw,980px)] overflow-y-auto rounded-card bg-mist p-0 text-bark shadow-[0_40px_90px_color-mix(in_srgb,var(--color-night)_45%,transparent)]"
      >
        {item ? <MenuDialogContent place={place} menuTitle={menuTitle} item={item} onClose={close} /> : null}
      </dialog>
    </>
  );
}

interface MenuCardProps {
  readonly place: MenuPlace;
  readonly item: MenuItem;
  readonly stamped: boolean;
  readonly onOpen: (opener: HTMLButtonElement) => void;
}

/**
 * One item as a ticket: its photograph inset on the card, a perforated line with a notch
 * punched either side, then its name and one line about it. Some cards carry the place's
 * crest as a stamp across the photograph's corner.
 */
function MenuCard({ place, item, stamped, onOpen }: MenuCardProps): React.ReactElement {
  return (
    <article className="ticket group grain relative h-full rounded-card bg-mist shadow-[0_22px_48px_color-mix(in_srgb,var(--color-night)_24%,transparent)] transition-[translate,rotate] duration-200 ease-[var(--ease-ui)] hover:-translate-y-1.5 hover:-rotate-[0.6deg] has-[button:focus-visible]:ring-4 has-[button:focus-visible]:ring-gold">
      <div className="p-4 pb-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[12px]">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              quality={88}
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <PhotoStandIn placeSlug={place.slug} placeName={place.name} accent={place.accent} label={item.name} className="h-full w-full" />
          )}
          {item.tag ? (
            <span className="absolute top-3 left-3 rounded-pill bg-mist/95 px-3 py-1 font-sans text-[11px] font-bold tracking-[0.12em] text-[var(--place-ink)] uppercase shadow-sm">
              {item.tag}
            </span>
          ) : null}
        </div>
      </div>
      {stamped ? (
        <PlaceCrest
          slug={place.slug}
          name={place.name}
          accent={place.accent}
          className="absolute top-0 -right-2 w-[76px] -rotate-12 drop-shadow-[0_8px_14px_color-mix(in_srgb,var(--color-night)_30%,transparent)] sm:-right-3"
        />
      ) : null}
      <div className="ticket-perforation" aria-hidden="true" />
      <div className="px-6 pt-5 pb-7 text-center">
        <h3 className="font-sans text-lg leading-tight font-extrabold tracking-[0.03em] text-[var(--place-ink)] uppercase">{item.name}</h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-bark/75">{item.description}</p>
      </div>
      {/* One control over the whole card: the card's words stay ordinary text, and the
          control is named for what it does. */}
      <button
        type="button"
        onClick={(event) => onOpen(event.currentTarget)}
        aria-label={`Ver ${item.name} em detalhe`}
        className="absolute inset-0 z-[2] cursor-zoom-in rounded-card focus-visible:outline-none"
      />
    </article>
  );
}

interface MenuDialogContentProps {
  readonly place: MenuPlace;
  readonly menuTitle: string;
  readonly item: MenuItem;
  readonly onClose: () => void;
}

/** The larger view: the photograph beside everything there is to say about the item. */
function MenuDialogContent({ place, menuTitle, item, onClose }: MenuDialogContentProps): React.ReactElement {
  return (
    <div className="relative grid md:grid-cols-[1.1fr_1fr]">
      <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[560px]">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill quality={90} sizes="(min-width: 768px) 520px, 92vw" className="object-cover" />
        ) : (
          <PhotoStandIn placeSlug={place.slug} placeName={place.name} accent={place.accent} label={item.name} className="h-full w-full" />
        )}
      </div>
      <div className="grain flex flex-col p-7 sm:p-10">
        <p className="font-script text-3xl text-[var(--place-accent)]">{menuTitle}</p>
        <h2 id="menu-dialog-title" className="mt-2 font-sans text-3xl leading-tight font-extrabold tracking-[0.02em] text-[var(--place-ink)] uppercase sm:text-4xl">
          {item.name}
        </h2>
        {item.tag ? (
          <p className="mt-4 w-max rounded-pill bg-[var(--place-accent)] px-3 py-1 font-sans text-[11px] font-bold tracking-[0.12em] text-mist uppercase">{item.tag}</p>
        ) : null}
        <p className="mt-5 font-sans text-lg leading-relaxed text-bark/85">{item.description}</p>
        <p className="mt-auto pt-10 font-sans text-xs font-bold tracking-[0.28em] text-[var(--place-accent)] uppercase">{place.name} · Saltopia</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/planejar"
            className="rounded-button bg-[var(--place-accent)] px-5 py-3 font-sans text-sm font-bold tracking-[0.1em] text-mist uppercase transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-[var(--place-accent)]/30 focus-visible:outline-none"
          >
            Planejar visita
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-button border-2 border-[var(--place-accent)] px-5 py-3 font-sans text-sm font-bold tracking-[0.1em] text-[var(--place-ink)] uppercase transition-colors duration-200 hover:bg-[var(--place-accent)]/10 focus-visible:ring-4 focus-visible:ring-[var(--place-accent)]/30 focus-visible:outline-none"
          >
            Fechar
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-mist/95 text-[var(--place-ink)] shadow-md transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-gold focus-visible:outline-none"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

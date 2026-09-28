"use client";

import Image from "next/image";

import type { Place } from "@/types";

/**
 * The navigation bar every page carries, in the reference's form: a floating pill
 * with the destinations menu, the experiences, the contest, the wordmark and the primary
 * call to action.
 *
 * Its links are plain anchors on purpose: every navigation is a full document, which is
 * what lets the browser run the iris as a cross-document view transition.
 *
 * Narrow viewports get one menu instead of three controls. Side by side in a 393px pill
 * the call to action ran across the wordmark and "Experiências" had nowhere to go, so
 * below `sm` everything but the wordmark folds into a single panel - which is what the
 * place-pages spec asks for at that width.
 */

/**
 * The header sits on a flat cream pill, so it takes the cut-out emblem; the card
 * version would read as a paler box inside the pill. See scripts/build-logo.py.
 */
const LOGO = { src: "/logo-saltopia-flat.png", width: 900, height: 370 } as const;

interface SiteHeaderProps {
  readonly places: readonly Place[];
}

/** The destinations, shared by the wide menu and the narrow panel. */
function DestinationList({ places }: SiteHeaderProps): React.ReactElement {
  return (
    <ul>
      {places.map((place) => (
        <li key={place.slug}>
          <a
            href={`/${place.slug}`}
            className="block rounded-button px-3 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-bark uppercase transition-colors hover:bg-straw hover:text-teal"
          >
            {place.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

function MenuIcon(): React.ReactElement {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M1 1.5h20M1 8h20M1 14.5h20" className="group-open:hidden" />
      <path d="M3 3l16 10M19 3L3 13" className="hidden group-open:block" />
    </svg>
  );
}

export function SiteHeader({ places }: SiteHeaderProps): React.ReactElement {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-3 pt-3 sm:px-8 sm:pt-6">
      <div className="pointer-events-auto relative flex w-full max-w-[1320px] items-center justify-between gap-3 rounded-card bg-mist/95 px-3 py-2 shadow-[0_10px_40px_rgba(46,36,28,0.18)] backdrop-blur sm:gap-4 sm:px-7 sm:py-2.5">
        {/* Narrow: one control for everything. */}
        <details className="group relative sm:hidden">
          <summary
            aria-label="Menu"
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-button text-teal transition-colors hover:bg-straw [&::-webkit-details-marker]:hidden"
          >
            <MenuIcon />
          </summary>
          <div className="absolute top-full left-0 mt-2 max-h-[70svh] w-[min(80vw,300px)] overflow-y-auto rounded-card bg-mist p-2 shadow-[0_18px_50px_rgba(46,36,28,0.22)]">
            <p className="px-3 pt-2 pb-1 font-script text-2xl text-teal">Destinos</p>
            <DestinationList places={places} />
            <div className="mt-2 border-t border-bark/10 pt-2">
              <a href="/experiencias" className="block rounded-button px-3 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-bark uppercase hover:bg-straw hover:text-teal">
                Experiências
              </a>
              <a href="/embaixador" className="block rounded-button px-3 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-bark uppercase hover:bg-straw hover:text-teal">
                Seja embaixador
              </a>
              <a href="/planejar" className="mt-1 block rounded-button bg-teal-deep px-3 py-3 text-center font-sans text-xs font-bold tracking-[0.08em] text-mist uppercase">
                Planejar visita
              </a>
            </div>
          </div>
        </details>

        {/* Wide: the menu, the second link and the call to action, side by side. */}
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Principal">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-script text-2xl text-teal select-none [&::-webkit-details-marker]:hidden">
              Destinos
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="transition-transform group-open:rotate-180">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute top-full left-0 mt-3 max-h-[70svh] w-64 overflow-y-auto rounded-card bg-mist p-2 shadow-[0_18px_50px_rgba(46,36,28,0.22)]">
              <DestinationList places={places} />
              {/* The contest sits beside "Experiências" only where the bar has room for it;
                  here it is reachable at every width. */}
              <div className="mt-2 border-t border-bark/10 pt-2">
                <a href="/embaixador" className="block rounded-button px-3 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-wine uppercase transition-colors hover:bg-straw">
                  Seja embaixador
                </a>
              </div>
            </div>
          </details>
          <a href="/experiencias" className="font-script text-2xl text-teal">
            Experiências
          </a>
          <a href="/embaixador" className="hidden font-script text-2xl text-teal lg:inline">
            Embaixador
          </a>
        </nav>

        <a href="/" className="absolute left-1/2 -translate-x-1/2" aria-label="Saltopia - início">
          <Image
            src={LOGO.src}
            alt="Saltopia - Salto Caveiras, Serra Catarinense"
            width={LOGO.width}
            height={LOGO.height}
            priority
            className="h-7 w-auto sm:h-10"
          />
        </a>

        <a
          href="/planejar"
          className="hidden rounded-button bg-teal-deep px-4 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-mist uppercase transition-colors hover:bg-teal-dark sm:block sm:px-5 sm:text-sm"
        >
          Planejar visita
        </a>
        {/* Balances the menu button, so the wordmark stays centred on a phone. */}
        <span aria-hidden="true" className="size-11 sm:hidden" />
      </div>
    </header>
  );
}

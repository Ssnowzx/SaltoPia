"use client";

import Image from "next/image";
import Link from "next/link";

import type { Place } from "@/types";

/**
 * The navigation bar every page carries, in the reference's form: a floating pill
 * with the destinations menu, the wordmark and the primary call to action.
 */

/** The wordmark, at its natural aspect so the header can scale it by height alone. */
const LOGO = { src: "/logo-saltopia.png", width: 900, height: 364 } as const;

interface SiteHeaderProps {
  readonly places: readonly Place[];
}

export function SiteHeader({ places }: SiteHeaderProps): React.ReactElement {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4 pt-4 sm:px-8 sm:pt-6">
      <div className="pointer-events-auto flex w-full max-w-[1320px] items-center justify-between gap-4 rounded-card bg-mist/95 px-4 py-2.5 shadow-[0_10px_40px_rgba(46,36,28,0.18)] backdrop-blur sm:px-7">
        <nav className="flex items-center gap-6" aria-label="Principal">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-script text-2xl text-teal select-none [&::-webkit-details-marker]:hidden">
              Destinos
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="transition-transform group-open:rotate-180">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <ul className="absolute top-full left-0 mt-3 w-64 rounded-card bg-mist p-2 shadow-[0_18px_50px_rgba(46,36,28,0.22)]">
              {places.map((place) => (
                <li key={place.slug}>
                  <Link
                    href={`/${place.slug}`}
                    className="block rounded-button px-3 py-2 font-sans text-xs font-bold tracking-[0.08em] text-bark uppercase transition-colors hover:bg-straw hover:text-teal"
                  >
                    {place.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <Link href="/experiencias" className="hidden font-script text-2xl text-teal sm:block">
            Experiências
          </Link>
        </nav>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2" aria-label="Saltopia - início">
          <Image
            src={LOGO.src}
            alt="Saltopia - Salto Caveiras, Serra Catarinense"
            width={LOGO.width}
            height={LOGO.height}
            priority
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        <Link
          href="/planejar"
          className="rounded-button bg-teal-deep px-4 py-2.5 font-sans text-xs font-bold tracking-[0.08em] text-mist uppercase transition-colors hover:bg-teal-dark sm:px-5 sm:text-sm"
        >
          Planejar visita
        </Link>
      </div>
    </header>
  );
}

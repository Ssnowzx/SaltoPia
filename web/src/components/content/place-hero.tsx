import Image from "next/image";

import type { Place } from "@/types";

import { PlaceCrest } from "./place-crest";

interface PlaceHeroProps {
  readonly place: Place;
}

/**
 * The full-viewport opening of a place page: the place seen from the world, its crest,
 * its name, and a cue to scroll. The image is a render of the map from the place's own
 * flight camera, so the page opens on the same view the visitor just flew to.
 */
export function PlaceHero({ place }: PlaceHeroProps): React.ReactElement {
  return (
    <header className="relative flex min-h-svh flex-col items-center justify-end overflow-hidden px-5 pb-12 text-center text-mist sm:px-6 sm:pb-16">
      <Image src={place.heroImage} alt="" fill priority quality={90} sizes="100vw" className="object-cover" />
      {/* The veil under the type is the place's own colour, so the photograph and the
          page below it belong to the same picture. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--place-deep)_88%,transparent)_0%,color-mix(in_srgb,var(--place-accent)_38%,transparent)_45%,transparent_78%)]" />

      <div className="relative flex flex-col items-center">
        <PlaceCrest slug={place.slug} name={place.name} className="w-24 drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] sm:w-40" />
        <p className="mt-5 font-script text-2xl text-gold sm:mt-6 sm:text-4xl">Bem-vindo a</p>
        <h1 className="mt-1 max-w-4xl font-sans text-3xl leading-none font-extrabold tracking-[0.03em] uppercase drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)] sm:text-6xl">
          {place.name}
        </h1>
        <p className="mt-3 max-w-xl font-sans text-sm font-semibold text-mist/90 sm:mt-4 sm:text-lg">{place.tagline}</p>
        {place.offer ? (
          <p className="mt-5 rounded-pill bg-wine px-4 py-2 font-sans text-xs font-bold tracking-[0.12em] text-mist uppercase shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
            {place.offer}
          </p>
        ) : null}
      </div>

      <a
        href="#historia"
        className="relative mt-8 flex flex-col items-center gap-2 sm:mt-12 font-sans text-[11px] font-bold tracking-[0.3em] text-mist/80 uppercase transition-colors hover:text-gold focus-visible:text-gold focus-visible:outline-none"
      >
        Descer
        <span aria-hidden="true" className="block h-10 w-px bg-current motion-safe:animate-[scroll-cue_1.6s_ease-in-out_infinite]" />
      </a>
    </header>
  );
}

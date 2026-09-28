import Image from "next/image";

import type { Place } from "@/types";

import { PlaceCrest } from "./place-crest";

interface PlaceHeroProps {
  readonly place: Place;
}

/**
 * The opening of a place page: the place's photograph filling the window, its crest in
 * the middle and a cue to scroll.
 *
 * It is pinned. Every band after it is drawn on its own opaque ground above it, so the
 * page slides up over the place rather than pushing it away. Where the browser can tie
 * animation to scrolling, the photograph leans in and the crest lifts away as that
 * happens; under reduced motion, and in browsers that cannot, the hero simply holds.
 *
 * The place's name is set in the band below as the page's heading; up here the crest,
 * which carries the name round its rim, is the whole composition.
 */
export function PlaceHero({ place }: PlaceHeroProps): React.ReactElement {
  return (
    <header className="sticky top-0 h-svh overflow-hidden text-mist">
      <div className="hero-photo absolute inset-0">
        <Image src={place.heroImage} alt="" fill priority quality={90} sizes="100vw" className="object-cover" />
      </div>
      {/* Darker at the top for the navigation and at the bottom for the cue; the place's
          own colour in between, so the photograph belongs to the page below it. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-night)_45%,transparent)_0%,transparent_28%,transparent_58%,color-mix(in_srgb,var(--place-deep)_78%,transparent)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,color-mix(in_srgb,var(--place-deep)_40%,transparent)_0%,transparent_42%)]" />

      <div className="hero-lift relative flex h-full flex-col items-center justify-center px-5 text-center">
        <PlaceCrest
          slug={place.slug}
          name={place.name}
          accent={place.accent}
          className="w-44 drop-shadow-[0_18px_34px_color-mix(in_srgb,var(--color-night)_45%,transparent)] sm:w-72"
        />
        {place.offer ? (
          <p className="mt-6 rounded-pill bg-gold px-4 py-2 font-sans text-xs font-bold tracking-[0.12em] text-night uppercase shadow-[0_8px_20px_color-mix(in_srgb,var(--color-night)_30%,transparent)]">
            {place.offer}
          </p>
        ) : null}
      </div>

      <a
        href="#bem-vindo"
        className="absolute inset-x-0 bottom-8 mx-auto flex w-max flex-col items-center gap-1 text-mist transition-colors hover:text-gold focus-visible:text-gold focus-visible:outline-none sm:bottom-10"
      >
        <span className="font-script text-2xl sm:text-3xl">Role para explorar</span>
        <span aria-hidden="true" className="block h-10 w-px bg-current motion-safe:animate-[scroll-cue_1.6s_ease-in-out_infinite]" />
      </a>
    </header>
  );
}

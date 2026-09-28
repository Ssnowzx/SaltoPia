import Image from "next/image";

import type { Place } from "@/types";

import { PlaceCrest } from "./place-crest";
import { Reveal } from "./reveal";
import { ShareButtons } from "./share-buttons";

interface PostcardShareProps {
  readonly place: Place;
  readonly path: string;
}

/**
 * The page's goodbye: a postcard of the place to send someone, beside the ways to send
 * it. Fog drifts across the band - the Serra's weather, not the reference's clouds.
 *
 * Everything on the card that has words - the greeting, the postmark, the handwriting -
 * is drawn in code, so no generated image is ever asked to spell.
 */
export function PostcardShare({ place, path }: PostcardShareProps): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-[color-mix(in_srgb,var(--color-frost)_38%,var(--color-mist))]">
      <Fog />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 py-24 sm:px-8 sm:py-28 md:grid-cols-[1fr_1.3fr]">
        <Reveal as="div">
          <p className="font-script text-4xl text-[var(--place-accent)] sm:text-5xl">Leve alguém junto</p>
          <h2 className="mt-2 font-sans text-4xl leading-[0.95] font-extrabold tracking-[0.02em] text-night uppercase sm:text-5xl">
            Mande um postal
          </h2>
          <p className="mt-5 max-w-md font-sans text-lg text-bark/80">
            Quem vai com você merece ver {place.name} antes de chegar. Compartilhe a página do lugar.
          </p>
          <div className="mt-8">
            <ShareButtons title={place.name} path={path} tone="light" />
          </div>
        </Reveal>
        <Reveal as="div">
          <Postcard place={place} />
        </Reveal>
      </div>
    </section>
  );
}

/** Three banks of fog, blurred white, drifting slowly across the band. */
function Fog(): React.ReactElement {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="fog absolute top-[8%] -left-[10%] h-40 w-[70%] rounded-[50%] bg-mist/60 blur-[28px]" />
      <div className="fog absolute top-[46%] left-[40%] h-48 w-[75%] rounded-[50%] bg-mist/55 blur-[32px] [animation-delay:-20s]" />
      <div className="fog absolute bottom-[4%] -left-[5%] h-32 w-[55%] rounded-[50%] bg-mist/50 blur-[26px] [animation-delay:-40s]" />
    </div>
  );
}

interface PostcardProps {
  readonly place: Place;
}

function Postcard({ place }: PostcardProps): React.ReactElement {
  return (
    <figure
      aria-label={`Cartão-postal de ${place.name}`}
      className="grain relative mx-auto max-w-[620px] rotate-[3deg] rounded-[6px] bg-mist p-3 shadow-[0_34px_70px_color-mix(in_srgb,var(--color-night)_28%,transparent)] sm:p-4"
    >
      <div className="grid gap-4 sm:grid-cols-[62%_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] sm:aspect-auto sm:min-h-[300px]">
          <Image src={place.heroImage} alt="" fill quality={85} sizes="(min-width: 640px) 380px, 90vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--place-deep)_85%,transparent),transparent_60%)]" />
          <div className="absolute inset-x-4 bottom-3 text-mist">
            <p className="font-script text-2xl leading-none sm:text-3xl">Lembranças de</p>
            <p className="mt-1 font-sans text-xl leading-none font-extrabold tracking-[0.02em] uppercase sm:text-2xl">{place.name}</p>
          </div>
        </div>

        <div className="relative hidden flex-col sm:flex">
          <div className="flex items-start justify-between">
            <Postmark />
            <Stamp place={place} />
          </div>
          <p className="mt-5 font-script text-[1.6rem] leading-tight text-[var(--place-ink)]">Guardei um lugar pra você.</p>
          <div aria-hidden="true" className="mt-auto space-y-5 pb-2">
            <div className="h-px bg-bark/25" />
            <div className="h-px bg-bark/25" />
            <div className="h-px bg-bark/25" />
          </div>
        </div>
      </div>
      <div className="absolute -top-4 -right-3 sm:hidden">
        <Stamp place={place} />
      </div>
    </figure>
  );
}

/** A postage stamp: the crest on the place's pale tint, inside a perforated edge. */
function Stamp({ place }: PostcardProps): React.ReactElement {
  return (
    <div className="stamp-edge w-20 rotate-[4deg] bg-mist p-1.5 shadow-sm">
      <div className="flex aspect-[4/5] items-center justify-center bg-[var(--place-veil)]">
        <PlaceCrest slug={place.slug} name={place.name} accent={place.accent} className="w-[82%]" />
      </div>
    </div>
  );
}

/** The round cancellation mark: where it was posted, and three wavy lines. */
function Postmark(): React.ReactElement {
  return (
    <svg viewBox="0 0 150 90" className="w-32 -rotate-6 text-[var(--place-ink)] opacity-70" aria-hidden="true" focusable="false">
      <defs>
        <path id="postmark-arc" d="M10 45a35 35 0 1 1 70 0" />
      </defs>
      <circle cx="45" cy="45" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="45" cy="45" r="27" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fill="currentColor" fontFamily="Figtree, Arial, sans-serif" fontSize="8.5" fontWeight="800" letterSpacing="1.6">
        <textPath href="#postmark-arc" startOffset="50%" textAnchor="middle">
          LAGES · SC
        </textPath>
      </text>
      <text x="45" y="43" fill="currentColor" fontFamily="Figtree, Arial, sans-serif" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="1">
        SALTOPIA
      </text>
      <text x="45" y="54" fill="currentColor" fontFamily="Figtree, Arial, sans-serif" fontSize="7" textAnchor="middle">
        SERRA · SC
      </text>
      {[34, 45, 56].map((y) => (
        <path key={y} d={`M88 ${y}q7 -5 14 0t14 0 14 0 14 0`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

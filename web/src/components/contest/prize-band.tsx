import { Reveal } from "@/components/content/reveal";
import { PRIZE, PRIZE_SASH, type PrizeItem } from "@/lib/contest/content";
import type { Place } from "@/types";

import { ContestPhoto } from "./contest-photo";
import { Sparkle } from "./sparkle";

interface PrizeBandProps {
  readonly places: readonly Place[];
  /** The hamper's photograph, or null until it exists. */
  readonly photo: string | null;
}

/** "A, B e C" - the partners named the way a sentence names them. */
function joinNames(names: readonly React.ReactNode[]): React.ReactNode[] {
  return names.flatMap((name, index) => {
    if (index === 0) return [name];
    return [index === names.length - 1 ? " e " : ", ", name];
  });
}

function PrizeLine({ item, places }: { readonly item: PrizeItem; readonly places: readonly Place[] }): React.ReactElement {
  const partners = item.partners
    .map((slug) => places.find((place) => place.slug === slug))
    .filter((place): place is Place => place !== undefined)
    .map((place) => (
      <a key={place.slug} href={`/${place.slug}`} className="font-extrabold text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
        {place.name}
      </a>
    ));
  return (
    <li className="flex gap-4">
      <Sparkle className="mt-1 size-6" />
      <p className="font-sans text-lg leading-snug text-mist/85">
        <span className="block font-sans text-2xl font-extrabold text-mist uppercase">{item.lead}</span>
        {item.detail} {joinNames(partners)}
        {partners.length > 0 ? "." : ""}
      </p>
    </li>
  );
}

/**
 * What the winner takes home, and who gives it: every partner is a place on the map and
 * links to its page - the contest is also the site's pitch to them. A sash runs across the
 * band with the promise on it.
 */
export function PrizeBand({ places, photo }: PrizeBandProps): React.ReactElement {
  return (
    <section id="premio" className="relative overflow-hidden bg-night text-mist">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-24 pb-16 sm:px-8 sm:pt-28 md:grid-cols-[1fr_1.1fr]">
        <Reveal as="div">
          <div className="mx-auto max-w-md -rotate-3 bg-mist p-3 pb-14 shadow-[0_30px_60px_color-mix(in_srgb,black_40%,transparent)]">
            <ContestPhoto src={photo} label="A cesta da Serra" sizes="(min-width: 768px) 440px, 90vw" className="aspect-[4/3]" />
            <p className="mt-3 text-center font-script text-2xl text-night">Um mês de Serra, doze vezes</p>
          </div>
        </Reveal>
        <Reveal as="div">
          <p className="font-script text-5xl text-gold sm:text-6xl">Quem vence leva</p>
          <h2 className="mt-1 font-sans text-[clamp(2.75rem,7vw,5.5rem)] leading-none font-extrabold tracking-[0.01em] uppercase">O prêmio da Serra</h2>
          <ul className="mt-10 space-y-6">
            {PRIZE.map((item) => (
              <PrizeLine key={item.lead} item={item} places={places} />
            ))}
          </ul>
        </Reveal>
      </div>
      <div className="relative pb-20">
        <p className="mx-auto w-[min(92%,960px)] -rotate-2 bg-wine px-12 py-5 text-center font-sans text-lg font-extrabold tracking-[0.04em] text-mist uppercase shadow-[0_16px_34px_color-mix(in_srgb,black_35%,transparent)] [clip-path:polygon(0_0,100%_0,97%_50%,100%_100%,0_100%,3%_50%)] sm:text-2xl">
          {PRIZE_SASH}
        </p>
      </div>
    </section>
  );
}

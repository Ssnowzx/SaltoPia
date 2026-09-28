import Image from "next/image";

import type { Print } from "@/lib/menu-layout";
import { PRINT_TILTS } from "@/lib/menu-layout";
import type { Place, StyleWithVariables } from "@/types";

import { PlaceCrest } from "./place-crest";
import { Reveal } from "./reveal";

interface PlaceWelcomeProps {
  readonly place: Place;
  /** The pictures scattered over the scene, already chosen. */
  readonly prints: readonly Print[];
  /** How many things the place's menu holds, for the facts. */
  readonly menuCount: number;
}

/**
 * Where each print lies on the scene, as a share of its width and height, and how far it
 * drifts while the page scrolls past. Written out rather than computed: a composition is
 * a picture, and this one was arranged by eye to leave the middle of the view open.
 */
const PRINT_SPOTS: ReadonlyArray<{ readonly left: string; readonly top: string; readonly drift: string; readonly wide: boolean }> = [
  { left: "3%", top: "20%", drift: "40px", wide: true },
  { left: "39%", top: "6%", drift: "64px", wide: true },
  { left: "71%", top: "22%", drift: "32px", wide: true },
  { left: "20%", top: "50%", drift: "56px", wide: false },
  { left: "57%", top: "52%", drift: "44px", wide: false },
];

/**
 * The band that says who the place is: its crest again, its name as the page's heading,
 * its tagline and description, a few facts - and under the words, the place itself,
 * faded into the paper, with prints of what it serves and does scattered over it.
 *
 * The prints repeat pictures that the menu and the itinerary show with proper words, so
 * they are decoration to assistive technology.
 */
export function PlaceWelcome({ place, prints, menuCount }: PlaceWelcomeProps): React.ReactElement {
  const facts: ReadonlyArray<readonly [string, string, string | null]> = [
    ["Onde", "Salto do Rio Caveiras", null],
    ["Cidade", "Lages, Santa Catarina", null],
    ["No cardápio", menuCount > 0 ? `${menuCount} itens` : "Em breve", menuCount > 0 ? "#cardapio" : null],
    ["No mapa", "Ver em 3D", "/"],
  ];

  return (
    <section id="bem-vindo" className="grain relative bg-[var(--place-wash)]">
      <Reveal as="div" className="mx-auto w-full max-w-4xl px-5 pt-16 text-center sm:px-8 sm:pt-24">
        <PlaceCrest slug={place.slug} name={place.name} accent={place.accent} className="mx-auto w-28 sm:w-40" />
        <p className="mt-6 font-script text-4xl text-[var(--place-accent)] sm:text-5xl">Bem-vindo a</p>
        <h1 className="mt-2 font-sans text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] font-extrabold tracking-[0.01em] text-[var(--place-ink)] uppercase">
          {place.name}
        </h1>
        <p className="mt-5 font-sans text-lg font-extrabold text-[var(--place-accent)] sm:text-2xl">{place.tagline}</p>
        <p className="mx-auto mt-5 max-w-[720px] font-sans text-base leading-relaxed text-bark/85 sm:text-lg">{place.description}</p>

        <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map(([term, value, href]) => (
            <div key={term} className="rounded-card border-2 border-[var(--place-accent)]/15 bg-mist/70 px-4 py-3 text-left">
              <dt className="font-sans text-[10px] font-bold tracking-[0.28em] text-[var(--place-accent)] uppercase">{term}</dt>
              <dd className="mt-1 font-sans text-sm font-semibold text-bark">
                {href ? (
                  <a href={href} className="underline decoration-[var(--place-accent)]/40 underline-offset-4 hover:decoration-[var(--place-accent)]">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <div aria-hidden="true" className="relative mt-10 h-[440px] overflow-hidden sm:mt-4 sm:h-[640px]">
        <div className="absolute inset-0 bg-[var(--place-veil)] [mask-image:linear-gradient(to_bottom,transparent,black_38%)]">
          <Image src={place.heroImage} alt="" fill quality={75} sizes="100vw" className="object-cover opacity-55 mix-blend-multiply grayscale sepia-[0.3]" />
        </div>
        <div className="relative mx-auto h-full w-full max-w-6xl">
          {prints.map((print, index) => (
            <PrintCard key={print.src} print={print} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface PrintCardProps {
  readonly print: Print;
  readonly index: number;
}

/** One print: a white-bordered photograph with its caption written under it and a strip of tape. */
function PrintCard({ print, index }: PrintCardProps): React.ReactElement {
  const spot = PRINT_SPOTS[index % PRINT_SPOTS.length];
  const style: StyleWithVariables = { left: spot.left, top: spot.top, rotate: `${PRINT_TILTS[index % PRINT_TILTS.length]}deg`, "--drift": spot.drift };
  return (
    <figure
      className={`print-drift absolute w-[clamp(132px,19vw,268px)] bg-mist p-2 pb-10 shadow-[0_22px_40px_color-mix(in_srgb,var(--color-night)_28%,transparent)] sm:p-2.5 sm:pb-12 ${spot.wide ? "" : "hidden sm:block"}`}
      style={style}
    >
      <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-mist/60 shadow-sm" />
      <div className="relative aspect-square overflow-hidden">
        <Image src={print.src} alt="" fill quality={75} sizes="(min-width: 640px) 268px, 132px" className="object-cover" />
      </div>
      {print.caption ? (
        <figcaption className="absolute inset-x-2 bottom-1.5 truncate text-center font-script text-xl text-bark/80 sm:bottom-2 sm:text-[22px]">{print.caption}</figcaption>
      ) : null}
    </figure>
  );
}

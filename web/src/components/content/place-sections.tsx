import Image from "next/image";

import type { Experience, Place } from "@/types";

import { ExperienceCard } from "./experience-card";

/**
 * The bands a place page is made of, below the hero.
 *
 * The page alternates: a pale wash, a strong block of the place's own colour, a wash
 * again. That rhythm is what stops a long page reading as one flat column, and the
 * colour is what stops fifteen pages reading as the same page fifteen times.
 *
 * Every band takes its colours from the custom properties `placeTheme` puts on the page
 * root, so none of them knows which place it is drawing.
 */

interface PlaceSectionProps {
  readonly place: Place;
}

/** The narrative band: who this place is, in its own ink on its own wash. */
export function PlaceStory({ place }: PlaceSectionProps): React.ReactElement {
  return (
    <div className="bg-[var(--place-wash)]">
      <div className="mx-auto w-full max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <p className="font-script text-3xl text-[var(--place-accent)] sm:text-4xl">Sobre o lugar</p>
        <h2 className="mt-2 font-sans text-2xl leading-tight font-extrabold tracking-[0.03em] text-[var(--place-ink)] uppercase sm:text-4xl">
          {place.tagline}
        </h2>
        <p className="mt-7 font-sans text-base leading-relaxed text-bark/85 sm:text-xl">{place.description}</p>

        <dl className="mt-12 grid grid-cols-2 gap-6 border-t-2 border-[var(--place-accent)]/20 pt-8 text-left sm:grid-cols-4">
          {[
            ["Onde", "Salto do Rio Caveiras"],
            ["Cidade", "Lages, Santa Catarina"],
            ["Experiências", String(place.experiences.length)],
            ["No mapa", "Ver em 3D"],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="font-sans text-[10px] font-bold tracking-[0.28em] text-[var(--place-accent)] uppercase">{term}</dt>
              <dd className="mt-1.5 font-sans text-sm font-semibold text-bark">
                {term === "No mapa" ? (
                  <a href="/" className="underline-offset-4 hover:underline">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

interface ExperienceBlockProps extends PlaceSectionProps {
  readonly items: readonly Experience[];
}

/**
 * The experiences, on a full block of the place's colour.
 *
 * A pale page with a couple of cards on it reads as an empty page. On a saturated ground
 * the same cards read as a collection, which is the difference between a list and an
 * invitation.
 */
export function ExperienceBlock({ place, items }: ExperienceBlockProps): React.ReactElement {
  return (
    <div className="bg-[var(--place-accent)] text-[var(--place-on-accent)] [--ticket-ground:var(--place-accent)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="text-center">
          <p className="font-script text-3xl text-mist/80 sm:text-4xl">O que fazer</p>
          <h2 className="mt-1 font-sans text-2xl leading-tight font-extrabold tracking-[0.04em] uppercase sm:text-5xl">
            Em {place.name}
          </h2>
        </div>
        <ul
          className={`mx-auto mt-12 grid gap-7 ${
            items.length === 1
              ? "max-w-sm grid-cols-1"
              : items.length === 2
                ? "max-w-3xl grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {items.map((experience) => (
            <li key={experience.slug}>
              <ExperienceCard experience={experience} place={place} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface GalleryProps extends PlaceSectionProps {
  readonly caption: string;
  /** The place's own photographs, in the order they should be shown. */
  readonly pictures: readonly string[];
}

/**
 * The place, seen properly: a mosaic of its own photographs, the first one large.
 *
 * With two pictures a page has an illustration; with six it has a place. The layout is
 * driven by how many there are, so a folder with three does not leave a hole where a row
 * was expected.
 */
export function PlaceGallery({ place, caption, pictures }: GalleryProps): React.ReactElement | null {
  if (pictures.length === 0) return null;

  return (
    <div className="bg-[var(--place-veil)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="font-script text-3xl text-[var(--place-accent)] sm:text-4xl">De perto</p>
            <h2 className="mt-1 font-sans text-2xl leading-tight font-extrabold tracking-[0.03em] text-[var(--place-ink)] uppercase sm:text-3xl">
              {place.name}
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-bark/80 sm:text-right">{caption}</p>
        </div>

        <div className="mt-10 grid auto-rows-[140px] grid-cols-2 gap-4 sm:auto-rows-[190px] sm:grid-cols-3 lg:grid-cols-4">
          {pictures.map((picture, index) => (
            <div
              key={picture}
              className={`relative overflow-hidden rounded-card shadow-[0_18px_44px_rgba(46,36,28,0.18)] ${
                index === 0 ? "col-span-2 row-span-2" : ""
              } ${index === 3 && pictures.length > 4 ? "sm:row-span-2" : ""}`}
            >
              <Image
                src={picture}
                alt=""
                fill
                quality={88}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 40vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

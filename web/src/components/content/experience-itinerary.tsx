import Image from "next/image";

import type { Experience, Place } from "@/types";

import { durationLabel, KIND_LABELS } from "./experience-card";
import { Reveal } from "./reveal";

interface ExperienceItineraryProps {
  readonly place: Place;
}

/**
 * The place's experiences as an itinerary: one stop per row, the photograph large, the
 * number of the stop set big in outline, and the rows swapping sides as they go.
 *
 * The menu above is already a grid of cards; a second grid would make the page one
 * pattern twice. Rows read as a route through the place - which is what an itinerary is.
 */
export function ExperienceItinerary({ place }: ExperienceItineraryProps): React.ReactElement {
  return (
    <section id="experiencias" className="grain relative bg-[var(--place-wash)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal as="div" className="text-center">
          <p className="font-script text-4xl text-[var(--place-accent)] sm:text-5xl">O que fazer</p>
          <h2 className="mt-2 font-sans text-[clamp(2.25rem,5vw,4rem)] leading-[0.95] font-extrabold tracking-[0.02em] text-[var(--place-ink)] uppercase">
            Experiências
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-sans text-lg text-bark/80">
            {place.experiences.length === 1 ? "Uma para reservar" : `${place.experiences.length} para reservar`}, cada uma com sua página e seus detalhes.
          </p>
        </Reveal>

        <ol className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
          {place.experiences.map((experience, index) => (
            <li key={experience.slug}>
              <Reveal as="div">
                <ItineraryStop place={place} experience={experience} index={index} />
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

interface ItineraryStopProps {
  readonly place: Place;
  readonly experience: Experience;
  readonly index: number;
}

function ItineraryStop({ place, experience, index }: ItineraryStopProps): React.ReactElement {
  const flipped = index % 2 === 1;
  return (
    <a
      href={`/${place.slug}/experiencias/${experience.slug}`}
      className="group grid items-center gap-8 rounded-card focus-visible:ring-4 focus-visible:ring-[var(--place-accent)]/30 focus-visible:outline-none md:grid-cols-[1.15fr_1fr] md:gap-14"
    >
      <div className={`relative aspect-[4/3] overflow-hidden rounded-card shadow-[14px_14px_0_var(--color-gold)] ${flipped ? "md:order-2" : ""}`}>
        <Image
          src={experience.image}
          alt=""
          fill
          quality={88}
          sizes="(min-width: 1024px) 600px, (min-width: 768px) 52vw, 92vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className={flipped ? "md:order-1 md:text-right" : ""}>
        <p
          aria-hidden="true"
          className="font-sans text-[5.5rem] leading-none font-extrabold text-transparent [-webkit-text-stroke:2px_var(--place-accent)] sm:text-8xl"
        >
          {String(index + 1).padStart(2, "0")}
        </p>
        <p className={`mt-3 flex flex-wrap gap-2 ${flipped ? "md:justify-end" : ""}`}>
          <span className="rounded-pill bg-[var(--place-accent)] px-3 py-1 font-sans text-[11px] font-bold tracking-[0.12em] text-mist uppercase">
            {KIND_LABELS[experience.kind]}
          </span>
          <span className="rounded-pill border-2 border-[var(--place-accent)]/30 px-3 py-0.5 font-sans text-[11px] font-bold tracking-[0.12em] text-[var(--place-ink)] uppercase">
            {durationLabel(experience.durationMinutes)}
          </span>
        </p>
        <h3 className="mt-4 font-sans text-3xl leading-tight font-extrabold text-[var(--place-ink)] sm:text-4xl">{experience.name}</h3>
        <p className="mt-3 font-sans text-lg leading-relaxed text-bark/80">{experience.description}</p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-button bg-[var(--place-accent)] px-5 py-3 font-sans text-sm font-bold tracking-[0.1em] text-mist uppercase transition-transform duration-200 group-hover:scale-105">
          Ver experiência
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </a>
  );
}

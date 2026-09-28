import type { Experience, Place } from "@/types";

import { ExperienceCard } from "./experience-card";

interface ExperienceGridProps {
  readonly title: string;
  readonly intro?: string;
  readonly items: ReadonlyArray<{ readonly experience: Experience; readonly place: Pick<Place, "slug" | "name"> }>;
}

/** The ticket cards, three across on a desk, one on a phone. */
export function ExperienceGrid({ title, intro, items }: ExperienceGridProps): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <p className="font-script text-3xl text-[var(--place-accent,var(--color-night))]">O que fazer</p>
      <h2 className="mt-1 font-sans text-3xl font-extrabold tracking-[0.03em] text-[var(--place-ink,var(--color-night))] uppercase sm:text-4xl">{title}</h2>
      {intro ? <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-bark/80">{intro}</p> : null}
      <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ experience, place }) => (
          <li key={`${place.slug}/${experience.slug}`}>
            <ExperienceCard experience={experience} place={place} />
          </li>
        ))}
      </ul>
    </div>
  );
}

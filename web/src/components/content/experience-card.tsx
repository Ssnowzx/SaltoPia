import Image from "next/image";

import type { Experience, ExperienceKind, Place } from "@/types";

import { PlaceCrest } from "./place-crest";

/** What each kind is called on screen. */
export const KIND_LABELS: Readonly<Record<ExperienceKind, string>> = {
  FOOD: "Comida",
  TRAIL: "Trilha",
  TOUR: "Passeio",
  EVENT: "Evento",
  STAY: "Hospedagem",
};

/** A duration for the visitor, or the honest absence of one. */
export function durationLabel(minutes: number | null): string {
  if (minutes === null) return "Programa livre";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

interface ExperienceCardProps {
  readonly experience: Experience;
  readonly place: Pick<Place, "slug" | "name">;
}

/**
 * An experience as a ticket: photograph on top, a perforated line, then the name, the
 * kind and its place's crest. The notches either side of the perforation are cut by the
 * stylesheet, so the card stays a plain rectangle to the layout.
 */
export function ExperienceCard({ experience, place }: ExperienceCardProps): React.ReactElement {
  return (
    <a
      href={`/${place.slug}/experiencias/${experience.slug}`}
      className="ticket group block rounded-card bg-mist text-bark shadow-[0_18px_44px_rgba(46,36,28,0.18)] transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-card">
        <Image src={experience.image} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute top-3 left-3 rounded-pill bg-mist/95 px-3 py-1 font-sans text-[11px] font-bold tracking-[0.12em] text-teal uppercase">
          {KIND_LABELS[experience.kind]}
        </span>
      </div>
      <div className="ticket-perforation" aria-hidden="true" />
      <div className="flex items-center gap-4 px-6 pt-4 pb-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-lg leading-tight font-extrabold text-araucaria">{experience.name}</h3>
          <p className="mt-1 font-sans text-xs font-bold tracking-[0.12em] text-teal uppercase">
            {place.name} · {durationLabel(experience.durationMinutes)}
          </p>
        </div>
        <PlaceCrest slug={place.slug} name={place.name} className="w-14 shrink-0" />
      </div>
    </a>
  );
}

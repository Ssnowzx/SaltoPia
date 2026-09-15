import type { Metadata } from "next";

import { ContentShell } from "@/components/content/content-shell";
import { ExperienceGrid } from "@/components/content/experience-grid";
import { Reveal } from "@/components/content/reveal";
import { getPlaces } from "@/lib/places";

export const metadata: Metadata = {
  title: "Experiências",
  description: "Tudo o que há para fazer, comer e ver em Saltopia, lugar por lugar.",
};

/** Every experience in the neighbourhood, place by place. */
export default async function ExperiencesPage(): Promise<React.ReactElement> {
  const places = await getPlaces();
  const withExperiences = places.filter((place) => place.experiences.length > 0);
  const total = withExperiences.reduce((count, place) => count + place.experiences.length, 0);

  return (
    <ContentShell places={places}>
      <header className="bg-teal-deep px-6 pt-40 pb-16 text-center text-mist sm:px-8">
        <p className="font-script text-3xl text-gold sm:text-4xl">Tudo o que há para fazer</p>
        <h1 className="mt-2 font-sans text-4xl font-extrabold tracking-[0.04em] uppercase sm:text-6xl">Experiências</h1>
        <p className="mt-4 font-sans text-base font-semibold text-mist/85">
          {total} experiências em {withExperiences.length} lugares
        </p>
      </header>
      {withExperiences.map((place) => (
        <Reveal key={place.slug} id={place.slug} className="odd:bg-mist/60">
          <ExperienceGrid
            title={place.name}
            intro={place.tagline}
            items={place.experiences.map((experience) => ({ experience, place }))}
          />
        </Reveal>
      ))}
    </ContentShell>
  );
}

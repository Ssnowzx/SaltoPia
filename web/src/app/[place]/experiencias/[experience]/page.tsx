import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ContentShell } from "@/components/content/content-shell";
import { KIND_LABELS, durationLabel } from "@/components/content/experience-card";
import { ExperienceGrid } from "@/components/content/experience-grid";
import { PlaceCrest } from "@/components/content/place-crest";
import { placeTheme } from "@/components/content/place-theme";
import { Reveal } from "@/components/content/reveal";
import { ShareBlock } from "@/components/content/share-block";
import { getExperience, getPlaces } from "@/lib/places";

/**
 * An experience's page: hero, description, the practical details, and the way back to
 * its place. An experience asked for under the wrong place is not found - the slug is
 * only unique within its place, and a match elsewhere would be a different thing.
 */

/** Route parameters, typed here so the page does not depend on the build having run. */
interface ExperiencePageProps {
  readonly params: Promise<{ readonly place: string; readonly experience: string }>;
}

export async function generateStaticParams(): Promise<Array<{ place: string; experience: string }>> {
  const places = await getPlaces();
  return places.flatMap((place) => place.experiences.map((experience) => ({ place: place.slug, experience: experience.slug })));
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const { place: placeSlug, experience: experienceSlug } = await params;
  const found = await getExperience(placeSlug, experienceSlug);
  if (!found) return {};
  return {
    title: `${found.experience.name} · ${found.place.name}`,
    description: found.experience.description,
    openGraph: {
      title: `${found.experience.name} | Saltopia`,
      description: found.experience.description,
      images: [{ url: found.experience.image, width: 1200, height: 900, alt: found.experience.name }],
    },
  };
}

export default async function ExperiencePage({ params }: ExperiencePageProps): Promise<React.ReactElement> {
  const { place: placeSlug, experience: experienceSlug } = await params;
  const [found, places] = await Promise.all([getExperience(placeSlug, experienceSlug), getPlaces()]);
  if (!found) notFound();
  const { place, experience } = found;
  const others = place.experiences.filter((other) => other.slug !== experience.slug);

  return (
    <ContentShell places={places}>
      <div style={placeTheme(place.accent)}>
      <header className="relative flex min-h-[70svh] flex-col justify-end overflow-hidden px-6 pt-40 pb-14 text-mist sm:px-8">
        <Image src={experience.image} alt="" fill priority quality={90} sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--place-deep)_92%,transparent)_0%,color-mix(in_srgb,var(--place-accent)_45%,transparent)_50%,transparent_82%)]" />
        <div className="relative mx-auto w-full max-w-5xl">
          <a href={`/${place.slug}`} className="inline-flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.3em] text-gold uppercase underline-offset-4 hover:underline">
            ← {place.name}
          </a>
          <p className="mt-6 font-sans text-xs font-bold tracking-[0.3em] text-mist/80 uppercase">{KIND_LABELS[experience.kind]}</p>
          <h1 className="mt-2 max-w-4xl font-sans text-4xl leading-none font-extrabold tracking-[0.03em] uppercase drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)] sm:text-6xl">
            {experience.name}
          </h1>
        </div>
      </header>

      <Reveal className="mx-auto grid w-full max-w-5xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="font-script text-3xl text-[var(--place-accent)]">A experiência</p>
          <p className="mt-4 font-sans text-lg leading-relaxed text-bark/85 sm:text-xl">{experience.description}</p>
        </div>
        <aside className="rounded-card bg-mist p-8 shadow-[0_18px_44px_rgba(46,36,28,0.12)]">
          <PlaceCrest slug={place.slug} name={place.name} className="w-24" />
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-[var(--place-accent)] uppercase">Onde</dt>
              <dd className="mt-1 font-sans text-sm font-semibold text-bark">
                <a href={`/${place.slug}`} className="underline-offset-4 hover:underline">{place.name}</a> — {place.tagline}
              </dd>
            </div>
            <div>
              <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-[var(--place-accent)] uppercase">Duração</dt>
              <dd className="mt-1 font-sans text-sm font-semibold text-bark">{durationLabel(experience.durationMinutes)}</dd>
            </div>
            <div>
              <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-[var(--place-accent)] uppercase">Tipo</dt>
              <dd className="mt-1 font-sans text-sm font-semibold text-bark">{KIND_LABELS[experience.kind]}</dd>
            </div>
            <div>
              <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-[var(--place-accent)] uppercase">Como reservar</dt>
              <dd className="mt-1 font-sans text-sm font-semibold text-bark">
                <a href="/planejar" className="text-teal underline-offset-4 hover:underline">Planejar visita</a>
              </dd>
            </div>
          </dl>
        </aside>
      </Reveal>

      {others.length > 0 ? (
        <Reveal className="bg-[var(--place-wash)] [--ticket-ground:var(--place-wash)]">
          <ExperienceGrid title={`Mais em ${place.name}`} items={others.map((other) => ({ experience: other, place }))} />
        </Reveal>
      ) : null}

      <Reveal>
        <ShareBlock title={experience.name} path={`/${place.slug}/experiencias/${experience.slug}`} />
      </Reveal>
      </div>
    </ContentShell>
  );
}

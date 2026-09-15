import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentShell } from "@/components/content/content-shell";
import { ExperienceGrid } from "@/components/content/experience-grid";
import { Marquee } from "@/components/content/marquee";
import { PlaceHero } from "@/components/content/place-hero";
import { Reveal } from "@/components/content/reveal";
import { ShareBlock } from "@/components/content/share-block";
import { getPlaceBySlug, getPlaces } from "@/lib/places";

/**
 * A place's page: the six sections of the place-pages spec, scrolling normally, with
 * no 3D surface. The hero opens on the same view the visitor flew to on the map.
 */

/** Route parameters, typed here so the page does not depend on the build having run. */
interface PlacePageProps {
  readonly params: Promise<{ readonly place: string }>;
}

export async function generateStaticParams(): Promise<Array<{ place: string }>> {
  const places = await getPlaces();
  return places.map((place) => ({ place: place.slug }));
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { place: slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return {};
  return {
    title: place.name,
    description: place.tagline,
    openGraph: {
      title: `${place.name} | Saltopia`,
      description: place.tagline,
      images: [{ url: place.heroImage, width: 1600, height: 900, alt: place.name }],
    },
  };
}

export default async function PlacePage({ params }: PlacePageProps): Promise<React.ReactElement> {
  const { place: slug } = await params;
  const [place, places] = await Promise.all([getPlaceBySlug(slug), getPlaces()]);
  if (!place) notFound();

  return (
    <ContentShell places={places}>
      <PlaceHero place={place} />

      <Reveal id="historia" className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-8">
        <p className="font-script text-3xl text-teal">Sobre o lugar</p>
        <h2 className="mt-1 font-sans text-3xl font-extrabold tracking-[0.03em] text-araucaria uppercase sm:text-4xl">{place.tagline}</h2>
        <p className="mt-8 font-sans text-lg leading-relaxed text-bark/85 sm:text-xl">{place.description}</p>
        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-bark/10 pt-8 sm:grid-cols-3">
          <div>
            <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-teal uppercase">Onde</dt>
            <dd className="mt-1 font-sans text-sm font-semibold text-bark">Salto do Rio Caveiras, Lages</dd>
          </div>
          <div>
            <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-teal uppercase">Experiências</dt>
            <dd className="mt-1 font-sans text-sm font-semibold text-bark">{place.experiences.length}</dd>
          </div>
          <div>
            <dt className="font-sans text-[11px] font-bold tracking-[0.3em] text-teal uppercase">No mapa</dt>
            <dd className="mt-1 font-sans text-sm font-semibold text-bark">
              <a href="/" className="text-teal underline-offset-4 hover:underline">Ver no mapa 3D</a>
            </dd>
          </div>
        </dl>
      </Reveal>

      <Marquee text={`${place.name} · Saltopia`} cta={{ label: "Planejar visita", href: "/planejar" }} />

      {place.experiences.length > 0 ? (
        <Reveal id="experiencias">
          <ExperienceGrid
            title={`Em ${place.name}`}
            items={place.experiences.map((experience) => ({ experience, place }))}
          />
        </Reveal>
      ) : null}

      <Reveal>
        <ShareBlock title={place.name} path={`/${place.slug}`} />
      </Reveal>
    </ContentShell>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentShell } from "@/components/content/content-shell";
import { Marquee } from "@/components/content/marquee";
import { PlaceHero } from "@/components/content/place-hero";
import { ExperienceBlock, PlaceGallery, PlaceStory } from "@/components/content/place-sections";
import { placeTheme } from "@/components/content/place-theme";
import { Reveal } from "@/components/content/reveal";
import { ShareBlock } from "@/components/content/share-block";
import { galleryFor } from "@/lib/gallery";
import { getPlaceBySlug, getPlaces } from "@/lib/places";

/**
 * A place's page.
 *
 * It is built around the place's own colour rather than around the site palette: the
 * hero's veil, the marquee, the block the experiences sit on and the share card all take
 * it, so fifteen places are fifteen pages rather than one page fifteen times. The bands
 * alternate pale and saturated, which is what keeps a long page from reading as one
 * column of text.
 *
 * It scrolls normally and creates no WebGL context - the map is the other half of the
 * site, and it stays there.
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

  // The place's own folder if it has one; otherwise what the page already has, so a
  // place with no gallery yet still shows something rather than nothing.
  const folder = galleryFor(place.slug);
  const pictures = folder.length > 0 ? folder : [place.heroImage, ...place.experiences.map((experience) => experience.image)];

  return (
    <ContentShell places={places}>
      <div style={placeTheme(place.accent)}>
        <PlaceHero place={place} />

        <Reveal id="historia">
          <PlaceStory place={place} />
        </Reveal>

        <Marquee text={`${place.name} · ${place.tagline}`} cta={{ label: "Planejar visita", href: "/planejar" }} />

        {place.experiences.length > 0 ? (
          <Reveal id="experiencias">
            <ExperienceBlock place={place} items={place.experiences} />
          </Reveal>
        ) : null}

        <Reveal>
          <PlaceGallery place={place} caption={place.description} pictures={pictures} />
        </Reveal>

        <Reveal>
          <ShareBlock title={place.name} path={`/${place.slug}`} />
        </Reveal>
      </div>
    </ContentShell>
  );
}

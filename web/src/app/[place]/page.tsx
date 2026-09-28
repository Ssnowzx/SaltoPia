import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentShell } from "@/components/content/content-shell";
import { ExperienceItinerary } from "@/components/content/experience-itinerary";
import { Marquee } from "@/components/content/marquee";
import { MenuBlock } from "@/components/content/menu-block";
import { PlaceHero } from "@/components/content/place-hero";
import { PlaceGallery } from "@/components/content/place-sections";
import { placeTheme } from "@/components/content/place-theme";
import { PlaceWelcome } from "@/components/content/place-welcome";
import { PostcardShare } from "@/components/content/postcard-share";
import { galleryFor } from "@/lib/gallery";
import { pickPrints } from "@/lib/menu-layout";
import { getPlaceBySlug, getPlaceMenu, getPlaces } from "@/lib/places";

/**
 * A place's page.
 *
 * It is built around the place's own colour rather than around the site palette: the
 * hero's veil, the ribbon, the block the menu sits on and the postcard's ink all take
 * it, so fifteen places are fifteen pages rather than one page fifteen times. The bands
 * alternate pale and saturated, which is what keeps a long page from reading as one
 * column of text.
 *
 * The hero is pinned and every band after it is drawn on its own opaque ground, so the
 * page slides over the place. That is why the bands reveal their content rather than
 * themselves: a band that faded in whole would show the hero through it.
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
  const [place, places, menu] = await Promise.all([getPlaceBySlug(slug), getPlaces(), getPlaceMenu(slug)]);
  if (!place) notFound();

  // The place's own folder if it has one; otherwise what the page already has, so a
  // place with no gallery yet still shows something rather than nothing.
  const folder = galleryFor(place.slug);
  const pictures = folder.length > 0 ? folder : [place.heroImage, ...place.experiences.map((experience) => experience.image)];

  const prints = pickPrints([
    (menu?.items ?? []).map((item) => ({ src: item.image, caption: item.name })),
    place.experiences.map((experience) => ({ src: experience.image, caption: experience.name })),
    folder.map((picture) => ({ src: picture, caption: "" })),
  ]);

  return (
    <ContentShell places={places}>
      <div style={placeTheme(place.accent)}>
        <PlaceHero place={place} />
        <div className="relative z-[1]">
          <PlaceWelcome place={place} prints={prints} menuCount={menu?.items.length ?? 0} />
          <Marquee text={place.tagline} cta={{ label: "Planejar visita", href: "/planejar" }} />
          {menu ? <MenuBlock place={place} menu={menu} /> : null}
          {place.experiences.length > 0 ? <ExperienceItinerary place={place} /> : null}
          <PlaceGallery place={place} caption={place.description} pictures={pictures} />
          <PostcardShare place={place} path={`/${place.slug}`} />
        </div>
      </div>
    </ContentShell>
  );
}

import Image from "next/image";

import { galleryLayout, type GalleryLayout, type GalleryTile } from "@/lib/menu-layout";
import type { Place, StyleWithVariables } from "@/types";

import { Reveal } from "./reveal";

/** Written out whole so the stylesheet generator can find every class. */
const COLUMNS: Readonly<Record<GalleryLayout["columns"], string>> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

const TILES: Readonly<Record<GalleryTile, string>> = {
  big: "col-span-2 row-span-2",
  wide: "col-span-2",
  small: "",
  wideOnPhone: "col-span-2 sm:col-span-1",
};

function staggerStyle(index: number): StyleWithVariables {
  return { "--i": index };
}

interface GalleryProps {
  readonly place: Place;
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
  const layout = galleryLayout(pictures.length);

  return (
    <section className="grain relative bg-[var(--place-veil)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal as="div" className="flex flex-col gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="font-script text-4xl text-[var(--place-accent)] sm:text-5xl">De perto</p>
            <h2 className="mt-1 font-sans text-3xl leading-tight font-extrabold tracking-[0.02em] text-[var(--place-ink)] uppercase sm:text-5xl">
              {place.name}
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-bark/80 sm:text-right">{caption}</p>
        </Reveal>

        <Reveal as="div" className={`mt-12 grid auto-rows-[150px] grid-cols-2 gap-4 sm:auto-rows-[210px] ${COLUMNS[layout.columns]}`}>
          {pictures.map((picture, index) => (
            <div
              key={picture}
              data-stagger
              style={staggerStyle(index)}
              className={`relative overflow-hidden rounded-card border-[6px] border-mist shadow-[0_18px_44px_color-mix(in_srgb,var(--color-night)_18%,transparent)] ${TILES[layout.tiles[index] ?? "small"]}`}
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
        </Reveal>
      </div>
    </section>
  );
}

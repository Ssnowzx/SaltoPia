import type { Place, PlaceMenu } from "@/types";

import { MenuGrid } from "./menu-grid";
import { Reveal } from "./reveal";
import { RidgeEdge } from "./ridge-edge";

interface MenuBlockProps {
  readonly place: Place;
  readonly menu: PlaceMenu;
}

/**
 * The place's menu, on a full block of its colour.
 *
 * The block rises out of the ribbon above it as a range of hills with araucárias on the
 * crest - the ribbon's dark tint is the sky, the place's colour is the land. A handful of
 * cards on a pale page reads as a list; the same cards on a saturated ground read as a
 * collection, which is what the reference's recipe block gets right.
 */
export function MenuBlock({ place, menu }: MenuBlockProps): React.ReactElement {
  return (
    <section id="cardapio" className="relative bg-[var(--place-accent)] text-mist [--ticket-ground:var(--place-accent)]">
      <div className="bg-[var(--place-deep)] text-[var(--place-accent)]">
        <RidgeEdge className="block h-16 w-full sm:h-28" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-5 pt-10 pb-24 sm:px-8 sm:pt-12 sm:pb-32">
        <Reveal as="div">
          <header className="text-center">
            <p className="font-script text-4xl text-[var(--place-wash)] sm:text-5xl">Abra o apetite</p>
            <h2 className="mt-2 font-sans text-[clamp(2.25rem,5vw,4rem)] leading-[0.95] font-extrabold tracking-[0.02em] uppercase">{menu.title}</h2>
            <p className="mx-auto mt-5 max-w-2xl font-sans text-lg font-semibold text-mist/90">{menu.lede}</p>
          </header>
          <MenuGrid place={{ slug: place.slug, name: place.name, accent: place.accent }} menuTitle={menu.title} items={menu.items} />
        </Reveal>
      </div>
    </section>
  );
}

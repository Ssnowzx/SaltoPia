import Image from "next/image";

import type { Place } from "@/types";

interface SiteFooterProps {
  readonly places: readonly Place[];
}

/** The foot of every content page: the wordmark, the destinations, and where this is. */
export function SiteFooter({ places }: SiteFooterProps): React.ReactElement {
  return (
    <footer className="bg-araucaria text-mist">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="/" aria-label="Saltopia - início">
            <Image src="/logo-saltopia-flat.png" alt="Saltopia" width={900} height={370} className="h-14 w-auto" />
          </a>
          <p className="mt-6 max-w-sm font-sans text-sm leading-relaxed text-mist/80">
            A comunidade do Salto do Rio Caveiras, em Lages, na Serra Catarinense. Araucárias, lago, fogo de chão e a usina que iluminou a cidade.
          </p>
          <p className="mt-6 font-sans text-[11px] font-bold tracking-[0.3em] text-gold uppercase">Est. 2028 · Serra Catarinense</p>
        </div>
        <nav aria-label="Destinos">
          <h2 className="font-script text-2xl text-gold">Destinos</h2>
          <ul className="mt-4 columns-2 gap-6 md:columns-1">
            {places.map((place) => (
              <li key={place.slug} className="break-inside-avoid">
                <a href={`/${place.slug}`} className="block py-1 font-sans text-sm font-semibold text-mist/90 transition-colors hover:text-gold">
                  {place.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Saltopia">
          <h2 className="font-script text-2xl text-gold">Saltopia</h2>
          <ul className="mt-4">
            <li><a href="/" className="block py-1 font-sans text-sm font-semibold text-mist/90 transition-colors hover:text-gold">Voltar ao mapa</a></li>
            <li><a href="/experiencias" className="block py-1 font-sans text-sm font-semibold text-mist/90 transition-colors hover:text-gold">Todas as experiências</a></li>
            <li><a href="/planejar" className="block py-1 font-sans text-sm font-semibold text-mist/90 transition-colors hover:text-gold">Planejar visita</a></li>
          </ul>
          <p className="mt-8 font-sans text-xs leading-relaxed text-mist/60">
            Saltopia é uma comunidade imaginada para um trabalho acadêmico. As imagens são renders do próprio mapa.
          </p>
        </nav>
      </div>
    </footer>
  );
}

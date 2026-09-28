import Image from "next/image";

import type { Place } from "@/types";

interface SiteFooterProps {
  readonly places: readonly Place[];
}

const LINK = "block py-1 font-sans text-sm font-semibold text-mist/85 transition-colors hover:text-gold";

/**
 * The foot of every content page, on the night-blue of the Serra: the wordmark large,
 * the destinations, the site's own links and an invitation to the contest - the
 * reference closes its pages by selling its contest, and so do we.
 */
export function SiteFooter({ places }: SiteFooterProps): React.ReactElement {
  return (
    <footer className="bg-night text-mist">
      <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-12 sm:px-8 sm:pt-20">
        <a href="/" aria-label="Saltopia - início" className="mx-auto block w-max">
          <Image src="/logo-saltopia-flat.png" alt="Saltopia" width={900} height={370} className="h-20 w-auto sm:h-28" />
        </a>

        <div className="mt-12 flex flex-col items-start gap-6 rounded-card bg-wine p-8 shadow-[0_24px_50px_color-mix(in_srgb,black_25%,transparent)] sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-script text-3xl text-gold sm:text-4xl">Saltopia precisa de você</p>
            <p className="mt-1 font-sans text-3xl leading-none font-extrabold tracking-[0.02em] uppercase sm:text-5xl">Seja embaixador</p>
          </div>
          <p className="max-w-sm font-sans text-base leading-relaxed text-mist/85">
            Mostre por que você é a cara da Serra e concorra a um ano de produtos dos nossos parceiros.
          </p>
          <a
            href="/embaixador"
            className="shrink-0 rounded-button bg-gold px-6 py-3.5 font-sans text-sm font-bold tracking-[0.1em] text-night uppercase transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-gold/40 focus-visible:outline-none"
          >
            Entrar na disputa
          </a>
        </div>

        <div className="mt-14 grid gap-12 md:grid-cols-[1fr_1.7fr_0.9fr]">
          <div>
            <p className="max-w-sm font-sans text-sm leading-relaxed text-mist/75">
              A comunidade do Salto do Rio Caveiras, em Lages, na Serra Catarinense. Araucárias, lago, fogo de chão e a usina que iluminou a cidade.
            </p>
            <p className="mt-6 font-sans text-[11px] font-bold tracking-[0.3em] text-gold uppercase">Est. 2028 · Serra Catarinense</p>
          </div>

          <nav aria-label="Destinos">
            <h2 className="font-script text-2xl text-gold">Destinos</h2>
            <ul className="mt-4 columns-2 gap-6">
              {places.map((place) => (
                <li key={place.slug} className="break-inside-avoid">
                  <a href={`/${place.slug}`} className={LINK}>
                    {place.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Saltopia">
            <h2 className="font-script text-2xl text-gold">Saltopia</h2>
            <ul className="mt-4">
              <li>
                <a href="/" className={LINK}>
                  Voltar ao mapa
                </a>
              </li>
              <li>
                <a href="/experiencias" className={LINK}>
                  Todas as experiências
                </a>
              </li>
              <li>
                <a href="/planejar" className={LINK}>
                  Planejar visita
                </a>
              </li>
              <li>
                <a href="/embaixador" className={LINK}>
                  Seja embaixador
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-14 border-t border-mist/15 pt-6 text-center font-sans text-xs leading-relaxed text-mist/55">
          Saltopia é uma comunidade imaginada para um trabalho acadêmico. Os lugares são inventados; a paisagem do Salto do Rio Caveiras, não.
        </p>
      </div>
    </footer>
  );
}

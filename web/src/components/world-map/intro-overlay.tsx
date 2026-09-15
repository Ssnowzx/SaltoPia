"use client";

import Image from "next/image";

/**
 * The title state the hub opens on: wordmark, tagline and a single way in, over the
 * world already rendering behind it. See the world-map spec, "Entry sequence".
 */

interface IntroOverlayProps {
  readonly onExplore: () => void;
}

export function IntroOverlay({ onExplore }: IntroOverlayProps): React.ReactElement {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(246,229,188,0.28)_0%,rgba(246,229,188,0.5)_60%,rgba(246,229,188,0.7)_100%)] px-6 text-center">
      <p className="font-script text-3xl text-teal sm:text-4xl">Bem-vindo a</p>
      <h1 className="mt-3 w-full max-w-[760px]">
        <Image
          src="/logo-saltopia.png"
          alt="Saltopia - Salto Caveiras, Serra Catarinense"
          width={900}
          height={364}
          priority
          className="h-auto w-full drop-shadow-[0_10px_26px_rgba(46,36,28,0.28)]"
        />
      </h1>
      <p className="mt-5 max-w-xl font-sans text-base font-semibold text-bark sm:text-lg">
        A comunidade do Salto do Rio Caveiras, em Lages — araucárias, lago, fogo de chão e a
        usina que iluminou a cidade.
      </p>
      <button
        type="button"
        onClick={onExplore}
        className="mt-8 rounded-button bg-teal-deep px-8 py-4 font-sans text-sm font-bold tracking-[0.12em] text-mist uppercase shadow-[0_12px_30px_rgba(196,82,46,0.35)] transition-transform duration-200 hover:scale-105 hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none"
      >
        Explorar Saltopia
      </button>
    </div>
  );
}

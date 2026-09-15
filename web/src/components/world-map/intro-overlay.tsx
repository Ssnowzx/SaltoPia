"use client";

import Image from "next/image";

/**
 * The title state the hub opens on: wordmark, tagline and a single way in.
 *
 * It is on screen from the first paint, so the site never opens on an empty page. What
 * changes when the world is ready is only what lies behind it: an opaque sky while the
 * scene is being built, fading to the translucent cream the world reads through. The
 * wordmark does not move, so the map appearing is the only thing that happens.
 */

interface IntroOverlayProps {
  readonly onExplore: () => void;
  /** True once the world has been drawn. Until then there is nothing to explore. */
  readonly ready: boolean;
}

export function IntroOverlay({ onExplore, ready }: IntroOverlayProps): React.ReactElement {
  return (
    <div data-ready={ready} className="intro absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
      {/* The sky, covering the canvas until the world is drawn. */}
      <div
        aria-hidden="true"
        className="intro-sky absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-sky-high)_0%,var(--color-sky-mid)_38%,var(--color-sky-low)_62%,var(--color-sky-haze)_100%)]"
      />
      {/* The veil the world reads through, once there is a world. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,229,188,0.46)_0%,rgba(246,229,188,0.6)_55%,rgba(246,229,188,0.72)_100%)]"
      />

      <div className="relative flex flex-col items-center">
        <p className="intro-lede font-script text-3xl text-teal sm:text-4xl">Bem-vindo a</p>
        {/* The card's own margin is part of the picture, so the box is wider than the
            emblem looks. Sized by what reads, not by the file. */}
        <h1 className="-mt-6 w-full max-w-[1000px]">
          <Image
            src="/logo-saltopia.png"
            alt="Saltopia - Salto Caveiras, Serra Catarinense"
            width={1000}
            height={495}
            priority
            className="h-auto w-full"
          />
        </h1>
        {/* The map is behind this, and dark type on a busy picture is unreadable however
            dark it is. The halo is the page's own cream, so the text sits on the light
            it needs without a panel getting in the way of the world. */}
        <p className="intro-lede -mt-2 max-w-xl font-sans text-base font-semibold text-bark sm:text-lg">
          A comunidade do Salto do Rio Caveiras, em Lages — araucárias, lago, fogo de chão e a
          usina que iluminou a cidade.
        </p>
        <button
          type="button"
          onClick={onExplore}
          disabled={!ready}
          className="mt-8 rounded-button bg-teal-deep px-8 py-4 font-sans text-sm font-bold tracking-[0.12em] text-mist uppercase shadow-[0_12px_30px_rgba(196,82,46,0.35)] transition-transform duration-200 not-disabled:hover:scale-105 not-disabled:hover:bg-teal-dark focus-visible:ring-4 focus-visible:ring-teal/40 focus-visible:outline-none disabled:opacity-60"
        >
          {ready ? "Explorar Saltopia" : "Chegando a Saltopia…"}
        </button>
      </div>
    </div>
  );
}

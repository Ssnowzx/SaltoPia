"use client";

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
      <p className="font-script text-3xl text-ember sm:text-4xl">Bem-vindo a</p>
      <h1 className="mt-2 font-sans text-6xl leading-none font-black tracking-[0.06em] text-araucaria drop-shadow-[0_4px_0_rgba(255,249,236,0.9)] sm:text-8xl">
        SERRANÓPOLIS
      </h1>
      <p className="mt-4 max-w-xl font-sans text-base font-semibold text-bark sm:text-lg">
        Um bairro novo de Lages, na Serra Catarinense — araucárias, fogo de chão, neblina e o
        Salto do Rio Caveiras.
      </p>
      <button
        type="button"
        onClick={onExplore}
        className="mt-8 rounded-button bg-ember-deep px-8 py-4 font-sans text-sm font-bold tracking-[0.12em] text-mist uppercase shadow-[0_12px_30px_rgba(196,82,46,0.35)] transition-transform duration-200 hover:scale-105 hover:bg-ember-dark focus-visible:ring-4 focus-visible:ring-ember/40 focus-visible:outline-none"
      >
        Explorar Serranópolis
      </button>
    </div>
  );
}

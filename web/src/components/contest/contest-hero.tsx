import { CONTEST_NAME } from "@/lib/contest/content";

import { SkylineScene } from "./skyline-scene";

/**
 * The contest's opening: an invitation in script, the title set huge and filled with a
 * photograph of the falls, a wine ribbon under it, the promise, and the community in
 * silhouette below.
 *
 * The title's shadow is a second copy of the word in night-blue, set behind and offset;
 * it is hidden from assistive technology so the heading reads once.
 */
export function ContestHero(): React.ReactElement {
  return (
    <section className="grain relative overflow-hidden bg-mist pt-32 sm:pt-40">
      <div className="relative mx-auto w-full max-w-6xl px-5 text-center sm:px-8">
        <p className="font-script text-4xl text-wine sm:text-6xl">Candidate-se a</p>
        <h1 aria-label={CONTEST_NAME} className="mt-1 flex flex-col items-center">
          <span className="relative inline-block font-sans text-[clamp(3rem,11vw,10.5rem)] leading-[0.9] font-extrabold tracking-[-0.02em] uppercase">
            <span aria-hidden="true" className="absolute inset-0 translate-x-[0.04em] translate-y-[0.045em] text-night">
              Embaixador
            </span>
            <span aria-hidden="true" className="photo-type relative">
              Embaixador
            </span>
          </span>
          <span
            aria-hidden="true"
            className="mt-3 -rotate-2 bg-wine px-10 py-2 font-sans text-xl font-extrabold tracking-[0.16em] text-mist uppercase shadow-[0_12px_24px_color-mix(in_srgb,var(--color-night)_25%,transparent)] [clip-path:polygon(0_0,100%_0,96%_50%,100%_100%,0_100%,4%_50%)] sm:px-16 sm:text-3xl"
          >
            de Saltopia
          </span>
        </h1>
        <p className="mt-10 font-sans text-[clamp(1.75rem,4vw,3rem)] leading-tight font-extrabold text-wine uppercase">Um ano de Serra na sua mesa</p>
        <p className="mx-auto mt-4 max-w-xl font-sans text-lg text-bark/85">
          Mostre por que você é a cara da Serra. Quem vencer leva um ano de produtos dos nossos parceiros, um fim de semana na pousada e a faixa de embaixador.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#como-participar"
            className="rounded-button bg-night px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] text-mist uppercase transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-night/30 focus-visible:outline-none"
          >
            Como participar
          </a>
          <a
            href="#premio"
            className="rounded-button border-2 border-night px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] text-night uppercase transition-colors duration-200 hover:bg-night/10 focus-visible:ring-4 focus-visible:ring-night/30 focus-visible:outline-none"
          >
            Ver o prêmio
          </a>
        </div>
      </div>
      <SkylineScene className="mt-14 block h-[180px] w-full sm:mt-16 sm:h-[300px]" />
    </section>
  );
}

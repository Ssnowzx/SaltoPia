import { Reveal } from "@/components/content/reveal";
import { RidgeEdge } from "@/components/content/ridge-edge";
import { IDEAS } from "@/lib/contest/content";

import { IdeaDeck } from "./idea-deck";

/**
 * "Sem inspiração?" - the deck of campaign ideas on the cream ground, rising out of the
 * night band above as the Serra's skyline.
 */
export function IdeasSection(): React.ReactElement {
  return (
    <section className="grain relative overflow-x-clip bg-mist">
      <div className="bg-night text-mist">
        <RidgeEdge className="block h-16 w-full sm:h-28" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-5 pt-14 pb-24 sm:px-8 sm:pt-16">
        <Reveal as="div" className="text-center">
          <p className="font-script text-4xl text-night sm:text-6xl">Sem inspiração?</p>
          <h2 className="mt-1 font-sans text-[clamp(2.5rem,7vw,5.5rem)] leading-none font-extrabold tracking-[0.01em] text-wine uppercase">
            Tire uma <span className="marker">carta</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg font-sans text-lg font-semibold text-night/80">Oito ideias de campanha no baralho. Se uma não servir, tire outra - nenhuma repete antes de passar todas.</p>
        </Reveal>
        <div className="mt-10">
          <IdeaDeck ideas={IDEAS} />
        </div>
      </div>
    </section>
  );
}

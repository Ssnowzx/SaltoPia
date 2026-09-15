import type { Metadata } from "next";

import { ContentShell } from "@/components/content/content-shell";
import { Reveal } from "@/components/content/reveal";
import { getPlaces } from "@/lib/places";

export const metadata: Metadata = {
  title: "Planejar visita",
  description: "Como chegar a Saltopia, quando ir e por onde começar.",
};

/** The practical page: how to get there, when, and where to start. */
export default async function PlanPage(): Promise<React.ReactElement> {
  const places = await getPlaces();

  return (
    <ContentShell places={places}>
      <header className="bg-araucaria px-6 pt-40 pb-16 text-center text-mist sm:px-8">
        <p className="font-script text-3xl text-gold sm:text-4xl">Antes de vir</p>
        <h1 className="mt-2 font-sans text-4xl font-extrabold tracking-[0.04em] uppercase sm:text-6xl">Planejar visita</h1>
      </header>

      <Reveal className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-20 sm:px-8 md:grid-cols-3">
        <article>
          <h2 className="font-sans text-xs font-bold tracking-[0.3em] text-teal uppercase">Como chegar</h2>
          <p className="mt-3 font-sans text-base leading-relaxed text-bark/85">
            Saltopia fica no Salto do Rio Caveiras, a cerca de 30 minutos do centro de Lages pela estrada do Salto. A rua principal chega pela orla e sobe até o planalto, onde ficam as fazendas e o porto de OVNIs.
          </p>
        </article>
        <article>
          <h2 className="font-sans text-xs font-bold tracking-[0.3em] text-teal uppercase">Quando ir</h2>
          <p className="mt-3 font-sans text-base leading-relaxed text-bark/85">
            De abril a julho é a safra do pinhão e o frio da serra; o fim de tarde no lago é o melhor horário do dia em qualquer estação. No inverno, leve casaco: a geada é ponto turístico.
          </p>
        </article>
        <article>
          <h2 className="font-sans text-xs font-bold tracking-[0.3em] text-teal uppercase">Por onde começar</h2>
          <p className="mt-3 font-sans text-base leading-relaxed text-bark/85">
            Pela Praça do Pinhão, na beira do lago. De lá se vê a ilha, a barragem e a subida para os chalés — e o mapa 3D mostra o resto.
          </p>
        </article>
      </Reveal>

      <Reveal className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-8">
        <div className="rounded-card bg-teal px-8 py-10 text-center text-mist sm:px-12">
          <p className="font-script text-3xl text-gold">Escolha um destino</p>
          <h2 className="mt-1 font-sans text-2xl font-extrabold tracking-[0.03em] uppercase sm:text-3xl">Explore o mapa e reserve pelo lugar</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/" className="rounded-button bg-gold px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] text-araucaria uppercase transition-transform duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-mist/50 focus-visible:outline-none">
              Abrir o mapa
            </a>
            <a href="/experiencias" className="rounded-button border-2 border-mist/70 px-6 py-3 font-sans text-sm font-bold tracking-[0.1em] uppercase transition-colors duration-200 hover:bg-mist/10 focus-visible:ring-4 focus-visible:ring-mist/50 focus-visible:outline-none">
              Ver experiências
            </a>
          </div>
        </div>
      </Reveal>
    </ContentShell>
  );
}

import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seeds the nine points of interest of Saltopia - the community at the Salto do Rio
 * Caveiras reservoir.
 *
 * World coordinates describe the map: the lake with its island sits in the middle
 * distance (negative Z), the community on the near shore, the dam and the falls at the
 * lake's east end. Camera positions are authored rather than derived, because each
 * place wants a different framing.
 *
 * Copy is Brazilian Portuguese; identifiers and comments are English.
 */

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ""),
});

interface PlaceSeed {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  world: [number, number, number];
  camera: [number, number, number];
  experiences: ReadonlyArray<{
    slug: string;
    name: string;
    description: string;
    kind: "FOOD" | "TRAIL" | "TOUR" | "EVENT" | "STAY";
    durationMinutes: number | null;
  }>;
}

const PLACES: readonly PlaceSeed[] = [
  {
    slug: "praca-do-pinhao",
    name: "Praça do Pinhão",
    tagline: "O coração da comunidade, de frente para o lago",
    description:
      "Tudo começa aqui: o coreto branco, o café com guarda-sóis, o píer que entra no lago e o cheiro de pinhão assando na panela de ferro. É onde a Festa do Pinhão toma conta da beira d'água toda virada de outono.",
    world: [48, 0, 12],
    camera: [46, 22, 50],
    experiences: [
      { slug: "pinhao-na-panela", name: "Pinhão na panela de ferro", description: "O pinhão cozido no ponto, servido quente no cone de papel, olhando o lago.", kind: "FOOD", durationMinutes: 20 },
      { slug: "festa-do-pinhao", name: "Festa do Pinhão", description: "Três dias de música, fogo de chão e gente na beira do lago.", kind: "EVENT", durationMinutes: null },
    ],
  },
  {
    slug: "galpao-do-fogo",
    name: "Galpão do Fogo de Chão",
    tagline: "A costela que leva seis horas",
    description:
      "Um galpão aberto dos quatro lados na margem oeste, com a costela espetada em vara de ferro inclinada sobre a brasa. Seis horas de fogo baixo e nada mais. A fumaça sai pelo telhado e se vê do outro lado do lago.",
    world: [140, 0, 38],
    camera: [128, 22, 74],
    experiences: [
      { slug: "costela-fogo-de-chao", name: "Costela de fogo de chão", description: "Seis horas na brasa, sal grosso e mais nada. Serve na tábua, corta na hora.", kind: "FOOD", durationMinutes: 90 },
      { slug: "roda-de-galpao", name: "Roda de galpão", description: "Violão, causo e chimarrão em volta do fogo até a brasa baixar.", kind: "EVENT", durationMinutes: 120 },
    ],
  },
  {
    slug: "mirante-da-neblina",
    name: "Mirante da Neblina",
    tagline: "O lago inteiro aos seus pés",
    description:
      "Uma plataforma de pedra no alto do morro a oeste. Nas manhãs frias a neblina cobre o lago até a ilha, e você fica em cima dela. Chegue antes do sol nascer — depois das nove, o mar de nuvem já foi embora.",
    world: [-132, 0, -96],
    camera: [-112, 30, -44],
    experiences: [
      { slug: "mar-de-nuvens", name: "Mar de nuvens ao amanhecer", description: "Saída às cinco da manhã. Café quente na garrafa e o lago sumindo debaixo da nuvem.", kind: "TOUR", durationMinutes: 150 },
    ],
  },
  {
    slug: "bosque-das-araucarias",
    name: "Bosque das Araucárias",
    tagline: "A ilha no meio do lago",
    description:
      "A ilha é um bosque de araucárias que já estavam ali muito antes da represa. Chega-se de barco, a partir do píer da praça; na margem sul há duas cabanas em palafita e um píer próprio, e a trilha dá a volta na ilha em meia hora.",
    world: [-60, 0, -44],
    camera: [-44, 26, 10],
    experiences: [
      { slug: "travessia-de-barco", name: "Travessia de barco", description: "Dez minutos de lancha do píer da praça até a ilha, com o sol batendo na água.", kind: "TOUR", durationMinutes: 30 },
      { slug: "trilha-da-ilha", name: "Trilha da ilha", description: "A volta completa por baixo das araucárias, com guia que sabe a idade de cada uma.", kind: "TRAIL", durationMinutes: 45 },
    ],
  },
  {
    slug: "vinicola-de-altitude",
    name: "Vinícola de Altitude",
    tagline: "Uva que amadurece no frio",
    description:
      "Na encosta leste, mil e duzentos metros acima do mar, a uva amadurece devagar e a geada faz parte do plano. As parreiras descem o morro em fileiras até a cantina de pedra.",
    world: [150, 0, -44],
    camera: [138, 24, -4],
    experiences: [
      { slug: "degustacao-na-cantina", name: "Degustação na cantina", description: "Cinco rótulos de altitude, queijo da serra e o lago pela janela.", kind: "FOOD", durationMinutes: 60 },
      { slug: "caminhada-entre-parreiras", name: "Caminhada entre as parreiras", description: "Do alto da encosta até a cantina, pelo meio das videiras.", kind: "TRAIL", durationMinutes: 45 },
    ],
  },
  {
    slug: "ctg-porteira-do-tropeiro",
    name: "CTG Porteira do Tropeiro",
    tagline: "A tradição que não virou museu",
    description:
      "Galpão comprido de cal branca, varanda funda e a porteira de madeira com a lanterna de ferro pendurada, aberta para a rua. Aqui o tropeirismo não está atrás de vidro: tem baile, tem prenda, tem chimarrão rodando.",
    world: [108, 0, 104],
    camera: [98, 20, 140],
    experiences: [
      { slug: "baile-de-galpao", name: "Baile de galpão", description: "Gaita, chula e o chão de tábua tremendo até tarde.", kind: "EVENT", durationMinutes: 240 },
    ],
  },
  {
    slug: "estacao-velha",
    name: "Estação Velha",
    tagline: "O trem parou, a feira ficou",
    description:
      "Na entrada da comunidade, a estação não recebe trem desde os anos setenta, mas a plataforma nunca esvaziou. Virou feira: queijo, mel de melato, cuca, e os trilhos sumindo na neblina.",
    world: [150, 0, 120],
    camera: [140, 22, 156],
    experiences: [
      { slug: "feira-da-plataforma", name: "Feira da plataforma", description: "Sábado de manhã, debaixo da cobertura de zinco. Queijo curado, cuca de banana e melato.", kind: "FOOD", durationMinutes: 60 },
    ],
  },
  {
    slug: "pousada-da-geada",
    name: "Pousada da Geada",
    tagline: "Piscina, lareira e o lago na janela",
    description:
      "A casa laranja de dois andares na beira do lago, com a piscina no gramado, painéis solares no telhado e a lareira acesa metade do ano. De manhã a geada deixa o gramado branco até o sol subir — e é por isso que as pessoas vêm.",
    world: [20, 0, 120],
    camera: [26, 20, 156],
    experiences: [
      { slug: "noite-de-lareira", name: "Noite de lareira", description: "Quarto com sacada para o lago, café colonial na chegada e lenha à vontade.", kind: "STAY", durationMinutes: null },
    ],
  },
  {
    slug: "fazenda-do-cedro",
    name: "Fazenda do Cedro",
    tagline: "Campo aberto, gado e um café que dura a manhã inteira",
    description:
      "Meia hora de estrada de chão depois da comunidade, o mato abre e aparece o campo: galpão vermelho, dois silos e a casa branca no meio do pasto. O café colonial sai às nove, com cuca, melado e queijo da própria leiteria.",
    world: [202, 0, 28],
    camera: [186, 26, 68],
    experiences: [
      { slug: "cafe-colonial-da-fazenda", name: "Café colonial da fazenda", description: "Mesa posta na varanda com cuca de banana, melado de cana, queijo curado e leite tirado na hora.", kind: "FOOD", durationMinutes: 90 },
      { slug: "cavalgada-pelo-campo", name: "Cavalgada pelo campo", description: "Duas horas a cavalo pelo pasto alto, com parada no açude para o chimarrão.", kind: "TOUR", durationMinutes: 120 },
    ],
  },
  {
    slug: "fazenda-santa-barbara",
    name: "Fazenda Santa Bárbara",
    tagline: "A sede de 1912 e o galpão de tropeiro",
    description:
      "A fazenda mais antiga do planalto, ainda na mesma família. A sede de madeira tem o assoalho original e o galpão guarda os arreios de quatro gerações de tropeiros que desciam a serra por aqui.",
    world: [214, 0, -96],
    camera: [198, 26, -56],
    experiences: [
      { slug: "visita-a-sede-historica", name: "Visita à sede histórica", description: "A casa de 1912 por dentro, com quem cresceu nela contando cada cômodo.", kind: "TOUR", durationMinutes: 60 },
      { slug: "tarde-de-ordenha", name: "Tarde de ordenha", description: "Fim de tarde no curral, com as crianças aprendendo a tirar leite no balde.", kind: "EVENT", durationMinutes: 45 },
    ],
  },
  {
    slug: "fazenda-dos-pinheiros",
    name: "Fazenda dos Pinheiros",
    tagline: "Araucárias centenárias e a safra do pinhão",
    description:
      "No alto, atrás do morro dos chalés, um pinheiral que ninguém derrubou. Na safra, de abril a julho, a fazenda abre a colheita para quem quiser subir e trazer o pinhão do chão.",
    world: [176, 0, -176],
    camera: [162, 28, -136],
    experiences: [
      { slug: "colheita-do-pinhao", name: "Colheita do pinhão", description: "Manhã inteira debaixo das araucárias, cesto na mão, com quem conhece a safra.", kind: "TRAIL", durationMinutes: 90 },
    ],
  },
  {
    slug: "porto-de-ovnis",
    name: "Porto de OVNIs",
    tagline: "A pista de pouso do planalto",
    description:
      "No alto do planalto, longe das luzes da comunidade, um pátio de concreto com balizas acesas espera visita. A torre opera desde 2028 e o registro de avistamentos fica aberto na sala de controle — o céu limpo da serra é o melhor do país para isso, e quase toda noite alguém jura ter visto algo.",
    world: [22, 0, -288],
    camera: [26, 30, -224],
    experiences: [
      { slug: "vigilia-no-patio", name: "Vigília no pátio", description: "Madrugada inteira no concreto, cobertor, chimarrão e o céu da serra aberto de ponta a ponta.", kind: "EVENT", durationMinutes: 300 },
      { slug: "visita-a-torre", name: "Visita à torre de controle", description: "O rádio, a antena e o livro de avistamentos aberto desde a primeira noite.", kind: "TOUR", durationMinutes: 40 },
    ],
  },
  {
    slug: "salto-caveiras",
    name: "Salto do Rio Caveiras",
    tagline: "A barragem, a queda e a usina centenária",
    description:
      "No fim do lago, o Rio Caveiras passa pela barragem de pedra e despenca ao lado da usina de tijolo que iluminou Lages nos anos 1940. Do deck de madeira na outra margem dá para ouvir a água de longe; embaixo das araucárias, as mesas de piquenique enchem no fim de semana.",
    world: [118, 0, -98],
    camera: [92, 30, -56],
    experiences: [
      { slug: "mirante-do-salto", name: "Deck do Salto", description: "A passarela sobre o rio e o deck de frente para a queda. Vá de manhã, quando o sol bate na água.", kind: "TOUR", durationMinutes: 40 },
      { slug: "trilha-da-usina", name: "Trilha da usina", description: "Da barragem ao conduto forçado e à casa de máquinas, com guia que conhece cada válvula.", kind: "TRAIL", durationMinutes: 60 },
      { slug: "piquenique-a-beira-do-rio", name: "Piquenique à beira do rio", description: "Cesta com queijo, salame e pão de casa, mesa reservada debaixo das araucárias.", kind: "FOOD", durationMinutes: 90 },
    ],
  },
];

async function main(): Promise<void> {
  for (const [index, place] of PLACES.entries()) {
    const [worldX, worldY, worldZ] = place.world;
    const [cameraX, cameraY, cameraZ] = place.camera;
    const experiences = place.experiences.map((experience, experienceIndex) => ({
      ...experience,
      image: `/images/experiences/${experience.slug}.webp`,
      position: experienceIndex,
      published: true,
    }));

    // Upsert so the seed is safe to re-run; experiences are replaced wholesale
    // because they have no identity worth preserving across seeds.
    await prisma.place.upsert({
      where: { slug: place.slug },
      update: {
        name: place.name,
        tagline: place.tagline,
        description: place.description,
        worldX,
        worldY,
        worldZ,
        cameraX,
        cameraY,
        cameraZ,
        position: index,
        published: true,
        experiences: { deleteMany: {}, create: experiences },
      },
      create: {
        slug: place.slug,
        name: place.name,
        tagline: place.tagline,
        description: place.description,
        crestImage: `/images/crests/${place.slug}.webp`,
        heroImage: `/images/heroes/${place.slug}.webp`,
        worldX,
        worldY,
        worldZ,
        cameraX,
        cameraY,
        cameraZ,
        position: index,
        published: true,
        experiences: { create: experiences },
      },
    });
  }

  const places = await prisma.place.count();
  const experiences = await prisma.experience.count();
  process.stdout.write(`Seeded ${places} places and ${experiences} experiences.\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seeds the eight points of interest of Serranopolis.
 *
 * World coordinates describe a bowl roughly 120 units across: the mountains and the
 * lookout sit at negative Z, the river runs across the middle, and the square is at
 * the origin. Camera positions are authored rather than derived, because each place
 * wants a different framing - the lookout reads best from low and behind, the square
 * from high and square-on.
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
    tagline: "O coração de Serranópolis",
    description:
      "Tudo em Serranópolis começa aqui. O coreto branco no meio da praça, as araucárias em volta, e o cheiro de pinhão assando na panela de ferro que não apaga nem no calor. É onde a Festa do Pinhão toma conta do bairro inteiro toda virada de outono.",
    world: [0, 0, 0],
    camera: [0, 26, 34],
    experiences: [
      {
        slug: "pinhao-na-panela",
        name: "Pinhão na panela de ferro",
        description:
          "O pinhão cozido no ponto, servido quente no cone de papel. Simples assim, e é o que todo mundo lembra depois.",
        kind: "FOOD",
        durationMinutes: 20,
      },
      {
        slug: "festa-do-pinhao",
        name: "Festa do Pinhão",
        description:
          "Três dias de música, fogo de chão e gente na rua. O bairro inteiro vira praça.",
        kind: "EVENT",
        durationMinutes: null,
      },
    ],
  },
  {
    slug: "galpao-do-fogo",
    name: "Galpão do Fogo de Chão",
    tagline: "A costela que leva seis horas",
    description:
      "Um galpão aberto dos quatro lados, com a costela espetada em vara de ferro inclinada sobre a brasa. Seis horas de fogo baixo e nada mais — sem pressa, sem atalho. A fumaça sai pelo telhado e se vê de longe.",
    world: [-28, 0, 14],
    camera: [-40, 18, 36],
    experiences: [
      {
        slug: "costela-fogo-de-chao",
        name: "Costela de fogo de chão",
        description:
          "Seis horas na brasa, sal grosso e mais nada. Serve na tábua, corta na hora.",
        kind: "FOOD",
        durationMinutes: 90,
      },
      {
        slug: "roda-de-galpao",
        name: "Roda de galpão",
        description: "Violão, causo e chimarrão em volta do fogo até a brasa baixar.",
        kind: "EVENT",
        durationMinutes: 120,
      },
    ],
  },
  {
    slug: "mirante-da-neblina",
    name: "Mirante da Neblina",
    tagline: "Onde o vale vira mar",
    description:
      "Uma plataforma de pedra na beira do cânion. Nas manhãs frias o vale enche de nuvem até onde a vista alcança, e você fica em cima. Chegue antes do sol nascer — depois das nove, o mar de nuvem já foi embora.",
    world: [2, 14, -46],
    camera: [10, 24, -22],
    experiences: [
      {
        slug: "mar-de-nuvens",
        name: "Mar de nuvens ao amanhecer",
        description:
          "Saída às cinco da manhã. Café quente na garrafa e o vale sumindo debaixo da nuvem.",
        kind: "TOUR",
        durationMinutes: 150,
      },
    ],
  },
  {
    slug: "bosque-das-araucarias",
    name: "Bosque das Araucárias",
    tagline: "Mata de duzentos anos",
    description:
      "Trilha de terra entre araucárias que já estavam aqui muito antes do bairro. Tronco limpo até lá em cima, copa achatada feito guarda-chuva, e a luz entrando de lado no fim da tarde.",
    world: [-38, 2, -34],
    camera: [-52, 20, -12],
    experiences: [
      {
        slug: "trilha-das-araucarias",
        name: "Trilha das araucárias",
        description:
          "Dois quilômetros de terra batida, sombra o caminho todo, guia que sabe a idade de cada árvore.",
        kind: "TRAIL",
        durationMinutes: 90,
      },
    ],
  },
  {
    slug: "vinicola-de-altitude",
    name: "Vinícola de Altitude",
    tagline: "Uva que amadurece no frio",
    description:
      "Mil e duzentos metros acima do mar, onde a uva amadurece devagar e a geada faz parte do plano. As parreiras descem a encosta em degraus até a cantina de pedra.",
    world: [30, 6, -30],
    camera: [46, 22, -8],
    experiences: [
      {
        slug: "degustacao-na-cantina",
        name: "Degustação na cantina",
        description: "Cinco rótulos de altitude, queijo da serra e o vale pela janela.",
        kind: "FOOD",
        durationMinutes: 60,
      },
      {
        slug: "caminhada-entre-parreiras",
        name: "Caminhada entre as parreiras",
        description: "Do alto da encosta até a cantina, pelo meio das videiras.",
        kind: "TRAIL",
        durationMinutes: 45,
      },
    ],
  },
  {
    slug: "ctg-porteira-do-tropeiro",
    name: "CTG Porteira do Tropeiro",
    tagline: "A tradição que não virou museu",
    description:
      "Galpão comprido de cal branca, varanda funda e a porteira de madeira com a lanterna de ferro pendurada. Aqui o tropeirismo não está atrás de vidro: tem baile, tem prenda, tem chimarrão rodando.",
    world: [-20, 0, -18],
    camera: [-34, 18, 2],
    experiences: [
      {
        slug: "baile-de-galpao",
        name: "Baile de galpão",
        description: "Gaita, chula e o chão de tábua tremendo até tarde.",
        kind: "EVENT",
        durationMinutes: 240,
      },
    ],
  },
  {
    slug: "estacao-velha",
    name: "Estação Velha",
    tagline: "O trem parou, a feira ficou",
    description:
      "A estação não recebe trem desde os anos setenta, mas a plataforma nunca esvaziou. Virou feira: queijo, mel de melato de bracatinga, cuca, e os trilhos sumindo na neblina no fim do pátio.",
    world: [26, 0, 46],
    camera: [40, 18, 68],
    experiences: [
      {
        slug: "feira-da-plataforma",
        name: "Feira da plataforma",
        description:
          "Sábado de manhã, debaixo da cobertura de zinco. Queijo curado, cuca de banana e melato.",
        kind: "FOOD",
        durationMinutes: 60,
      },
    ],
  },
  {
    slug: "pousada-da-geada",
    name: "Pousada da Geada",
    tagline: "Lareira acesa de maio a setembro",
    description:
      "Casa de pedra e madeira no meio do campo, com a lareira acesa metade do ano. De manhã a geada deixa o campo branco até o sol subir — e é por isso que as pessoas vêm.",
    world: [14, 1, 30],
    camera: [26, 16, 50],
    experiences: [
      {
        slug: "noite-de-lareira",
        name: "Noite de lareira",
        description: "Quarto com vista pro campo, café colonial na chegada e lenha à vontade.",
        kind: "STAY",
        durationMinutes: null,
      },
    ],
  },
  {
    slug: "salto-caveiras",
    name: "Salto do Rio Caveiras",
    tagline: "A cachoeira e a usina centenária",
    description:
      "O Rio Caveiras despenca em dois degraus de basalto ao lado da usina de tijolo que iluminou Lages nos anos 1940. Do mirante de madeira na outra margem dá para ouvir a água de longe; embaixo das araucárias, as mesas de piquenique enchem no fim de semana.",
    world: [48, 2, -66],
    camera: [16, 24, -28],
    experiences: [
      {
        slug: "mirante-do-salto",
        name: "Mirante do Salto",
        description:
          "A passarela sobre o rio e o deck de frente para a queda. Vá de manhã, quando o sol bate na água.",
        kind: "TOUR",
        durationMinutes: 40,
      },
      {
        slug: "trilha-da-usina",
        name: "Trilha da usina",
        description: "Da represa ao conduto forçado e à casa de máquinas, com guia que conhece cada válvula.",
        kind: "TRAIL",
        durationMinutes: 60,
      },
      {
        slug: "piquenique-a-beira-do-rio",
        name: "Piquenique à beira do rio",
        description: "Cesta com queijo, salame e pão de casa, mesa reservada debaixo das araucárias.",
        kind: "FOOD",
        durationMinutes: 90,
      },
    ],
  },
];

async function main(): Promise<void> {
  for (const [index, place] of PLACES.entries()) {
    const [worldX, worldY, worldZ] = place.world;
    const [cameraX, cameraY, cameraZ] = place.camera;

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
        experiences: {
          deleteMany: {},
          create: place.experiences.map((experience, experienceIndex) => ({
            ...experience,
            image: `/images/experiences/${experience.slug}.webp`,
            position: experienceIndex,
            published: true,
          })),
        },
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
        experiences: {
          create: place.experiences.map((experience, experienceIndex) => ({
            ...experience,
            image: `/images/experiences/${experience.slug}.webp`,
            position: experienceIndex,
            published: true,
          })),
        },
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

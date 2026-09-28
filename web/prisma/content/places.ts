import type { PlaceSeed } from "./types";

/**
 * The places of Saltopia - the community at the Salto do Rio Caveiras reservoir - and
 * what there is to do at each.
 *
 * World coordinates describe the map: the lake with its island sits in the middle
 * distance (negative Z), the community on the near shore, the dam and the falls at the
 * lake's east end. Camera positions are authored rather than derived, because each
 * place wants a different framing.
 *
 * Accents are held to two rules by `tests/content.test.ts`: at least 4.5:1 against the
 * page's pale text, and at least 0.08 (OKLab) from every colour of the reference site.
 * Four of the old ones sat almost on its orange-red or its deep green.
 */
export const PLACES: readonly PlaceSeed[] = [
  {
    slug: "praca-do-pinhao",
    name: "Praça do Pinhão",
    tagline: "O coração da comunidade, de frente para o lago",
    description:
      "Tudo começa aqui: o coreto branco, o café com guarda-sóis, o píer que entra no lago e o cheiro de pinhão assando na panela de ferro. É onde a Festa do Pinhão toma conta da beira d'água toda virada de outono.",
    accent: "#6b3424",
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
    offer: "Costela às quintas",
    accent: "#3d2c25",
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
    offer: "Amanhecer guiado",
    accent: "#565a91",
    world: [-196, 0, -156],
    camera: [-166, 30, -108],
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
    accent: "#263a2e",
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
    offer: "Taça cortesia",
    accent: "#7b2d3f",
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
    accent: "#7f4b20",
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
    accent: "#4f5873",
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
    offer: "3 noites, paga 2",
    accent: "#3f6886",
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
    offer: "Café da fazenda",
    accent: "#8a5c1c",
    world: [-200, 0, -254],
    camera: [-186, 30, -206],
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
    accent: "#566227",
    world: [-60, 0, -266],
    camera: [-48, 30, -218],
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
    accent: "#2a3a1c",
    world: [206, 0, -262],
    camera: [190, 30, -214],
    experiences: [
      { slug: "colheita-do-pinhao", name: "Colheita do pinhão", description: "Manhã inteira debaixo das araucárias, cesto na mão, com quem conhece a safra.", kind: "TRAIL", durationMinutes: 90 },
    ],
  },
  {
    slug: "parque-caveiras",
    name: "Parque Caveiras",
    tagline: "Roda-gigante, carrossel e carrinho bate-bate na encosta",
    description:
      "O parque de diversões da comunidade, no alto da encosta leste: a roda-gigante dá a volta com o lago inteiro aos pés, o carrossel de 1950 veio restaurado do interior de São Paulo e o pavilhão de bate-bate abre até tarde. Quiosques de pastel, churros e quentão na alameda.",
    offer: "Sábado 2 por 1",
    accent: "#a3325f",
    world: [178, 0, 64],
    camera: [164, 26, 108],
    experiences: [
      { slug: "volta-na-roda-gigante", name: "Volta na roda-gigante", description: "Doze minutos e três voltas, com o pôr do sol batendo no lago lá embaixo.", kind: "TOUR", durationMinutes: 15 },
      { slug: "noite-de-luzes", name: "Noite de luzes", description: "Sábado à noite o parque acende as lâmpadas da alameda e a banda toca no coreto.", kind: "EVENT", durationMinutes: 180 },
    ],
  },
  {
    slug: "deck-do-lago",
    name: "Deck do Lago",
    tagline: "Truta, pinhão e o melhor pôr do sol da orla",
    description:
      "O restaurante da orla, com o deck de madeira avançando sobre a água entre a praça e a pousada. Truta da serra grelhada, entrevero de pinhão e vinho de altitude, com os barcos atracando no píer ao lado da mesa.",
    offer: "Menu do pôr do sol",
    accent: "#1d5a8a",
    world: [27, 0, 74],
    camera: [46, 16, 98],
    experiences: [
      { slug: "jantar-no-deck", name: "Jantar no deck", description: "Mesa sobre a água, truta na brasa e a garrafa da vinícola do lado de cá do lago.", kind: "FOOD", durationMinutes: 120 },
    ],
  },
  {
    slug: "ovni-porto",
    name: "Ovni Porto",
    tagline: "A pista de pouso do planalto",
    description:
      "No alto do planalto, longe das luzes da comunidade, um pátio de concreto com balizas acesas espera visita. A torre opera desde 2028 e o registro de avistamentos fica aberto na sala de controle — o céu limpo da serra é o melhor do país para isso, e quase toda noite alguém jura ter visto algo.",
    offer: "Vigília grátis",
    accent: "#4b2f7a",
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
    offer: "Entrada franca",
    accent: "#2a6a86",
    world: [118, 0, -98],
    camera: [92, 30, -56],
    experiences: [
      { slug: "mirante-do-salto", name: "Deck do Salto", description: "A passarela sobre o rio e o deck de frente para a queda. Vá de manhã, quando o sol bate na água.", kind: "TOUR", durationMinutes: 40 },
      { slug: "trilha-da-usina", name: "Trilha da usina", description: "Da barragem ao conduto forçado e à casa de máquinas, com guia que conhece cada válvula.", kind: "TRAIL", durationMinutes: 60 },
      { slug: "piquenique-a-beira-do-rio", name: "Piquenique à beira do rio", description: "Cesta com queijo, salame e pão de casa, mesa reservada debaixo das araucárias.", kind: "FOOD", durationMinutes: 90 },
    ],
  },
];

import type { CampaignPhase } from "./campaign";

/**
 * The words of the ambassador contest, in one place.
 *
 * The contest is fictional - an invitation that shows how the site could work for its
 * partners - and the page says so. Nothing here is ever submitted anywhere.
 *
 * Copy is Brazilian Portuguese. `photo` fields are English briefs for the image generator,
 * listed in the manifest next to the menus'.
 */

export const CONTEST_NAME = "Embaixador de Saltopia";
export const CONTEST_HASHTAG = "#EmbaixadorDeSaltopia";
export const CONTEST_HANDLE = "@saltopia";

/** A photograph the page shows, where it is expected, and the brief to make it. */
export interface ContestPhoto {
  readonly path: string;
  readonly aspectRatio: "3:4" | "4:3";
  readonly photo: string;
}

export const CONTEST_PHOTOS = {
  cook: {
    path: "/images/contest/candidata-pinhao.webp",
    aspectRatio: "3:4",
    photo:
      "A smiling woman in her thirties in a wool sweater and apron films herself with a phone on a small tripod while stirring a black cast-iron pot of boiled pinhão (brown, thumb-sized araucaria seeds) on a rustic farmhouse stove. Warm window light, araucarias blurred outside, candid documentary feel.",
  },
  gaucho: {
    path: "/images/contest/candidato-chimarrao.webp",
    aspectRatio: "3:4",
    photo:
      "A cheerful older man in a gaúcho beret and wool poncho holds up a chimarrão gourd toward a phone camera on a fence post at sunrise, frost on the pasture and araucaria pines behind him in soft mist. Candid, warm, documentary portrait.",
  },
  prize: {
    path: "/images/contest/cesta-da-serra.webp",
    aspectRatio: "4:3",
    photo:
      "A generous wicker hamper on a rough wooden table: a wheel of aged serrano cheese, two plain unlabelled bottles of red wine, a cloth bag of pinhão (brown, thumb-sized araucaria seeds), jars of dulce de leche and dark honey, a hand-knitted wool scarf folded on top, a checked cloth. Golden window light, araucarias blurred behind.",
  },
} as const satisfies Readonly<Record<string, ContestPhoto>>;

/** How to take part, in three steps. Each step marks the words to highlight. */
export interface HowToStep {
  readonly before: string;
  readonly highlight: string;
  readonly after: string;
}

export const HOW_TO_STEPS: readonly HowToStep[] = [
  { before: "Poste uma ", highlight: "foto ou um vídeo", after: " no seu perfil mostrando por que você seria a melhor cara de Saltopia." },
  { before: "Use ", highlight: CONTEST_HASHTAG, after: ` e marque ${CONTEST_HANDLE} na publicação.` },
  { before: "Chame a família e os amigos para ", highlight: "votar em você", after: " quando a votação abrir." },
];

/** What a post can be about. */
export const SUGGESTIONS: readonly string[] = [
  "Sua receita com pinhão",
  "Seu fogo de chão, do acender ao cortar",
  "A geada da manhã no seu quintal",
  "Sua trilha favorita até o Salto",
  "O jeito que você junta a família em volta da mesa",
];

/** The four suits of the idea deck - drawn from the Serra, not from a card table. */
export type IdeaSuit = "pinhao" | "araucaria" | "gota" | "estrela";

export interface CampaignIdea {
  readonly title: string;
  readonly text: string;
  readonly suit: IdeaSuit;
}

export const IDEAS: readonly CampaignIdea[] = [
  { title: "Mestre do pinhão", text: "Mostre a sua receita de pinhão, do cozido na panela ao entrevero de domingo.", suit: "pinhao" },
  { title: "Caçador de neblina", text: "Suba ao Mirante da Neblina antes das seis e filme o lago sumindo debaixo da nuvem.", suit: "gota" },
  { title: "Rei da costela", text: "Grave a costela do Galpão do Fogo de Chão do primeiro espeto ao primeiro corte.", suit: "estrela" },
  { title: "Guardião do chimarrão", text: "Ensine a cevar o mate do jeito serrano, com a água no ponto e a erva em morro.", suit: "araucaria" },
  { title: "Sommelier de altitude", text: "Harmonize um rótulo da Vinícola de Altitude com queijo serrano e conte por quê.", suit: "estrela" },
  { title: "Tropeiro de coração", text: "Conte um causo de tropeiro numa roda do CTG Porteira do Tropeiro.", suit: "araucaria" },
  { title: "Olho no céu", text: "Passe uma noite de vigília no Ovni Porto e mostre o que viu - ou o que quase viu.", suit: "gota" },
  { title: "Fã de geada", text: "Registre a geada da manhã nos campos da Pousada da Geada, antes do sol derreter.", suit: "pinhao" },
];

/** A phase of the campaign, with the words the calendar shows for it. */
export interface CampaignPhaseContent extends CampaignPhase {
  readonly dates: string;
  readonly title: string;
  readonly text: string;
}

export const PHASES: readonly CampaignPhaseContent[] = [
  { starts: "2026-09-01", ends: "2026-10-31", dates: "01.09 – 31.10", title: "Inscrições", text: `Poste com ${CONTEST_HASHTAG} e comece a campanha.` },
  { starts: "2026-11-10", ends: "2026-11-24", dates: "10.11 – 24.11", title: "Votação", text: "A comunidade escolhe entre os finalistas." },
  { starts: "2026-12-05", ends: "2026-12-05", dates: "05.12", title: "Posse", text: "A faixa passa de mão na Praça do Pinhão." },
];

/** One thing the winner receives. Partners are places, named by slug and linked. */
export interface PrizeItem {
  readonly lead: string;
  readonly detail: string;
  readonly partners: readonly string[];
}

export const PRIZE: readonly PrizeItem[] = [
  { lead: "12 cestas da Serra", detail: "uma por mês, com queijo, vinho e pinhão de", partners: ["fazenda-do-cedro", "vinicola-de-altitude", "fazenda-dos-pinheiros"] },
  { lead: "Um fim de semana", detail: "com lareira e café colonial na", partners: ["pousada-da-geada"] },
  { lead: "Um jantar para dois", detail: "sobre a água, no", partners: ["deck-do-lago"] },
  { lead: "A faixa oficial", detail: "e o título de Embaixador de Saltopia por um ano", partners: [] },
];

export const PRIZE_SASH = "Um ano de Serra na sua mesa - e a faixa para provar.";

/** The rulebook. The first answer is the one that matters: none of this is real. */
export const RULES: ReadonlyArray<{ readonly question: string; readonly answer: string }> = [
  {
    question: "Este concurso é de verdade?",
    answer:
      "Não. Saltopia é uma comunidade imaginada para um trabalho acadêmico, e o concurso mostra como o site poderia trabalhar para os parceiros. Nenhuma inscrição é recebida, nenhum voto é contado e nenhum prêmio é entregue.",
  },
  {
    question: "O site guarda algum dado meu?",
    answer: "Não. Esta página não tem formulário, não pede cadastro e não envia nada do que você faz nela.",
  },
  {
    question: "Quem poderia participar?",
    answer: "Na versão imaginada, qualquer pessoa maior de 18 anos que visitasse Saltopia durante as inscrições.",
  },
  {
    question: "Como os finalistas seriam escolhidos?",
    answer: "Os parceiros escolheriam dez publicações pela criatividade e pelo carinho com a Serra; a comunidade votaria entre elas.",
  },
  {
    question: "Os lugares do prêmio existem?",
    answer: "Os parceiros são lugares do mapa de Saltopia. A paisagem é real - o Salto do Rio Caveiras, em Lages -, os estabelecimentos são inventados.",
  },
];

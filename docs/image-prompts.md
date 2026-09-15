# Prompts de imagem — Serranópolis

Como usar, o que o Grok resolve e o que ele **não** resolve.

---

## Antes de tudo: o que o Grok não vai fazer

**O Grok gera imagens 2D. Ele não gera a cidade 3D navegável.** Isso é importante porque a
cidade do `visitmeatopia.com` é um modelo 3D de verdade (um GLB de 16,3 MB), e é ele que a
câmera sobrevoa. Nenhum gerador de imagem entrega isso.

A divisão de trabalho do projeto é:

| O que | De onde vem |
| --- | --- |
| Geometria da cidade 3D (casas, ruas, morros, ponte, praça) | Kits CC0 — Kenney, Quaternius, Poly Pizza |
| Araucárias | Geradas por código em three.js (nenhum kit CC0 tem araucária) |
| **Identidade visual — logo, brasões, heros, mapa ilustrado, ícones** | **Grok** |

Os kits dão a forma; o Grok dá a personalidade. Os prompts abaixo cobrem só a segunda parte.

### Recursos 3D gratuitos — verificados

| Recurso | Licença | Serve para |
| --- | --- | --- |
| [Kenney — City Kit (Roads)](https://kenney.nl/assets/city-kit-roads) | CC0 | Ruas, calçadas, esquinas, praças |
| [Kenney — City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) | CC0 | Casas, lojas, galpões |
| [Kenney — Building Kit](https://kenney.nl/assets/building-kit) | CC0 | Prédios modulares |
| [Quaternius](https://quaternius.com/) | CC0 | Vegetação, props, kits modulares |
| [Poly Pizza](https://poly.pizza/) | maioria CC0 (confira por modelo) | 10.600+ modelos low-poly, download GLB direto + API |

CC0 é domínio público: uso comercial liberado, atribuição não exigida. Ainda assim o projeto
registra a origem de cada arquivo em `web/public/models/CREDITS.md` — trabalho acadêmico
precisa conseguir mostrar de onde veio tudo.

---

## O bloco de estilo

**Cole este bloco no fim de todo prompt de hero e de mapa.** É ele que faz as 8 imagens
parecerem do mesmo projeto em vez de 8 imagens bonitas e soltas.

```
STYLE: stylized 3D render with a hand-painted feel, soft matte surfaces,
gentle low-poly geometry, no photorealism, no harsh specular highlights.
Warm cinematic grade. Volumetric light shafts through mist. Subtle film grain.

PALETTE (use these and nothing outside them):
ember terracotta #C4522E, deep ember #A8431F, mist cream #FFF9EC,
dry-grass straw #F3E4C8, mate sage #9CC4B2, araucaria green #1E4A3A,
bark brown #2E241C, frost blue #7FA3B8, pinhao gold #D9A441.

LIGHT: late golden hour, sun low and behind the subject, long warm rays,
cool blue-grey mist pooling in the low ground.

PLACE: the Serra Catarinense highlands of southern Brazil — araucaria pines
with bare trunks and flat candelabra crowns, rolling highland grassland,
basalt outcrops, low stone walls, wood-and-whitewash rural architecture
with steep tiled roofs. NOT alpine, NOT tropical, NOT North American.

NEGATIVE: no text, no letters, no logos, no watermarks, no people's faces,
no snow-capped Alps, no palm trees, no skyscrapers, no neon.
```

Duas coisas nesse bloco fazem o trabalho pesado:

- **"NOT alpine, NOT tropical"** — sem isso, todo gerador empurra a Serra pros Alpes (por
  causa de "highlands + pines + mist") ou pro Caribe (por causa de "Brazil"). A Serra é
  nenhum dos dois, e essa é exatamente a confusão que arruína o conjunto.
- **"no text, no letters"** — está aí de propósito. Veja a seção seguinte.

---

## O problema do texto (leia antes de gerar o logo)

Geradores de imagem erram texto. Todos, inclusive o Grok. Você vai receber "SERRANÓPOLIS"
escrito como "SERRANOPOLLIS", "SERRANÓPOIIS" ou pior — e em 8 brasões diferentes, com 8
erros diferentes.

**A saída que funciona:** peça ao Grok a *moldura vazia* — o brasão, a placa, o selo, sem
nenhuma letra — e aplique o texto por cima no código, com a fonte do projeto (Figtree e
Yellowtail). Você ganha três coisas: texto sempre correto, texto que dá pra traduzir e
selecionar, e consistência tipográfica automática entre os 8 brasões.

Os prompts de brasão abaixo já estão escritos assim: pedem a moldura com um espaço vazio
reservado no meio.

Para o logotipo principal — que é lettering, não uma moldura — o caminho honesto é outro:
desenhe as letras em vetor (Figma, Illustrator) e use o Grok só para a **paisagem que vai
dentro das letras**. É assim que o logo do Meatopia é feito: letras chapadas recortadas
sobre uma cena de montanha.

---

## A. Logotipo — a paisagem de dentro das letras

Gere a paisagem; recorte-a dentro do lettering depois.

```
A flat vector-style landscape illustration of the Brazilian Serra Catarinense
at sunset, designed to be used as a fill texture inside cut-out lettering.

Composition in clean horizontal bands, from top to bottom:
warm golden sky, a low sun disc slightly right of centre, layered ridgelines
receding into haze, a row of araucaria pine silhouettes with bare trunks and
flat candelabra crowns, and a foreground band of rolling highland grassland.

Hard-edged flat colour fills, no gradients inside shapes, no outlines,
screen-print poster feeling, 1970s national-park poster aesthetic.

Wide banner composition, 16:5, dense and readable when cropped to letter shapes.

PALETTE: ember terracotta #C4522E, pinhao gold #D9A441, mist cream #FFF9EC,
araucaria green #1E4A3A, frost blue #7FA3B8, deep ember #A8431F.

NEGATIVE: no text, no letters, no people, no buildings, no watermark.
```

**Proporção:** 16:5. **Gere 4 variações** e escolha por legibilidade quando recortada em
letra — muita informação fina vira ruído dentro de um "S".

---

## B. Os 8 brasões — molduras sem texto

Um por lugar. **O bloco de estilo não entra aqui** — brasões são gráficos chapados, não
cenas renderizadas. Use o prompt como está.

Base comum (só o miolo muda):

```
A flat vector badge emblem in the style of a vintage American national-park
sign, centred on a plain background.

FORM: [FORMATO], with a thin double outline and a small banner ribbon across
the lower third. The centre of the badge is INTENTIONALLY EMPTY — a clean flat
area of mist cream #FFF9EC reserved for type to be added later. The banner
ribbon is also empty.

ICON: a single small [ÍCONE] silhouette sitting at the very top of the badge,
above the empty centre area.

Hard flat colours, no gradients, no shading, thick confident outlines,
screen-print feeling. Perfectly symmetrical. Isolated on a plain white
background with generous margin.

PALETTE: [COR], mist cream #FFF9EC, bark brown #2E241C, pinhao gold #D9A441.

NEGATIVE: no text, no letters, no numbers, no words in the banner,
no watermark, no drop shadow, no 3D effect.
```

Substitua por lugar:

| Lugar | `[FORMATO]` | `[ÍCONE]` | `[COR]` |
| --- | --- | --- | --- |
| Galpão do Fogo de Chão | a horizontal hexagonal shield | a flame | ember terracotta `#C4522E` |
| Praça do Pinhão | a circular medallion | a pinhão pine cone | pinhao gold `#D9A441` |
| Mirante da Neblina | a vertical arched shield | a mountain peak above a cloud band | frost blue `#7FA3B8` |
| Vinícola de Altitude | an oval medallion | a grape cluster | wine `#7B2D3F` |
| CTG Porteira do Tropeiro | a wide rectangular sign with cut corners | a gaucho hat | bark brown `#2E241C` |
| Bosque das Araucárias | a rounded triangular crest | an araucaria pine with a bare trunk and a flat candelabra crown | araucaria green `#1E4A3A` |
| Estação Velha | a horizontal rectangular plaque with rounded ends | a steam locomotive front | deep ember `#A8431F` |
| Pousada da Geada | a pentagonal house-shaped shield | a chimney with a curl of smoke | mate sage `#9CC4B2` |

**Proporção:** 1:1. Gere os 8 **na mesma sessão, em sequência** — o contexto da conversa
mantém a espessura de traço e o peso coerentes entre eles, o que não acontece se você gerar
um por dia.

---

## C. Os 8 heros cinematográficos

A imagem de tela cheia no topo de cada página de lugar. **Aqui o bloco de estilo é
obrigatório.**

Estrutura: `[CENA]` + `CAMERA: [CÂMERA]` + bloco de estilo.

```
[CENA]

CAMERA: [CÂMERA]. Wide cinematic framing, 16:9, with the centre of the frame
kept visually calm and uncluttered — a badge and a scroll cue will be placed
over it.

<<< cole o BLOCO DE ESTILO aqui >>>
```

| Lugar | `[CENA]` | `[CÂMERA]` |
| --- | --- | --- |
| **Galpão do Fogo de Chão** | A large open-sided wooden barn at dusk. Beef ribs stand on iron stakes angled around a long open fire pit, embers glowing, thin smoke rising and catching the last light. Rough timber posts, a packed earth floor, iron tools on the wall. | eye level, slightly off-centre, looking into the barn from outside |
| **Praça do Pinhão** | A small highland town square at golden hour. A white wooden bandstand at the centre, a ring of araucaria pines, low stone benches, strings of small warm bulbs overhead, a cast-iron pan of roasting pinhão pine nuts steaming on a brazier. | low three-quarter, from just above bench height |
| **Mirante da Neblina** | A stone lookout platform with a simple timber rail at the edge of a basalt canyon. Below and beyond, an unbroken sea of cloud filling the valley to the horizon, lit warm on top and cold blue in its folds. A single araucaria leans over the drop. | from behind the rail, looking out and slightly down |
| **Vinícola de Altitude** | Terraced vineyard rows on a cold highland slope at sunset, a low stone winery building with a tiled roof at the end of the rows, frost still sitting in the shadowed furrows, mist gathering in the valley below. | low, looking along the vine rows toward the building |
| **CTG Porteira do Tropeiro** | A traditional gaucho cultural centre: a long low whitewashed hall with a deep timber veranda, a tall wooden gate post with a hanging iron lantern, saddles and woven blankets over a rail, a fire pit outside with a kettle on a hook. | eye level, centred on the gate, hall receding to the right |
| **Bosque das Araucárias** | A forest of araucaria pines — tall bare trunks, flat candelabra crowns high overhead — with low golden-hour sun raking between the trunks in long volumetric shafts. A narrow earth trail curves through, fallen pine cones on the ground. | eye level on the trail, trunks framing both sides |
| **Estação Velha** | A small disused rural railway station converted to a market. Timber platform, iron roof columns, produce crates and hanging baskets, an old signal post, rails disappearing into the mist. Warm lamps already lit under the canopy. | low three-quarter from the far end of the platform |
| **Pousada da Geada** | A stone and timber rural inn on a frosted highland field at last light. Warm light in every window, smoke from the chimney, frost whitening the grass in the foreground, araucarias behind the roofline. | eye level from across the field, inn slightly right of centre |

**Proporção:** 16:9. **Gere 3 variações de cada** e escolha pelo miolo — se o centro da
imagem tiver detalhe demais, o brasão e o "Role para explorar" somem por cima dele.

---

## D. O mapa ilustrado — o fallback

Esta é a imagem que salva a apresentação se a máquina da sala não rodar WebGL. Vale gastar
tempo nela.

```
A charming illustrated aerial map of a small fictional highland neighbourhood
in the Serra Catarinense, seen from a high three-quarter angle, in the style
of a stylized low-poly 3D village diorama.

The neighbourhood sits in a bowl of rolling green highland grassland, ringed by
basalt outcrops and dark araucaria pine forest, with a river curving through it
and a small stone bridge. Clustered inside: a central square with a white
bandstand, a long open-sided barn with a smoking fire pit, a small railway
station with a timber platform, terraced vineyard rows on the upper slope, a
low whitewashed hall with a deep veranda, a stone inn with lit windows, and a
lookout platform at the far edge of the bowl where the ground falls away into
a sea of cloud.

Everything sits in clear open ground with visible space around each building —
the map must stay legible and uncluttered, with eight clearly separated
landmarks.

Warm golden-hour sky above, cool mist in the low ground. Soft matte surfaces,
gentle low-poly geometry, no photorealism.

Composition 16:9, landmarks distributed across the frame, none touching the
edges.

<<< cole o BLOCO DE ESTILO aqui >>>
```

**Proporção:** 16:9, resolução mais alta que você conseguir. **Gere 6 variações.** Você vai
posicionar os 8 pins clicáveis por cima em coordenadas percentuais, então o que importa é
que os oito pontos fiquem bem separados e nenhum encoste na borda.

---

## E. Motivos da faixa rolante

Ícones pequenos que repetem na marquee. No Meatopia são caminhõezinhos vermelhos com
cachorro-quente. Aqui:

```
A tiny flat vector icon of [MOTIVO], side view, hard flat colours,
thick confident outlines, no gradients, no shading, screen-print feeling.
Isolated and centred on a plain white background with generous margin.

PALETTE: ember terracotta #C4522E, pinhao gold #D9A441, araucaria green #1E4A3A,
mist cream #FFF9EC, bark brown #2E241C.

NEGATIVE: no text, no letters, no watermark, no drop shadow, no background scenery.
```

`[MOTIVO]`, um por geração:
- `a small vintage pickup truck carrying a stack of firewood`
- `an araucaria pine tree with a bare trunk and a flat candelabra crown`
- `a pinhao pine cone`
- `a kettle pouring into a mate gourd`
- `a five-pointed star` *(separador, como as estrelas vermelhas do Meatopia)*

**Proporção:** 1:1, fundo transparente se o Grok permitir; se não, recorte depois.

---

## F. Preview social

```
<<< o mesmo prompt do mapa ilustrado (D) >>>

...but composed for a social share card: the neighbourhood sits in the lower
two thirds of the frame, with clean open golden sky across the upper third
where a logo will be placed.

Composition 1200x630.
```

---

## Ordem de geração

1. **D — o mapa ilustrado.** É o fallback, e é ele que define como a cidade "é". Faça
   primeiro; o resto se ajusta a ele.
2. **A — a paisagem do logo.**
3. **B — os 8 brasões**, todos numa sessão só.
4. **C — os 8 heros**, todos numa sessão só.
5. **E e F** por último.

## Onde salvar

```
web/public/images/
├── map/neighborhood-map.webp          (D)
├── brand/wordmark.svg                 (A + lettering vetorial)
├── brand/og-image.webp                (F)
├── crests/galpao-do-fogo.webp         (B) × 8
├── heroes/galpao-do-fogo.webp         (C) × 8
└── motifs/firewood-truck.webp         (E) × 5
```

Converta tudo para `.webp` antes de commitar — PNG de hero em 16:9 passa fácil de 4 MB, e o
orçamento de payload do projeto é apertado de propósito:

```bash
cwebp -q 82 hero.png -o hero.webp
```

## Se o resultado vier errado

| Sintoma | Causa provável | Ajuste |
| --- | --- | --- |
| Parece Suíça/Alpes | "highlands + pines + mist" puxa pra lá | Reforce `NOT alpine`; peça explicitamente `araucaria pines with bare trunks and flat candelabra crowns` |
| Parece praia tropical | A palavra "Brazil" | Troque `Brazil` por `southern highlands`, e mantenha `NOT tropical, no palm trees` |
| Letras tortas no brasão | Você deixou texto no prompt | Reforce o `NEGATIVE` e ponha o texto no código |
| As 8 imagens não combinam | Geradas em sessões diferentes | Gere cada grupo numa sessão só, em sequência |
| Centro poluído demais | Falta a instrução de calma central | Adicione `keep the centre of the frame visually calm and uncluttered` |
| Cores fora da paleta | Paleta listada mas não imposta | Repita a paleta no fim: `use these colours and nothing outside them` |

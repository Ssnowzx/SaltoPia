# Saltopia — photo briefs for Grok

**Status, 2026-09-28:** every brief below has its photograph: 15 heroes, 25 experiences,
90 gallery pictures, 135 menu items and 3 for the contest. New places and new menu items add
their own briefs, and `npm run images:prompts` lists what is missing.

The site's images are **photographs**, not illustrations in the map's low-poly style:
the map is the stylised layer, the pages are the real thing. One brief per place and one
per experience. Paste the **PHOTO** block first, then one place or experience block, and
ask for the aspect given. Save each result at its path — the site picks it up with no
code change (after a hard refresh; the dev server caches optimised images by URL):

- hero of a place: `web/public/images/heroes/<slug>.webp` — 16:9, **2560×1440**
- photo of an experience: `web/public/images/experiences/<slug>.webp` — 4:3, **1920×1440**
- **gallery of a place**: `web/public/images/places/<slug>/01.webp` … `06.webp` — 4:3,
  **1920×1440**. Six per place. The folders already exist, one per slug; drop the files in
  and the page fills itself, numbered in the order you want them shown. The first one is
  drawn large, so give it the widest view of the set.
- **menu of a place**: `web/public/images/menu/<place>/<item>.webp` — 3:4. Nine per place,
  briefed in the MENUS section at the end, which `npm run images:prompts` writes from the
  content.
- **contest page**: `web/public/images/contest/` — see the CONTEST section at the end.

**With Grok Build, do not paste these by hand.** `npm run images:prompts` writes
`docs/grok/manifest.jsonl`, one complete prompt per missing file, and `docs/grok/README.md`
has the single instruction that makes Grok work through it.

Ask for the largest the generator will give and save at those sizes or above. A hero fills
the whole window, so on a Retina laptop it is drawn across roughly 3000 pixels, and a file
half that size reads as a photograph taken on an old phone.

**The generator tops out at 1280x720 and 1152x864**, whatever the prompt asks for, so the
files in the repository are that frame enlarged. The measured round trip confirms it: they
lose almost nothing when knocked down to 1280 and back, which means the detail above 1280
was interpolated, not photographed.

That ceiling is the generator's, but half of what it costs is recoverable. Enlarging smears
the edges that were there, and an unsharp mask puts them back, so **after dropping new files
in, run:**

```bash
cd web && npm run images:sharpen
```

It sharpens anything it has not already sharpened - heroes, experiences and galleries alike
- and empties the dev server's image cache, which keys on the URL and not on the file
behind it. Without that last step a replaced photograph changes nothing on screen, however
hard the page is refreshed.

The setting is real: the Salto do Rio Caveiras, outside Lages, Santa Catarina — a small
1940s dam and brick powerhouse on the Caveiras river, araucaria pines, rolling coxilhas,
cold mornings. The places are imagined; the landscape is not.

---

## PHOTO (paste before every block)

> Photorealistic photograph, shot on a full-frame camera with a 35mm lens, natural light
> only, golden hour unless stated, shallow depth of field on close subjects, true-to-life
> colour, no HDR look, no illustration, no 3D render, no cartoon. Location: the highlands
> of Serra Catarinense near Lages, Brazil — araucaria pines (Araucaria angustifolia) with
> flat umbrella crowns and tall bare trunks, rolling green pasture hills (coxilhas), a
> turquoise reservoir, cool clear air, long evening shadows. Rural southern Brazil, gaúcho
> highland culture. NOT the Alps, NOT the tropics, no palm beaches, no snow peaks, no
> European villages. No text, letters, signs, logos or watermarks anywhere in the frame.

---

## PLACES (16:9 → `web/public/images/heroes/<slug>.webp`)

### praca-do-pinhao
> A small lakeside town square at golden hour: a white octagonal bandstand with a green
> roof, café tables under red and green umbrellas, a short timber pier with a white motor
> yacht moored, a paved promenade down to turquoise water, a small stone chapel with a
> slate spire behind, the town's asphalt street with a dashed centre line curving past.
> Araucaria pines and round trees around. Slightly elevated viewpoint, as from a balcony.

### galpao-do-fogo
> A large rustic timber barn-hall (galpão) with open sides and a dark shingle roof on a
> green slope, a fogo de chão — a ground fire pit — sending a thin column of smoke up
> beside it, a dirt driveway ending in a yard with a few parked cars, split-rail fences, a
> stacked woodpile, araucarias and a stand of conifers behind. Late afternoon, warm light.

### mirante-da-neblina
> A wooden lookout deck with railings on top of a green hill on the west shore of a
> turquoise reservoir, seen from behind so the whole bay and a wooded island lie below;
> thin mist on the water, the sun low behind hazy golden hills, araucarias on the slope.
> Wide, calm, drone-like elevated view at dawn.

### bosque-das-araucarias
> A low wooded island in a turquoise reservoir seen from the water at golden hour, dense
> with old araucaria pines and broadleaf trees, three small timber stilt cabins on the
> shore with short piers, a sailboat moored, sparkle on the water, green hills behind.

### vinicola-de-altitude
> A hillside winery above a reservoir: a pale stone house with a dark roof, neat rows of
> vines on trellises running down the slope, a dirt track arriving in a gravel yard,
> araucaria pines at the edge of the vineyard, the lake and a small dam visible below.
> Golden late light, autumn colour in the vine leaves.

### ctg-porteira-do-tropeiro
> A gaúcho tradition hall (CTG): a long low timber building with a deep covered porch, a
> big double gate of rough posts (a porteira) at the entrance, a gravel yard with a few
> pickup trucks, paddock fences, a flagpole, araucarias around, the edge of a small
> lakeside town beyond. Warm evening light.

### estacao-velha
> A small heritage railway station: a long platform roof on timber posts, a red-brick
> station house with tall windows, a short stub of old rails with weeds between the
> sleepers, a market stall being set up under the roof, araucarias and green hills
> behind. No train. Morning light, low sun.

### pousada-da-geada
> A three-storey timber inn (pousada) with dark-red walls, white window trims and a dark
> roof at the south end of a turquoise lake, a small pool, a paved car park with a few
> cars, a lawn, araucaria pines and a fence, the lake glittering at sunset behind. Frost
> on the grass in the foreground.

### fazenda-do-cedro
> A cattle farm on a high plateau: a big red-painted timber barn with a dark roof and a
> hayloft door, two galvanised grain silos, a white two-storey farmhouse with a clay tile
> roof, an open machine shed with a tractor, round hay bales, a fenced paddock with
> cattle, a dirt track from the south. Rolling green coxilhas and araucarias, hazy hills
> far behind. Elevated view, golden hour.

### fazenda-santa-barbara
> A historic farm on an open plateau: an ochre-walled barn, two silos, an old white
> farmhouse from 1912 with a wooden veranda, a tropeiro's galpão, fenced paddocks with
> cattle, a dirt track to the forecourt, araucaria groves, green hills fading into golden
> haze. Elevated view, late afternoon.

### fazenda-dos-pinheiros
> A farm among centuries-old araucaria pines on a plateau: a timber barn with a slate
> roof, two silos, a white farmhouse, a paddock, a dirt track, and a dense pinheiral of
> very tall araucarias with flat crowns catching the last sun. Hazy hills behind. Elevated
> view, golden hour.

### parque-caveiras
> A small country fairground on a green slope at the edge of a lakeside town, at dusk
> with the lights just on: a Ferris wheel with red, teal and yellow gondolas, a carousel
> with a red roof, a bumper-car pavilion with a teal roof, a red drop tower, a chair
> swing, food kiosks with striped awnings, a ticket gate with two red pylons, strings of
> warm bulbs, a bandstand, a paved midway, a split-rail fence, araucarias behind. Real
> fairground photography, slightly long exposure so the lights glow.

### deck-do-lago
> A lakeside restaurant at golden hour: a timber hall with a dark slate roof and a
> wine-red awning on the street side, a wide wooden deck on piles reaching over turquoise
> water with tables under wine-red umbrellas, strings of bulbs, a short jetty with a
> moored boat, araucarias along the shore, the town street behind. Sun on the water.

### ovni-porto
> A UFO landing port on a high plateau at dusk, photographed as if it were real: a round
> three-tier concrete apron with a painted red and gold target, beacon masts with orange
> lamps lit, a glass-domed terminal, a control tower with a glazed cab, a radar dish, an
> arched hangar, a landed silver saucer on three legs with a boarding gantry, a second
> saucer hovering on a soft golden beam of light, a chain-link fence with a gate arch, an
> approach lane of lights, a windsock, araucarias around, deep blue-violet sky. Cinematic
> but photographic — like a film still, not a render.

### salto-caveiras
> The Salto do Rio Caveiras: a small stone dam across a narrow channel where a reservoir
> empties, water spilling over the crest into a white waterfall below, a red-brick 1940s
> powerhouse with tall arched windows on the south bank, a timber footbridge across the
> gorge, dark basalt boulders, a wooden lookout deck with railings, a dirt track arriving,
> araucarias on the banks, the wooded ridge behind. Morning light, spray in the air.

---

## EXPERIENCES (4:3 → `web/public/images/experiences/<slug>.webp`)

### Praça do Pinhão
- **pinhao-na-panela** — Close-up of pinhão (araucaria nuts, brown, oval, the size of a thumb) boiling in a black cast-iron pot over coals at an outdoor café, steam rising, a paper cone of hot pinhão in a hand, the turquoise lake blurred behind. Golden hour.
- **festa-do-pinhao** — A lakeside festival at dusk: a crowd around a ground fire on a grass square by the water, string lights, a small stage with a gaúcho band, families in wool ponchos and boots, fireflies of sparks, araucarias silhouetted. Documentary style.

### Galpão do Fogo de Chão
- **costela-fogo-de-chao** — Beef ribs on iron skewers planted in the ground around a wood fire (fogo de chão), crust caramelised, coarse salt, a man in a wide-brimmed hat turning them, embers glowing, the timber galpão behind. Late afternoon, shallow depth of field.
- **roda-de-galpao** — Evening inside a rustic timber galpão: a circle of people on low stools around a small fire, a guitar being played, a chimarrão gourd being passed, faces lit by the embers, tack and saddles on the wall. Warm, intimate, documentary.

### Mirante da Neblina
- **mar-de-nuvens** — Dawn from a hilltop wooden lookout: a sea of low cloud filling the valley with only the crowns of araucarias and the far hills above it, first orange light on the cloud, a thermos and two cups on the railing. Wide, quiet.

### Bosque das Araucárias
- **travessia-de-barco** — From a small motorboat crossing turquoise water toward a wooded island, spray and sun sparkle, the pilot's hand on the wheel, araucarias on the island's shore ahead, morning light.
- **trilha-da-ilha** — A footpath under very tall araucaria pines on an island, dappled light on the trail, ferns and fallen pinhão cones, a guide pointing up at a crown, the lake glinting between trunks.

### Vinícola de Altitude
- **degustacao-na-cantina** — A wine tasting in a stone-walled cantina: five glasses of red on a wooden counter, a board of aged serrano cheese, a big window with the lake and hills in golden light, a sommelier's hand pouring. Shallow depth of field.
- **caminhada-entre-parreiras** — Walking down between rows of vines on a hillside at golden hour, trellis posts, autumn-red leaves, a woman in a knit sweater ahead on the path, the winery house and the lake below.

### CTG Porteira do Tropeiro
- **baile-de-galpao** — A gaúcho dance (baile) inside a timber hall at night: couples in bombachas and long skirts spinning on a plank floor, an accordion (gaita) player on a low stage, lanterns, dust in the light, motion blur on the skirts. Documentary.

### Estação Velha
- **feira-da-plataforma** — A Saturday morning market under the zinc roof of an old railway platform: stalls with wheels of cured cheese, cuca cakes, jars of melato, sellers in aprons, a brick station house, low morning sun through the posts.

### Pousada da Geada
- **noite-de-lareira** — A cosy inn room at night: a stone fireplace burning, an armchair with a wool blanket, a stack of firewood, a glass of wine, French doors to a balcony with a moonlit lake and frost outside. Warm interior light.

### Fazenda do Cedro
- **cafe-colonial-da-fazenda** — A farmhouse café colonial laid on a veranda table at morning light: cuca de banana, sugar-cane molasses, cured cheese, fresh bread, a jug of milk, chimarrão, a checked cloth, pasture and araucarias behind the railing.
- **cavalgada-pelo-campo** — Two riders on horseback crossing high pasture in golden hour, a farm pond (açude) ahead, araucarias on the skyline, long shadows, a dog running alongside. Photographed from a third horse.

### Fazenda Santa Bárbara
- **visita-a-sede-historica** — Inside a 1912 farmhouse: wide old floorboards, a wood stove, framed sepia family photographs, a woman in her seventies at a window telling a story, soft window light. Documentary portrait.
- **tarde-de-ordenha** — Late afternoon in a wooden milking barn (curral): a child learning to milk a cow into a tin bucket, a farmer's hands guiding, straw, warm slanting light through the boards.

### Fazenda dos Pinheiros
- **colheita-do-pinhao** — Pinhão harvest under giant araucarias on a cold morning: a woven basket of brown pinhão, a woman in gloves and a wool hat gathering them from the ground, huge pine cones (pinhas) split open, mist in the trees.

### Parque Caveiras
- **volta-na-roda-gigante** — From inside a Ferris wheel gondola at the top at sunset: the lake, the town and the araucaria hills below, the wheel's spokes and a red gondola in frame, a child's hands on the safety bar.
- **noite-de-luzes** — A country fairground at night: strings of warm bulbs over a crowded midway, the carousel lit up and turning in a long exposure, a brass band on a bandstand, food stalls steaming, families in coats.

### Deck do Lago
- **jantar-no-deck** — Dinner on a wooden deck over the water at blue hour: grilled trout on a board, a bottle of local red, candles, string lights, a moored boat at the jetty, the far shore's lights reflected. Shallow depth of field.

### Ovni Porto
- **vigilia-no-patio** — A night vigil on a concrete apron under the Milky Way: a few people wrapped in blankets on deck chairs, a chimarrão thermos, a red lantern, beacon masts and a control tower silhouetted, the whole southern sky in stars. Long exposure, astrophotography.
- **visita-a-torre** — Inside a small control tower cab at dusk: an old radio set, a logbook of sightings open on the desk, a pair of binoculars, the glazed cab looking out over a concrete apron with a painted target and beacons coming on.

### Salto do Rio Caveiras
- **mirante-do-salto** — Morning on a timber walkway and deck facing a waterfall spilling from a small stone dam, spray catching the sun, a rainbow in the mist, dark basalt rocks, araucarias above, a person at the railing with a coffee.
- **trilha-da-usina** — A guided walk along an old penstock (a large riveted steel pipe) from a stone dam down to a red-brick 1940s powerhouse, a guide's hand on a big iron valve wheel, moss and ferns, morning light.
- **piquenique-a-beira-do-rio** — A picnic on a wooden table under araucarias by a river: a wicker basket, cured cheese, salami, homemade bread, a checked cloth, the river and a small waterfall blurred behind, dappled light.

---

## GALLERIES (4:3 → `web/public/images/places/<slug>/01.webp` … `06.webp`)

Six per place. Paste PHOTO, then the place's own block above for the setting, then one
line from its list. Number the files in the order you want them shown; the first is drawn
large, so it should be the widest view.

### praca-do-pinhao — Praça do Pinhão
1. The whole square from across the water at golden hour: bandstand, café umbrellas, the pier, people walking the promenade.
2. The white octagonal bandstand close up, green roof, a couple sitting on its steps, araucarias behind.
3. A café table under a red umbrella with two cups of coffee and a paper cone of pinhão, the lake out of focus behind.
4. The timber pier from its end looking back at the square, a moored boat in the foreground, evening light.
5. The stone chapel's slate spire against a pink dusk sky, seen over the square's trees.
6. Children feeding birds on the paving, long shadows, a bench and a lamppost in frame.

### galpao-do-fogo — Galpão do Fogo de Chão
1. The whole galpão on its green slope at dusk, open sides glowing from the fire inside, smoke rising, cars in the yard.
2. The fogo de chão pit from above: ribs on iron skewers planted in a circle around embers.
3. A carver's hands slicing costela onto a wooden board, coarse salt, steam.
4. The long timber table inside, full of people eating, lanterns overhead, dust in the light.
5. The woodpile and the axe by the wall, split araucaria logs stacked head-high.
6. A gourd of chimarrão being passed between two pairs of hands by the fire.

### mirante-da-neblina — Mirante da Neblina
1. The lookout deck from behind at dawn, the whole bay and the island below, mist on the water.
2. The valley filled with low cloud, only araucaria crowns above it, first light.
3. The deck's timber railing in close focus with the lake far below and out of focus.
4. The wooden steps climbing the hill through grass, dew, a walker ahead.
5. A thermos and two enamel cups on the railing, hands warming around one.
6. The sun breaking over the far hills, the lookout silhouetted against it.

### bosque-das-araucarias — Bosque das Araucárias
1. The wooded island from the water at golden hour, stilt cabins on the shore, a moored sailboat.
2. Looking straight up the trunk of a giant araucaria to its flat crown against the sky.
3. The trail under the pines, dappled light, ferns, fallen cones on the path.
4. A stilt cabin's veranda over the water, a hammock, boots by the door.
5. A guide's hand holding an open pinha, the seeds visible inside.
6. The short pier at dusk with a lantern lit, the bay beyond going dark.

### vinicola-de-altitude — Vinícola de Altitude
1. The winery and its vineyard rows from above at golden hour, the lake and the dam below.
2. Rows of vines on the slope with autumn-red leaves, trellis posts receding.
3. Five glasses of red on a stone counter, cheese board, big window with hills behind.
4. Oak barrels in a cool stone cellar, a single hanging lamp.
5. Hands cupping a bunch of dark grapes still on the vine, dew on the skins.
6. The winery's terrace at dusk, a table set for two, the valley below in shadow.

### ctg-porteira-do-tropeiro — CTG Porteira do Tropeiro
1. The CTG at evening: long timber hall, deep porch, the big gate of rough posts, pickups in the gravel yard.
2. A gaita (accordion) player on the low stage, lit warm, couples blurred dancing in front.
3. Boots and bombachas mid-step on the plank floor, motion blur in the skirts.
4. Saddles and bridles hanging on the tack wall, leather worn smooth.
5. The porteira's posts close up at sunset, the pasture beyond.
6. A circle of people outside around a small fire, ponchos, chimarrão, night coming on.

### estacao-velha — Estação Velha
1. The station and its platform roof from the track side, morning light down the platform.
2. The brick station house's tall arched windows, paint peeling on the frames.
3. The old rails ending in weeds, sleepers half buried in grass.
4. The Saturday market under the zinc roof: cheese wheels, cuca, jars of melato, sellers in aprons.
5. A hand weighing cured cheese on an old balance scale.
6. The station clock and the empty waiting bench, low sun through the posts.

### pousada-da-geada — Pousada da Geada
1. The whole inn from the lawn at sunset, dark-red timber, white trims, the lake glittering behind.
2. Frost on the grass in the early morning with the inn behind, mist on the lake.
3. A room's interior: stone fireplace lit, wool blanket over an armchair, doors open to a balcony.
4. The balcony view over the water at dawn, a coffee cup on the rail.
5. Breakfast laid out: cuca, cheese, bread, a jug of milk, a checked cloth.
6. The pool and the lawn chairs with the araucarias and the lake behind, late light.

### fazenda-do-cedro — Fazenda do Cedro
1. The whole farm from the air at golden hour: red barn, two silos, white farmhouse, paddocks, rolling coxilhas.
2. The red barn's front with its hayloft door open, a ladder against it.
3. Cattle grazing on the high pasture with araucarias on the skyline, long shadows.
4. The café colonial laid on the veranda: cuca, melado, cheese, milk, chimarrão.
5. Two riders crossing the pasture at golden hour, a dog running alongside.
6. Round hay bales in the field with the silos behind, dust in the evening light.

### fazenda-santa-barbara — Fazenda Santa Bárbara
1. The historic farm from above at late afternoon: ochre barn, silos, the 1912 farmhouse, paddocks with cattle.
2. The farmhouse's wooden veranda with its old chairs, shutters, climbing plant.
3. Inside: wide floorboards, a wood stove, framed sepia photographs on the wall.
4. The tropeiro's galpão with old harness and ox yokes hanging.
5. Late afternoon in the milking barn, a child learning to milk into a tin bucket.
6. The farm's gate and dirt track at dusk, araucarias lining it.

### fazenda-dos-pinheiros — Fazenda dos Pinheiros
1. The farm among centuries-old araucarias from above, golden hour, the pinheiral dense behind.
2. Inside the pinheiral: enormous trunks, shafts of light, mist at ground level.
3. A woven basket of brown pinhão on the ground, gloved hands gathering.
4. A huge pinha split open on a stump, seeds spilling.
5. The timber barn and the two silos with the pine forest behind.
6. A worker climbing the slope with a full sack over the shoulder, cold morning breath.

### parque-caveiras — Parque Caveiras
1. The whole fairground at dusk from the slope above, every light just on, the lake below.
2. The Ferris wheel from directly underneath, gondolas against a deep blue sky.
3. The carousel turning in a long exposure, horses smeared into ribbons of colour.
4. The bumper-car floor from the side, sparks at the ceiling grid, cars mid-collision.
5. A food kiosk's counter: churros and quentão, steam, a striped awning.
6. Strings of warm bulbs over the crowded midway, families in coats, night.

### deck-do-lago — Deck do Lago
1. The restaurant and its deck from the water at blue hour, string lights on, the hall behind.
2. A table on the deck laid for dinner, candle, wine, the lake surface just beyond the rail.
3. Grilled trout on a wooden board, lemon, herbs, close and shallow.
4. The timber hall's interior: bar counter, bottles, warm light, window onto the water.
5. The jetty at sunset with a moored rowing boat, the far shore gold.
6. A waiter carrying plates along the deck, umbrellas and diners out of focus.

### ovni-porto — Ovni Porto
1. The whole port at dusk from the hillside: concrete apron, painted target, beacons lit, control tower, the saucer on its beam.
2. The painted target on the apron from directly above, ring and cross, floor lights recessed.
3. The landed saucer on its three legs with the boarding gantry, beacon masts behind.
4. Inside the control tower cab: radio set, logbook of sightings open, binoculars, dusk through the glass.
5. The radar dish against a violet sky, a beacon lamp glowing beside it.
6. A night vigil on the apron: people wrapped in blankets under the Milky Way, a red lantern.

### salto-caveiras — Salto do Rio Caveiras
1. The falls and the dam from the lookout deck in morning light, spray catching the sun.
2. The water going over the stone crest, close and fast, a rainbow in the mist.
3. The red-brick powerhouse with its tall arched windows, moss on the stone, the gorge below.
4. Inside the powerhouse: the old turbine and a big iron valve wheel, riveted steel.
5. The timber footbridge across the gorge, seen from below, basalt boulders and ferns.
6. A picnic table under araucarias by the river, a basket, cheese and bread, the falls blurred behind.

---

<!-- menu:start -->

## MENUS (3:4 → `web/public/images/menu/<place>/<item>.webp`)

Written by `npm run images:prompts` from `web/prisma/content/menus.ts` - edit the briefs
there. Nine per place; the page draws a stand-in for each one until its file exists.

### praca-do-pinhao — Café e barracas da praça
- **pinhao-na-panela-de-ferro** — A paper cone of boiled pinhão (brown, thumb-sized araucaria seeds), a few split to show the cream kernel, held over a blackened cast-iron pot steaming on a wood fire. 45-degree close-up, turquoise lake blurred behind, late golden-hour light.
- **sapecada-de-pinhao** — Pinhão seeds charred black on a bed of burning dry araucaria branches on the ground, a few pulled aside onto a rough plank with a small knife. Close-up at 45 degrees, flames and smoke glowing orange at dusk.
- **empadinha-de-pinhao** — Three small golden pies in fluted tins on a white enamel plate, one broken open to show a pinhão and chicken filling, on a café table under a canvas parasol. Close-up, soft afternoon light, lake and white bandstand blurred behind.
- **sorvete-de-pinhao** — Two scoops of pale beige pinhão ice cream with crunchy seed pieces in a small ceramic bowl, a spoon beside it, on a painted wooden café table. Close-up at 45 degrees, bright midday light, turquoise water blurred behind.
- **cafe-passado-na-hora** — Black coffee dripping through a cloth filter into a thick white porcelain cup, a piece of brown rapadura sugar on the saucer, on a lakeside café table. Close-up, soft morning light, steam rising.
- **cappuccino-com-canela** — A wide ceramic cup of cappuccino dusted with cinnamon, a cinnamon stick on the saucer, held by two hands in wool gloves over a checked cloth. Overhead, cool late-afternoon light.
- **sonho-de-doce-de-leite** — A sugar-dusted fried Brazilian doughnut split open and filled with thick caramel-coloured doce de leite, on a white paper napkin on a café counter. Close-up at 45 degrees, warm window light.
- **bolo-de-cenoura** — A tall slice of orange carrot cake with glossy soft chocolate icing on a small ceramic plate, a fork beside it, on a weathered café table under a parasol. Close-up, soft golden-hour light, lake blurred behind.
- **cha-de-maca-com-canela** — A glass mug of hot apple and cinnamon tea with apple slices and cloves floating, on a wooden stall counter at night, string lights and a cast-iron pot blurred behind. Close-up, warm firelight and soft bokeh.

### galpao-do-fogo — Cardápio do galpão
- **costela-de-fogo-de-chao** — A whole slab of beef ribs on an iron rod leaning over glowing embers on an earth floor, fat dripping and crust dark brown, inside an open timber shed. 45-degree close-up, firelight and drifting smoke, dusk outside.
- **cordeiro-na-vara** — A butterflied lamb stretched on a cross-shaped iron frame beside a low open fire, skin golden and crackling. Close-up at 45 degrees, rough timber posts and smoke behind, orange firelight.
- **vazio-na-brasa** — Sliced flank steak, pink in the centre and charred at the edges, on a thick wooden board with coarse salt and a knife, on a rough timber table. Overhead, warm firelight.
- **farofa-de-pinhao** — A cast-iron pan of golden cassava-flour farofa with chopped pinhão (brown, thumb-sized araucaria seeds) and crisp bacon, a wooden spoon in it, on a rough timber table. 45-degree close-up, firelight from the side.
- **mandioca-na-manteiga** — Chunks of boiled cassava split open and golden with butter and parsley in a white enamel dish on a timber table. Close-up at 45 degrees, warm firelight, embers blurred behind.
- **salada-de-radicci** — A ceramic bowl of finely shredded green chicory leaves dressed with hot bacon pieces and vinegar, on a checked cloth on a timber table. Overhead, warm late-afternoon light.
- **queijo-serrano-na-chapa** — A thick slice of pale cured highland cheese seared golden on a small cast-iron griddle, oregano scattered on top, on a timber table. Close-up at 45 degrees, embers glowing behind.
- **chope-artesanal** — A frosted glass of golden draft beer with a thick white head on a rough timber table, the embers of an open fire blurred behind. Close-up, warm firelight.
- **abacaxi-na-brasa** — Thick rings of pineapple on an iron grate over dying embers, caramelised sugar and cinnamon on top. Close-up at 45 degrees, deep orange firelight and a wisp of smoke.

### mirante-da-neblina — Café do mirante
- **cafe-da-garrafa** — Steaming black coffee poured from a vacuum flask into a white enamel mug on a stone ledge, a sea of fog covering a lake far below. Close-up, blue pre-dawn light turning pink on the horizon.
- **chocolate-quente-cremoso** — Thick hot chocolate in a heavy ceramic mug, a spoon standing in it, on a wooden railing draped with a wool blanket. Close-up at 45 degrees, misty morning light, fog and araucaria silhouettes blurred behind.
- **torta-de-maca** — A slice of apple pie with thin fanned apple slices and a golden crust on a small ceramic plate, a fork beside it, on a weathered wooden counter. 45-degree close-up, soft window light, fog outside the glass.
- **pao-na-chapa** — A split bread roll toasted golden with melting butter on a small cast-iron griddle, on a rough wooden counter. Close-up, warm lamplight against a blue foggy dawn outside the window.
- **bolo-de-fuba** — A slice of yellow cornmeal cake flecked with fennel seeds on a checked cloth napkin, the round cake in its tin behind. Overhead, soft misty window light.
- **mingau-de-aveia** — A ceramic bowl of hot oat porridge with a swirl of honey and cinnamon, a spoon on a wool blanket beside it, on a stone ledge. Overhead, pale blue dawn light, fog below.
- **biscoito-de-nata** — Small round butter cookies heaped in an open brown paper bag on a wooden counter, a few spilled out. Close-up at 45 degrees, soft morning light, a misty window behind.
- **misto-quente** — A toasted ham and cheese sandwich cut diagonally, melted cheese oozing, on a white enamel plate on a rough wooden counter. Close-up, warm lamplight, fog outside the window.
- **pao-de-queijo** — A small wicker basket of golden cheese bread rolls, one torn open and steaming, on a wooden counter. Close-up at 45 degrees, soft misty daylight.

### bosque-das-araucarias — Quiosque da ilha
- **cesta-da-ilha** — An open wicker picnic basket with wrapped sandwiches, apples, a slice of cake and a glass bottle of juice, on a checked cloth over fallen pine needles. Overhead, dappled light through araucaria branches.
- **sanduiche-de-truta-defumada** — A rye bread sandwich with pink smoked trout, cucumber slices and dill, half unwrapped from waxed paper on a wooden picnic table. Close-up at 45 degrees, dappled forest light.
- **salada-de-pinhao-com-maca** — A glass jar salad of peeled pinhão (thumb-sized araucaria seeds, brown-shelled and cream inside), green apple cubes and leaves, set on a mossy log. Close-up, soft light filtering through araucaria crowns.
- **quiche-de-alho-poro** — A wedge of leek and cheese quiche on a sheet of brown paper on a rough wooden bench. Close-up at 45 degrees, dappled light, tall araucaria trunks blurred behind.
- **suco-de-maca-com-gas** — A small glass bottle of sparkling apple juice and a glass with bubbles rising, standing on a wooden pier post, a lake and an island of araucarias behind. Close-up, bright afternoon light.
- **chimarrao-para-a-trilha** — A gourd of green chimarrão with a metal straw and a vacuum flask resting on an araucaria root, fallen needles around. Close-up at 45 degrees, soft forest light.
- **empanada-de-frango** — Two golden baked turnovers with crimped edges, one broken to show a shredded chicken filling, on a paper napkin on a picnic table. Close-up, dappled light through the trees.
- **morangos-com-nata** — A small glass jar of red strawberries topped with thick whipped cream, a wooden spoon resting on it, on a checked cloth. Overhead, soft green-tinted forest light.
- **pao-de-mel** — Chocolate-covered honey spice cakes, one cut in half, on a small wooden board on a mossy log. Close-up at 45 degrees, dappled light through araucaria branches.

### vinicola-de-altitude — Rótulos da cantina
- **sauvignon-blanc** — A glass of pale straw-coloured white wine on a stone windowsill, condensation on the bowl, vine rows descending to a turquoise lake beyond. Close-up at 45 degrees, bright cool morning light.
- **pinot-noir** — A glass of translucent ruby red wine held by a hand among vine rows on a hillside, grape leaves turning yellow. Close-up, golden-hour backlight.
- **cabernet-franc** — A glass of deep red wine on the head of an oak barrel in a cool stone cellar, a candle glowing beside it. Close-up at 45 degrees, warm dim light.
- **merlot** — Dark red wine being poured into a glass on a rough wooden table, a wedge of cured cheese beside it, a stone wall behind. Close-up, warm window light.
- **espumante-nature** — Two flutes of sparkling wine with fine rising bubbles on a stone ledge, frost-white grass and vines blurred behind. Close-up, crisp early-morning light.
- **rose-de-merlot** — A glass of pale salmon-pink rosé on a wooden veranda rail, a vineyard hillside and a turquoise lake below. Close-up at 45 degrees, warm late-afternoon light.
- **tabua-de-queijos-da-serra** — A wooden board with wedges of cured highland cheese, a pale sheep cheese, walnuts and a small bowl of dark honeydew honey, beside two glasses of red wine on a stone table. Overhead, soft window light.
- **pinhao-na-manteiga-de-salvia** — Peeled pinhão (thumb-sized araucaria seeds, brown-shelled and cream inside) glazed in sage butter in a small clay bowl, crisp sage leaves on top, a glass of wine beside it. Close-up at 45 degrees, warm window light.
- **suco-de-uva-integral** — A wine glass of opaque dark purple grape juice on a stone table, a bunch of dark grapes beside it. Close-up, soft window light, vineyard rows blurred outside.

### ctg-porteira-do-tropeiro — Cozinha do CTG
- **arroz-carreteiro** — A black cast-iron pot of rice with shredded dried beef and green onion, a wooden spoon in it, on a wood-burning stove. Close-up at 45 degrees, warm lamplight in a whitewashed hall.
- **feijao-campeiro** — A deep plate of thick black beans with sausage, bacon and toasted cassava flour on a rough plank table. Overhead, warm lantern light.
- **churrasco-de-espeto** — Chunks of beef on wooden skewers over glowing coals in a low brick pit, fat sizzling. Close-up at 45 degrees, firelight in a dim hall.
- **linguica-campeira** — A coiled pork sausage browned over embers on an iron grill, a knife and coarse salt on a board beside it. Close-up, orange firelight.
- **mocoto-da-madrugada** — A steaming bowl of thick beef-trotter stew with white beans and sausage on a timber table, a spoon beside it. Close-up at 45 degrees, late-night lantern light.
- **quentao-de-vinho** — A white enamel mug of hot spiced red wine with ginger slices and cloves on the wooden rail of a deep veranda at night, an iron lantern glowing behind. Close-up, warm lantern light.
- **cuca-de-uva** — A slice of crumb cake topped with whole purple grapes and sugary streusel on a white enamel plate on a plank table. Close-up at 45 degrees, soft window light.
- **chimarrao-da-roda** — A hand passing a gourd of chimarrão with a silver straw beside a soot-blackened kettle on a wood stove. Close-up, warm firelight in a whitewashed hall.
- **doce-de-abobora** — Glossy orange cubes of pumpkin in syrup with cloves in a small pressed-glass dish on a checked cloth. Close-up at 45 degrees, soft window light.

### estacao-velha — Bancas da plataforma
- **queijo-serrano-curado** — A whole wheel of pale yellow cured highland cheese with one wedge cut out, on a wooden market stall under a corrugated metal roof. Close-up at 45 degrees, soft misty morning light, old railway tracks blurred behind.
- **mel-de-melato** — Jars of very dark amber honeydew honey on a wooden stall, a honey dipper dripping into one. Close-up, soft morning light, fog over railway tracks behind.
- **cuca-de-banana** — A rectangular crumb cake with sliced bananas and cinnamon streusel in its baking tin on a market table, one slice lifted out. Overhead, soft morning light.
- **salame-colonial** — Cured salamis hanging from a wooden beam and one sliced on a board with a knife, on a market stall. Close-up at 45 degrees, cool morning light, an old station platform behind.
- **maca-fuji** — Red and yellow striped apples heaped in a wooden crate on a market stall, a halved apple showing crisp white flesh. Close-up, soft misty morning light.
- **geleia-de-amora** — Jars of dark blackberry jam with checked cloth tied over the lids on a wooden stall, a spoonful spread on a slice of bread. Close-up at 45 degrees, soft morning light.
- **erva-mate** — Bright green coarse-ground yerba mate heaped in an open paper sack with a metal scoop, on a wooden market stall. Close-up, soft morning light.
- **doce-de-figo** — Whole green figs in dark glossy syrup in a glass jar and a small dish, on a checked cloth on a market table. Close-up at 45 degrees, soft light.
- **broa-de-milho** — Round rustic cornbread loaves with cracked golden crusts stacked on a wooden table, one torn open to show the yellow crumb. Close-up at 45 degrees, cool morning light, a railway platform blurred behind.

### pousada-da-geada — Mesa da pousada
- **cafe-colonial-da-chegada** — A long table set for a colonial breakfast with crumb cake, bread, cold cuts, jam jars and a coffee pot, in a glazed room with frost on the lawn outside. 45-degree view, soft white morning light.
- **fondue-de-queijo-serrano** — A ceramic fondue pot of bubbling melted cheese over a small flame, bread cubes on long forks, beside a stone fireplace. Close-up at 45 degrees, warm firelight.
- **fondue-de-chocolate** — A small pot of melted dark chocolate with strawberries and apple pieces on forks around it, on a wooden table near a fire. Close-up, warm firelight and a dark background.
- **sopa-de-capeletti** — A steaming bowl of small hand-made stuffed pasta in clear golden chicken broth with grated cheese, on a wool placemat by a window onto a dark lake. Close-up at 45 degrees, lamplight.
- **creme-de-pinhao** — A bowl of smooth beige soup made from pinhão (brown, thumb-sized araucaria seeds), with croutons and chives, a few whole seeds on the table beside it. Close-up at 45 degrees, warm firelight from a hearth.
- **sopa-de-abobora** — A bowl of bright orange pumpkin soup with a swirl of cream and toasted seeds on a wooden tray, a wool blanket and a frosted window behind. Overhead, soft window light.
- **vinho-quente** — A glass mug of steaming mulled red wine with an orange slice and a cinnamon stick on the stone hearth of a lit fireplace. Close-up, warm firelight.
- **omelete-de-queijo-serrano** — A folded golden omelette with melted cheese and chopped herbs on a white ceramic plate, a cup of coffee beside it, on a table by a window. Close-up at 45 degrees, bright morning light, frosty lawn outside.
- **ponche-quente-de-frutas** — A ceramic mug of hot red fruit punch with apple and orange slices and a cinnamon stick, on the wooden arm of a chair draped with a wool blanket beside a fire. Close-up, warm firelight.

### fazenda-do-cedro — Café colonial da fazenda
- **mesa-do-cafe-colonial** — A farmhouse veranda table crowded with crumb cake, bread, a cheese wheel, jars of cane syrup and cream and a milk jug on a checked cloth, pasture and a red barn beyond. 45-degree view, bright morning light.
- **queijo-colonial-da-leiteria** — Rows of small pale yellow cheese wheels curing on wooden shelves in a whitewashed dairy room, one cut open on a board. Close-up at 45 degrees, soft side light from a window.
- **melado-de-cana** — Thick dark amber sugarcane syrup drizzled from a spoon over a slice of white cheese on bread, a glass jar behind. Close-up, warm morning light on a farmhouse table.
- **cafe-com-leite-da-ordenha** — A large enamel mug of milky coffee next to a dented aluminium milk jug on a wooden veranda table, cows grazing in the pasture blurred behind. Close-up at 45 degrees, early morning light.
- **pao-caseiro-com-nata** — A thick slice of rustic bread spread with thick yellow farm cream and a sprinkle of sugar on a wooden board. Close-up, warm window light on a farmhouse table.
- **manteiga-da-fazenda** — A block of pale yellow hand-churned butter in a small clay pot with a butter knife, beside bread on a checked cloth. Close-up at 45 degrees, soft morning light.
- **iogurte-natural** — A glass jar of thick white yogurt topped with oat granola and a drizzle of honey, on a wooden veranda rail, green pasture blurred behind. Close-up, bright morning light.
- **requeijao-de-corte** — A golden-browned block of firm cooked cheese sliced on a wooden board, one slice seared on a small griddle. Close-up at 45 degrees, warm farmhouse kitchen light.
- **bolo-de-milho-verde** — Squares of moist yellow fresh-corn cake on a white enamel tray, a husked corn cob beside it, on a checked tablecloth. Overhead, soft morning light.

### fazenda-santa-barbara — Receitas da sede
- **quirera-com-costelinha** — A cast-iron pot of creamy cracked-corn stew with pork ribs on an old wood-burning stove, a ladle resting on the rim. Close-up at 45 degrees, warm light from a small window in a wooden kitchen.
- **galinha-caipira-com-pirao** — A clay dish of stewed free-range chicken in golden turmeric sauce beside a bowl of smooth cassava porridge, on a worn wooden table. Overhead, soft window light.
- **pacoca-de-charque** — Shredded dried beef pounded with cassava flour in a heavy wooden mortar, the pestle resting inside, on an old plank floor. Close-up at 45 degrees, warm window light, leather saddlery blurred behind.
- **sagu-de-vinho** — A glass bowl of translucent purple tapioca pearls in red wine topped with pale vanilla custard, on a lace doily on a wooden table. Close-up, soft window light.
- **ambrosia** — A small porcelain bowl of golden curdled egg-and-milk sweet in syrup with cloves, a copper pan blurred beside it on an old wooden table. Close-up at 45 degrees, soft window light.
- **cafe-no-fogao-a-lenha** — A soot-blackened kettle and a cloth coffee filter on the iron top of a wood-burning stove, a cup of coffee on the edge. Close-up, warm firelight from the open firebox.
- **doce-de-leite-de-tacho** — Thick glossy caramel-brown doce de leite stirred with a long wooden paddle in a copper pan. Close-up at 45 degrees, warm light from a farmhouse window.
- **polenta-na-chapa** — Golden slices of grilled polenta topped with melting cheese on the iron plate of a wood-burning stove. Close-up at 45 degrees, warm firelight.
- **cha-de-marcela** — A porcelain cup of pale golden herbal tea beside a bundle of dried yellow marcela flowers on a wooden windowsill, pasture outside. Close-up, soft morning light.

### fazenda-dos-pinheiros — Tudo do pinhão
- **pinhao-da-safra** — A burlap sack spilling fresh raw pinhão (brown, thumb-sized araucaria seeds) onto the forest floor among fallen needles and a broken pine cone. Close-up at 45 degrees, soft morning light under araucaria crowns.
- **farinha-de-pinhao** — A wooden bowl of fine beige pinhão flour with a scoop, whole brown seeds scattered around, on a rough timber table. Overhead, soft window light.
- **pacoca-de-pinhao** — A cast-iron pan of ground pinhão sautéed with minced beef, bacon and green onion, a wooden spoon in it, on a timber table. Close-up at 45 degrees, warm window light, araucarias outside.
- **bolo-de-pinhao** — A slice of moist hazelnut-brown pinhão cake on a ceramic plate, a few whole seeds beside it and a cup of coffee, on a checked cloth. Close-up at 45 degrees, soft window light.
- **conserva-de-pinhao** — Glass jars of peeled cream-coloured pinhão seeds in brine with garlic and bay leaves, lined up on a wooden shelf. Close-up, soft side light from a window.
- **nhoque-de-pinhao** — Hand-rolled beige gnocchi made with pinhão in brown butter and grated cheese in a shallow ceramic bowl. Close-up at 45 degrees, warm window light on a timber table.
- **pao-de-pinhao** — A round rustic loaf cut open to show a tan crumb dotted with pinhão pieces, on a floured wooden board beside a wood-fired oven. Close-up at 45 degrees, warm light.
- **pe-de-moleque-de-pinhao** — Shards of amber brittle packed with toasted pinhão pieces on parchment on a wooden board. Close-up, soft window light.
- **licor-de-pinhao** — A small glass of amber liqueur beside a plain glass bottle and toasted pinhão seeds on a wooden table, araucaria trunks blurred through the window. Close-up at 45 degrees, golden-hour light.

### parque-caveiras — Barracas do parque
- **pastel-de-carne** — A large golden fried pastel split open to show a ground beef filling, on waxed paper on a stall counter, fairground lights blurred behind. Close-up at 45 degrees, warm night bokeh.
- **churros-de-doce-de-leite** — Two sugar-coated churros filled with caramel doce de leite in a paper sleeve, a lit Ferris wheel blurred behind. Close-up, evening light and colourful bokeh.
- **quentao** — A steaming enamel mug of hot ginger and clove spirit on a wooden stall counter, a large copper pot behind, carousel lights blurred in the night. Close-up, warm light.
- **maca-do-amor** — Glossy bright red candied apples on sticks lined up on a stall tray, one bitten, colourful fairground lights blurred behind. Close-up at 45 degrees, night bokeh.
- **algodao-doce** — A large pink cotton candy on a stick held up by a hand against a lit Ferris wheel at dusk. Close-up, blue-hour light and warm bokeh.
- **pipoca-de-panela** — Popcorn overflowing from a paper bag beside a cast-iron pot on a stall counter under warm string lights. Close-up at 45 degrees, night light.
- **milho-cozido** — A steaming boiled corn cob on a stick brushed with melting butter and salt, held over a stall counter. Close-up, warm light, a carousel blurred behind at dusk.
- **cachorro-quente** — A Brazilian hot dog in a soft bun with sausage in tomato sauce, shoestring potato sticks and corn, wrapped in a paper napkin. Close-up at 45 degrees, amusement park lights blurred behind at night.
- **morango-com-chocolate** — A wooden skewer of strawberries dipped in dripping milk chocolate, held above a stall counter, a lit carousel blurred behind. Close-up, colourful night bokeh.

### deck-do-lago — Cardápio do deck
- **truta-grelhada-na-brasa** — A whole grilled rainbow trout with herb butter and smashed roasted potatoes on a white plate on a wooden deck table, a turquoise lake behind. Close-up at 45 degrees, golden-hour light.
- **risoto-de-pinhao** — A shallow bowl of creamy risotto with chopped pinhão (brown, thumb-sized araucaria seeds, cream inside), shaved cheese and browned butter, on a wooden table by the lake. Close-up at 45 degrees, warm sunset light.
- **entrevero-de-pinhao** — A sizzling cast-iron skillet of mixed meats, peppers, onion and peeled pinhão seeds, a wooden spoon in it, on a lakeside deck table. Close-up at 45 degrees, golden-hour light.
- **carpaccio-de-truta** — Thin slices of pink cured trout fanned on a slate plate with capers, olive oil and small herbs, beside a glass of white wine. Overhead, soft evening light over a lake.
- **menu-do-por-do-sol** — A lakeside deck table set for two with plates of trout and risotto, a plain unlabelled bottle of red wine and two glasses, the sun low over turquoise water. 45-degree view, golden sunset light.
- **caipirinha-de-bergamota** — A short glass of caipirinha with muddled tangerine wedges and crushed ice on the wooden rail of a deck, a lake at sunset behind. Close-up, golden backlight.
- **maca-e-gengibre-com-tonica** — A tall glass of pale golden apple and ginger tonic with ice, apple slices and a coin of ginger, on a deck rail over the water. Close-up, warm sunset light.
- **pavlova-com-amoras** — A crisp white meringue nest topped with whipped cream and dark blackberries on a ceramic plate on a wooden deck table, the lake blurred behind. Close-up at 45 degrees, soft dusk light.
- **creme-brulee-de-erva-mate** — A ramekin of crème brûlée with a cracked caramel top and a spoon, a pinch of green yerba mate beside it, on a wooden table by the lake. Close-up, warm dusk light.

### ovni-porto — Cardápio de bordo
- **disco-voador** — A round sealed toasted sandwich, golden and disc-shaped, cut in half to show melted cheese and ham, on a white enamel plate on a metal table. Close-up at 45 degrees, cool bluish lamplight at night.
- **asteroides** — A paper cone of irregular fried dough balls rolled in cinnamon sugar on a concrete ledge, a starry night sky blurred behind. Close-up, warm lamplight against deep blue night.
- **buraco-negro** — Almost black, thick hot chocolate in a dark enamel mug seen from above, a spoon sinking into it, on a wool blanket. Overhead, cool lamplight at night.
- **aneis-de-saturno** — Light, crunchy tapioca-starch rings spilling from a paper bag onto a concrete surface, small ground lights glowing blurred in the dark. Close-up at 45 degrees, night light.
- **combustivel-de-foguete** — Black coffee pouring from a steel vacuum flask into an enamel mug on a concrete ledge, a clear starry sky and the silhouette of a small control tower behind. Close-up, cool night light.
- **cratera** — A round crusty bread bowl filled with steaming bean soup, its cut lid resting beside it, on a metal table. Close-up at 45 degrees, warm lamplight against a dark night.
- **via-lactea** — A white enamel mug of hot milk with a swirl of dark honey and a cinnamon stick, held by gloved hands under a starry sky. Close-up, soft cool night light, the Milky Way blurred behind.
- **estrela-cadente** — Star-shaped butter cookies dusted with icing sugar on a dark metal tray, crumbs scattered. Overhead, cool bluish lamplight at night.
- **kit-abducao** — A gourd of chimarrão, a vacuum flask and a folded wool blanket laid on a concrete landing pad, small ground lights glowing along its edge. Close-up at 45 degrees, deep blue night light.

### salto-caveiras — Quiosque do salto
- **cesta-de-piquenique** — A wicker basket open on a wooden picnic table with a wedge of cheese, sliced salami, a rustic loaf and apples, araucaria trunks and waterfall mist blurred behind. 45-degree view, dappled late-morning light.
- **sanduiche-de-pernil** — A crusty bread roll stuffed with shredded roast pork and tomato-onion vinaigrette, half wrapped in paper, on a picnic table. Close-up at 45 degrees, dappled light.
- **bolinho-de-pinhao** — A paper tray of golden fried croquettes made from pinhão (brown, thumb-sized araucaria seeds), one broken open, a few whole seeds beside it on a wooden table. Close-up, soft daylight, a waterfall blurred behind.
- **maionese-de-batata** — A bowl of creamy potato salad with carrot and peas on a checked cloth on a picnic table under araucarias. Overhead, dappled light.
- **limonada-com-hortela** — A glass jug of lemonade with mint leaves and ice, beaded with condensation, on a wooden picnic table, the river blurred behind. Close-up, bright midday light.
- **picole-de-uva** — A deep purple homemade grape ice pop on a wooden stick held by a hand against a blurred waterfall and green foliage. Close-up, bright sunlight.
- **bolo-de-laranja** — A slice of orange cake glazed with syrup on a paper napkin on a wooden deck rail, a waterfall and an old brick powerhouse blurred behind. Close-up at 45 degrees, morning light.
- **romeu-e-julieta** — Cubes of pale cheese and dark red guava paste on toothpicks on a small wooden board on a picnic table. Close-up at 45 degrees, dappled light through araucarias.
- **salada-de-frutas** — A clear cup of chopped apple, strawberry, pear and grapes in orange juice with a small spoon on a picnic table. Close-up, bright daylight, river and araucarias blurred behind.

## CONTEST (→ `web/public/images/contest/`)

- **candidata-pinhao.webp** (3:4) — A smiling woman in her thirties in a wool sweater and apron films herself with a phone on a small tripod while stirring a black cast-iron pot of boiled pinhão (brown, thumb-sized araucaria seeds) on a rustic farmhouse stove. Warm window light, araucarias blurred outside, candid documentary feel.
- **candidato-chimarrao.webp** (3:4) — A cheerful older man in a gaúcho beret and wool poncho holds up a chimarrão gourd toward a phone camera on a fence post at sunrise, frost on the pasture and araucaria pines behind him in soft mist. Candid, warm, documentary portrait.
- **cesta-da-serra.webp** (4:3) — A generous wicker hamper on a rough wooden table: a wheel of aged serrano cheese, two plain unlabelled bottles of red wine, a cloth bag of pinhão (brown, thumb-sized araucaria seeds), jars of dulce de leche and dark honey, a hand-knitted wool scarf folded on top, a checked cloth. Golden window light, araucarias blurred behind.

<!-- menu:end -->

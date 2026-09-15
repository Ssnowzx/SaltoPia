# Saltopia — photo briefs for Grok

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

Ask for the largest the generator will give and save at those sizes or above. A hero
fills the whole window, so on a Retina laptop it is drawn across roughly 3000 pixels: a
1600-wide file is stretched to nearly twice its size and reads as a photograph taken on
an old phone. The files in the repository were enlarged from 1600 to buy some of that
back, which cannot add detail the original never had.

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

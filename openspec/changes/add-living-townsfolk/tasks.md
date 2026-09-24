## 1. Behaviour (pure, tested)

- [x] 1.1 Plans and routes for the townsfolk, derived from the layout; verify with a unit test that every route point and standing place is walkable
- [x] 1.2 The step - strolling, pausing, standing, gestures, greeting the visitor, reduced motion; verify with unit tests that a stroller advances, that one near the visitor stops and faces it, and that under reduced motion nobody strolls

## 2. In the world

- [x] 2.1 Remove the procedural figures from the layout and the model registry; verify `check:layout` and the build pass
- [x] 2.2 Render the townsfolk: cloned models, own colours, animation by clip; mounted after the scene is drawn; verify in a capture of the square
- [x] 2.3 The crowd as obstacles for the visitor; verify in the browser that the character stops against a townsperson

## 3. Walk mode's own defects

- [x] 3.1 Raised floors and prop obstacles in the open places, read from their geometry; verify with unit tests that the square's paving lifts the walker and its planters and bandstand block it

- [x] 3.2 The world's own defects found placing the townsfolk - the square's pier across the paving, the peninsula's piers and stilt cabins under the water, a buried kayak, pools across the street, the lakefront street under the water's level; verify `check:layout` reports them against the old placements and passes with the new
- [x] 3.3 A model that fails to download must not take the hub down; verify in the browser with the models' requests aborted
- [x] 3.4 Feet on the pavements, verges and every other road surface, read from the road geometry; verify with a unit test that a walker on the pavement stands at its top, and in a capture

## 4. Close

- [ ] 4.1 Verify in headed Chrome, unpinned quality: townsfolk walk and wave, no GL error, canvas alive
- [ ] 4.2 Run `npm run check`, `npm test` and `npm run build`; verify all pass

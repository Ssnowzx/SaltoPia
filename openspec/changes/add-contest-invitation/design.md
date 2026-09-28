## Context

See proposal.md for the motivation. The hub already keeps session state: `EXPLORED_KEY`
records that the visitor has entered the world, and it knows when the world has been drawn
(`sceneReady`), when a place card is open (`cardOpen`) and when walk mode is in character
creation. Content pages share `ContentShell`. The menu dialog of `elevate-place-pages`
already solved the modal mechanics: a native `<dialog>`, focus restored by hand, and Lenis
paused.

## Goals / Non-Goals

**Goals:** the reference's opening card, in our words and colours, shown once per session,
and never in the way.

**Non-Goals:** see the proposal.

## Decisions

### D1 - When to show is a pure function

`shouldInvite({ seen, forced, isContestPage, blocked })` in `lib/contest/invitation.ts`
decides; the component only asks it and waits. `seen` comes from `sessionStorage`
(`saltopia:invitation`), read in try/catch. It is written when the card is shown, not when
it is closed, so a reload with the card open does not show it twice.

### D2 - Delays

The delays give the page a moment before the card arrives.

| Where | Delay | Waits for |
| --- | --- | --- |
| Hub | 1200ms | the world drawn, title state left |
| Content page | 1500ms | the hero to be seen first |

While `blocked` is true (title state, place card, character creation) the timer does not
run. A block that begins mid-wait cancels it, and the wait restarts when the block ends.

### D3 - The card

It is a native `<dialog>` opened with `showModal()`, for the focus trap, Escape and the top
layer. `::backdrop` is night at 45% with a 3px blur. Width is `min(92vw, 560px)`. From top
to bottom:

- **Wordmark:** "EMBAIXADOR" in the contest's photo-filled type (`.photo-type`) at
  `clamp(2.5rem, 9vw, 4.5rem)` over the wine ribbon "de Saltopia". It sits across the top
  edge of a mist card, as the reference's logo sits across its card.
- **Greeting:** "Saltopia precisa de você", in Yellowtail, wine.
- **Headline:** "Um ano de Serra na sua mesa", in Figtree 800, night.
- **Invitation:** one sentence.
- **Actions:** "Quero me candidatar", filled night that hovers to wine, and "Agora não".
- **Fine print:** "Concurso fictício de um trabalho acadêmico."

It enters with `dialog-in` (`--duration-panel`, `--ease-ui`), and with nothing under
reduced motion. On content pages Lenis is paused while it is open.

### D4 - Copy that was translated

| Was | Reference | Now |
| --- | --- | --- |
| "Entrar na disputa" (footer) | "Get in the race" | "Quero me candidatar" |
| "E não esqueça / O prêmio" | "And don't forget / The prize" | "Quem vence leva / O prêmio da Serra" |
| "Precisa de uma / Ideia de campanha?" | "Need some campaign / Strategy?" | "Sem inspiração? / Tire uma carta" |

### D5 - New names for the wordmark

`build-logo.py` writes `saltopia-wordmark.png` and `saltopia-wordmark-flat.png`. The old
files are moved to those names with `git mv`, and the header, footer and intro point at
them. A browser that cached `/_next/image?url=/logo-saltopia.png…` has nothing to serve for
the new address. Emptying the server's cache, as done in `adopt-night-palette`, could not
reach the visitor's own browser.

## Implementation notes

- **D3:** after `showModal()` the card itself takes focus (`tabIndex={-1}`). The dialog
  would otherwise give it to the close button and draw a focus ring before the visitor
  had pressed a key. Tab then walks the controls as usual.
- **D3:** the headline uses `text-balance`, because "Mesa" was left alone on the second
  line at 1440px.
- **D5:** the flat wordmark is 900x378 since `adopt-night-palette` rebuilt it. The header
  and footer declared 370, which would have squeezed it by 2%.

## Risks / Trade-offs

- [Once per session means the owner sees it once while testing] → `?convite` shows it on
  demand; the final message says so.
- [A modal over the hub makes the pins inert while it is open] → Intended; it closes with
  one key or one click anywhere outside it.

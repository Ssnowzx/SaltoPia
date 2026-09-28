## Why

On 2026-09-28 the owner sent the reference's hub with its contest card open over the map
and asked for "cards que aparecem ao abrir igual na ref". `elevate-place-pages` had left
that popup out as a non-goal; the owner has now asked for it. The same message showed the
wordmark's corner marks still on screen in the owner's browser: the file was fixed, but
the browser kept its copy of the image, whose address had not changed.

## What Changes

- **An invitation card that opens the visit.** Once per browser session, the first place
  the visitor opens invites them to the ambassador contest. On the hub it appears once
  the visitor has entered the world. On any other page except the contest's own, it
  appears shortly after the page opens.
  - It has the contest's photo-filled wordmark on top, a script greeting, the headline and
    one sentence. "Quero me candidatar" goes to `/embaixador`, and "Agora não" closes it.
    Escape, the close button and a click outside close it too.
  - It says the contest is fictional.
  - It never covers the title state or an open place card.
  - `?convite` in the address shows it regardless, for the presentation.
- **Copy that was the reference's, translated, is rewritten.** The footer's "Entrar na
  disputa" was its "Get in the race". "E não esqueça / O prêmio" was "And don't forget /
  The prize". "Precisa de uma ideia de campanha?" was "Need some campaign strategy?".
- **The wordmark files get new names**, `saltopia-wordmark.png` and
  `saltopia-wordmark-flat.png`, so that no cached copy of the marked image can be served
  again.

*Mirrors:* the reference's contest popup on the hub and its pages: a card over the
content with the contest's logo, a headline, one line and a call to action. The words,
colours and shapes are ours.

## Non-goals

- Showing it on every page load. Once a session is enough to be seen and not so often
  that it gets in the way. The reference's frequency was not measured.
- Any form or data collection. The card links to the contest page and nothing else.

## Capabilities

### New Capabilities

- `contest-invitation`: when the invitation appears and when it does not, how it is
  dismissed, what it offers, and how it behaves under reduced motion and for keyboard
  users.

### Modified Capabilities

None. The copy changes and the renamed files change no requirement.

## Impact

- New `components/contest/invitation-card.tsx` (client) and a pure
  `lib/contest/invitation.ts` (when to show, tested).
- `ContentShell` mounts it on content pages; `world-map.tsx` mounts it on the hub.
- `scripts/build-logo.py` output names; the header, footer and intro use the new files.

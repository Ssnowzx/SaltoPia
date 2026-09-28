## 1. Logic

- [x] 1.1 `lib/contest/invitation.ts` with `shouldInvite` and the session key. Verify with unit tests: first visit, seen, forced, contest page, blocked.

## 2. Card

- [x] 2.1 `components/contest/invitation-card.tsx`: dialog, wordmark, copy, actions, fine print, delay, block handling, Lenis pause, focus return. Verify that Escape, backdrop and "Agora não" all close it and that the CTA navigates.
- [x] 2.2 Mount it in `ContentShell` (off on `/embaixador`) and on the hub (blocked by title state, place card, character creation). Verify it appears in a fresh session on the hub after entering, on a place page, and not on `/embaixador`, and appears only once per session.

## 3. Copy and wordmark

- [x] 3.1 Rewrite the three translated lines (D4). Verify the reference phrases are gone from `src/` with a text search.
- [x] 3.2 Rename the wordmark files (script output, `git mv`, references). Verify the hub, header and footer load the new names with no 404.

## 4. Close

- [x] 4.1 Capture the invitation on the hub and a place page at 1440 and 390, under reduced motion too. Run `npm test`, `npm run check` and `npm run build`, and verify all pass.

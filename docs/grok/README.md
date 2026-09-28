# Generating the missing photographs with Grok

`manifest.jsonl` lists every photograph the pages are still waiting for, one JSON object
per line. It is generated, and git ignores it: it changes with every picture that arrives,
so always build it fresh with step 1. When nothing is missing, it is empty.

Each line looks like this:

```json
{"path": "web/public/images/menu/galpao-do-fogo/costela-de-fogo-de-chao.webp", "aspect_ratio": "3:4", "prompt": "..."}
```

`path` is relative to the repository root. `aspect_ratio` and `prompt` are the two
arguments Grok Build's `image_gen` takes. The order is menus (135), then the contest page
(3), then the place galleries (90), so a run cut short still fills the most visible
pictures first. Until a file exists, its page draws a stand-in in its place.

## 1. Refresh the list

```bash
cd web && npm run images:prompts
```

This drops anything already on disk from the list. It also rewrites the menu section of
`docs/image-prompts.md`. The briefs themselves are edited in
`web/prisma/content/menus.ts` and `web/src/lib/contest/content.ts`.

## 2. Hand it to Grok Build

From the repository root:

```bash
grok --always-approve -p "Read docs/grok/manifest.jsonl. For every line, call image_gen with exactly that line's prompt and aspect_ratio - do not rewrite the prompt - and save the result at that line's path, creating folders as needed. If the tool gives you PNG or JPEG rather than WebP, save it with that extension at the same place (for example costela-de-chao.png); it is converted later. Skip any line whose file already exists. Work through the whole file, then report how many images you saved and list any line that failed."
```

To run a smaller batch, give it a slice first, for example
`head -45 docs/grok/manifest.jsonl > docs/grok/batch.jsonl`, and name `batch.jsonl` in
the prompt instead.

## 3. Bring them in

```bash
cd web && npm run images:sharpen && npm run check:assets
```

`images:sharpen` does three things:
- converts any PNG or JPEG in the image folders to WebP;
- puts back the edge the generator's upscale smears;
- empties the dev server's image cache, which keys on the URL and would otherwise keep
  showing the stand-in.

`check:assets` then counts how many menu photographs each place has.

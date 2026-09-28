import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { MENUS } from "../prisma/content/menus";
import { PLACES } from "../prisma/content/places";
import { menuImagePath } from "../prisma/content/types";
import { CONTEST_PHOTOS } from "../src/lib/contest/content";

/**
 * Writes the briefs for every photograph the pages are still waiting for.
 *
 *   npm run images:prompts
 *
 * Two outputs, from one list:
 * - `docs/grok/manifest.jsonl` - one line per photograph not yet on disk: its path from
 *   the repository root, its aspect ratio and a complete prompt. It is what the owner hands
 *   to Grok Build, whose `image_gen` takes exactly those two arguments (see
 *   `docs/grok/README.md`). Menu photographs come first, then the contest's, then the
 *   galleries', so a batch cut short still fills the most visible pictures.
 * - the menu and contest sections of `docs/image-prompts.md`, between their markers, so
 *   the human-readable briefs never drift from the content they describe.
 *
 * The words live in the content modules; a brief is edited there, never here.
 */

const WEB = join(__dirname, "..");
const REPO = join(WEB, "..");
const PUBLIC = join(WEB, "public");
const DOC = join(REPO, "docs", "image-prompts.md");
const MANIFEST = join(REPO, "docs", "grok", "manifest.jsonl");

const MENU_MARKERS = { start: "<!-- menu:start -->", end: "<!-- menu:end -->" } as const;
const GALLERY_HEADING = "## GALLERIES";
const GALLERY_PICTURES = 6;

/**
 * The PHOTO block of `docs/image-prompts.md`, condensed and put positively - Grok Build's
 * own guidance asks for prose that says what to show rather than what to avoid. The one
 * exclusion kept is writing, because a generated label is always misspelt.
 */
const STYLE =
  "Photorealistic photograph taken on a full-frame camera with a 35mm lens, natural light, true-to-life colour and a gentle shallow depth of field. " +
  "The setting is the highlands of the Serra Catarinense near Lages in southern Brazil: araucaria pines with tall bare trunks and flat, upturned crowns, rolling green pasture hills, a turquoise reservoir and cool clear air - rural gaúcho highland life.";

const NO_WRITING = "Every surface is plain and unlabelled; there is no writing, lettering, sign or logo anywhere in the frame.";

const FRAMING = {
  "3:4": "Vertical 3:4 frame with the subject filling it.",
  "4:3": "Horizontal 4:3 frame.",
} as const;

type AspectRatio = keyof typeof FRAMING;

interface Brief {
  /** From the repository root, as Grok Build is run from there. */
  readonly path: string;
  readonly aspect_ratio: AspectRatio;
  readonly prompt: string;
}

function prompt(subject: string, aspect: AspectRatio, setting?: string): string {
  return [subject, setting ? `Setting: ${setting}` : "", STYLE, FRAMING[aspect], NO_WRITING].filter(Boolean).join(" ");
}

function brief(publicPath: string, aspect: AspectRatio, subject: string, setting?: string): Brief {
  return { path: `web/public${publicPath}`, aspect_ratio: aspect, prompt: prompt(subject, aspect, setting) };
}

function menuBriefs(): Brief[] {
  return PLACES.flatMap((place) =>
    // The brief already sets its own scene; naming the place would only tempt the
    // generator to paint the name on a sign.
    (MENUS[place.slug]?.items ?? []).map((item) => brief(menuImagePath(place.slug, item.slug), "3:4", item.photo)),
  );
}

function contestBriefs(): Brief[] {
  return Object.values(CONTEST_PHOTOS).map((photo) => brief(photo.path, photo.aspectRatio, photo.photo));
}

/** The hero brief of each place, which sets the scene for its gallery lines. */
function placeSettings(doc: string): Map<string, string> {
  const settings = new Map<string, string>();
  const places = doc.slice(doc.indexOf("## PLACES"), doc.indexOf("## EXPERIENCES"));
  for (const block of places.split("\n### ").slice(1)) {
    const [slug, ...lines] = block.split("\n");
    settings.set(slug.trim(), lines.filter((line) => line.startsWith(">")).map((line) => line.replace(/^>\s?/, "")).join(" ").trim());
  }
  return settings;
}

/** The numbered gallery lines of `docs/image-prompts.md`, as briefs at `01.webp`...`06.webp`. */
function galleryBriefs(doc: string): Brief[] {
  const settings = placeSettings(doc);
  const start = doc.indexOf(GALLERY_HEADING);
  if (start < 0) return [];
  const end = doc.indexOf(MENU_MARKERS.start, start);
  const section = doc.slice(start, end < 0 ? undefined : end);
  return section
    .split("\n### ")
    .slice(1)
    .flatMap((block) => {
      const [heading, ...lines] = block.split("\n");
      const slug = heading.split(" ")[0];
      return lines
        .map((line) => /^(\d)\.\s+(.*)$/.exec(line.trim()))
        .filter((match): match is RegExpExecArray => match !== null && Number(match[1]) <= GALLERY_PICTURES)
        .map((match) => brief(`/images/places/${slug}/0${match[1]}.webp`, "4:3", match[2], settings.get(slug)));
    });
}

/** The markdown for the menu and contest briefs, as it sits between the markers. */
function menuSection(): string {
  const lines = [
    MENU_MARKERS.start,
    "",
    "## MENUS (3:4 → `web/public/images/menu/<place>/<item>.webp`)",
    "",
    "Written by `npm run images:prompts` from `web/prisma/content/menus.ts` - edit the briefs",
    "there. Nine per place; the page draws a stand-in for each one until its file exists.",
    "",
  ];
  for (const place of PLACES) {
    const menu = MENUS[place.slug];
    if (!menu) continue;
    lines.push(`### ${place.slug} — ${menu.title}`);
    for (const item of menu.items) lines.push(`- **${item.slug}** — ${item.photo}`);
    lines.push("");
  }
  lines.push("## CONTEST (→ `web/public/images/contest/`)", "");
  for (const photo of Object.values(CONTEST_PHOTOS)) lines.push(`- **${photo.path.split("/").pop()}** (${photo.aspectRatio}) — ${photo.photo}`);
  lines.push("", MENU_MARKERS.end);
  return lines.join("\n");
}

function writeDoc(doc: string): void {
  const section = menuSection();
  const start = doc.indexOf(MENU_MARKERS.start);
  const end = doc.indexOf(MENU_MARKERS.end);
  const next = start >= 0 && end > start ? `${doc.slice(0, start)}${section}${doc.slice(end + MENU_MARKERS.end.length)}` : `${doc.trimEnd()}\n\n---\n\n${section}\n`;
  writeFileSync(DOC, next);
}

function main(): void {
  const doc = readFileSync(DOC, "utf8");
  const all = [...menuBriefs(), ...contestBriefs(), ...galleryBriefs(doc)];
  const missing = all.filter((entry) => !existsSync(join(REPO, entry.path)));

  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, missing.map((entry) => JSON.stringify(entry)).join("\n") + (missing.length > 0 ? "\n" : ""));
  writeDoc(doc);

  const count = (prefix: string): number => missing.filter((entry) => entry.path.startsWith(`web/public/images/${prefix}`)).length;
  console.log(`BRIEFS ${all.length} in all; ${missing.length} still missing: ${count("menu")} menu, ${count("contest")} contest, ${count("places")} gallery`);
  console.log(`  manifest: ${MANIFEST.replace(`${REPO}/`, "")}`);
  if (!existsSync(PUBLIC)) console.warn("  public/ not found - run from web/");
}

main();

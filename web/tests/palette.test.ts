import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { MIN_REFERENCE_DISTANCE, nearestReferenceSwatch, oklabChroma } from "@/lib/colour";

const SRC = join(__dirname, "..", "src");

/** Above this chroma a token is a hue, and is held to the reference distance. */
const SATURATED = 0.04;

/** The interface tokens that were the reference's own greens, retired on 2026-09-28. */
const RETIRED = /\b(teal|teal-deep|teal-dark|araucaria)\b/;

/** Class-name prefixes that would put a retired token on screen. */
const RETIRED_USE = /(?:bg|text|border|ring|fill|stroke|from|to|via|decoration|outline|shadow)-(?:teal|teal-deep|teal-dark|araucaria)\b|--color-(?:teal|araucaria)/;

/** The `--color-*` tokens of the `@theme` block, as name and hex. */
function paletteTokens(): ReadonlyArray<readonly [string, string]> {
  const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");
  const theme = css.slice(css.indexOf("@theme"), css.indexOf("}", css.indexOf("@theme")));
  return [...theme.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((match) => [match[1], match[2]] as const);
}

/** Every interface source file - the 3D world keeps its own palette and is left out. */
function interfaceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === "world" || name === "generated" ? [] : interfaceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

describe("palette", () => {
  it("should keep every saturated token away from the reference site's colours", () => {
    // ARRANGE
    const tokens = paletteTokens().filter(([, hex]) => oklabChroma(hex) > SATURATED);

    // ACT
    const tooClose = tokens
      .map(([token, hex]) => ({ token, ...nearestReferenceSwatch(hex) }))
      .filter((found) => found.distance < MIN_REFERENCE_DISTANCE);

    // ASSERT
    assert.deepEqual(tooClose, []);
  });

  it("should define no retired token", () => {
    // ARRANGE
    const names = paletteTokens().map(([name]) => name);

    // ACT
    const retired = names.filter((name) => RETIRED.test(name));

    // ASSERT
    assert.deepEqual(retired, []);
  });

  it("should use no retired token anywhere in the interface", () => {
    // ARRANGE
    const files = interfaceFiles(SRC);

    // ACT
    const offenders = files.filter((file) => RETIRED_USE.test(readFileSync(file, "utf8"))).map((file) => file.slice(SRC.length + 1));

    // ASSERT
    assert.deepEqual(offenders, []);
  });

  it("should treat the paper and ink as neutrals", () => {
    // ARRANGE
    const neutrals = ["#f6efe2", "#efe4d0", "#2f2a24"];

    // ACT
    const chromas = neutrals.map(oklabChroma);

    // ASSERT
    assert.ok(chromas.every((chroma) => chroma <= SATURATED), `got ${chromas.join(", ")}`);
  });
});

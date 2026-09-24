import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping } from "three";

import { createRandom } from "./noise";

/**
 * The road surfaces' detail, drawn once on canvases at load.
 *
 * Each is a greyscale height of grain around mid-grey; the road material multiplies it into
 * its own colours, so one texture serves new tarmac and worn tarmac alike. They are their
 * own repeating textures rather than atlas tiles: the atlas wraps with `fract()` and seams
 * at every wrap (founding design D19), and a road is the one surface long enough to show
 * every seam. Browser only.
 */

const SIZE = 256;

type Context = CanvasRenderingContext2D;
type Random = () => number;

function toTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  // Detail, not colour: sampled as data, the grey stays where the drawing put it.
  texture.colorSpace = NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createCanvas(): { canvas: HTMLCanvasElement; ctx: Context } {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create a 2D context for a road texture.");
  return { canvas, ctx };
}

/** Per-pixel grain around `mean`, wrapping so the tile repeats without a seam. */
function grain(ctx: Context, mean: number, spread: number, random: Random): void {
  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const value = Math.round(Math.min(1, Math.max(0, mean + (random() - 0.5) * spread)) * 255);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

/** Draws a blob at (x, y) and at its wrapped copies, so blobs cross the tile's edge cleanly. */
function wrappedBlob(ctx: Context, x: number, y: number, radiusX: number, radiusY: number, style: string): void {
  ctx.fillStyle = style;
  for (const dx of [-SIZE, 0, SIZE]) {
    for (const dy of [-SIZE, 0, SIZE]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y + dy, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Tarmac: fine grain, pale aggregate showing through, the odd darker patch of repair. */
export function createAsphaltTexture(): CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const random = createRandom(401);
  grain(ctx, 0.5, 0.22, random);
  for (let index = 0; index < 14; index += 1) {
    wrappedBlob(ctx, random() * SIZE, random() * SIZE, 10 + random() * 28, 8 + random() * 20, `rgba(0,0,0,${0.04 + random() * 0.06})`);
  }
  for (let index = 0; index < 900; index += 1) {
    wrappedBlob(ctx, random() * SIZE, random() * SIZE, 0.6 + random(), 0.6 + random(), `rgba(255,255,255,${0.12 + random() * 0.2})`);
  }
  return toTexture(canvas);
}

/** Earth: coarse grain, pebbles, and damp darker patches. */
export function createEarthTexture(): CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const random = createRandom(409);
  grain(ctx, 0.52, 0.3, random);
  for (let index = 0; index < 20; index += 1) {
    wrappedBlob(ctx, random() * SIZE, random() * SIZE, 12 + random() * 30, 10 + random() * 24, `rgba(0,0,0,${0.05 + random() * 0.08})`);
  }
  for (let index = 0; index < 260; index += 1) {
    const radius = 0.8 + random() * 2.2;
    wrappedBlob(ctx, random() * SIZE, random() * SIZE, radius, radius * (0.6 + random() * 0.4), `rgba(255,255,255,${0.14 + random() * 0.22})`);
  }
  return toTexture(canvas);
}

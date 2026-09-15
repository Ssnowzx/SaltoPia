import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  ClampToEdgeWrapping,
} from "three";

import { createRandom } from "./noise";

/**
 * Procedural surface textures, drawn once on a canvas at load.
 *
 * Every pattern is greyscale luminance around 0.9. The vertex colour of each part
 * supplies the hue, so one brick tile serves a red wall and a yellow one alike, and the
 * palette stays where it is defined. The atlas is a 4x4 grid; the world material
 * picks a tile per vertex from the `surface` attribute and repeats within it.
 */

/** Tile index in the atlas for each kind of surface. Matches WORLD_MATERIAL's shader. */
export const SURFACE = {
  plain: 0,
  plaster: 1,
  brick: 2,
  planks: 3,
  tiles: 4,
  stone: 5,
  shingle: 6,
  metal: 7,
  dirt: 8,
  grass: 9,
  slate: 10,
  paving: 11,
  glass: 12,
  water: 13,
  foliage: 14,
  bark: 15,
} as const;

export type SurfaceKey = keyof typeof SURFACE;

export const ATLAS_TILES_PER_SIDE = 4;
const TILE = 256;

type Context = CanvasRenderingContext2D;
type Random = () => number;

function grey(value: number): string {
  const v = Math.round(Math.min(1, Math.max(0, value)) * 255);
  return `rgb(${v},${v},${v})`;
}

/** Multiplies every pixel of a tile by a little noise, so no surface is a flat fill. */
function grain(ctx: Context, x: number, y: number, amplitude: number, random: Random): void {
  const image = ctx.getImageData(x, y, TILE, TILE);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const factor = 1 + (random() - 0.5) * 2 * amplitude;
    data[index] = Math.min(255, data[index] * factor);
    data[index + 1] = Math.min(255, data[index + 1] * factor);
    data[index + 2] = Math.min(255, data[index + 2] * factor);
  }
  ctx.putImageData(image, x, y);
}

function fill(ctx: Context, x: number, y: number, value: number): void {
  ctx.fillStyle = grey(value);
  ctx.fillRect(x, y, TILE, TILE);
}

function drawPlain(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.94);
  grain(ctx, x, y, 0.015, random);
}

function drawPlaster(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.92);
  for (let index = 0; index < 40; index += 1) {
    ctx.fillStyle = `rgba(0,0,0,${0.02 + random() * 0.04})`;
    ctx.beginPath();
    ctx.arc(x + random() * TILE, y + random() * TILE, 6 + random() * 18, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, x, y, 0.05, random);
}

function drawBrick(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.74);
  const brickWidth = 32;
  const brickHeight = 14;
  const gap = 2;
  for (let row = 0; row * (brickHeight + gap) < TILE; row += 1) {
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    for (let column = -1; column * (brickWidth + gap) < TILE + brickWidth; column += 1) {
      ctx.fillStyle = grey(0.86 + (random() - 0.5) * 0.14);
      ctx.fillRect(
        x + offset + column * (brickWidth + gap),
        y + row * (brickHeight + gap),
        brickWidth,
        brickHeight,
      );
    }
  }
  grain(ctx, x, y, 0.04, random);
}

function drawPlanks(ctx: Context, x: number, y: number, random: Random, plankWidth = 32): void {
  fill(ctx, x, y, 0.62);
  for (let column = 0; column * plankWidth < TILE; column += 1) {
    const shade = 0.86 + (random() - 0.5) * 0.12;
    ctx.fillStyle = grey(shade);
    ctx.fillRect(x + column * plankWidth + 1, y, plankWidth - 2, TILE);
    ctx.strokeStyle = grey(shade - 0.08);
    ctx.lineWidth = 1;
    for (let line = 0; line < 4; line += 1) {
      const lineX = x + column * plankWidth + 4 + random() * (plankWidth - 8);
      ctx.beginPath();
      ctx.moveTo(lineX, y);
      ctx.lineTo(lineX + (random() - 0.5) * 6, y + TILE);
      ctx.stroke();
    }
  }
  grain(ctx, x, y, 0.03, random);
}

function drawTiles(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.66);
  const tileWidth = 20;
  const rowHeight = 18;
  for (let row = -1; row * rowHeight < TILE + rowHeight; row += 1) {
    const offset = row % 2 === 0 ? 0 : tileWidth / 2;
    for (let column = -1; column * tileWidth < TILE + tileWidth; column += 1) {
      const centreX = x + offset + column * tileWidth + tileWidth / 2;
      const top = y + row * rowHeight;
      ctx.fillStyle = grey(0.86 + (random() - 0.5) * 0.12);
      ctx.beginPath();
      ctx.arc(centreX, top + rowHeight, tileWidth / 2 - 1, Math.PI, 0);
      ctx.lineTo(centreX + tileWidth / 2 - 1, top + rowHeight + 4);
      ctx.lineTo(centreX - tileWidth / 2 + 1, top + rowHeight + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  grain(ctx, x, y, 0.04, random);
}

function drawStone(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.68);
  let top = 0;
  while (top < TILE) {
    const rowHeight = 18 + Math.floor(random() * 10);
    let left = -Math.floor(random() * 20);
    while (left < TILE) {
      const width = 22 + Math.floor(random() * 30);
      ctx.fillStyle = grey(0.86 + (random() - 0.5) * 0.14);
      ctx.fillRect(x + left + 2, y + top + 2, width - 3, rowHeight - 3);
      left += width;
    }
    top += rowHeight;
  }
  grain(ctx, x, y, 0.05, random);
}

function drawShingle(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.6);
  const width = 24;
  const height = 14;
  for (let row = 0; row * height < TILE; row += 1) {
    const offset = row % 2 === 0 ? 0 : width / 2;
    for (let column = -1; column * width < TILE + width; column += 1) {
      ctx.fillStyle = grey(0.82 + (random() - 0.5) * 0.14);
      ctx.fillRect(x + offset + column * width + 1, y + row * height + 1, width - 2, height - 2);
    }
  }
  grain(ctx, x, y, 0.04, random);
}

function drawMetal(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.88);
  ctx.fillStyle = grey(0.8);
  for (let column = 0; column < TILE; column += 16) {
    ctx.fillRect(x + column, y, 2, TILE);
  }
  grain(ctx, x, y, 0.02, random);
}

function drawDirt(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.9);
  for (let index = 0; index < 220; index += 1) {
    ctx.fillStyle = grey(0.78 + random() * 0.16);
    ctx.beginPath();
    ctx.arc(x + random() * TILE, y + random() * TILE, 1 + random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, x, y, 0.07, random);
}

function drawGrass(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.9);
  ctx.lineWidth = 1;
  for (let index = 0; index < 900; index += 1) {
    ctx.strokeStyle = grey(0.78 + random() * 0.24);
    const startX = x + random() * TILE;
    const startY = y + random() * TILE;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + (random() - 0.5) * 3, startY - 3 - random() * 5);
    ctx.stroke();
  }
  grain(ctx, x, y, 0.06, random);
}

function drawSlate(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.62);
  const width = 32;
  const height = 20;
  for (let row = 0; row * height < TILE; row += 1) {
    const offset = row % 2 === 0 ? 0 : width / 2;
    for (let column = -1; column * width < TILE + width; column += 1) {
      ctx.fillStyle = grey(0.84 + (random() - 0.5) * 0.1);
      ctx.fillRect(x + offset + column * width + 1, y + row * height + 1, width - 2, height - 2);
    }
  }
  grain(ctx, x, y, 0.03, random);
}

function drawPaving(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.7);
  const slab = 64;
  for (let row = 0; row < TILE / slab; row += 1) {
    for (let column = 0; column < TILE / slab; column += 1) {
      ctx.fillStyle = grey(0.9 + (random() - 0.5) * 0.08);
      ctx.fillRect(x + column * slab + 2, y + row * slab + 2, slab - 4, slab - 4);
    }
  }
  grain(ctx, x, y, 0.03, random);
}

function drawGlass(ctx: Context, x: number, y: number): void {
  const gradient = ctx.createLinearGradient(x, y, x, y + TILE);
  gradient.addColorStop(0, grey(0.92));
  gradient.addColorStop(1, grey(0.74));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.moveTo(x + 20, y + TILE);
  ctx.lineTo(x + 110, y);
  ctx.lineTo(x + 160, y);
  ctx.lineTo(x + 70, y + TILE);
  ctx.closePath();
  ctx.fill();
}

function drawWater(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.9);
  for (let row = 0; row < TILE; row += 2) {
    const wave = 0.86 + 0.06 * Math.sin(row * 0.11) + 0.03 * Math.sin(row * 0.37);
    ctx.fillStyle = grey(wave);
    ctx.fillRect(x, y + row, TILE, 2);
  }
  ctx.strokeStyle = grey(1);
  ctx.lineWidth = 2;
  for (let index = 0; index < 18; index += 1) {
    const startX = x + random() * TILE;
    const startY = y + random() * TILE;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + 14 + random() * 30, startY + 2 + random() * 6);
    ctx.stroke();
  }
  grain(ctx, x, y, 0.02, random);
}

function drawFoliage(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.86);
  for (let index = 0; index < 160; index += 1) {
    ctx.fillStyle = grey(0.74 + random() * 0.3);
    ctx.beginPath();
    ctx.arc(x + random() * TILE, y + random() * TILE, 5 + random() * 12, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, x, y, 0.05, random);
}

function drawBark(ctx: Context, x: number, y: number, random: Random): void {
  fill(ctx, x, y, 0.84);
  ctx.lineWidth = 2;
  for (let index = 0; index < 90; index += 1) {
    ctx.strokeStyle = grey(0.68 + random() * 0.3);
    const startX = x + random() * TILE;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + (random() - 0.5) * 10, y + TILE);
    ctx.stroke();
  }
  grain(ctx, x, y, 0.04, random);
}

const DRAWERS: ReadonlyArray<(ctx: Context, x: number, y: number, random: Random) => void> = [
  drawPlain,
  drawPlaster,
  drawBrick,
  drawPlanks,
  drawTiles,
  drawStone,
  drawShingle,
  drawMetal,
  drawDirt,
  drawGrass,
  drawSlate,
  drawPaving,
  (ctx, x, y) => drawGlass(ctx, x, y),
  drawWater,
  drawFoliage,
  drawBark,
];

/** The 4x4 atlas every textured mesh samples from. Browser only. */
export function createAtlasTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TILE * ATLAS_TILES_PER_SIDE;
  canvas.height = TILE * ATLAS_TILES_PER_SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a 2D context for the surface atlas.");

  const random = createRandom(7);
  DRAWERS.forEach((draw, index) => {
    const x = (index % ATLAS_TILES_PER_SIDE) * TILE;
    const y = Math.floor(index / ATLAS_TILES_PER_SIDE) * TILE;
    draw(ctx, x, y, random);
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** A repeating grass texture for the terrain, which is not drawn through the atlas. */
export function createGrassTexture(repeat: number): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TILE * 2;
  canvas.height = TILE * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a 2D context for the grass texture.");

  const random = createRandom(11);
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      drawGrass(ctx, column * TILE, row * TILE, random);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

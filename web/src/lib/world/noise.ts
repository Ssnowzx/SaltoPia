/**
 * Deterministic pseudo-randomness for the neighbourhood.
 *
 * Everything here is seeded and pure: the same seed always builds the same town. That
 * matters more than it sounds - a neighbourhood that reshuffles on every reload cannot
 * have its pin positions authored against it, and cannot be demonstrated twice the same
 * way.
 *
 * No noise library is pulled in. Value noise over a hash is enough for terrain at this
 * scale, and keeping it here means the terrain's shape is readable source.
 */

/**
 * Creates a small, fast, seeded random number generator (mulberry32).
 *
 * @param seed - Any integer. The same seed yields the same sequence.
 * @returns A function returning the next value in [0, 1).
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hashes a lattice point to a stable value in [0, 1). */
function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smoothstep, used to round off the interpolation between lattice points. */
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Two-dimensional value noise in [0, 1).
 *
 * @param x - Sample position.
 * @param y - Sample position.
 * @param seed - Seed shared by every sample of the same field.
 */
export function valueNoise2D(x: number, y: number, seed: number): number {
  const xIndex = Math.floor(x);
  const yIndex = Math.floor(y);
  const xFraction = smooth(x - xIndex);
  const yFraction = smooth(y - yIndex);

  const topLeft = hash2(xIndex, yIndex, seed);
  const topRight = hash2(xIndex + 1, yIndex, seed);
  const bottomLeft = hash2(xIndex, yIndex + 1, seed);
  const bottomRight = hash2(xIndex + 1, yIndex + 1, seed);

  const top = topLeft + (topRight - topLeft) * xFraction;
  const bottom = bottomLeft + (bottomRight - bottomLeft) * xFraction;

  return top + (bottom - top) * yFraction;
}

/**
 * Layered value noise. Each octave halves the amplitude and doubles the frequency, which
 * is what turns smooth blobs into something that reads as terrain.
 *
 * @param x - Sample position.
 * @param y - Sample position.
 * @param seed - Seed shared by every sample of the same field.
 * @param octaves - How many layers to sum.
 * @returns A value in roughly [0, 1).
 */
export function fractalNoise2D(x: number, y: number, seed: number, octaves = 4): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let normalisation = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    total += valueNoise2D(x * frequency, y * frequency, seed + octave * 101) * amplitude;
    normalisation += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / normalisation;
}

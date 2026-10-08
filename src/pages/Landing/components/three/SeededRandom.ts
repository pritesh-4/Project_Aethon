/**
 * Deterministic Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% reproducible signal fields, stars, and distributions
 * across renders and page reloads.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = 1420405) {
    this.seed = seed >>> 0;
  }

  /** Returns a float in [0, 1) */
  public next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a float in [min, max) */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns an integer in [min, max] */
  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Returns Gaussian distributed value with mean and stdDev */
  public gaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

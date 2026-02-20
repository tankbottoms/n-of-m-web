export interface MotionSample {
  x: number;
  y: number;
  t: number;
}

export class MotionCollector {
  private samples: MotionSample[] = [];
  private targetSamples: number;

  constructor(targetSamples = 256) {
    this.targetSamples = targetSamples;
  }

  addSample(x: number, y: number): void {
    this.samples.push({ x, y, t: performance.now() });
  }

  get progress(): number {
    return Math.min(1, this.samples.length / this.targetSamples);
  }

  get isComplete(): boolean {
    return this.samples.length >= this.targetSamples;
  }

  toEntropy(): Uint8Array {
    const result = new Uint8Array(32);
    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i];
      const byte = Math.floor(((s.x * 7919 + s.y * 6271 + s.t * 3571) % 256 + 256) % 256);
      result[i % 32] ^= byte;
    }
    return result;
  }

  reset(): void {
    this.samples = [];
  }
}

import { createGrid, type Grid } from "./grid";
import { getRandomWord } from "./words";
import { generateQR, qrToGridMask, getQRMessage } from "./qrcode";
import { generateTextMask } from "./text-mask";

// --- Layout ---
const FONT_SIZE = 14;
const LINE_HEIGHT = FONT_SIZE + 3;
const TOKEN_LEN = 3;
const FONT = `${FONT_SIZE}px "SF Mono", "Fira Code", "Cascadia Code", "Consolas", monospace`;

// --- Colors (text only, no backgrounds) ---
const COLOR_NORMAL_R = 200, COLOR_NORMAL_G = 200, COLOR_NORMAL_B = 200;
const COLOR_DARK_R = 17, COLOR_DARK_G = 17, COLOR_DARK_B = 17;

// --- Timing ---
const FLASH_DURATION = 2000;   // hold each QR for 2s (camera scannable)
const FLASH_GAP = 200;         // short gap between flashes in a burst
const BURST_PAUSE = 200;       // initial pause before first flash
const COLOR_SPEED = 0.005;     // fade speed for color transitions

// --- Random character for per-char cycling ---
const CHARS = "abcdefghijklmnopqrstuvwxyz";
function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]!;
}

function getToken(): string {
  const w = getRandomWord();
  return w.slice(0, TOKEN_LEN);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface WordSaladOptions {
  container: HTMLElement;
  messages?: string[];
  burstSize?: number;
  burstCycles?: number;
  burstSkip?: number;
  revealText?: [string, string];
  holdDuration?: number;
  onComplete?: () => void;
}

type Phase = "idle" | "active" | "draining" | "text-reveal" | "holding";

export class WordSalad {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid!: Grid;
  private measuredTokenWidth!: number;
  private resizeObserver: ResizeObserver;
  private rafId: number = 0;
  private lastTime: number = 0;

  // Centering offsets (leftover pixels when grid doesn't fill canvas evenly)
  private offsetX: number = 0;
  private offsetY: number = 0;

  // Options with defaults
  private burstSize: number;
  private burstCycles: number;
  private burstSkip: number;
  private revealText: [string, string];
  private holdDuration: number;
  private onComplete?: () => void;

  // State machine
  private phase: Phase = "idle";
  private phaseTime: number = 0;
  private currentIndex: number = 0;
  private burstCount: number = 0;     // 0..burstSize-1 within current burst
  private totalFlashes: number = 0;   // total flashes completed
  private maxFlashes: number;
  private mask: boolean[][] | null = null;

  constructor(options: WordSaladOptions) {
    this.container = options.container;
    this.burstSize = options.burstSize ?? 5;
    this.burstCycles = options.burstCycles ?? 1;
    this.burstSkip = options.burstSkip ?? 0;
    this.revealText = options.revealText ?? ["n of m", "SHAMIR"];
    this.holdDuration = options.holdDuration ?? 15000;
    this.onComplete = options.onComplete;
    this.maxFlashes = this.burstSize * this.burstCycles;

    // Create canvas inside container
    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;

    // Observe container size
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  start(): void {
    this.resize();
    this.lastTime = 0;
    this.rafId = requestAnimationFrame((t) => this.draw(t));
  }

  destroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.canvas.remove();
  }

  private measureFont(): void {
    this.ctx.font = FONT;
    const m = this.ctx.measureText("abcdefghij");
    const charW = m.width / 10;
    this.measuredTokenWidth = Math.ceil(charW * TOKEN_LEN + 5);
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.measureFont();
    this.grid = createGrid(this.canvas.width, this.canvas.height, this.measuredTokenWidth, LINE_HEIGHT);

    // Center the grid: offset by half of leftover pixels
    this.offsetX = Math.floor((this.canvas.width - this.grid.cols * this.measuredTokenWidth) / 2);
    this.offsetY = Math.floor((this.canvas.height - this.grid.rows * LINE_HEIGHT) / 2);

    // Reset mask state on resize but keep phase position
    this.mask = null;
    for (const row of this.grid.cells) {
      for (const cell of row) {
        cell.inSilhouette = false;
        cell.colorProgress = 0;
      }
    }
  }

  private resetState(): void {
    this.phase = "idle";
    this.phaseTime = 0;
    this.currentIndex = 0;
    this.burstCount = 0;
    this.totalFlashes = 0;
    this.mask = null;
    this.clearMask();
    for (const row of this.grid.cells) {
      for (const cell of row) {
        cell.colorProgress = 0;
      }
    }
  }

  private applyMask(mask: boolean[][]): void {
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        this.grid.cells[r]![c]!.inSilhouette = mask[r]?.[c] ?? false;
      }
    }
  }

  private clearMask(): void {
    for (const row of this.grid.cells) {
      for (const cell of row) {
        cell.inSilhouette = false;
      }
    }
  }

  private currentIdleDuration(): number {
    return this.burstCount === 0 ? BURST_PAUSE : FLASH_GAP;
  }

  private updatePhase(dt: number): void {
    this.phaseTime += dt;

    switch (this.phase) {
      case "idle":
        if (this.phaseTime >= this.currentIdleDuration()) {
          // Check if all burst flashes are done -> transition to text reveal
          if (this.totalFlashes >= this.maxFlashes) {
            this.phase = "text-reveal";
            this.phaseTime = 0;
            const textMask = generateTextMask(
              this.revealText,
              this.grid.cols,
              this.grid.rows,
              this.measuredTokenWidth,
              LINE_HEIGHT,
            );
            this.applyMask(textMask);
            return;
          }

          const msg = getQRMessage(this.currentIndex);
          const qr = generateQR(msg);
          this.mask = qrToGridMask(qr, this.grid.cols, this.grid.rows, this.measuredTokenWidth, LINE_HEIGHT);
          this.applyMask(this.mask);
          this.phase = "active";
          this.phaseTime = 0;
        }
        break;

      case "active":
        if (this.phaseTime >= FLASH_DURATION) {
          this.clearMask();
          this.phase = "draining";
          this.phaseTime = 0;
          this.mask = null;
        }
        break;

      case "draining": {
        let allDrained = true;
        for (const row of this.grid.cells) {
          for (const cell of row) {
            if (cell.colorProgress > 0.01) {
              allDrained = false;
              break;
            }
          }
          if (!allDrained) break;
        }
        if (allDrained || this.phaseTime > 800) {
          for (const row of this.grid.cells) {
            for (const cell of row) {
              cell.colorProgress = 0;
            }
          }

          // Advance burst counter and message index
          this.burstCount++;
          this.currentIndex++;
          this.totalFlashes++;

          if (this.burstCount >= this.burstSize) {
            // End of burst: skip messages, reset burst counter
            this.currentIndex += this.burstSkip;
            this.burstCount = 0;
          }

          this.phase = "idle";
          this.phaseTime = 0;
        }
        break;
      }

      case "text-reveal": {
        // Wait until most mask cells have reached full color
        let allRevealed = true;
        for (const row of this.grid.cells) {
          for (const cell of row) {
            if (cell.inSilhouette && cell.colorProgress < 0.95) {
              allRevealed = false;
              break;
            }
          }
          if (!allRevealed) break;
        }
        if (allRevealed) {
          this.phase = "holding";
          this.phaseTime = 0;
        }
        break;
      }

      case "holding":
        if (this.phaseTime >= this.holdDuration) {
          this.onComplete?.();
          this.resetState();
        }
        break;
    }
  }

  private draw(time: number): void {
    const dt = this.lastTime === 0 ? 16 : time - this.lastTime;
    this.lastTime = time;
    const cappedDt = Math.min(dt, 100);

    this.updatePhase(cappedDt);

    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = FONT;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";

    for (const row of this.grid.cells) {
      for (const cell of row) {
        // --- Cycling ---
        cell.lastCycleTime += cappedDt;
        if (cell.lastCycleTime >= cell.cycleInterval) {
          if (cell.inSilhouette || cell.colorProgress > 0.3) {
            const pos = Math.floor(Math.random() * TOKEN_LEN);
            const chars = cell.word.split("");
            chars[pos] = randomChar();
            cell.word = chars.join("");
          } else {
            cell.word = getToken();
          }
          cell.lastCycleTime = 0;
        }

        // --- Color chase: smoothly move toward target ---
        const target = cell.inSilhouette ? 1 : 0;
        if (cell.colorProgress < target) {
          cell.colorProgress = Math.min(cell.colorProgress + COLOR_SPEED * cappedDt, 1);
        } else if (cell.colorProgress > target) {
          cell.colorProgress = Math.max(cell.colorProgress - COLOR_SPEED * cappedDt, 0);
        }

        // --- Draw centered ---
        const t = cell.colorProgress;
        const r = Math.round(lerp(COLOR_NORMAL_R, COLOR_DARK_R, t));
        const g = Math.round(lerp(COLOR_NORMAL_G, COLOR_DARK_G, t));
        const b = Math.round(lerp(COLOR_NORMAL_B, COLOR_DARK_B, t));
        this.ctx.fillStyle = `rgb(${r},${g},${b})`;
        this.ctx.fillText(cell.word, cell.x + this.offsetX, cell.y + this.offsetY);
      }
    }

    this.rafId = requestAnimationFrame((t) => this.draw(t));
  }
}

import QrScanner from 'qr-scanner';
import jsQR from 'jsqr';

export type ScanStatus = 'idle' | 'scanning' | 'detected';

export interface ScannerConfig {
  onScan: (data: string) => boolean;
  onError?: (error: string) => void;
  onStatusChange?: (status: ScanStatus) => void;
}

export class QRScanner {
  private scanner: QrScanner | null = null;
  private config: ScannerConfig;
  private cooldown = false;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async start(videoElement: HTMLVideoElement): Promise<void> {
    this.config.onStatusChange?.('scanning');

    this.scanner = new QrScanner(
      videoElement,
      (result) => {
        if (this.cooldown) return;
        this.cooldown = true;
        this.config.onStatusChange?.('detected');
        const accepted = this.config.onScan(result.data);
        setTimeout(() => {
          this.cooldown = false;
          this.config.onStatusChange?.('scanning');
        }, accepted ? 1500 : 500);
      },
      {
        onDecodeError: () => {
          // Silent -- qr-scanner fires this on every frame without a QR code
        },
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        returnDetailedScanResult: true,
      }
    );

    try {
      await this.scanner.start();
    } catch (e) {
      this.scanner.destroy();
      this.scanner = null;
      this.config.onStatusChange?.('idle');
      const msg = e instanceof Error ? e.message : 'Camera access denied';
      this.config.onError?.(msg);
      throw e;
    }
  }

  stop(): void {
    if (this.scanner) {
      this.scanner.stop();
      this.scanner.destroy();
      this.scanner = null;
    }
    this.config.onStatusChange?.('idle');
  }
}

function scanOne(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { data: string; location: { x: number; y: number; w: number; h: number } } | null {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code) {
    const pts = [code.location.topLeftCorner, code.location.topRightCorner, code.location.bottomLeftCorner, code.location.bottomRightCorner];
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    return {
      data: code.data,
      location: {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      },
    };
  }
  return null;
}

function scanWithUpscale(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string | null {
  // Try native resolution first
  const result = scanOne(canvas, ctx);
  if (result) return result.data;

  // Fallback: 2x nearest-neighbor upscale
  const upCanvas = document.createElement('canvas');
  upCanvas.width = canvas.width * 2;
  upCanvas.height = canvas.height * 2;
  const upCtx = upCanvas.getContext('2d');
  if (!upCtx) return null;
  upCtx.imageSmoothingEnabled = false;
  upCtx.drawImage(canvas, 0, 0, upCanvas.width, upCanvas.height);
  const upResult = scanOne(upCanvas, upCtx);
  return upResult?.data ?? null;
}

/** Scan a single canvas for ALL QR codes by repeatedly finding and masking each one. */
function scanCanvasForAll(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string[] {
  const found: string[] = [];
  // Work on a copy so we can paint over found codes
  const workCanvas = document.createElement('canvas');
  workCanvas.width = canvas.width;
  workCanvas.height = canvas.height;
  const workCtx = workCanvas.getContext('2d');
  if (!workCtx) return found;
  workCtx.drawImage(canvas, 0, 0);

  for (let attempt = 0; attempt < 20; attempt++) {
    const result = scanOne(workCanvas, workCtx);
    if (!result) break;
    if (!found.includes(result.data)) {
      found.push(result.data);
    }
    // Mask the found QR code with white -- use generous padding (50% of QR size)
    // to ensure the finder patterns are fully obliterated
    const padX = Math.max(result.location.w * 0.5, 40);
    const padY = Math.max(result.location.h * 0.5, 40);
    workCtx.fillStyle = '#ffffff';
    workCtx.fillRect(
      result.location.x - padX,
      result.location.y - padY,
      result.location.w + padX * 2,
      result.location.h + padY * 2
    );
  }
  return found;
}

/** Scan a canvas for ALL QR codes, trying at native resolution and 2x upscale. */
function scanAllQRCodes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string[] {
  // Try native resolution first
  const found = scanCanvasForAll(canvas, ctx);

  // Also try 2x upscale to catch small QR codes
  const upCanvas = document.createElement('canvas');
  upCanvas.width = canvas.width * 2;
  upCanvas.height = canvas.height * 2;
  const upCtx = upCanvas.getContext('2d');
  if (upCtx) {
    upCtx.imageSmoothingEnabled = false;
    upCtx.drawImage(canvas, 0, 0, upCanvas.width, upCanvas.height);
    const upFound = scanCanvasForAll(upCanvas, upCtx);
    for (const data of upFound) {
      if (!found.includes(data)) {
        found.push(data);
      }
    }
  }

  return found;
}

export async function scanFromFile(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0);
      resolve(scanAllQRCodes(canvas, ctx));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve([]);
    };
    img.src = objectUrl;
  });
}

export async function scanFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore -- CDN ESM import, no local type declarations
  const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm') as any;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 3 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const pageResults = scanAllQRCodes(canvas, ctx);
    for (const data of pageResults) {
      if (!results.includes(data)) {
        results.push(data);
      }
    }
  }

  return results;
}

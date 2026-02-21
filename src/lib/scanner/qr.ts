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
    } catch {
      this.config.onStatusChange?.('idle');
      this.config.onError?.('Camera access denied');
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

function scanWithUpscale(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string | null {
  // Try native resolution first
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code) return code.data;

  // Fallback: 2x nearest-neighbor upscale
  const upCanvas = document.createElement('canvas');
  upCanvas.width = canvas.width * 2;
  upCanvas.height = canvas.height * 2;
  const upCtx = upCanvas.getContext('2d');
  if (!upCtx) return null;
  upCtx.imageSmoothingEnabled = false;
  upCtx.drawImage(canvas, 0, 0, upCanvas.width, upCanvas.height);
  const upData = upCtx.getImageData(0, 0, upCanvas.width, upCanvas.height);
  const upCode = jsQR(upData.data, upData.width, upData.height);
  return upCode?.data ?? null;
}

export async function scanFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      resolve(scanWithUpscale(canvas, ctx));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
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
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const data = scanWithUpscale(canvas, ctx);
    if (data && !results.includes(data)) {
      results.push(data);
    }
  }

  return results;
}

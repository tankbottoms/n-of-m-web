import QrScanner from 'qr-scanner';
import jsQR from 'jsqr';

export type ScanStatus = 'idle' | 'scanning' | 'detected';

export interface ScannerConfig {
  onScan: (data: string) => boolean;
  onError?: (error: string) => void;
  onStatusChange?: (status: ScanStatus) => void;
  displayCanvas?: HTMLCanvasElement;
}

export class QRScanner {
  private scanner: QrScanner | null = null;
  private config: ScannerConfig;
  private cooldown = false;
  private decodeErrorCount = 0;
  private lastErrorLogTime = 0;
  private fallbackInterval: ReturnType<typeof setInterval> | null = null;
  private fallbackFrameCount = 0;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async start(videoElement: HTMLVideoElement): Promise<void> {
    console.log('[QRScanner] Starting camera, video element:', videoElement);
    this.config.onStatusChange?.('scanning');

    this.scanner = new QrScanner(
      videoElement,
      (result) => {
        console.log('[QRScanner] QR code detected:', result.data);
        if (this.cooldown) {
          console.log('[QRScanner] In cooldown, ignoring');
          return;
        }
        this.cooldown = true;
        this.config.onStatusChange?.('detected');
        const accepted = this.config.onScan(result.data);
        console.log('[QRScanner] onScan callback returned:', accepted);
        setTimeout(() => {
          this.cooldown = false;
          this.config.onStatusChange?.('scanning');
        }, accepted ? 1500 : 500);
      },
      {
        onDecodeError: (error) => {
          this.decodeErrorCount++;
          // Log every 100 frames to show we're getting video data but not finding QR codes
          if (this.decodeErrorCount % 100 === 0) {
            console.log(`[QRScanner] Processed ${this.decodeErrorCount} frames, no QR found. Last error:`, error?.message || error);
          }
        },
        preferredCamera: 'environment',
        maxScansPerSecond: 10,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        returnDetailedScanResult: true,
      }
    );

    try {
      console.log('[QRScanner] Calling scanner.start()');
      await this.scanner.start();
      console.log('[QRScanner] Camera started successfully');
      console.log('[QRScanner] Video element srcObject:', videoElement.srcObject);
      console.log('[QRScanner] Video element readyState:', videoElement.readyState);
      console.log('[QRScanner] Video element paused:', videoElement.paused);
      console.log('[QRScanner] Scanner is running and listening for QR codes...');
      this.decodeErrorCount = 0;
      this.lastErrorLogTime = Date.now();

      // Explicitly ensure video is playing (iOS Safari workaround)
      if (videoElement.paused) {
        console.log('[QRScanner] Video is paused, calling play()');
        await videoElement.play().catch(err => console.log('[QRScanner] play() failed:', err));
      }

      // Video element is hidden by qr-scanner by design
      // Canvas rendering will handle both display and detection
      console.log('[QRScanner] Using canvas for display and detection');

      // Start fallback canvas-based scanning (helps with Safari compatibility issues)
      console.log('[QRScanner] Starting fallback canvas scanning as backup...');
      this.startFallbackCanvasScanning(videoElement);
    } catch (e) {
      console.error('[QRScanner] Start failed:', e);
      this.scanner.destroy();
      this.scanner = null;
      this.config.onStatusChange?.('idle');
      const msg = e instanceof Error ? e.message : 'Camera access denied';
      this.config.onError?.(msg);
      throw e;
    }
  }

  private startFallbackCanvasScanning(videoElement: HTMLVideoElement): void {
    // Fallback for when qr-scanner's zxing doesn't detect codes
    // Renders to display canvas AND scans for QR codes
    const displayCanvas = this.config.displayCanvas;
    let lastScanTime = 0;
    const SCAN_INTERVAL = 200; // Scan for QR every 200ms

    console.log('[QRScanner] Starting fallback canvas scanning');

    this.fallbackInterval = setInterval(() => {
      this.fallbackFrameCount++;

      try {
        // Render to display canvas for smooth visual feedback
        if (displayCanvas && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          displayCanvas.width = videoElement.videoWidth;
          displayCanvas.height = videoElement.videoHeight;
          const ctx = displayCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0);
          }
        }

        // Scan for QR codes periodically
        const now = Date.now();
        if (now - lastScanTime >= SCAN_INTERVAL && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          lastScanTime = now;

          const canvas = document.createElement('canvas');
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(videoElement, 0, 0);
          const codes = scanAllQRCodes(canvas, ctx);
          console.log(`[QRScanner] Scan attempt: found ${codes.length} QR codes`);

          for (const code of codes) {
            if (code && !this.cooldown) {
              console.log('[QRScanner] QR code detected');
              this.cooldown = true;
              this.config.onStatusChange?.('detected');
              const accepted = this.config.onScan(code);
              setTimeout(() => {
                this.cooldown = false;
                this.config.onStatusChange?.('scanning');
              }, accepted ? 1500 : 500);
            }
          }
        }
      } catch (e) {
        console.error('[QRScanner] Scan error:', e);
      }
    }, 75); // Run every 75ms
  }

  stop(): void {
    console.log('[QRScanner] Stopping scanner...');
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
    if (this.scanner) {
      this.scanner.stop();
      this.scanner.destroy();
      this.scanner = null;
      console.log('[QRScanner] Scanner stopped');
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

/** Scan a region of a canvas for a single QR code. */
function scanRegion(
  source: HTMLCanvasElement,
  sx: number, sy: number, sw: number, sh: number
): string | null {
  const tile = document.createElement('canvas');
  tile.width = sw;
  tile.height = sh;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  tctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  const result = scanOne(tile, tctx);
  if (result) return result.data;

  // Retry with 2x upscale for small QR codes
  const up = document.createElement('canvas');
  up.width = sw * 2;
  up.height = sh * 2;
  const uctx = up.getContext('2d');
  if (!uctx) return null;
  uctx.imageSmoothingEnabled = false;
  uctx.drawImage(tile, 0, 0, up.width, up.height);
  const upResult = scanOne(up, uctx);
  return upResult?.data ?? null;
}

/**
 * Scan a canvas for ALL QR codes using a tiled region approach.
 * jsQR struggles to find QR codes in canvases much larger than the code itself,
 * so we split the canvas into overlapping tiles and scan each independently.
 *
 * Optimization: Stop after the first coarse granularity pass if we've found
 * a reasonable number of codes (e.g., 5+) to save 20-30% scanning time.
 */
function scanAllQRCodes(canvas: HTMLCanvasElement, _ctx: CanvasRenderingContext2D): string[] {
  const found: string[] = [];
  const W = canvas.width;
  const H = canvas.height;

  // First try scanning the whole canvas directly (works for single-QR images)
  const wholeResult = scanOne(canvas, _ctx);
  if (wholeResult && !found.includes(wholeResult.data)) {
    found.push(wholeResult.data);
  }

  // Tile the canvas into overlapping regions at multiple granularities.
  // jsQR needs the QR code to be a significant portion of the image.
  // We scan with increasingly fine grids until all codes are found.
  const divisions = [2, 3, 4, 6, 8];
  for (const div of divisions) {
    const stepX = Math.ceil(W / div);
    const stepY = Math.ceil(H / div);
    // Tiles are 2x the step size to create 50% overlap
    const tileW = Math.min(stepX * 2, W);
    const tileH = Math.min(stepY * 2, H);

    for (let y = 0; y < H - 10; y += stepY) {
      for (let x = 0; x < W - 10; x += stepX) {
        const rw = Math.min(tileW, W - x);
        const rh = Math.min(tileH, H - y);
        if (rw < 80 || rh < 80) continue;

        const data = scanRegion(canvas, x, y, rw, rh);
        if (data && !found.includes(data)) {
          found.push(data);
        }
      }
    }

    // Early exit: if we found a reasonable number of codes (5+),
    // skip finer granularities. This saves 20-30% processing time
    // while still finding typical 3-of-5 or 4-of-6 share sets.
    if (found.length >= 5) {
      break;
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

export async function scanFromPDF(file: File, onProgress?: (current: number, total: number, found: number) => void): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore -- CDN ESM import, no local type declarations
  const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm') as any;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: string[] = [];

  // Report initial progress
  onProgress?.(0, pdf.numPages, 0);

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

    // Report progress with found count
    onProgress?.(i, pdf.numPages, results.length);
  }

  return results;
}

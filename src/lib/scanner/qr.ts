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
  private displayFrameId: ReturnType<typeof requestAnimationFrame> | null = null;
  private jsqrFallbackInterval: ReturnType<typeof setInterval> | null = null;

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
      // qr-scanner uses zxing library which runs in Web Worker for efficient detection
      console.log('[QRScanner] Relying on qr-scanner library for QR detection (maxScansPerSecond: 10)');

      // Start simple video display rendering (just drawImage, no QR scanning)
      if (this.config.displayCanvas) {
        console.log('[QRScanner] Starting canvas video display');
        this.startCanvasDisplay(videoElement, this.config.displayCanvas);
      }

      // Start lightweight jsQR fallback (every 2 seconds, simple single-pass scan)
      // This catches QR codes that zxing library misses
      console.log('[QRScanner] Starting lightweight jsQR fallback (every 2s)');
      this.startJsQRFallback(videoElement);

      // DISABLED: Old fallback with expensive multi-granularity tiled scanning
      // The scanAllQRCodes() function is too expensive to run every 500ms on real-time video
      // It caused 5-10 second frame delays. Replaced with lightweight jsQR above.
      // this.startFallbackCanvasScanning(videoElement);
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

  private startCanvasDisplay(videoElement: HTMLVideoElement, displayCanvas: HTMLCanvasElement): void {
    // Simple video display rendering using requestAnimationFrame
    // This runs at ~30fps and just draws video to canvas for UI display
    // No QR scanning here - that's done by the main qr-scanner library
    console.log('[QRScanner] Canvas display started');

    const renderFrame = () => {
      try {
        const ctx = displayCanvas.getContext('2d');
        if (!ctx || videoElement.paused) {
          this.displayFrameId = requestAnimationFrame(renderFrame);
          return;
        }

        // Set canvas size to match video
        if (displayCanvas.width !== videoElement.videoWidth || displayCanvas.height !== videoElement.videoHeight) {
          displayCanvas.width = videoElement.videoWidth || 320;
          displayCanvas.height = videoElement.videoHeight || 240;
        }

        // Draw current video frame to canvas
        ctx.drawImage(videoElement, 0, 0);
      } catch (e) {
        // Silent - video may not be ready yet
      }

      this.displayFrameId = requestAnimationFrame(renderFrame);
    };

    this.displayFrameId = requestAnimationFrame(renderFrame);
  }

  private startJsQRFallback(videoElement: HTMLVideoElement): void {
    // Lightweight jsQR fallback - runs every 2 seconds
    // Single-pass scan to catch QR codes that zxing library misses
    // No expensive tiling/upscaling - just simple detection
    console.log('[QRScanner] jsQR fallback initialized (2s interval)');
    let scanCount = 0;

    this.jsqrFallbackInterval = setInterval(() => {
      try {
        // Skip if video not ready or in cooldown
        if (videoElement.paused || this.cooldown) return;

        scanCount++;

        // Create temporary canvas for this frame
        const w = videoElement.videoWidth || 320;
        const h = videoElement.videoHeight || 240;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw current video frame
        ctx.drawImage(videoElement, 0, 0);

        // Simple single-pass jsQR scan (no tiling, no upscaling)
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h);

        if (code) {
          console.log(`[QRScanner] jsQR fallback detected code on scan #${scanCount}:`, code.data);
          if (!this.cooldown) {
            this.cooldown = true;
            this.config.onStatusChange?.('detected');
            const accepted = this.config.onScan(code.data);
            setTimeout(() => {
              this.cooldown = false;
              this.config.onStatusChange?.('scanning');
            }, accepted ? 1500 : 500);
          }
        }
      } catch (e) {
        // Silent - continue scanning
      }
    }, 2000); // Every 2 seconds
  }

  private startFallbackCanvasScanning(videoElement: HTMLVideoElement): void {
    // Fallback for when qr-scanner's zxing doesn't detect codes
    // ULTRA-MINIMAL: Only scan for QR codes at very low frequency
    // NO display rendering - let browser handle video
    let lastScanTime = 0;
    const SCAN_INTERVAL = 500; // Scan only every 500ms (2 times per second)

    console.log('[QRScanner] Starting fallback QR scanning (minimal)');

    this.fallbackInterval = setInterval(() => {
      this.fallbackFrameCount++;

      try {
        // Scan for QR codes at minimal frequency
        const now = Date.now();
        if (now - lastScanTime >= SCAN_INTERVAL) {
          lastScanTime = now;

          // Use actual video dimensions or fallback
          const w = videoElement.videoWidth || 320;
          const h = videoElement.videoHeight || 240;

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          try {
            ctx.drawImage(videoElement, 0, 0);
          } catch (e) {
            return; // Video not ready, skip
          }

          const codes = scanAllQRCodes(canvas, ctx);

          for (const code of codes) {
            if (code && !this.cooldown) {
              console.log('[QRScanner] QR code detected!');
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
        // Silent
      }
    }, 500); // Run every 500ms
  }

  stop(): void {
    console.log('[QRScanner] Stop called - cleaning up...');
    try {
      if (this.displayFrameId !== null) {
        console.log('[QRScanner] Canceling canvas display frame');
        cancelAnimationFrame(this.displayFrameId);
        this.displayFrameId = null;
      }
      if (this.jsqrFallbackInterval) {
        console.log('[QRScanner] Clearing jsQR fallback interval');
        clearInterval(this.jsqrFallbackInterval);
        this.jsqrFallbackInterval = null;
      }
      if (this.fallbackInterval) {
        console.log('[QRScanner] Clearing old fallback interval');
        clearInterval(this.fallbackInterval);
        this.fallbackInterval = null;
      }
      if (this.scanner) {
        console.log('[QRScanner] Destroying qr-scanner');
        this.scanner.stop();
        this.scanner.destroy();
        this.scanner = null;
      }
    } catch (e) {
      console.error('[QRScanner] Error during stop:', e);
    }
    console.log('[QRScanner] Scanner fully stopped');
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

export async function scanFromDataURI(dataURI: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0);
      resolve(scanAllQRCodes(canvas, ctx));
    };
    img.onerror = () => resolve([]);
    img.src = dataURI;
  });
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

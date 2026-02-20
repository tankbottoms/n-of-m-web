import jsQR from 'jsqr';

export interface ScannerConfig {
  onScan: (data: string) => boolean;
  onError?: (error: string) => void;
}

export class QRScanner {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private stream: MediaStream | null = null;
  private config: ScannerConfig;
  private cooldown = false;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async start(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<void> {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      this.scan();
    } catch {
      this.config.onError?.('Camera access denied');
    }
  }

  private scan(): void {
    if (!this.video || !this.canvas || !this.ctx) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(this.video, 0, 0);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && !this.cooldown) {
        this.cooldown = true;
        const accepted = this.config.onScan(code.data);
        setTimeout(() => {
          this.cooldown = false;
        }, accepted ? 1500 : 500);
      }
    }

    this.animationId = requestAnimationFrame(() => this.scan());
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

export async function scanFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      resolve(code?.data ?? null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

declare module 'qrious' {
  interface QRiousOptions {
    element?: HTMLCanvasElement;
    value?: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    padding?: number;
    background?: string;
    foreground?: string;
  }
  export default class QRious {
    constructor(options?: QRiousOptions);
    toDataURL(type?: string): string;
  }
}

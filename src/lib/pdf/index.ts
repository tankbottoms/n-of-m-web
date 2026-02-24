import type { SharePayload, DerivedAddress } from '../types';
import { renderPageHTML } from './templates';
import { LAYOUTS } from './layouts';
import type { LayoutType } from './layouts';

export { LAYOUTS } from './layouts';
export type { LayoutType, LayoutConfig } from './layouts';

export function datetimeStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function ensureQRious(): Promise<void> {
  if ((window as any).QRious) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function renderQRDataURI(data: string, size: number): string {
  try {
    if ((window as any).QRious) {
      const canvas = document.createElement('canvas');
      // Render at higher resolution for sharp output; CSS scales to display size
      const renderSize = Math.max(size * 2, 500);
      new (window as any).QRious({ element: canvas, value: data, size: renderSize, level: 'H', padding: 0 });
      return canvas.toDataURL('image/png');
    }
  } catch {}
  return '';
}

export function generatePrintHTML(
  shares: SharePayload[],
  highlightColor: string,
  layoutType: LayoutType = 'full-page',
  addresses: DerivedAddress[] = [],
  prerender: boolean = true
): string {
  const layout = LAYOUTS[layoutType];
  const qrDatas = shares.map((s) => JSON.stringify(s));
  const qrImages = prerender ? qrDatas.map((d) => renderQRDataURI(d, layout.qrSize)) : [];
  return renderPageHTML(shares, qrDatas, highlightColor, layout, addresses, qrImages);
}

export function printCards(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1100px';
  iframe.style.height = '850px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPDF(html: string, filename: string): Promise<void> {
  try {
    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.createElement('div');
    element.innerHTML = html;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(element).save();
  } catch (e) {
    console.error('[PDF] Failed to generate PDF:', e);
    throw new Error('Failed to generate PDF');
  }
}

export function generateAllLayoutsHTML(
  shares: import('../types').SharePayload[],
  highlightColor: string,
  addresses: import('../types').DerivedAddress[] = [],
  prerender: boolean = true
): string {
  // Generate HTML for full-page layout (only layout supported)
  return generatePrintHTML(shares, highlightColor, 'full-page', addresses, prerender);
}

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
  // Generate HTML for both layouts in a single document
  const layouts: Array<import('./layouts').LayoutType> = ['full-page', '2-up'];
  const sections = layouts.map(layoutType => {
    const html = generatePrintHTML(shares, highlightColor, layoutType, addresses, prerender);
    // Extract body content
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    return bodyMatch ? bodyMatch[1] : '';
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 10mm; size: portrait; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; font-size: 11px; line-height: 1.4; }
  .page { page-break-after: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }
  .page > .card { flex: 1; display: flex; flex-direction: column; }
  .compact-page { gap: 10mm; justify-content: flex-start; }
  .compact-page > .card { flex: 0 0 auto; max-height: 45%; overflow: hidden; }
  .card { border: 3px solid #000; box-shadow: 4px 4px 0 #000; display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .header { padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #000; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .bottom-section { display: flex; flex-direction: row; gap: 12px; flex: 1; align-items: flex-start; }
  .share-qr { border: 2px solid #000; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .share-qr canvas { display: block; }
  .share-qr img { display: block; image-rendering: pixelated; }
  .footer { padding: 6px 12px; border-top: 3px solid #000; background: #f5f5f5; flex-shrink: 0; }
  @media screen {
    body { background: #f0f0f0; padding: 2em 0; }
    .page { page-break-after: auto; min-height: auto; width: 50%; margin: 0 auto; gap: 2em; }
    .page > .card { flex: none; box-shadow: 6px 6px 0 rgba(0,0,0,0.2); margin-bottom: 2em; }
  }
</style>
</head>
<body>
${sections.join('\n')}
</body>
</html>`;
}

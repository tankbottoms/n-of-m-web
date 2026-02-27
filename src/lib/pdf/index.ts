import type { SharePayload, DerivedAddress } from '../types';
import { renderPageHTML } from './templates';
import { LAYOUTS } from './layouts';
import type { LayoutType } from './layouts';
import QRious from 'qrious';

export { LAYOUTS } from './layouts';
export type { LayoutType, LayoutConfig } from './layouts';

export function datetimeStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function renderQRDataURI(data: string, size: number): string {
  try {
    const canvas = document.createElement('canvas');
    const renderSize = Math.max(size * 2, 500);
    new QRious({ element: canvas, value: data, size: renderSize, level: 'H', padding: 0 });
    return canvas.toDataURL('image/png');
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
  // Use bundled html2canvas + jsPDF (no CDN, no iframe cross-document issues).
  // Inject HTML via innerHTML (browser preserves <style> from <head>), add CSS
  // overrides to counter @media screen rules, capture each .page individually.
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('script').forEach(s => s.remove());

  // Override @media screen styles that break PDF rendering:
  // - .page width: 50% → 100%
  // - page-break-after: auto → always
  // - card flex: none → 1 (fill page)
  const overrideStyle = document.createElement('style');
  overrideStyle.textContent = `
    .page { width: 100% !important; margin: 0 !important; min-height: auto !important;
            padding-top: 1cm !important; page-break-after: always !important; }
    .page:first-child { padding-top: 0 !important; }
    .page:last-child { page-break-after: auto !important; }
    .page > .card { flex: 1 !important; }
  `;
  container.appendChild(overrideStyle);

  // Apply body-level styles (CSS body selectors won't match a div)
  container.style.fontFamily = "'Courier New', monospace";
  container.style.color = '#000';
  container.style.lineHeight = '1.4';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    // Allow layout to compute
    await new Promise(r => setTimeout(r, 100));

    const pages = container.querySelectorAll('.page');
    if (pages.length === 0) throw new Error('No .page elements found in HTML');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentW = pdfW - margin * 2;
    const contentH = pdfH - margin * 2;

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();

      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        windowWidth: 816,
      });

      const imgData = canvas.toDataURL('image/png');
      const ratio = canvas.width / canvas.height;
      let imgW = contentW;
      let imgH = imgW / ratio;
      if (imgH > contentH) {
        imgH = contentH;
        imgW = imgH * ratio;
      }

      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
    }

    pdf.save(filename);
    document.body.removeChild(container);
  } catch (e) {
    console.error('[PDF] Failed to generate PDF:', e);
    if (container.parentNode) document.body.removeChild(container);
    throw new Error('Failed to generate PDF: ' + (e instanceof Error ? e.message : String(e)));
  }
}

export async function downloadHTMLAsImage(html: string, filename: string): Promise<void> {
  try {
    const { default: html2canvas } = await import('html2canvas');

    const element = document.createElement('div');
    element.innerHTML = html;
    // Use position:absolute — position:fixed at -9999px causes html2canvas to clip
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '816px'; // 8.5in at 96dpi
    element.style.height = 'auto';
    element.style.background = 'white';
    element.style.padding = '40px';
    document.body.appendChild(element);

    // Allow layout to compute
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 816,
    });

    document.body.removeChild(element);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  } catch (e) {
    console.error('[HTML2Image] Failed to generate image:', e);
    throw new Error('Failed to generate image');
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

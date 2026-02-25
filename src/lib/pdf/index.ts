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
  // Render HTML in an iframe so the full document (including <style> and @page)
  // parses correctly. Then capture each .page element individually with html2canvas
  // and compose a multi-page PDF with jsPDF. This avoids the @media screen overrides
  // that break pagination when rendering via innerHTML in a div.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '816px';
  iframe.style.height = '1056px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';

  return new Promise<void>((resolve, reject) => {
    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc?.body) throw new Error('Cannot access iframe document');

        // Inject print-like overrides so pages render full-width (not 50% from @media screen)
        const style = iframeDoc.createElement('style');
        style.textContent = `
          body { background: white !important; padding: 0 !important; }
          .page { page-break-after: auto !important; min-height: auto !important;
                   width: 100% !important; margin: 0 !important; padding-top: 0 !important; }
          .page > .card { flex: none !important; }
        `;
        iframeDoc.head.appendChild(style);

        const pages = iframeDoc.querySelectorAll('.page');
        if (pages.length === 0) throw new Error('No .page elements found in HTML');

        const { default: html2canvas } = await import('html2canvas');
        const { jsPDF } = await import('jspdf');

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const margin = 10; // mm
        const contentW = pdfW - margin * 2;
        const contentH = pdfH - margin * 2;

        for (let i = 0; i < pages.length; i++) {
          if (i > 0) pdf.addPage();

          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2,
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
        document.body.removeChild(iframe);
        resolve();
      } catch (e) {
        console.error('[PDF] Failed to generate PDF:', e);
        if (iframe.parentNode) document.body.removeChild(iframe);
        reject(new Error('Failed to generate PDF: ' + (e instanceof Error ? e.message : String(e))));
      }
    };

    iframe.onerror = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
      reject(new Error('Failed to load PDF iframe'));
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

export async function downloadHTMLAsImage(html: string, filename: string): Promise<void> {
  try {
    const { default: html2canvas } = await import('html2canvas');

    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '816px'; // 8.5in at 96dpi
    element.style.height = 'auto';
    element.style.background = 'white';
    element.style.padding = '40px';
    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
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

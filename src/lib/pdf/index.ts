import type { SharePayload } from '../types';
import { renderPageHTML } from './templates';
import { LAYOUTS } from './layouts';
import type { LayoutType } from './layouts';

export { LAYOUTS } from './layouts';
export type { LayoutType, LayoutConfig } from './layouts';

export function generatePrintHTML(
  shares: SharePayload[],
  highlightColor: string,
  layoutType: LayoutType = 'full-page',
  firstAddress?: string
): string {
  const layout = LAYOUTS[layoutType];
  const qrDatas = shares.map((s) => JSON.stringify(s));
  return renderPageHTML(shares, qrDatas, highlightColor, layout, firstAddress);
}

export function printCards(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
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

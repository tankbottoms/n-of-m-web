import type { SharePayload, DerivedAddress } from '../types';
import type { LayoutConfig } from './layouts';

export function renderCardHTML(
  share: SharePayload,
  qrData: string,
  highlightColor: string,
  layout: LayoutConfig,
  cardId: string,
  addresses: DerivedAddress[] = [],
  qrImageSrc: string = ''
): string {
  const now = new Date();
  const date = now.toISOString().replace('T', ' ').slice(0, 16);

  const pinInfo = share.hasPIN ? 'Pin: enabled' : 'Pin: none';
  const ppInfo = share.hasPassphrase ? 'Passphrase: enabled' : 'Passphrase: none';
  const isCompact = layout.cardsPerPage >= 2;
  const isWallet = layout.cardsPerPage >= 4;

  const maxAddrs = isWallet ? 3 : isCompact ? 5 : addresses.length;
  const displayAddrs = addresses.slice(0, maxAddrs);
  const addressesHTML = addresses.length > 0 ? `
    <div class="addresses-section">
      <div class="section-label">DERIVATION</div>
      <span class="derivation-path">${escapeHTML(share.derivationPath)}</span>
      <div class="addr-list">
        ${displayAddrs.map(a => `<div class="addr-item"><span class="addr-idx">${a.index}</span><span class="addr-val">${escapeHTML(a.address)}</span></div>`).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="card">
      <div class="header" style="background:${highlightColor};">
        <span class="header-title">${share.shareIndex}/${share.totalShares} SHAMIR</span>
        <span class="header-meta">T:${share.threshold} &middot; ${share.wordCount}W &middot; V2</span>
      </div>
      <div class="section">
        <div class="section-label">INSTRUCTIONS</div>
        <div class="instructions-text">
          <p>This card is one fragment of a secret divided using
          <b>Shamir&rsquo;s Secret Sharing</b>. By itself this card
          reveals <b>nothing</b> about the original secret.</p>
          <p>To reconstruct the secret, collect and scan
          <b>at least ${share.threshold} of the ${share.totalShares} total share cards</b>
          using the Shamir recovery app.</p>
          ${!isCompact ? `
          <p>During recovery you <u>may need to provide a PIN</u>.
          You <u>may also be asked additional questions</u> about
          your secret&rsquo;s configuration.</p>
          <p><b>Do not store all shares in the same location.</b>
          Each share should be kept <b>secure and separate</b>.</p>
          ` : ''}
        </div>
      </div>
      <div class="section date-row">
        <div class="section-label">CREATED</div>
        <span class="date-value">${date}</span>
      </div>
      ${!isCompact ? `
      <div class="section notes-section">
        <div class="section-label">NOTES</div>
        <div class="note-line"></div>
        <div class="note-line"></div>
        <div class="note-line"></div>
        <div class="note-line"></div>
      </div>
      ` : ''}
      <div class="section bottom-section">
        <div class="share-qr">
          ${qrImageSrc
            ? `<img src="${qrImageSrc}" style="width:${layout.qrSize}px;height:${layout.qrSize}px;" />`
            : `<canvas id="qr-${cardId}" width="${layout.qrSize}" height="${layout.qrSize}"></canvas>`}
        </div>
        <div class="bottom-right">
          <div class="qr-info-top">
            <p>This QR code contains your encrypted share data.
            Scan it with the Shamir recovery app to begin the
            reconstruction process. You will need to scan at
            least <b>${share.threshold}&nbsp;cards</b> total.</p>
          </div>
          ${!isCompact ? `
          <div class="qr-info-bottom">
            <p><b>Handle with care.</b> If this card is lost or
            damaged you will need the remaining shares to recover
            your secret. <b>There are no backups.</b></p>
          </div>
          ` : ''}
          ${addressesHTML}
        </div>
      </div>
      <div class="footer">
        <div class="footer-warning">
          &#9888; Do not lose this card &mdash; Share ${share.shareIndex}
          of ${share.totalShares}. Need ${share.threshold}+ to recover.
        </div>
        <div class="footer-info">${pinInfo} &middot; ${ppInfo}</div>
        <div class="footer-guid">${share.id}</div>
      </div>
    </div>
  `;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderPageHTML(
  shares: SharePayload[],
  qrDatas: string[],
  highlightColor: string,
  layout: LayoutConfig,
  addresses: import('../types').DerivedAddress[] = [],
  qrImages: string[] = []
): string {
  let pages: string[];

  const hasImages = qrImages.length > 0 && qrImages.every(img => img.length > 0);

  if (layout.cardsPerPage === 4) {
    // Wallet size: 4 cards per page
    pages = [];
    for (let i = 0; i < shares.length; i += 4) {
      const batch = shares.slice(i, i + 4);
      const cards = batch.map((share, j) =>
        renderCardHTML(share, qrDatas[i + j], highlightColor, layout, `card-${i + j}`, addresses, hasImages ? qrImages[i + j] : '')
      ).join('\n');
      pages.push(`<div class="page wallet-page">${cards}</div>`);
    }
  } else if (layout.cardsPerPage === 2) {
    // Compact: 2 cards per page
    pages = [];
    for (let i = 0; i < shares.length; i += 2) {
      const card1 = renderCardHTML(shares[i], qrDatas[i], highlightColor, layout, `card-${i}`, addresses, hasImages ? qrImages[i] : '');
      const card2 = i + 1 < shares.length
        ? renderCardHTML(shares[i + 1], qrDatas[i + 1], highlightColor, layout, `card-${i + 1}`, addresses, hasImages ? qrImages[i + 1] : '')
        : '';
      pages.push(`<div class="page compact-page">${card1}\n${card2}</div>`);
    }
  } else {
    // Full page: 1 card per page
    pages = shares.map((share, i) => {
      const card = renderCardHTML(share, qrDatas[i], highlightColor, layout, `card-${i}`, addresses, hasImages ? qrImages[i] : '');
      return `<div class="page">${card}</div>`;
    });
  }

  // Only include QRious CDN script when images aren't pre-rendered (downloadable HTML)
  const needsScript = !hasImages;
  const qrScripts = needsScript
    ? shares
        .map(
          (_, i) => `
    new QRious({
      element: document.getElementById('qr-card-${i}'),
      value: ${JSON.stringify(qrDatas[i])},
      size: ${layout.qrSize},
      level: 'H'
    });
  `
        )
        .join('\n')
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${needsScript ? `<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></${''}script>` : ''}
<style>
  @page { margin: 10mm; size: portrait; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; font-size: ${layout.fontSize}px; line-height: 1.4; }

  /* Page container */
  .page { page-break-after: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }

  /* Full page: card fills the page */
  .page > .card { flex: 1; display: flex; flex-direction: column; }

  /* Compact: 2 cards per page with 1cm gap */
  .compact-page { gap: 10mm; justify-content: flex-start; }
  .compact-page > .card { flex: 0 0 auto; max-height: 45%; overflow: hidden; }

  /* Wallet: 4 cards per page, stacked */
  .wallet-page { height: 100vh; gap: 3em; justify-content: flex-start; }
  .wallet-page > .card { flex: 0 0 auto; overflow: hidden; }
  .wallet-page .card { border-width: 1.5px; box-shadow: none; }
  .wallet-page .header { padding: 2px 6px; font-size: 8px; border-bottom-width: 1.5px; }
  .wallet-page .header-title { font-size: 9px; }
  .wallet-page .header-meta { font-size: 6px; }
  .wallet-page .section { padding: 2px 6px; border-bottom-width: 1px; }
  .wallet-page .section-label { font-size: 5px; letter-spacing: 1px; margin-bottom: 1px; }
  .wallet-page .instructions-text { font-size: ${layout.fontSize - 1}px; line-height: 1.2; }
  .wallet-page .instructions-text p { margin-bottom: 1px; }
  .wallet-page .date-row { padding: 1px 6px; gap: 6px; }
  .wallet-page .date-value { font-size: ${layout.fontSize}px; }
  .wallet-page .bottom-section { gap: 6px; padding: 2px 6px; }
  .wallet-page .share-qr { border-width: 1px; padding: 2px; }
  .wallet-page .qr-info-top, .wallet-page .qr-info-bottom { font-size: ${Math.max(layout.fontSize - 2, 5)}px; line-height: 1.2; }
  .wallet-page .qr-info-top { margin-bottom: 2px; }
  .wallet-page .addresses-section .section-label { font-size: 5px; }
  .wallet-page .derivation-path { font-size: ${layout.fontSize - 1}px; margin-bottom: 1px; }
  .wallet-page .addr-item { font-size: ${Math.max(layout.fontSize - 2, 5)}px; line-height: 1.1; }
  .wallet-page .footer { padding: 2px 6px; border-top-width: 1.5px; }
  .wallet-page .footer-warning { font-size: 6px; margin-bottom: 1px; }
  .wallet-page .footer-info { font-size: 5px; margin-bottom: 1px; }
  .wallet-page .footer-guid { font-size: 5px; }

  /* Card base */
  .card { border: 3px solid #000; box-shadow: 4px 4px 0 #000; display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .header { padding: 6px 12px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #000; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .header-title { font-size: 13px; }
  .header-meta { font-size: 9px; letter-spacing: 0.5px; opacity: 0.7; }
  .section { padding: 8px 12px; border-bottom: 2px solid #000; flex-shrink: 0; }
  .section-label { font-weight: bold; font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px; }
  .instructions-text { font-size: ${layout.fontSize - 0.5}px; line-height: 1.5; }
  .instructions-text p { margin-bottom: 4px; }
  .date-row { display: flex; flex-direction: row; align-items: center; gap: 12px; padding: 5px 12px; }
  .date-row .section-label { margin-bottom: 0; }
  .date-value { font-family: 'Courier New', monospace; font-size: ${layout.fontSize + 1}px; font-weight: bold; }
  .notes-section { min-height: 60px; }
  .note-line { border-bottom: 1px solid #ccc; height: 16px; width: 100%; }

  /* Bottom section: QR + info side by side, stretches to fill remaining card space */
  .bottom-section { display: flex; flex-direction: row; gap: 12px; flex: 1; align-items: flex-start; }
  .share-qr { border: 2px solid #000; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: ${layout.qrSize + 12}px; height: ${layout.qrSize + 12}px; }
  .share-qr canvas { display: block; }
  .share-qr img { display: block; image-rendering: pixelated; }
  .bottom-right { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .qr-info-top, .qr-info-bottom { font-size: ${layout.fontSize - 1}px; line-height: 1.4; }
  .qr-info-top { margin-bottom: 4px; }
  .qr-info-bottom { margin-bottom: 4px; }

  .addresses-section { margin-top: auto; }
  .derivation-path { font-size: ${layout.fontSize}px; font-weight: bold; margin-bottom: 4px; display: block; }
  .addr-list { display: flex; flex-direction: column; gap: 1px; }
  .addr-item { display: flex; gap: 4px; font-size: ${Math.max(layout.fontSize - 2, 6)}px; line-height: 1.3; }
  .addr-idx { color: #666; font-weight: bold; min-width: 12px; text-align: right; flex-shrink: 0; }
  .addr-val { word-break: break-all; }

  .footer { padding: 6px 12px; border-top: 3px solid #000; background: #f5f5f5; flex-shrink: 0; }
  .footer-warning { font-size: 8px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.5; margin-bottom: 2px; }
  .footer-info { font-size: 8px; font-weight: bold; letter-spacing: 0.5px; color: #666; margin-bottom: 2px; }
  .footer-guid { font-size: 7px; font-family: 'Courier New', monospace; color: #666; text-align: right; letter-spacing: 0.5px; }

  /* Screen preview */
  @media screen {
    body { background: #f0f0f0; padding: 2em 0; }
    .page { page-break-after: auto; min-height: auto; width: 50%; margin: 0 auto; gap: 2em; }
    .page > .card { flex: none; box-shadow: 6px 6px 0 rgba(0,0,0,0.2); margin-bottom: 2em; }
    .page > .card:last-child { margin-bottom: 0; }
    .compact-page > .card { max-height: none; margin-bottom: 2em; }
    .compact-page > .card:last-child { margin-bottom: 0; }
    .wallet-page > .card { max-height: none; margin-bottom: 2em; }
    .wallet-page > .card:last-child { margin-bottom: 0; }
  }
</style>
</head>
<body>
${pages.join('\n')}
${qrScripts ? `<script>\n${qrScripts}\n</${''}script>` : ''}
</body>
</html>`;
}

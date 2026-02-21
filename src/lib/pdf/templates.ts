import type { SharePayload, DerivedAddress } from '../types';
import type { LayoutConfig } from './layouts';

export function renderCardHTML(
  share: SharePayload,
  qrData: string,
  highlightColor: string,
  layout: LayoutConfig,
  cardId: string,
  addresses: DerivedAddress[] = []
): string {
  const now = new Date();
  const date = now.toISOString().replace('T', ' ').slice(0, 16);

  const pinInfo = share.hasPIN ? 'PIN: ENABLED' : 'PIN: NONE';
  const ppInfo = share.hasPassphrase ? 'PASSPHRASE: ENABLED' : 'PASSPHRASE: NONE';
  const isCompact = layout.cardsPerPage >= 2;
  const isWallet = layout.cardsPerPage >= 4;

  const addressesHTML = addresses.length > 0 ? `
    <div class="addresses-section">
      <div class="section-label">DERIVATION</div>
      <span class="derivation-path">${escapeHTML(share.derivationPath)}</span>
      ${!isWallet ? `
      <div class="addr-list">
        ${addresses.map(a => `<div class="addr-item"><span class="addr-idx">${a.index}</span><span class="addr-val">${escapeHTML(a.address)}</span></div>`).join('')}
      </div>
      ` : `
      <div class="addr-list">
        ${addresses.slice(0, 2).map(a => `<div class="addr-item"><span class="addr-idx">${a.index}</span><span class="addr-val">${escapeHTML(a.address)}</span></div>`).join('')}
      </div>
      `}
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
          <canvas id="qr-${cardId}" width="${layout.qrSize}" height="${layout.qrSize}"></canvas>
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
          &#9888; DO NOT LOSE THIS CARD &mdash; SHARE ${share.shareIndex}
          OF ${share.totalShares}. NEED ${share.threshold}+ TO RECOVER.
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
  addresses: import('../types').DerivedAddress[] = []
): string {
  let pages: string[];

  if (layout.cardsPerPage === 4) {
    // Wallet size: 4 cards per page
    pages = [];
    for (let i = 0; i < shares.length; i += 4) {
      const batch = shares.slice(i, i + 4);
      const cards = batch.map((share, j) =>
        renderCardHTML(share, qrDatas[i + j], highlightColor, layout, `card-${i + j}`, addresses)
      ).join('\n');
      pages.push(`<div class="page wallet-page">${cards}</div>`);
    }
  } else if (layout.cardsPerPage === 2) {
    // Compact: 2 cards per page
    pages = [];
    for (let i = 0; i < shares.length; i += 2) {
      const card1 = renderCardHTML(shares[i], qrDatas[i], highlightColor, layout, `card-${i}`, addresses);
      const card2 = i + 1 < shares.length
        ? renderCardHTML(shares[i + 1], qrDatas[i + 1], highlightColor, layout, `card-${i + 1}`, addresses)
        : '';
      pages.push(`<div class="page compact-page">${card1}\n${card2}</div>`);
    }
  } else {
    // Full page: 1 card per page
    pages = shares.map((share, i) => {
      const card = renderCardHTML(share, qrDatas[i], highlightColor, layout, `card-${i}`, addresses);
      return `<div class="page">${card}</div>`;
    });
  }

  const qrScripts = shares
    .map(
      (_, i) => `
    new QRious({
      element: document.getElementById('qr-card-${i}'),
      value: ${JSON.stringify(qrDatas[i])},
      size: ${layout.qrSize},
      level: 'M'
    });
  `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"><\/script>
<style>
  @page { margin: 10mm; size: portrait; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; font-size: ${layout.fontSize}px; line-height: 1.4; }
  .page { page-break-after: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }

  /* Full page: card fills the page */
  .page > .card { flex: 1; display: flex; flex-direction: column; }

  /* Compact: 2 cards per page with 1cm gap */
  .compact-page { gap: 10mm; justify-content: flex-start; }
  .compact-page > .card { flex: 0 0 auto; max-height: 45%; overflow: hidden; }

  /* Wallet: 4 cards, each ~24% of page, no partial spanning */
  .wallet-page { gap: 6px; justify-content: flex-start; }
  .wallet-page > .card { flex: 0 0 auto; max-height: 23.5%; overflow: hidden; }
  .wallet-page .instructions-text { font-size: ${layout.fontSize - 1}px; }

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
  .bottom-section { display: flex; flex-direction: row; gap: 12px; flex: 1; align-items: stretch; }
  .share-qr { border: 2px solid #000; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .share-qr canvas { display: block; }
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
  .footer-warning { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.5; margin-bottom: 2px; }
  .footer-info { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 2px; }
  .footer-guid { font-size: 7px; font-family: 'Courier New', monospace; color: #666; text-align: right; letter-spacing: 0.5px; }

  /* Screen view: cards at 50% width, centered, with 10em spacing */
  @media screen {
    body { background: #f0f0f0; padding: 2em 0; }
    .page { page-break-after: auto; min-height: auto; width: 50%; margin: 0 auto; gap: 10em; }
    .page > .card { box-shadow: 6px 6px 0 rgba(0,0,0,0.2); margin-bottom: 10em; }
    .page > .card:last-child { margin-bottom: 0; }
    .compact-page > .card { max-height: none; margin-bottom: 10em; }
    .compact-page > .card:last-child { margin-bottom: 0; }
    .wallet-page > .card { max-height: none; margin-bottom: 10em; }
    .wallet-page > .card:last-child { margin-bottom: 0; }
  }
</style>
</head>
<body>
${pages.join('\n')}
<script>
${qrScripts}
<\/script>
</body>
</html>`;
}

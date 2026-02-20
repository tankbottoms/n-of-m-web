<script lang="ts">
  import type { SharePayload } from '$lib/types';

  let { share, highlightColor = '#A8D8EA', firstAddress = '' }: {
    share: SharePayload;
    highlightColor?: string;
    firstAddress?: string;
  } = $props();

  let pinInfo = $derived(share.hasPIN ? 'PIN: ENABLED' : 'PIN: NONE');
  let ppInfo = $derived(share.hasPassphrase ? 'PASSPHRASE: ENABLED' : 'PASSPHRASE: NONE');
  let date = $derived(new Date().toISOString().replace('T', ' ').slice(0, 16));

  let shareQrSrc = $state('');
  let addrQrSrc = $state('');

  function renderQR(data: string, size: number): string {
    if (!data) return '';
    try {
      if ((window as any).QRious) {
        const canvas = document.createElement('canvas');
        new (window as any).QRious({ element: canvas, value: data, size, level: 'M', padding: 0 });
        return canvas.toDataURL('image/png');
      }
    } catch {}
    return '';
  }

  function generateQRs() {
    shareQrSrc = renderQR(JSON.stringify(share), 400);
    if (firstAddress) {
      addrQrSrc = renderQR(firstAddress, 200);
    }
  }

  $effect(() => {
    if ((window as any).QRious) {
      generateQRs();
    }
  });

  // Load QRious if not already loaded
  $effect(() => {
    if (!(window as any).QRious) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
      s.onload = () => generateQRs();
      document.head.appendChild(s);
    }
  });
</script>

<div class="share-card">
  <div class="card-header" style="background: {highlightColor};">
    <span class="card-title">{share.shareIndex}/{share.totalShares} SHAMIR</span>
    <span class="card-meta">T:{share.threshold} · {share.wordCount}W · V2</span>
  </div>

  <div class="card-section">
    <div class="section-label">INSTRUCTIONS</div>
    <div class="instructions">
      <p>This card is one fragment of a secret divided using
      <b>Shamir's Secret Sharing</b>. By itself this card
      reveals <b>nothing</b> about the original secret.</p>
      <p>To reconstruct the secret, collect and scan
      <b>at least {share.threshold} of the {share.totalShares} total share cards</b>.</p>
    </div>
  </div>

  <div class="card-section card-date">
    <span class="section-label">CREATED</span>
    <span class="date-value">{date}</span>
  </div>

  <div class="card-section card-qr-section">
    <div class="share-qr-box">
      {#if shareQrSrc}
        <img src={shareQrSrc} alt="Share QR Code" />
      {/if}
    </div>
    <div class="qr-right">
      <p class="qr-help">This QR code contains your encrypted share data.
      Scan it with the recovery app. You need at least <b>{share.threshold} cards</b> total.</p>
      {#if firstAddress}
        <div class="address-row">
          <div class="addr-qr-box">
            {#if addrQrSrc}
              <img src={addrQrSrc} alt="Address QR Code" />
            {/if}
          </div>
          <div class="addr-info">
            <span class="addr-label">PRIMARY ADDRESS</span>
            <span class="addr-value">{firstAddress}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="card-footer">
    <div class="footer-warning">
      &#9888; DO NOT LOSE THIS CARD — SHARE {share.shareIndex}
      OF {share.totalShares}. NEED {share.threshold}+ TO RECOVER.
    </div>
    <div class="footer-info">{pinInfo} · {ppInfo}</div>
    <div class="footer-guid">{share.id}</div>
  </div>
</div>

<style>
  .share-card {
    border: 3px solid var(--color-border-dark);
    box-shadow: 4px 4px 0px var(--color-shadow);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    width: 100%;
  }
  .card-header {
    padding: 0.5rem 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 3px solid var(--color-border-dark);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #000;
  }
  .card-title { font-size: 0.85rem; }
  .card-meta { font-size: 0.65rem; opacity: 0.7; }
  .card-section {
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-border-dark);
  }
  .section-label {
    font-weight: bold;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
  }
  .instructions {
    font-size: 0.7rem;
    line-height: 1.5;
  }
  .instructions p { margin-bottom: 0.25rem; }
  .card-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .card-date .section-label { margin-bottom: 0; }
  .date-value { font-weight: bold; font-size: 0.75rem; }

  .card-qr-section {
    display: flex;
    gap: 0.75rem;
    align-items: stretch;
  }
  .share-qr-box {
    border: 2px solid var(--color-border-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 180px;
    height: 180px;
    overflow: hidden;
  }
  .share-qr-box img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .qr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .qr-help {
    font-size: 0.65rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }
  .address-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: auto;
  }
  .addr-qr-box {
    border: 1px solid var(--color-border-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 90px;
    height: 90px;
    overflow: hidden;
  }
  .addr-qr-box img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .addr-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .addr-label {
    font-size: 0.5rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-text-muted);
  }
  .addr-value {
    font-size: 0.6rem;
    word-break: break-all;
  }

  .card-footer {
    padding: 0.5rem 0.75rem;
    border-top: 3px solid var(--color-border-dark);
    background: var(--color-bg-alt);
  }
  .footer-warning {
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.15rem;
  }
  .footer-info {
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 0.15rem;
  }
  .footer-guid {
    font-size: 0.55rem;
    color: var(--color-text-muted);
    text-align: right;
  }
</style>

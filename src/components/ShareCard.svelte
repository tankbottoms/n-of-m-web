<script lang="ts">
  import type { SharePayload, DerivedAddress } from '$lib/types';

  let { share, highlightColor = '#A8D8EA', addresses = [] }: {
    share: SharePayload;
    highlightColor?: string;
    addresses?: DerivedAddress[];
  } = $props();

  let pinInfo = $derived(share.hasPIN ? 'Pin: enabled' : 'Pin: none');
  let ppInfo = $derived(share.hasPassphrase ? 'Passphrase: enabled' : 'Passphrase: none');
  let date = $derived(new Date().toISOString().replace('T', ' ').slice(0, 16));

  let shareQrSrc = $state('');

  function renderQR(data: string, size: number): string {
    if (!data) return '';
    try {
      if ((window as any).QRious) {
        const canvas = document.createElement('canvas');
        new (window as any).QRious({ element: canvas, value: data, size, level: 'H', padding: 0 });
        return canvas.toDataURL('image/png');
      }
    } catch {}
    return '';
  }

  function generateQRs() {
    shareQrSrc = renderQR(JSON.stringify(share), 800);
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
      {#if addresses.length > 0}
        <div class="addresses-section">
          <span class="section-label">DERIVATION PATH</span>
          <span class="derivation-path">{share.derivationPath}</span>
          <span class="section-label addr-label-top">ADDRESSES</span>
          <div class="addr-list">
            {#each addresses as addr}
              <div class="addr-item">
                <span class="addr-index">{addr.index}</span>
                <span class="addr-value">{addr.address}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="card-footer">
    <div class="footer-warning">
      &#9888; Do not lose this card — Share {share.shareIndex}
      of {share.totalShares}. Need {share.threshold}+ to recover.
    </div>
    <div class="footer-info">{pinInfo} · {ppInfo}</div>
    <div class="footer-bottom">
      <span class="footer-guid">{share.id}</span>
      <span class="footer-app">n-of-m.vercel.app · v0.1.0</span>
    </div>
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
    align-items: center;
  }
  .share-qr-box {
    border: 2px solid var(--color-border-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 204px;
    height: 204px;
  }
  .share-qr-box img {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  @media (max-width: 600px) {
    .card-qr-section {
      flex-direction: column;
      align-items: center;
    }
    .share-qr-box img {
      width: 170px;
      height: 170px;
    }
    .qr-right {
      text-align: center;
    }
  }
  .qr-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
  .qr-help {
    font-size: 0.65rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .addresses-section {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .derivation-path {
    font-size: 0.65rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .addr-label-top {
    margin-top: 0.25rem;
  }
  .addr-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .addr-item {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 0.55rem;
    line-height: 1.4;
  }
  .addr-index {
    color: var(--color-text-muted);
    font-weight: 600;
    min-width: 1.2em;
    text-align: right;
    flex-shrink: 0;
  }
  .addr-value {
    word-break: break-all;
    color: var(--color-text);
  }

  .card-footer {
    padding: 0.5rem 0.75rem;
    border-top: 3px solid var(--color-border-dark);
    background: var(--color-bg-alt);
  }
  .footer-warning {
    font-size: 0.6rem;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin-bottom: 0.15rem;
  }
  .footer-info {
    font-size: 0.6rem;
    font-weight: bold;
    color: var(--color-text-muted);
    margin-bottom: 0.15rem;
  }
  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-guid {
    font-size: 0.55rem;
    color: var(--color-text-muted);
  }
  .footer-app {
    font-size: 0.55rem;
    color: var(--color-text-muted);
    text-align: right;
  }
</style>

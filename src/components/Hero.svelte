<script lang="ts">
  let { onNavigate, onDebugToggle, debugVisible = false }: {
    onNavigate: (mode: 'generate' | 'scan' | 'vault' | 'settings') => void;
    onDebugToggle?: () => void;
    debugVisible?: boolean;
  } = $props();

  let showExplainer = $state(false);
</script>

<div class="hero">
  <h1 class="hero-title">n of m</h1>
  <p class="hero-subtitle">Shamir's Secret Sharing for Seed Phrases</p>
  <p class="hero-tagline text-muted text-sm">Split. Print. Recover.</p>

  <div class="hero-actions mt-lg">
    <button class="primary" onclick={() => onNavigate('generate')}>
      <i class="fa-thin fa-key"></i> Generate
    </button>
    <button onclick={() => onNavigate('scan')}>
      <i class="fa-thin fa-qrcode"></i> Scan
    </button>
    <button onclick={() => onNavigate('vault')}>
      <i class="fa-thin fa-vault"></i> Vault
    </button>
    <div class="settings-group">
      <button onclick={() => onNavigate('settings')}>
        <i class="fa-thin fa-gear"></i> Settings
      </button>
      {#if onDebugToggle}
        <button class="debug-badge-btn" class:active={debugVisible} onclick={onDebugToggle} title="Debug Terminal">
          <i class="fa-thin fa-terminal"></i>
        </button>
      {/if}
    </div>
  </div>

  <div class="hero-info mt-lg">
    <p class="text-sm text-muted">
      Generate a seed phrase, split it into <b>m</b> shares where any <b>n</b> can
      reconstruct it. Print QR-coded share cards. Scan to recover. Fully offline.
    </p>
  </div>

  <div class="explainer-toggle mt-md">
    <button class="explainer-btn" onclick={() => { showExplainer = !showExplainer; }}>
      <i class="fa-thin {showExplainer ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
      How it works
    </button>
  </div>

  {#if showExplainer}
    <div class="explainer mt-sm">
      <div class="explainer-section">
        <h3 class="explainer-heading">Shamir's Secret Sharing</h3>
        <p>Your seed phrase is split into <b>M</b> distinct shares using a cryptographic algorithm. Any <b>N</b> of those shares (the threshold) can reconstruct the original -- but fewer than N reveals <b>nothing</b>.</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">Why not just copy the phrase?</h3>
        <p>A single copy is a single point of failure -- theft or loss means total compromise or permanent lockout. With N-of-M splitting, you distribute trust: no single share holder can access the secret, and you can lose up to M-N shares without losing access.</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">Local-first / no network</h3>
        <p>All cryptographic operations run entirely in your browser. No data is ever sent to a server. Entropy, key derivation, Shamir splitting, and QR encoding all happen offline.</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">The math</h3>
        <p>The secret is encoded as coefficients of a random polynomial of degree N-1 over <code>GF(2^8)</code> (the Galois field with 256 elements). Each share is a point on this polynomial. Reconstruction uses Lagrange interpolation -- given N points, the unique polynomial (and thus the secret) is recovered exactly.</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .hero {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }
  .hero-title {
    font-size: 2.5rem;
    letter-spacing: 0.1em;
    text-transform: lowercase;
  }
  .hero-subtitle {
    font-size: 0.9rem;
    margin-top: var(--spacing-xs);
  }
  .hero-tagline {
    margin-top: var(--spacing-xs);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    font-size: 0.75rem;
  }
  .hero-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
    flex-wrap: wrap;
  }
  .hero-actions button {
    min-width: 120px;
  }
  .settings-group {
    display: flex;
    gap: 0.25rem;
    align-items: stretch;
  }
  .settings-group .debug-badge-btn {
    min-width: 0;
    width: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    opacity: 0.4;
    border: 1px solid var(--color-border);
    box-shadow: 1px 1px 0px var(--color-shadow);
    background: var(--color-bg);
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .settings-group .debug-badge-btn.active {
    opacity: 1;
    color: var(--color-crypto-text);
    border-color: var(--color-crypto-text);
  }
  .settings-group .debug-badge-btn:hover {
    opacity: 0.8;
    box-shadow: 2px 2px 0px var(--color-shadow);
    transform: translate(-1px, -1px);
  }
  @media (max-width: 480px) {
    .hero-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .hero-actions button {
      min-width: 0;
      width: 100%;
    }
    .settings-group {
      flex-direction: row;
    }
    .settings-group button:first-child {
      flex: 1;
    }
    .settings-group .debug-badge-btn {
      width: 44px;
    }
  }
  .hero-info {
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
  }
  .explainer-toggle {
    text-align: center;
  }
  .explainer-btn {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .explainer-btn:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .explainer-btn i {
    margin-right: 0.25rem;
  }
  .explainer {
    text-align: left;
    max-width: 520px;
    margin: 0 auto;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    padding: var(--spacing-md);
  }
  .explainer-section {
    margin-bottom: var(--spacing-md);
  }
  .explainer-section:last-child {
    margin-bottom: 0;
  }
  .explainer-heading {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.3rem;
  }
  .explainer p {
    font-size: 0.8rem;
    line-height: 1.6;
  }
  .explainer code {
    font-size: 0.75rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--color-border);
  }
</style>

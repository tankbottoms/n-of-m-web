<script lang="ts">
  let { onNavigate }: {
    onNavigate: (mode: 'generate' | 'scan' | 'vault' | 'settings') => void;
  } = $props();
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
    <button onclick={() => onNavigate('settings')}>
      <i class="fa-thin fa-gear"></i> Settings
    </button>
  </div>

  <div class="hero-info mt-lg">
    <p class="text-sm text-muted">
      Generate a seed phrase, split it into <b>m</b> shares where any <b>n</b> can
      reconstruct it. Print QR-coded share cards. Scan to recover. Fully offline.
    </p>
  </div>
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
  @media (max-width: 480px) {
    .hero-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .hero-actions button {
      min-width: 0;
      width: 100%;
    }
  }
  .hero-info {
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
  }
</style>

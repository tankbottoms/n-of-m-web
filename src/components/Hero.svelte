<script lang="ts">
  let { onNavigate }: {
    onNavigate: (mode: 'generate' | 'scan' | 'vault' | 'settings') => void;
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

  <div class="explainer-toggle mt-md">
    <button class="explainer-btn" onclick={() => { showExplainer = !showExplainer; }}>
      <i class="fa-thin {showExplainer ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
      How it works
    </button>
  </div>

  <div class="hero-links mt-sm">
    <a href="/docs" class="hero-link"><i class="fa-thin fa-book"></i> Docs</a>
    <span class="hero-link-sep">&middot;</span>
    <a href="/ios" class="hero-link"><i class="fa-thin fa-mobile"></i> iOS App</a>
    <span class="hero-link-sep">&middot;</span>
    <a href="/ux-spec" class="hero-link"><i class="fa-thin fa-palette"></i> UX Spec</a>
    <span class="hero-link-sep">&middot;</span>
    <a href="https://github.com/tankbottoms/n-of-m-web" target="_blank" rel="noopener" class="hero-link"><i class="fa-thin fa-code-branch"></i> Source</a>
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
        <h3 class="explainer-heading">The Mathematics</h3>
        <p>Shamir's scheme operates over a finite field. Each byte of the secret is treated independently in <code>GF(2^8)</code> -- the Galois field with 256 elements, defined by the irreducible polynomial <code>x^8 + x^4 + x^3 + x + 1</code> (0x11B).</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">Polynomial Construction</h3>
        <p>For each byte <code>s</code> of the secret, a random polynomial of degree <code>t-1</code> is constructed:</p>
        <div class="math-block">f(x) = s + a<sub>1</sub>x + a<sub>2</sub>x<sup>2</sup> + ... + a<sub>t-1</sub>x<sup>t-1</sup></div>
        <p>where <code>s</code> is the secret byte (the constant term), <code>a<sub>1</sub>...a<sub>t-1</sub></code> are cryptographically random coefficients, and <code>t</code> is the threshold. Each share <code>i</code> receives the evaluation <code>f(i)</code> for <code>i = 1, 2, ..., M</code>.</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">GF(2^8) Arithmetic</h3>
        <p>Addition in <code>GF(2^8)</code> is XOR. Multiplication uses polynomial multiplication modulo the reducing polynomial, efficiently implemented via log/exp tables. This ensures all operations stay within the 256-element field -- no integer overflow, no rounding.</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">Lagrange Interpolation</h3>
        <p>Given any <code>t</code> points <code>(x<sub>i</sub>, y<sub>i</sub>)</code>, the secret is recovered by computing <code>f(0)</code>:</p>
        <div class="math-block">f(0) = &Sigma;<sub>j</sub> y<sub>j</sub> &middot; &Pi;<sub>k&ne;j</sub> x<sub>k</sub> / (x<sub>k</sub> - x<sub>j</sub>)</div>
        <p>Division in <code>GF(2^8)</code> uses multiplicative inverses via the exp/log tables. Because the polynomial has degree <code>t-1</code>, exactly <code>t</code> points uniquely determine it -- fewer than <code>t</code> points leave the secret uniformly distributed across all 256 possible values, providing information-theoretic security.</p>
      </div>

      <div class="explainer-section">
        <h3 class="explainer-heading">Security Properties</h3>
        <p>With <code>t-1</code> or fewer shares, an attacker gains <b>zero</b> information about the secret. This is not computational security (like encryption) but <b>information-theoretic</b> -- it holds regardless of computing power. The scheme is also <b>perfect</b>: each share is exactly as long as the secret itself.</p>
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
  .hero-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }
  .hero-link {
    color: var(--color-text-muted);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .hero-link:hover {
    color: var(--color-link);
  }
  .hero-link i {
    margin-right: 0.15rem;
  }
  .hero-link-sep {
    color: var(--color-border);
    font-size: 0.6rem;
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
  .math-block {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    background: var(--color-hover-bg);
    border: 1px solid var(--color-border);
    padding: 0.5rem 0.75rem;
    margin: 0.4rem 0;
    text-align: center;
    letter-spacing: 0.02em;
  }
</style>

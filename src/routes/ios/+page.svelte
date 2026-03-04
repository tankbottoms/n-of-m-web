<script lang="ts">
  import { VERSION } from '$lib/version';
  import ThemeToggle from '../../components/ThemeToggle.svelte';

  let faqOpen = $state<Record<string, boolean>>({});

  function toggleFaq(id: string) {
    faqOpen[id] = !faqOpen[id];
  }

  const faqs = [
    {
      id: 'what-is',
      q: 'What is n-of-m?',
      a: 'n-of-m is a tool for splitting cryptocurrency seed phrases into multiple shares using Shamir\'s Secret Sharing. Instead of storing your entire seed phrase in one place, you split it into M shares where any N can reconstruct the original. No single share reveals any information about your secret.',
    },
    {
      id: 'why-ios',
      q: 'Why use the iOS app instead of the web version?',
      a: 'The iOS app uses your iPhone\'s camera system -- autofocus, optical stabilization, and high-resolution sensors that laptop webcams can\'t match. QR code scanning is near-instant on iOS. The app also integrates with iOS Keychain for encrypted storage and supports FaceID/TouchID for vault access.',
    },
    {
      id: 'offline',
      q: 'Does the app require an internet connection?',
      a: 'No. The app is fully offline. No data is ever sent to any server. All cryptographic operations -- key generation, Shamir splitting, QR encoding, and recovery -- happen entirely on your device. There is no telemetry, no analytics, no network calls.',
    },
    {
      id: 'security',
      q: 'How secure is the sharing scheme?',
      a: 'Shamir\'s Secret Sharing provides information-theoretic security. With fewer than the threshold number of shares, an attacker learns absolutely nothing about your secret -- regardless of their computing power. This is stronger than computational security (like encryption) because it holds even against quantum computers.',
    },
    {
      id: 'compatible',
      q: 'Are shares compatible between the web and iOS versions?',
      a: 'Yes. Both versions use the same GF(2^8) Shamir implementation and QR encoding format. Shares generated on the web can be scanned and recovered on iOS, and vice versa. You can mix and match platforms freely.',
    },
    {
      id: 'how-many',
      q: 'How many shares should I create?',
      a: 'A common configuration is 3-of-5: create 5 shares and require any 3 to recover. This lets you lose up to 2 shares without losing access, while requiring collusion of 3 parties for compromise. Adjust based on your threat model -- more shares means more redundancy but more physical cards to manage.',
    },
    {
      id: 'print',
      q: 'How do I print the share cards?',
      a: 'After splitting your seed phrase, export share cards as PDF. Each card includes a QR code containing the encrypted share data, share metadata (index, threshold, total), and a notes section. Print on standard 8.5x11 paper and distribute to secure locations.',
    },
    {
      id: 'lose-phone',
      q: 'What happens if I lose my phone?',
      a: 'Your seed phrase is reconstructed from the physical QR share cards, not from your phone. The phone is a tool for generating and scanning -- the printed cards are the actual backup. If you lose your phone, install the app on a new device and scan your cards to recover.',
    },
    {
      id: 'wallets',
      q: 'Which wallets are supported?',
      a: 'n-of-m works with any wallet that uses BIP39 seed phrases (12 or 24 words). It supports MetaMask, Ledger Live, and custom BIP32/BIP44 derivation paths. The app derives HD wallet addresses so you can verify your seed phrase maps to the correct addresses.',
    },
    {
      id: 'free',
      q: 'How much does the app cost?',
      a: 'The iOS app is currently $2.99 on the App Store with full functionality -- no in-app purchases, no subscriptions, no ads. A free version limited to 2-of-3 splitting is planned. The full version price will increase to $9.99-$19.99. The web version remains free and open source.',
    },
  ];
</script>

<svelte:head>
  <title>iOS App - n of m</title>
  <meta name="description" content="n-of-m for iOS -- Shamir's Secret Sharing with native camera scanning, Keychain encryption, and biometric vault access." />
</svelte:head>

<ThemeToggle />

<div class="ios-page">
  <header class="page-header">
    <a href="/" class="back-link"><i class="fa-thin fa-arrow-left"></i> Back to App</a>
  </header>

  <!-- Hero -->
  <section class="ios-hero">
    <div class="app-icon">
      <i class="fa-thin fa-shield-keyhole"></i>
    </div>
    <h1 class="app-title">n of m</h1>
    <p class="app-subtitle">for iOS</p>
    <p class="app-tagline text-muted">Shamir's Secret Sharing with native camera performance</p>

    <div class="app-badges mt-md">
      <a href="https://apps.apple.com/us/app/n-of-m-shamirs-secret-sharing/id6759819164" target="_blank" rel="noopener" class="store-badge store-badge-primary">
        <i class="fa-brands fa-apple"></i> Download on the App Store
      </a>
      <a href="https://github.com/tankbottoms/n-of-m" target="_blank" rel="noopener" class="store-badge">
        <i class="fa-thin fa-code-branch"></i> View Source on GitHub
      </a>
    </div>

    <div class="pricing-note mt-sm">
      <p class="text-sm"><b>$2.99</b> -- full functionality, no in-app purchases.</p>
      <p class="text-xs text-muted">A free version (2-of-3 only) is coming soon. Price will increase to $9.99-$19.99.</p>
    </div>
  </section>

  <!-- Why Native -->
  <section class="content-section">
    <h2 class="section-heading">Why a native app?</h2>
    <p class="section-desc">Laptop webcams were not designed for QR code scanning.</p>

    <div class="comparison-grid">
      <div class="comparison-card">
        <div class="comparison-header comparison-poor">
          <i class="fa-thin fa-laptop"></i> Laptop / Desktop Camera
        </div>
        <ul class="comparison-list">
          <li><span class="marker marker-poor">&times;</span> Fixed focus -- struggles with close-range QR codes</li>
          <li><span class="marker marker-poor">&times;</span> Low resolution sensors (720p typical)</li>
          <li><span class="marker marker-poor">&times;</span> Poor low-light performance</li>
          <li><span class="marker marker-poor">&times;</span> No optical image stabilization</li>
          <li><span class="marker marker-poor">&times;</span> Wide-angle distortion at scanning distance</li>
        </ul>
      </div>
      <div class="comparison-card">
        <div class="comparison-header comparison-good">
          <i class="fa-thin fa-mobile"></i> iPhone Camera
        </div>
        <ul class="comparison-list">
          <li><span class="marker marker-good">&#10003;</span> Autofocus with phase detection</li>
          <li><span class="marker marker-good">&#10003;</span> 12-48MP sensors with computational photography</li>
          <li><span class="marker marker-good">&#10003;</span> Night mode and adaptive exposure</li>
          <li><span class="marker marker-good">&#10003;</span> Optical image stabilization</li>
          <li><span class="marker marker-good">&#10003;</span> Near-instant QR detection via AVFoundation</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="content-section">
    <h2 class="section-heading">Features</h2>
    <p class="section-desc">Everything the web app does, plus native iOS capabilities.</p>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-camera"></i></div>
        <h3>Native Camera Scanning</h3>
        <p>AVFoundation-powered QR detection. Point and scan -- no fumbling with webcam positioning or browser permissions.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-face-viewfinder"></i></div>
        <h3>FaceID / TouchID</h3>
        <p>Lock your vault with biometric authentication. iOS Keychain encryption keeps secrets safe even if the device is compromised.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-key"></i></div>
        <h3>Generate or Import</h3>
        <p>Create new BIP39 seed phrases (12 or 24 words) with cryptographic entropy, or import existing mnemonics from any wallet.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-chart-scatter"></i></div>
        <h3>Shamir Splitting</h3>
        <p>Split into up to 10 shares with configurable thresholds. GF(2^8) finite field arithmetic -- information-theoretic security.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-print"></i></div>
        <h3>Print Share Cards</h3>
        <p>Export as full-page PDF cards with QR codes, metadata labels, instructions, and a notes section. Print and distribute.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-vault"></i></div>
        <h3>Encrypted Vault</h3>
        <p>Store recovered secrets in an on-device encrypted vault. AES-256-GCM encryption with optional PIN protection.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-wallet"></i></div>
        <h3>HD Wallet Derivation</h3>
        <p>Derive addresses using MetaMask, Ledger Live, or custom BIP32/BIP44 paths. Verify your seed maps to the right addresses.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><i class="fa-thin fa-wifi-slash"></i></div>
        <h3>Fully Offline</h3>
        <p>Zero network calls. No telemetry, no analytics, no servers. Every operation runs entirely on your device.</p>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section class="content-section">
    <h2 class="section-heading">How it works</h2>
    <p class="section-desc">Four steps from seed phrase to distributed cold storage.</p>

    <div class="steps">
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>Generate or Import</h3>
          <p>Create a new BIP39 seed phrase with device entropy (accelerometer + system CSPRNG), or import an existing 12/24-word mnemonic. Optionally derive HD wallet addresses to verify correctness.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>Split into Shares</h3>
          <p>Choose your threshold (N) and total shares (M). The app constructs random polynomials over GF(2^8) and evaluates them to produce M share points. Each share is encoded as a QR code on a printable card.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>Print and Distribute</h3>
          <p>Export share cards as PDF. Each card includes the QR-encoded share, share index, threshold requirement, and a notes section. Print on standard paper and store each card in a separate secure location.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h3>Scan to Recover</h3>
          <p>When you need your seed phrase, scan any N share cards with the iPhone camera. The app performs Lagrange interpolation over GF(2^8) to reconstruct the original secret. Store the result in the encrypted vault.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Security -->
  <section class="content-section">
    <h2 class="section-heading">Security Model</h2>
    <p class="section-desc">Defense in depth at every layer.</p>

    <div class="security-grid">
      <div class="security-item">
        <h4><i class="fa-thin fa-lock"></i> On-Device Only</h4>
        <p>All cryptographic operations execute locally. No server communication, no cloud sync, no third-party dependencies at runtime.</p>
      </div>
      <div class="security-item">
        <h4><i class="fa-thin fa-shield-halved"></i> Information-Theoretic Security</h4>
        <p>Shamir's scheme guarantees that fewer than N shares reveal zero bits of information about the secret. This holds against unlimited computing power.</p>
      </div>
      <div class="security-item">
        <h4><i class="fa-thin fa-key-skeleton"></i> iOS Keychain</h4>
        <p>Vault data is encrypted via the iOS Keychain -- hardware-backed encryption tied to the device's Secure Enclave.</p>
      </div>
      <div class="security-item">
        <h4><i class="fa-thin fa-fingerprint"></i> Biometric Gate</h4>
        <p>Vault access requires FaceID or TouchID. Failed biometric attempts fall back to device passcode, never to a weaker mechanism.</p>
      </div>
      <div class="security-item">
        <h4><i class="fa-thin fa-code-branch"></i> Open Source</h4>
        <p>The full source code is publicly auditable. No obfuscation, no binary blobs, no hidden network calls. Verify the implementation yourself.</p>
      </div>
      <div class="security-item">
        <h4><i class="fa-thin fa-memory"></i> Memory Safety</h4>
        <p>Sensitive data (seed phrases, shares, private keys) is cleared from memory after use. The app never writes plaintext secrets to disk.</p>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="content-section">
    <h2 class="section-heading">Frequently Asked Questions</h2>

    <div class="faq-list">
      {#each faqs as faq}
        <div class="faq-item" class:faq-open={faqOpen[faq.id]}>
          <button class="faq-question" onclick={() => toggleFaq(faq.id)}>
            <span>{faq.q}</span>
            <i class="fa-thin {faqOpen[faq.id] ? 'fa-minus' : 'fa-plus'}"></i>
          </button>
          {#if faqOpen[faq.id]}
            <div class="faq-answer">
              <p>{faq.a}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <!-- Requirements -->
  <section class="content-section">
    <h2 class="section-heading">Requirements</h2>

    <div class="req-grid">
      <div class="req-item">
        <span class="req-label">Platform</span>
        <span class="req-value">iOS 16.0 or later</span>
      </div>
      <div class="req-item">
        <span class="req-label">Devices</span>
        <span class="req-value">iPhone, iPad</span>
      </div>
      <div class="req-item">
        <span class="req-label">Size</span>
        <span class="req-value">&lt; 15 MB</span>
      </div>
      <div class="req-item">
        <span class="req-label">Price</span>
        <span class="req-value">$2.99 (introductory)</span>
      </div>
      <div class="req-item">
        <span class="req-label">In-App Purchases</span>
        <span class="req-value">None -- full functionality included</span>
      </div>
      <div class="req-item">
        <span class="req-label">Network Required</span>
        <span class="req-value">No</span>
      </div>
      <div class="req-item">
        <span class="req-label">Camera Required</span>
        <span class="req-value">For QR scanning (generation works without)</span>
      </div>
      <div class="req-item">
        <span class="req-label">License</span>
        <span class="req-value">Open Source (MIT)</span>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="content-section cta-section">
    <div class="cta-box">
      <h2>Get Started</h2>
      <p class="text-muted">Split your first seed phrase in under a minute.</p>
      <div class="cta-actions mt-md">
        <a href="https://apps.apple.com/us/app/n-of-m-shamirs-secret-sharing/id6759819164" target="_blank" rel="noopener" class="cta-btn primary">
          <i class="fa-brands fa-apple"></i> App Store -- $2.99
        </a>
        <a href="/" class="cta-btn">
          <i class="fa-thin fa-globe"></i> Use Web Version
        </a>
        <a href="https://github.com/tankbottoms/n-of-m" target="_blank" rel="noopener" class="cta-btn">
          <i class="fa-thin fa-code-branch"></i> Source Code
        </a>
        <a href="/docs" class="cta-btn">
          <i class="fa-thin fa-book"></i> Read Documentation
        </a>
      </div>
    </div>
  </section>

  <footer class="page-footer">
    <span class="footer-version">v{VERSION}</span>
    <span class="footer-sep">&middot;</span>
    <a href="/" class="footer-link">Web App</a>
    <span class="footer-sep">&middot;</span>
    <a href="/docs" class="footer-link">Docs</a>
    <span class="footer-sep">&middot;</span>
    <a href="https://github.com/tankbottoms/n-of-m" target="_blank" rel="noopener" class="footer-link">GitHub</a>
  </footer>
</div>

<style>
  .ios-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .page-header {
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-xl);
  }

  .back-link {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .back-link:hover {
    color: var(--color-text);
    text-decoration: none;
  }

  /* Hero */
  .ios-hero {
    text-align: center;
    padding: var(--spacing-xl) 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-xl);
  }

  .app-icon {
    font-size: 3rem;
    color: var(--color-accent);
    margin-bottom: var(--spacing-sm);
  }

  .app-title {
    font-size: 2.5rem;
    letter-spacing: 0.1em;
    text-transform: lowercase;
  }

  .app-subtitle {
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-accent);
    margin-top: var(--spacing-xs);
  }

  .app-tagline {
    margin-top: var(--spacing-xs);
    font-size: 0.8rem;
  }

  .app-badges {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .store-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    border: 1px solid var(--color-border-dark);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    box-shadow: 2px 2px 0px var(--color-shadow);
    transition: box-shadow 0.1s, transform 0.1s;
  }

  .store-badge:hover {
    box-shadow: 3px 3px 0px var(--color-shadow);
    transform: translate(-1px, -1px);
    text-decoration: none;
  }

  .store-badge-primary {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }
  .store-badge-primary:hover {
    color: #fff;
  }

  .pricing-note {
    text-align: center;
  }
  .pricing-note p {
    margin: 0;
  }
  .pricing-note p + p {
    margin-top: 0.25rem;
  }

  /* Sections */
  .content-section {
    padding: var(--spacing-xl) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .section-heading {
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: var(--spacing-xs);
  }

  .section-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-lg);
  }

  /* Comparison */
  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .comparison-card {
    border: 1px solid var(--color-border);
  }

  .comparison-header {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--color-border);
  }

  .comparison-poor {
    background: var(--color-error-bg);
    color: var(--color-error);
  }

  .comparison-good {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .comparison-list {
    list-style: none;
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .comparison-list li {
    font-size: 0.75rem;
    padding: 0.25rem 0;
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .marker {
    font-weight: 700;
    flex-shrink: 0;
    width: 1rem;
    text-align: center;
  }

  .marker-poor { color: var(--color-error); }
  .marker-good { color: var(--color-success); }

  /* Features */
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .feature-card {
    border: 1px solid var(--color-border);
    padding: var(--spacing-md);
  }

  .feature-card .feature-icon {
    font-size: 1.2rem;
    color: var(--color-accent);
    margin-bottom: var(--spacing-xs);
  }

  .feature-card h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.3rem;
  }

  .feature-card p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  /* Steps */
  .steps {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .step {
    display: flex;
    gap: var(--spacing-md);
    border: 1px solid var(--color-border);
    padding: var(--spacing-md);
  }

  .step-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-accent);
    flex-shrink: 0;
    width: 2rem;
    text-align: center;
    line-height: 1;
  }

  .step-content h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.3rem;
  }

  .step-content p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  /* Security */
  .security-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .security-item {
    border: 1px solid var(--color-border);
    padding: var(--spacing-md);
  }

  .security-item h4 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.3rem;
  }

  .security-item h4 i {
    color: var(--color-accent);
    margin-right: 0.3rem;
  }

  .security-item p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  /* FAQ */
  .faq-list {
    display: flex;
    flex-direction: column;
  }

  .faq-item {
    border: 1px solid var(--color-border);
    border-bottom: none;
  }

  .faq-item:last-child {
    border-bottom: 1px solid var(--color-border);
  }

  .faq-question {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    box-shadow: none;
    text-transform: none;
    letter-spacing: 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    color: var(--color-text);
  }

  .faq-question:hover {
    background: var(--color-hover-bg);
    box-shadow: none;
    transform: none;
  }

  .faq-question i {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
    margin-left: var(--spacing-sm);
  }

  .faq-answer {
    padding: 0 var(--spacing-md) var(--spacing-md);
  }

  .faq-answer p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  /* Requirements */
  .req-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
  }

  .req-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    font-size: 0.75rem;
  }

  .req-item:last-child {
    border-bottom: none;
  }

  .req-label {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .req-value {
    text-align: right;
  }

  /* CTA */
  .cta-section {
    border-bottom: none;
  }

  .cta-box {
    text-align: center;
    border: 1px solid var(--color-border);
    padding: var(--spacing-xl);
  }

  .cta-box h2 {
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .cta-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    border: 1px solid var(--color-border-dark);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    box-shadow: 2px 2px 0px var(--color-shadow);
    transition: box-shadow 0.1s, transform 0.1s;
  }

  .cta-btn:hover {
    box-shadow: 3px 3px 0px var(--color-shadow);
    transform: translate(-1px, -1px);
    text-decoration: none;
  }

  .cta-btn.primary {
    background: var(--color-accent);
    color: #fff;
  }

  /* Footer */
  .page-footer {
    text-align: center;
    padding: var(--spacing-xl) 0;
    font-size: 0.65rem;
    color: var(--color-text-muted);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .footer-version {
    font-family: var(--font-mono);
    letter-spacing: 0.1em;
  }

  .footer-sep {
    color: var(--color-border);
    font-size: 0.5rem;
  }

  .footer-link {
    color: var(--color-text-muted);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .footer-link:hover {
    color: var(--color-link);
    text-decoration: none;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .comparison-grid,
    .features-grid,
    .security-grid {
      grid-template-columns: 1fr;
    }

    .ios-page {
      padding: 0 var(--spacing-md);
    }
  }

  @media (max-width: 480px) {
    .ios-page {
      padding: 0 var(--spacing-sm);
    }

    .app-title {
      font-size: 2rem;
    }

    .cta-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .cta-btn {
      justify-content: center;
    }

    .req-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }

    .req-value {
      text-align: left;
    }
  }
</style>

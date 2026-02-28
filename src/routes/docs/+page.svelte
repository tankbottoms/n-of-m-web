<script lang="ts">
  import { VERSION } from '$lib/version';

  let tocExpanded = $state(true);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'generate-workflow', label: 'Generate Workflow' },
    { id: 'recovery-workflow', label: 'Recovery Workflow' },
    { id: 'vault-management', label: 'Vault Management' },
    { id: 'export-formats', label: 'Export Formats' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'security-model', label: 'Security Model' },
    { id: 'faq', label: 'FAQ' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'developer-guide', label: 'Developer Guide' },
  ];
</script>

<svelte:head>
  <title>Documentation - n of m</title>
</svelte:head>

<div class="docs">
  <header class="docs-header">
    <a href="/" class="back-link"><i class="fa-thin fa-arrow-left"></i> Back to App</a>
    <h1>Documentation</h1>
    <p class="text-muted text-sm">v{VERSION} -- Shamir's Secret Sharing for Seed Phrases</p>
  </header>

  <!-- Table of Contents -->
  <nav class="toc">
    <button class="toc-toggle" onclick={() => { tocExpanded = !tocExpanded; }}>
      <i class="fa-thin {tocExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
      Table of Contents
    </button>
    {#if tocExpanded}
      <ol class="toc-list">
        {#each sections as section, i}
          <li><a href="#{section.id}">{i + 1}. {section.label}</a></li>
        {/each}
      </ol>
    {/if}
  </nav>

  <!-- 1. Overview -->
  <section id="overview" class="doc-section">
    <h2>1. Overview</h2>
    <p class="section-desc">What n-of-m does and why it exists.</p>

    <p><b>n-of-m</b> is a client-side tool for splitting cryptocurrency seed phrases into multiple shares using <b>Shamir's Secret Sharing</b>. Instead of storing a single seed phrase in one location (a single point of failure), you split it into <code>N</code> shares and require any <code>M</code> of them to reconstruct the original.</p>

    <div class="info-box">
      <h4 class="info-label">EXAMPLE</h4>
      <p>A <b>3-of-5</b> split creates 5 share cards. Any 3 of those cards can recover your seed phrase. Losing 1 or 2 cards does not compromise your secret, and no individual card reveals any information about the original phrase.</p>
    </div>

    <div class="feature-list">
      <div class="feature-item">
        <span class="feature-icon"><i class="fa-thin fa-lock"></i></span>
        <div>
          <h4>Fully Offline</h4>
          <p>All operations run in your browser. No data is ever sent to any server.</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-icon"><i class="fa-thin fa-qrcode"></i></span>
        <div>
          <h4>QR-Coded Share Cards</h4>
          <p>Each share is encoded as a QR code on a printable card for physical storage.</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-icon"><i class="fa-thin fa-shield-halved"></i></span>
        <div>
          <h4>Information-Theoretic Security</h4>
          <p>Fewer than the threshold number of shares reveal zero information about the secret.</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-icon"><i class="fa-thin fa-vault"></i></span>
        <div>
          <h4>Encrypted Local Vault</h4>
          <p>Optionally store share sets locally with AES-256-GCM encryption.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 2. Getting Started -->
  <section id="getting-started" class="doc-section">
    <h2>2. Getting Started</h2>
    <p class="section-desc">The five-phase workflow from generation to recovery.</p>

    <div class="workflow-steps">
      <div class="workflow-step">
        <span class="step-number">1</span>
        <div>
          <h4>Generate</h4>
          <p>Create or import a BIP39 mnemonic seed phrase (12-24 words).</p>
        </div>
      </div>
      <div class="workflow-step">
        <span class="step-number">2</span>
        <div>
          <h4>Split</h4>
          <p>Configure your Shamir threshold (e.g., 2-of-3) and split the secret into shares.</p>
        </div>
      </div>
      <div class="workflow-step">
        <span class="step-number">3</span>
        <div>
          <h4>Print</h4>
          <p>Export share cards as PDF, HTML, or PNG. Each card contains a QR code encoding one share.</p>
        </div>
      </div>
      <div class="workflow-step">
        <span class="step-number">4</span>
        <div>
          <h4>Store</h4>
          <p>Distribute printed share cards to separate physical locations (safe deposit boxes, trusted parties).</p>
        </div>
      </div>
      <div class="workflow-step">
        <span class="step-number">5</span>
        <div>
          <h4>Recover</h4>
          <p>Scan or upload the threshold number of shares to reconstruct the original seed phrase.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. Generate Workflow -->
  <section id="generate-workflow" class="doc-section">
    <h2>3. Generate Workflow</h2>
    <p class="section-desc">Step-by-step walkthrough of the 7-step wizard.</p>

    <div class="wizard-steps">
      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 1</span>
          <h4>Word Count</h4>
        </div>
        <p>Select the mnemonic length: 12, 15, 18, 21, or 24 words. Longer mnemonics provide more entropy (128-256 bits). <b>24 words</b> (256 bits) is recommended for maximum security.</p>
      </div>

      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 2</span>
          <h4>Entropy</h4>
        </div>
        <p>Entropy is generated from <code>crypto.getRandomValues()</code> (your browser's cryptographically secure random number generator). You can optionally add mouse-movement entropy which is mixed in via SHA-256.</p>
      </div>

      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 3</span>
          <h4>Mnemonic</h4>
        </div>
        <p>The BIP39 mnemonic is generated from the entropy. You can also paste an existing mnemonic if you want to split an already-existing seed phrase. The checksum is validated automatically.</p>
      </div>

      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 4</span>
          <h4>Derivation Path</h4>
        </div>
        <p>Choose the HD wallet derivation path. Supports <b>MetaMask</b> (<code>m/44'/60'/0'/0/&#123;index&#125;</code>) and <b>Ledger</b> (<code>m/44'/60'/&#123;index&#125;'/0/0</code>) paths. This determines which addresses are derived from your seed.</p>
      </div>

      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 5</span>
          <h4>Addresses</h4>
        </div>
        <p>Preview the Ethereum addresses derived from your mnemonic. Verify these match your wallet to confirm the seed phrase is correct before splitting.</p>
      </div>

      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 6</span>
          <h4>Shamir Configuration</h4>
        </div>
        <p>Set the total number of shares (<code>N</code>) and the reconstruction threshold (<code>M</code>). The threshold must be at least 2 and at most equal to the total shares. You can also set a wallet name, optional PIN, and optional BIP39 passphrase.</p>
      </div>

      <div class="wizard-step">
        <div class="wizard-step-header">
          <span class="badge badge-info">STEP 7</span>
          <h4>Preview &amp; Export</h4>
        </div>
        <p>Preview all share cards before exporting. Download as PDF, print directly, or save to the local encrypted vault. Each card shows the share QR code, wallet name, share index, threshold info, and derived addresses.</p>
      </div>
    </div>
  </section>

  <!-- 4. Recovery Workflow -->
  <section id="recovery-workflow" class="doc-section">
    <h2>4. Recovery Workflow</h2>
    <p class="section-desc">How to reconstruct your seed phrase from shares.</p>

    <div class="workflow-steps">
      <div class="workflow-step">
        <span class="step-number">1</span>
        <div>
          <h4>Gather Shares</h4>
          <p>Collect at least the threshold number of share cards. For a 3-of-5 split, you need any 3 of the 5 cards.</p>
        </div>
      </div>
      <div class="workflow-step">
        <span class="step-number">2</span>
        <div>
          <h4>Scan or Upload</h4>
          <p>Use your device camera to scan QR codes from printed cards, or upload previously exported files.</p>
        </div>
      </div>
      <div class="workflow-step">
        <span class="step-number">3</span>
        <div>
          <h4>Reconstruct</h4>
          <p>Once enough shares are loaded, the app reconstructs the original mnemonic using Lagrange interpolation over GF(2^8).</p>
        </div>
      </div>
    </div>

    <div class="info-box mt-md">
      <h4 class="info-label">SUPPORTED INPUT FORMATS</h4>
      <div class="format-list">
        <div class="format-item">
          <span class="text-xs text-muted">CAMERA</span>
          <span class="text-xs">Scan QR codes directly from printed share cards</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">HTML FILES</span>
          <span class="text-xs">Upload exported HTML share card files (individual or combined)</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">JSON FILES</span>
          <span class="text-xs">Upload exported vault JSON backups</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">PNG IMAGES</span>
          <span class="text-xs">Upload QR code images exported from the vault</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. Vault Management -->
  <section id="vault-management" class="doc-section">
    <h2>5. Vault Management</h2>
    <p class="section-desc">Local encrypted storage for share sets and wallet configurations.</p>

    <p>The vault stores share sets in your browser's IndexedDB, encrypted with AES-256-GCM. Data never leaves your device. The vault is optional -- you can use the app purely for generating and printing share cards without storing anything locally.</p>

    <h3>Vault Features</h3>
    <div class="feature-grid">
      <div class="feature-cell">
        <h4 class="feature-cell-label">STORAGE</h4>
        <p>Share sets, wallet names, derivation paths, address lists, and Shamir configuration are stored together.</p>
      </div>
      <div class="feature-cell">
        <h4 class="feature-cell-label">ENCRYPTION</h4>
        <p>AES-256-GCM with a browser-generated master key. Optional password protection via PBKDF2-SHA256 (100k iterations).</p>
      </div>
      <div class="feature-cell">
        <h4 class="feature-cell-label">EXPORT</h4>
        <p>Export vault contents as PDF, HTML, JSON, or PNG. Multiple formats for redundancy and compatibility.</p>
      </div>
      <div class="feature-cell">
        <h4 class="feature-cell-label">IMPORT</h4>
        <p>Import share data from HTML files, JSON backups, or QR code images to rebuild vault entries.</p>
      </div>
    </div>
  </section>

  <!-- 6. Export Formats -->
  <section id="export-formats" class="doc-section">
    <h2>6. Export Formats</h2>
    <p class="section-desc">Comparison of available export formats and when to use each.</p>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Format</th>
            <th>Contents</th>
            <th>Best For</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>PDF</b></td>
            <td>Full-page share cards with QR codes, addresses, metadata</td>
            <td>Printing physical cards for secure storage</td>
            <td>One card per page. Rendered client-side via html2canvas + jsPDF.</td>
          </tr>
          <tr>
            <td><b>HTML</b></td>
            <td>Self-contained share card files with embedded QR codes and styles</td>
            <td>Offline archival, sharing via USB drive</td>
            <td>Opens in any browser. No dependencies. Can be used as recovery input.</td>
          </tr>
          <tr>
            <td><b>JSON</b></td>
            <td>Structured vault data (share sets, configs, addresses)</td>
            <td>Backup and restore of full vault state</td>
            <td>Machine-readable. Includes all metadata. Password-protected export available.</td>
          </tr>
          <tr>
            <td><b>PNG</b></td>
            <td>Single QR code encoding the full vault configuration</td>
            <td>Quick backup to image, scanning between devices</td>
            <td>Scan with any QR reader. Limited by QR capacity for large vaults.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="info-box mt-md">
      <h4 class="info-label">RECOMMENDATION</h4>
      <p>For maximum resilience, export in multiple formats. Print PDF cards for physical storage, keep an HTML copy on an offline USB drive, and store a JSON backup in a separate secure location.</p>
    </div>
  </section>

  <!-- 7. Best Practices -->
  <section id="best-practices" class="doc-section">
    <h2>7. Best Practices</h2>
    <p class="section-desc">Recommendations for threshold selection, storage, and operational security.</p>

    <h3>Threshold Selection</h3>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Configuration</th>
            <th>Tolerance</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>2-of-3</b></td>
            <td>Lose 1 share</td>
            <td>Personal use. Simple setup. Keep one share at home, one in a safe deposit box, one with a trusted person.</td>
          </tr>
          <tr>
            <td><b>3-of-5</b></td>
            <td>Lose 2 shares</td>
            <td>Higher security. Distribute across more locations. Good balance of redundancy and threshold difficulty.</td>
          </tr>
          <tr>
            <td><b>4-of-7</b></td>
            <td>Lose 3 shares</td>
            <td>Organizational use or high-value assets. Requires coordination of 4 parties/locations for recovery.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3>Physical Storage</h3>
    <div class="practice-list">
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Separate locations.</b> Store each share card in a different physical location. The security of Shamir's scheme depends on shares not being co-located.</p>
      </div>
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Protect from elements.</b> Laminate printed cards or use waterproof sleeves. Paper degrades with moisture, sunlight, and heat.</p>
      </div>
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Label clearly.</b> Mark each card with the share index (e.g., "Share 2 of 5") and the wallet name so you know which set it belongs to.</p>
      </div>
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Never store digitally long-term.</b> Print your share cards and then delete any digital copies. Digital files can be copied, exfiltrated, or compromised. Physical cards in separate locations provide stronger security guarantees.</p>
      </div>
    </div>

    <h3>Operational Security</h3>
    <div class="practice-list">
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Test recovery before relying on shares.</b> After splitting, immediately test that you can reconstruct the seed from the threshold number of shares. Do not trust untested backups.</p>
      </div>
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Use an air-gapped device.</b> For high-value seeds, run the app on a device that has never been and will never be connected to the internet. Use the standalone HTML download or install as a PWA while offline.</p>
      </div>
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Clear browser data after use.</b> Use Settings &rarr; Clear All Data to remove any locally stored vault data, or use a private/incognito window.</p>
      </div>
      <div class="practice-item">
        <span class="practice-marker"></span>
        <p><b>Verify addresses before splitting.</b> In Step 5 of the wizard, confirm the derived addresses match your wallet. Splitting the wrong seed phrase is an expensive mistake.</p>
      </div>
    </div>
  </section>

  <!-- 8. Security Model -->
  <section id="security-model" class="doc-section">
    <h2>8. Security Model</h2>
    <p class="section-desc">Cryptographic implementation details and trust assumptions.</p>

    <div class="security-grid">
      <div class="security-item">
        <h4 class="security-label">CLIENT-SIDE ONLY</h4>
        <p>The app makes zero network requests after initial load. All cryptographic operations -- key generation, secret splitting, address derivation, encryption -- run entirely in your browser. There is no server, no API, no telemetry. Verify this by checking the Network tab in your browser's developer tools.</p>
      </div>

      <div class="security-item">
        <h4 class="security-label">SHAMIR'S SECRET SHARING</h4>
        <p>Implemented over the Galois field GF(2^8). The secret is split byte-by-byte using random polynomials of degree <code>t-1</code> where <code>t</code> is the threshold. Reconstruction uses Lagrange interpolation. The scheme is <b>information-theoretically secure</b>: fewer than <code>t</code> shares reveal exactly zero information about the secret, regardless of computational power.</p>
      </div>

      <div class="security-item">
        <h4 class="security-label">VAULT ENCRYPTION</h4>
        <p><code>AES-256-GCM</code> authenticated encryption. The 256-bit master key is generated from the browser's CSPRNG (<code>crypto.getRandomValues()</code>) and stored in IndexedDB. GCM mode provides both confidentiality and integrity -- any tampering with the ciphertext is detected and rejected.</p>
      </div>

      <div class="security-item">
        <h4 class="security-label">KEY DERIVATION</h4>
        <p><code>PBKDF2-SHA256</code> with 100,000 iterations for vault password hashing. Each password is salted with a random 16-byte value to prevent rainbow table attacks.</p>
      </div>

      <div class="security-item">
        <h4 class="security-label">WALLET DERIVATION</h4>
        <p><code>BIP39</code> mnemonic generation with configurable word counts (128-256 bits of entropy). <code>BIP44</code> hierarchical deterministic key derivation. Supports MetaMask and Ledger derivation path schemes.</p>
      </div>

      <div class="security-item">
        <h4 class="security-label">ENTROPY SOURCES</h4>
        <p>Primary entropy: <code>crypto.getRandomValues()</code> (browser CSPRNG, seeded from OS entropy pool). Optional supplemental entropy from mouse movement, mixed via SHA-256. The CSPRNG alone is considered sufficient for all security levels.</p>
      </div>
    </div>
  </section>

  <!-- 9. FAQ -->
  <section id="faq" class="doc-section">
    <h2>9. FAQ</h2>
    <p class="section-desc">Common questions and answers.</p>

    <div class="faq-list">
      <div class="faq-item">
        <h4 class="faq-question">What happens if I lose some share cards?</h4>
        <p>As long as you still have at least the threshold number of shares, you can recover your seed phrase. For example, in a 3-of-5 split, losing 2 shares still leaves you with 3 -- enough to reconstruct. If you drop below the threshold, recovery is mathematically impossible.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Can I change the threshold after splitting?</h4>
        <p>No. The threshold is baked into the mathematical structure of the shares. To change the threshold, recover the original seed phrase and create a new split with the desired configuration. Destroy the old share cards afterward.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Does the app work offline?</h4>
        <p>Yes. After the first visit, the service worker caches all assets locally. The app works fully offline as a Progressive Web App (PWA). You can also download the standalone HTML file from Settings for a completely self-contained offline copy.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Can someone with fewer shares than the threshold learn anything?</h4>
        <p>No. Shamir's Secret Sharing is information-theoretically secure. An attacker with <code>t-1</code> shares has exactly as much information about the secret as someone with zero shares. This holds regardless of the attacker's computational resources.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">What blockchains does this support?</h4>
        <p>The app generates standard BIP39 mnemonics and derives Ethereum (EVM) addresses via BIP44. The seed phrase itself is blockchain-agnostic -- the same mnemonic can be imported into wallets for Bitcoin, Ethereum, Solana, and other BIP39-compatible chains.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Is the vault password required?</h4>
        <p>No. The vault is encrypted with a browser-generated master key by default. The password adds an additional layer -- it derives a wrapping key via PBKDF2 that encrypts the master key. Without a password, anyone with access to your browser's IndexedDB could decrypt the vault.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Can I use this for non-crypto secrets?</h4>
        <p>The Shamir splitting operates on arbitrary byte sequences, but the app's UI is designed around BIP39 seed phrases. The mnemonic step expects valid BIP39 word sequences with correct checksums. For arbitrary secret splitting, a general-purpose Shamir tool would be more appropriate.</p>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">How do I verify the app hasn't been tampered with?</h4>
        <p>The source code is available on <a href="https://github.com/tankbottoms/n-of-m-web" target="_blank" rel="noopener">GitHub</a>. For maximum assurance, clone the repository, audit the code, build locally, and run on an air-gapped device. The standalone HTML export contains all code inline for easy review.</p>
      </div>
    </div>
  </section>

  <!-- 10. Troubleshooting -->
  <section id="troubleshooting" class="doc-section">
    <h2>10. Troubleshooting</h2>
    <p class="section-desc">Common issues and how to resolve them.</p>

    <div class="faq-list">
      <div class="faq-item">
        <h4 class="faq-question">Camera not showing video feed when scanning</h4>
        <p>The QR scanner library hides the native video element for Safari compatibility. The app renders the camera feed to a canvas element instead. If the canvas remains blank:</p>
        <div class="practice-list mt-sm">
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Ensure camera permissions are granted in your browser settings.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>On iOS Safari, the page must be served over HTTPS (or localhost).</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Close other apps using the camera, then reload the page.</p>
          </div>
        </div>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">App shows old version after update</h4>
        <p>The service worker may be serving cached assets. To force a refresh:</p>
        <div class="practice-list mt-sm">
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Open DevTools &rarr; Application &rarr; Service Workers &rarr; click "Unregister".</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Clear browser cache (Settings &rarr; Clear browsing data &rarr; Cached images and files).</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Close all tabs for the app, then reopen.</p>
          </div>
        </div>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">PDF export shows blank pages or missing QR codes</h4>
        <p>PDF generation uses <code>html2canvas</code> to render share cards as images. On some mobile browsers, canvas rendering can fail silently.</p>
        <div class="practice-list mt-sm">
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Try exporting as HTML instead -- it produces a lighter file with no canvas dependency.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>On mobile, ensure the browser tab is in the foreground during export.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Desktop Chrome/Edge produce the most reliable PDF output.</p>
          </div>
        </div>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">QR code won't scan from printed card</h4>
        <p>QR scanning depends on print quality and lighting. If codes are not being detected:</p>
        <div class="practice-list mt-sm">
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Ensure the print is high-resolution (at least 300 DPI). Inkjet prints can blur fine QR modules.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Avoid lamination with high gloss -- matte lamination reduces glare for camera scanning.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>If camera scanning fails, upload the HTML or PNG file directly instead.</p>
          </div>
        </div>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Vault password not accepted after browser update</h4>
        <p>The vault master key is stored in IndexedDB. Some browsers clear IndexedDB during major updates or storage pressure events. If your password no longer decrypts the vault:</p>
        <div class="practice-list mt-sm">
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>The vault data may be permanently lost if the master key was cleared.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Recover from your physical share cards or exported backup files (HTML, JSON, PNG).</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>This is why exporting physical backups is critical -- the browser vault is a convenience feature, not a primary backup.</p>
          </div>
        </div>
      </div>

      <div class="faq-item">
        <h4 class="faq-question">Reconstruction shows wrong mnemonic</h4>
        <p>If the reconstructed seed phrase doesn't match your original:</p>
        <div class="practice-list mt-sm">
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Verify all scanned shares belong to the <b>same share set</b> (same wallet name and share ID).</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Mixing shares from different splits produces a valid but incorrect mnemonic with no error indication -- this is inherent to Shamir's scheme.</p>
          </div>
          <div class="practice-item">
            <span class="practice-marker"></span>
            <p>Check the derived addresses against your wallet to confirm the reconstruction is correct.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 11. Developer Guide -->
  <section id="developer-guide" class="doc-section">
    <h2>11. Developer Guide</h2>
    <p class="section-desc">Architecture overview and local development setup for contributors.</p>

    <h3>Prerequisites</h3>
    <div class="info-box">
      <div class="format-list">
        <div class="format-item">
          <span class="text-xs text-muted">NODE.JS</span>
          <span class="text-xs">v18+ (v20 LTS recommended)</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">PACKAGE MANAGER</span>
          <span class="text-xs">npm, pnpm, or bun</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">BROWSER</span>
          <span class="text-xs">Chrome/Edge recommended for development (best DevTools support)</span>
        </div>
      </div>
    </div>

    <h3>Quick Start</h3>
    <div class="code-block">
      <code>git clone https://github.com/tankbottoms/n-of-m-web.git</code>
      <code>cd n-of-m-web</code>
      <code>npm install</code>
      <code>npm run dev</code>
    </div>
    <p class="text-xs text-muted mt-sm">Dev server runs at <code>http://localhost:5173</code> with hot module replacement.</p>

    <h3>Project Structure</h3>
    <div class="file-tree">
      <div class="file-entry">
        <span class="file-dir">src/</span>
      </div>
      <div class="file-entry indent-1">
        <span class="file-dir">components/</span>
        <span class="text-xs text-muted">Svelte 5 components (runes syntax)</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">Hero.svelte</span>
        <span class="text-xs text-muted">Landing page with explainer</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">GenerateFlow.svelte</span>
        <span class="text-xs text-muted">7-step wizard for key generation and splitting</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">ScanFlow.svelte</span>
        <span class="text-xs text-muted">QR scanning and file upload for recovery</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">VaultPanel.svelte</span>
        <span class="text-xs text-muted">Encrypted local vault management and export</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">SettingsPanel.svelte</span>
        <span class="text-xs text-muted">Preferences, downloads, and about info</span>
      </div>
      <div class="file-entry indent-1">
        <span class="file-dir">lib/</span>
        <span class="text-xs text-muted">Core logic (no UI dependencies)</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">shamir.ts</span>
        <span class="text-xs text-muted">GF(2^8) arithmetic and Shamir split/combine</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">wallet.ts</span>
        <span class="text-xs text-muted">BIP39/BIP44 mnemonic and address derivation</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">storage.ts</span>
        <span class="text-xs text-muted">IndexedDB vault with AES-256-GCM encryption</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-dir">pdf/</span>
        <span class="text-xs text-muted">Print templates, layouts, QR rendering, PDF export</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-dir">scanner/</span>
        <span class="text-xs text-muted">QR code detection (camera + file upload)</span>
      </div>
      <div class="file-entry indent-1">
        <span class="file-dir">routes/</span>
        <span class="text-xs text-muted">SvelteKit pages</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-name">+page.svelte</span>
        <span class="text-xs text-muted">Main app (SPA with client-side routing)</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-dir">docs/</span>
        <span class="text-xs text-muted">This documentation page</span>
      </div>
      <div class="file-entry indent-2">
        <span class="file-dir">ux-spec/</span>
        <span class="text-xs text-muted">UX specification reference</span>
      </div>
    </div>

    <h3>Key Technologies</h3>
    <div class="feature-grid">
      <div class="feature-cell">
        <h4 class="feature-cell-label">FRAMEWORK</h4>
        <p><b>SvelteKit 2</b> with Svelte 5 runes (<code>$state</code>, <code>$derived</code>, <code>$props</code>). Static adapter for deployment -- no server-side rendering.</p>
      </div>
      <div class="feature-cell">
        <h4 class="feature-cell-label">CRYPTOGRAPHY</h4>
        <p><b>Web Crypto API</b> for AES-GCM and PBKDF2. <b>ethers.js</b> for BIP39/BIP44 derivation. Custom GF(2^8) implementation for Shamir splitting.</p>
      </div>
      <div class="feature-cell">
        <h4 class="feature-cell-label">QR CODES</h4>
        <p><b>QRious</b> for QR generation. <b>qr-scanner</b> and <b>jsQR</b> for decoding (camera and static image). Tiled scanning for multi-QR PDFs.</p>
      </div>
      <div class="feature-cell">
        <h4 class="feature-cell-label">PDF / PRINT</h4>
        <p><b>html2canvas</b> + <b>jsPDF</b> via <code>html2pdf.js</code> for client-side PDF generation. CSS <code>@page</code> and <code>page-break</code> directives for print layout.</p>
      </div>
    </div>

    <h3>Build &amp; Deploy</h3>
    <div class="code-block">
      <code>npm run build</code>
      <code>npm run preview</code>
    </div>
    <p class="text-xs text-muted mt-sm">Builds to <code>.svelte-kit/output</code>. Deployed automatically to Vercel on push to <code>main</code>. Also deployed to Cloudflare Pages.</p>

    <h3>Testing</h3>
    <div class="info-box">
      <div class="format-list">
        <div class="format-item">
          <span class="text-xs text-muted">UNIT TESTS</span>
          <span class="text-xs"><code>npm test</code> -- Vitest-based tests for core crypto logic</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">E2E TESTS</span>
          <span class="text-xs"><code>npx playwright test</code> -- Browser automation tests</span>
        </div>
        <div class="format-item">
          <span class="text-xs text-muted">TYPE CHECK</span>
          <span class="text-xs"><code>npx svelte-check</code> -- TypeScript type validation</span>
        </div>
      </div>
    </div>
  </section>

  <footer class="docs-footer">
    <a href="/" class="back-link"><i class="fa-thin fa-arrow-left"></i> Back to App</a>
    <span class="text-xs text-muted">&middot;</span>
    <a href="/ux-spec" class="back-link">UX Specification</a>
    <span class="text-xs text-muted">&middot;</span>
    <a href="https://github.com/tankbottoms/n-of-m-web" target="_blank" rel="noopener" class="back-link"><i class="fa-thin fa-code-branch"></i> Source</a>
  </footer>
</div>

<style>
  .docs {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--spacing-lg);
    padding-bottom: 4rem;
  }

  .docs-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 2px solid var(--color-border-dark);
  }

  .back-link {
    font-size: 0.8rem;
    color: var(--color-link);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .back-link:hover {
    text-decoration: underline;
  }
  .back-link i {
    margin-right: 0.25rem;
  }

  .docs-header .back-link {
    display: inline-block;
    margin-bottom: var(--spacing-md);
  }

  /* TOC */
  .toc {
    margin-bottom: var(--spacing-xl);
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .toc-toggle {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    box-shadow: none;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.8rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .toc-toggle:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .toc-toggle i {
    margin-right: 0.35rem;
  }
  .toc-list {
    list-style: none;
    padding: 0 var(--spacing-md) var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .toc-list li a {
    font-size: 0.8rem;
    color: var(--color-link);
    text-decoration: none;
    padding: 0.15rem 0;
    display: block;
  }
  .toc-list li a:hover {
    text-decoration: underline;
  }

  /* Sections */
  .doc-section {
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-xl);
    border-bottom: 1px solid var(--color-border);
  }
  .doc-section:last-child {
    border-bottom: none;
  }
  .doc-section h2 {
    margin-bottom: var(--spacing-sm);
  }
  .doc-section h3 {
    margin-top: var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
    color: var(--color-accent);
  }
  .section-desc {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-md);
  }
  .doc-section p {
    font-size: 0.85rem;
    line-height: 1.6;
    margin-bottom: var(--spacing-sm);
  }
  .doc-section p code {
    font-size: 0.8rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--color-border);
  }

  /* Info boxes */
  .info-box {
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }
  .info-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.3rem;
    font-weight: 600;
  }
  .info-box p {
    font-size: 0.8rem;
    line-height: 1.5;
  }

  /* Feature list */
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
  }
  .feature-item {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
  }
  .feature-icon {
    font-size: 1.2rem;
    color: var(--color-accent);
    flex-shrink: 0;
    width: 2rem;
    text-align: center;
    padding-top: 0.1rem;
  }
  .feature-item h4 {
    font-size: 0.8rem;
    margin-bottom: 0.15rem;
  }
  .feature-item p {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 0;
  }

  /* Workflow steps */
  .workflow-steps {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  .workflow-step {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
    padding: var(--spacing-sm) var(--spacing-md);
    border-left: 3px solid var(--color-accent);
    background: var(--color-bg);
  }
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    flex-shrink: 0;
    font-size: 0.8rem;
    font-weight: 600;
    border: 2px solid var(--color-border-dark);
    color: var(--color-text);
  }
  .workflow-step h4 {
    font-size: 0.85rem;
    margin-bottom: 0.15rem;
  }
  .workflow-step p {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 0;
  }

  /* Wizard steps */
  .wizard-steps {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .wizard-step {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
  }
  .wizard-step-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
  }
  .wizard-step-header h4 {
    font-size: 0.85rem;
  }
  .wizard-step p {
    font-size: 0.8rem;
    line-height: 1.5;
    margin-bottom: 0;
  }

  /* Format list in info-box */
  .format-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .format-item {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-border);
  }
  .format-item:last-child {
    border-bottom: none;
  }
  .format-item span:first-child {
    flex-shrink: 0;
    min-width: 7rem;
  }

  /* Feature grid */
  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
  }
  .feature-cell {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
  }
  .feature-cell-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.3rem;
    font-weight: 600;
  }
  .feature-cell p {
    font-size: 0.75rem;
    line-height: 1.5;
    margin-bottom: 0;
  }

  /* Table wrapper */
  .table-wrapper {
    overflow-x: auto;
    margin-bottom: var(--spacing-md);
  }

  /* Practice list */
  .practice-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
  }
  .practice-item {
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-start;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-left: 3px solid var(--color-border);
  }
  .practice-marker {
    display: block;
    width: 6px;
    height: 6px;
    flex-shrink: 0;
    background: var(--color-accent);
    margin-top: 0.4rem;
  }
  .practice-item p {
    font-size: 0.8rem;
    line-height: 1.5;
    margin-bottom: 0;
  }

  /* Security grid */
  .security-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  .security-item {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .security-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.3rem;
    font-weight: 600;
  }
  .security-item p {
    font-size: 0.8rem;
    line-height: 1.5;
    margin-bottom: 0;
  }
  .security-item code {
    font-size: 0.75rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.25rem;
    border: 1px solid var(--color-border);
  }

  /* FAQ */
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .faq-item {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
  }
  .faq-question {
    font-size: 0.85rem;
    margin-bottom: var(--spacing-xs);
  }
  .faq-item p {
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    margin-bottom: 0;
  }
  .faq-item a {
    color: var(--color-link);
  }

  /* Footer */
  .docs-footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-lg);
    border-top: 2px solid var(--color-border-dark);
    flex-wrap: wrap;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .feature-grid {
      grid-template-columns: 1fr;
    }
    .format-item {
      flex-direction: column;
      gap: 0.15rem;
    }
  }

  @media (max-width: 480px) {
    .docs {
      padding: var(--spacing-md);
    }
    .feature-item {
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .feature-icon {
      width: auto;
    }
    .workflow-step {
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .step-number {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.7rem;
    }
  }

  /* Code blocks */
  .code-block {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }
  .code-block code {
    display: block;
    font-size: 0.75rem;
    line-height: 1.8;
    color: var(--color-text);
    background: none;
    border: none;
    padding: 0;
  }
  .code-block code::before {
    content: '$ ';
    color: var(--color-text-muted);
  }

  /* File tree */
  .file-tree {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-md);
    font-size: 0.75rem;
  }
  .file-entry {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }
  .file-entry.indent-1 { padding-left: 1rem; }
  .file-entry.indent-2 { padding-left: 2rem; }
  .file-dir {
    font-weight: 600;
    color: var(--color-accent);
  }
  .file-name {
    color: var(--color-text);
  }
  .file-entry .text-xs {
    font-size: 0.7rem;
  }

  /* Print */
  @media print {
    .docs { padding: 0; }
    .toc { page-break-after: always; }
    .doc-section { page-break-inside: avoid; }
    .doc-section h2 { page-break-after: avoid; }
  }
</style>

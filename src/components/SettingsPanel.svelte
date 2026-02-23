<script lang="ts">
  import type { WordCount } from '$lib/types';
  import type { LayoutType } from '$lib/pdf';
  import { generatePrintHTML, downloadHTML, datetimeStamp } from '$lib/pdf';
  import { setVaultPassword, hasVaultPassword, removeVaultPassword } from '$lib/storage';
  import { VERSION } from '$lib/version';
  import Panel from './Panel.svelte';

  const WORD_COUNTS: WordCount[] = [12, 15, 18, 21, 24];
  const LAYOUTS: { key: LayoutType; label: string; icon: string; description: string }[] = [
    { key: 'full-page', label: 'Full Page', icon: 'fa-file', description: 'One card per page' },
    { key: '2-up', label: 'Compact', icon: 'fa-columns', description: 'Two cards per page' },
  ];
  const COLORS = ['#A8D8EA', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#F8E6E0', '#D5C4F8'];

  let defaultWordCount = $state<WordCount>(
    (parseInt(localStorage.getItem('shamir_pref_word_count') || '24') as WordCount) || 24
  );
  let defaultLayout = $state<LayoutType>(
    (localStorage.getItem('shamir_pref_layout') as LayoutType) || 'full-page'
  );
  let defaultColor = $state(
    localStorage.getItem('shamir_pref_color') || '#A8D8EA'
  );

  let hasPassword = $state(hasVaultPassword());
  let passwordInput = $state('');
  let passwordConfirm = $state('');
  let passwordMessage = $state('');
  let showAlgoDetail = $state(true);
  let clearConfirm = $state(false);
  let clearMessage = $state('');

  function setWordCount(wc: WordCount) {
    defaultWordCount = wc;
    localStorage.setItem('shamir_pref_word_count', String(wc));
  }

  function setLayout(lt: LayoutType) {
    defaultLayout = lt;
    localStorage.setItem('shamir_pref_layout', lt);
  }

  function setColor(color: string) {
    defaultColor = color;
    localStorage.setItem('shamir_pref_color', color);
  }

  function downloadExample(layoutKey: LayoutType) {
    const sampleShares = Array.from({ length: 3 }, (_, i) => ({
      v: 1 as const,
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Example Wallet',
      shareIndex: i + 1,
      totalShares: 3,
      threshold: 2,
      shareData: 'a'.repeat(64),
      derivationPath: "m/44'/60'/0'/0/{index}",
      pathType: 'metamask' as const,
      wordCount: 24 as const,
      hasPIN: false,
      hasPassphrase: false,
    }));

    const sampleAddresses = [
      { index: 0, address: '0x0000000000000000000000000000000000000000', privateKey: '' },
      { index: 1, address: '0x1111111111111111111111111111111111111111', privateKey: '' },
      { index: 2, address: '0x2222222222222222222222222222222222222222', privateKey: '' },
    ];
    const html = generatePrintHTML(sampleShares, defaultColor, layoutKey, sampleAddresses, false);
    downloadHTML(html, `example-${layoutKey}-${datetimeStamp()}.html`);
  }

  async function handleSetPassword() {
    if (passwordInput.length < 4) {
      passwordMessage = 'Password must be at least 4 characters';
      return;
    }
    if (passwordInput !== passwordConfirm) {
      passwordMessage = 'Passwords do not match';
      return;
    }
    await setVaultPassword(passwordInput);
    hasPassword = true;
    passwordInput = '';
    passwordConfirm = '';
    passwordMessage = 'Vault password set';
  }

  function handleRemovePassword() {
    removeVaultPassword();
    hasPassword = false;
    passwordMessage = 'Vault password removed';
  }

  function handleClearAllData() {
    if (!clearConfirm) {
      clearConfirm = true;
      return;
    }
    localStorage.clear();
    const delReq = indexedDB.deleteDatabase('shamir_vault');
    delReq.onsuccess = () => {
      clearMessage = 'All data cleared. Reload the page to reset.';
      clearConfirm = false;
    };
    delReq.onerror = () => {
      clearMessage = 'Failed to clear IndexedDB.';
      clearConfirm = false;
    };
  }
</script>

<div class="settings-panels">
  <Panel title="Default Word Count">
    <div class="word-count-buttons">
      {#each WORD_COUNTS as wc}
        <button class:primary={defaultWordCount === wc} onclick={() => setWordCount(wc)}>{wc}</button>
      {/each}
    </div>
  </Panel>

  <Panel title="Default PDF Layout">
    <div class="layout-options">
      {#each LAYOUTS as lt}
        <div class="layout-option">
          <button class="layout-btn" class:primary={defaultLayout === lt.key} onclick={() => setLayout(lt.key)}>
            <i class="fa-thin {lt.icon}"></i> {lt.label}
          </button>
          <span class="layout-desc text-xs text-muted">{lt.description}</span>
          <button class="layout-dl-icon" onclick={() => downloadExample(lt.key)} title="Download example">
            <i class="fa-thin fa-download"></i>
          </button>
        </div>
      {/each}
    </div>
  </Panel>

  <Panel title="Default Card Color">
    <div class="color-swatches">
      {#each COLORS as color}
        <button
          class="color-swatch"
          class:selected={defaultColor === color}
          style="background: {color};"
          onclick={() => setColor(color)}
          aria-label="Color {color}"
        ></button>
      {/each}
    </div>
  </Panel>

  <Panel title="Vault Password">
    <div class="vault-password-section">
      {#if hasPassword}
        <p class="text-sm mb-sm"><i class="fa-thin fa-lock"></i> Vault password is set.</p>
        <button onclick={handleRemovePassword} style="color: var(--color-error);">
          <i class="fa-thin fa-trash"></i> Remove Password
        </button>
      {:else}
        <p class="text-sm mb-sm">Set a password to protect your vault.</p>
        <input
          type="password"
          bind:value={passwordInput}
          placeholder="New password"
          style="width: 100%; max-width: 300px;"
          class="mb-sm"
        />
        <input
          type="password"
          bind:value={passwordConfirm}
          placeholder="Confirm password"
          style="width: 100%; max-width: 300px;"
          class="mb-sm"
        />
        <button class="primary" onclick={handleSetPassword}>Set Password</button>
      {/if}
      {#if passwordMessage}
        <p class="text-xs mt-sm text-muted">{passwordMessage}</p>
      {/if}
    </div>
  </Panel>

  <Panel title="Browser Storage">
    <div class="storage-section">
      <div class="storage-info mb-md">
        <div class="storage-row">
          <span class="text-xs text-muted">LOCAL STORAGE</span>
          <span class="text-xs">Preferences, settings, PIN hash</span>
        </div>
        <div class="storage-row">
          <span class="text-xs text-muted">INDEXEDDB</span>
          <span class="text-xs">Encrypted vault (AES-256-GCM)</span>
        </div>
        <div class="storage-row">
          <span class="text-xs text-muted">ENCRYPTION</span>
          <span class="text-xs">AES-256-GCM with browser-generated master key</span>
        </div>
      </div>

      <div class="clear-data-area">
        {#if clearConfirm}
          <p class="text-xs mb-sm" style="color: var(--color-error);">This will permanently delete ALL stored data including vault secrets. Are you sure?</p>
          <div class="clear-actions">
            <button onclick={() => { clearConfirm = false; }}>Cancel</button>
            <button onclick={handleClearAllData} style="color: var(--color-error);">
              <i class="fa-thin fa-trash"></i> Confirm Delete All
            </button>
          </div>
        {:else}
          <button onclick={handleClearAllData} style="color: var(--color-error);">
            <i class="fa-thin fa-trash"></i> Clear All Data
          </button>
        {/if}
        {#if clearMessage}
          <p class="text-xs mt-sm text-muted">{clearMessage}</p>
        {/if}
      </div>
    </div>
  </Panel>

  <Panel title="Download / Install">
    <div class="download-section">
      <h4 class="section-label">PROGRESSIVE WEB APP</h4>
      <p class="text-xs mb-sm">
        This app uses a <b>service worker</b> to cache all assets locally. After your first visit,
        the app works fully offline with no internet connection required.
      </p>
      <div class="install-steps mb-md">
        <div class="install-step">
          <span class="text-xs text-muted">CHROME / EDGE</span>
          <span class="text-xs">Click the install icon in the address bar, or Menu &rarr; Install App</span>
        </div>
        <div class="install-step">
          <span class="text-xs text-muted">SAFARI (iOS)</span>
          <span class="text-xs">Tap Share &rarr; Add to Home Screen</span>
        </div>
        <div class="install-step">
          <span class="text-xs text-muted">FIREFOX</span>
          <span class="text-xs">Firefox does not support PWA install &mdash; use the standalone HTML below</span>
        </div>
      </div>

      <h4 class="section-label">STANDALONE HTML</h4>
      <p class="text-xs mb-sm">
        Download the entire app as a single HTML file (571 KB). No installation, no dependencies &mdash;
        open it in any browser for fully offline use. Includes all code, styles, and fonts inlined.
      </p>
      <a href="/n-of-m-standalone.html" download="n-of-m-standalone.html" class="download-btn">
        <i class="fa-thin fa-download"></i> Download Standalone HTML
      </a>
    </div>
  </Panel>

  <Panel title="About">
    <div class="about-section">
      <p class="text-sm"><b>n-of-m</b> v{VERSION}</p>
      <p class="text-xs text-muted mt-xs">Shamir's Secret Sharing for Seed Phrases</p>
      <p class="text-xs text-muted mt-xs">Fully offline. No network requests. All cryptographic operations run entirely in your browser.</p>

      <button class="algo-toggle mt-md" onclick={() => { showAlgoDetail = !showAlgoDetail; }}>
        <i class="fa-thin {showAlgoDetail ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
        {showAlgoDetail ? 'Hide cryptographic details' : 'Cryptographic details'}
      </button>

      {#if showAlgoDetail}
        <div class="algo-detail mt-sm">
          <div class="algo-item">
            <h4 class="algo-label">SECRET SPLITTING</h4>
            <p>Shamir's Secret Sharing over <code>GF(2^8)</code>. The secret is split byte-by-byte into shares using random polynomials of degree <code>t-1</code> where <code>t</code> is the threshold. Reconstruction uses Lagrange interpolation. Information-theoretically secure: fewer than <code>t</code> shares reveal zero information.</p>
          </div>
          <div class="algo-item">
            <h4 class="algo-label">VAULT ENCRYPTION</h4>
            <p><code>AES-256-GCM</code> with a 256-bit key derived from the master key. Provides authenticated encryption &mdash; any tampering with the ciphertext is detected. The master key is generated from <code>crypto.getRandomValues()</code> (browser CSPRNG) and stored in IndexedDB.</p>
          </div>
          <div class="algo-item">
            <h4 class="algo-label">KEY DERIVATION</h4>
            <p><code>PBKDF2-SHA256</code> with 100,000 iterations for vault password hashing. Salted with a random 16-byte value. Prevents brute-force attacks on the vault password.</p>
          </div>
          <div class="algo-item">
            <h4 class="algo-label">WALLET DERIVATION</h4>
            <p><code>BIP39</code> mnemonic generation with configurable word counts (128-256 bits of entropy). <code>BIP44</code> hierarchical deterministic key derivation for address generation. Supports MetaMask and Ledger derivation paths.</p>
          </div>
          <div class="algo-item">
            <h4 class="algo-label">ENTROPY</h4>
            <p>Primary entropy from <code>crypto.getRandomValues()</code> (CSPRNG). Optional mouse-movement entropy mixed via SHA-256 for additional randomness. All entropy operations run locally in the browser.</p>
          </div>
        </div>
      {/if}

      <div class="mt-md">
        <h4 class="section-label">BUILT WITH</h4>
        <div class="credits-container">
          <div class="credits-list">
            <a class="credit-item" href="https://github.com/sveltejs/svelte" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge"><i class="fab fa-svelte"></i> svelte</span>
              <span class="credit-tooltip">Rich Harris</span>
            </a>
            <a class="credit-item" href="https://github.com/sveltejs/kit" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">sveltekit</span>
              <span class="credit-tooltip">Rich Harris</span>
            </a>
            <a class="credit-item" href="https://github.com/vitejs/vite" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">vite</span>
              <span class="credit-tooltip">Evan You</span>
            </a>
            <a class="credit-item" href="https://github.com/ethers-io/ethers.js" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">ethers</span>
              <span class="credit-tooltip">Richard Moore</span>
            </a>
            <a class="credit-item" href="https://github.com/paulmillr/noble-ciphers" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">@noble/ciphers</span>
              <span class="credit-tooltip">Paul Miller</span>
            </a>
            <a class="credit-item" href="https://github.com/nimiq/qr-scanner" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">qr-scanner</span>
              <span class="credit-tooltip">Nimiq</span>
            </a>
            <a class="credit-item" href="https://github.com/cozmo/jsQR" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">jsqr</span>
              <span class="credit-tooltip">Cosmo Wolfe</span>
            </a>
            <a class="credit-item" href="https://github.com/neocotic/qrious" target="_blank" rel="noopener">
              <span class="badge badge-info credit-badge">qrious</span>
              <span class="credit-tooltip">neocotic</span>
            </a>
          </div>
        </div>
      </div>

      <div class="mt-md about-links">
        <p class="text-xs">
          <a href="https://github.com/tankbottoms/n-of-m-web" target="_blank" rel="noopener">
            <i class="fa-thin fa-code-branch"></i> Source on GitHub
          </a>
          &middot; MIT License
        </p>
      </div>
    </div>
  </Panel>
</div>

<style>
  .settings-panels {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .word-count-buttons {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .layout-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .layout-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .layout-btn {
    min-width: 140px;
    text-align: left;
  }
  @media (max-width: 480px) {
    .layout-btn {
      min-width: 110px;
      flex: 1;
    }
  }
  .layout-desc {
    flex: 1;
  }
  .layout-dl-icon {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.3rem;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: none;
  }
  .layout-dl-icon:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .color-swatches {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .color-swatch {
    width: 32px;
    height: 32px;
    border: 2px solid var(--color-border);
    padding: 0;
    min-width: 0;
    box-shadow: 1px 1px 0px var(--color-shadow);
  }
  .color-swatch.selected {
    border-color: var(--color-border-dark);
    box-shadow: 3px 3px 0px var(--color-shadow);
    transform: translate(-1px, -1px);
  }
  .algo-toggle {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: none;
    letter-spacing: 0;
  }
  .algo-toggle:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .algo-toggle i {
    margin-right: 0.25rem;
  }
  .algo-detail {
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    padding: var(--spacing-sm) var(--spacing-md);
  }
  .algo-item {
    margin-bottom: var(--spacing-sm);
  }
  .algo-item:last-child {
    margin-bottom: 0;
  }
  .algo-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.2rem;
    font-weight: 600;
  }
  .algo-item p {
    font-size: 0.75rem;
    line-height: 1.5;
  }
  .algo-item code {
    font-size: 0.7rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.25rem;
    border: 1px solid var(--color-border);
  }
  .section-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin-bottom: 0.4rem;
    font-weight: 600;
  }
  .install-steps {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .install-step {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-border);
  }
  .install-step:last-child {
    border-bottom: none;
  }
  .install-step span:first-child {
    flex-shrink: 0;
    min-width: 7rem;
  }
  .credits-container {
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    padding: var(--spacing-sm) var(--spacing-md);
  }
  .credits-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .credit-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    text-decoration: none;
    color: inherit;
    padding: 0.15rem 0;
    width: fit-content;
  }
  .credit-item:hover {
    opacity: 0.8;
  }
  .credit-badge {
    font-size: 0.7rem;
    white-space: nowrap;
  }
  .credit-badge i {
    margin-right: 0.15rem;
  }
  .credit-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 0.5rem);
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.6rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    pointer-events: none;
  }
  .credit-item:hover .credit-tooltip {
    display: block;
  }
  .about-links a {
    color: var(--color-link);
    text-decoration: none;
  }
  .about-links a:hover {
    text-decoration: underline;
  }
  .storage-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-border);
  }
  .storage-row:last-child {
    border-bottom: none;
  }
  .clear-actions {
    display: flex;
    gap: 0.5rem;
  }
  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border: 2px solid var(--color-border-dark);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-decoration: none;
    box-shadow: 2px 2px 0px var(--color-shadow);
    cursor: pointer;
  }
  .download-btn:hover {
    box-shadow: 3px 3px 0px var(--color-shadow);
    transform: translate(-1px, -1px);
  }
</style>

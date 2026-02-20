<script lang="ts">
  import type { WordCount } from '$lib/types';
  import type { LayoutType } from '$lib/pdf';
  import { generatePrintHTML, downloadHTML } from '$lib/pdf';
  import { setVaultPassword, hasVaultPassword, removeVaultPassword } from '$lib/storage';
  import Panel from './Panel.svelte';

  const WORD_COUNTS: WordCount[] = [12, 15, 18, 21, 24];
  const LAYOUTS: { key: LayoutType; label: string; icon: string; description: string }[] = [
    { key: 'full-page', label: 'Full Page', icon: 'fa-file', description: 'One card per page' },
    { key: '2-up', label: 'Compact', icon: 'fa-columns', description: 'Two cards per page' },
    { key: 'wallet-size', label: 'Wallet Size', icon: 'fa-credit-card', description: 'Four cards per page' },
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
    // Generate a sample share set for preview
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

    const html = generatePrintHTML(sampleShares, defaultColor, layoutKey, '0x0000000000000000000000000000000000000000');
    downloadHTML(html, `example-${layoutKey}.html`);
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

  <Panel title="About">
    <div class="about-section">
      <p class="text-sm"><b>n of m</b> v0.1.0</p>
      <p class="text-xs text-muted mt-xs">Shamir's Secret Sharing for Seed Phrases</p>
      <p class="text-xs text-muted mt-xs">Fully offline. No network requests. All crypto runs in your browser.</p>
      <p class="text-xs text-muted mt-sm">
        AES-256-GCM encryption · PBKDF2-SHA256 key derivation · BIP39/BIP44 wallet support ·
        GF(2^8) Shamir splitting · IndexedDB encrypted vault
      </p>
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
</style>

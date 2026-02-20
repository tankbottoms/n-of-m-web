<script lang="ts">
  import { v4 as uuid } from 'uuid';
  import { Buffer } from 'buffer';
  import type { WordCount, PathType, DerivedAddress, SharePayload, SecretRecord } from '$lib/types';
  import type { LogEntry } from './TerminalLog.svelte';
  import { MotionCollector } from '$lib/entropy/motion';
  import { mixEntropy } from '$lib/entropy/mix';
  import { generateMnemonic, validateMnemonic } from '$lib/wallet';
  import { deriveAddresses } from '$lib/wallet';
  import { DERIVATION_PATHS, getDerivationPath } from '$lib/derivation';
  import { split } from '$lib/shamir';
  import { saveSecret } from '$lib/storage';
  import { generatePrintHTML, printCards, downloadHTML } from '$lib/pdf';
  import type { LayoutType } from '$lib/pdf';
  import StepIndicator from './StepIndicator.svelte';
  import Panel from './Panel.svelte';
  import MnemonicGrid from './MnemonicGrid.svelte';
  import EntropyCanvas from './EntropyCanvas.svelte';
  import PathEditor from './PathEditor.svelte';
  import AddressTable from './AddressTable.svelte';
  import ShareCard from './ShareCard.svelte';
  import PinInput from './PinInput.svelte';
  import TerminalLog from './TerminalLog.svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  const STEPS = [
    { label: 'Words', key: 'words' },
    { label: 'Entropy', key: 'entropy' },
    { label: 'Mnemonic', key: 'mnemonic' },
    { label: 'Derivation', key: 'derivation' },
    { label: 'Shamir', key: 'shamir' },
    { label: 'Metadata', key: 'metadata' },
    { label: 'Preview', key: 'preview' },
  ];

  let currentStep = $state<string>('words');
  let completedSteps = $state<string[]>([]);

  // Step 1: Word Count
  let wordCount = $state<WordCount>(24);
  let importMode = $state(false);
  let importText = $state('');

  // Step 2: Entropy
  let entropyMode = $state<'system' | 'motion' | 'combined'>('system');
  let collector = $state(new MotionCollector());
  let motionDone = $state(false);

  // Step 3: Mnemonic
  let mnemonic = $state('');
  let mnemonicWords = $derived(mnemonic ? mnemonic.split(' ') : []);
  let masked = $state(true);

  // Step 4: Derivation
  let pathType = $state<PathType>('metamask');
  let customPath = $state("m/44'/60'/0'/0/{index}");
  let addressCount = $state(5);
  let addresses = $state<DerivedAddress[]>([]);

  // Step 5: Shamir
  let threshold = $state(3);
  let totalShares = $state(5);

  // Step 6: Metadata
  let secretName = $state('');
  let pin = $state('');
  let passphrase = $state('');
  let highlightColor = $state('#A8D8EA');

  // Step 7: Preview
  let shares = $state<SharePayload[]>([]);
  let layoutType = $state<LayoutType>('full-page');
  let logEntries = $state<LogEntry[]>([]);
  let saving = $state(false);

  const COLORS = ['#A8D8EA', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#F8E6E0', '#D5C4F8'];
  const WORD_COUNTS: WordCount[] = [12, 15, 18, 21, 24];

  function log(text: string, type: LogEntry['type'] = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logEntries = [...logEntries, { text, type, time }];
  }

  function completeStep(step: string) {
    if (!completedSteps.includes(step)) {
      completedSteps = [...completedSteps, step];
    }
  }

  function nextStep() {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) {
      completeStep(currentStep);
      currentStep = STEPS[idx + 1].key;
    }
  }

  function prevStep() {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) {
      currentStep = STEPS[idx - 1].key;
    }
  }

  async function generateOrImportMnemonic() {
    if (importMode) {
      const trimmed = importText.trim().toLowerCase();
      if (!validateMnemonic(trimmed)) {
        log('Invalid mnemonic phrase', 'error');
        return;
      }
      mnemonic = trimmed;
      wordCount = trimmed.split(' ').length as WordCount;
      log(`Imported ${wordCount}-word mnemonic`, 'found');
    } else {
      if (entropyMode === 'motion' || entropyMode === 'combined') {
        const motionBytes = collector.toEntropy();
        const mixed = await mixEntropy(motionBytes);
        mnemonic = generateMnemonic(wordCount, mixed);
        log(`Generated ${wordCount}-word mnemonic with mouse entropy`, 'found');
      } else {
        mnemonic = generateMnemonic(wordCount);
        log(`Generated ${wordCount}-word mnemonic with system CSPRNG`, 'found');
      }
    }
    nextStep();
  }

  function deriveAddrs() {
    log(`Deriving ${addressCount} addresses via ${pathType}...`, 'fetch');
    addresses = deriveAddresses(mnemonic, pathType, addressCount, customPath, passphrase || undefined);
    log(`Derived ${addresses.length} addresses`, 'found');
    nextStep();
  }

  function generateShares() {
    log(`Splitting secret into ${totalShares} shares (threshold: ${threshold})...`, 'fetch');
    const secretBuf = Buffer.from(mnemonic);
    const rawShares = split(secretBuf, { shares: totalShares, threshold });
    const id = uuid();
    const name = secretName || `Secret ${new Date().toLocaleDateString()}`;

    shares = rawShares.map((raw, i) => ({
      v: 1 as const,
      id,
      name,
      shareIndex: i + 1,
      totalShares,
      threshold,
      shareData: raw.toString('hex'),
      derivationPath: pathType === 'custom' ? customPath : DERIVATION_PATHS[pathType].template,
      pathType,
      wordCount,
      hasPIN: pin.length > 0,
      hasPassphrase: passphrase.length > 0,
    }));

    log(`Generated ${shares.length} share cards`, 'found');
    nextStep();
  }

  async function saveToVault() {
    if (saving) return;
    saving = true;
    log('Saving to vault...', 'fetch');

    const record: SecretRecord = {
      id: shares[0].id,
      name: shares[0].name,
      createdAt: Date.now(),
      mnemonic,
      wordCount,
      derivationPath: shares[0].derivationPath,
      pathType,
      addressCount,
      addresses,
      shamirConfig: { threshold, totalShares },
      hasPassphrase: passphrase.length > 0,
      hasPIN: pin.length > 0,
    };

    await saveSecret(record);
    log('Saved to vault', 'found');
    saving = false;
  }

  function handlePrint() {
    const html = generatePrintHTML(shares, highlightColor, layoutType, addresses[0]?.address);
    printCards(html);
    log('Print dialog opened', 'info');
  }

  function handleDownload() {
    const html = generatePrintHTML(shares, highlightColor, layoutType, addresses[0]?.address);
    downloadHTML(html, `shamir-cards-${shares[0]?.name || 'export'}.html`);
    log('Downloaded HTML file', 'found');
  }
</script>

<StepIndicator steps={STEPS} {currentStep} {completedSteps} />

{#if currentStep === 'words'}
  <Panel title="Word Count">
    <div class="step-content">
      <div class="toggle-row mb-md">
        <button class:primary={!importMode} onclick={() => { importMode = false; }}>Generate New</button>
        <button class:primary={importMode} onclick={() => { importMode = true; }}>Import Existing</button>
      </div>

      {#if importMode}
        <textarea
          bind:value={importText}
          placeholder="Enter your seed phrase words separated by spaces..."
          rows={4}
          style="width: 100%;"
        ></textarea>
        <p class="text-xs text-muted mt-sm">Paste your existing mnemonic to split it with Shamir's.</p>
      {:else}
        <div class="word-count-buttons">
          {#each WORD_COUNTS as wc}
            <button class:primary={wordCount === wc} onclick={() => { wordCount = wc; }}>{wc}</button>
          {/each}
        </div>
        <p class="text-xs text-muted mt-sm">
          {wordCount} words = {wordCount === 12 ? 128 : wordCount === 15 ? 160 : wordCount === 18 ? 192 : wordCount === 21 ? 224 : 256} bits of entropy.
          24 words recommended.
        </p>
      {/if}

      <div class="step-nav mt-lg">
        <span></span>
        <button class="primary" onclick={nextStep}>Next <i class="fa-thin fa-arrow-right"></i></button>
      </div>
    </div>
  </Panel>

{:else if currentStep === 'entropy'}
  <Panel title="Entropy Source">
    <div class="step-content">
      {#if importMode}
        <p class="text-muted">Importing existing phrase -- entropy collection not needed.</p>
      {:else}
        <div class="toggle-row mb-md">
          <button class:primary={entropyMode === 'system'} onclick={() => { entropyMode = 'system'; }}>System Only</button>
          <button class:primary={entropyMode === 'combined'} onclick={() => { entropyMode = 'combined'; }}>Mouse + System</button>
        </div>

        {#if entropyMode === 'combined' || entropyMode === 'motion'}
          <EntropyCanvas {collector} onComplete={() => { motionDone = true; }} />
        {:else}
          <div class="system-entropy-info">
            <p class="text-sm">Using browser's <code>crypto.getRandomValues()</code> -- cryptographically secure.</p>
          </div>
        {/if}
      {/if}

      <div class="step-nav mt-lg">
        <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
        <button
          class="primary"
          onclick={generateOrImportMnemonic}
          disabled={entropyMode === 'combined' && !motionDone && !importMode}
        >
          {importMode ? 'Import' : 'Generate'} <i class="fa-thin fa-arrow-right"></i>
        </button>
      </div>
    </div>
  </Panel>

{:else if currentStep === 'mnemonic'}
  <Panel title="Seed Phrase">
    <div class="step-content">
      <div class="mnemonic-controls mb-md">
        <button onclick={() => { masked = !masked; }}>
          <i class="fa-thin {masked ? 'fa-eye' : 'fa-eye-slash'}"></i>
          {masked ? 'Reveal' : 'Hide'}
        </button>
        <button onclick={() => { navigator.clipboard.writeText(mnemonic); }}>
          <i class="fa-thin fa-copy"></i> Copy
        </button>
      </div>
      <MnemonicGrid words={mnemonicWords} {masked} />
      <p class="text-xs text-muted mt-md">
        {wordCount} words. Write these down and store securely -- or continue to split with Shamir's.
      </p>

      <div class="step-nav mt-lg">
        <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
        <button class="primary" onclick={nextStep}>Next <i class="fa-thin fa-arrow-right"></i></button>
      </div>
    </div>
  </Panel>

{:else if currentStep === 'derivation'}
  <Panel title="Derivation Path">
    <div class="step-content">
      <PathEditor bind:pathType bind:customPath />

      <div class="address-count-row mt-md">
        <label class="text-xs text-muted">ADDRESSES TO DERIVE</label>
        <input type="number" min={1} max={50} bind:value={addressCount} style="width: 80px;" />
      </div>

      <div class="passphrase-row mt-md">
        <label class="text-xs text-muted">BIP39 PASSPHRASE (OPTIONAL)</label>
        <input type="password" bind:value={passphrase} placeholder="Leave blank for standard derivation" style="width: 100%;" />
      </div>

      <div class="step-nav mt-lg">
        <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
        <button class="primary" onclick={deriveAddrs}>Derive <i class="fa-thin fa-arrow-right"></i></button>
      </div>
    </div>
  </Panel>

  {#if addresses.length > 0}
    <Panel title="Derived Addresses">
      <AddressTable {addresses} showPrivateKeys />
    </Panel>
  {/if}

{:else if currentStep === 'shamir'}
  <Panel title="Shamir Configuration">
    <div class="step-content">
      <div class="shamir-config">
        <div class="config-row">
          <label class="text-xs text-muted">TOTAL SHARES (M)</label>
          <input type="number" min={2} max={255} bind:value={totalShares} style="width: 80px;" />
        </div>
        <div class="config-row">
          <label class="text-xs text-muted">THRESHOLD (N)</label>
          <input type="number" min={2} max={totalShares} bind:value={threshold} style="width: 80px;" />
        </div>
      </div>
      <p class="text-xs text-muted mt-sm">
        Any <b>{threshold}</b> of <b>{totalShares}</b> shares can reconstruct the secret.
        {totalShares - threshold} shares can be lost without losing access.
      </p>

      {#if threshold > totalShares}
        <p class="text-xs mt-sm" style="color: var(--color-error);">Threshold cannot exceed total shares.</p>
      {/if}

      <div class="step-nav mt-lg">
        <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
        <button class="primary" onclick={nextStep} disabled={threshold > totalShares || threshold < 2}>
          Next <i class="fa-thin fa-arrow-right"></i>
        </button>
      </div>
    </div>
  </Panel>

{:else if currentStep === 'metadata'}
  <Panel title="Metadata & Security">
    <div class="step-content">
      <div class="config-row mb-md">
        <label class="text-xs text-muted">SECRET NAME</label>
        <input type="text" bind:value={secretName} placeholder="My Wallet Backup" style="width: 100%;" />
      </div>

      <div class="config-row mb-md">
        <label class="text-xs text-muted">PIN PROTECTION (OPTIONAL, 6 DIGITS)</label>
        <PinInput bind:value={pin} />
      </div>

      <div class="config-row mb-md">
        <label class="text-xs text-muted">CARD HIGHLIGHT COLOR</label>
        <div class="color-swatches">
          {#each COLORS as color}
            <button
              class="color-swatch"
              class:selected={highlightColor === color}
              style="background: {color};"
              onclick={() => { highlightColor = color; }}
              aria-label="Color {color}"
            ></button>
          {/each}
        </div>
      </div>

      <div class="step-nav mt-lg">
        <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
        <button class="primary" onclick={generateShares}>Generate Shares <i class="fa-thin fa-arrow-right"></i></button>
      </div>
    </div>
  </Panel>

{:else if currentStep === 'preview'}
  <Panel title="Share Cards Preview">
    <div class="step-content">
      <div class="preview-actions mb-md">
        <button class="primary" onclick={handlePrint}>
          <i class="fa-thin fa-print"></i> Print Cards
        </button>
        <button onclick={handleDownload}>
          <i class="fa-thin fa-download"></i> Download HTML
        </button>
        <button onclick={saveToVault} disabled={saving}>
          <i class="fa-thin fa-vault"></i> {saving ? 'Saving...' : 'Save to Vault'}
        </button>
      </div>

      <div class="layout-toggle mb-md">
        <span class="text-xs text-muted">LAYOUT: </span>
        <button class:primary={layoutType === 'full-page'} onclick={() => { layoutType = 'full-page'; }}>Full</button>
        <button class:primary={layoutType === '2-up'} onclick={() => { layoutType = '2-up'; }}>Compact</button>
        <button class:primary={layoutType === 'wallet-size'} onclick={() => { layoutType = 'wallet-size'; }}>Wallet</button>
      </div>

      <div class="share-cards-grid">
        {#each shares as share}
          <ShareCard {share} {highlightColor} />
        {/each}
      </div>

      {#if logEntries.length > 0}
        <div class="mt-md">
          <TerminalLog entries={logEntries} />
        </div>
      {/if}

      <div class="step-nav mt-lg">
        <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
        <button class="primary" onclick={onComplete}>
          <i class="fa-thin fa-check"></i> Done
        </button>
      </div>
    </div>
  </Panel>
{/if}

<style>
  .step-content {
    /* content wrapper */
  }
  .step-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .toggle-row, .word-count-buttons {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .mnemonic-controls {
    display: flex;
    gap: 0.35rem;
  }
  .config-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .shamir-config {
    display: flex;
    gap: var(--spacing-lg);
  }
  .address-count-row, .passphrase-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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
  .preview-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .layout-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .share-cards-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .system-entropy-info {
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
</style>

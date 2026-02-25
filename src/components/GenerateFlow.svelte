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
  import { saveSecret, getAllSecrets } from '$lib/storage';
  import { generatePrintHTML, printCards, downloadHTML, datetimeStamp } from '$lib/pdf';
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
  let addressCount = $state(10);
  let addresses = $state<DerivedAddress[]>([]);
  let passphrase = $state('');

  // Step 5: Shamir
  let threshold = $state(3);
  let totalShares = $state(5);

  // Step 6: Metadata
  let secretName = $state('');
  let pin = $state('');
  let highlightColor = $state('#A8D8EA');
  let notes = $state('');

  // Step 7: Preview
  let shares = $state<SharePayload[]>([]);
  let layoutType = $state<LayoutType>('full-page');
  let logEntries = $state<LogEntry[]>([]);
  let saving = $state(false);
  let vaultSaved = $state<{ name: string; datetime: string; index: number } | null>(null);
  let ghostActive = $state(false);

  // Confirmation popups
  let showPassphraseConfirm = $state(false);
  let showPinConfirm = $state(false);
  let pinConfirmValue = $state('');
  let pinConfirmError = $state('');
  let passphraseVisible = $state(false);
  let confirmPassphraseVisible = $state(false);

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
      completedSteps = completedSteps.filter(s => s !== STEPS[idx - 1].key);
      currentStep = STEPS[idx - 1].key;
    }
  }

  async function generateOrImportMnemonic() {
    if (importMode) {
      const trimmed = importText.trim().toLowerCase();
      log(`Validating imported mnemonic...`, 'fetch');
      if (!validateMnemonic(trimmed)) {
        log('Invalid mnemonic phrase -- checksum mismatch or invalid words', 'error');
        return;
      }
      mnemonic = trimmed;
      wordCount = trimmed.split(' ').length as WordCount;
      const bits = wordCount === 12 ? 128 : wordCount === 15 ? 160 : wordCount === 18 ? 192 : wordCount === 21 ? 224 : 256;
      log(`Validated ${wordCount}-word mnemonic (${bits}-bit entropy, checksum OK)`, 'found');
      log(`BIP39 word list: english (2048 words)`, 'info');
    } else {
      const bits = wordCount === 12 ? 128 : wordCount === 15 ? 160 : wordCount === 18 ? 192 : wordCount === 21 ? 224 : 256;
      const checksumBits = bits / 32;
      if (entropyMode === 'motion' || entropyMode === 'combined') {
        log(`Collecting mouse entropy bytes...`, 'fetch');
        const motionBytes = collector.toEntropy();
        log(`Mouse entropy: ${motionBytes.length} bytes collected`, 'info');
        log(`Mixing with system CSPRNG via SHA-256...`, 'fetch');
        const mixed = await mixEntropy(motionBytes);
        log(`Mixed entropy: ${bits} bits + ${checksumBits}-bit checksum = ${bits + checksumBits} total bits`, 'info');
        mnemonic = generateMnemonic(wordCount, mixed);
        log(`Generated ${wordCount}-word mnemonic (mouse+system entropy)`, 'found');
      } else {
        log(`Requesting ${bits} bits from crypto.getRandomValues()...`, 'fetch');
        mnemonic = generateMnemonic(wordCount);
        log(`System CSPRNG: ${bits}-bit entropy + ${checksumBits}-bit SHA-256 checksum`, 'info');
        log(`Generated ${wordCount}-word mnemonic (${bits} bits, BIP39 english)`, 'found');
      }
      log(`Encoding: ${wordCount} words from BIP39 word list (2048 entries)`, 'info');
    }
    nextStep();
  }

  function handleDeriveClick() {
    if (passphrase.trim()) {
      showPassphraseConfirm = true;
      confirmPassphraseVisible = false;
    } else {
      deriveAddrs();
    }
  }

  function deriveAddrs() {
    showPassphraseConfirm = false;
    const path = pathType === 'custom' ? customPath : DERIVATION_PATHS[pathType].template;
    log(`Deriving ${addressCount} addresses via ${formatPathLabel(pathType)}...`, 'fetch');
    log(`Path template: ${path}`, 'info');
    if (passphrase) log(`BIP39 passphrase: enabled (${passphrase.length} chars)`, 'info');
    addresses = deriveAddresses(mnemonic, pathType, addressCount, customPath, passphrase || undefined);
    log(`Derived ${addresses.length} addresses (HMAC-SHA512 → secp256k1)`, 'found');
    if (addresses.length > 0) log(`First address: ${addresses[0].address.slice(0, 10)}...${addresses[0].address.slice(-6)}`, 'info');
    nextStep();
  }

  function formatPathLabel(pt: PathType): string {
    if (pt === 'metamask') return 'MetaMask (BIP44)';
    if (pt === 'ledger') return 'Ledger (BIP44)';
    return 'Custom';
  }

  function handleGenerateSharesClick() {
    if (pin.length > 0) {
      showPinConfirm = true;
      pinConfirmValue = '';
      pinConfirmError = '';
    } else {
      generateShares();
    }
  }

  function confirmPin() {
    if (pinConfirmValue !== pin) {
      pinConfirmError = 'PIN does not match. Try again.';
      pinConfirmValue = '';
      return;
    }
    showPinConfirm = false;
    generateShares();
  }

  function generateShares() {
    log(`Splitting secret into ${totalShares} shares (threshold: ${threshold})...`, 'fetch');
    const secretBuf = Buffer.from(mnemonic);
    log(`Secret: ${secretBuf.length} bytes → GF(2^8) polynomial degree ${threshold - 1}`, 'info');
    const rawShares = split(secretBuf, { shares: totalShares, threshold });
    log(`Shamir split complete: ${rawShares.length} shares × ${rawShares[0]?.length || 0} bytes each`, 'info');
    const id = uuid();
    const name = secretName || datetimeStamp();

    const metadata: Record<string, string> = {};
    if (notes.trim()) metadata.notes = notes.trim();

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
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
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

    const vaultMetadata: Record<string, string> = {};
    if (notes.trim()) vaultMetadata.notes = notes.trim();

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
      metadata: Object.keys(vaultMetadata).length > 0 ? vaultMetadata : undefined,
      hasPassphrase: passphrase.length > 0,
      hasPIN: pin.length > 0,
    };

    await saveSecret(record);
    const allSecrets = await getAllSecrets();
    const vaultIndex = allSecrets.findIndex(s => s.id === record.id) + 1;
    const dt = new Date();
    const dtStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    ghostActive = true;
    setTimeout(() => { ghostActive = false; }, 800);
    vaultSaved = { name: record.name, datetime: dtStr, index: vaultIndex };
    setTimeout(() => { vaultSaved = null; }, 4000);
    log('Saved to vault', 'found');
    saving = false;
  }

  function handlePrint() {
    const html = generatePrintHTML(shares, highlightColor, layoutType, addresses, true);
    printCards(html);
    log('Print dialog opened', 'info');
  }

  function handleDownload() {
    const html = generatePrintHTML(shares, highlightColor, layoutType, addresses, false);
    downloadHTML(html, `shamir-cards-${shares[0]?.name || 'export'}-${datetimeStamp()}.html`);
    log('Downloaded HTML file', 'found');
  }
</script>

<div class="generate-flow">
  <StepIndicator steps={STEPS} {currentStep} {completedSteps} />

  <div class="step-wrapper">
    {#if currentStep === 'words'}
      <Panel title="Word Count">
        <div class="step-content">
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            Choose how many words for your seed phrase, or import an existing one to split with Shamir's Secret Sharing.
          </div>

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
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            {#if importMode}
              Importing an existing phrase -- entropy collection is not needed.
            {:else}
              Select how randomness is generated. System CSPRNG is cryptographically secure. Mouse entropy adds an additional source mixed with system randomness.
            {/if}
          </div>

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
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            Your {wordCount}-word seed phrase has been generated. You can reveal it, copy it, or continue to the next step to derive wallet addresses.
          </div>

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

          <div class="step-nav mt-lg">
            <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
            <button class="primary" onclick={nextStep}>Next <i class="fa-thin fa-arrow-right"></i></button>
          </div>
        </div>
      </Panel>

    {:else if currentStep === 'derivation'}
      <Panel title="Derivation Path">
        <div class="step-content">
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            Choose a derivation path to generate wallet addresses from your seed phrase. MetaMask is the most common for Ethereum wallets.
          </div>

          <PathEditor bind:pathType bind:customPath />

          <div class="address-count-row mt-md">
            <label for="address-count" class="text-xs text-muted">ADDRESSES TO DERIVE</label>
            <input id="address-count" type="number" min={1} max={50} bind:value={addressCount} style="width: 80px;" />
          </div>

          <div class="passphrase-row mt-md">
            <label for="passphrase" class="text-xs text-muted">BIP39 PASSPHRASE (OPTIONAL)</label>
            <div class="input-with-toggle">
              <input id="passphrase" type={passphraseVisible ? 'text' : 'password'} bind:value={passphrase} placeholder="Leave blank for standard derivation" style="width: 100%;" />
              <button class="input-toggle-btn" onclick={() => { passphraseVisible = !passphraseVisible; }} title={passphraseVisible ? 'Hide passphrase' : 'Show passphrase'} type="button">
                <i class="fa-thin {passphraseVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
              </button>
            </div>
          </div>

          {#if showPassphraseConfirm}
            <button class="popup-overlay" onclick={() => { showPassphraseConfirm = false; }} aria-label="Close"></button>
            <div class="confirm-popup">
              <h4 class="text-xs text-muted mb-sm">CONFIRM BIP39 PASSPHRASE</h4>
              <p class="text-xs mb-sm" style="color: var(--color-warning);">
                Recovery of this seed phrase will be <b>impossible</b> without this exact passphrase. Document it securely.
              </p>
              <div class="confirm-passphrase-display">
                <span class="confirm-value">{confirmPassphraseVisible ? passphrase : '*'.repeat(passphrase.length)}</span>
                <button class="input-toggle-btn" onclick={() => { confirmPassphraseVisible = !confirmPassphraseVisible; }} type="button" aria-label={confirmPassphraseVisible ? 'Hide passphrase' : 'Show passphrase'}>
                  <i class="fa-thin {confirmPassphraseVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
              </div>
              <div class="popup-actions mt-md">
                <button onclick={() => { showPassphraseConfirm = false; }}>Cancel</button>
                <button class="primary" onclick={deriveAddrs}>
                  <i class="fa-thin fa-check"></i> Confirm &amp; Derive
                </button>
              </div>
            </div>
          {/if}

          <div class="step-nav mt-lg">
            <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
            <button class="primary" onclick={handleDeriveClick}>Derive <i class="fa-thin fa-arrow-right"></i></button>
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
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            Configure how many total share cards to create (M) and how many are needed to reconstruct the secret (N). For example, 3-of-5 means any 3 cards can recover the full phrase.
          </div>

          <div class="shamir-config">
            <div class="config-row">
              <label for="threshold" class="text-xs text-muted">THRESHOLD (N)</label>
              <input id="threshold" type="number" min={2} max={totalShares} bind:value={threshold} style="width: 80px;" />
            </div>
            <div class="config-row">
              <label for="total-shares" class="text-xs text-muted">TOTAL SHARES (M)</label>
              <input id="total-shares" type="number" min={2} max={255} bind:value={totalShares} style="width: 80px;" />
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
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            Name your secret for identification, optionally set a PIN for extra protection, and choose a highlight color for the printed share cards.
          </div>

          <div class="config-row mb-md">
            <label for="secret-name" class="text-xs text-muted">SECRET NAME</label>
            <input id="secret-name" type="text" bind:value={secretName} placeholder={datetimeStamp()} style="width: 100%;" />
          </div>

          <div class="config-row mb-md">
            <span class="text-xs text-muted" id="pin-label">PIN PROTECTION (OPTIONAL, 6 DIGITS)</span>
            <div aria-labelledby="pin-label">
              <PinInput bind:value={pin} />
            </div>
          </div>

          <div class="config-row mb-md">
            <label for="notes" class="text-xs text-muted">NOTES (OPTIONAL)</label>
            <textarea
              id="notes"
              bind:value={notes}
              placeholder="Ancillary info: wallet label, purpose, instructions..."
              rows={3}
              maxlength={2900}
              style="width: 100%;"
            ></textarea>
            {#if notes.length > 0}
              <p class="text-xs text-muted">{notes.length}/2900 chars -- large notes increase QR code density</p>
            {/if}
          </div>

          <div class="config-row mb-md">
            <span class="text-xs text-muted" id="color-label">CARD HIGHLIGHT COLOR</span>
            <div class="color-swatches" role="radiogroup" aria-labelledby="color-label">
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

          {#if showPinConfirm}
            <button class="popup-overlay" onclick={() => { showPinConfirm = false; }} aria-label="Close"></button>
            <div class="confirm-popup">
              <h4 class="text-xs text-muted mb-sm">CONFIRM PIN</h4>
              <p class="text-xs mb-sm" style="color: var(--color-warning);">
                Re-enter your 6-digit PIN to confirm. You will need this PIN to recover shares.
              </p>
              <PinInput bind:value={pinConfirmValue} onComplete={confirmPin} />
              {#if pinConfirmError}
                <p class="text-xs mt-sm" style="color: var(--color-error);">{pinConfirmError}</p>
              {/if}
              <div class="popup-actions mt-md">
                <button onclick={() => { showPinConfirm = false; }}>Cancel</button>
                <button class="primary" onclick={confirmPin} disabled={pinConfirmValue.length < 6}>
                  <i class="fa-thin fa-check"></i> Confirm
                </button>
              </div>
            </div>
          {/if}

          <div class="step-nav mt-lg">
            <button onclick={prevStep}><i class="fa-thin fa-arrow-left"></i> Back</button>
            <button class="primary" onclick={handleGenerateSharesClick}>Generate Shares <i class="fa-thin fa-arrow-right"></i></button>
          </div>
        </div>
      </Panel>

    {:else if currentStep === 'preview'}
      <Panel title="Share Cards Preview">
        <div class="step-content">
          <div class="step-instructions">
            <i class="fa-thin fa-circle-info"></i>
            Review your {shares.length} share cards below. Print them, download as HTML, or save to your encrypted vault. Each card contains a QR code with its share data.
          </div>

          <div class="preview-actions mb-md">
            <button class="primary" onclick={handlePrint}>
              <i class="fa-thin fa-print"></i> Print Cards
            </button>
            <button onclick={handleDownload}>
              <i class="fa-thin fa-download"></i> Download HTML
            </button>
            <div class="vault-btn-wrapper">
              <button onclick={saveToVault} disabled={saving}>
                <i class="fa-thin fa-vault"></i> {saving ? 'Saving...' : 'Save to Vault'}
              </button>
              {#if ghostActive}
                <div class="vault-ghost">
                  <i class="fa-thin fa-ghost"></i>
                </div>
              {/if}
            </div>
          </div>

          {#if vaultSaved}
            <div class="vault-saved-popup">
              <i class="fa-thin fa-circle-check"></i>
              <span><b>{vaultSaved.datetime}</b> — {vaultSaved.name} saved to vault [{vaultSaved.index}]</span>
              <button class="vault-popup-close" aria-label="Dismiss" onclick={() => { vaultSaved = null; }}><i class="fa-thin fa-xmark"></i></button>
            </div>
          {/if}

          <!-- Full-page layout only (80% QR code for optimal scannability) -->

          <div class="share-cards-grid">
            {#each shares as share}
              <ShareCard {share} {highlightColor} addresses={addresses.slice(0, 5)} />
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
  </div>
</div>

<style>
  .generate-flow {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .step-wrapper {
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
  }
  .step-instructions {
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    margin-bottom: var(--spacing-md);
  }
  .step-instructions i {
    margin-right: 0.35rem;
    color: var(--color-accent);
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
    flex-wrap: wrap;
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
  .input-with-toggle {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-with-toggle input {
    padding-right: 2.5rem;
  }
  .input-toggle-btn {
    position: absolute;
    right: 0.4rem;
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.2rem 0.4rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: none;
    min-height: 0;
  }
  .input-toggle-btn:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 100;
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
    text-transform: none;
    box-shadow: none;
    min-width: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  .popup-overlay:hover {
    box-shadow: none;
    transform: none;
  }
  .confirm-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    background: var(--color-bg);
    border: 2px solid var(--color-border-dark);
    box-shadow: 6px 6px 0px var(--color-shadow);
    padding: var(--spacing-lg);
    min-width: 320px;
    max-width: 90vw;
  }
  .confirm-passphrase-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }
  .confirm-passphrase-display .input-toggle-btn {
    position: static;
  }
  .confirm-value {
    flex: 1;
    word-break: break-all;
  }
  .popup-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .vault-btn-wrapper {
    position: relative;
    display: inline-flex;
  }
  .vault-ghost {
    position: absolute;
    left: 50%;
    bottom: 100%;
    transform: translateX(-50%);
    font-size: 1.5rem;
    color: var(--color-accent);
    pointer-events: none;
    animation: ghost-rise 0.8s ease-out forwards;
  }
  @keyframes ghost-rise {
    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
  }

  .vault-saved-popup {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 101;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--color-border-dark);
    background: var(--color-bg);
    box-shadow: 4px 4px 0 var(--color-shadow);
    font-size: 0.75rem;
    animation: toast-lifecycle 4s ease forwards;
    pointer-events: auto;
  }
  .vault-saved-popup i:first-child {
    color: #4caf50;
    font-size: 1rem;
    flex-shrink: 0;
  }
  .vault-popup-close {
    margin-left: auto;
    padding: 0.15rem 0.35rem;
    min-width: 0;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    background: transparent;
    box-shadow: none;
  }
  .vault-popup-close:hover {
    background: var(--color-bg);
  }
  @keyframes toast-lifecycle {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    8% { opacity: 1; transform: translateX(-50%) translateY(0); }
    75% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }
</style>

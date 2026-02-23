<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Buffer } from 'buffer';
  import type { SharePayload, SecretRecord, WordCount } from '$lib/types';
  import { combine } from '$lib/shamir';
  import { QRScanner, scanFromFile, scanFromPDF } from '$lib/scanner';
  import type { ScanStatus } from '$lib/scanner';
  import { verifyPIN, saveSecret } from '$lib/storage';
  import { deriveAddresses } from '$lib/wallet';
  import { playConfirmBeep } from '$lib/audio';
  import Panel from './Panel.svelte';
  import MnemonicGrid from './MnemonicGrid.svelte';
  import PinInput from './PinInput.svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let state = $state<'scanning' | 'pin_required' | 'reconstructing' | 'done' | 'error'>('scanning');
  let scannedShares = $state<SharePayload[]>([]);
  let targetThreshold = $state(0);
  let targetTotal = $state(0);
  let targetId = $state('');
  let error = $state<string | null>(null);
  let recoveredMnemonic = $state('');
  let recoveredWords = $derived(recoveredMnemonic ? recoveredMnemonic.split(' ') : []);
  let masked = $state(true);
  let pin = $state('');
  let vaultSaved = $state(false);
  let scanner: QRScanner | null = null;
  // svelte-ignore non_reactive_update
  let videoEl: HTMLVideoElement;
  // svelte-ignore non_reactive_update
  let fileInput: HTMLInputElement;
  let cameraActive = $state(false);
  let uploadStatus = $state<string | null>(null);
  let scanProgress = $state(0);
  let scanAnimationFrame = $state(0);

  // Scan overlay state
  let scanStatus = $state<ScanStatus>('idle');
  let scanStartTime = $state(0);
  let guidanceTick = $state(0);
  let guidanceInterval: ReturnType<typeof setInterval> | null = null;

  let guidanceText = $derived.by(() => {
    // Reference guidanceTick to trigger re-evaluation
    void guidanceTick;
    if (scanStatus === 'detected') return null;
    if (scanStatus !== 'scanning') return null;
    const elapsed = Date.now() - scanStartTime;
    if (elapsed > 10000) return 'Ensure QR code is well-lit and flat';
    if (elapsed > 5000) return 'Try moving closer or adjusting angle';
    return 'Align QR code within frame';
  });

  function startGuidanceTimer() {
    scanStartTime = Date.now();
    guidanceTick = 0;
    guidanceInterval = setInterval(() => {
      guidanceTick++;
    }, 1000);
  }

  function stopGuidanceTimer() {
    if (guidanceInterval) {
      clearInterval(guidanceInterval);
      guidanceInterval = null;
    }
  }

  function handleScan(data: string): boolean {
    if (state !== 'scanning') return false;
    try {
      const payload: SharePayload = JSON.parse(data);
      if (payload.v !== 1 || !payload.shareData || !payload.id) {
        return false;
      }

      if (targetId && payload.id !== targetId) {
        error = 'Share belongs to a different secret set';
        return false;
      }

      if (scannedShares.some(s => s.shareIndex === payload.shareIndex)) {
        return false;
      }

      if (!targetId) {
        targetId = payload.id;
        targetThreshold = payload.threshold;
        targetTotal = payload.totalShares;
      }

      scannedShares = [...scannedShares, payload];
      error = null;
      playConfirmBeep();

      if (scannedShares.length >= targetThreshold) {
        scanner?.stop();
        cameraActive = false;
        stopGuidanceTimer();

        if (payload.hasPIN) {
          state = 'pin_required';
        } else {
          state = 'reconstructing';
          reconstruct();
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  async function reconstruct() {
    state = 'reconstructing';
    try {
      const rawShares = scannedShares.map(s => s.shareData);
      const recovered = combine(rawShares);
      recoveredMnemonic = recovered.toString('utf-8');
      state = 'done';
      await autoSaveToVault();
    } catch (e) {
      error = 'Failed to reconstruct secret. Shares may be incompatible.';
      state = 'error';
    }
  }

  async function autoSaveToVault() {
    try {
      const share = scannedShares[0];
      const wordCount = recoveredMnemonic.split(' ').length as WordCount;
      const addressCount = 10;
      const addresses = deriveAddresses(
        recoveredMnemonic,
        share.pathType,
        addressCount,
        share.pathType === 'custom' ? share.derivationPath : undefined
      );

      const record: SecretRecord = {
        id: share.id,
        name: share.name || `Recovered ${new Date().toISOString().slice(0, 10)}`,
        createdAt: Date.now(),
        mnemonic: recoveredMnemonic,
        wordCount,
        derivationPath: share.derivationPath,
        pathType: share.pathType,
        addressCount,
        addresses,
        shamirConfig: { threshold: share.threshold, totalShares: share.totalShares },
        metadata: share.metadata,
        hasPassphrase: share.hasPassphrase,
        hasPIN: share.hasPIN,
      };

      await saveSecret(record);
      vaultSaved = true;
    } catch {
      // Silent failure -- user can still copy the mnemonic
    }
  }

  async function handlePinSubmit(enteredPin: string) {
    const valid = await verifyPIN(enteredPin);
    if (valid) {
      reconstruct();
    } else {
      error = 'Invalid PIN. Try again.';
      pin = '';
    }
  }

  async function startCamera() {
    scanner = new QRScanner({
      onScan: handleScan,
      onError: (msg) => { error = msg; },
      onStatusChange: (status) => {
        scanStatus = status;
        if (status === 'scanning') {
          scanStartTime = Date.now();
        }
      },
    });
    try {
      await scanner.start(videoEl);
      cameraActive = true;
      startGuidanceTimer();
    } catch (e) {
      scanner = null;
      error = e instanceof Error ? e.message : 'Camera access denied';
    }
  }

  function stopCamera() {
    scanner?.stop();
    cameraActive = false;
    scanStatus = 'idle';
    stopGuidanceTimer();
  }

  async function extractSharesFromHTML(content: string): Promise<{ shares: string[]; vault?: any }> {
    const shares: string[] = [];
    let vaultData: any = null;

    // Try to extract embedded vault JSON first
    const vaultMatch = content.match(/<script[^>]*>.*?var\s+vaultData\s*=\s*({.*?});.*?<\/script>/s);
    if (vaultMatch) {
      try {
        vaultData = JSON.parse(vaultMatch[1]);
        console.log('[ScanFlow] Extracted vault data from HTML');
      } catch (e) {
        console.warn('[ScanFlow] Failed to parse vault data:', e);
      }
    }

    // Match QRious constructor calls with the value parameter
    // The value is typically a JSON-stringified object: value: '{"v":1,...}'
    const qriousMatches = content.matchAll(/value:\s*(['"])([^"']*?(?:\\.[^"']*?)*)\1/g);

    for (const match of qriousMatches) {
      const shareData = match[2];
      // Unescape JSON string escapes
      try {
        const unescaped = shareData
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\//g, '/')
          .replace(/\\\\/g, '\\');
        // Verify it's valid JSON before adding
        JSON.parse(unescaped);
        shares.push(unescaped);
      } catch (e) {
        // Skip invalid share data
        console.warn('[ScanFlow] Invalid share data in HTML:', e);
      }
    }
    return { shares, vault: vaultData };
  }

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      console.warn('[ScanFlow] No file selected');
      return;
    }

    try {
      uploadStatus = `Loading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`;
      scanProgress = 0;
      scanAnimationFrame = 0;
      console.log(`[ScanFlow] Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

      // Start animation immediately for initial loading phase
      const initialAnimationInterval = setInterval(() => {
        scanAnimationFrame = (scanAnimationFrame + 1) % 10;
      }, 300); // 3+ fps

      // Stop after 100ms when actual processing begins (will be replaced by handler-specific animation)
      setTimeout(() => clearInterval(initialAnimationInterval), 100);

      if (file.type === 'application/pdf') {
        let lastFoundCount = 0;
        let lastProgressUpdate = Date.now();

        // Start animation that runs continuously during PDF scanning (3+ fps)
        const animationInterval = setInterval(() => {
          scanAnimationFrame = (scanAnimationFrame + 1) % 10;
        }, 300); // Update every 300ms = 3.3 fps minimum

        // Fallback progress update every 1 second if no PDF callback
        const progressInterval = setInterval(() => {
          if (uploadStatus && !uploadStatus.includes('Processing')) {
            // Keep status visible, add a dot to show activity
            const dots = ['.', '..', '...', ''][Math.floor((Date.now() / 300) % 4)];
            if (!uploadStatus.includes(dots.slice(-1))) {
              uploadStatus = uploadStatus.replace(/\.{0,3}$/, dots);
            }
          }
        }, 1000); // Update progress text every 1 second

        const results = await scanFromPDF(file, (current, total, found) => {
          const percent = Math.round((current / total) * 100);
          scanProgress = percent;
          lastProgressUpdate = Date.now();

          // Beep for each newly found QR code
          if (found > lastFoundCount) {
            console.log(`[ScanFlow] QR code ${found} detected, playing beep`);
            playConfirmBeep();
            lastFoundCount = found;
          }

          uploadStatus = `Scanning page ${current}/${total} • Found ${found} QR code${found !== 1 ? 's' : ''}`;
        });

        clearInterval(animationInterval);
        clearInterval(progressInterval);
        scanProgress = 0;
        scanAnimationFrame = 0;

        if (results.length === 0) {
          error = 'No QR codes found in PDF';
          uploadStatus = null;
        } else {
          uploadStatus = `Processing ${results.length} QR code${results.length !== 1 ? 's' : ''}...`;
          for (const data of results) {
            handleScan(data);
          }
          uploadStatus = null;
        }
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        // Handle JSON vault export
        uploadStatus = 'Parsing JSON vault export...';

        const animationInterval = setInterval(() => {
          scanAnimationFrame = (scanAnimationFrame + 1) % 10;
        }, 300); // 3+ fps

        const content = await file.text();

        try {
          const vaultData = JSON.parse(content);
          console.log('[ScanFlow] Parsed vault JSON:', { hasShares: !!vaultData.shares, hasMnemonic: !!vaultData.mnemonic });

          clearInterval(animationInterval);
          scanAnimationFrame = 0;

          if (vaultData.mnemonic) {
            // Direct mnemonic - auto-reconstruct
            uploadStatus = 'Vault data loaded. Reconstructing...';
            playConfirmBeep();
            recoveredMnemonic = vaultData.mnemonic;
            state = 'done';
            await autoSaveToVault();
          } else if (vaultData.shares && Array.isArray(vaultData.shares)) {
            // Share data - process each share
            uploadStatus = `Found ${vaultData.shares.length} shares in vault. Processing...`;
            for (const share of vaultData.shares) {
              playConfirmBeep();
              handleScan(JSON.stringify(share));
            }
            uploadStatus = null;
          } else {
            error = 'Invalid JSON format - missing mnemonic or shares';
            uploadStatus = null;
          }
        } catch (e) {
          clearInterval(animationInterval);
          error = 'Failed to parse JSON: ' + (e instanceof Error ? e.message : String(e));
          uploadStatus = null;
        }
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
        // Handle HTML exports (shares or complete vault)
        uploadStatus = 'Parsing HTML...';

        // Animate braille during HTML parsing
        const animationInterval = setInterval(() => {
          scanAnimationFrame = (scanAnimationFrame + 1) % 10;
        }, 300); // 3+ fps

        const content = await file.text();
        const { shares, vault } = await extractSharesFromHTML(content);

        clearInterval(animationInterval);
        scanAnimationFrame = 0;

        if (vault && vault.mnemonic) {
          // Complete vault data found
          uploadStatus = 'Complete vault data found. Reconstructing...';
          playConfirmBeep();
          recoveredMnemonic = vault.mnemonic;
          state = 'done';
          await autoSaveToVault();
        } else if (shares.length === 0) {
          error = 'No share data or vault data found in HTML file';
          uploadStatus = null;
        } else {
          uploadStatus = `Found ${shares.length} share${shares.length !== 1 ? 's' : ''}. Processing...`;
          for (const data of shares) {
            playConfirmBeep();
            handleScan(data);
          }
          uploadStatus = null;
        }
      } else {
        const isVaultQR = file.name.includes('vault-qr') || file.type.startsWith('image/');
        uploadStatus = isVaultQR ? `Scanning vault QR code...` : `Scanning image...`;
        console.log(`[ScanFlow] Scanning ${isVaultQR ? 'vault QR' : 'image'} file`);

        // Animate braille during image scanning
        const animationInterval = setInterval(() => {
          scanAnimationFrame = (scanAnimationFrame + 1) % 10;
        }, 300); // 3+ fps

        const results = await scanFromFile(file);

        clearInterval(animationInterval);
        scanAnimationFrame = 0;

        if (results.length === 0) {
          error = isVaultQR
            ? 'No vault QR code found -- ensure image is clear and well-lit'
            : 'No QR code found in image -- try a higher resolution screenshot';
          uploadStatus = null;
        } else {
          // Try to process as vault QR code first
          if (isVaultQR && results.length === 1) {
            try {
              const vaultData = JSON.parse(results[0]);
              if (vaultData.mnemonic) {
                uploadStatus = 'Vault data found. Reconstructing...';
                playConfirmBeep();
                recoveredMnemonic = vaultData.mnemonic;
                state = 'done';
                await autoSaveToVault();
                return;
              }
            } catch (e) {
              console.log('[ScanFlow] Not vault data, treating as share:', e);
            }
          }

          // Process as shares
          uploadStatus = `Found ${results.length} QR code${results.length !== 1 ? 's' : ''}. Processing...`;
          for (const data of results) {
            playConfirmBeep();
            const scanned = handleScan(data);
            console.log(`[ScanFlow] Scanned QR ${results.indexOf(data) + 1}/${results.length}, valid: ${scanned}`);
          }
          uploadStatus = null;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to process file';
      uploadStatus = null;
    }
    input.value = '';
  }

  function reset() {
    scannedShares = [];
    targetThreshold = 0;
    targetTotal = 0;
    targetId = '';
    error = null;
    recoveredMnemonic = '';
    pin = '';
    state = 'scanning';
    scanStatus = 'idle';
    stopCamera();
  }

  onDestroy(() => {
    scanner?.stop();
    stopGuidanceTimer();
  });
</script>

{#if state === 'scanning'}
  <Panel title="Scan Share Cards">
    <div class="scan-content">
      <div class="step-instructions mb-md">
        <i class="fa-thin fa-circle-info"></i>
        <div>
          {#if !targetId}
            <strong>Scan your first share card to begin recovery.</strong> The app will detect how many shares are needed.
          {:else}
            <strong>Scan {targetThreshold - scannedShares.length} more share card{targetThreshold - scannedShares.length !== 1 ? 's' : ''}</strong> to reconstruct the secret.
            Need {targetThreshold} of {targetTotal} total.
          {/if}
        </div>
      </div>

      <div class="scan-formats mb-md">
        <div class="formats-header">
          <i class="fa-thin fa-info-circle"></i> Accepted Formats
        </div>
        <div class="formats-list">
          <div class="format-item">
            <span class="format-icon"><i class="fa-thin fa-camera"></i></span>
            <span class="format-label"><strong>Camera</strong> - Live QR code scanning from physical share cards</span>
          </div>
          <div class="format-item">
            <span class="format-icon"><i class="fa-thin fa-image"></i></span>
            <span class="format-label"><strong>Images</strong> - Screenshots of share cards (PNG, JPG, etc.)</span>
          </div>
          <div class="format-item">
            <span class="format-icon"><i class="fa-thin fa-file-pdf"></i></span>
            <span class="format-label"><strong>PDF Exports</strong> - Full-page or compact PDFs from vault export</span>
          </div>
          <div class="format-item">
            <span class="format-icon"><i class="fa-thin fa-file-code"></i></span>
            <span class="format-label"><strong>HTML Files</strong> - Individual or combined HTML exports from vault</span>
          </div>
          <div class="format-item">
            <span class="format-icon"><i class="fa-thin fa-qrcode"></i></span>
            <span class="format-label"><strong>Vault QR Code</strong> - Complete vault configuration as PNG or image</span>
          </div>
        </div>
        <div class="formats-warning">
          <i class="fa-thin fa-triangle-exclamation"></i>
          <span><strong>Important:</strong> Do not store PDF, HTML, or JSON exports on your computer. These files contain your encrypted shares and should be printed and kept secure, or deleted immediately after recovery.</span>
        </div>
      </div>

      {#if targetId}
        <div class="shard-progress mb-md">
          <div class="threshold-indicator">
            <span class="text-xs text-muted">THRESHOLD</span>
            <div class="threshold-boxes">
              {#each Array(targetThreshold) as _, i}
                <div class="threshold-box" class:filled={i < scannedShares.length}></div>
              {/each}
            </div>
            <span class="text-xs">{scannedShares.length}/{targetThreshold}</span>
          </div>
          <div class="shard-slots">
            <span class="text-xs text-muted">ALL SHARDS</span>
            <div class="slot-boxes">
              {#each Array(targetTotal) as _, i}
                {@const scanned = scannedShares.some(s => s.shareIndex === i + 1)}
                <div class="slot-box" class:scanned title="Share {i + 1}">{i + 1}</div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if scannedShares.length > 0}
        <div class="scanned-list mb-md">
          {#each scannedShares as share}
            <span class="badge badge-success">
              Share {share.shareIndex}/{share.totalShares}
            </span>
          {/each}
        </div>
      {/if}

      <div class="camera-area">
        <video bind:this={videoEl} class="camera-video" class:hidden={!cameraActive} playsinline autoplay muted></video>

        {#if cameraActive}
          <div class="scan-overlay" class:detected={scanStatus === 'detected'}>
            <div class="reticle">
              <div class="corner corner-tl"></div>
              <div class="corner corner-tr"></div>
              <div class="corner corner-bl"></div>
              <div class="corner corner-br"></div>
            </div>
            {#if scanStatus === 'detected'}
              <div class="guidance-pill guidance-success">
                <i class="fa-thin fa-check"></i> Found!
              </div>
            {:else if guidanceText}
              <div class="guidance-pill">
                {guidanceText}
              </div>
            {/if}
          </div>
        {/if}

        {#if !cameraActive}
          <div class="camera-placeholder">
            <i class="fa-thin fa-camera" style="font-size: 2rem; color: var(--color-text-muted);"></i>
            <p class="text-sm text-muted mt-sm">Camera not active</p>
          </div>
        {/if}
      </div>

      <div class="scan-actions mt-md">
        {#if cameraActive}
          <button onclick={stopCamera}><i class="fa-thin fa-stop"></i> Stop Camera</button>
        {:else}
          <button class="primary" onclick={startCamera}><i class="fa-thin fa-camera"></i> Start Camera</button>
        {/if}
        <button onclick={() => fileInput.click()} disabled={!!uploadStatus}>
          <i class="fa-thin fa-upload"></i> Upload Files
        </button>
        <input bind:this={fileInput} type="file" accept="image/*,application/pdf,.html,.json,application/json" onchange={handleFileUpload} style="display: none;" />
      </div>

      {#if uploadStatus}
        <div class="upload-status mt-md">
          <div class="status-spinner">
            {['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][scanAnimationFrame]}
          </div>
          <div class="status-content">
            <p class="text-sm">{uploadStatus}</p>
            {#if scanProgress > 0}
              <div class="braille-progress-bar">
                <div class="braille-progress-fill" style={`width: ${scanProgress}%`}></div>
                <span class="progress-text">{scanProgress}%</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      {#if error}
        <p class="text-xs mt-sm" style="color: var(--color-error);">{error}</p>
      {/if}
    </div>
  </Panel>

{:else if state === 'pin_required'}
  <Panel title="PIN Required">
    <div class="pin-content">
      <p class="text-sm mb-md">This secret is PIN-protected. Enter the PIN to reconstruct.</p>
      <PinInput bind:value={pin} onComplete={handlePinSubmit} />
      {#if error}
        <p class="text-xs mt-sm" style="color: var(--color-error);">{error}</p>
      {/if}
    </div>
  </Panel>

{:else if state === 'reconstructing'}
  <Panel title="Reconstructing...">
    <p class="text-muted">Combining shares with Lagrange interpolation...</p>
  </Panel>

{:else if state === 'done'}
  <Panel title="Secret Recovered">
    <div class="recovered-content">
      <div class="mnemonic-controls mb-md">
        <button onclick={() => { masked = !masked; }}>
          <i class="fa-thin {masked ? 'fa-eye' : 'fa-eye-slash'}"></i>
          {masked ? 'Reveal' : 'Hide'}
        </button>
        <button onclick={() => { navigator.clipboard.writeText(recoveredMnemonic); }}>
          <i class="fa-thin fa-copy"></i> Copy
        </button>
      </div>
      <MnemonicGrid words={recoveredWords} {masked} />
      <p class="text-xs text-muted mt-md">{recoveredWords.length} words recovered from {scannedShares.length} shares.</p>
      {#if vaultSaved}
        <p class="vault-saved-notice mt-sm"><i class="fa-thin fa-vault"></i> Saved to vault</p>
      {/if}
      <div class="step-nav mt-lg">
        <button onclick={reset}><i class="fa-thin fa-rotate"></i> Scan Another</button>
        <button class="primary" onclick={onComplete}><i class="fa-thin fa-check"></i> Done</button>
      </div>
    </div>
  </Panel>

{:else if state === 'error'}
  <Panel title="Error">
    <p style="color: var(--color-error);">{error}</p>
    <button class="mt-md" onclick={reset}><i class="fa-thin fa-rotate"></i> Try Again</button>
  </Panel>
{/if}

<style>
  .step-instructions {
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .step-instructions i {
    margin-right: 0.35rem;
    color: var(--color-accent);
  }

  .scan-formats {
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    border-radius: 4px;
    overflow: hidden;
  }

  .formats-header {
    padding: 0.65rem 0.75rem;
    background: linear-gradient(135deg, var(--color-accent-subtle) 0%, var(--color-bg-alt) 100%);
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .formats-header i {
    color: var(--color-accent);
  }

  .formats-list {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .format-item {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--color-text-muted);
  }

  .format-icon {
    flex-shrink: 0;
    width: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
    font-size: 0.9rem;
    margin-top: 0.1rem;
  }

  .format-label {
    flex: 1;
  }

  .format-label strong {
    color: var(--color-text);
  }

  .formats-warning {
    padding: 0.6rem 0.75rem;
    background: rgba(255, 193, 7, 0.1);
    border-top: 1px solid var(--color-border);
    border-radius: 0 0 4px 4px;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    display: flex;
    gap: 0.5rem;
  }

  .formats-warning i {
    flex-shrink: 0;
    color: #ffc107;
    margin-top: 0.05rem;
  }

  .scanned-list {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .camera-area {
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    aspect-ratio: 4/3;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border-dark);
    box-shadow: 2px 2px 0px var(--color-shadow);
    overflow: hidden;
  }
  .camera-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .camera-video.hidden {
    display: none;
  }
  .camera-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* Scan overlay */
  .scan-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .reticle {
    position: relative;
    width: 65%;
    max-width: 280px;
    aspect-ratio: 1;
  }

  .corner {
    position: absolute;
    width: 24px;
    height: 24px;
    border-color: rgba(255, 255, 255, 0.9);
    border-style: solid;
    border-width: 0;
    transition: border-color 0.2s;
  }
  .scan-overlay.detected .corner {
    border-color: #4caf50;
  }
  .corner-tl {
    top: 0; left: 0;
    border-top-width: 3px;
    border-left-width: 3px;
  }
  .corner-tr {
    top: 0; right: 0;
    border-top-width: 3px;
    border-right-width: 3px;
  }
  .corner-bl {
    bottom: 0; left: 0;
    border-bottom-width: 3px;
    border-left-width: 3px;
  }
  .corner-br {
    bottom: 0; right: 0;
    border-bottom-width: 3px;
    border-right-width: 3px;
  }

  .guidance-pill {
    margin-top: 12px;
    padding: 4px 12px;
    background: rgba(0, 0, 0, 0.6);
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.7rem;
    font-family: var(--font-mono);
    letter-spacing: 0.5px;
  }
  .guidance-success {
    background: rgba(76, 175, 80, 0.85);
    color: #fff;
    font-weight: 600;
  }
  .guidance-success i {
    margin-right: 0.25rem;
  }

  .shard-progress {
    border: 1px solid var(--color-border);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-alt);
  }
  .threshold-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .threshold-boxes {
    display: flex;
    gap: 3px;
  }
  .threshold-box {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border-dark);
    background: var(--color-bg);
  }
  .threshold-box.filled {
    background: var(--color-success);
  }
  .shard-slots {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .slot-boxes {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }
  .slot-box {
    width: 24px;
    height: 24px;
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    background: var(--color-bg);
  }
  .slot-box.scanned {
    background: var(--color-success-bg);
    border-color: var(--color-success);
    color: var(--color-success);
    font-weight: 600;
  }
  .scan-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .mnemonic-controls {
    display: flex;
    gap: 0.35rem;
  }
  .step-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .vault-saved-notice {
    font-size: 0.75rem;
    color: var(--color-success);
    font-weight: 600;
  }
  .vault-saved-notice i {
    margin-right: 0.25rem;
  }

  .upload-status {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }

  .status-spinner {
    width: 24px;
    height: 24px;
    font-size: 1.5rem;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: var(--color-accent);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-content {
    flex: 1;
    min-width: 0;
  }

  .braille-progress-bar {
    position: relative;
    width: 100%;
    height: 18px;
    background: var(--color-bg);
    border: 2px solid var(--color-accent);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    font-family: 'Courier New', monospace;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .braille-progress-fill {
    height: 100%;
    background:
      repeating-linear-gradient(
        45deg,
        #5C6BC0,
        #5C6BC0 4px,
        #7986CB 4px,
        #7986CB 8px
      );
    image-rendering: pixelated;
    transition: width 0.15s ease-out;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 6px;
    color: white;
    font-weight: bold;
    font-size: 0.7rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .progress-text {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.7rem;
    font-weight: 700;
    color: #333;
    pointer-events: none;
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
  }
</style>

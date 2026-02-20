<script lang="ts">
  import { Buffer } from 'buffer';
  import type { SharePayload } from '$lib/types';
  import { combine } from '$lib/shamir';
  import { QRScanner, scanFromFile } from '$lib/scanner';
  import { verifyPIN } from '$lib/storage';
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
  let scanner: QRScanner | null = null;
  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let fileInput: HTMLInputElement;
  let cameraActive = $state(false);

  function handleScan(data: string): boolean {
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

      if (scannedShares.length >= targetThreshold) {
        scanner?.stop();
        cameraActive = false;

        if (payload.hasPIN) {
          state = 'pin_required';
        } else {
          reconstruct();
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  function reconstruct() {
    state = 'reconstructing';
    try {
      const rawShares = scannedShares.map(s => s.shareData);
      const recovered = combine(rawShares);
      recoveredMnemonic = recovered.toString();
      state = 'done';
    } catch (e) {
      error = 'Failed to reconstruct secret. Shares may be incompatible.';
      state = 'error';
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
    });
    await scanner.start(videoEl, canvasEl);
    cameraActive = true;
  }

  function stopCamera() {
    scanner?.stop();
    cameraActive = false;
  }

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const data = await scanFromFile(file);
    if (data) {
      handleScan(data);
    } else {
      error = 'No QR code found in image';
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
    stopCamera();
  }
</script>

{#if state === 'scanning'}
  <Panel title="Scan Share Cards">
    <div class="scan-content">
      <div class="scan-status mb-md">
        <span class="badge badge-info">
          {scannedShares.length}/{targetThreshold || '?'} SHARES SCANNED
        </span>
        {#if targetTotal}
          <span class="text-xs text-muted">
            Need {targetThreshold} of {targetTotal} total
          </span>
        {/if}
      </div>

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
        <video bind:this={videoEl} class="camera-video" class:hidden={!cameraActive} playsinline></video>
        <canvas bind:this={canvasEl} class="camera-canvas"></canvas>

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
        <button onclick={() => fileInput.click()}>
          <i class="fa-thin fa-upload"></i> Upload Image
        </button>
        <input bind:this={fileInput} type="file" accept="image/*" onchange={handleFileUpload} style="display: none;" />
      </div>

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
  .scan-content, .pin-content, .recovered-content {
    /* content wrapper */
  }
  .scan-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
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
  .camera-canvas {
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
</style>

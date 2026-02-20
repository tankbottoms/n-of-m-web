<script lang="ts">
  import type { PathType } from '$lib/types';
  import { DERIVATION_PATHS } from '$lib/derivation';

  let { pathType = $bindable('metamask' as PathType), customPath = $bindable('') }: {
    pathType?: PathType;
    customPath?: string;
  } = $props();

  const pathTypes: PathType[] = ['metamask', 'ledger', 'custom'];
  let displayPath = $derived(
    pathType === 'custom' ? customPath : DERIVATION_PATHS[pathType].template
  );
</script>

<div class="path-editor">
  <div class="path-buttons">
    {#each pathTypes as pt}
      <button
        class:primary={pathType === pt}
        onclick={() => { pathType = pt; }}
      >
        {DERIVATION_PATHS[pt].label}
      </button>
    {/each}
  </div>
  <p class="text-xs text-muted mt-sm">{DERIVATION_PATHS[pathType].description}</p>
  {#if pathType === 'custom'}
    <input
      type="text"
      bind:value={customPath}
      placeholder="m/44'/60'/0'/0/{'{index}'}"
      class="mt-sm"
      style="width: 100%;"
    />
  {:else}
    <div class="path-display mt-sm">
      <code>{displayPath}</code>
    </div>
  {/if}
</div>

<style>
  .path-buttons {
    display: flex;
    gap: 0.35rem;
  }
  .path-display {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.4rem 0.75rem;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
  }
</style>

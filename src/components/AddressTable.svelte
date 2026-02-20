<script lang="ts">
  import type { DerivedAddress } from '$lib/types';

  let { addresses, showPrivateKeys = false }: {
    addresses: DerivedAddress[];
    showPrivateKeys?: boolean;
  } = $props();

  let revealedKeys = $state<Set<number>>(new Set());

  function toggleKey(index: number) {
    const next = new Set(revealedKeys);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    revealedKeys = next;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function truncate(addr: string): string {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  }
</script>

<table class="data-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Address</th>
      {#if showPrivateKeys}
        <th>Private Key</th>
      {/if}
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each addresses as addr}
      <tr>
        <td class="text-muted">{addr.index}</td>
        <td>
          <span class="addr-mono">{truncate(addr.address)}</span>
        </td>
        {#if showPrivateKeys}
          <td>
            {#if revealedKeys.has(addr.index)}
              <span class="addr-mono text-xs">{truncate(addr.privateKey)}</span>
            {:else}
              <span class="text-muted text-xs">HIDDEN</span>
            {/if}
          </td>
        {/if}
        <td class="actions">
          <button class="btn-icon" onclick={() => copyToClipboard(addr.address)} title="Copy address">
            <i class="fa-thin fa-copy"></i>
          </button>
          {#if showPrivateKeys}
            <button class="btn-icon" onclick={() => toggleKey(addr.index)} title="Toggle key">
              <i class="fa-thin {revealedKeys.has(addr.index) ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .addr-mono {
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }
  .actions {
    display: flex;
    gap: 0.25rem;
  }
  .btn-icon {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.2rem 0.4rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: none;
  }
  .btn-icon:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
</style>

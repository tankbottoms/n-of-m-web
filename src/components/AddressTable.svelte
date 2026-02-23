<script lang="ts">
  import type { DerivedAddress } from '$lib/types';

  let { addresses, showPrivateKeys = false }: {
    addresses: DerivedAddress[];
    showPrivateKeys?: boolean;
  } = $props();

  let viewMode = $state<Record<number, 'address' | 'key'>>({});

  function getMode(index: number): 'address' | 'key' {
    return viewMode[index] || 'address';
  }

  function toggleMode(index: number) {
    viewMode = { ...viewMode, [index]: getMode(index) === 'address' ? 'key' : 'address' };
  }

  function copyWithToast(text: string, event: MouseEvent) {
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = 'COPIED';
    toast.style.left = `${event.clientX}px`;
    toast.style.top = `${event.clientY}px`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1000);
  }
</script>

<table class="data-table addr-table">
  <colgroup>
    <col style="width: 3.5rem;" />
    <col />
    <col style="width: 4.5rem;" />
  </colgroup>
  <thead>
    <tr>
      <th>#</th>
      <th>{showPrivateKeys ? 'Address / Key' : 'Address'}</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each addresses as addr}
      <tr>
        <td><span class="idx-badge">{String(addr.index).padStart(3, '0')}</span></td>
        <td>
          {#if showPrivateKeys && getMode(addr.index) === 'key'}
            <span
              class="addr-mono addr-full clickable"
              role="button"
              tabindex="0"
              onclick={(e) => copyWithToast(addr.privateKey, e)}
              onkeydown={(e) => { if (e.key === 'Enter') copyWithToast(addr.privateKey, e as unknown as MouseEvent); }}
            >{addr.privateKey}</span>
          {:else}
            <span
              class="addr-mono addr-full clickable"
              role="button"
              tabindex="0"
              onclick={(e) => copyWithToast(addr.address, e)}
              onkeydown={(e) => { if (e.key === 'Enter') copyWithToast(addr.address, e as unknown as MouseEvent); }}
            >{addr.address}</span>
          {/if}
        </td>
        <td class="actions">
          <button class="btn-icon" onclick={(e) => copyWithToast(getMode(addr.index) === 'key' ? addr.privateKey : addr.address, e)} title="Copy">
            <i class="fa-thin fa-copy"></i>
          </button>
          {#if showPrivateKeys}
            <button class="btn-icon" onclick={() => toggleMode(addr.index)} title={getMode(addr.index) === 'key' ? 'Show address' : 'Show private key'}>
              <i class="fa-thin {getMode(addr.index) === 'key' ? 'fa-wallet' : 'fa-key'}"></i>
            </button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .addr-table {
    table-layout: fixed;
    width: 100%;
  }
  .addr-mono {
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .addr-full {
    word-break: break-all;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .clickable {
    cursor: pointer;
  }
  .clickable:hover {
    color: var(--color-accent);
  }
  .actions {
    display: flex;
    gap: 0.25rem;
    white-space: nowrap;
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
  .idx-badge {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
    background: rgba(92, 107, 192, 0.1);
    text-align: center;
    min-width: 1.6em;
  }

  @media (max-width: 768px) {
    .addr-mono {
      font-size: 0.65rem;
    }
  }

  @media (max-width: 480px) {
    .addr-table {
      display: block;
    }
    .addr-table thead {
      display: none;
    }
    .addr-table tbody {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .addr-table tr {
      display: block;
      border: 1px solid var(--color-border);
      padding: 0.75rem;
      background: var(--color-bg-alt);
    }
    .addr-table td {
      display: block;
      padding: 0.25rem 0 !important;
      border: none !important;
    }
    .addr-table td:first-child {
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .addr-table .actions {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-border);
    }
  }
</style>

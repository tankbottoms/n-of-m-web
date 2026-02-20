<script lang="ts">
  import type { SecretRecord } from '$lib/types';
  import { getAllSecrets, deleteSecret, updateSecret, hasVaultPassword, verifyVaultPassword } from '$lib/storage';
  import { generatePrintHTML, printCards } from '$lib/pdf';
  import { split } from '$lib/shamir';
  import { Buffer } from 'buffer';
  import { DERIVATION_PATHS } from '$lib/derivation';
  import Panel from './Panel.svelte';
  import MnemonicGrid from './MnemonicGrid.svelte';
  import AddressTable from './AddressTable.svelte';

  let secrets = $state<SecretRecord[]>([]);
  let expandedId = $state<string | null>(null);
  let loading = $state(true);
  let locked = $state(false);
  let passwordInput = $state('');
  let passwordError = $state('');

  async function loadSecrets() {
    loading = true;
    if (hasVaultPassword()) {
      locked = true;
      loading = false;
      return;
    }
    secrets = await getAllSecrets();
    loading = false;
  }

  async function unlockVault() {
    const valid = await verifyVaultPassword(passwordInput);
    if (valid) {
      locked = false;
      secrets = await getAllSecrets();
      passwordError = '';
    } else {
      passwordError = 'Invalid password';
    }
    passwordInput = '';
  }

  async function handleDelete(id: string) {
    await deleteSecret(id);
    secrets = secrets.filter(s => s.id !== id);
    expandedId = null;
  }

  function handleReprint(secret: SecretRecord) {
    const rawShares = split(Buffer.from(secret.mnemonic), {
      shares: secret.shamirConfig.totalShares,
      threshold: secret.shamirConfig.threshold,
    });

    const shares = rawShares.map((raw, i) => ({
      v: 1 as const,
      id: secret.id,
      name: secret.name,
      shareIndex: i + 1,
      totalShares: secret.shamirConfig.totalShares,
      threshold: secret.shamirConfig.threshold,
      shareData: raw.toString('hex'),
      derivationPath: secret.derivationPath,
      pathType: secret.pathType,
      wordCount: secret.wordCount,
      hasPIN: secret.hasPIN,
      hasPassphrase: secret.hasPassphrase,
    }));

    const html = generatePrintHTML(shares, '#A8D8EA', 'full-page', secret.addresses[0]?.address);
    printCards(html);
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  $effect(() => {
    loadSecrets();
  });
</script>

{#if loading}
  <Panel title="Vault">
    <p class="text-muted">Loading...</p>
  </Panel>
{:else if locked}
  <Panel title="Vault Locked">
    <div class="lock-content">
      <p class="text-sm mb-md"><i class="fa-thin fa-lock"></i> Enter vault password to access stored secrets.</p>
      <input
        type="password"
        bind:value={passwordInput}
        placeholder="Vault password"
        onkeydown={(e) => { if (e.key === 'Enter') unlockVault(); }}
        style="width: 100%; max-width: 300px;"
      />
      <button class="primary mt-sm" onclick={unlockVault}>Unlock</button>
      {#if passwordError}
        <p class="text-xs mt-sm" style="color: var(--color-error);">{passwordError}</p>
      {/if}
    </div>
  </Panel>
{:else if secrets.length === 0}
  <Panel title="Vault">
    <div class="empty-vault">
      <i class="fa-thin fa-vault" style="font-size: 2rem; color: var(--color-text-muted);"></i>
      <p class="text-muted mt-sm">No secrets stored yet.</p>
      <p class="text-xs text-muted">Generate a secret and save it to the vault.</p>
    </div>
  </Panel>
{:else}
  <Panel title="Vault ({secrets.length})">
    <div class="vault-list">
      {#each secrets as secret}
        <div class="vault-item" class:expanded={expandedId === secret.id}>
          <button class="vault-item-header" onclick={() => { expandedId = expandedId === secret.id ? null : secret.id; }}>
            <div class="item-info">
              <span class="item-name">{secret.name}</span>
              <span class="text-xs text-muted">{formatDate(secret.createdAt)}</span>
            </div>
            <div class="item-badges">
              <span class="badge badge-info">{secret.wordCount}W</span>
              <span class="badge badge-info">{secret.shamirConfig.threshold}/{secret.shamirConfig.totalShares}</span>
              {#if secret.hasPIN}<span class="badge badge-warning">PIN</span>{/if}
              <i class="fa-thin {expandedId === secret.id ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
            </div>
          </button>

          {#if expandedId === secret.id}
            <div class="vault-item-detail">
              <div class="detail-section">
                <h3 class="text-xs text-muted mb-sm">SEED PHRASE</h3>
                <MnemonicGrid words={secret.mnemonic.split(' ')} masked={true} />
              </div>

              {#if secret.addresses.length > 0}
                <div class="detail-section mt-md">
                  <h3 class="text-xs text-muted mb-sm">ADDRESSES ({secret.addresses.length})</h3>
                  <AddressTable addresses={secret.addresses.slice(0, 5)} />
                </div>
              {/if}

              <div class="detail-section mt-md">
                <h3 class="text-xs text-muted mb-sm">CONFIG</h3>
                <p class="text-xs">Path: <code>{secret.derivationPath}</code></p>
                <p class="text-xs">Type: <code>{secret.pathType}</code></p>
              </div>

              <div class="detail-actions mt-md">
                <button onclick={() => handleReprint(secret)}>
                  <i class="fa-thin fa-print"></i> Reprint Cards
                </button>
                <button onclick={() => handleDelete(secret.id)} style="color: var(--color-error);">
                  <i class="fa-thin fa-trash"></i> Delete
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </Panel>
{/if}

<style>
  .lock-content, .empty-vault {
    text-align: center;
    padding: var(--spacing-lg) 0;
  }
  .vault-list {
    display: flex;
    flex-direction: column;
  }
  .vault-item {
    border-bottom: 1px solid var(--color-border);
  }
  .vault-item:last-child {
    border-bottom: none;
  }
  .vault-item-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    background: none;
    border: none;
    box-shadow: none;
    text-transform: none;
    letter-spacing: 0;
    text-align: left;
    font-size: 0.85rem;
  }
  .vault-item-header:hover {
    box-shadow: none;
    transform: none;
    background: var(--color-hover-bg);
  }
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .item-name {
    font-weight: 600;
  }
  .item-badges {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .vault-item-detail {
    padding: var(--spacing-sm) 0 var(--spacing-md);
  }
  .detail-actions {
    display: flex;
    gap: 0.5rem;
  }
</style>

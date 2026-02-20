<script lang="ts">
  import type { SecretRecord, PathType } from '$lib/types';
  import { getAllSecrets, deleteSecret, updateSecret, hasVaultPassword, verifyVaultPassword, saveSecret } from '$lib/storage';
  import { generatePrintHTML, printCards, downloadHTML } from '$lib/pdf';
  import type { LayoutType } from '$lib/pdf';
  import { split } from '$lib/shamir';
  import { deriveAddresses } from '$lib/wallet';
  import { DERIVATION_PATHS } from '$lib/derivation';
  import { Buffer } from 'buffer';
  import { v4 as uuid } from 'uuid';
  import Panel from './Panel.svelte';
  import MnemonicGrid from './MnemonicGrid.svelte';
  import AddressTable from './AddressTable.svelte';

  let secrets = $state<SecretRecord[]>([]);
  let expandedId = $state<string | null>(null);
  let loading = $state(true);
  let locked = $state(false);
  let passwordInput = $state('');
  let passwordError = $state('');

  // Reprint popup state
  let reprintId = $state<string | null>(null);
  let reprintLayout = $state<LayoutType>('full-page');

  // Edit name state
  let editingNameId = $state<string | null>(null);
  let editNameValue = $state('');

  // Reveal seed phrase state
  let revealedIds = $state<Set<string>>(new Set());

  // Duplicate popup state
  let duplicateId = $state<string | null>(null);
  let dupPathType = $state<PathType>('metamask');
  let dupCustomPath = $state("m/44'/60'/0'/0/{index}");

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

  function openReprintPopup(id: string) {
    reprintId = id;
    reprintLayout = 'full-page';
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

    const html = generatePrintHTML(shares, '#A8D8EA', reprintLayout, secret.addresses[0]?.address);
    printCards(html);
    reprintId = null;
  }

  function startEditName(secret: SecretRecord) {
    editingNameId = secret.id;
    editNameValue = secret.name;
  }

  async function saveName(secret: SecretRecord) {
    if (editNameValue.trim()) {
      secret.name = editNameValue.trim();
      await updateSecret(secret.id, secret);
      secrets = secrets.map(s => s.id === secret.id ? { ...s, name: editNameValue.trim() } : s);
    }
    editingNameId = null;
  }

  async function toggleFavorite(secret: SecretRecord) {
    const pinned = !secret.addresses[0]?.pinned;
    // Use metadata to track favorite status
    const updated = { ...secret, metadata: { ...secret.metadata, favorite: pinned ? 'true' : '' } };
    await updateSecret(secret.id, updated);
    secrets = secrets.map(s => s.id === secret.id ? updated : s);
  }

  function isFavorite(secret: SecretRecord): boolean {
    return secret.metadata?.favorite === 'true';
  }

  function openDuplicatePopup(secret: SecretRecord) {
    duplicateId = secret.id;
    dupPathType = secret.pathType;
    dupCustomPath = secret.derivationPath;
  }

  async function handleDuplicate(original: SecretRecord) {
    const newId = uuid();
    const newAddresses = deriveAddresses(
      original.mnemonic,
      dupPathType,
      original.addressCount,
      dupPathType === 'custom' ? dupCustomPath : undefined,
      undefined
    );

    const newRecord: SecretRecord = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      pathType: dupPathType,
      derivationPath: dupPathType === 'custom' ? dupCustomPath : DERIVATION_PATHS[dupPathType].template,
      addresses: newAddresses,
    };

    await saveSecret(newRecord);
    secrets = [...secrets, newRecord];
    duplicateId = null;
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateFull(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }

  async function markViewed(secret: SecretRecord) {
    const now = Date.now();
    secret.viewedAt = now;
    await updateSecret(secret.id, { viewedAt: now });
    secrets = secrets.map(s => s.id === secret.id ? { ...s, viewedAt: now } : s);
  }

  function formatPathType(pt: string): string {
    if (pt === 'metamask') return 'MetaMask';
    if (pt === 'ledger') return 'Ledger';
    return pt.charAt(0).toUpperCase() + pt.slice(1);
  }

  function exportSecret(secret: SecretRecord) {
    const exportData = {
      name: secret.name,
      createdAt: new Date(secret.createdAt).toISOString(),
      viewedAt: secret.viewedAt ? new Date(secret.viewedAt).toISOString() : null,
      updatedAt: secret.updatedAt ? new Date(secret.updatedAt).toISOString() : null,
      mnemonic: secret.mnemonic,
      wordCount: secret.wordCount,
      derivationPath: secret.derivationPath,
      pathType: secret.pathType,
      addressCount: secret.addressCount,
      addresses: secret.addresses.map(a => ({ index: a.index, address: a.address })),
      shamirConfig: secret.shamirConfig,
      hasPassphrase: secret.hasPassphrase,
      hasPIN: secret.hasPIN,
      metadata: secret.metadata,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${secret.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      {#each secrets as secret, idx}
        <div class="vault-item" class:expanded={expandedId === secret.id}>
          <button class="vault-item-header" onclick={() => { const opening = expandedId !== secret.id; expandedId = opening ? secret.id : null; if (opening) markViewed(secret); }}>
            <div class="item-info">
              <span class="item-name"><span class="position-badge">{String(idx + 1).padStart(3, '0')}</span> {secret.name}</span>
              <span class="text-xs text-muted">{formatDateFull(secret.createdAt)}</span>
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
              <div class="detail-top-bar">
                <div class="detail-name-area">
                  {#if editingNameId === secret.id}
                    <input
                      type="text"
                      bind:value={editNameValue}
                      onkeydown={(e) => { if (e.key === 'Enter') saveName(secret); if (e.key === 'Escape') editingNameId = null; }}
                      onblur={() => saveName(secret)}
                      class="name-edit-input"
                    />
                  {:else}
                    <button class="name-edit-btn" onclick={() => startEditName(secret)} title="Click to rename">
                      {secret.name} <i class="fa-thin fa-pen"></i>
                    </button>
                  {/if}
                  <span class="text-xs text-muted">{formatDateFull(secret.createdAt)}</span>
                  {#if secret.viewedAt}
                    <span class="text-xs text-muted">Viewed: {formatDateFull(secret.viewedAt)}</span>
                  {/if}
                  {#if secret.updatedAt}
                    <span class="text-xs text-muted">Updated: {formatDateFull(secret.updatedAt)}</span>
                  {/if}
                </div>
                <button
                  class="btn-icon star-btn"
                  class:starred={isFavorite(secret)}
                  onclick={() => toggleFavorite(secret)}
                  title={isFavorite(secret) ? 'Remove favorite' : 'Mark as favorite'}
                >
                  <i class="fa-{isFavorite(secret) ? 'solid' : 'thin'} fa-star"></i>
                </button>
              </div>

              <div class="detail-section">
                <div class="seed-header">
                  <h3 class="text-xs text-muted">SEED PHRASE</h3>
                  <button class="reveal-btn" onclick={() => { const next = new Set(revealedIds); if (next.has(secret.id)) next.delete(secret.id); else next.add(secret.id); revealedIds = next; }}>
                    <i class="fa-thin {revealedIds.has(secret.id) ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    {revealedIds.has(secret.id) ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <MnemonicGrid words={secret.mnemonic.split(' ')} masked={!revealedIds.has(secret.id)} />
              </div>

              {#if secret.addresses.length > 0}
                <div class="detail-section mt-md">
                  <h3 class="text-xs text-muted mb-sm">ADDRESSES ({secret.addresses.length})</h3>
                  <AddressTable addresses={secret.addresses} showPrivateKeys />
                </div>
              {/if}

              <div class="detail-section mt-md">
                <h3 class="text-xs text-muted mb-sm">CONFIG</h3>
                <p class="text-xs">Path: <code>{secret.derivationPath}</code></p>
                <p class="text-xs">Type: <code>{formatPathType(secret.pathType)}</code></p>
              </div>

              <div class="detail-actions mt-md">
                <button onclick={() => openReprintPopup(secret.id)}>
                  <i class="fa-thin fa-print"></i> Reprint Cards
                </button>
                <button onclick={() => openDuplicatePopup(secret)}>
                  <i class="fa-thin fa-copy"></i> Duplicate
                </button>
                <button onclick={() => exportSecret(secret)}>
                  <i class="fa-thin fa-download"></i> Export
                </button>
                <button onclick={() => handleDelete(secret.id)} style="color: var(--color-error);">
                  <i class="fa-thin fa-trash"></i> Delete
                </button>
              </div>

              <!-- Reprint popup -->
              {#if reprintId === secret.id}
                <div class="popup-overlay" onclick={() => { reprintId = null; }}></div>
                <div class="popup-card">
                  <h4 class="text-xs text-muted mb-sm">CHOOSE CARD SIZE</h4>
                  <div class="popup-options">
                    <button class:primary={reprintLayout === 'full-page'} onclick={() => { reprintLayout = 'full-page'; }}>
                      <i class="fa-thin fa-file"></i> Full Page
                    </button>
                    <button class:primary={reprintLayout === '2-up'} onclick={() => { reprintLayout = '2-up'; }}>
                      <i class="fa-thin fa-columns"></i> Compact
                    </button>
                    <button class:primary={reprintLayout === 'wallet-size'} onclick={() => { reprintLayout = 'wallet-size'; }}>
                      <i class="fa-thin fa-credit-card"></i> Wallet
                    </button>
                  </div>
                  <div class="popup-actions mt-md">
                    <button onclick={() => { reprintId = null; }}>Cancel</button>
                    <button class="primary" onclick={() => handleReprint(secret)}>
                      <i class="fa-thin fa-print"></i> Print
                    </button>
                  </div>
                </div>
              {/if}

              <!-- Duplicate popup -->
              {#if duplicateId === secret.id}
                <div class="popup-overlay" onclick={() => { duplicateId = null; }}></div>
                <div class="popup-card">
                  <h4 class="text-xs text-muted mb-sm">DUPLICATE WITH DERIVATION PATH</h4>
                  <div class="popup-options">
                    <button class:primary={dupPathType === 'metamask'} onclick={() => { dupPathType = 'metamask'; }}>MetaMask</button>
                    <button class:primary={dupPathType === 'ledger'} onclick={() => { dupPathType = 'ledger'; }}>Ledger</button>
                    <button class:primary={dupPathType === 'custom'} onclick={() => { dupPathType = 'custom'; }}>Custom</button>
                  </div>
                  {#if dupPathType === 'custom'}
                    <input
                      type="text"
                      bind:value={dupCustomPath}
                      placeholder="m/44'/60'/0'/0/{index}"
                      class="mt-sm"
                      style="width: 100%;"
                    />
                  {/if}
                  <div class="popup-actions mt-md">
                    <button onclick={() => { duplicateId = null; }}>Cancel</button>
                    <button class="primary" onclick={() => handleDuplicate(secret)}>
                      <i class="fa-thin fa-copy"></i> Duplicate
                    </button>
                  </div>
                </div>
              {/if}
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
    position: relative;
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
  .position-badge {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    margin-right: 0.25rem;
    font-weight: 400;
  }
  .item-badges {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .vault-item-detail {
    padding: var(--spacing-sm) 0 var(--spacing-md);
  }
  .detail-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
  }
  .detail-name-area {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .name-edit-btn {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
    font-size: 1rem;
    text-align: left;
    color: var(--color-text);
    cursor: pointer;
  }
  .name-edit-btn:hover {
    box-shadow: none;
    transform: none;
    color: var(--color-accent);
  }
  .name-edit-btn i {
    font-size: 0.7rem;
    margin-left: 0.35rem;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .name-edit-btn:hover i {
    opacity: 1;
  }
  .name-edit-input {
    font-weight: 600;
    font-size: 1rem;
    padding: 0.2rem 0.4rem;
    width: 100%;
    max-width: 300px;
  }
  .star-btn {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.3rem;
    font-size: 1.1rem;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .star-btn:hover {
    box-shadow: none;
    transform: none;
    color: var(--color-warning);
  }
  .star-btn.starred {
    color: var(--color-warning);
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
  .seed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
  .reveal-btn {
    background: none;
    border: 1px solid var(--color-border);
    box-shadow: none;
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: uppercase;
  }
  .reveal-btn:hover {
    color: var(--color-text);
    border-color: var(--color-border-dark);
    box-shadow: none;
    transform: none;
  }
  .reveal-btn i {
    margin-right: 0.2rem;
  }
  .detail-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 100;
  }
  .popup-card {
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
  .popup-options {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .popup-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>

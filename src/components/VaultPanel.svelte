<script lang="ts">
  import { onMount } from 'svelte';
  import type { SecretRecord, PathType, ShareSet, SharePayload } from '$lib/types';
  import { getAllSecrets, deleteSecret, updateSecret, hasVaultPassword, verifyVaultPassword, saveSecret } from '$lib/storage';
  import { generatePrintHTML, printCards, downloadHTML, downloadPDF, downloadHTMLAsImage, datetimeStamp, ensureQRious, generateAllLayoutsHTML } from '$lib/pdf';
  import type { LayoutType } from '$lib/pdf';
  import { split } from '$lib/shamir';
  import { deriveAddresses } from '$lib/wallet';
  import { DERIVATION_PATHS } from '$lib/derivation';
  import { Buffer } from 'buffer';
  import { v4 as uuid } from 'uuid';
  import { verifyPIN } from '$lib/storage';
  import Panel from './Panel.svelte';
  import MnemonicGrid from './MnemonicGrid.svelte';
  import AddressTable from './AddressTable.svelte';
  import PinInput from './PinInput.svelte';

  function escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

  // New shares config (within the shares popup)
  let newSharesThreshold = $state(2);
  let newSharesTotal = $state(3);

  // Share set delete confirmation
  let deleteShareSetId = $state<string | null>(null);

  // Export popup state
  let exportId = $state<string | null>(null);
  let exportFormatJSON = $state(false);
  let exportPassword = $state('');
  let exportPasswordConfirm = $state('');
  let exportPasswordError = $state('');

  // PIN verification for seed phrase reveal
  let pinPromptId = $state<string | null>(null);
  let pinPromptValue = $state('');
  let pinPromptError = $state('');

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

  function buildSharePayloads(secret: SecretRecord, t: number, m: number): SharePayload[] {
    const rawShares = split(Buffer.from(secret.mnemonic), { shares: m, threshold: t });
    return rawShares.map((raw, i) => ({
      v: 1 as const,
      id: secret.id,
      name: secret.name,
      shareIndex: i + 1,
      totalShares: m,
      threshold: t,
      shareData: raw.toString('hex'),
      derivationPath: secret.derivationPath,
      pathType: secret.pathType,
      wordCount: secret.wordCount,
      hasPIN: secret.hasPIN,
      hasPassphrase: secret.hasPassphrase,
    }));
  }

  async function handleReprint(secret: SecretRecord) {
    await ensureQRious();
    const shares = buildSharePayloads(secret, secret.shamirConfig.threshold, secret.shamirConfig.totalShares);
    const html = generatePrintHTML(shares, '#A8D8EA', reprintLayout, secret.addresses.slice(0, 5));
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

  async function handleGenerateNewShares(secret: SecretRecord) {
    if (newSharesThreshold < 2 || newSharesTotal < newSharesThreshold) return;

    await ensureQRious();
    const shares = buildSharePayloads(secret, newSharesThreshold, newSharesTotal);
    const html = generatePrintHTML(shares, '#A8D8EA', reprintLayout, secret.addresses.slice(0, 5));
    printCards(html);

    const newSet: ShareSet = {
      id: uuid(),
      createdAt: Date.now(),
      threshold: newSharesThreshold,
      totalShares: newSharesTotal,
    };
    const existingSets = secret.shareSets || [];
    const updated = { ...secret, shareSets: [...existingSets, newSet], updatedAt: Date.now() };
    await updateSecret(secret.id, updated);
    secrets = secrets.map(s => s.id === secret.id ? updated : s);
    reprintId = null;
  }

  async function handleDeleteShareSet(secret: SecretRecord, setId: string) {
    const existingSets = secret.shareSets || [];
    const updated = { ...secret, shareSets: existingSets.filter(s => s.id !== setId), updatedAt: Date.now() };
    await updateSecret(secret.id, updated);
    secrets = secrets.map(s => s.id === secret.id ? updated : s);
    deleteShareSetId = null;
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

  async function encryptJSON(data: string, password: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, hash: 'SHA-256', iterations: 100000 },
      await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    return {
      ciphertext: Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join(''),
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
    };
  }

  async function exportAsJSON(secret: SecretRecord) {
    if (!exportPassword || !exportPasswordConfirm) {
      exportPasswordError = 'Password required';
      return;
    }
    if (exportPassword !== exportPasswordConfirm) {
      exportPasswordError = 'Passwords do not match';
      return;
    }
    if (exportPassword.length < 8) {
      exportPasswordError = 'Password must be at least 8 characters';
      return;
    }

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
    const encrypted = await encryptJSON(json, exportPassword);
    const encryptedFile = JSON.stringify({ v: 1, ...encrypted });
    const blob = new Blob([encryptedFile], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${secret.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-export-encrypted-${datetimeStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    exportPassword = '';
    exportPasswordConfirm = '';
    exportPasswordError = '';
    exportFormatJSON = false;
    exportId = null;
  }

  async function exportAsQR(secret: SecretRecord) {
    await ensureQRious();
    const shares = buildSharePayloads(secret, secret.shamirConfig.threshold, secret.shamirConfig.totalShares);
    const html = generatePrintHTML(shares, '#A8D8EA', 'full-page', secret.addresses);
    downloadHTML(html, `${secret.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-shares-${datetimeStamp()}.html`);
    exportId = null;
  }

  async function exportFullPageLayout(secret: SecretRecord) {
    try {
      await ensureQRious();
      const shares = buildSharePayloads(secret, secret.shamirConfig.threshold, secret.shamirConfig.totalShares);
      const timestamp = datetimeStamp();
      const safeName = secret.name.replace(/[^a-zA-Z0-9-_]/g, '_');

      const html = generatePrintHTML(shares, '#A8D8EA', 'full-page', secret.addresses.slice(0, 5));
      console.log('[VaultPanel] PDF export: generated HTML', html.length, 'chars,', shares.length, 'shares');
      await downloadPDF(html, `${safeName}-shares-${timestamp}.pdf`);
      console.log('[VaultPanel] PDF export: download complete');
    } catch (e) {
      console.error('[VaultPanel] PDF export failed:', e);
      alert('PDF export failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    exportId = null;
  }

  async function exportAsQRImage(secret: SecretRecord) {
    await ensureQRious();
    const exportData = {
      name: secret.name,
      createdAt: new Date(secret.createdAt).toISOString(),
      mnemonic: secret.mnemonic,
      wordCount: secret.wordCount,
      derivationPath: secret.derivationPath,
      pathType: secret.pathType,
      addressCount: secret.addressCount,
      addresses: secret.addresses.map(a => ({ index: a.index, address: a.address })),
      shamirConfig: secret.shamirConfig,
      hasPassphrase: secret.hasPassphrase,
      hasPIN: secret.hasPIN,
    };
    const json = JSON.stringify(exportData);
    const canvas = document.createElement('canvas');
    new (window as any).QRious({ element: canvas, value: json, size: 1024, level: 'L', padding: 16 });
    const qrDataURL = canvas.toDataURL('image/png');

    // Create formatted document with instructions
    const createdDate = new Date(secret.createdAt).toISOString().replace('T', ' ').slice(0, 16);
    const exportDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const typeName = secret.pathType === 'metamask' ? 'MetaMask' : secret.pathType === 'ledger' ? 'Ledger' : 'Custom';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: 'Courier New', monospace; color: #000; background: #fff; margin: 0; padding: 2cm; }
  .vault-backup { width: 100%; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left { flex: 1; }
  .title { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
  .subtitle { font-size: 10px; color: #666; margin-top: 4px; }
  .header-version { font-size: 10px; color: #666; white-space: nowrap; }
  .section { margin-bottom: 20px; }
  .section-label { font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 8px; }
  .content { font-size: 11px; line-height: 1.5; }
  .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 12px 24px; font-size: 10px; }
  .info-label { font-weight: bold; color: #666; }
  .qr-container { text-align: center; margin: 20px 0; padding: 20px; border: 2px solid #000; background: #f9f9f9; }
  .qr-container img { max-width: 100%; height: auto; image-rendering: pixelated; }
  .warning { border: 2px solid #ff6b6b; padding: 12px; background: #fff0f0; margin-top: 20px; font-size: 10px; line-height: 1.5; }
  .warning-title { font-weight: bold; margin-bottom: 8px; color: #ff0000; }
  .footer { margin-top: 30px; border-top: 2px solid #000; padding-top: 12px; font-size: 9px; color: #666; }
  @page { margin: 2cm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="vault-backup">
  <div class="header">
    <div class="header-left">
      <div class="title">Shamir Secret Sharing Card</div>
      <div class="subtitle">Vault Backup with Complete Seed Phrase</div>
    </div>
    <div class="header-version">v0.3.2</div>
  </div>

  <div class="section">
    <div class="section-label">What This QR Code Contains</div>
    <div class="content">
      <p>This QR code is a complete backup of your vault. It contains:</p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>${secret.wordCount}-word seed phrase</li>
        <li>All ${secret.addressCount} derived wallet addresses</li>
        <li>Configuration: ${secret.hasPIN ? 'PIN protected, ' : ''}${secret.hasPassphrase ? 'Passphrase' : 'No passphrase'}</li>
        <li>Derivation path: <code>${escapeHTML(secret.derivationPath)}</code></li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-label">How to Use</div>
    <div class="content">
      <ol style="margin: 8px 0; padding-left: 20px;">
        <li>Keep this file secure. Store it separately from your share cards.</li>
        <li>To restore: Use the n-of-m app scanner or upload this file during recovery.</li>
        <li>If vault password is set, you will be prompted to enter it during import.</li>
        <li>This backup can be scanned but contains your <strong>complete secret</strong>. For safer recovery, use individual share cards instead.</li>
      </ol>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Details</div>
    <div class="info-grid">
      <div class="info-label">Vault Name:</div>
      <div>${escapeHTML(secret.name)}</div>
      <div class="info-label">Created:</div>
      <div>${createdDate}</div>
      <div class="info-label">Exported:</div>
      <div>${exportDate}</div>
      <div class="info-label">Word Count:</div>
      <div>${secret.wordCount} words</div>
      <div class="info-label">Addresses:</div>
      <div>${secret.addressCount} addresses</div>
      <div class="info-label">Type:</div>
      <div>${typeName}</div>
    </div>
  </div>

  <div class="qr-container">
    <img src="${qrDataURL}" alt="Vault backup QR code" style="max-width: 100%; height: auto; image-rendering: pixelated;" />
    <p style="font-size: 9px; color: #666; margin-top: 8px;">Scan or photograph for backup</p>
  </div>

  <div class="warning">
    <div class="warning-title">⚠ Important Security Notice</div>
    <p style="margin: 0;">
      This backup contains your complete seed phrase and is as sensitive as the original mnemonic.
      Do not share or upload this file to the cloud unless encrypted. Keep it physically secure,
      separate from your Shamir share cards. If someone gains access to this file and your vault
      password, they can steal your crypto assets.
    </p>
  </div>

  <div class="footer">
    <p style="margin: 0;">Generated by n-of-m vault backup system • Keep secure • Generated on ${exportDate}</p>
  </div>
</div>

<script>
var vaultData = ${JSON.stringify(exportData)};
</${''}script>
</body>
</html>`;

    // Download as HTML file
    const timestamp = datetimeStamp();
    const safeName = secret.name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-vault-backup-${timestamp}.html`;
    a.click();
    URL.revokeObjectURL(url);

    // Also download as PNG image for backup (delay so HTML download triggers first)
    setTimeout(async () => {
      try {
        await downloadHTMLAsImage(html, `${safeName}-vault-backup-${timestamp}.png`);
      } catch (e) {
        console.warn('Failed to generate PNG backup:', e);
      }
    }, 500);

    exportId = null;
  }

  onMount(() => {
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
              <span class="item-name"><span class="badge badge-info">{String(idx + 1).padStart(3, '0')}</span> {secret.name}</span>
              <span class="text-xs text-muted">{formatDateFull(secret.createdAt)}</span>
            </div>
            <div class="item-badges">
              <span class="badge badge-info">{secret.wordCount}W</span>
              <span class="badge badge-info"><i class="fa-thin fa-share-nodes"></i> {secret.shamirConfig.threshold}/{secret.shamirConfig.totalShares}</span>
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

              <div class="detail-section config-inline">
                <span class="text-xs">Path: <code>{secret.derivationPath}</code></span>
                <span class="text-xs">Type: <code>{formatPathType(secret.pathType)}</code></span>
              </div>

              <div class="detail-section">
                <div class="seed-header">
                  <h3 class="text-xs text-muted">SEED PHRASE</h3>
                  <div class="seed-header-actions">
                    <button class="badge badge-info badge-btn" onclick={() => {
                      if (!revealedIds.has(secret.id) && secret.hasPIN) {
                        pinPromptId = secret.id;
                        pinPromptValue = '';
                        pinPromptError = '';
                      } else {
                        const next = new Set(revealedIds);
                        if (next.has(secret.id)) next.delete(secret.id); else next.add(secret.id);
                        revealedIds = next;
                      }
                    }}>
                      <i class="fa-thin {revealedIds.has(secret.id) ? 'fa-eye-slash' : 'fa-eye'}"></i>
                      {revealedIds.has(secret.id) ? 'Hide' : 'Reveal'}
                    </button>
                    <button class="badge badge-info badge-btn" onclick={() => openReprintPopup(secret.id)} title="Edit Shamir shares">
                      <i class="fa-thin fa-share-nodes"></i>
                      Shares
                    </button>
                  </div>
                </div>
                {#if pinPromptId === secret.id}
                  <div class="pin-prompt mt-sm mb-sm">
                    <p class="text-xs mb-sm">Enter PIN to reveal seed phrase.</p>
                    <PinInput bind:value={pinPromptValue} onComplete={async (enteredPin) => {
                      const valid = await verifyPIN(enteredPin);
                      if (valid) {
                        const next = new Set(revealedIds);
                        next.add(secret.id);
                        revealedIds = next;
                        pinPromptId = null;
                      } else {
                        pinPromptError = 'Invalid PIN.';
                        pinPromptValue = '';
                      }
                    }} />
                    {#if pinPromptError}
                      <p class="text-xs mt-sm" style="color: var(--color-error);">{pinPromptError}</p>
                    {/if}
                  </div>
                {/if}
                <MnemonicGrid words={secret.mnemonic.split(' ')} masked={!revealedIds.has(secret.id)} />
              </div>

              {#if secret.addresses.length > 0}
                <div class="detail-section mt-md">
                  <h3 class="text-xs text-muted mb-sm">ADDRESSES ({secret.addresses.length})</h3>
                  <AddressTable addresses={secret.addresses} showPrivateKeys />
                </div>
              {/if}

              <div class="detail-section mt-md">
                <div class="share-sets-header">
                  <h3 class="text-xs text-muted">SHARE SETS</h3>
                  <button class="badge badge-info badge-btn" onclick={() => openReprintPopup(secret.id)}>
                    <i class="fa-thin fa-plus"></i> New Set
                  </button>
                </div>
                <table class="data-table share-sets-table">
                  <colgroup>
                    <col style="width: 9em;" />
                    <col style="width: 6em;" />
                    <col />
                    <col style="width: 3em;" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Config</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="idx-badge">001</span></td>
                      <td><span class="text-xs">{secret.shamirConfig.threshold}/{secret.shamirConfig.totalShares}</span></td>
                      <td><span class="text-xs text-muted">Original &middot; {formatDateFull(secret.createdAt)}</span></td>
                      <td></td>
                    </tr>
                    {#if secret.shareSets}
                      {#each secret.shareSets as ss, ssIdx}
                        <tr>
                          <td><span class="idx-badge">{String(ssIdx + 2).padStart(3, '0')}</span></td>
                          <td><span class="text-xs">{ss.threshold}/{ss.totalShares}</span></td>
                          <td><span class="text-xs text-muted">{formatDateFull(ss.createdAt)}</span></td>
                          <td class="actions">
                            {#if deleteShareSetId === ss.id}
                              <button class="btn-icon" onclick={() => handleDeleteShareSet(secret, ss.id)} title="Confirm delete" style="color: var(--color-error);">
                                <i class="fa-thin fa-check"></i>
                              </button>
                              <button class="btn-icon" onclick={() => { deleteShareSetId = null; }} title="Cancel">
                                <i class="fa-thin fa-xmark"></i>
                              </button>
                            {:else}
                              <button class="btn-icon" onclick={() => { deleteShareSetId = ss.id; }} title="Delete share set">
                                <i class="fa-thin fa-trash"></i>
                              </button>
                            {/if}
                          </td>
                        </tr>
                      {/each}
                    {/if}
                  </tbody>
                </table>
              </div>

              <div class="detail-actions mt-md">
                <button onclick={() => openReprintPopup(secret.id)}>
                  <i class="fa-thin fa-print"></i> Reprint Cards
                </button>
                <button onclick={() => openDuplicatePopup(secret)}>
                  <i class="fa-thin fa-copy"></i> Duplicate
                </button>
                <button onclick={() => { exportId = secret.id; }}>
                  <i class="fa-thin fa-download"></i> Export
                </button>
                <button onclick={() => handleDelete(secret.id)} style="color: var(--color-error);">
                  <i class="fa-thin fa-trash"></i> Delete
                </button>
              </div>

              <!-- Shares popup (reprint + new set) -->
              {#if reprintId === secret.id}
                <button class="popup-overlay" onclick={() => { reprintId = null; }} aria-label="Close popup"></button>
                <div class="popup-card shares-popup">
                  <!-- Full-page layout only for all reprints -->
                  <h4 class="text-xs text-muted mb-sm">REPRINT ORIGINAL ({secret.shamirConfig.threshold}/{secret.shamirConfig.totalShares})</h4>
                  <button class="primary" onclick={() => handleReprint(secret)}>
                    <i class="fa-thin fa-print"></i> Reprint
                  </button>

                  <div class="popup-divider"></div>

                  <h4 class="text-xs text-muted mb-sm">NEW SHARE SET</h4>
                  <div class="new-shares-form">
                    <label class="text-xs">
                      Threshold
                      <input type="number" bind:value={newSharesThreshold} min="2" max={newSharesTotal} style="width: 80px;" />
                    </label>
                    <label class="text-xs">
                      Total
                      <input type="number" bind:value={newSharesTotal} min={newSharesThreshold} max="20" style="width: 80px;" />
                    </label>
                  </div>
                  <div class="popup-actions mt-sm">
                    <button onclick={() => { reprintId = null; }}>Cancel</button>
                    <button class="primary" onclick={() => handleGenerateNewShares(secret)}>
                      <i class="fa-thin fa-plus"></i> Generate &amp; Print
                    </button>
                  </div>
                </div>
              {/if}

              <!-- Duplicate popup -->
              {#if duplicateId === secret.id}
                <button class="popup-overlay" onclick={() => { duplicateId = null; }} aria-label="Close popup"></button>
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
                      placeholder={"m/44'/60'/0'/0/{index}"}
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

              <!-- Export popup -->
              {#if exportId === secret.id}
                <button class="popup-overlay" onclick={() => { exportId = null; exportFormatJSON = false; exportPassword = ''; exportPasswordConfirm = ''; exportPasswordError = ''; }} aria-label="Close popup"></button>
                <div class="popup-card export-popup">
                  {#if exportFormatJSON}
                    <!-- JSON Password Dialog -->
                    <h4 class="text-xs text-muted mb-sm">SET EXPORT PASSWORD</h4>
                    <p class="text-xs text-muted mb-md">This password will encrypt your seed phrase. Keep it safe.</p>
                    <!-- svelte-ignore a11y_autofocus -->
                    <input
                      type="password"
                      bind:value={exportPassword}
                      placeholder="Export password (min 8 chars)"
                      style="width: 100%; margin-bottom: 0.5rem;"
                      autofocus
                    />
                    <input
                      type="password"
                      bind:value={exportPasswordConfirm}
                      placeholder="Confirm password"
                      style="width: 100%; margin-bottom: 0.5rem;"
                    />
                    {#if exportPasswordError}
                      <p class="text-xs mt-sm" style="color: var(--color-error);">{exportPasswordError}</p>
                    {/if}
                    <div class="popup-actions mt-md">
                      <button onclick={() => { exportFormatJSON = false; exportPassword = ''; exportPasswordConfirm = ''; exportPasswordError = ''; }}>Back</button>
                      <button class="primary" onclick={() => exportAsJSON(secret)}>Export</button>
                    </div>
                  {:else}
                    <!-- Format Selection -->
                    <h4 class="text-xs text-muted mb-md">EXPORT FORMAT</h4>
                    <div class="export-options">
                      <button class="export-option" onclick={() => { exportFormatJSON = true; exportPassword = ''; exportPasswordConfirm = ''; exportPasswordError = ''; }}>
                        <div class="export-option-icon">
                          <i class="fa-thin fa-file-code"></i>
                        </div>
                        <div class="export-option-content">
                          <div class="export-option-title">JSON</div>
                          <div class="export-option-desc">AES-256-GCM encrypted seed phrase backup. Password-protected JSON file. Use for secure offline storage or cross-device recovery. Requires password to decrypt.</div>
                        </div>
                      </button>
                      <button class="export-option" onclick={() => exportAsQR(secret)}>
                        <div class="export-option-icon">
                          <i class="fa-thin fa-file-code"></i>
                        </div>
                        <div class="export-option-content">
                          <div class="export-option-title">Share Cards HTML</div>
                          <div class="export-option-desc">Printable HTML file with {secret.shamirConfig.threshold}-of-{secret.shamirConfig.totalShares} Shamir shares. Pre-rendered QR codes embedded. Print to PDF or paper for physical backup. Scan individual cards to recover your secret.</div>
                        </div>
                      </button>
                      <button class="export-option" onclick={() => exportFullPageLayout(secret)}>
                        <div class="export-option-icon">
                          <i class="fa-thin fa-file-pdf"></i>
                        </div>
                        <div class="export-option-content">
                          <div class="export-option-title">Share Cards PDF</div>
                          <div class="export-option-desc">Professional PDF document with {secret.shamirConfig.threshold}-of-{secret.shamirConfig.totalShares} Shamir shares on full-page cards. Enlarged 150% QR codes for reliable scanning on mobile and desktop. Download and print to create physical backup.</div>
                        </div>
                      </button>
                      <button class="export-option" onclick={() => exportAsQRImage(secret)}>
                        <div class="export-option-icon">
                          <i class="fa-thin fa-qrcode"></i>
                        </div>
                        <div class="export-option-content">
                          <div class="export-option-title">Vault Backup HTML</div>
                          <div class="export-option-desc">Complete vault backup with embedded QR code, full seed phrase, all {secret.addressCount} derived addresses, instructions, and security warnings. Store separate from share cards as an additional backup layer.</div>
                        </div>
                      </button>
                    </div>
                    <div class="popup-actions mt-md">
                      <button onclick={() => { exportId = null; }}>Cancel</button>
                    </div>
                  {/if}
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
  .item-badges {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .vault-item-detail {
    padding: var(--spacing-sm) 0 0;
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
  .seed-header-actions {
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }
  .badge-btn {
    cursor: pointer;
    border: none;
    background: var(--color-bg-alt);
    box-shadow: none;
    text-transform: uppercase;
    letter-spacing: 0;
  }
  .badge-btn:hover {
    box-shadow: none;
    transform: none;
    opacity: 0.8;
  }
  .badge-btn i {
    margin-right: 0.15rem;
  }
  .share-sets-table {
    table-layout: fixed;
  }
  .share-sets-table td:nth-child(2) {
    white-space: nowrap;
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
  .popup-divider {
    border-top: 1px solid var(--color-border);
    margin: var(--spacing-md) 0;
  }
  .shares-popup {
    min-width: 360px;
  }
  .pin-prompt {
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .new-shares-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .new-shares-form label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .detail-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding-top: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
  }
  .share-sets-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
  .config-inline {
    display: flex;
    gap: 1.5rem;
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-sm);
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
  }
  .popup-overlay:hover {
    box-shadow: none;
    transform: none;
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
    min-width: 0;
    width: calc(100vw - 2rem);
    max-width: 400px;
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
  .export-popup {
    max-width: 400px;
  }
  .export-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .export-option {
    display: grid;
    grid-template-columns: 2rem 1fr;
    gap: 1rem;
    padding: var(--spacing-md);
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    align-items: flex-start;
  }
  .export-option:hover {
    border-color: var(--color-accent);
    background: var(--color-bg-alt);
  }
  .export-option-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 2.5rem;
  }
  .export-option-icon i {
    font-size: 1.4rem;
    color: var(--color-accent);
  }
  .export-option-content {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .export-option-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text);
  }
  .export-option-desc {
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--color-text-muted);
  }

  @media (max-width: 480px) {
    .share-sets-table {
      display: block;
    }
    .share-sets-table thead {
      display: none;
    }
    .share-sets-table tbody {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .share-sets-table tr {
      display: block;
      border: 1px solid var(--color-border);
      padding: 0.75rem;
      background: var(--color-bg-alt);
    }
    .share-sets-table td {
      display: block;
      padding: 0.25rem 0 !important;
      border: none !important;
    }
    .share-sets-table td:first-child {
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
  }
</style>

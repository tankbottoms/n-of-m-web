# n-of-m TODO

## Layout Standardization - COMPLETED ✓

- [x] Full-page layout: QR fills container, 1 card/page, all 10 addresses, notes section
- [x] Removed 2-up layout: Simplified to single full-page standard
- [x] Removed wallet-size layout: Focuses on full-page export
- [x] QR code sizing: Reduced to 168px (80% of card width) for optimal scannability
- [x] Vault save toast: Top-center slide-in with fade-out animation
- [x] Default derivation addresses: All addresses included (not truncated)
- [x] Export formats: HTML, PDF, Vault Backup HTML with instructions
- [x] QR code consistency: All shares export with same format and address list
- [ ] Test print from Safari, Chrome, Firefox -- check margins, page breaks
- [ ] Verify downloaded HTML renders identically to print preview
- [ ] Screen preview spacing/sizing looks correct at all viewport widths

## Vault Backup Export - COMPLETED ✓

Vault backup formatting and documentation:

- [x] Vault Backup HTML with formatted layout
- [x] Embedded pre-rendered QR code with data URL
- [x] Security warnings and usage instructions
- [x] Complete seed phrase and address information
- [x] Date/time stamps (created and exported)
- [x] Print-optimized CSS and formatting
- [x] Clear labeling distinguishing from share cards
- [x] Error handling for scan attempts on vault QR

---

## Session Review Tasks - v0.3.2

Items to verify after latest export changes:

- [ ] Vault Backup HTML: Verify formatting is print-friendly with proper page breaks
- [ ] Vault Backup QR: Confirm QR code scans correctly and contains all vault data
- [ ] Share Card HTML: Verify pre-rendered PNG QR codes display correctly in browser
- [ ] Share Card PDF: Confirm PDF layout matches HTML export exactly
- [ ] Export Options: Verify all three export formats appear in export popup
- [ ] Scanner Error: Test that vault QR shows helpful error message when scanned
- [ ] Print Dialog: Test File > Print from Chrome/Safari/Firefox matches downloaded HTML
- [ ] Cross-Browser: Verify exports render identically in Safari, Chrome, Firefox
- [ ] Service Worker: Clear caches and verify new code loads without stale SW interference

---

## v2 Protocol: nofm:// URI Scheme + Vault Transfer

Align web to iOS v0.3.0 protocol. Reference spec: `n-of-m/docs/plans/2026-02-22-qr-protocol-vault-transfer-design.md`

### Phase 1: QR Protocol Module

- [ ] Create `src/lib/qr/protocol.ts` -- `encodeShareURI()`, `encodeVaultURI()`, `parseQR()` with URI routing
- [ ] Base64url encode/decode helpers (RFC 4648 section 5, no padding)
- [ ] URI prefixes: `nofm://share/v2/{base64url}`, `nofm://vault/v1/{base64url}`
- [ ] Legacy fallback: raw JSON with `v:1` + `shareData` parsed as `legacy_share`
- [ ] Unit tests for encode/decode roundtrips, legacy parsing, garbage input

### Phase 2: Types + Version Bump

- [ ] Add `VaultTransferPayload` interface to `src/lib/types.ts`
- [ ] Update `SharePayload.v` to `1 | 2` (accept both, generate v2)
- [ ] Bump `package.json` version to `0.3.0`

### Phase 3: Scanner Protocol Routing

- [ ] Update `ScanFlow.svelte` `handleScan()` to use `parseQR()` instead of raw `JSON.parse()`
- [ ] Route by type: `share` / `legacy_share` -> share flow, `vault` -> vault import flow, `unknown` -> error
- [ ] Add `vault_import` state to ScanFlow state machine
- [ ] Backward compatible: v1 JSON cards continue to scan without changes

### Phase 4: Vault Transfer

- [ ] Create `src/lib/qr/transfer.ts` -- `buildTransferQR()`, `decryptTransferPayload()`
- [ ] Encryption: PBKDF2-SHA256 (10k iterations) + AES-256-GCM (uses existing `src/lib/crypto/`)
- [ ] Export flow: VaultPanel -> "Transfer" button -> PIN entry -> encrypted QR display
- [ ] Import flow: scanner detects `nofm://vault/v1/` -> PIN prompt -> decrypt -> validate BIP39 -> save to vault
- [ ] Unit tests for encrypt/decrypt roundtrip, wrong PIN rejection

### Phase 5: QR Center Logo Badge

- [ ] Add CSS overlay for center badge on QR codes (white circle, 2px black border, monospace text)
- [ ] Share QR: display threshold fraction (e.g., "2/3")
- [ ] Vault transfer QR: display "n/m"
- [ ] Bump all QR error correction from M to H (30% recovery for logo overlay)
- [ ] Verify scannability at all 3 layout sizes with center badge occluding ~7-9% center area

### Phase 6: Share Generation v2

- [ ] Update `GenerateFlow.svelte` to produce `v: 2` payloads
- [ ] Update QR encoding from `JSON.stringify(share)` to `encodeShareURI(share)` (base64url-wrapped URI)
- [ ] Update vault re-split to generate v2 payloads
- [ ] Update PDF/HTML templates to use `encodeShareURI()` for QR data

### Phase 7: Fix QR Scanning Reliability

- [ ] Evaluate `zxing-wasm` or `@aspect/barcode-scanner` as jsQR replacement (native multi-QR support)
- [ ] If keeping jsQR: improve tiled scanning -- adaptive tile sizing based on image dimensions
- [ ] PDF scanning: increase render scale for wallet-size layouts (small QR codes need higher DPI)
- [ ] Add scan feedback: distinguish "no QR detected" vs "QR detected but invalid format"
- [ ] Test: scan QR codes generated by iOS app (v2 URI format) and vice versa

### Phase 8: Cross-Platform Validation

- [ ] Generate shares on web, scan on iOS -- both v1 legacy and v2 URI
- [ ] Generate shares on iOS, scan on web -- both v1 legacy and v2 URI
- [ ] Vault transfer: export from iOS, import on web (and reverse)
- [ ] Card layouts: compare PDF output from both apps side-by-side for visual consistency
- [ ] Verify center badge does not break scannability at wallet-size (100px QR)

---

## Camera Scanning Issues (In Progress)

Debugging separately. Known problems:

- [ ] jsQR tiled region approach is brittle for multi-QR detection in uploaded images
- [ ] Low-resolution PDF uploads fail to detect small QR codes (wallet-size layout)
- [ ] No user feedback distinguishing "QR not detected" vs "QR invalid"
- [ ] PDF-to-canvas at 3x scale is memory-intensive for large documents

---

## Monetization: Free Tier + Lifetime Purchase

### Model

| Feature | Web (free) | iOS Free | iOS Lifetime ($1.99) |
|---------|-----------|----------|---------------------|
| Generate mnemonic | Unlimited | Unlimited | Unlimited |
| Import existing mnemonic | Unlimited | Unlimited | Unlimited |
| Shamir split + QR cards | Unlimited | Unlimited | Unlimited |
| Print / download cards | Unlimited | Unlimited | Unlimited |
| Vault storage | 3 secrets | 3 secrets | Unlimited |
| Scan / recover shares | 3 lifetime | 3 lifetime | Unlimited |
| Share sets (re-split) | 1 per secret | 1 per secret | Unlimited |
| Export vault JSON | Yes | Yes | Yes |
| App Store updates | N/A | Lifetime | Lifetime |

### Rationale

- Generation and splitting are free and unlimited -- the core security tool should never be paywalled
- The paywall gates convenience features: storing many secrets in the vault and recovering more than 3 times
- 3 lifetime scans is generous enough to prove the app works but creates a natural upgrade point for power users
- $1.99 lifetime is low-friction, no subscriptions, aligns with the audit-friendly open-source ethos
- Web PWA remains fully functional at free tier -- the iOS app is a convenience/trust purchase

### Limits Implementation

#### Storage Format

Add to `SecretRecord` or a separate settings store:

```typescript
interface UsageLimits {
  scanCount: number;        // lifetime scans completed
  vaultCount: number;       // current secrets in vault (derived, not stored)
  shareSetCount: number;    // extra share sets generated per secret
}

interface PurchaseState {
  tier: 'free' | 'lifetime';
  purchaseDate?: number;
  receiptData?: string;     // iOS StoreKit receipt for validation
}
```

#### Web Implementation

- Store `UsageLimits` in localStorage under `shamir_usage_limits`
- Store `PurchaseState` in localStorage (web is always free tier)
- Check limits before scan, vault save, and share set generation
- Show remaining count in UI: "2 of 3 scans remaining"
- When limit hit: show message explaining the limit, link to iOS app
- No server-side enforcement -- web is open source and auditable, limits are honor-system for the PWA

#### iOS Implementation

- Store `UsageLimits` in `expo-secure-store` (encrypted, backed up)
- Store `PurchaseState` in `expo-secure-store`
- Use StoreKit 2 via `expo-in-app-purchases` or `react-native-iap`
- Single non-consumable product: `com.anonymous.ios-shamir.lifetime`
- Receipt validation: local only (no server), verify with Apple's on-device API
- Restore purchases support required by App Store guidelines
- On purchase: set `tier: 'lifetime'`, persist immediately

#### Limit Enforcement Points

**Vault save** (`saveSecret`):
```
if tier === 'free' && vaultCount >= 3:
  show "Vault limit reached. Upgrade to store unlimited secrets."
```

**Scan/recover** (`handleScan` when threshold met):
```
if tier === 'free' && scanCount >= 3:
  show "Recovery limit reached. Upgrade for unlimited recoveries."
  // Still allow -- they've already scanned the shares, blocking here is hostile
  // Instead: show the recovered mnemonic but increment counter and warn
```

**Share sets** (`handleGenerateNewShares`):
```
if tier === 'free' && secret.shareSets?.length >= 1:
  show "Free tier allows 1 additional share set per secret."
```

### UI Changes Required

#### Web

- [ ] Add `src/lib/limits.ts` -- `checkVaultLimit()`, `checkScanLimit()`, `checkShareSetLimit()`, `getUsage()`, `incrementScan()`
- [ ] ScanFlow: after successful recovery, show remaining scan count
- [ ] ScanFlow: when camera active, show subtle banner: "Scan easier with the iOS app" + App Store badge/link
- [ ] VaultPanel: when at 3 secrets, show upgrade prompt instead of allowing save
- [ ] VaultPanel: share sets button shows lock icon after 1 set on free tier
- [ ] SettingsPanel: add "Usage" section showing limits and counts
- [ ] SettingsPanel: add "Get the App" section with App Store link + QR code to store listing

#### iOS

- [ ] Add `lib/limits.ts` (shared logic, same interface as web)
- [ ] Add `lib/purchase.ts` -- StoreKit 2 integration, purchase flow, restore
- [ ] Add purchase screen / modal with feature comparison table
- [ ] Settings screen: show tier, purchase date, restore button
- [ ] Same limit enforcement points as web
- [ ] App Store review: ensure "restore purchases" is accessible from settings

### App Store Scan Prompt (Web)

When the camera is active in ScanFlow, show a non-intrusive banner:

```
+--------------------------------------------------+
| [app-icon]  Scan with the iOS app for the best   |
|             camera experience.                    |
|             [Get on the App Store]                |
+--------------------------------------------------+
```

- Only show once per session (use sessionStorage flag)
- Dismissible with X button
- Links to App Store listing
- Position: below the camera area, above the action buttons
- Do NOT show when using file upload (only camera)

---

## Shared Code Strategy

Both projects (`n-of-m-web` and `n-of-m`) share identical crypto/Shamir logic:

```
Web:  src/lib/shamir/     src/lib/crypto/     src/lib/wallet/     src/lib/types.ts
iOS:  lib/shamir/         lib/crypto/         lib/wallet/         constants/types.ts
```

### Current State

- Both codebases have independent copies of the same algorithms
- Types are slightly diverged (web has `ShareSet`, iOS may not yet)

### Future Consideration

- Keep independent copies for now -- the crypto code is stable and rarely changes
- If the code diverges significantly, consider extracting to a shared npm package
- The shared package would be `@n-of-m/core` with shamir, crypto, wallet, and types
- Both projects would depend on it, reducing drift risk
- Not urgent -- only do this if the crypto layer needs changes that must stay in sync

---

## Other TODO

- [ ] Playwright E2E tests for generate flow, scan flow, vault operations
- [ ] Verify service worker caching works correctly in production (Vercel)
- [ ] iOS bundleIdentifier: change from `com.anonymous.ios-shamir` to real identifier
- [ ] App Store assets: screenshots, description, privacy policy
- [ ] Privacy policy page (required for App Store) -- can host on the web app
- [ ] Web: meta tags for Open Graph / social sharing

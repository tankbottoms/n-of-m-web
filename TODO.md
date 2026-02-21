# n-of-m TODO

## Immediate: PDF Layout Polish

Before any monetization or feature work, lock down the print layouts:

- [x] Full-page layout: QR fills container, 1 card/page, all 10 addresses, notes section
- [x] 2-up layout: 2 cards/page, 5 addresses each, condensed instructions
- [x] Wallet-size layout: 4 cards/page with wallet-specific CSS overrides (compact padding/fonts/borders)
- [x] QR code sizing: inline style with explicit pixel dimensions, image-rendering: pixelated
- [x] Vault save toast: top-center slide-in with fade-out animation (replaced jumping popup)
- [x] Default derivation addresses: increased from 5 to 10
- [ ] Test print from Safari, Chrome, Firefox -- check margins, page breaks
- [ ] Verify downloaded HTML renders identically to print preview
- [ ] Standalone HTML (`n-of-m-standalone.html`) opens and functions offline
- [ ] Screen preview spacing/sizing looks correct at all viewport widths
- [ ] Verify QR scannability at all sizes (full 280px, compact 160px, wallet 100px) with error correction H

## Session Review Tasks

Items to verify in next session:

- [ ] Wallet layout: confirm 4 cards fit without overflow when printing from real browser (not just Playwright PDF)
- [ ] Compact layout: verify 2-up cards don't clip at bottom on letter paper vs A4
- [ ] Toast animation: verify save-to-vault toast appears at top center and fades smoothly (no jumping)
- [ ] Service worker: clear caches and verify new code loads without stale SW interference
- [ ] Print dialog: test File > Print from Chrome/Safari matches downloaded HTML output
- [ ] Address display: verify full-page shows 10, compact shows 5, wallet shows 3 addresses

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

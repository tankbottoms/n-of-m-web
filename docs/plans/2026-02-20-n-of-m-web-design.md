# n-of-m-web Design Document

**Date:** 2026-02-20
**Status:** Approved

## Overview

Web port of the n-of-m mobile app (Ethereum seed phrase manager with Shamir's Secret Sharing) using the visual design system and flow patterns from cik-oig. Full feature parity with the mobile app.

## Decisions

- **Architecture:** Fully client-side SPA. No server API routes. All crypto in-browser.
- **Stack:** SvelteKit 2 (Svelte 5 runes), Bun, TypeScript, adapter-static, Vercel deployment.
- **Styling:** cik-oig's neo-brutalist design system -- custom CSS variables, monospace-first typography, hard 2px shadows, sharp corners (border-radius: 0), Font Awesome Pro thin weight icons, light/dark mode.
- **Scope:** Full parity with mobile app.
- **QR Scanning:** WebRTC camera (primary) with file upload fallback.

## Architecture

```
n-of-m-web/
├── src/
│   ├── app.css                    # cik-oig design tokens + n-of-m additions
│   ├── app.html
│   ├── routes/
│   │   ├── +layout.svelte         # Font Awesome, theme toggle, app shell
│   │   └── +page.svelte           # Single page: mode-driven UI
│   ├── lib/
│   │   ├── shamir/                # Direct port from mobile (split, combine, GF(256))
│   │   │   ├── codec.ts
│   │   │   ├── combine.ts
│   │   │   ├── constants.ts
│   │   │   ├── horner.ts
│   │   │   ├── index.ts
│   │   │   ├── lagrange.ts
│   │   │   ├── points.ts
│   │   │   ├── random.ts          # Web Crypto: crypto.getRandomValues
│   │   │   ├── share.ts
│   │   │   ├── split.ts
│   │   │   └── table.ts
│   │   ├── crypto/                # AES-256-GCM via @noble/ciphers
│   │   │   ├── aes.ts             # encrypt/decrypt (Web Crypto for RNG)
│   │   │   └── kdf.ts             # PBKDF2 via crypto.subtle
│   │   ├── wallet/                # BIP39/BIP32/BIP44 via ethers.js
│   │   │   ├── generate.ts        # Mnemonic generation/validation
│   │   │   └── derive.ts          # HD wallet derivation
│   │   ├── entropy/               # System RNG + mouse/touch motion
│   │   │   └── motion.ts
│   │   ├── pdf/                   # Share card HTML templates + browser print
│   │   │   ├── templates.ts
│   │   │   └── layouts.ts
│   │   ├── storage/               # IndexedDB vault with AES encryption
│   │   │   └── vault.ts
│   │   ├── scanner/               # WebRTC camera + jsQR decode
│   │   │   └── qr.ts
│   │   └── types.ts               # Shared types (ported from mobile)
│   └── components/
│       ├── ThemeToggle.svelte
│       ├── Hero.svelte
│       ├── GenerateFlow.svelte
│       ├── ScanFlow.svelte
│       ├── VaultPanel.svelte
│       ├── SettingsPanel.svelte
│       ├── MnemonicGrid.svelte
│       ├── EntropyCanvas.svelte
│       ├── ShareCard.svelte
│       ├── AddressTable.svelte
│       ├── PathEditor.svelte
│       ├── StepIndicator.svelte
│       ├── PinInput.svelte
│       ├── TerminalLog.svelte
│       └── Panel.svelte
├── static/
│   └── fontawesome/               # Font Awesome Pro 6 (thin weight)
├── svelte.config.js               # adapter-static
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Porting Decisions

| Mobile API | Web Equivalent |
|-----------|---------------|
| `expo-crypto.getRandomBytes(n)` | `crypto.getRandomValues(new Uint8Array(n))` |
| `Buffer` (Node.js) | `buffer` npm package (same as mobile) |
| `@noble/ciphers` (AES-256-GCM) | Same package, works in browser |
| `ethers.js` (BIP39/BIP32) | Same package, works in browser |
| `expo-camera` (QR scanner) | WebRTC `getUserMedia` + `jsQR` |
| `expo-sensors` (accelerometer) | Mouse/touch movement events |
| `expo-secure-store` | IndexedDB with AES encryption |
| `expo-local-authentication` (biometrics) | Optional vault master password |
| `expo-print` (PDF) | `window.print()` with `@media print` CSS |
| `expo-sharing` | Browser download / share API |

## UI Flow

### State Machine

```
HERO (centered, 25vh margin-top)
  ├── GENERATE -> 7-step wizard
  ├── SCAN -> camera + recovery
  ├── VAULT -> stored secrets
  └── SETTINGS -> preferences
```

Hero transitions to active state (margin-top: 1.5rem, max-width expands) on mode selection, matching cik-oig's search activation pattern.

### Generate Flow (7 Steps)

| Step | Panel | Description |
|------|-------|-------------|
| 1 | Word Count | Button group: 12/15/18/21/24 |
| 2 | Entropy | System/Motion/Combined + mouse motion canvas |
| 3 | Mnemonic | Generated word grid OR import textarea with validation |
| 4 | Derivation | MetaMask/Ledger/Custom path + address preview table |
| 5 | Shamir | Threshold (n) and total shares (m) with +/- controls |
| 6 | Metadata | Name, optional PIN, optional passphrase, notes |
| 7 | Preview | Inline share card previews + Print/Download |

### Scan Flow

- WebRTC camera viewfinder in a panel
- Progress dots: filled per scanned share, empty for remaining
- Auto-reconstruct when threshold met
- Show recovered mnemonic + derived addresses
- File upload fallback button
- PIN prompt if share has `hasPIN: true`

### Vault

- List of stored secrets as panel rows
- Click to expand: reveal mnemonic (masked), addresses, private keys
- Per-secret lock/unlock, inline rename, derive more addresses
- Re-export PDF cards, delete with inline confirmation

### Settings

- Highlight color picker (Pastels/Bold/Muted palettes)
- Border width slider
- Dark/light mode toggle
- PDF layout preference (Full/Compact/Wallet)
- Default word count
- Vault master password set/change/remove

## Visual Design

### CSS Variables (from cik-oig + additions)

```css
/* Inherited from cik-oig verbatim */
--color-bg, --color-bg-secondary, --color-bg-alt, --color-hover-bg
--color-text, --color-text-muted
--color-border, --color-border-light, --color-border-dark, --color-shadow
--color-link
--color-success, --color-warning, --color-error, --color-info
--scheme-shell
--font-mono
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl

/* n-of-m additions */
--color-accent: #5c6bc0;
--color-crypto-bg: #1a1a2e;
--color-crypto-text: #00ff88;
```

### Component Patterns

- **Buttons:** Monospace, uppercase, 2px hard shadow, lift on hover, press on active
- **Panels:** 1px border + 2px shadow, uppercase panel-header with letter-spacing
- **Badges:** Semantic colors (clear/match/possible/checking) with 15% opacity bg
- **Inputs:** Monospace, flat, shadow on focus
- **Terminal log:** Alt background, `> ` prefix, color-coded lines
- **Tables:** `.data-table` with hover rows, uppercase muted headers

### MnemonicGrid

4-column grid (3 tablet, 2 mobile) of bordered cells with:
- Index number (muted, top-left)
- BIP39 word (monospace, centered)
- Each cell: `border: 1px solid var(--color-border-dark)`, `box-shadow: 2px 2px 0`

### Step Indicator

Horizontal badge row using entity-badge styling:
- Active: `background: var(--color-accent)`
- Completed: `background: var(--color-success)` + checkmark
- Future: muted, no fill

### Responsive Breakpoints

- Desktop: 14px base, 900px max-width container
- Tablet (<=768px): 13px base, tighter padding
- Mobile (<=480px): 12px base, minimal padding

## Dependencies

```json
{
  "dependencies": {
    "ethers": "^6.16",
    "@noble/ciphers": "^2.1",
    "buffer": "^6.0",
    "jsqr": "^1.4",
    "uuid": "^11"
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.50",
    "@sveltejs/adapter-static": "^3",
    "svelte": "^5.51",
    "vite": "^7.3",
    "typescript": "^5.9"
  }
}
```

## Security Considerations

- All crypto operations client-side only
- No network requests (except Font Awesome CDN fallback -- use local copy)
- IndexedDB vault encrypted with AES-256-GCM
- PIN-derived keys via PBKDF2 (100,000 iterations)
- Mnemonic/private keys never leave the browser
- CSP headers to prevent XSS
- No telemetry, no analytics

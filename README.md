# n of m

Shamir's Secret Sharing for Seed Phrases. Split. Print. Recover.

![Share Cards Preview](docs/screenshot.png)

## Overview

**n of m** splits BIP39 seed phrases into *m* Shamir shares where any *n* can reconstruct the original secret. Each share is encoded as a QR code on a printable card. No network requests. All cryptography runs in your browser.

## Features

- **Generate** -- Create 12/15/18/21/24-word seed phrases with system CSPRNG or mouse entropy
- **Split** -- Shamir's Secret Sharing over GF(2^8), configurable threshold and total shares
- **Print** -- Full-page card layout with QR codes sized for reliable scanning
- **Export** -- Share Cards (HTML, PDF) and Vault Backup (HTML, PNG)
- **Scan** -- Camera or file-based QR scanning with jsQR fallback
- **Recover** -- Upload exported HTML, PDF, JSON, or image files to reconstruct secrets
- **Vault** -- AES-256-GCM encrypted IndexedDB storage with optional password protection
- **Derive** -- BIP44 HD wallet address derivation (MetaMask, Ledger, custom paths)
- **Offline** -- Fully client-side SPA, zero server dependencies

## Export Formats

### Share Cards

Individual share cards for distribution and recovery.

| Format | Description |
|--------|-------------|
| HTML | Printable cards with embedded QR codes and share data for offline use |
| PDF | Print-ready documents, one full-page card per page |

### Vault Backup

Complete secret backup for archival.

| Format | Description |
|--------|-------------|
| HTML | Full backup document with QR code, addresses, and instructions |
| PNG | Vault configuration as a single scannable QR code image |

### Recovery

All export formats can be uploaded in the Scan tab to recover shares:

- HTML files (share cards and vault backups)
- PDF exports
- JSON vault exports
- QR code images (PNG, JPG)
- Live camera scanning of printed cards

## Cryptography

| Component | Implementation |
|-----------|---------------|
| Secret Sharing | Shamir's scheme over GF(2^8) finite field |
| Encryption | AES-256-GCM via `@noble/ciphers` |
| Key Derivation | PBKDF2-SHA256 (100k iterations) |
| Wallet Derivation | BIP39/BIP44 via `ethers.js` |
| Random | `crypto.getRandomValues()` CSPRNG |

## Security Model

- All operations are client-side. No data leaves the browser.
- Seed phrases and private keys exist only in memory during generation.
- Vault entries are encrypted with AES-256-GCM before storage in IndexedDB.
- Shamir shares individually reveal zero information about the secret.
- PIN protection adds an additional encryption layer to share data.

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes)
- TypeScript
- Vite 7
- `@sveltejs/adapter-static` (fully static SPA)
- QRious (QR generation), jsQR (QR scanning)
- html2pdf.js (client-side PDF generation)

## Development

```bash
bun install
bun run dev          # dev server on :5173
bun run build        # production build to ./build
bun run preview      # preview production build
bun run test         # run unit tests
bun run check        # svelte-check type checking
```

## Project Structure

```
src/
  components/        # Svelte 5 UI components
    GenerateFlow     # 7-step mnemonic generation wizard
    ScanFlow         # QR scanning and file upload recovery
    VaultPanel       # Encrypted vault management and exports
    SettingsPanel    # App settings and data management
  lib/
    crypto/          # AES-256-GCM encryption
    entropy/         # Mouse-based entropy collection
    pdf/             # HTML/PDF template rendering and layouts
    scanner/         # QR code detection (camera + file)
    shamir/          # GF(2^8) secret sharing implementation
    storage/         # IndexedDB vault with encryption
    wallet/          # BIP39/BIP44 HD wallet derivation
scripts/
  bundle-single-file # Standalone HTML bundler
  e2e-test           # End-to-end test runner
tests/               # Playwright integration tests
```

## Deployment

Static site deployed to Vercel. Auto-deploys on push to `main`.

```bash
bun run build        # outputs to ./build
```

The build also produces `build/n-of-m-standalone.html`, a single self-contained HTML file with all assets inlined.

## License

MIT

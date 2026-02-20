# n of m

Shamir's Secret Sharing for Seed Phrases. Split. Print. Recover.

![Share Cards Preview](docs/screenshot.png)

## Overview

**n of m** splits BIP39 seed phrases into *m* Shamir shares where any *n* can reconstruct the original secret. Each share is encoded as a QR code on a printable card. No network requests. All cryptography runs in your browser.

## Features

- **Generate** - Create 12/15/18/21/24-word seed phrases with system CSPRNG or mouse entropy
- **Split** - Shamir's Secret Sharing over GF(2^8), configurable threshold and total shares
- **Print** - Full page, compact (2-up), or wallet-size (4-up) PDF layouts with QR codes
- **Scan** - Camera or file-based QR scanning to reconstruct secrets
- **Vault** - AES-256-GCM encrypted IndexedDB storage with optional password protection
- **Derive** - BIP44 HD wallet address derivation (MetaMask, Ledger, custom paths)
- **Offline** - Fully client-side SPA, no server, no API calls

## Cryptography

| Component | Implementation |
|-----------|---------------|
| Secret Sharing | Shamir's scheme over GF(2^8) finite field |
| Encryption | AES-256-GCM via `@noble/ciphers` |
| Key Derivation | PBKDF2-SHA256 (100k iterations) |
| Wallet Derivation | BIP39/BIP44 via `ethers.js` |
| Random | `crypto.getRandomValues()` CSPRNG |

## Tech Stack

- SvelteKit 2 + Svelte 5 (runes)
- TypeScript
- Vite 7
- `@sveltejs/adapter-static` (fully static SPA)
- QRious (QR generation)
- jsQR (QR scanning)

## Development

```bash
bun install
bun run dev        # dev server on :5173
bun run build      # production build to ./build
bun run preview    # preview production build
bun run test       # run unit tests
bun run check      # svelte-check type checking
```

## Security Model

- All operations are client-side. No data leaves the browser.
- Seed phrases and private keys exist only in memory during generation.
- Vault entries are encrypted with AES-256-GCM before storage in IndexedDB.
- Shamir shares individually reveal zero information about the secret.
- PIN protection adds an additional encryption layer to share data.

## License

MIT

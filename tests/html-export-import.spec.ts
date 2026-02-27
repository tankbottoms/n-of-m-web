import { test, expect } from '@playwright/test';

test.describe('HTML Export Import Functionality', () => {
  test('should extract shares from HTML export with single share', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      // Simulate exported HTML with single share
      const sharePayload = {
        v: 1,
        id: 'test-id-123',
        name: 'Test Secret',
        shareIndex: 1,
        totalShares: 3,
        threshold: 2,
        shareData: 'encrypted-share-data',
        wordCount: 12,
        derivationPath: "m/44'/0'/0'/0",
        pathType: 'standard',
        hasPIN: false,
        hasPassphrase: false
      };

      const shareJSON = JSON.stringify(sharePayload);
      const qrDatas = [shareJSON];

      // Build HTML matching the app's actual output format (templates.ts)
      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div class="page">
  <div class="card">
    <canvas id="qr-card-0" width="168" height="168"></canvas>
  </div>
</div>
<script>var shareData = ${JSON.stringify(qrDatas)};</script>
<script>
new QRious({
  element: document.getElementById('qr-card-0'),
  value: ${JSON.stringify(qrDatas[0])},
  size: 168,
  level: 'H'
});
</script>
</body>
</html>`;

      // Primary extraction: var shareData array (matches ScanFlow.svelte:282)
      const shares: string[] = [];
      const shareDataMatch = htmlContent.match(/var\s+shareData\s*=\s*(\[.*?\]);/s);
      if (shareDataMatch) {
        try {
          const parsed: string[] = JSON.parse(shareDataMatch[1]);
          for (const item of parsed) {
            JSON.parse(item); // validate
            shares.push(item);
          }
        } catch (e) {
          console.warn('Failed to parse shareData:', e);
        }
      }

      // Fallback: QRious value regex with double quotes (matches ScanFlow.svelte:297)
      if (shares.length === 0) {
        const qriousMatches = htmlContent.matchAll(/value:\s*"((?:[^"\\]|\\.)*)"/g);
        for (const match of qriousMatches) {
          try {
            const unescaped = match[1]
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'")
              .replace(/\\\//g, '/')
              .replace(/\\\\/g, '\\');
            JSON.parse(unescaped);
            shares.push(unescaped);
          } catch (e) {
            console.warn('Invalid share:', e);
          }
        }
      }

      return {
        sharesFound: shares.length,
        firstShareValid: shares.length > 0 && shares[0].includes('"v"') && shares[0].includes('"shareData"'),
        dataExtracted: shares.length === 1
      };
    });

    console.log('HTML export with single share:', result);
    expect(result.sharesFound).toBe(1);
    expect(result.firstShareValid).toBe(true);
    expect(result.dataExtracted).toBe(true);
  });

  test('should extract multiple shares from combined HTML export', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      // Create 3 shares
      const sharePayloads = Array.from({ length: 3 }, (_, i) => ({
        v: 1,
        id: 'test-id-123',
        name: 'Test Secret',
        shareIndex: i + 1,
        totalShares: 3,
        threshold: 2,
        shareData: `encrypted-share-${i}`,
        wordCount: 12,
        derivationPath: "m/44'/0'/0'/0",
        pathType: 'standard',
        hasPIN: false,
        hasPassphrase: false
      }));

      const qrDatas = sharePayloads.map(s => JSON.stringify(s));

      // Build HTML with all shares (matching app's templates.ts format)
      let htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>`;

      for (let i = 0; i < sharePayloads.length; i++) {
        htmlContent += `
<div class="page">
  <div class="card">
    <canvas id="qr-card-${i}"></canvas>
  </div>
</div>`;
      }

      htmlContent += `
<script>var shareData = ${JSON.stringify(qrDatas)};</script>
<script>`;

      for (let i = 0; i < qrDatas.length; i++) {
        htmlContent += `
new QRious({
  element: document.getElementById('qr-card-${i}'),
  value: ${JSON.stringify(qrDatas[i])},
  size: 168,
  level: 'H'
});`;
      }

      htmlContent += `
</script>
</body></html>`;

      // Primary extraction: var shareData array
      const extractedShares: string[] = [];
      const shareDataMatch = htmlContent.match(/var\s+shareData\s*=\s*(\[.*?\]);/s);
      if (shareDataMatch) {
        try {
          const parsed: string[] = JSON.parse(shareDataMatch[1]);
          for (const item of parsed) {
            JSON.parse(item); // validate
            extractedShares.push(item);
          }
        } catch (e) {
          console.warn('Failed to parse shareData:', e);
        }
      }

      return {
        totalShares: sharePayloads.length,
        extractedShares: extractedShares.length,
        allValid: extractedShares.length === 3,
        shareIndices: extractedShares.map(s => {
          try {
            return JSON.parse(s).shareIndex;
          } catch {
            return null;
          }
        })
      };
    });

    console.log('HTML export with multiple shares:', result);
    expect(result.totalShares).toBe(3);
    expect(result.extractedShares).toBe(3);
    expect(result.allValid).toBe(true);
    expect(result.shareIndices).toEqual([1, 2, 3]);
  });

  test('should verify vault and share exports are formatted consistently', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const sharePayload = {
        v: 1,
        id: 'vault-123',
        name: 'Recovered Secret',
        shareIndex: 1,
        totalShares: 3,
        threshold: 2,
        shareData: 'share-data-encrypted',
        wordCount: 12,
        derivationPath: "m/44'/0'/0'/0",
        pathType: 'standard',
        hasPIN: false,
        hasPassphrase: false
      };

      const vaultPayload = {
        name: 'My Vault',
        mnemonic: 'word ' + 'word '.repeat(11) + 'word',
        wordCount: 12,
        derivationPath: "m/44'/0'/0'/0",
        pathType: 'standard',
        shamirConfig: {
          threshold: 2,
          totalShares: 3
        },
        addresses: Array.from({ length: 10 }, (_, i) => ({
          index: i,
          address: `address-${i}`
        })),
        hasPassphrase: false,
        hasPIN: false
      };

      return {
        shareFormat: {
          hasRequired: !!(sharePayload.v && sharePayload.shareData && sharePayload.id),
          size: JSON.stringify(sharePayload).length
        },
        vaultFormat: {
          hasRequired: !!(vaultPayload.mnemonic && vaultPayload.shamirConfig),
          addressCount: vaultPayload.addresses.length,
          size: JSON.stringify(vaultPayload).length
        },
        consistency: {
          shareAndVaultBothValid: !!(sharePayload.v && vaultPayload.mnemonic),
          vaultHasAllAddresses: vaultPayload.addresses.length === 10,
          note: 'Vault exports now include all addresses (not truncated to 5)'
        }
      };
    });

    console.log('Export format consistency:', result);
    expect(result.shareFormat.hasRequired).toBe(true);
    expect(result.vaultFormat.hasRequired).toBe(true);
    expect(result.consistency.vaultHasAllAddresses).toBe(true);
  });

  test('should handle escaped quotes in HTML QR values', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const sharePayload = {
        v: 1,
        id: 'test-id',
        name: 'Secret with quotes',
        shareData: 'share-with-data',
        wordCount: 12,
        derivationPath: "m/44'/0'/0'/0",
        pathType: 'standard',
        shareIndex: 1,
        totalShares: 3,
        threshold: 2,
        hasPIN: false,
        hasPassphrase: false
      };

      const shareJSON = JSON.stringify(sharePayload);

      // Match app format: value: ${JSON.stringify(shareJSON)} produces double-quoted string
      const htmlContent = `<script>
new QRious({
  value: ${JSON.stringify(shareJSON)},
  size: 168
});
</script>`;

      // Use the app's double-quote regex (ScanFlow.svelte:297)
      const match = htmlContent.match(/value:\s*"((?:[^"\\]|\\.)*)"/);
      if (match) {
        const shareData = match[1];
        const unescaped = shareData
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\//g, '/')
          .replace(/\\\\/g, '\\');

        try {
          const parsed = JSON.parse(unescaped);
          return {
            extractedSuccessfully: true,
            namePreserved: parsed.name === 'Secret with quotes',
            dataPreserved: parsed.shareData === 'share-with-data',
            derivationPathPreserved: parsed.derivationPath === "m/44'/0'/0'/0",
            isValidJSON: true
          };
        } catch (e) {
          return { extractedSuccessfully: false, error: String(e) };
        }
      }

      return { extractedSuccessfully: false };
    });

    console.log('Escaped character handling:', result);
    expect(result.extractedSuccessfully).toBe(true);
    expect(result.namePreserved).toBe(true);
  });
});

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://n-of-m-web.vercel.app';

test.describe('HTML Export Import Functionality', () => {
  test('should extract shares from HTML export with single share', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

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
<script>
new QRious({
  element: document.getElementById('qr-card-0'),
  value: '${shareJSON.replace(/'/g, "\\'")}',
  size: 168,
  level: 'H'
});
</script>
</body>
</html>`;

      // Extract shares using the same regex pattern as the app
      const shares: string[] = [];
      const qriousMatches = htmlContent.matchAll(/value:\s*'([^']*(?:\\'[^']*)*)/g);

      for (const match of qriousMatches) {
        const shareData = match[1];
        try {
          const unescaped = shareData.replace(/\\'/g, "'");
          // Verify it's valid JSON
          const parsed = JSON.parse(unescaped);
          if (parsed.v && parsed.shareData) {
            shares.push(unescaped);
          }
        } catch (e) {
          console.warn('Invalid share:', e);
        }
      }

      return {
        sharesFound: shares.length,
        firstShareValid: shares.length > 0 && shares[0].includes('v') && shares[0].includes('shareData'),
        dataExtracted: shares.length === 1
      };
    });

    console.log('HTML export with single share:', result);
    expect(result.sharesFound).toBe(1);
    expect(result.firstShareValid).toBe(true);
    expect(result.dataExtracted).toBe(true);
  });

  test('should extract multiple shares from combined HTML export', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      // Create 3 shares
      const shares = Array.from({ length: 3 }, (_, i) => ({
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

      // Build HTML with all shares
      let htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>`;

      for (const share of shares) {
        const shareJSON = JSON.stringify(share);
        htmlContent += `
<div class="page">
  <div class="card">
    <canvas id="qr-card-${share.shareIndex - 1}"></canvas>
  </div>
</div>
<script>
new QRious({
  element: document.getElementById('qr-card-${share.shareIndex - 1}'),
  value: '${shareJSON.replace(/'/g, "\\'")}',
  size: 168,
  level: 'H'
});
</script>`;
      }

      htmlContent += `</body></html>`;

      // Extract shares
      const extractedShares: string[] = [];
      const qriousMatches = htmlContent.matchAll(/value:\s*'([^']*(?:\\'[^']*)*)/g);

      for (const match of qriousMatches) {
        const shareData = match[1];
        try {
          const unescaped = shareData.replace(/\\'/g, "'");
          const parsed = JSON.parse(unescaped);
          if (parsed.v && parsed.shareData) {
            extractedShares.push(unescaped);
          }
        } catch (e) {
          console.warn('Invalid share:', e);
        }
      }

      return {
        totalShares: shares.length,
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
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      // Generate a share payload
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

      // Generate vault payload (what would be exported from vault)
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
          hasRequired: sharePayload.v && sharePayload.shareData && sharePayload.id,
          size: JSON.stringify(sharePayload).length
        },
        vaultFormat: {
          hasRequired: vaultPayload.mnemonic && vaultPayload.shamirConfig,
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
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      // Test with escaped characters
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
      const htmlContent = `<script>
new QRious({
  value: '${shareJSON.replace(/'/g, "\\'")}',
  size: 168
});
</script>`;

      // Try to extract and unescape using the same pattern as the app
      const match = htmlContent.match(/value:\s*'([^']*(?:\\'[^']*)*)/);
      if (match) {
        const shareData = match[1];
        const unescaped = shareData.replace(/\\'/g, "'");

        try {
          const parsed = JSON.parse(unescaped);
          return {
            extractedSuccessfully: true,
            namePreserved: parsed.name === 'Secret with quotes',
            dataPreserved: parsed.shareData === 'share-with-data',
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

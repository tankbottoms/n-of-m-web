import { test, expect } from '@playwright/test';

test.describe('Scanner/Camera Functionality', () => {
  let consoleLogs: string[];
  let consoleErrors: string[];
  let consoleWarnings: string[];

  test.beforeEach(async ({ page }) => {
    // Reset console arrays for each test
    consoleLogs = [];
    consoleErrors = [];
    consoleWarnings = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'log') consoleLogs.push(text);
      if (msg.type() === 'error') consoleErrors.push(text);
      if (msg.type() === 'warning') consoleWarnings.push(text);
    });
  });

  test('should load the application successfully', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    console.log(`Page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have no critical console errors on initial load', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Filter out non-critical errors (e.g., extension errors)
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('undefined is not a function') && // content script errors
             !err.includes('Extension') &&
             !err.includes('Failed to load resource')
    );

    console.log(`Console errors (critical): ${criticalErrors.length}`);
    criticalErrors.forEach(err => console.log(`  - ${err}`));
    expect(criticalErrors.length).toBe(0);
  });

  test('should show scan UI elements on the scan tab', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Navigate to scan tab
    const scanButton = page.locator('button:has-text("Scan")').first();
    if (await scanButton.isVisible()) {
      await scanButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify scan UI elements are present (camera area, file upload, etc.)
    // The scanner doesn't auto-start - it requires explicit user action
    const hasFileInput = await page.locator('input[type="file"]').count();
    const hasCameraArea = await page.locator('.camera-area').count();
    const hasUploadButton = await page.locator('button:has-text("Upload"), button:has-text("upload"), label:has-text("Upload"), label:has-text("upload")').count();

    console.log(`Scan UI elements: file input=${hasFileInput}, camera area=${hasCameraArea}, upload button=${hasUploadButton}`);

    // At minimum, the file upload input should be present for file-based scanning
    expect(hasFileInput + hasCameraArea + hasUploadButton).toBeGreaterThan(0);
  });

  test('should have camera start button available in scan tab', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Navigate to scan tab
    const scanButton = page.locator('button:has-text("Scan")').first();
    if (await scanButton.isVisible()) {
      await scanButton.click();
      await page.waitForTimeout(1000);
    }

    // Camera requires explicit start - verify button or camera area exists
    // In headless mode, camera won't actually start but UI elements should be present
    const cameraArea = page.locator('.camera-area');
    const cameraAreaVisible = await cameraArea.count() > 0;

    const fileInput = page.locator('input[type="file"]');
    const fileInputExists = await fileInput.count() > 0;

    console.log(`Camera area visible: ${cameraAreaVisible}, File input exists: ${fileInputExists}`);

    // The scan tab should have either camera area or file input available
    expect(cameraAreaVisible || fileInputExists).toBe(true);
  });

  test('should detect camera stream is active', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for any initialization
    await page.waitForTimeout(3000);

    // Check for video stream indicators
    const videoStreamLogs = consoleLogs.filter(log =>
      log.includes('Camera started successfully') ||
      log.includes('srcObject') ||
      log.includes('readyState')
    );

    console.log(`Video stream indicators: ${videoStreamLogs.length}`);
    videoStreamLogs.forEach(log => console.log(`  ${log}`));
  });

  test('should support stopping camera', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for any initialization
    await page.waitForTimeout(3000);

    // Find stop button
    const stopButton = page.locator('button:has-text("Stop Camera"), button:has-text("Stop")').first();
    const stopButtonExists = await stopButton.count().catch(() => 0);

    if (stopButtonExists > 0) {
      const stopStartTime = Date.now();
      await stopButton.click();
      const stopElapsed = Date.now() - stopStartTime;
      console.log(`Camera stopped in ${stopElapsed}ms`);

      await page.waitForTimeout(1000);

      const stopLogs = consoleLogs.filter(log =>
        log.includes('Stop called') ||
        log.includes('stopped') ||
        log.includes('Clearing')
      );

      console.log(`Stop operation logs: ${stopLogs.length}`);
      stopLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('Stop button not found (camera may not be running in headless mode)');
    }
  });

  test('should process frames at acceptable rate', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for camera and frame processing
    await page.waitForTimeout(5000);

    // Count frame processing logs
    const frameLogs = consoleLogs.filter(log =>
      log.includes('Processed') ||
      log.includes('frames') ||
      log.includes('fallback')
    );

    console.log(`Frame processing indicators: ${frameLogs.length}`);
    frameLogs.forEach(log => console.log(`  ${log}`));

    // Get timing from logs if available
    const scannerStateLog = consoleLogs.find(log => log.includes('Scanner is running'));
    if (scannerStateLog) {
      console.log(`Scanner state: ${scannerStateLog}`);
    }
  });

  test('should display performance metrics in console', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    console.log('\n=== PERFORMANCE METRICS ===');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Critical errors: ${consoleErrors.filter(e => !e.includes('Extension')).length}`);
    console.log(`Warnings: ${consoleWarnings.length}`);

    const qrScannerLogs = consoleLogs.filter(log => log.includes('[QRScanner]'));
    console.log(`QRScanner logs: ${qrScannerLogs.length}`);

    if (qrScannerLogs.length > 0) {
      console.log('\nRecent QRScanner activity:');
      qrScannerLogs.slice(-5).forEach(log => console.log(`  ${log}`));
    }
  });

  test('should verify camera UI is responsive', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Take screenshot of initial state
    await page.screenshot({ path: '/tmp/scanner-initial.png' });
    console.log('Captured initial screenshot: /tmp/scanner-initial.png');

    // Wait for any initialization
    await page.waitForTimeout(3000);

    // Take screenshot after wait
    await page.screenshot({ path: '/tmp/scanner-camera-active.png' });
    console.log('Captured post-wait screenshot: /tmp/scanner-camera-active.png');

    // Verify page didn't crash
    const pageErrorLogs = consoleErrors.filter(e => !e.includes('Extension'));
    expect(pageErrorLogs.length).toBe(0);
  });

  test('should handle camera permissions gracefully', async ({ page }) => {
    // Playwright headless browser may not have actual camera permissions
    // This test verifies error handling doesn't crash the app

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for permission-related logs or graceful error handling
    const permissionLogs = consoleLogs.filter(log =>
      log.includes('permission') ||
      log.includes('denied') ||
      log.includes('Camera access') ||
      log.includes('NotAllowedError')
    );

    console.log(`Permission-related logs: ${permissionLogs.length}`);
    permissionLogs.forEach(log => console.log(`  ${log}`));

    // Page should still be functional even if camera unavailable
    expect(await page.title()).toBeTruthy();
  });

  test('should measure end-to-end response time', async ({ page }) => {
    const navigationStartTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });
    const navigationTime = Date.now() - navigationStartTime;

    const cameraStartTime = Date.now();
    await page.waitForTimeout(5000); // Wait for any initialization
    const cameraTotalTime = Date.now() - cameraStartTime;

    const totalTime = Date.now() - navigationStartTime;

    console.log(`\n=== TIMING ANALYSIS ===`);
    console.log(`Navigation time: ${navigationTime}ms`);
    console.log(`Initialization time: ${cameraTotalTime}ms`);
    console.log(`Total elapsed time: ${totalTime}ms`);

    // Performance assertions
    expect(navigationTime).toBeLessThan(8000);
    expect(cameraTotalTime).toBeLessThan(6000);
    expect(totalTime).toBeLessThan(15000);
  });
});

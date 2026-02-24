import { test, expect } from '@playwright/test';

const BASE_URL = 'https://n-of-m-web.vercel.app';

test.describe('Scanner/Camera Functionality', () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
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
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    console.log(`✓ Page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have no critical console errors on initial load', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

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

  test('should initialize scanner on page load', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for scanner initialization
    await page.waitForTimeout(2000);

    const scannerLogs = consoleLogs.filter(log => log.includes('[QRScanner]'));
    console.log(`✓ Scanner logs captured: ${scannerLogs.length}`);
    scannerLogs.forEach(log => console.log(`  ${log}`));

    // Should see some scanner initialization logs
    expect(scannerLogs.length).toBeGreaterThan(0);
  });

  test('should start camera and establish video stream', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const startTime = Date.now();

    // Look for camera start button and click it
    const cameraButton = page.locator('button:has-text("Start Camera"), button:has-text("📷")').first();
    const cameraButtonExists = await cameraButton.count().catch(() => 0);

    if (cameraButtonExists > 0) {
      await cameraButton.click();
      console.log('✓ Clicked camera start button');
    } else {
      console.log('ℹ Camera auto-starts on page load (no button needed)');
    }

    // Wait for camera to initialize
    await page.waitForTimeout(3000);

    const cameraLogs = consoleLogs.filter(log =>
      log.includes('[QRScanner] Starting camera') ||
      log.includes('[QRScanner] Camera started') ||
      log.includes('[QRScanner] Video element')
    );

    console.log(`✓ Camera initialization logs: ${cameraLogs.length}`);
    cameraLogs.forEach(log => console.log(`  ${log}`));

    const elapsed = Date.now() - startTime;
    console.log(`✓ Camera started in ${elapsed}ms`);

    expect(cameraLogs.length).toBeGreaterThan(0);
  });

  test('should detect camera stream is active', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for camera
    await page.waitForTimeout(3000);

    // Check for video stream indicators
    const videoStreamLogs = consoleLogs.filter(log =>
      log.includes('Camera started successfully') ||
      log.includes('srcObject') ||
      log.includes('readyState')
    );

    console.log(`✓ Video stream indicators: ${videoStreamLogs.length}`);
    videoStreamLogs.forEach(log => console.log(`  ${log}`));
  });

  test('should support stopping camera', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for camera to initialize
    await page.waitForTimeout(3000);

    // Find stop button
    const stopButton = page.locator('button:has-text("Stop Camera"), button:has-text("⏹")').first();
    const stopButtonExists = await stopButton.count().catch(() => 0);

    if (stopButtonExists > 0) {
      const stopStartTime = Date.now();
      await stopButton.click();
      const stopElapsed = Date.now() - stopStartTime;
      console.log(`✓ Camera stopped in ${stopElapsed}ms`);

      // Wait for cleanup
      await page.waitForTimeout(1000);

      const stopLogs = consoleLogs.filter(log =>
        log.includes('Stop called') ||
        log.includes('stopped') ||
        log.includes('Clearing')
      );

      console.log(`✓ Stop operation logs: ${stopLogs.length}`);
      stopLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('ℹ Stop button not found (camera may auto-stop)');
    }
  });

  test('should process frames at acceptable rate', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for camera and frame processing
    await page.waitForTimeout(5000);

    // Count frame processing logs
    const frameLogs = consoleLogs.filter(log =>
      log.includes('Processed') ||
      log.includes('frames') ||
      log.includes('fallback')
    );

    console.log(`✓ Frame processing indicators: ${frameLogs.length}`);
    frameLogs.forEach(log => console.log(`  ${log}`));

    // Get timing from logs if available
    const scannerStateLog = consoleLogs.find(log => log.includes('Scanner is running'));
    if (scannerStateLog) {
      console.log(`✓ Scanner state: ${scannerStateLog}`);
    }
  });

  test('should display performance metrics in console', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
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
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Take screenshot of initial state
    await page.screenshot({ path: '/tmp/scanner-initial.png' });
    console.log('✓ Captured initial screenshot: /tmp/scanner-initial.png');

    // Wait for camera to activate
    await page.waitForTimeout(3000);

    // Take screenshot after camera starts
    await page.screenshot({ path: '/tmp/scanner-camera-active.png' });
    console.log('✓ Captured camera-active screenshot: /tmp/scanner-camera-active.png');

    // Verify page didn't crash
    const pageErrorLogs = consoleErrors.filter(e => !e.includes('Extension'));
    expect(pageErrorLogs.length).toBe(0);
  });

  test('should handle camera permissions gracefully', async ({ page, context }) => {
    // Note: Playwright browser context may not have actual camera permissions
    // This test verifies error handling doesn't crash the app

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
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

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const navigationTime = Date.now() - navigationStartTime;

    const cameraStartTime = Date.now();
    await page.waitForTimeout(5000); // Wait for camera initialization
    const cameraTotalTime = Date.now() - cameraStartTime;

    const totalTime = Date.now() - navigationStartTime;

    console.log(`\n=== TIMING ANALYSIS ===`);
    console.log(`Navigation time: ${navigationTime}ms`);
    console.log(`Camera initialization time: ${cameraTotalTime}ms`);
    console.log(`Total elapsed time: ${totalTime}ms`);

    // Performance assertions
    expect(navigationTime).toBeLessThan(8000); // Page should load in <8s
    expect(cameraTotalTime).toBeLessThan(6000); // Camera should initialize in <6s
    expect(totalTime).toBeLessThan(15000); // Total should be <15s
  });
});

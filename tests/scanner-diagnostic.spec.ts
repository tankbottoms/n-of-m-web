import { test, expect } from '@playwright/test';

const BASE_URL = 'https://n-of-m-web.vercel.app';

test('scanner diagnostic - detailed page analysis', async ({ page }) => {
  let allMessages: any[] = [];

  // Capture ALL messages with detailed metadata
  page.on('console', (msg) => {
    allMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      args: msg.args(),
    });
  });

  page.on('error', (error) => {
    allMessages.push({
      type: 'page-error',
      text: error.message,
      stack: error.stack,
    });
  });

  page.on('pageerror', (error) => {
    allMessages.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
    });
  });

  console.log('=== DIAGNOSTIC TEST START ===\n');

  const startTime = Date.now();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;
  console.log(`[1] Page loaded in ${loadTime}ms`);

  // Check page structure
  console.log('\n[2] Checking page structure...');
  const hasTitle = await page.locator('h1, h2, title').count().catch(() => 0);
  console.log(`  - Headings found: ${hasTitle}`);

  const buttons = await page.locator('button').count().catch(() => 0);
  console.log(`  - Total buttons: ${buttons}`);

  const cameraButton = await page.locator('button:has-text("Start Camera"), button:has-text("camera"), button:has-text("Camera")').count().catch(() => 0);
  console.log(`  - Camera button found: ${cameraButton > 0 ? 'YES' : 'NO'}`);

  // List all buttons
  const allButtonTexts = await page.locator('button').allTextContents().catch(() => []);
  console.log(`  - Button texts: ${allButtonTexts.join(', ')}`);

  const videoElements = await page.locator('video').count().catch(() => 0);
  console.log(`  - Video elements: ${videoElements}`);

  const canvasElements = await page.locator('canvas').count().catch(() => 0);
  console.log(`  - Canvas elements: ${canvasElements}`);

  // Check SCAN tab/button
  console.log('\n[3] Looking for SCAN tab/button...');
  const scanButton = await page.locator('button:has-text("SCAN"), button:has-text("Scan")').first().count().catch(() => 0);
  if (scanButton > 0) {
    console.log('  - Found SCAN button, clicking it...');
    await page.locator('button:has-text("SCAN"), button:has-text("Scan")').first().click().catch(err => {
      console.log(`  - Failed to click: ${err.message}`);
    });
    await page.waitForTimeout(1000);
  } else {
    console.log('  - SCAN button not found');
  }

  // Try to find and click Start Camera button
  console.log('\n[4] Looking for camera controls...');
  const startCameraBtn = await page.locator('button').filter({ hasText: /Start|Camera|camera/i }).first().count().catch(() => 0);
  if (startCameraBtn > 0) {
    console.log('  - Found camera button, clicking...');
    await page.locator('button').filter({ hasText: /Start|Camera|camera/i }).first().click().catch(err => {
      console.log(`  - Failed to click: ${err.message}`);
    });
    console.log('  - Clicked, waiting 3 seconds for initialization...');
    await page.waitForTimeout(3000);
  } else {
    console.log('  - Camera button not found');
  }

  // Check for video/canvas visibility
  console.log('\n[5] Checking for camera display...');
  const videoVisible = await page.locator('video').isVisible().catch(() => false);
  console.log(`  - Video element visible: ${videoVisible}`);

  const canvasVisible = await page.locator('canvas').isVisible().catch(() => false);
  console.log(`  - Canvas element visible: ${canvasVisible}`);

  // Evaluate window object for camera state
  console.log('\n[6] Checking window state...');
  const windowInfo = await page.evaluate(() => {
    const info: any = {
      navigator_mediaDevices: typeof navigator?.mediaDevices !== 'undefined',
      navigator_getUserMedia: typeof navigator?.getUserMedia !== 'undefined',
      navigator_webkitGetUserMedia: typeof navigator?.webkitGetUserMedia !== 'undefined',
    };
    return info;
  }).catch(() => ({}));
  console.log(`  - MediaDevices API: ${windowInfo.navigator_mediaDevices}`);

  // Get all console messages
  console.log('\n[7] All console messages captured:');
  if (allMessages.length === 0) {
    console.log('  - NO CONSOLE MESSAGES CAPTURED');
  } else {
    allMessages.forEach((msg, i) => {
      console.log(`  [${i}] ${msg.type}: ${msg.text}`);
    });
  }

  // Check for specific patterns
  console.log('\n[8] Pattern search:');
  const hasQRScanner = allMessages.some(m => m.text?.includes('QRScanner'));
  const hasCamera = allMessages.some(m => m.text?.includes('Camera'));
  const hasError = allMessages.some(m => m.type === 'error');
  console.log(`  - QRScanner logs: ${hasQRScanner}`);
  console.log(`  - Camera logs: ${hasCamera}`);
  console.log(`  - Errors: ${hasError}`);

  // Network activity check
  console.log('\n[9] Page performance:');
  const metrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as any;
    return {
      domContentLoaded: perf?.domContentLoadedEventEnd - perf?.domContentLoadedEventStart,
      loadComplete: perf?.loadEventEnd - perf?.loadEventStart,
      domInteractive: perf?.domInteractive - perf?.fetchStart,
    };
  }).catch(() => ({}));
  console.log(`  - DOM Content Loaded: ${metrics.domContentLoaded}ms`);
  console.log(`  - Load Complete: ${metrics.loadComplete}ms`);

  // Take screenshot for visual inspection
  await page.screenshot({ path: '/tmp/diagnostic.png', fullPage: true });
  console.log('\n✓ Screenshot saved to /tmp/diagnostic.png');

  console.log('\n=== DIAGNOSTIC TEST END ===');
});

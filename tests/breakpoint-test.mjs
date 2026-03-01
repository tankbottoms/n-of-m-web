// Breakpoint verification test for n-of-m-web
// Tests responsive breakpoints at multiple viewport sizes

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const URL = 'https://n-of-m-web.vercel.app';
const OUTPUT_DIR = path.join(__dirname, '..', 'playwright-report', 'breakpoints');

const VIEWPORTS = [
  { name: 'iphone-se',        width: 375,  height: 667,  label: 'iPhone SE (375x667)' },
  { name: 'breakpoint-480',   width: 480,  height: 800,  label: '480px edge (480x800)' },
  { name: 'sharecard-600',    width: 600,  height: 900,  label: 'ShareCard edge (600x900)' },
  { name: 'ipad-768',         width: 768,  height: 1024, label: 'iPad / tablet (768x1024)' },
  { name: 'desktop-1024',     width: 1024, height: 768,  label: 'Desktop (1024x768)' },
  { name: 'wide-1440',        width: 1440, height: 900,  label: 'Wide desktop (1440x900)' },
];

async function runTests() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting viewport: ${vp.label}`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    let loadOk = true;
    try {
      const response = await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
      if (!response || !response.ok()) {
        loadOk = false;
        console.log(`  FAIL: Page load failed (status ${response ? response.status() : 'none'})`);
      }
    } catch (e) {
      loadOk = false;
      console.log(`  FAIL: Navigation error: ${e.message}`);
    }

    // Wait a moment for any JS to settle
    await page.waitForTimeout(1500);

    // Take screenshot
    const screenshotPath = path.join(OUTPUT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Screenshot saved: ${screenshotPath}`);

    // Check for horizontal overflow
    const overflowCheck = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
      const clientWidth = Math.max(body.clientWidth, html.clientWidth);
      const overflowingElements = [];

      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 2) {
          overflowingElements.push({
            tag: el.tagName,
            id: el.id || '',
            className: (el.className && typeof el.className === 'string') ? el.className.substring(0, 80) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
        }
      }

      return {
        scrollWidth,
        clientWidth,
        hasOverflow: scrollWidth > clientWidth + 2,
        overflowAmount: scrollWidth - clientWidth,
        overflowingElements: overflowingElements.slice(0, 5),
      };
    });

    // Check text readability
    const textCheck = await page.evaluate(() => {
      const mainContent = document.querySelector('main, .container, body');
      if (!mainContent) return { readable: true, note: 'no main element found' };

      const style = window.getComputedStyle(mainContent);
      const fontSize = parseFloat(style.fontSize);

      const truncatedEls = [];
      const textEls = document.querySelectorAll('p, h1, h2, h3, h4, span, label, button');
      for (const el of textEls) {
        const s = window.getComputedStyle(el);
        if (s.overflow === 'hidden' && s.textOverflow === 'ellipsis') {
          truncatedEls.push({
            tag: el.tagName,
            text: el.textContent ? el.textContent.substring(0, 50) : '',
          });
        }
      }

      return {
        bodyFontSize: fontSize,
        readable: fontSize >= 12,
        truncatedCount: truncatedEls.length,
        truncatedSamples: truncatedEls.slice(0, 3),
      };
    });

    const result = {
      viewport: vp.label,
      name: vp.name,
      dimensions: `${vp.width}x${vp.height}`,
      loadOk,
      jsErrors: jsErrors.length,
      jsErrorSamples: jsErrors.slice(0, 3),
      overflow: overflowCheck,
      text: textCheck,
      screenshot: screenshotPath,
    };

    results.push(result);

    const overflowStatus = overflowCheck.hasOverflow ? `FAIL (overflow: ${overflowCheck.overflowAmount}px)` : 'PASS';
    const jsStatus = jsErrors.length === 0 ? 'PASS' : `FAIL (${jsErrors.length} errors)`;
    const textStatus = textCheck.readable ? 'PASS' : `FAIL (fontSize: ${textCheck.bodyFontSize}px)`;

    console.log(`  Load:      ${loadOk ? 'PASS' : 'FAIL'}`);
    console.log(`  JS Errors: ${jsStatus}`);
    console.log(`  Overflow:  ${overflowStatus}`);
    if (overflowCheck.hasOverflow && overflowCheck.overflowingElements.length > 0) {
      for (const el of overflowCheck.overflowingElements) {
        console.log(`    - <${el.tag}> id="${el.id}" class="${el.className}" right=${el.right}px`);
      }
    }
    console.log(`  Text:      ${textStatus}`);
    if (textCheck.truncatedCount > 0) {
      console.log(`    Truncated elements: ${textCheck.truncatedCount}`);
    }

    await context.close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('BREAKPOINT TEST SUMMARY');
  console.log('='.repeat(60));

  let totalPass = 0;
  let totalFail = 0;

  for (const r of results) {
    const checks = [
      r.loadOk,
      r.jsErrors === 0,
      !r.overflow.hasOverflow,
      r.text.readable,
    ];
    const passed = checks.filter(Boolean).length;
    const failed = checks.filter(v => !v).length;
    totalPass += passed;
    totalFail += failed;

    const status = failed === 0 ? 'PASS' : 'FAIL';
    console.log(`\n${status} ${r.viewport} (${r.dimensions})`);
    console.log(`  Load: ${r.loadOk ? 'PASS' : 'FAIL'} | JS Errors: ${r.jsErrors === 0 ? 'PASS' : 'FAIL (' + r.jsErrors + ')'} | Overflow: ${!r.overflow.hasOverflow ? 'PASS' : 'FAIL (' + r.overflow.overflowAmount + 'px)'} | Text: ${r.text.readable ? 'PASS' : 'FAIL'}`);
    if (r.jsErrorSamples.length > 0) {
      r.jsErrorSamples.forEach(e => console.log(`    JS Error: ${e.substring(0, 120)}`));
    }
    if (r.overflow.hasOverflow) {
      r.overflow.overflowingElements.forEach(el =>
        console.log(`    Overflow: <${el.tag}> "${el.className.substring(0, 60)}" right=${el.right}px`)
      );
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total checks: ${totalPass + totalFail}  Passed: ${totalPass}  Failed: ${totalFail}`);
  console.log('Screenshots saved to:', OUTPUT_DIR);
  console.log('='.repeat(60));

  const reportPath = path.join(OUTPUT_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log('JSON report:', reportPath);

  process.exit(totalFail > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});

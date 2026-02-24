# QR Detection Debug - Missing jsQR Logs

## Issue
jsQR fallback logs NOT appearing in console:
- Expected: "[QRScanner] Starting lightweight jsQR fallback (every 2s)"
- Actual: NOT FOUND in console output

But zxing logs ARE appearing:
- "[QRScanner] Processed 100/200/300 frames, no QR found"

## Diagnostic Info Provided
Both M1 Laptop and iPhone show:
- Camera works (video feed visible and responsive)
- Video element ready: readyState: 4, paused: false
- MediaStream active and flowing
- zxing scanning (frame count increasing: 100, 200, 300+)
- BUT: jsQR fallback logs missing

## Hypothesis 1: Build Not Yet Deployed
The jsQR fallback code (commit f7565a4) might not be live on Vercel yet.

**Test**: Check the VERSION number in footer
- Old: "v0.3.0"
- New: "v0.3.1"
- **If still 0.3.0**: Cache needs refresh (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

## Hypothesis 2: Browser Cache
Vercel deployed new code but browser cached old version.

**Test**: Hard refresh page
- macOS Safari: Cmd+Shift+R
- macOS Chrome: Cmd+Shift+R
- iPhone Safari: Settings → Safari → Advanced → Website Data → Delete "n-of-m-web.vercel.app"
- Android Chrome: Settings → Apps → Chrome → Clear Cache

## Hypothesis 3: JavaScript Error
Code runs but hits error before logging.

**Test**: Paste in console while camera running:
```javascript
// Check if function exists
console.log('startJsQRFallback exists:', typeof QRScanner?.startJsQRFallback);

// Check if fallback interval was set
navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister())).then(() => {
  location.reload();
});
```

## Next Steps

1. **Check VERSION in footer** - see if it shows "0.3.1"
2. **If 0.3.0**: Hard refresh and test again
3. **If 0.3.1 but no jsQR logs**: Run console tests above and report

## Expected Behavior When Working
```
Console logs in order:
[QRScanner] Starting camera...
[QRScanner] Calling scanner.start()
[QRScanner] Canvas display started
[QRScanner] Starting lightweight jsQR fallback (every 2s)  ← Should appear here
[QRScanner] Processed 100 frames, no QR found
...every 2 seconds...
[QRScanner] jsQR fallback detected code on scan #3: [QR DATA]  ← Should appear when QR found
```

## What jsQR Fallback Does

Every 2 seconds:
1. Grabs current video frame
2. Runs jsQR scan (simple, no tiling)
3. If QR found → reports "jsQR fallback detected code"
4. If not found → silent, waits 2 seconds

It's a safety net to catch QR codes that zxing misses.

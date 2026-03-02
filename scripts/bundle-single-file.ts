#!/usr/bin/env bun
/**
 * Post-build script: bundles the SvelteKit static build into a single HTML file.
 * Handles ESM modulepreload links, dynamic imports, and inlines CSS/fonts.
 *
 * Usage: bun scripts/bundle-single-file.ts
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname, relative, extname } from 'path';

const BUILD_DIR = resolve(process.argv[2] || join(import.meta.dirname!, '..', 'build'));
const INDEX = join(BUILD_DIR, 'index.html');
const OUTPUT = join(BUILD_DIR, 'n-of-m-standalone.html');

if (!existsSync(INDEX)) {
  console.log('Skipping standalone bundle: ' + INDEX + ' not found (expected with adapter-cloudflare).');
  process.exit(0);
}

// Collect all files recursively
function collectFiles(dir: string, files: Map<string, string> = new Map()): Map<string, string> {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, files);
    } else {
      const rel = '/' + relative(BUILD_DIR, full);
      files.set(rel, full);
    }
  }
  return files;
}

const allFiles = collectFiles(join(BUILD_DIR, '_app'));

// Read all JS and CSS content
const jsModules = new Map<string, string>();
const cssContents: string[] = [];

for (const [relPath, absPath] of allFiles) {
  const ext = extname(absPath);
  if (ext === '.js' || ext === '.mjs') {
    jsModules.set(relPath, readFileSync(absPath, 'utf-8'));
  } else if (ext === '.css') {
    let css = readFileSync(absPath, 'utf-8');
    css = inlineFontUrls(css, dirname(absPath));
    cssContents.push(css);
  }
}

// Read the index.html to extract the boot script pattern
const indexHTML = readFileSync(INDEX, 'utf-8');

// Find the entry point module paths from the inline script
const startMatch = indexHTML.match(/import\("([^"]+start[^"]+)"\)/);
const appMatch = indexHTML.match(/import\("([^"]+app[^"]+)"\)/);
const startPath = startMatch?.[1] || '';
const appPath = appMatch?.[1] || '';

// Find the sveltekit config variable name
const configMatch = indexHTML.match(/__sveltekit_\w+/);
const configVar = configMatch?.[0] || '__sveltekit_app';

// Resolve relative import paths to absolute
function resolveImportPath(fromDir: string, importPath: string): string {
  const parts = (fromDir + '/' + importPath).split('/').filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') { resolved.pop(); continue; }
    resolved.push(part);
  }
  return '/' + resolved.join('/');
}

// Rewrite imports in each module to use absolute paths
const moduleEntries: string[] = [];
for (const [path, content] of jsModules) {
  let rewritten = content;
  const moduleDir = dirname(path);

  // Convert relative static imports: from "./chunk.js" -> from "/_app/immutable/chunks/chunk.js"
  rewritten = rewritten.replace(
    /from\s*["'](\.[^"']+)["']/g,
    (_match, importPath) => {
      const resolved = resolveImportPath(moduleDir, importPath);
      return 'from"' + resolved + '"';
    }
  );

  // Convert relative dynamic imports: import("./chunk.js") -> import("/_app/.../chunk.js")
  rewritten = rewritten.replace(
    /import\(\s*["'](\.[^"']+)["']\s*\)/g,
    (_match, importPath) => {
      const resolved = resolveImportPath(moduleDir, importPath);
      return 'import("' + resolved + '")';
    }
  );

  moduleEntries.push(JSON.stringify(path) + ':' + JSON.stringify(rewritten));
}

// Inline Font Awesome CSS with only the woff2 fonts actually used by the app:
// fa-thin-100 (primary icons), fa-solid-900 (star), fa-brands-400 (svelte)
const FA_CSS_PATH = join(BUILD_DIR, 'fontawesome', 'css', 'all.min.css');
const NEEDED_FONTS = new Set(['fa-thin-100', 'fa-solid-900', 'fa-brands-400']);
if (existsSync(FA_CSS_PATH)) {
  let faCss = readFileSync(FA_CSS_PATH, 'utf-8');
  // Strip ttf url() references - all modern browsers support woff2
  faCss = faCss.replace(/url\(["']?[^"')]+\.ttf["']?\)\s*format\(["']truetype["']\),?\s*/gi, '');
  // Selectively inline only needed woff2 fonts (skip duotone, light, regular, v4compat)
  faCss = inlineFontUrlsSelective(faCss, join(BUILD_DIR, 'fontawesome', 'css'), NEEDED_FONTS);
  cssContents.unshift(faCss);
  console.log('Inlined Font Awesome CSS + selected woff2 fonts');
} else {
  console.warn('Warning: build/fontawesome/css/all.min.css not found - icons may not render in standalone');
}

// Build the standalone HTML
const parts: string[] = [];

parts.push('<!DOCTYPE html>');
parts.push('<html lang="en">');
parts.push('<head>');
parts.push('<meta charset="utf-8">');
parts.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
parts.push('<meta name="theme-color" content="#f5f0e8">');
parts.push('<style>' + cssContents.join('\n') + '</style>');
parts.push('</head>');
parts.push('<body data-sveltekit-prerender="true">');
parts.push('<div style="display: contents" id="app-root"></div>');
parts.push('<script type="module">');

// Module registry
parts.push('const __modules = {' + moduleEntries.join(',') + '};');

// Blob URL creation with import rewriting
parts.push([
  'const __urls = {};',
  'for (const [p, c] of Object.entries(__modules)) {',
  '  __urls[p] = URL.createObjectURL(new Blob([c], {type:"application/javascript"}));',
  '}',
  // Rewrite all imports to use blob URLs
  'const __final = {};',
  'for (const [p, c] of Object.entries(__modules)) {',
  '  let r = c;',
  '  for (const [mp, bu] of Object.entries(__urls)) {',
  '    r = r.split(JSON.stringify(mp)).join(JSON.stringify(bu));',
  '  }',
  '  __final[p] = URL.createObjectURL(new Blob([r], {type:"application/javascript"}));',
  '}',
  // Boot
  configVar + ' = { base: "" };',
  'const el = document.getElementById("app-root");',
  'Promise.all([',
  '  import(__final[' + JSON.stringify(startPath) + ']),',
  '  import(__final[' + JSON.stringify(appPath) + '])',
  ']).then(([kit, app]) => { kit.start(app, el); });',
].join('\n'));

parts.push('<' + '/script>');
parts.push('</body>');
parts.push('</html>');

const standaloneHTML = parts.join('\n');
writeFileSync(OUTPUT, standaloneHTML, 'utf-8');
const sizeKB = Math.round(Buffer.byteLength(standaloneHTML) / 1024);
console.log('Bundled: ' + OUTPUT + ' (' + sizeKB + ' KB)');

function inlineFontUrls(css: string, cssDir: string): string {
  return css.replace(
    /url\(["']?([^"')]+\.(woff2?|ttf|eot|otf))["']?\)/gi,
    (_match, fontPath: string, ext: string) => {
      const resolved = fontPath.startsWith('/')
        ? join(BUILD_DIR, fontPath)
        : join(cssDir, fontPath);

      if (!existsSync(resolved)) return _match;
      const fontData = readFileSync(resolved);
      const base64 = fontData.toString('base64');
      const mimeTypes: Record<string, string> = {
        woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf',
        otf: 'font/otf', eot: 'application/vnd.ms-fontobject',
      };
      const mime = mimeTypes[ext] || 'application/octet-stream';
      return 'url(data:' + mime + ';base64,' + base64 + ')';
    }
  );
}

function inlineFontUrlsSelective(css: string, cssDir: string, allowedBasenames: Set<string>): string {
  return css.replace(
    /url\(["']?([^"')]+\.(woff2?|ttf|eot|otf))["']?\)/gi,
    (_match, fontPath: string, ext: string) => {
      const resolved = fontPath.startsWith('/')
        ? join(BUILD_DIR, fontPath)
        : join(cssDir, fontPath);

      // Check if this font's basename (without extension) is in the allowed set
      const basename = fontPath.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
      if (!allowedBasenames.has(basename)) return _match;

      if (!existsSync(resolved)) return _match;
      const fontData = readFileSync(resolved);
      const base64 = fontData.toString('base64');
      const mimeTypes: Record<string, string> = {
        woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf',
        otf: 'font/otf', eot: 'application/vnd.ms-fontobject',
      };
      const mime = mimeTypes[ext] || 'application/octet-stream';
      return 'url(data:' + mime + ';base64,' + base64 + ')';
    }
  );
}

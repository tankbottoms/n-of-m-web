<script lang="ts">
  import { VERSION } from '$lib/version';

  let tocExpanded = $state(true);

  const sections = [
    { id: 'design-tokens', label: 'Design Tokens' },
    { id: 'app-shell', label: 'App Shell' },
    { id: 'global-primitives', label: 'Global Primitives' },
    { id: 'hero-home', label: 'Hero / Home' },
    { id: 'panel-component', label: 'Panel Component' },
    { id: 'generate-flow', label: 'GenerateFlow Wizard' },
    { id: 'scan-flow', label: 'ScanFlow' },
    { id: 'vault-panel', label: 'VaultPanel' },
    { id: 'settings-panel', label: 'SettingsPanel' },
    { id: 'pdf-share-card', label: 'PDF / Share Card Template' },
  ];
</script>

<svelte:head>
  <title>UX Specification - n of m</title>
</svelte:head>

<div class="ux-spec">
  <header class="spec-header">
    <h1>n-of-m UX Specification</h1>
    <p class="text-muted text-sm">v{VERSION} -- Living design reference for all UI elements</p>
  </header>

  <!-- Table of Contents -->
  <nav class="toc">
    <button class="toc-toggle" onclick={() => { tocExpanded = !tocExpanded; }}>
      <i class="fa-thin {tocExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
      Table of Contents
    </button>
    {#if tocExpanded}
      <ol class="toc-list">
        {#each sections as section, i}
          <li><a href="#{section.id}">{i + 1}. {section.label}</a></li>
        {/each}
      </ol>
    {/if}
  </nav>

  <!-- ============================================================ -->
  <!-- 1. Design Tokens -->
  <!-- ============================================================ -->
  <section id="design-tokens" class="spec-section">
    <h2>1. Design Tokens</h2>
    <p class="section-desc">CSS custom properties defined in <code>src/app.css</code> on <code>:root</code> and <code>[data-theme='dark']</code>.</p>

    <h3>Colors</h3>
    <div class="token-grid">
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-bg);"></span>
        <code>--color-bg</code>
        <span class="text-muted text-xs">Primary background</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-bg-secondary);"></span>
        <code>--color-bg-secondary</code>
        <span class="text-muted text-xs">Secondary background</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-bg-alt);"></span>
        <code>--color-bg-alt</code>
        <span class="text-muted text-xs">Alternate background (panels, info boxes)</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-hover-bg);"></span>
        <code>--color-hover-bg</code>
        <span class="text-muted text-xs">Hover state background</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-text);"></span>
        <code>--color-text</code>
        <span class="text-muted text-xs">Primary text</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-text-muted);"></span>
        <code>--color-text-muted</code>
        <span class="text-muted text-xs">Secondary / muted text</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-border);"></span>
        <code>--color-border</code>
        <span class="text-muted text-xs">Default border</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-border-light);"></span>
        <code>--color-border-light</code>
        <span class="text-muted text-xs">Light border</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-border-dark);"></span>
        <code>--color-border-dark</code>
        <span class="text-muted text-xs">Strong border (buttons, inputs focused)</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-link);"></span>
        <code>--color-link</code>
        <span class="text-muted text-xs">Hyperlinks</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-success);"></span>
        <code>--color-success</code>
        <span class="text-muted text-xs">Success states</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-warning);"></span>
        <code>--color-warning</code>
        <span class="text-muted text-xs">Warning states</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-error);"></span>
        <code>--color-error</code>
        <span class="text-muted text-xs">Error states</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-info);"></span>
        <code>--color-info</code>
        <span class="text-muted text-xs">Informational</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-accent);"></span>
        <code>--color-accent</code>
        <span class="text-muted text-xs">Accent / primary action</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-crypto-bg);"></span>
        <code>--color-crypto-bg</code>
        <span class="text-muted text-xs">Crypto-themed background</span>
      </div>
      <div class="token-row">
        <span class="token-swatch" style="background: var(--color-crypto-text); border: 1px solid var(--color-border);"></span>
        <code>--color-crypto-text</code>
        <span class="text-muted text-xs">Crypto-themed text</span>
      </div>
    </div>

    <h3>Spacing</h3>
    <div class="token-grid">
      <div class="token-row">
        <span class="token-spacing" style="width: var(--spacing-xs);"></span>
        <code>--spacing-xs</code>
        <span class="text-muted text-xs">0.5rem</span>
      </div>
      <div class="token-row">
        <span class="token-spacing" style="width: var(--spacing-sm);"></span>
        <code>--spacing-sm</code>
        <span class="text-muted text-xs">0.75rem</span>
      </div>
      <div class="token-row">
        <span class="token-spacing" style="width: var(--spacing-md);"></span>
        <code>--spacing-md</code>
        <span class="text-muted text-xs">1rem</span>
      </div>
      <div class="token-row">
        <span class="token-spacing" style="width: var(--spacing-lg);"></span>
        <code>--spacing-lg</code>
        <span class="text-muted text-xs">1.5rem</span>
      </div>
      <div class="token-row">
        <span class="token-spacing" style="width: var(--spacing-xl);"></span>
        <code>--spacing-xl</code>
        <span class="text-muted text-xs">2rem</span>
      </div>
    </div>

    <h3>Typography</h3>
    <div class="token-grid">
      <div class="token-row">
        <code>--font-mono</code>
        <span class="text-muted text-xs">ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace</span>
      </div>
    </div>
    <div class="example-box">
      <h1 style="margin-bottom: 0.5rem;">h1 -- 1.75rem / 600</h1>
      <h2 style="margin-bottom: 0.5rem;">h2 -- 1.25rem / 600</h2>
      <h3>h3 -- 1rem / 600</h3>
    </div>

    <h3>Key CSS</h3>
    <pre><code>:root &#123;
  --color-bg: #ffffff;
  --color-text: #111111;
  --color-border: #e5e5e5;
  --color-accent: #5c6bc0;
  --font-mono: ui-monospace, 'Cascadia Code', ...;
  --spacing-md: 1rem;
&#125;

[data-theme='dark'] &#123;
  --color-bg: #002b36;
  --color-text: #93a1a1;
  --color-border: #586e75;
  --color-accent: #6c71c4;
&#125;</code></pre>
  </section>

  <!-- ============================================================ -->
  <!-- 2. App Shell -->
  <!-- ============================================================ -->
  <section id="app-shell" class="spec-section">
    <h2>2. App Shell</h2>
    <p class="section-desc">Top-level layout elements from <code>src/routes/+page.svelte</code> and <code>src/components/ThemeToggle.svelte</code>.</p>

    <h3>.app-wrapper</h3>
    <p class="text-sm text-muted">Outer wrapper. Starts with <code>margin-top: 25vh</code> (centered on home), transitions to <code>margin-top: 0</code> when <code>.active</code> (navigated to a section).</p>
    <div class="example-box">
      <div style="border: 2px dashed var(--color-border); padding: var(--spacing-md); text-align: center;">
        <span class="text-xs text-muted">.app-wrapper (margin-top: 25vh on home, 0 when active)</span>
      </div>
    </div>
    <pre><code>.app-wrapper &#123;
  margin-top: 25vh;
  transition: margin-top 0.3s ease;
&#125;
.app-wrapper.active &#123;
  margin-top: 0;
&#125;</code></pre>

    <h3>.nav-bar</h3>
    <p class="text-sm text-muted">Horizontal bar shown when navigated away from home. Contains back button, section title, and spacer.</p>
    <div class="example-box">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-lg); border-bottom: 1px solid var(--color-border);">
        <button class="spec-nav-btn"><i class="fa-thin fa-arrow-left"></i> BACK</button>
        <span class="spec-nav-title">GENERATE</span>
        <span></span>
      </div>
    </div>
    <pre><code>.nav-bar &#123;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
&#125;</code></pre>

    <h3>.nav-btn</h3>
    <p class="text-sm text-muted">Ghost button for back navigation. No background, border, or shadow.</p>
    <pre><code>.nav-btn &#123;
  background: none; border: none; box-shadow: none;
  padding: 0.3rem 0.5rem; font-size: 0.8rem;
  color: var(--color-text-muted);
&#125;</code></pre>

    <h3>.nav-title</h3>
    <p class="text-sm text-muted">Section name label centered in nav bar.</p>
    <pre><code>.nav-title &#123;
  font-size: 0.8rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
&#125;</code></pre>

    <h3>.theme-toggle</h3>
    <p class="text-sm text-muted">Fixed-position button (top-right) to toggle light/dark theme. From <code>ThemeToggle.svelte</code>.</p>
    <div class="example-box">
      <button style="font-size: 1.1rem; padding: 0.4rem 0.5rem;">
        <i class="fa-thin fa-moon"></i>
      </button>
      <button style="font-size: 1.1rem; padding: 0.4rem 0.5rem; margin-left: 0.5rem;">
        <i class="fa-thin fa-sun"></i>
      </button>
    </div>
    <pre><code>.theme-toggle &#123;
  position: fixed; top: var(--spacing-md); right: var(--spacing-md);
  z-index: 200; font-size: 1.1rem;
&#125;</code></pre>

    <h3>.container</h3>
    <p class="text-sm text-muted">Content container. Max 900px, centered with horizontal padding.</p>
    <pre><code>.container &#123;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
&#125;</code></pre>

    <h3>.app-footer</h3>
    <p class="text-sm text-muted">Footer with version string. Centered text at page bottom.</p>
    <div class="example-box">
      <div style="text-align: center; padding: var(--spacing-lg) 0;">
        <span style="font-size: 0.65rem; color: var(--color-text-muted); letter-spacing: 0.1em;">v{VERSION}</span>
      </div>
    </div>
    <pre><code>.app-footer &#123;
  text-align: center;
  padding: var(--spacing-lg) 0;
  margin-top: var(--spacing-xl);
&#125;</code></pre>
  </section>

  <!-- ============================================================ -->
  <!-- 3. Global Primitives -->
  <!-- ============================================================ -->
  <section id="global-primitives" class="spec-section">
    <h2>3. Global Primitives</h2>
    <p class="section-desc">Buttons, inputs, badges, tables, and utility classes from <code>src/app.css</code>.</p>

    <h3>Buttons</h3>
    <p class="text-sm text-muted">Default: bordered with shadow. <code>.primary</code>: accent background, white text. <code>:disabled</code>: faded, no shadow.</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <button>Default</button>
        <button class="primary">Primary</button>
        <button disabled>Disabled</button>
      </div>
    </div>
    <pre><code>button, .btn &#123;
  font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;
  padding: 0.4rem 1rem; border: 1px solid var(--color-border-dark);
  border-radius: 0; background: var(--color-bg); color: var(--color-text);
  text-transform: uppercase; letter-spacing: 0.05em;
  box-shadow: 2px 2px 0px var(--color-shadow);
&#125;
button.primary &#123;
  background: var(--color-accent); color: #fff;
&#125;
button:disabled &#123;
  opacity: 0.4; cursor: not-allowed; box-shadow: none;
&#125;</code></pre>

    <h3>Inputs</h3>
    <div class="example-box">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 400px;">
        <input type="text" placeholder="Text input" />
        <textarea placeholder="Textarea" rows={2}></textarea>
        <select>
          <option>Select option</option>
        </select>
      </div>
    </div>
    <pre><code>input, textarea, select &#123;
  font-family: var(--font-mono); font-size: 0.9rem;
  padding: 0.5rem 0.75rem; border: 1px solid var(--color-border);
  border-radius: 0; background: var(--color-bg); color: var(--color-text);
&#125;
input:focus, textarea:focus, select:focus &#123;
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
&#125;</code></pre>

    <h3>Badges</h3>
    <p class="text-sm text-muted">Inline status labels with semantic color variants.</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <span class="badge badge-success">SUCCESS</span>
        <span class="badge badge-warning">WARNING</span>
        <span class="badge badge-error">ERROR</span>
        <span class="badge badge-info">INFO</span>
      </div>
    </div>
    <pre><code>.badge &#123;
  display: inline-block; font-size: 0.7rem; font-weight: 600;
  padding: 0.15rem 0.4rem; border: 1px solid;
  text-transform: uppercase; letter-spacing: 0.03em;
&#125;
.badge-success &#123; background: rgba(40,167,69,0.15); border-color: #28a745; color: #28a745; &#125;
.badge-warning &#123; background: rgba(255,193,7,0.15); border-color: #ffc107; color: #92400e; &#125;
.badge-error   &#123; background: rgba(220,53,69,0.15); border-color: #dc3545; color: #dc3545; &#125;
.badge-info    &#123; background: rgba(92,107,192,0.15); border-color: var(--color-accent); color: var(--color-accent); &#125;</code></pre>

    <h3>.data-table</h3>
    <p class="text-sm text-muted">Minimal data table with hover highlight.</p>
    <div class="example-box">
      <table class="data-table">
        <thead>
          <tr><th>Index</th><th>Address</th><th>Balance</th></tr>
        </thead>
        <tbody>
          <tr><td>0</td><td>0xAb5801a7...93Fd</td><td>1.234 ETH</td></tr>
          <tr><td>1</td><td>0x1234abcd...5678</td><td>0.500 ETH</td></tr>
        </tbody>
      </table>
    </div>
    <pre><code>.data-table &#123;
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
&#125;
.data-table th &#123;
  font-weight: 600; text-transform: uppercase; font-size: 0.75rem;
  letter-spacing: 0.05em; color: var(--color-text-muted);
&#125;
.data-table th, .data-table td &#123;
  padding: 0.4rem 0.75rem; text-align: left;
  border-bottom: 1px solid var(--color-border);
&#125;
.data-table tr:hover &#123; background: var(--color-hover-bg); &#125;</code></pre>

    <h3>.terminal-log</h3>
    <p class="text-sm text-muted">Scrollable log output with colored line types. From <code>src/app.css</code>.</p>
    <div class="example-box">
      <div class="terminal-log">
        <div class="log-line info">System initialized</div>
        <div class="log-line fetch">Fetching entropy bytes...</div>
        <div class="log-line found">Generated 24-word mnemonic</div>
        <div class="log-line error">Connection refused</div>
        <div class="log-line match">Share 3/5 matched</div>
        <div class="log-line clear">Cleared session data</div>
      </div>
    </div>
    <pre><code>.terminal-log &#123;
  background: var(--color-bg-alt); border: 1px solid var(--color-border-light);
  font-size: 13px; padding: var(--spacing-md);
  max-height: 400px; overflow-y: auto;
  box-shadow: 2px 2px 0px var(--color-shadow);
&#125;
.log-line::before &#123; content: '> '; color: var(--color-text-muted); &#125;
.log-line.fetch &#123; color: var(--color-link); &#125;
.log-line.found &#123; color: var(--color-success); &#125;
.log-line.match &#123; color: var(--color-error); font-weight: 600; &#125;
.log-line.clear &#123; color: var(--color-text-muted); &#125;
.log-line.error &#123; color: var(--color-error); &#125;</code></pre>

    <h3>.copy-toast</h3>
    <p class="text-sm text-muted">Floating ephemeral toast that animates upward and fades out (1s). Position set via JS at click coordinates.</p>
    <pre><code>.copy-toast &#123;
  position: fixed; pointer-events: none;
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
  padding: 0.2rem 0.5rem; background: var(--color-text); color: var(--color-bg);
  border: 1px solid var(--color-border-dark); z-index: 9999;
  animation: copyToast 1s ease forwards;
&#125;</code></pre>

    <h3>Utility Classes</h3>
    <div class="example-box">
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <code>.text-muted</code> <span class="text-muted">Muted text color</span>
        <code>.text-sm</code> <span class="text-sm">0.85rem font size</span>
        <code>.text-xs</code> <span class="text-xs">0.75rem font size</span>
        <code>.mt-xs / .mt-sm / .mt-md / .mt-lg</code> <span class="text-xs text-muted">Margin-top utilities</span>
        <code>.mb-sm / .mb-md / .mb-lg</code> <span class="text-xs text-muted">Margin-bottom utilities</span>
        <code>.gap-sm / .gap-md</code> <span class="text-xs text-muted">Gap utilities</span>
      </div>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- 4. Hero / Home -->
  <!-- ============================================================ -->
  <section id="hero-home" class="spec-section">
    <h2>4. Hero / Home</h2>
    <p class="section-desc">Landing page elements from <code>src/components/Hero.svelte</code>. Centered layout, max-width 600px.</p>

    <h3>.hero</h3>
    <p class="text-sm text-muted">Centered container for the home screen. Contains title, subtitle, action buttons, and the explainer accordion.</p>
    <div class="example-box" style="text-align: center;">
      <h1 style="font-size: 2.5rem; letter-spacing: 0.1em; text-transform: lowercase;">n of m</h1>
      <p style="font-size: 0.9rem; margin-top: var(--spacing-xs);">Shamir's Secret Sharing for Seed Phrases</p>
      <p class="text-muted" style="margin-top: var(--spacing-xs); letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.75rem;">Split. Print. Recover.</p>
    </div>
    <pre><code>.hero &#123; text-align: center; max-width: 600px; margin: 0 auto; &#125;
.hero-title &#123; font-size: 2.5rem; letter-spacing: 0.1em; text-transform: lowercase; &#125;
.hero-subtitle &#123; font-size: 0.9rem; margin-top: var(--spacing-xs); &#125;
.hero-tagline &#123; letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.75rem; &#125;</code></pre>

    <h3>.hero-actions</h3>
    <p class="text-sm text-muted">Flex row of navigation buttons. Wraps and stacks vertically on mobile.</p>
    <div class="example-box">
      <div style="display: flex; gap: var(--spacing-sm); justify-content: center; flex-wrap: wrap;">
        <button class="primary" style="min-width: 120px;"><i class="fa-thin fa-key"></i> Generate</button>
        <button style="min-width: 120px;"><i class="fa-thin fa-qrcode"></i> Scan</button>
        <button style="min-width: 120px;"><i class="fa-thin fa-vault"></i> Vault</button>
        <button style="min-width: 120px;"><i class="fa-thin fa-gear"></i> Settings</button>
      </div>
    </div>
    <pre><code>.hero-actions &#123;
  display: flex; gap: var(--spacing-sm);
  justify-content: center; flex-wrap: wrap;
&#125;
.hero-actions button &#123; min-width: 120px; &#125;</code></pre>

    <h3>.explainer / .math-block</h3>
    <p class="text-sm text-muted">Accordion section explaining Shamir's algorithm. Uses <code>.explainer-section</code>, <code>.explainer-heading</code>, and <code>.math-block</code> for formulas.</p>
    <div class="example-box">
      <div style="text-align: left; max-width: 520px; margin: 0 auto; border: 1px solid var(--color-border); background: var(--color-bg-alt); padding: var(--spacing-md);">
        <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 0.3rem;">Polynomial Construction</h3>
        <p style="font-size: 0.8rem; line-height: 1.6;">For each byte <code style="font-size: 0.75rem; background: var(--color-hover-bg); padding: 0.1rem 0.3rem; border: 1px solid var(--color-border);">s</code> of the secret, a random polynomial is constructed:</p>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; background: var(--color-hover-bg); border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; margin: 0.4rem 0; text-align: center;">f(x) = s + a<sub>1</sub>x + a<sub>2</sub>x<sup>2</sup> + ... + a<sub>t-1</sub>x<sup>t-1</sup></div>
      </div>
    </div>
    <pre><code>.explainer &#123;
  text-align: left; max-width: 520px; margin: 0 auto;
  border: 1px solid var(--color-border); background: var(--color-bg-alt);
  padding: var(--spacing-md);
&#125;
.math-block &#123;
  font-family: var(--font-mono); font-size: 0.75rem;
  background: var(--color-hover-bg); border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem; margin: 0.4rem 0; text-align: center;
&#125;</code></pre>
  </section>

  <!-- ============================================================ -->
  <!-- 5. Panel Component -->
  <!-- ============================================================ -->
  <section id="panel-component" class="spec-section">
    <h2>5. Panel Component</h2>
    <p class="section-desc">Reusable container from <code>src/components/Panel.svelte</code>. Uses global <code>.panel</code> / <code>.panel-header</code> from <code>src/app.css</code>.</p>

    <h3>.panel / .panel-header / .panel-body</h3>
    <div class="example-box">
      <div class="panel" style="max-width: 500px;">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Panel Title</span>
          <span class="text-xs text-muted">header-right slot</span>
        </div>
        <div style="padding: var(--spacing-md);">
          <p class="text-sm">Panel body content goes here. This is the default content area with <code>padding: var(--spacing-md)</code>.</p>
        </div>
      </div>
    </div>
    <pre><code>.panel &#123;
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: 0; box-shadow: 2px 2px 0px var(--color-shadow);
&#125;
.panel-header &#123;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  font-weight: 600; font-size: 0.85rem;
  text-transform: uppercase; letter-spacing: 0.05em;
&#125;
.panel-body &#123;
  padding: var(--spacing-md);
&#125;</code></pre>
  </section>

  <!-- ============================================================ -->
  <!-- 6. GenerateFlow Wizard -->
  <!-- ============================================================ -->
  <section id="generate-flow" class="spec-section">
    <h2>6. GenerateFlow Wizard</h2>
    <p class="section-desc">Multi-step wizard from <code>src/components/GenerateFlow.svelte</code> and its sub-components.</p>

    <h3>.step-indicator / .step-badge</h3>
    <p class="text-sm text-muted">Horizontal step tracker from <code>StepIndicator.svelte</code>. Badges show active, completed, or default state.</p>
    <div class="example-box">
      <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
        <span class="spec-step-badge completed"><i class="fa-thin fa-check"></i> Words</span>
        <span class="spec-step-badge completed"><i class="fa-thin fa-check"></i> Entropy</span>
        <span class="spec-step-badge active">3 Mnemonic</span>
        <span class="spec-step-badge">4 Derivation</span>
        <span class="spec-step-badge">5 Shamir</span>
        <span class="spec-step-badge">6 Metadata</span>
        <span class="spec-step-badge">7 Preview</span>
      </div>
    </div>
    <pre><code>.step-indicator &#123; display: flex; flex-wrap: wrap; gap: 0.35rem; &#125;
.step-badge &#123;
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.2rem 0.5rem; font-size: 0.7rem; font-weight: 600;
  text-transform: uppercase; border: 1px solid var(--color-border);
  color: var(--color-text-muted);
&#125;
.step-badge.active &#123;
  background: rgba(92,107,192,0.15); border-color: var(--color-accent);
  color: var(--color-accent);
&#125;
.step-badge.completed &#123;
  background: rgba(40,167,69,0.15); border-color: var(--color-success);
  color: var(--color-success);
&#125;</code></pre>

    <h3>.word-count-buttons</h3>
    <p class="text-sm text-muted">Row of word count options (12, 15, 18, 21, 24). Selected button uses <code>.primary</code>.</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
        <button>12</button>
        <button>15</button>
        <button>18</button>
        <button>21</button>
        <button class="primary">24</button>
      </div>
    </div>

    <h3>.entropy-canvas</h3>
    <p class="text-sm text-muted">Canvas from <code>EntropyCanvas.svelte</code> for mouse/touch entropy collection. Dark background, crosshair cursor, progress bar below.</p>
    <div class="example-box">
      <div style="width: 100%; height: 80px; background: #1a1a2e; border: 1px solid var(--color-border-dark); box-shadow: 2px 2px 0px var(--color-shadow); cursor: crosshair; display: flex; align-items: center; justify-content: center;">
        <span style="color: #00ff88; font-size: 0.7rem; text-transform: uppercase;">entropy canvas (crosshair cursor)</span>
      </div>
      <div style="height: 4px; background: var(--color-border); margin-top: 0.5rem;">
        <div style="height: 100%; background: var(--color-success); width: 65%;"></div>
      </div>
      <span class="text-xs text-muted" style="display: block; text-align: center; margin-top: 0.25rem;">MOVE YOUR MOUSE OR FINGER ACROSS THE CANVAS</span>
    </div>
    <pre><code>.entropy-canvas &#123;
  width: 100%; height: 200px;
  border: 1px solid var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
  cursor: crosshair; touch-action: none;
&#125;</code></pre>

    <h3>.mnemonic-grid / .word-cell</h3>
    <p class="text-sm text-muted">4-column grid of word cells from <code>MnemonicGrid.svelte</code>. Each cell has a small index number and centered word text.</p>
    <div class="example-box">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; max-width: 500px;">
        {#each ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract'] as word, i}
          <div style="border: 1px solid var(--color-border-dark); box-shadow: 2px 2px 0px var(--color-shadow); padding: 0.5rem; position: relative; display: flex; align-items: center; justify-content: center; min-height: 2.8rem;">
            <span style="position: absolute; top: 2px; left: 4px; font-size: 0.6rem; color: var(--color-text-muted);">{i + 1}</span>
            <span style="font-size: 0.85rem; font-weight: 600;">{word}</span>
          </div>
        {/each}
      </div>
    </div>
    <pre><code>.mnemonic-grid &#123;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
&#125;
.word-cell &#123;
  border: 1px solid var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
  padding: 0.5rem; position: relative;
  display: flex; align-items: center; justify-content: center;
  min-height: 2.8rem;
&#125;
.word-index &#123; position: absolute; top: 2px; left: 4px; font-size: 0.6rem; &#125;
.word-text &#123; font-size: 0.85rem; font-weight: 600; text-align: center; &#125;</code></pre>

    <h3>.path-editor</h3>
    <p class="text-sm text-muted">Derivation path selector from <code>PathEditor.svelte</code>. Toggle buttons for MetaMask / Ledger / Custom, with path display below.</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.35rem;">
        <button class="primary">MetaMask (BIP44)</button>
        <button>Ledger (BIP44)</button>
        <button>Custom</button>
      </div>
      <div style="font-family: var(--font-mono); font-size: 0.85rem; padding: 0.4rem 0.75rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); margin-top: var(--spacing-sm);">
        <code>m/44'/60'/0'/0/&#123;index&#125;</code>
      </div>
    </div>

    <h3>.shamir-config</h3>
    <p class="text-sm text-muted">Threshold (N) and total shares (M) inputs side by side.</p>
    <div class="example-box">
      <div style="display: flex; gap: var(--spacing-lg); flex-wrap: wrap;">
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label class="text-xs text-muted">THRESHOLD (N)</label>
          <input type="number" value={3} style="width: 80px;" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label class="text-xs text-muted">TOTAL SHARES (M)</label>
          <input type="number" value={5} style="width: 80px;" />
        </div>
      </div>
    </div>

    <h3>.color-swatches / .color-swatch</h3>
    <p class="text-sm text-muted">Color picker for card highlight. 32x32 buttons in a flex row.</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
        {#each ['#A8D8EA', '#FFB7B2', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#E2F0CB', '#F8E6E0', '#D5C4F8'] as color, i}
          <button
            style="width: 32px; height: 32px; background: {color}; border: 2px solid {i === 0 ? 'var(--color-border-dark)' : 'var(--color-border)'}; padding: 0; min-width: 0; box-shadow: {i === 0 ? '3px 3px 0px var(--color-shadow)' : '1px 1px 0px var(--color-shadow)'}; {i === 0 ? 'transform: translate(-1px, -1px);' : ''}"
          ></button>
        {/each}
      </div>
    </div>
    <pre><code>.color-swatch &#123;
  width: 32px; height: 32px;
  border: 2px solid var(--color-border);
  padding: 0; min-width: 0;
  box-shadow: 1px 1px 0px var(--color-shadow);
&#125;
.color-swatch.selected &#123;
  border-color: var(--color-border-dark);
  box-shadow: 3px 3px 0px var(--color-shadow);
  transform: translate(-1px, -1px);
&#125;</code></pre>

    <h3>.popup-overlay / .confirm-popup</h3>
    <p class="text-sm text-muted">Modal overlay (fixed, full-screen dim) and centered confirmation dialog. Used for PIN and passphrase confirmation.</p>
    <div class="example-box">
      <div style="position: relative; border: 1px solid var(--color-border); height: 200px; overflow: hidden;">
        <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3);"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--color-bg); border: 2px solid var(--color-border-dark); box-shadow: 6px 6px 0px var(--color-shadow); padding: var(--spacing-lg); min-width: 280px;">
          <h4 class="text-xs text-muted" style="margin-bottom: var(--spacing-sm);">CONFIRM PIN</h4>
          <p class="text-xs" style="margin-bottom: var(--spacing-sm);">Re-enter your 6-digit PIN to confirm.</p>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: var(--spacing-md);">
            <button>Cancel</button>
            <button class="primary"><i class="fa-thin fa-check"></i> Confirm</button>
          </div>
        </div>
      </div>
    </div>
    <pre><code>.popup-overlay &#123;
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  z-index: 100;
&#125;
.confirm-popup &#123;
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%); z-index: 101;
  background: var(--color-bg); border: 2px solid var(--color-border-dark);
  box-shadow: 6px 6px 0px var(--color-shadow);
  padding: var(--spacing-lg); min-width: 320px;
&#125;</code></pre>

    <h3>.pin-input</h3>
    <p class="text-sm text-muted">Large centered password input for 6-digit PIN entry from <code>PinInput.svelte</code>.</p>
    <div class="example-box">
      <input type="password" placeholder="******" style="font-size: 1.5rem; letter-spacing: 0.5em; text-align: center; padding: 0.75rem; max-width: 300px;" />
    </div>
    <pre><code>.pin-input &#123;
  font-size: 1.5rem; letter-spacing: 0.5em;
  text-align: center; padding: 0.75rem; max-width: 300px;
&#125;</code></pre>
  </section>

  <!-- ============================================================ -->
  <!-- 7. ScanFlow -->
  <!-- ============================================================ -->
  <section id="scan-flow" class="spec-section">
    <h2>7. ScanFlow</h2>
    <p class="section-desc">QR scanning and file import UI from <code>src/components/ScanFlow.svelte</code>.</p>

    <h3>.camera-area</h3>
    <p class="text-sm text-muted">Camera viewport container. 4:3 aspect ratio, max 500px wide, dark border with shadow.</p>
    <div class="example-box">
      <div style="position: relative; width: 100%; max-width: 350px; aspect-ratio: 4/3; background: var(--color-bg-alt); border: 1px solid var(--color-border-dark); box-shadow: 2px 2px 0px var(--color-shadow); margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <i class="fa-thin fa-camera" style="font-size: 2rem; color: var(--color-text-muted);"></i>
          <p class="text-sm text-muted" style="margin-top: var(--spacing-sm);">Camera not active</p>
        </div>
      </div>
    </div>
    <pre><code>.camera-area &#123;
  position: relative; width: 100%; max-width: 500px;
  margin: 0 auto; aspect-ratio: 4/3;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
&#125;</code></pre>

    <h3>.scan-overlay / .reticle / .corner</h3>
    <p class="text-sm text-muted">AR-style scanning overlay with corner brackets and guidance pill.</p>
    <div class="example-box">
      <div style="position: relative; width: 200px; height: 200px; background: #1a1a2e; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="position: relative; width: 65%; aspect-ratio: 1;">
          <div style="position: absolute; width: 24px; height: 24px; top: 0; left: 0; border-top: 3px solid rgba(255,255,255,0.9); border-left: 3px solid rgba(255,255,255,0.9);"></div>
          <div style="position: absolute; width: 24px; height: 24px; top: 0; right: 0; border-top: 3px solid rgba(255,255,255,0.9); border-right: 3px solid rgba(255,255,255,0.9);"></div>
          <div style="position: absolute; width: 24px; height: 24px; bottom: 0; left: 0; border-bottom: 3px solid rgba(255,255,255,0.9); border-left: 3px solid rgba(255,255,255,0.9);"></div>
          <div style="position: absolute; width: 24px; height: 24px; bottom: 0; right: 0; border-bottom: 3px solid rgba(255,255,255,0.9); border-right: 3px solid rgba(255,255,255,0.9);"></div>
        </div>
        <div style="position: absolute; bottom: 20px; padding: 4px 12px; background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.9); font-size: 0.7rem; letter-spacing: 0.5px;">Align QR code within frame</div>
      </div>
    </div>

    <h3>.shard-progress / .threshold-boxes</h3>
    <p class="text-sm text-muted">Progress indicator showing scanned shares vs. threshold. Boxes fill green as shares are found.</p>
    <div class="example-box">
      <div style="border: 1px solid var(--color-border); padding: var(--spacing-sm) var(--spacing-md); background: var(--color-bg-alt);">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span class="text-xs text-muted">THRESHOLD</span>
          <div style="display: flex; gap: 3px;">
            <div style="width: 20px; height: 20px; border: 2px solid var(--color-border-dark); background: var(--color-success);"></div>
            <div style="width: 20px; height: 20px; border: 2px solid var(--color-border-dark); background: var(--color-success);"></div>
            <div style="width: 20px; height: 20px; border: 2px solid var(--color-border-dark); background: var(--color-bg);"></div>
          </div>
          <span class="text-xs">2/3</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="text-xs text-muted">ALL SHARDS</span>
          <div style="display: flex; gap: 3px; flex-wrap: wrap;">
            {#each [1, 2, 3, 4, 5] as n}
              <div style="width: 24px; height: 24px; border: 1px solid {n <= 2 ? 'var(--color-success)' : 'var(--color-border)'}; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; background: {n <= 2 ? 'var(--color-success-bg)' : 'var(--color-bg)'}; color: {n <= 2 ? 'var(--color-success)' : 'var(--color-text-muted)'}; font-weight: {n <= 2 ? '600' : 'normal'};">{n}</div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    <pre><code>.threshold-box &#123;
  width: 20px; height: 20px;
  border: 2px solid var(--color-border-dark); background: var(--color-bg);
&#125;
.threshold-box.filled &#123; background: var(--color-success); &#125;
.slot-box &#123;
  width: 24px; height: 24px; border: 1px solid var(--color-border);
  font-size: 0.6rem; color: var(--color-text-muted);
&#125;
.slot-box.scanned &#123;
  background: var(--color-success-bg); border-color: var(--color-success);
  color: var(--color-success); font-weight: 600;
&#125;</code></pre>

    <h3>.upload-status / .braille-progress-bar</h3>
    <p class="text-sm text-muted">Status bar shown during file imports. Braille spinner + striped progress fill.</p>
    <div class="example-box">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; background: var(--color-bg-alt); border: 1px solid var(--color-border);">
        <div style="width: 24px; height: 24px; font-size: 1.5rem; font-weight: bold; color: var(--color-accent); display: flex; align-items: center; justify-content: center;">⠹</div>
        <div style="flex: 1;">
          <p class="text-sm">Scanning page 3/7 -- Found 2 QR codes</p>
          <div style="position: relative; width: 100%; height: 18px; background: var(--color-bg); border: 2px solid var(--color-accent); overflow: hidden; margin-top: 0.5rem; font-size: 0.7rem;">
            <div style="height: 100%; width: 43%; background: repeating-linear-gradient(45deg, #5C6BC0, #5C6BC0 4px, #7986CB 4px, #7986CB 8px);"></div>
            <span style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-size: 0.7rem; font-weight: 700; color: #333;">43%</span>
          </div>
        </div>
      </div>
    </div>

    <h3>.scan-formats</h3>
    <p class="text-sm text-muted">Accepted file formats info card with icon list and warning footer.</p>
    <div class="example-box">
      <div style="border: 1px solid var(--color-border); background: var(--color-bg-alt); max-width: 400px;">
        <div style="padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--color-border); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-thin fa-info-circle" style="color: var(--color-accent);"></i> Accepted Formats
        </div>
        <div style="padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.8rem; color: var(--color-text-muted);">
            <span style="color: var(--color-accent);"><i class="fa-thin fa-camera"></i></span>
            <span><strong style="color: var(--color-text);">Camera</strong> - Live QR scanning</span>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.8rem; color: var(--color-text-muted);">
            <span style="color: var(--color-accent);"><i class="fa-thin fa-file-pdf"></i></span>
            <span><strong style="color: var(--color-text);">PDF</strong> - Exported share cards</span>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.8rem; color: var(--color-text-muted);">
            <span style="color: var(--color-accent);"><i class="fa-thin fa-lock"></i></span>
            <span><strong style="color: var(--color-text);">Encrypted JSON</strong> - AES-256-GCM</span>
          </div>
        </div>
      </div>
    </div>

    <h3>.password-content</h3>
    <p class="text-sm text-muted">Password input for encrypted JSON import. Horizontal input + button layout.</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.5rem; align-items: center; max-width: 400px;">
        <input type="password" placeholder="Enter export password" style="flex: 1;" />
        <button class="primary"><i class="fa-thin fa-lock-open"></i> Decrypt</button>
      </div>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- 8. VaultPanel -->
  <!-- ============================================================ -->
  <section id="vault-panel" class="spec-section">
    <h2>8. VaultPanel</h2>
    <p class="section-desc">Secret management list from <code>src/components/VaultPanel.svelte</code>. Expandable items with export options.</p>

    <h3>.vault-list / .vault-item</h3>
    <p class="text-sm text-muted">Vertical list of saved secrets. Each item expands to show details on click.</p>
    <div class="example-box">
      <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 500px;">
        <div style="border: 1px solid var(--color-border); box-shadow: 2px 2px 0px var(--color-shadow);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-md); cursor: pointer;">
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">My Wallet Backup</div>
              <div class="text-xs text-muted">2026-02-25 -- 3-of-5 -- 24 words</div>
            </div>
            <i class="fa-thin fa-chevron-down" style="color: var(--color-text-muted);"></i>
          </div>
        </div>
        <div style="border: 1px solid var(--color-accent); box-shadow: 2px 2px 0px var(--color-shadow);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm) var(--spacing-md); cursor: pointer; background: rgba(92,107,192,0.05);">
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">Cold Storage Keys</div>
              <div class="text-xs text-muted">2026-02-20 -- 2-of-3 -- 12 words</div>
            </div>
            <i class="fa-thin fa-chevron-up" style="color: var(--color-accent);"></i>
          </div>
          <div style="padding: var(--spacing-md); border-top: 1px solid var(--color-border);">
            <p class="text-xs text-muted">Expanded detail content area</p>
          </div>
        </div>
      </div>
    </div>

    <h3>.popup-card / .export-options / .export-option</h3>
    <p class="text-sm text-muted">Export/share dialog with multiple download options (Print, HTML, PDF, Image, JSON).</p>
    <div class="example-box">
      <div style="border: 2px solid var(--color-border-dark); box-shadow: 6px 6px 0px var(--color-shadow); padding: var(--spacing-lg); max-width: 400px; background: var(--color-bg);">
        <h4 class="text-xs text-muted" style="margin-bottom: var(--spacing-sm);">EXPORT SHARE CARDS</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button style="text-align: left; width: 100%;"><i class="fa-thin fa-print"></i> Print Cards</button>
          <button style="text-align: left; width: 100%;"><i class="fa-thin fa-file-code"></i> Download HTML</button>
          <button style="text-align: left; width: 100%;"><i class="fa-thin fa-file-pdf"></i> Download PDF</button>
          <button style="text-align: left; width: 100%;"><i class="fa-thin fa-image"></i> Download Image</button>
        </div>
      </div>
    </div>

    <h3>.detail-actions</h3>
    <p class="text-sm text-muted">Action buttons at the bottom of an expanded vault item (Reprint, Export, Delete).</p>
    <div class="example-box">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button><i class="fa-thin fa-print"></i> Reprint</button>
        <button><i class="fa-thin fa-share-nodes"></i> Export</button>
        <button style="color: var(--color-error);"><i class="fa-thin fa-trash"></i> Delete</button>
      </div>
    </div>

    <h3>.share-sets-table</h3>
    <p class="text-sm text-muted">Table listing share indices, share data preview, and actions within the vault detail view.</p>
    <div class="example-box">
      <table class="data-table" style="max-width: 500px;">
        <thead>
          <tr><th>Share</th><th>Data</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>1/5</td><td style="font-size: 0.75rem;">a1b2c3d4e5f6...</td><td><span class="badge badge-success">OK</span></td></tr>
          <tr><td>2/5</td><td style="font-size: 0.75rem;">f6e5d4c3b2a1...</td><td><span class="badge badge-success">OK</span></td></tr>
          <tr><td>3/5</td><td style="font-size: 0.75rem;">1a2b3c4d5e6f...</td><td><span class="badge badge-success">OK</span></td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- 9. SettingsPanel -->
  <!-- ============================================================ -->
  <section id="settings-panel" class="spec-section">
    <h2>9. SettingsPanel</h2>
    <p class="section-desc">App configuration from <code>src/components/SettingsPanel.svelte</code>. Stacked panels for each setting group.</p>

    <h3>.settings-panels</h3>
    <p class="text-sm text-muted">Vertical stack of Panel components with <code>gap: var(--spacing-md)</code>.</p>

    <h3>.layout-options</h3>
    <p class="text-sm text-muted">Layout selector row: button + description + download icon.</p>
    <div class="example-box">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <button class="primary" style="min-width: 140px; text-align: left;"><i class="fa-thin fa-file"></i> Full Page</button>
        <span class="text-xs text-muted" style="flex: 1;">One card per page, 80% QR code</span>
        <button style="background: none; border: none; box-shadow: none; padding: 0.3rem; font-size: 0.9rem; color: var(--color-text-muted);"><i class="fa-thin fa-download"></i></button>
      </div>
    </div>

    <h3>.storage-row</h3>
    <p class="text-sm text-muted">Key-value rows showing storage info (localStorage, IndexedDB, encryption method).</p>
    <div class="example-box">
      <div style="max-width: 400px;">
        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid var(--color-border);">
          <span class="text-xs text-muted">LOCAL STORAGE</span>
          <span class="text-xs">Preferences, settings, PIN hash</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid var(--color-border);">
          <span class="text-xs text-muted">INDEXEDDB</span>
          <span class="text-xs">Encrypted vault (AES-256-GCM)</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
          <span class="text-xs text-muted">ENCRYPTION</span>
          <span class="text-xs">AES-256-GCM with browser key</span>
        </div>
      </div>
    </div>

    <h3>.algo-detail</h3>
    <p class="text-sm text-muted">Expandable cryptographic details section. Lists algorithm names and descriptions.</p>
    <div class="example-box">
      <div style="border: 1px solid var(--color-border); background: var(--color-bg-alt); padding: var(--spacing-sm) var(--spacing-md); max-width: 500px;">
        <div style="margin-bottom: var(--spacing-sm);">
          <h4 style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 0.2rem; font-weight: 600;">SECRET SPLITTING</h4>
          <p style="font-size: 0.75rem; line-height: 1.5;">Shamir's Secret Sharing over <code style="font-size: 0.7rem; background: var(--color-hover-bg); padding: 0.1rem 0.25rem; border: 1px solid var(--color-border);">GF(2^8)</code>. Information-theoretically secure.</p>
        </div>
        <div>
          <h4 style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); margin-bottom: 0.2rem; font-weight: 600;">VAULT ENCRYPTION</h4>
          <p style="font-size: 0.75rem; line-height: 1.5;"><code style="font-size: 0.7rem; background: var(--color-hover-bg); padding: 0.1rem 0.25rem; border: 1px solid var(--color-border);">AES-256-GCM</code> with authenticated encryption.</p>
        </div>
      </div>
    </div>

    <h3>.credits-list / .credit-badge</h3>
    <p class="text-sm text-muted">Linked badges for third-party libraries used in the project.</p>
    <div class="example-box">
      <div style="border: 1px solid var(--color-border); background: var(--color-bg-alt); padding: var(--spacing-sm) var(--spacing-md);">
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <span class="badge badge-info" style="font-size: 0.7rem; width: fit-content;">svelte</span>
          <span class="badge badge-info" style="font-size: 0.7rem; width: fit-content;">sveltekit</span>
          <span class="badge badge-info" style="font-size: 0.7rem; width: fit-content;">ethers</span>
          <span class="badge badge-info" style="font-size: 0.7rem; width: fit-content;">qr-scanner</span>
        </div>
      </div>
    </div>

    <h3>.install-steps</h3>
    <p class="text-sm text-muted">Platform-specific PWA install instructions. Key-value rows.</p>
    <div class="example-box">
      <div style="display: flex; flex-direction: column; gap: 0.35rem; max-width: 400px;">
        <div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.25rem 0; border-bottom: 1px solid var(--color-border);">
          <span class="text-xs text-muted" style="flex-shrink: 0; min-width: 7rem;">CHROME / EDGE</span>
          <span class="text-xs">Click install icon in address bar</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.25rem 0; border-bottom: 1px solid var(--color-border);">
          <span class="text-xs text-muted" style="flex-shrink: 0; min-width: 7rem;">SAFARI (iOS)</span>
          <span class="text-xs">Share -> Add to Home Screen</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.25rem 0;">
          <span class="text-xs text-muted" style="flex-shrink: 0; min-width: 7rem;">FIREFOX</span>
          <span class="text-xs">Use standalone HTML instead</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- 10. PDF / Share Card Template -->
  <!-- ============================================================ -->
  <section id="pdf-share-card" class="spec-section">
    <h2>10. PDF / Share Card Template</h2>
    <p class="section-desc">
      Share card layout from <code>src/lib/pdf/templates.ts</code>.
      The PDF template uses its own hardcoded CSS (Courier New, black borders, white background) independent of app theme variables.
      Layout config from <code>src/lib/pdf/layouts.ts</code>: qrSize=252, fontSize=11.
    </p>

    <div class="pdf-preview">
      <div class="pdf-page">
        <div class="pdf-page-title">
          <div class="pdf-page-title-text">Shamir Secret Sharing Card</div>
          <div class="pdf-page-title-version">v{VERSION}</div>
        </div>

        <div class="pdf-card">
          <div class="pdf-header" style="background: #A8D8EA;">
            <span class="pdf-header-title">3/5 SHAMIR</span>
            <span class="pdf-header-meta">T:3 &middot; 24W &middot; V2</span>
          </div>

          <div class="pdf-section">
            <div class="pdf-section-label">INSTRUCTIONS</div>
            <div class="pdf-instructions">
              <p>This card is one fragment of a secret divided using
              <b>Shamir's Secret Sharing</b>. By itself this card
              reveals <b>nothing</b> about the original secret.</p>
              <p>To reconstruct the secret, collect and scan
              <b>at least 3 of the 5 total share cards</b>
              using the Shamir recovery app.</p>
              <p>During recovery you <u>may need to provide a PIN</u>.
              You <u>may also be asked additional questions</u> about
              your secret's configuration.</p>
              <p><b>Do not store all shares in the same location.</b>
              Each share should be kept <b>secure and separate</b>.</p>
            </div>
          </div>

          <div class="pdf-section pdf-date-row">
            <div class="pdf-section-label">CREATED</div>
            <span class="pdf-date-value">2026-02-25 14:00</span>
          </div>

          <div class="pdf-section pdf-notes-section">
            <div class="pdf-section-label">NOTES</div>
            <div class="pdf-note-line"></div>
            <div class="pdf-note-line"></div>
            <div class="pdf-note-line"></div>
            <div class="pdf-note-line"></div>
          </div>

          <div class="pdf-section pdf-bottom-section">
            <div class="pdf-share-qr">
              <div style="width: 100px; height: 100px; background: #f0f0f0; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #666;">QR CODE</div>
            </div>
            <div class="pdf-bottom-right">
              <div class="pdf-qr-info-top">
                <p>This QR code contains your encrypted share data.
                Scan it with the Shamir recovery app to begin the
                reconstruction process. You will need to scan at
                least <b>3 cards</b> total.</p>
              </div>
              <div class="pdf-qr-info-bottom">
                <p><b>Handle with care.</b> If this card is lost or
                damaged you will need the remaining shares to recover
                your secret. <b>There are no backups.</b></p>
              </div>
              <div class="pdf-addresses-section">
                <div class="pdf-section-label">DERIVATION</div>
                <span class="pdf-derivation-path">m/44'/60'/0'/0/&#123;index&#125;</span>
                <div class="pdf-addr-list">
                  <div class="pdf-addr-item"><span class="pdf-addr-idx">0</span><span class="pdf-addr-val">0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B</span></div>
                  <div class="pdf-addr-item"><span class="pdf-addr-idx">1</span><span class="pdf-addr-val">0x1234567890abcdef1234567890abcdef12345678</span></div>
                  <div class="pdf-addr-item"><span class="pdf-addr-idx">2</span><span class="pdf-addr-val">0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef</span></div>
                </div>
              </div>
            </div>
          </div>

          <div class="pdf-footer">
            <div class="pdf-footer-warning">&#9888; Do not lose this card -- Share 3 of 5. Need 3+ to recover.</div>
            <div class="pdf-footer-info">Pin: enabled &middot; Passphrase: none</div>
            <div class="pdf-footer-guid">550e8400-e29b-41d4-a716-446655440000</div>
          </div>
        </div>
      </div>
    </div>

    <h3>Template Class Reference</h3>
    <div class="class-ref-table">
      <table class="data-table">
        <thead>
          <tr><th>Class</th><th>Element</th><th>Key Properties</th></tr>
        </thead>
        <tbody>
          <tr><td><code>.page</code></td><td>Page container</td><td>page-break-after: always; min-height: 100vh; flex column</td></tr>
          <tr><td><code>.page-title</code></td><td>Page header</td><td>text-align: center; padding-bottom: 0.5rem</td></tr>
          <tr><td><code>.page-title-text</code></td><td>Title text</td><td>14px bold; uppercase; letter-spacing: 2px</td></tr>
          <tr><td><code>.page-title-version</code></td><td>Version label</td><td>10px; color: #666</td></tr>
          <tr><td><code>.card</code></td><td>Card wrapper</td><td>border: 3px solid #000; flex column; full width</td></tr>
          <tr><td><code>.header</code></td><td>Colored header bar</td><td>padding: 6px 12px; border-bottom: 3px solid #000; flex row</td></tr>
          <tr><td><code>.header-title</code></td><td>Share label (e.g. "3/5 SHAMIR")</td><td>13px bold uppercase</td></tr>
          <tr><td><code>.header-meta</code></td><td>Config summary</td><td>9px; opacity: 0.7</td></tr>
          <tr><td><code>.section</code></td><td>Content section</td><td>padding: 8px 12px; border-bottom: 2px solid #000</td></tr>
          <tr><td><code>.section-label</code></td><td>Section heading</td><td>8px bold uppercase; letter-spacing: 2px; color: #666</td></tr>
          <tr><td><code>.instructions-text</code></td><td>Instruction paragraphs</td><td>10.5px; line-height: 1.5</td></tr>
          <tr><td><code>.date-row</code></td><td>Created date</td><td>flex row; gap: 12px; condensed padding</td></tr>
          <tr><td><code>.notes-section</code></td><td>Blank lines area</td><td>min-height: 60px</td></tr>
          <tr><td><code>.note-line</code></td><td>Ruled line</td><td>border-bottom: 1px solid #ccc; height: 16px</td></tr>
          <tr><td><code>.bottom-section</code></td><td>QR + info area</td><td>flex row; gap: 12px; flex: 1</td></tr>
          <tr><td><code>.share-qr</code></td><td>QR code frame</td><td>border: 2px solid #000; padding: 5em</td></tr>
          <tr><td><code>.bottom-right</code></td><td>Text beside QR</td><td>flex: 1; flex column; space-between</td></tr>
          <tr><td><code>.qr-info-top</code></td><td>QR scan instructions</td><td>10px; line-height: 1.4</td></tr>
          <tr><td><code>.qr-info-bottom</code></td><td>Care warning</td><td>10px; line-height: 1.4</td></tr>
          <tr><td><code>.addresses-section</code></td><td>Address list area</td><td>margin-top: auto</td></tr>
          <tr><td><code>.addr-list</code></td><td>Address container</td><td>flex column; gap: 1px</td></tr>
          <tr><td><code>.addr-item</code></td><td>Single address row</td><td>flex row; gap: 4px; font-size: 9px</td></tr>
          <tr><td><code>.addr-idx</code></td><td>Address index</td><td>color: #666; bold; min-width: 12px</td></tr>
          <tr><td><code>.addr-val</code></td><td>Address text</td><td>word-break: break-all</td></tr>
          <tr><td><code>.footer</code></td><td>Card footer</td><td>padding: 6px 12px; border-top: 3px solid #000; bg: #f5f5f5</td></tr>
          <tr><td><code>.footer-warning</code></td><td>Warning text</td><td>8px bold</td></tr>
          <tr><td><code>.footer-info</code></td><td>PIN/passphrase status</td><td>8px; color: #666</td></tr>
          <tr><td><code>.footer-guid</code></td><td>Share UUID</td><td>7px; Courier New; text-align: right; color: #666</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</div>

<style>
  .ux-spec {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--spacing-lg);
    padding-bottom: 4rem;
  }

  .spec-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 2px solid var(--color-border-dark);
  }

  /* TOC */
  .toc {
    margin-bottom: var(--spacing-xl);
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .toc-toggle {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    box-shadow: none;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.8rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .toc-toggle:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .toc-toggle i {
    margin-right: 0.35rem;
  }
  .toc-list {
    list-style: none;
    padding: 0 var(--spacing-md) var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .toc-list li a {
    font-size: 0.8rem;
    color: var(--color-link);
    text-decoration: none;
    padding: 0.15rem 0;
    display: block;
  }
  .toc-list li a:hover {
    text-decoration: underline;
  }

  /* Sections */
  .spec-section {
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-xl);
    border-bottom: 1px solid var(--color-border);
  }
  .spec-section:last-child {
    border-bottom: none;
  }
  .spec-section h2 {
    margin-bottom: var(--spacing-sm);
  }
  .spec-section h3 {
    margin-top: var(--spacing-lg);
    margin-bottom: var(--spacing-xs);
    color: var(--color-accent);
  }
  .section-desc {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-md);
  }
  .section-desc code {
    font-size: 0.8rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--color-border);
  }

  /* Example boxes */
  .example-box {
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
    margin-bottom: var(--spacing-sm);
  }

  /* Code blocks */
  pre {
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
    padding: var(--spacing-md);
    overflow-x: auto;
    font-size: 0.75rem;
    line-height: 1.5;
    margin-bottom: var(--spacing-md);
  }
  pre code {
    background: none;
    border: none;
    padding: 0;
  }

  /* Token grid */
  .token-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: var(--spacing-md);
  }
  .token-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.25rem 0;
  }
  .token-row code {
    font-size: 0.75rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .token-swatch {
    width: 24px;
    height: 24px;
    border: 1px solid var(--color-border-dark);
    flex-shrink: 0;
  }
  .token-spacing {
    height: 12px;
    background: var(--color-accent);
    flex-shrink: 0;
    min-width: 8px;
  }

  /* Nav examples (not using scoped component styles) */
  .spec-nav-btn {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.03em;
  }
  .spec-nav-btn:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .spec-nav-title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Step badge examples */
  .spec-step-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: transparent;
  }
  .spec-step-badge.active {
    background: rgba(92, 107, 192, 0.15);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .spec-step-badge.completed {
    background: rgba(40, 167, 69, 0.15);
    border-color: var(--color-success);
    color: var(--color-success);
  }

  /* PDF Preview */
  .pdf-preview {
    background: #fff;
    color: #000;
    padding: 2rem;
    border: 2px solid var(--color-border-dark);
    box-shadow: 4px 4px 0px var(--color-shadow);
    margin-bottom: var(--spacing-md);
  }
  .pdf-page {
    font-family: 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.4;
  }
  .pdf-page-title {
    text-align: center;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  .pdf-page-title-text {
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #000;
  }
  .pdf-page-title-version {
    font-size: 10px;
    color: #666;
    margin-top: 4px;
  }
  .pdf-card {
    border: 3px solid #000;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
  }
  .pdf-header {
    padding: 6px 12px;
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 3px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #000;
  }
  .pdf-header-title {
    font-size: 13px;
  }
  .pdf-header-meta {
    font-size: 9px;
    letter-spacing: 0.5px;
    opacity: 0.7;
  }
  .pdf-section {
    padding: 8px 12px;
    border-bottom: 2px solid #000;
  }
  .pdf-section-label {
    font-weight: bold;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #666;
    margin-bottom: 4px;
  }
  .pdf-instructions {
    font-size: 10.5px;
    line-height: 1.5;
  }
  .pdf-instructions p {
    margin-bottom: 4px;
  }
  .pdf-date-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 5px 12px;
  }
  .pdf-date-row .pdf-section-label {
    margin-bottom: 0;
  }
  .pdf-date-value {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    font-weight: bold;
    color: #000;
  }
  .pdf-notes-section {
    min-height: 60px;
  }
  .pdf-note-line {
    border-bottom: 1px solid #ccc;
    height: 16px;
    width: 100%;
  }
  .pdf-bottom-section {
    display: flex;
    flex-direction: row;
    gap: 12px;
    border-bottom: none;
  }
  .pdf-share-qr {
    border: 2px solid #000;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .pdf-bottom-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .pdf-qr-info-top,
  .pdf-qr-info-bottom {
    font-size: 10px;
    line-height: 1.4;
    color: #000;
    margin-bottom: 4px;
  }
  .pdf-addresses-section {
    margin-top: auto;
  }
  .pdf-derivation-path {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 4px;
    display: block;
    color: #000;
  }
  .pdf-addr-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .pdf-addr-item {
    display: flex;
    gap: 4px;
    font-size: 9px;
    line-height: 1.3;
  }
  .pdf-addr-idx {
    color: #666;
    font-weight: bold;
    min-width: 12px;
    text-align: right;
    flex-shrink: 0;
  }
  .pdf-addr-val {
    word-break: break-all;
    color: #000;
  }
  .pdf-footer {
    padding: 6px 12px;
    border-top: 3px solid #000;
    background: #f5f5f5;
  }
  .pdf-footer-warning {
    font-size: 8px;
    font-weight: bold;
    letter-spacing: 0.5px;
    line-height: 1.5;
    margin-bottom: 2px;
    color: #000;
  }
  .pdf-footer-info {
    font-size: 8px;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: #666;
    margin-bottom: 2px;
  }
  .pdf-footer-guid {
    font-size: 7px;
    font-family: 'Courier New', monospace;
    color: #666;
    text-align: right;
    letter-spacing: 0.5px;
  }

  .class-ref-table {
    margin-top: var(--spacing-md);
  }
  .class-ref-table code {
    font-size: 0.7rem;
    background: var(--color-hover-bg);
    padding: 0.1rem 0.25rem;
    border: 1px solid var(--color-border);
    white-space: nowrap;
  }

  /* Print */
  @media print {
    .ux-spec {
      padding: 0;
    }
    .toc {
      page-break-after: always;
    }
    .spec-section {
      page-break-inside: avoid;
      page-break-before: auto;
    }
    .spec-section h2 {
      page-break-after: avoid;
    }
    .example-box, pre {
      page-break-inside: avoid;
    }
    .pdf-preview {
      page-break-inside: avoid;
    }
  }
</style>

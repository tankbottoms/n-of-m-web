<script lang="ts">
  import { browser } from '$app/environment';
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import Splash from '../components/Splash.svelte';
  import Hero from '../components/Hero.svelte';
  import GenerateFlow from '../components/GenerateFlow.svelte';
  import ScanFlow from '../components/ScanFlow.svelte';
  import VaultPanel from '../components/VaultPanel.svelte';
  import SettingsPanel from '../components/SettingsPanel.svelte';
  import { VERSION } from '$lib/version';

  const SPLASH_KEY = 'n-of-m-splash-seen';

  type Mode = 'home' | 'generate' | 'scan' | 'vault' | 'settings';
  let mode = $state<Mode>('home');
  let isActive = $derived(mode !== 'home');
  let showSplash = $state(browser && !localStorage.getItem(SPLASH_KEY));

  function splashDone() {
    showSplash = false;
    if (browser) localStorage.setItem(SPLASH_KEY, '1');
  }

  function replaySplash() {
    showSplash = true;
  }

  function navigate(m: Mode) {
    mode = m;
  }

  function goHome() {
    mode = 'home';
  }
</script>

{#if showSplash}
  <Splash onComplete={splashDone} />
{/if}

<ThemeToggle />

<div class="app-wrapper" class:active={isActive}>
  {#if isActive}
    <div class="nav-bar">
      <button class="nav-btn" onclick={goHome}>
        <i class="fa-thin fa-arrow-left"></i> BACK
      </button>
      <span class="nav-title">{mode.toUpperCase()}</span>
      <span></span>
    </div>
  {/if}

  <div class="container">
    {#if mode === 'home'}
      <Hero onNavigate={(m) => navigate(m)} />
    {:else if mode === 'generate'}
      <GenerateFlow onComplete={goHome} />
    {:else if mode === 'scan'}
      <ScanFlow onComplete={goHome} />
    {:else if mode === 'vault'}
      <VaultPanel />
    {:else if mode === 'settings'}
      <SettingsPanel />
    {/if}
  </div>

  <footer class="app-footer">
    <button class="footer-link" onclick={replaySplash}><i class="fa-thin fa-wand-magic-sparkles"></i> Replay Animation</button>
    <span class="footer-version">v{VERSION}</span>
  </footer>
</div>

<style>
  .app-wrapper {
    margin-top: 25vh;
    transition: margin-top 0.3s ease;
  }
  .app-wrapper.active {
    margin-top: 0;
  }
  @media (max-width: 480px) {
    .app-wrapper {
      margin-top: 15vh;
    }
  }
  .nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-md);
  }
  .nav-title {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .nav-btn {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
    cursor: pointer;
    text-transform: uppercase;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.03em;
  }
  .nav-btn:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
  .app-footer {
    text-align: center;
    padding: var(--spacing-lg) 0;
    margin-top: var(--spacing-xl);
  }
  .footer-link {
    display: block;
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 auto var(--spacing-sm);
    cursor: pointer;
  }
  .footer-link:hover {
    color: var(--color-link);
    box-shadow: none;
    transform: none;
  }
  .footer-link i {
    margin-right: 0.15rem;
  }
  .footer-version {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--color-text-muted);
    letter-spacing: 0.1em;
  }
</style>

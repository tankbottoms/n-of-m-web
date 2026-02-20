<script lang="ts">
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import Hero from '../components/Hero.svelte';
  import GenerateFlow from '../components/GenerateFlow.svelte';
  import ScanFlow from '../components/ScanFlow.svelte';
  import VaultPanel from '../components/VaultPanel.svelte';
  import SettingsPanel from '../components/SettingsPanel.svelte';
  import DebugTerminal from '../components/DebugTerminal.svelte';

  type Mode = 'home' | 'generate' | 'scan' | 'vault' | 'settings';
  let mode = $state<Mode>('home');
  let isActive = $derived(mode !== 'home');

  function navigate(m: Mode) {
    mode = m;
  }

  function goHome() {
    mode = 'home';
  }
</script>

<ThemeToggle />
<DebugTerminal />

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
</style>

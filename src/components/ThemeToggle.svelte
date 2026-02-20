<script lang="ts">
  let dark = $state(false);

  function toggle() {
    dark = !dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  $effect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      dark = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  });
</script>

<button class="theme-toggle" onclick={toggle} aria-label="Toggle theme">
  <i class="fa-thin {dark ? 'fa-sun' : 'fa-moon'}"></i>
</button>

<style>
  .theme-toggle {
    position: fixed;
    top: var(--spacing-md);
    right: var(--spacing-md);
    z-index: 200;
    font-size: 1.1rem;
    padding: 0.4rem 0.5rem;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { WordSalad } from '$lib/word-salad/word-salad';

  let { onComplete }: { onComplete: () => void } = $props();

  let containerEl: HTMLDivElement;
  let splash: WordSalad | null = null;
  let fading = $state(false);

  function finish() {
    fading = true;
    setTimeout(() => {
      splash?.destroy();
      splash = null;
      onComplete();
    }, 600);
  }

  onMount(() => {
    splash = new WordSalad({
      container: containerEl,
      burstCycles: 1,
      holdDuration: 4000,
      onComplete: finish,
    });
    splash.start();

    return () => {
      splash?.destroy();
      splash = null;
    };
  });
</script>

<div class="splash" class:fading bind:this={containerEl}>
  <button class="skip-btn" onclick={finish}>Skip</button>
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: #fff;
    transition: opacity 0.6s ease;
  }
  .splash.fading {
    opacity: 0;
    pointer-events: none;
  }
  .skip-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1001;
    font-family: var(--font-mono, "SF Mono", "Fira Code", monospace);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #999;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid #ddd;
    box-shadow: none;
    padding: 6px 14px;
    cursor: pointer;
  }
  .skip-btn:hover {
    color: #111;
    border-color: #999;
    transform: none;
    box-shadow: none;
  }
</style>

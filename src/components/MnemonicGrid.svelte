<script lang="ts">
  let { words = [], masked = false }: {
    words: string[];
    masked?: boolean;
  } = $props();
</script>

<div class="mnemonic-grid">
  {#each words as word, i}
    <div class="word-cell">
      <span class="word-index">{i + 1}</span>
      <span class="word-text">{masked ? '****' : word}</span>
    </div>
  {/each}
</div>

<style>
  .mnemonic-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .word-cell {
    border: 1px solid var(--color-border-dark);
    box-shadow: 2px 2px 0px var(--color-shadow);
    padding: 0.5rem;
    font-family: var(--font-mono);
    position: relative;
  }

  .word-index {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 0.6rem;
    color: var(--color-text-muted);
  }

  .word-text {
    display: block;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .mnemonic-grid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 480px) {
    .mnemonic-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>

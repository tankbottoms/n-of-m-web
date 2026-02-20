<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title = '', children, headerRight }: {
    title?: string;
    children: Snippet;
    headerRight?: Snippet;
  } = $props();
</script>

<div class="panel">
  {#if title}
    <div class="panel-header">
      <span>{title}</span>
      {#if headerRight}
        <span class="header-right">{@render headerRight()}</span>
      {/if}
    </div>
  {/if}
  <div class="panel-body">
    {@render children()}
  </div>
</div>

<style>
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .panel-body {
    padding: var(--spacing-md);
  }
</style>

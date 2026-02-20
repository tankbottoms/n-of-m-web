<script lang="ts">
  export interface LogEntry {
    text: string;
    type: 'info' | 'fetch' | 'found' | 'match' | 'clear' | 'error';
    time: string;
  }

  let { entries = [], expanded = false }: {
    entries: LogEntry[];
    expanded?: boolean;
  } = $props();

  let logEl: HTMLDivElement;

  $effect(() => {
    if (logEl && entries.length) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  });
</script>

<div class="terminal-log" class:expanded bind:this={logEl}>
  {#each entries as entry}
    <div class="log-line {entry.type}">
      <span class="log-time">[{entry.time}]</span> {entry.text}
    </div>
  {/each}
</div>

<style>
  .expanded {
    max-height: 800px;
  }
  .log-time {
    color: var(--color-text-muted);
    font-size: 0.8em;
  }
</style>

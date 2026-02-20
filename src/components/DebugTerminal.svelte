<script lang="ts">
  import { onMount } from 'svelte';

  let { visible = $bindable(false) }: { visible?: boolean } = $props();
  let logs = $state<{ time: string; type: string; msg: string }[]>([]);
  let logEl: HTMLDivElement;

  function ts(): string {
    return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function addLog(type: string, msg: string) {
    logs = [...logs, { time: ts(), type, msg }];
    requestAnimationFrame(() => {
      if (logEl) logEl.scrollTop = logEl.scrollHeight;
    });
  }

  // Intercept localStorage
  function patchLocalStorage() {
    const origSet = localStorage.setItem.bind(localStorage);
    const origGet = localStorage.getItem.bind(localStorage);
    const origRemove = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      addLog('ls-write', `SET ${key} = ${value.length > 80 ? value.slice(0, 80) + '...' : value}`);
      return origSet(key, value);
    };

    localStorage.getItem = (key: string) => {
      const val = origGet(key);
      addLog('ls-read', `GET ${key} → ${val === null ? 'null' : val.length > 60 ? val.slice(0, 60) + '...' : val}`);
      return val;
    };

    localStorage.removeItem = (key: string) => {
      addLog('ls-write', `DEL ${key}`);
      return origRemove(key);
    };
  }

  // Intercept IndexedDB open
  function patchIndexedDB() {
    const origOpen = indexedDB.open.bind(indexedDB);
    indexedDB.open = (...args: Parameters<typeof indexedDB.open>) => {
      addLog('idb', `OPEN ${args[0]} v${args[1] ?? '?'}`);
      const req = origOpen(...args);
      req.onsuccess = ((origHandler) => function (this: IDBOpenDBRequest, ev: Event) {
        addLog('idb', `OPENED ${args[0]}`);
        if (origHandler) return (origHandler as EventListener).call(this, ev);
      })(req.onsuccess);
      return req;
    };
  }

  function clearAllData() {
    localStorage.clear();
    addLog('clear', 'localStorage cleared');
    const delReq = indexedDB.deleteDatabase('shamir_vault');
    delReq.onsuccess = () => addLog('clear', 'IndexedDB shamir_vault deleted');
    delReq.onerror = () => addLog('error', 'Failed to delete IndexedDB');
  }

  onMount(() => {
    patchLocalStorage();
    patchIndexedDB();
    addLog('info', 'Debug terminal initialized');
  });
</script>

{#if visible}
  <div class="debug-panel">
    <div class="debug-header">
      <span class="debug-title">DEBUG TERMINAL</span>
      <div class="debug-header-actions">
        <button class="debug-btn" onclick={() => { logs = []; }} title="Clear logs">
          <i class="fa-thin fa-eraser"></i>
        </button>
        <button class="debug-btn danger" onclick={clearAllData} title="Clear all browser data">
          <i class="fa-thin fa-trash"></i> CLEAR DATA
        </button>
        <button class="debug-btn" onclick={() => { visible = false; }} title="Close">
          <i class="fa-thin fa-xmark"></i>
        </button>
      </div>
    </div>
    <div class="debug-log" bind:this={logEl}>
      {#each logs as log}
        <div class="debug-line {log.type}">
          <span class="debug-time">{log.time}</span>
          <span class="debug-tag">[{log.type}]</span>
          <span class="debug-msg">{log.msg}</span>
        </div>
      {/each}
      {#if logs.length === 0}
        <div class="debug-line info">
          <span class="debug-msg">No activity yet. Interact with the app to see logs.</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .debug-panel {
    position: fixed;
    bottom: 3.5rem;
    right: 1rem;
    z-index: 998;
    width: 480px;
    max-width: calc(100vw - 2rem);
    max-height: 320px;
    border: 1px solid var(--color-border-dark);
    box-shadow: 4px 4px 0px var(--color-shadow);
    background: var(--color-crypto-bg);
    color: var(--color-crypto-text);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    display: flex;
    flex-direction: column;
  }
  .debug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid var(--color-border);
    background: rgba(0,0,0,0.2);
  }
  .debug-title {
    font-weight: 600;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .debug-header-actions {
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }
  .debug-btn {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.15rem 0.3rem;
    color: var(--color-crypto-text);
    cursor: pointer;
    font-size: 0.65rem;
    text-transform: uppercase;
    font-family: var(--font-mono);
  }
  .debug-btn:hover {
    box-shadow: none;
    transform: none;
    opacity: 0.7;
  }
  .debug-btn.danger {
    color: var(--color-error);
  }
  .debug-log {
    flex: 1;
    overflow-y: auto;
    padding: 0.35rem 0.5rem;
    max-height: 260px;
  }
  .debug-line {
    padding: 1px 0;
    line-height: 1.4;
    word-break: break-all;
  }
  .debug-time {
    color: rgba(255,255,255,0.3);
    margin-right: 0.4rem;
  }
  .debug-tag {
    margin-right: 0.3rem;
    font-weight: 600;
  }
  .debug-line.ls-read .debug-tag { color: #6c71c4; }
  .debug-line.ls-write .debug-tag { color: #b58900; }
  .debug-line.idb .debug-tag { color: #2aa198; }
  .debug-line.clear .debug-tag { color: #dc322f; }
  .debug-line.error .debug-tag { color: #dc322f; }
  .debug-line.info .debug-tag { color: #839496; }
</style>

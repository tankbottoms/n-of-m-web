<script lang="ts">
  let { length = 6, value = $bindable(''), onComplete }: {
    length?: number;
    value?: string;
    onComplete?: (pin: string) => void;
  } = $props();

  function onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    value = input.value.replace(/\D/g, '').slice(0, length);
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }
</script>

<div class="pin-input-wrapper">
  <input
    type="password"
    inputmode="numeric"
    pattern="[0-9]*"
    maxlength={length}
    {value}
    oninput={onInput}
    placeholder={'*'.repeat(length)}
    class="pin-input"
  />
  <span class="pin-hint text-xs text-muted">{value.length}/{length} DIGITS</span>
</div>

<style>
  .pin-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .pin-input {
    font-size: 1.5rem;
    letter-spacing: 0.5em;
    text-align: center;
    padding: 0.75rem;
    max-width: 300px;
  }
  .pin-hint {
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>

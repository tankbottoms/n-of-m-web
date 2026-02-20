<script lang="ts">
  interface Step {
    label: string;
    key: string;
  }

  let { steps, currentStep, completedSteps = [] }: {
    steps: Step[];
    currentStep: string;
    completedSteps?: string[];
  } = $props();
</script>

<div class="step-indicator">
  {#each steps as step, i}
    <span
      class="step-badge"
      class:active={step.key === currentStep}
      class:completed={completedSteps.includes(step.key)}
    >
      {#if completedSteps.includes(step.key)}
        <i class="fa-thin fa-check"></i>
      {:else}
        {i + 1}
      {/if}
      {step.label}
    </span>
  {/each}
</div>

<style>
  .step-indicator {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: var(--spacing-md);
  }

  .step-badge {
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

  .step-badge.active {
    background: rgba(92, 107, 192, 0.15);
    border-color: var(--color-accent, #5c6bc0);
    color: var(--color-accent, #5c6bc0);
  }

  .step-badge.completed {
    background: rgba(40, 167, 69, 0.15);
    border-color: var(--color-success);
    color: var(--color-success);
  }
</style>

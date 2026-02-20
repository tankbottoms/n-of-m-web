<script lang="ts">
  import { MotionCollector } from '$lib/entropy/motion';

  let { collector, onComplete }: {
    collector: MotionCollector;
    onComplete: () => void;
  } = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let progress = $state(0);

  $effect(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  });

  function onMove(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    collector.addSample(x, y);
    progress = collector.progress;

    if (ctx) {
      const hue = (collector.progress * 120) | 0;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (collector.isComplete) {
      onComplete();
    }
  }
</script>

<div class="entropy-wrapper">
  <canvas
    bind:this={canvas}
    width={600}
    height={200}
    class="entropy-canvas"
    onmousemove={onMove}
    ontouchmove={onMove}
  ></canvas>
  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress * 100}%"></div>
  </div>
  <span class="text-xs text-muted" style="text-align: center; display: block; margin-top: 0.25rem;">
    MOVE YOUR MOUSE OR FINGER ACROSS THE CANVAS
  </span>
</div>

<style>
  .entropy-wrapper {
    width: 100%;
  }
  .entropy-canvas {
    width: 100%;
    height: 200px;
    border: 1px solid var(--color-border-dark);
    box-shadow: 2px 2px 0px var(--color-shadow);
    cursor: crosshair;
    touch-action: none;
  }
  .progress-bar {
    height: 4px;
    background: var(--color-border);
    margin-top: 0.5rem;
  }
  .progress-fill {
    height: 100%;
    background: var(--color-success);
    transition: width 0.1s;
  }
</style>

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Call this from a user gesture (click/tap) to unlock audio on Safari/iOS.
 * Safari requires AudioContext creation + resume to happen during a user interaction.
 * After unlocking, programmatic playConfirmBeep() calls will work from callbacks.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (audioUnlocked && ctx.state === 'running') return;

    // Resume the context (required by Safari)
    ctx.resume().then(() => {
      // Play a silent buffer to fully unlock iOS audio playback
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      audioUnlocked = true;
      console.log('[Audio] Context unlocked via user gesture, state:', ctx.state);
    }).catch(err => {
      console.warn('[Audio] Failed to unlock context:', err);
    });
  } catch (e) {
    console.warn('[Audio] Error unlocking audio:', e);
  }
}

export function triggerHapticFeedback(): void {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

export function playConfirmBeep(): void {
  try {
    triggerHapticFeedback();

    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        playBeepSound(ctx);
      }).catch(() => {});
      return;
    }

    if (ctx.state === 'running') {
      playBeepSound(ctx);
    }
  } catch (e) {
    console.error('[Audio] Error in playConfirmBeep:', e);
  }
}

function playBeepSound(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    // Create master gain to control overall volume
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.7; // Louder for notification
    masterGain.connect(ctx.destination);

    // First beep (660Hz) - short and clear
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 660;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain1.gain.linearRampToValueAtTime(0, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Second beep (880Hz) - higher pitch
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 880;
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.09);
    gain2.gain.linearRampToValueAtTime(0, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.16);

    console.log('[Audio] Beep sound played');
  } catch (e) {
    console.error('[Audio] Error playing beep sound:', e);
  }
}

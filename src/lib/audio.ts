let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function triggerHapticFeedback(): void {
  // Vibration API support (iOS and Android)
  if (navigator.vibrate) {
    // Pattern: vibrate for 100ms, pause 50ms, vibrate for 100ms
    navigator.vibrate([100, 50, 100]);
    console.log('[Haptic] Vibration triggered');
  } else {
    console.log('[Haptic] Vibration not supported on this device');
  }
}

export function playConfirmBeep(): void {
  try {
    triggerHapticFeedback(); // Always try vibration first (more reliable)

    const ctx = getAudioContext();
    console.log('[Audio] Audio context state:', ctx.state, 'Sample rate:', ctx.sampleRate);

    // Handle suspended context (iOS requirement)
    if (ctx.state === 'suspended') {
      console.log('[Audio] Context suspended, attempting resume...');
      ctx.resume().then(() => {
        console.log('[Audio] Context resumed, playing beep...');
        playBeepSound(ctx);
      }).catch(err => {
        console.log('[Audio] Failed to resume context:', err);
      });
      return; // Wait for resume to complete
    }

    // If context is running, play immediately
    if (ctx.state === 'running') {
      playBeepSound(ctx);
    } else {
      console.log('[Audio] Context in unexpected state:', ctx.state);
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

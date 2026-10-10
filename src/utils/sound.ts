/**
 * Lightweight Web Audio beep helpers - no audio assets needed. Used for
 * scan-confirmation feedback across the circulation scanning flows.
 */
function playTone(frequency: number, durationMs: number, volume = 0.15): void {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    // Release the audio context shortly after so we don't leak one per scan.
    setTimeout(() => {
      ctx.close().catch(() => {
        // ignore
      });
    }, durationMs + 100);
  } catch {
    // Audio context may be restricted before a user gesture - fail silently.
  }
}

/** Single confirmation beep for a successful scan / match. */
export function playSuccessBeep(): void {
  playTone(880, 120); // A5
}

/** Short descending two-tone buzz for a rejected/failed scan. */
export function playErrorTone(): void {
  playTone(320, 90, 0.14);
  setTimeout(() => playTone(220, 140, 0.14), 100);
}

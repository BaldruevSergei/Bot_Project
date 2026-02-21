// Ultra-light effects (no mp3 needed)
export function haptic(ms = 15) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  } catch {}
}

// WebAudio beep; some browsers require first user interaction (click/tap) to allow audio.
export function beep(freq = 880, duration = 0.06, volume = 0.04) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);

    osc.onended = () => ctx.close();
  } catch {
    // ignore
  }
}

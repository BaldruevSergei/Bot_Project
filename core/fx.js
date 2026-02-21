export function haptic(ms = 10) {
  try { navigator.vibrate?.(ms); } catch {}
}

export function beep(freq = 880, dur = 0.05) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, Math.max(10, dur * 1000));
  } catch {}
}
let ctx: AudioContext | undefined;
export function playSound(capture = false) {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(capture ? 220 : 520, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      capture ? 100 : 300,
      ctx.currentTime + 0.09,
    );
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.13);
  } catch {
    /* Sound is optional. */
  }
}

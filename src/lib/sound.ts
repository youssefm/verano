// lib/sound.ts - Audio feedback using the Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// iOS WebKit (Safari and every iOS browser, e.g. Bluefy) only lets an
// AudioContext start from inside a user gesture. Our sounds are triggered by
// Bluetooth notifications, which never count as gestures, so without this the
// context stays suspended and every sound is silently dropped.
const unlockEvents = ["touchend", "click", "keydown"] as const;

function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "running") return;
    void ctx.resume();
    // Older iOS versions also need a sound started within the gesture.
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Audio unavailable – nothing to unlock
  }
}

/**
 * Unlock audio on user gestures. The listeners stay registered because iOS
 * can suspend the context again later (phone call, Siri, app backgrounded);
 * after the first unlock each gesture is a cheap state check.
 *
 * We deliberately leave the audio session type at its default. On iOS that
 * mixes with other apps' audio (the user's workout music keeps playing) but
 * is muted by silent mode. `navigator.audioSession.type = "playback"` would
 * play through silent mode, but WebKit makes it exclusive, so it would pause
 * the user's music.
 */
export function installAudioUnlock(): void {
  for (const eventName of unlockEvents) {
    document.addEventListener(eventName, unlockAudio, {
      capture: true,
      passive: true,
    });
  }
}

/**
 * Play a two-tone "ding" to signal a completed rep.
 * A quick rising chirp (C6 → E6) that sounds more satisfying than a flat beep.
 */
export function playRepSound(): void {
  try {
    const ctx = getAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state !== "running") {
      void ctx.resume();
    }

    const t = ctx.currentTime;

    // First tone – C6
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 1047;
    gain1.gain.setValueAtTime(0.25, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Second tone – E6, slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1319;
    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.25, t + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.2);
  } catch {
    // Silently ignore – audio may be blocked by browser policy
  }
}

// ---------------------------------------------------------------------------
// Workout Start sounds (played when warmup ends and working sets begin)
// ---------------------------------------------------------------------------

/** Rising three-tone fanfare: C5 → E5 → G5 */
export function playWorkoutStartFanfare(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== "running") void ctx.resume();
    const t = ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = t + i * 0.15;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  } catch {
    // Silently ignore – audio may be blocked by browser policy
  }
}

/** Gong: deep resonant hit with long decay */
export function playWorkoutCompleteGong(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== "running") void ctx.resume();
    const t = ctx.currentTime;
    // Fundamental
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 110;
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 2.0);
    // Overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 277;
    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 1.5);
    // High shimmer
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.value = 554;
    gain3.gain.setValueAtTime(0.08, t);
    gain3.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(t);
    osc3.stop(t + 1.0);
  } catch {
    // Silently ignore – audio may be blocked by browser policy
  }
}

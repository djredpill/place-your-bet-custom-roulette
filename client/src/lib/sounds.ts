/*
 * Sound Engine for Place Your Bet - Custom Roulette
 * Uses Web Audio API for realistic roulette ball sounds
 * Includes: ball spinning, ball settling, tick countdown, dealer voice, win/loss chimes
 */

const NO_MORE_BETS_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663491633720/DqUFf3ivoJ5Ydsv3tGRESy/no-more-bets_6ef6ee79.wav";

let audioCtx: AudioContext | null = null;
let dealerVoiceBuffer: AudioBuffer | null = null;
let dealerVoiceLoaded = false;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pre-load the dealer voice
async function loadDealerVoice() {
  if (dealerVoiceLoaded) return;
  try {
    const ctx = getAudioContext();
    const response = await fetch(NO_MORE_BETS_URL);
    const arrayBuffer = await response.arrayBuffer();
    dealerVoiceBuffer = await ctx.decodeAudioData(arrayBuffer);
    dealerVoiceLoaded = true;
  } catch (e) {
    console.warn("Failed to load dealer voice:", e);
  }
}

// Initialize sounds (call on first user interaction)
export function initSounds() {
  getAudioContext();
  loadDealerVoice();
}

// Play a single click/tick sound
function playClick(ctx: AudioContext, time: number, frequency: number, volume: number, duration: number = 0.02) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, time);

  filter.type = "highpass";
  filter.frequency.setValueAtTime(800, time);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + duration + 0.01);
}

// Play a metallic ball bounce sound
function playBounce(ctx: AudioContext, time: number, pitch: number, volume: number) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch, time);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + 0.08);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(pitch * 2.3, time);
  osc2.frequency.exponentialRampToValueAtTime(pitch * 0.8, time + 0.05);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.15);
  osc2.start(time);
  osc2.stop(time + 0.15);
}

// Ball spinning sound - series of clicks that slow down
export function playBallSpin(durationMs: number = 3000): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = durationMs / 1000;

  // Phase 1: Fast spinning (ball orbiting wheel)
  const totalClicks = 60;
  for (let i = 0; i < totalClicks; i++) {
    const progress = i / totalClicks;
    // Clicks slow down exponentially
    const time = now + duration * (1 - Math.pow(1 - progress, 2.5));
    const freq = 2000 + Math.random() * 1500;
    const vol = 0.03 + progress * 0.04;
    playClick(ctx, time, freq, vol, 0.008 + progress * 0.015);
  }

  // Phase 2: Ball bouncing (last 30% of duration)
  const bounceStart = now + duration * 0.7;
  const bounces = 8;
  for (let i = 0; i < bounces; i++) {
    const progress = i / bounces;
    const time = bounceStart + progress * (duration * 0.25);
    const pitch = 3000 - progress * 1500 + Math.random() * 500;
    const vol = 0.08 - progress * 0.05;
    playBounce(ctx, time, pitch, Math.max(vol, 0.01));
  }

  // Phase 3: Final settle (ball drops into pocket)
  const settleTime = now + duration * 0.95;
  playBounce(ctx, settleTime, 1200, 0.1);
  playBounce(ctx, settleTime + 0.05, 800, 0.06);
  playBounce(ctx, settleTime + 0.12, 600, 0.03);
}

// Countdown tick sound (for casino mode last 5 seconds)
export function playTick(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Sharp metallic tick
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

// Play "No more bets" dealer voice
export function playNoMoreBets(): void {
  if (!dealerVoiceBuffer) {
    loadDealerVoice();
    return;
  }
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = dealerVoiceBuffer;
  source.connect(ctx.destination);
  source.start();
}

// Win chime
export function playWinSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.12);

    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.5);
  });
}

// Loss sound
export function playLossSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(150, now + 0.3);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

// Chip place sound
export function playChipPlace(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Ceramic chip hitting felt
  const noise = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  noise.type = "triangle";
  noise.frequency.setValueAtTime(4000, now);
  noise.frequency.exponentialRampToValueAtTime(1000, now + 0.03);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2500, now);
  filter.Q.setValueAtTime(2, now);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.06);
}

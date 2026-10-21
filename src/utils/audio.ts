// Web Audio API pure utility - no external dependencies (ponytail minimal)
let audioCtx: AudioContext | null = null;

/**
 * Lazily initialize or retrieve AudioContext singleton.
 * Safely handles browser autoplay policies by resuming suspended contexts.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignored if user hasn't interacted yet
    });
  }

  return audioCtx;
}

/**
 * Phát tiếng bíp êm dịu, không chói tai bằng sóng hình sin và đường bao âm lượng (gain envelope).
 * @param frequency Tần số (Hz)
 * @param durationMs Thời lượng phát (mili-giây, mặc định 120ms)
 * @param volume Âm lượng (0.0 đến 1.0, mặc định 0.12 êm dịu)
 */
export function playTone(
  frequency: number,
  durationMs: number = 120,
  volume: number = 0.12
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(Math.max(40, frequency), ctx.currentTime);

    const now = ctx.currentTime;
    const durationSec = Math.max(0.04, durationMs / 1000);

    // Envelope: quick attack to prevent clicks, smooth exponential decay
    const safeVolume = Math.min(1, Math.max(0.001, volume));
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(safeVolume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    // Gracefully ignore audio failure if blocked by browser policy
  }
}

/**
 * Ánh xạ giá trị phần tử mảng sang tần số âm thanh từ 240Hz đến 880Hz.
 * @param value Giá trị của phần tử
 * @param minVal Giá trị nhỏ nhất trong mảng
 * @param maxVal Giá trị lớn nhất trong mảng
 */
export function playValueTone(
  value: number,
  minVal: number = 0,
  maxVal: number = 100
): void {
  const safeRange = maxVal === minVal ? 1 : maxVal - minVal;
  const normalized = Math.max(0, Math.min(1, (value - minVal) / safeRange));
  // Ánh xạ tuyến tính sang dải âm nhạc từ 240Hz (gần C4) đến 880Hz (A5)
  const frequency = Math.round(240 + normalized * (880 - 240));
  playTone(frequency, 120, 0.1);
}

export const WIDTH = 960;
export const HEIGHT = 640;
export const SETTINGS_KEY = "training99-web-settings-v1";
export const BEST_KEY = "training99-web-best-v1";

export const DIFFICULTIES = {
  easy: { label: "校準", spawn: 0.86, speed: 0.78, turn: 0.18, maxBullets: 52, warmup: 2.6 },
  normal: { label: "標準", spawn: 0.57, speed: 1, turn: 0.34, maxBullets: 86, warmup: 1.8 },
  hard: { label: "高壓", spawn: 0.39, speed: 1.22, turn: 0.56, maxBullets: 118, warmup: 1.2 },
  extreme: { label: "極限", spawn: 0.29, speed: 1.48, turn: 0.8, maxBullets: 160, warmup: 0.75 },
};

export const DEFAULT_SETTINGS = { difficulty: "normal", lives: 1, controlMode: "direct", sound: true };

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...saved, lives: Number(saved.lives || DEFAULT_SETTINGS.lives) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* local file mode may deny storage */ }
}

export function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch { return null; }
}

export function saveBest(best) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch { /* optional persistence */ }
}

export function clamp(value, low, high) { return Math.min(high, Math.max(low, value)); }

export function formatTime(milliseconds) { return (milliseconds / 1000).toFixed(3).padStart(6, "0"); }

export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

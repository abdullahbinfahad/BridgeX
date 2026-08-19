export type BridgeXFeedback = "tap" | "notice" | "success" | "warning" | "error";

const feedbackPatterns: Record<BridgeXFeedback, number[]> = { tap: [440], notice: [587, 659], success: [523, 659, 784], warning: [440, 392], error: [277, 220] };

export function playBridgeXFeedback(kind: BridgeXFeedback = "tap") {
  try {
    const bridge = (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView;
    if (bridge) bridge.postMessage(JSON.stringify({ type: "BRIDGEX_FEEDBACK", kind }));
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    feedbackPatterns[kind].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.075;
      oscillator.type = kind === "error" || kind === "warning" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(kind === "tap" ? 0.025 : 0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.08);
    });
    window.setTimeout(() => void context.close(), 500);
  } catch {
    // Feedback is progressive enhancement and must never interrupt a marketplace action.
  }
}

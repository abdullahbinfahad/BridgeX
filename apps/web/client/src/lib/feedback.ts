export type BridgeXFeedback = "tap" | "notice" | "success" | "warning" | "error";

const feedbackFrequencies: Record<BridgeXFeedback, number> = { tap: 440, notice: 587, success: 740, warning: 392, error: 220 };

export function playBridgeXFeedback(kind: BridgeXFeedback = "tap") {
  try {
    const bridge = (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView;
    if (bridge) bridge.postMessage(JSON.stringify({ type: "BRIDGEX_FEEDBACK", kind }));
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === "error" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(feedbackFrequencies[kind], context.currentTime);
    gain.gain.setValueAtTime(kind === "tap" ? 0.025 : 0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (kind === "success" ? 0.13 : 0.09));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === "success" ? 0.14 : 0.1));
    window.setTimeout(() => void context.close(), 200);
  } catch {
    // Feedback is progressive enhancement and must never interrupt a marketplace action.
  }
}

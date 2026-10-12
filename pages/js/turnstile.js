export function turnstileToken() {
  return window.turnstile?.getResponse?.() || "";
}

export function resetTurnstile() {
  window.turnstile?.reset?.();
}

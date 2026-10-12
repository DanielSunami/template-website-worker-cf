import { resetTurnstile, turnstileToken } from "./turnstile.js";

const loginStatus = document.getElementById("login-status");

{
  const res = await fetch("/api/caixa/mensagens?page=1", { credentials: "same-origin" });
  if (res.ok) {
    window.location.replace("/caixa/mensagens/");
  }
}

document.getElementById("form-login").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.className = "status";
  loginStatus.textContent = "Entrando…";
  const password = new FormData(event.target).get("password");
  try {
    const res = await fetch("/api/caixa/sessao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password, turnstileToken: turnstileToken() }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      resetTurnstile();
      loginStatus.className = "status bad";
      loginStatus.textContent = json.erro || "Não entrou.";
      return;
    }
    window.location.href = "/caixa/mensagens/";
  } catch {
    resetTurnstile();
    loginStatus.className = "status bad";
    loginStatus.textContent = "Falha de rede.";
  }
});

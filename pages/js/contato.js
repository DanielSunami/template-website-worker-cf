import { resetTurnstile, turnstileToken } from "./turnstile.js";

const form = document.getElementById("form-contato");
const statusEl = document.getElementById("form-status");
const okEl = document.getElementById("form-ok");
const btn = form.querySelector(".btn-enviar") || form.querySelector("[type=submit]");
const phoneInput = form.querySelector('input[name="phone"]');

if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    phoneInput.value = maskPhone(phoneInput.value);
  });
}

function maskPhone(value) {
  const d = String(value).replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function setLoading(on) {
  if (btn) btn.disabled = on;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(true);
  statusEl.className = "status";
  statusEl.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    body: data.body,
    website: data.website,
    turnstileToken: turnstileToken(),
  };

  try {
    const res = await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      resetTurnstile();
      setLoading(false);
      statusEl.className = "status bad";
      statusEl.textContent = json.erro || "Não deu para enviar. Tente de novo.";
      return;
    }
    form.hidden = true;
    if (okEl) okEl.hidden = false;
  } catch {
    resetTurnstile();
    setLoading(false);
    statusEl.className = "status bad";
    statusEl.textContent = "Falha de rede. Tente de novo.";
  }
});

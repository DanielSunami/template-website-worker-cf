import { clip, clientIp, json } from "./http.js";
import { requireTurnstile, tooMany } from "./security.js";

export async function postContato(request, env) {
  const ip = clientIp(request);
  if (await tooMany(env, `contato:${ip}`)) {
    return json({ ok: false, erro: "muitas tentativas, espere um pouco" }, 429);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, erro: "pedido inválido" }, 400);
  }

  if (typeof data.website === "string" && data.website.trim() !== "") {
    return json({ ok: true });
  }

  const blocked = await requireTurnstile(env, data.turnstileToken, ip);
  if (blocked) return blocked;

  const name = clip(data.name, 120);
  const email = clip(data.email, 160).toLowerCase();
  const phone = clip(data.phone, 40);
  const subject = clip(data.subject, 80);
  const body = clip(data.body, 4000);

  if (!name || !looksEmail(email) || !body) {
    return json({ ok: false, erro: "nome, e-mail e mensagem são obrigatórios" }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO messages (name, email, phone, subject, body, ip)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(name, email, phone, subject, body, ip)
    .run();

  return json({ ok: true });
}

function looksEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

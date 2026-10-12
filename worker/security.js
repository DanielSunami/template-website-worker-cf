import { json } from "./http.js";

const RATE_WINDOW_SEC = 10 * 60;
const RATE_MAX = 8;

export async function tooMany(env, bucket) {
  const window = Math.floor(Date.now() / 1000 / RATE_WINDOW_SEC);
  const key = `${bucket}:${window}`;
  try {
    const row = await env.DB.prepare(`SELECT count FROM rate_limit WHERE key = ?`)
      .bind(key)
      .first();
    const count = row ? Number(row.count) : 0;
    if (count >= RATE_MAX) return true;
    await env.DB.prepare(
      `INSERT INTO rate_limit (key, count) VALUES (?, 1)
       ON CONFLICT(key) DO UPDATE SET count = count + 1`
    )
      .bind(key)
      .run();
  } catch {
    return false;
  }
  return false;
}

export async function requireTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) {
    return json({ ok: false, erro: "turnstile não configurado" }, 503);
  }
  const ok = await verifyTurnstile(env.TURNSTILE_SECRET, String(token || ""), ip);
  if (!ok) return json({ ok: false, erro: "verificação de humano falhou" }, 403);
  return null;
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => null);
  return Boolean(data && data.success);
}

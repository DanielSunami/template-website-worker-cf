/**
 * Senha em claro no secret INBOX_PASSWORD (dashboard da Cloudflare).
 * Cookie de sessão: HMAC com essa senha. Trocar o secret derruba as sessões.
 * Login: rate limit + Turnstile + comparação da senha.
 */
import { clientIp, hmacHex, json, readCookie, timingSafeEqualBytes } from "./http.js";
import { requireTurnstile, tooMany } from "./security.js";

export const COOKIE = "caixa";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

export async function postSessao(request, env) {
  const stored = env.INBOX_PASSWORD;
  if (!stored) return json({ ok: false, erro: "caixa sem senha configurada" }, 500);

  const ip = clientIp(request);
  if (await tooMany(env, `login:${ip}`)) {
    return json({ ok: false, erro: "muitas tentativas, espere um pouco" }, 429);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, erro: "pedido inválido" }, 400);
  }

  const blocked = await requireTurnstile(env, data.turnstileToken, ip);
  if (blocked) return blocked;

  const given = String(data.password || "");
  if (!(await sameSecret(given, stored))) {
    return json({ ok: false, erro: "senha incorreta" }, 401);
  }

  const token = await signSession(stored);
  return json({ ok: true }, 200, { "Set-Cookie": setCookie(token) });
}

export function postSair() {
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
}

export async function hasSession(request, env) {
  const stored = env.INBOX_PASSWORD;
  if (!stored) return false;
  const cookie = readCookie(request, COOKIE);
  if (!cookie) return false;
  return verifySession(stored, cookie);
}

export async function requireSession(request, env) {
  if (await hasSession(request, env)) return null;
  return json({ ok: false, erro: "não autorizado" }, 401);
}

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode("caixa-compare"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const ha = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(a))));
  const hb = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(b))));
  return timingSafeEqualBytes(ha, hb);
}

async function signSession(password) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = `v2.${exp}`;
  const sig = await hmacHex(password, payload);
  return `${payload}.${sig}`;
}

async function verifySession(password, cookie) {
  const parts = String(cookie).split(".");
  if (parts.length !== 3 || parts[0] !== "v2") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const payload = `v2.${parts[1]}`;
  const expected = await hmacHex(password, payload);
  if (parts[2].length !== expected.length) return false;
  const enc = new TextEncoder();
  return timingSafeEqualBytes(enc.encode(parts[2]), enc.encode(expected));
}

function setCookie(value) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SEC}`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

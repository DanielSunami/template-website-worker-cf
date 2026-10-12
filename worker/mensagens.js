import { json } from "./http.js";
import { requireSession } from "./auth.js";

const PER_PAGE = 10;

export async function getMensagens(request, env) {
  const denied = await requireSession(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const perPage = PER_PAGE;

  const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM messages`).first();
  const total = Number(totalRow?.n || 0);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageClamped = Math.min(page, pages);

  const { results } = await env.DB.prepare(
    `SELECT id, created_at, name, email, phone, subject, body, read_at
     FROM messages
     ORDER BY id DESC
     LIMIT ? OFFSET ?`
  )
    .bind(perPage, (pageClamped - 1) * perPage)
    .all();

  const mensagens = results || [];

  return json({
    ok: true,
    mensagens,
    page: pageClamped,
    per_page: perPage,
    total,
    pages,
  });
}

export async function postLida(request, env) {
  const denied = await requireSession(request, env);
  if (denied) return denied;

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, erro: "pedido inválido" }, 400);
  }
  const id = Number(data.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ ok: false, erro: "id inválido" }, 400);
  }
  await env.DB.prepare(
    `UPDATE messages SET read_at = datetime('now') WHERE id = ? AND read_at IS NULL`
  )
    .bind(id)
    .run();
  return json({ ok: true });
}

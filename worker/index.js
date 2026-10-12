/**
 * Worker do site: Hono roteia /api/*.
 * HTML estático o Wrangler entrega direto (run_worker_first só em /api/*).
 *
 * Secrets: INBOX_PASSWORD (texto, dashboard da CF), TURNSTILE_SECRET
 */
import { Hono } from "hono";
import { json } from "./http.js";
import { postSair, postSessao } from "./auth.js";
import { postContato } from "./contato.js";
import { getMensagens, postLida } from "./mensagens.js";

const app = new Hono();

app.post("/api/contato", (c) => postContato(c.req.raw, c.env));
app.post("/api/caixa/sessao", (c) => postSessao(c.req.raw, c.env));
app.post("/api/caixa/sair", () => postSair());
app.get("/api/caixa/mensagens", (c) => getMensagens(c.req.raw, c.env));
app.post("/api/caixa/lida", (c) => postLida(c.req.raw, c.env));

app.all("/api/*", () => json({ ok: false, erro: "não encontrado" }, 404));

app.onError(() => json({ ok: false, erro: "falha interna" }, 500));

export default app;

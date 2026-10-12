# AGENTS.md

Kit for an institutional site on Cloudflare (HTML in `pages/`, API in `worker/`).
Work **in this directory**.

There are two clocks:

| When | What to run |
|---|---|
| First time on this site | `sh setup.sh` **once** |
| Any update after that | `npx wrangler deploy` |

Signs that setup **already ran**: `turnstile.json` and `senha-mensagens-formulario-contato.txt` exist, or `d1_databases` in `wrangler.jsonc` already has a `database_id`. If any of that is true, **do not** run `setup.sh` again.

---

## 1. Collect

Ask the user, or tell them to fill in the top of `setup.sh`:

1. `CLOUDFLARE_API_TOKEN`
2. `CLOUDFLARE_ACCOUNT_ID`
3. `DOMAIN` — hostname only, no `https://` (e.g. `your-site.com`)
4. Worker name — **optional**. If the user does not give one, fill `name` in wrangler.jsonc with `$DOMAIN-worker`, dots turned into hyphens (`your-site.com` → `your-site-com-worker`). Cloudflare only allows `[a-z0-9-]`.

Do not echo the token back into the chat, into HTML, or into git.

## 2. Fill and check

`setup.sh` (the 3):

```
CLOUDFLARE_API_TOKEN="..."
CLOUDFLARE_ACCOUNT_ID="..."
DOMAIN="your-site.com"
```

`wrangler.jsonc` (the 2):

- `name` → Worker name
- `routes[0].pattern` → the same hostname as `DOMAIN`

All five must be non-empty **before** you continue. Open both files and check. If one is missing: stop and ask.

## 3. Setup (once)

```
sh setup.sh
```

It creates the D1, the Turnstile widget, does the first deploy, then generates and stores the inbox password in the `INBOX_PASSWORD` secret. That password lives in the Cloudflare dashboard: Worker → Settings → Variables and Secrets → `INBOX_PASSWORD`.

## 4. After setup

Two local files with secrets (do not commit):

| File | What it holds |
|---|---|
| `turnstile.json` | `sitekey` (public, goes in the HTML) and `secret` (Worker) |
| `senha-mensagens-formulario-contato.txt` | password for `/caixa/` |

**Turnstile in the HTML** — required after setup, even if the pages already existed. Copy the `sitekey` from `turnstile.json` into every `data-sitekey` (contact and login). Then:

```
npx wrangler deploy
```

## 5. Worker, pages, and what you may change

Wrangler serves static HTML from `pages/`. The Worker (Hono in `worker/`) only runs on `/api/*` (`run_worker_first`). Same origin: `fetch("/api/...")` in the browser, no CORS.

Look, copy, and the page tree belong to the user. The HTML in `pages/` is a **sketch**: ids, `name`s, and the Turnstile widget are there so the JS and the Worker can talk. Redesign freely; if you change ids, fields, or the JS, change both together.

`pages/` can be written **before or after** setup. Once `turnstile.json` exists, each form needs `data-sitekey` filled before deploy.

### Endpoints (`worker/index.js`)

| Method | Path | Who calls it | What it does |
|---|---|---|---|
| `POST` | `/api/contato` | `pages/js/contato.js` | Stores a message in D1. Turnstile required. Honeypot: if `website` is filled, responds `{ok:true}` and does not store. Fields the Worker persists: `name`, `email`, `phone`, `subject`, `body`. |
| `POST` | `/api/caixa/sessao` | `pages/js/login.js` | Checks the password against the `INBOX_PASSWORD` secret, Turnstile, `caixa` cookie (7 days). |
| `POST` | `/api/caixa/sair` | `pages/js/mensagens.js` | Clears the cookie. |
| `GET` | `/api/caixa/mensagens?page=` | `login.js` (session check) and `mensagens.js` | Paginated list (10). No valid cookie → 401. |
| `POST` | `/api/caixa/lida` | `mensagens.js` | `{id}` → mark as read. Needs the session. |

Error JSON: `{ok:false, erro:"..."}`. Rate limit (D1): 8 tries / 10 min per IP on contact and login.

Worker secrets: `INBOX_PASSWORD`, `TURNSTILE_SECRET` (setup stores the latter; the `sitekey` is HTML-only).

### Pages that talk to the Worker

| URL | File | JS | JS contract |
|---|---|---|---|
| `/` | `pages/index.html` | `/js/contato.js` | `#form-contato`, `#form-status`, `#form-ok`. Submit button (`.btn-enviar` optional). `phone` and honeypot `website` optional. Turnstile widget + `challenges.cloudflare.com` script. Form `name` fields match the payload. |
| `/caixa/` | `pages/caixa/index.html` | `/js/login.js` | `#form-login`, `password`, `#login-status`, Turnstile. If a session already exists, redirects to `/caixa/mensagens/`. |
| `/caixa/mensagens/` | `pages/caixa/mensagens/index.html` | `/js/mensagens.js` | `#lista`, `#app-status`, `#pager`, `#pager-info`, `#btn-prev`, `#btn-next`, `#btn-sair`. |

Turnstile in HTML: `class="cf-turnstile"` and `data-sitekey="..."` (sitekey from `turnstile.json`). The class is what Cloudflare’s script uses to render the widget. Helper: `pages/js/turnstile.js`.

### Static-only pages

| URL | File | Note |
|---|---|---|
| any 404 | `pages/404.html` | `not_found_handling` in wrangler. |
| `/politica-de-privacidade/` | empty folder | Create `index.html` if the user wants it. |
| `/termos-de-uso/` | empty folder | Same. |

CSS in `pages/css/` (empty in the template). Other static pages: add files under `pages/` and deploy.

## 6. Updating the site

Just this:

```
npx wrangler deploy
```

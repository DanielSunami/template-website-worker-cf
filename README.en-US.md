# Static site with a contact form

[Português](README.md)

Clone this repository to get a **simple static page**: a contact form and a **password-protected** inbox to read the messages.

Hosting is **free** on [Cloudflare](https://www.cloudflare.com/): a Worker (HTML + API) and a [D1](https://developers.cloudflare.com/d1/) database (SQLite). Use **your own domain** or the `*.workers.dev` hostname Cloudflare gives you.

MIT. No signup with this kit — the account is yours, on Cloudflare.

**Live demos:** [demonstracao.akafrx.com](https://demonstracao.akafrx.com) · [meu-site.akafrx.com](https://meu-site.akafrx.com)

## What goes live

| URL | What |
|---|---|
| `/` | Site + form |
| `/caixa/` | Inbox login |
| `/caixa/mensagens/` | Message list (needs the password) |

The HTML in `pages/` is a working sketch, no product CSS. Change copy, layout, and pages as you like.

## You need

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (the free plan is enough)
- [Node.js](https://nodejs.org/) (for `npm` / Wrangler)
- An API token for the account + the Account ID
- A hostname: your domain (DNS on Cloudflare) **or** a `*.workers.dev` URL

Point your coding agent/assistant at [AGENTS.md](AGENTS.md) in this repository to continue development and deploy.

## License

[MIT](LICENSE)

# Site estático com formulário de contato

[English](README.en-US.md)

Clone este repositório para ter uma **página estática simples**: um formulário de contato e uma área **protegida com senha** para ler as mensagens.

A infraestrutura é **gratuita** na [Cloudflare](https://www.cloudflare.com/): um Worker (HTML + API) e um banco [D1](https://developers.cloudflare.com/d1/) (SQLite). Você usa o **domínio que já tem** ou o endereço `*.workers.dev` que a Cloudflare oferece.

MIT. Sem cadastro neste kit — a conta é a sua, na Cloudflare.

## O que vem no ar

| URL | O quê |
|---|---|
| `/` | Site + formulário |
| `/caixa/` | Login da caixa de mensagens |
| `/caixa/mensagens/` | Lista das mensagens (precisa da senha) |

O visual em `pages/` é um esboço funcional, sem CSS de produto. Troque textos, layout e páginas à vontade.

## Você precisa

- Uma [conta Cloudflare](https://dash.cloudflare.com/sign-up) (plano gratuito serve)
- [Node.js](https://nodejs.org/) (para o `npm` / Wrangler)
- Token de API da conta + Account ID
- Um hostname: seu domínio (DNS na Cloudflare) **ou** um `*.workers.dev`

Aponte seu coding agent/assistant para o [AGENTS.md](AGENTS.md) neste repositório para prosseguir com o desenvolvimento e o deploy.

## Licença

[MIT](LICENSE)

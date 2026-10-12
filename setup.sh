#!/bin/sh
# wrangler secret put só funciona depois do primeiro deploy (o Worker precisa existir).
# A senha fica no painel da CF (Worker → Settings → Variables and Secrets → INBOX_PASSWORD).
# O cliente troca sozinho se esquecer. Turnstile é 100% automático.
# Rode deste diretório: sh setup.sh
# Preencha o "name" no wrangler.jsonc antes.

set -eu

# Preencha:
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ACCOUNT_ID=""
DOMAIN=""

if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$DOMAIN" ]; then
  echo "Preencha as três variáveis no início deste script:"
  echo "  CLOUDFLARE_API_TOKEN  — token da API Cloudflare"
  echo "  CLOUDFLARE_ACCOUNT_ID — id da conta"
  echo "  DOMAIN                — hostname do site (ex.: cliente.com.br)"
  exit 1
fi

export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID

WORKER_NAME=$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' wrangler.jsonc | head -n 1)
if [ -z "$WORKER_NAME" ]; then
  echo "Preencha \"name\" no wrangler.jsonc (nome do Worker)."
  exit 1
fi

etapa() {
  echo
  echo "########################################"
  echo "# $1"
  echo "########################################"
  echo
}

if [ ! -d node_modules/hono ] || [ ! -d node_modules/wrangler ]; then
  etapa "npm install"
  npm install
fi

etapa "1/5  D1 — criar contact-messages"
npx wrangler d1 create contact-messages --binding DB

etapa "2/5  D1 — aplicar init-d1.sql"
npx wrangler d1 execute contact-messages --remote --yes --file init-d1.sql

etapa "3/5  Turnstile — widget non-interactive"
npx wrangler turnstile widget create $WORKER_NAME --mode non-interactive --domain $DOMAIN --json > turnstile.json

etapa "4/5  Deploy do Worker"
npx wrangler deploy

etapa "5/5  Senha da caixa + secret INBOX_PASSWORD"
INBOX_PASSWORD=$(npx password-generator -l 6 -i)
printf '%s\n' "$INBOX_PASSWORD" > senha-mensagens-formulario-contato.txt
echo "Senha da caixa (também em senha-mensagens-formulario-contato.txt, para a entrega): $INBOX_PASSWORD"
echo "O cliente troca depois no painel: Worker → Settings → Variables and Secrets → INBOX_PASSWORD"
printf '%s' "$INBOX_PASSWORD" | npx wrangler secret put INBOX_PASSWORD

echo
echo "########################################"
echo "# setup ok"
echo "########################################"
echo "https://$DOMAIN"
echo "Senha:  $INBOX_PASSWORD"

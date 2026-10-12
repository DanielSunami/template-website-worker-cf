const lista = document.getElementById("lista");
const appStatus = document.getElementById("app-status");
const pager = document.getElementById("pager");
const pagerInfo = document.getElementById("pager-info");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");

let page = pageFromUrl();

document.getElementById("btn-sair").addEventListener("click", async () => {
  await fetch("/api/caixa/sair", { method: "POST", credentials: "same-origin" });
  window.location.href = "/caixa/";
});

btnPrev.addEventListener("click", () => load(page - 1));
btnNext.addEventListener("click", () => load(page + 1));

async function load(nextPage) {
  appStatus.textContent = "Carregando…";
  const res = await fetch(`/api/caixa/mensagens?page=${nextPage}`, {
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "/caixa/";
    return;
  }
  const json = await res.json().catch(() => ({}));
  const mensagens = json.mensagens || [];
  page = json.page || 1;
  const pages = json.pages || 1;
  const total = json.total || 0;
  history.replaceState(null, "", `?page=${page}`);

  appStatus.textContent = total
    ? `${total} mensagem(ns)`
    : "Nenhuma mensagem ainda.";
  lista.innerHTML = "";
  for (const msg of mensagens) {
    lista.appendChild(renderMsg(msg));
  }

  pager.hidden = total === 0;
  pagerInfo.textContent = `página ${page} de ${pages}`;
  btnPrev.disabled = page <= 1;
  btnNext.disabled = page >= pages;
}

function renderMsg(msg) {
  const el = document.createElement("article");
  el.className = "msg" + (msg.read_at ? " read" : "");
  const quando = formatWhen(msg.created_at);
  el.innerHTML = `
    <header>
      <strong>${escapeHtml(msg.name || "sem nome")}</strong>
      <span class="meta">${escapeHtml(quando)}</span>
    </header>
    <div class="meta">
      ${escapeHtml(msg.subject || "")}
      ${msg.email ? " · " + escapeHtml(msg.email) : ""}
      ${msg.phone ? " · " + escapeHtml(msg.phone) : ""}
    </div>
    <p>${escapeHtml(msg.body || "")}</p>
  `;
  if (!msg.read_at) {
    const btn = document.createElement("button");
    btn.className = "btn ghost";
    btn.type = "button";
    btn.textContent = "Marcar como lida";
    btn.addEventListener("click", async () => {
      await fetch("/api/caixa/lida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: msg.id }),
      });
      await load(page);
    });
    el.appendChild(btn);
  }
  return el;
}

function pageFromUrl() {
  const n = parseInt(new URLSearchParams(location.search).get("page") || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso + (iso.includes("Z") || iso.includes("+") ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

load(page).catch(() => {
  window.location.href = "/caixa/";
});

// ============================================================================
// Patrimony Control — Widget para iPhone (app Scriptable)
// ============================================================================
//
// COMO USAR:
// 1. Crie um GitHub Gist SECRET com um arquivo chamado "patrimonio.json"
//    (conteúdo inicial pode ser: {}). Anote o ID do gist (o trecho final da
//    URL: https://gist.github.com/SEU_USUARIO/<ESTE_ID>).
// 2. No app Patrimony Control (Ajustes), cole o ID do gist e um token do
//    GitHub com permissão de Gists, e ative a sincronização. Toque em
//    "Sincronizar agora" uma vez para gravar o JSON.
// 3. Instale o app "Scriptable" na App Store. Crie um novo script, cole TODO
//    este arquivo e ajuste GIST_ID abaixo.
// 4. Na tela inicial, adicione um widget do Scriptable e, em "Script",
//    selecione este. Pronto.
//
// Observação: para gist secret, a leitura via API funciona sem token.
// Se preferir, dá para usar um token de leitura em GITHUB_TOKEN.
// ============================================================================

const GIST_ID = "COLE_AQUI_O_ID_DO_GIST";
const FILENAME = "patrimonio.json";
const GITHUB_TOKEN = ""; // opcional (somente leitura)

// ---- Cores (tema claro, estilo do app) ----
const COLORS = {
  bg: new Color("#ffffff"),
  label: new Color("#434656"),
  value: new Color("#131b2e"),
  positive: new Color("#006d41"),
  negative: new Color("#ba1a1a"),
  muted: new Color("#737688"),
};

async function fetchSummary() {
  const req = new Request(`https://api.github.com/gists/${GIST_ID}`);
  req.headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
  const data = await req.loadJSON();
  const file = data.files && data.files[FILENAME];
  if (!file || !file.content) throw new Error("Arquivo não encontrado no gist");
  return JSON.parse(file.content);
}

// Formata número no padrão pt (1.234.567,89) com símbolo da moeda.
function formatKz(n) {
  const fixed = Math.abs(n).toFixed(2);
  const [intPart, dec] = fixed.split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = n < 0 ? "-" : "";
  return `${sign}Kz ${withDots},${dec}`;
}

function formatPct(p) {
  if (p === null || p === undefined) return "—";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1).replace(".", ",")}%`;
}

function colorFor(p) {
  if (p === null || p === undefined) return COLORS.muted;
  if (p > 0) return COLORS.positive;
  if (p < 0) return COLORS.negative;
  return COLORS.muted;
}

function addVariationRow(stack, label, pct) {
  const row = stack.addStack();
  row.layoutHorizontally();
  const l = row.addText(label);
  l.font = Font.mediumSystemFont(11);
  l.textColor = COLORS.muted;
  row.addSpacer();
  const arrow = pct > 0 ? "▲ " : pct < 0 ? "▼ " : "";
  const v = row.addText(`${arrow}${formatPct(pct)}`);
  v.font = Font.semiboldSystemFont(11);
  v.textColor = colorFor(pct);
}

async function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = COLORS.bg;
  w.setPadding(16, 16, 16, 16);

  try {
    const s = await fetchSummary();

    const title = w.addText("PATRIMÔNIO TOTAL");
    title.font = Font.semiboldSystemFont(10);
    title.textColor = COLORS.label;

    w.addSpacer(6);

    const total = w.addText(formatKz(s.totalKz ?? 0));
    total.font = Font.boldSystemFont(24);
    total.textColor = COLORS.value;
    total.minimumScaleFactor = 0.5;

    w.addSpacer(8);
    addVariationRow(w, "Semana", s.weeklyPct);
    w.addSpacer(2);
    addVariationRow(w, "Mês", s.monthlyPct);

    w.addSpacer();

    if (s.updatedAt) {
      const d = new Date(s.updatedAt);
      const df = new DateFormatter();
      df.dateFormat = "dd/MM HH:mm";
      const upd = w.addText(`atualizado ${df.string(d)}`);
      upd.font = Font.systemFont(8);
      upd.textColor = COLORS.muted;
    }
  } catch (e) {
    const err = w.addText("Sem dados");
    err.font = Font.semiboldSystemFont(14);
    err.textColor = COLORS.value;
    const hint = w.addText(String(e.message || e));
    hint.font = Font.systemFont(9);
    hint.textColor = COLORS.muted;
  }

  return w;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}
Script.complete();

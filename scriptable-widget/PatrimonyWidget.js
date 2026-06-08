// ============================================================================
// Patrimony Control — Widget para iPhone (app Scriptable)
// ============================================================================
//
// COMO USAR:
// 1. Crie um GitHub Gist SECRET com um arquivo chamado "patrimonio.json".
// 2. No app Patrimony Control (Ajustes), cole o ID do gist e um token do
//    GitHub com permissão de Gists, ative a sincronização e toque em
//    "Sincronizar agora".
// 3. No app "Scriptable", crie um novo script, cole TODO este arquivo e
//    ajuste GIST_ID abaixo.
// 4. Adicione o widget na TELA INICIAL (home) para o fundo branco aparecer.
// ============================================================================

const GIST_ID = "48c3efbc774510c6978dd7a1a825d99d";
const FILENAME = "patrimonio.json";
const GITHUB_TOKEN = ""; // opcional (somente leitura)

// ---- Cores (tema claro, estilo do app) ----
const COLORS = {
  bg: new Color("#ffffff"),
  label: new Color("#434656"),
  value: new Color("#131b2e"),
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

// Formata número no padrão pt (1.234.567,89) com símbolo.
function formatMoney(n, symbol) {
  const fixed = Math.abs(n).toFixed(2);
  const [intPart, dec] = fixed.split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = n < 0 ? "-" : "";
  return `${sign}${symbol} ${withDots},${dec}`;
}

function addCurrencyRow(stack, value, symbol, primary) {
  const t = stack.addText(formatMoney(value, symbol));
  t.font = primary ? Font.boldSystemFont(22) : Font.semiboldSystemFont(14);
  t.textColor = primary ? COLORS.value : COLORS.muted;
  t.minimumScaleFactor = 0.5;
  t.lineLimit = 1;
}

async function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = COLORS.bg;
  w.setPadding(16, 16, 16, 16);

  try {
    const s = await fetchSummary();
    const totalKz = s.totalKz ?? 0;
    const brl = s.rates && s.rates.BRL ? s.rates.BRL : null;
    const eur = s.rates && s.rates.EUR ? s.rates.EUR : null;

    const title = w.addText("PATRIMÔNIO TOTAL");
    title.font = Font.semiboldSystemFont(10);
    title.textColor = COLORS.label;

    w.addSpacer(8);

    // Kwanza (moeda base) em destaque.
    addCurrencyRow(w, totalKz, "Kz", true);

    w.addSpacer(6);

    // Real e Euro convertidos (Kz / taxa).
    if (brl) addCurrencyRow(w, totalKz / brl, "R$", false);
    if (eur) {
      w.addSpacer(2);
      addCurrencyRow(w, totalKz / eur, "€", false);
    }

    w.addSpacer();
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

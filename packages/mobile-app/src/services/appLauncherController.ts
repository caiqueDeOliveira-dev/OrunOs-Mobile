import * as Linking from "expo-linking";

const APP_DEEP_LINKS: Record<string, string> = {
  whatsapp:       "whatsapp://",
  youtube:        "vnd.youtube://",
  instagram:      "instagram://",
  telegram:       "telegram://",
  maps:           "comgooglemaps://",
  "google maps":   "comgooglemaps://",
  waze:           "waze://",
  chrome:         "googlechrome://",
  twitter:        "twitter://",
  x:              "twitter://",
  gmail:          "googlegmail://",
  camera:         "camera://",
  galeria:        "content://media/internal/images/media",
  relógio:        "clock://",
  alarme:         "clock://",
  calculadora:    "calc://",
  calendário:     "calshow://",
  netflix:        "nflx://",
  uber:           "uber://",
  ifood:          "ifood://",
  mercadolivre:   "mercadolivre://",
  nubank:         "nubank://",
  picpay:         "picpay://",
  mercado_pago:   "mercadopago://",
  banco_do_brasil:"bb://",
  itaú:           "itau://",
  bradesco:       "bradesco://",
  pix:            "pix://",
};

const OPEN_RE =
  /^(?:abra|abre|abrir|inicie|inicia|inicie|liga|ligue|ligar|mostra|mostre|mostrar|abra o|abre o|abrir o|abre a|abra a|abrir a)\s+/i;

const ARTICLE_RE = /^(?:o|a|os|as|um|uma|uns|umas)\s+/i;

export function appLauncherHandler(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[.,!?;:]/g, "").trim();

  const verbMatch = normalized.match(OPEN_RE);
  if (!verbMatch) return null;

  let rest = normalized.slice(verbMatch[0].length).trim();
  rest = rest.replace(ARTICLE_RE, "").trim();

  if (!rest) return null;

  // 1. Exact match
  for (const [name, url] of Object.entries(APP_DEEP_LINKS)) {
    if (rest === name) {
      Linking.openURL(url).catch(() => {});
      return `Abrindo ${name}.`;
    }
  }

  // 2. Partial match — prefer longest key to avoid "x" matching "netflix"
  let bestName: string | null = null;
  let bestLen = 0;
  for (const [name, url] of Object.entries(APP_DEEP_LINKS)) {
    if (rest.includes(name) && name.length > bestLen) {
      bestName = name;
      bestLen = name.length;
    }
  }
  if (bestName) {
    Linking.openURL(APP_DEEP_LINKS[bestName]).catch(() => {});
    return `Abrindo ${bestName}.`;
  }

  return null;
}

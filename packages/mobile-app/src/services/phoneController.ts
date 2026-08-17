import * as Linking from "expo-linking";

export function phoneHandler(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[.,!?;:]/g, "").trim();

  const callMatch = normalized.match(
    /(?:liga|ligue|ligar|chama|chame|chamar|disca|discar)\s+(?:pro|pra|para o|para a)\s+(.+)/i
  );
  if (callMatch) {
    const contact = callMatch[1].trim();
    Linking.openURL("tel:").catch(() => {});
    return `Abrindo discador para ${contact}. Digite o número na tela.`;
  }

  const smsMatch = normalized.match(
    /(?:manda|envia|enviar)\s+(?:sms\s+|mensagem\s+)?(?:pro|pra|para o|para a)\s+(.+)/i
  );
  if (smsMatch) {
    const contact = smsMatch[1].trim();
    Linking.openURL("sms:").catch(() => {});
    return `Abrindo mensagens para ${contact}. Digite o número na tela.`;
  }

  if (/\b(?:abre o|abra o|abrir o)\s*(?:whatsapp|zap)\b/.test(normalized)) {
    return null; // handled by appLauncherController
  }

  return null;
}

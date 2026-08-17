export function systemInfoHandler(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[.,!?;:]/g, "").trim();

  if (/\b(?:que horas|hora e|horas sao|horas são|que hora)\b/.test(normalized)) {
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes().toString().padStart(2, "0");
    return `São ${hh} e ${mm}.`;
  }

  if (/\b(?:que dia|dia e hoje|que data|que mês|que mes|que ano)\b/.test(normalized)) {
    return `Hoje é ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`;
  }

  const calcMatch = normalized.match(
    /(?:quanto é|quanto da|calcula|calcule|quanto resulta|quanto fica|quanto e)\s+(.+)/i
  );
  if (calcMatch) {
    try {
      const raw = calcMatch[1]
        .replace(/×/g, "*").replace(/÷/g, "/").replace(/x/gi, "*")
        .replace(/mais/g, "+").replace(/menos/g, "-").replace(/vezes/g, "*")
        .replace(/dividido\s+por/g, "/").replace(/por/g, "/")
        .replace(/\s/g, "");
      const sanitized = raw.replace(/[^0-9+\-*/.()]/g, "");
      if (!sanitized) return "Não consegui entender a expressão.";
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === "number" && isFinite(result)) {
        return `O resultado é ${result % 1 === 0 ? result : result.toFixed(2).replace(/\.?0+$/, "")}.`;
      }
    } catch {
      // fall through
    }
    return "Não consegui calcular. Tenta com uma expressão mais simples.";
  }

  return null;
}

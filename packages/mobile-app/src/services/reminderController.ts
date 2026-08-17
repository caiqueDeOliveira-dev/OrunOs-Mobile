import * as Notifications from "expo-notifications";

const TRIGGER_TYPE_TIME_INTERVAL = "timeInterval";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseTimeExpression(text: string): { seconds: number; cleanContent: string } {
  let seconds = 60;
  let clean = text;

  const emMin = clean.match(/em\s+(\d+)\s*min(?:uto)?s?/i);
  if (emMin) {
    seconds = parseInt(emMin[1]) * 60;
    clean = clean.replace(/em\s+\d+\s*min(?:uto)?s?/i, "").trim();
    return { seconds, cleanContent: clean };
  }

  const emHr = clean.match(/em\s+(\d+)\s*h(?:ora)?s?/i);
  if (emHr) {
    seconds = parseInt(emHr[1]) * 3600;
    clean = clean.replace(/em\s+\d+\s*h(?:ora)?s?/i, "").trim();
    return { seconds, cleanContent: clean };
  }

  const asHr = clean.match(/(?:às|as)\s*(\d{1,2})\s*(?:h(?:oras?)?|:)\s*(\d{2})?/i);
  if (asHr) {
    const now = new Date();
    const target = new Date();
    target.setHours(parseInt(asHr[1]), asHr[2] ? parseInt(asHr[2]) : 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
    clean = clean.replace(/(?:às|as)\s*\d{1,2}\s*(?:h(?:oras?)?|:)\s*\d{0,2}/i, "").trim();
    return { seconds, cleanContent: clean };
  }

  const amanha = clean.match(/amanh[ãa]\s*(?:às|as)?\s*(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
  if (amanha) {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(parseInt(amanha[1]), amanha[2] ? parseInt(amanha[2]) : 0, 0, 0);
    seconds = Math.floor((target.getTime() - Date.now()) / 1000);
    clean = clean.replace(/amanh[ãa]\s*(?:às|as)?\s*\d{1,2}\s*(?:h|:)\s*\d{0,2}/i, "").trim();
    return { seconds, cleanContent: clean };
  }

  return { seconds, cleanContent: clean };
}

export function reminderHandler(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[.;:!?]/g, "").trim();

  const match = normalized.match(
    /(?:me lembra|lembrete|alarme|avise|aviso|lembra(?:me)?)\s*(?:de\s+|do\s+|da\s+|para\s+|p\/?\s*)?/i
  );
  if (!match) return null;

  const afterMatch = normalized.slice(match[0].length).trim();
  if (!afterMatch) return "O que você quer que eu lembre?";

  const { seconds, cleanContent } = parseTimeExpression(afterMatch);
  const content = cleanContent || afterMatch;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trigger: any = { type: TRIGGER_TYPE_TIME_INTERVAL, seconds };
  Notifications.scheduleNotificationAsync({
    content: { title: "Lembrete do Orun", body: content, sound: true },
    trigger,
  });

  const timeStr =
    seconds < 60 ? "agora" :
    seconds < 3600 ? `em ${Math.round(seconds / 60)} minuto${Math.round(seconds / 60) > 1 ? "s" : ""}` :
    `em ${Math.round(seconds / 3600)} hora${Math.round(seconds / 3600) > 1 ? "s" : ""}`;

  return `Lembrete agendado: "${content}" ${timeStr}.`;
}

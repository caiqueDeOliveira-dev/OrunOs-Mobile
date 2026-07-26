let Sentry: any;
try {
  Sentry = require("@sentry/react-native");
} catch {
  // Sentry not installed — noop
}

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!DSN || !Sentry) {
    console.warn("[sentry] No DSN or package not installed — error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    environment: __DEV__ ? "development" : "production",
    enableAutoSessionTracking: true,
    attachStacktrace: true,
  });
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (DSN && Sentry) {
    Sentry.withScope((scope: any) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  }
}

export function captureMessage(message: string, level: string = "info") {
  if (DSN && Sentry) {
    Sentry.captureMessage(message, level);
  }
}

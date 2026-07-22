import type { ErrorEvent } from "@sentry/nextjs";

// Opciones compartidas por los 3 runtimes de Sentry (client/server/edge). Antes de Fase 10 los
// tres configs eran idénticos: `tracesSampleRate: 1.0` y sin ningún scrubbing. Acá se baja el
// sampleo de trazas a 0.1 (configurable) y se agrega redacción de PII antes de enviar el evento
// — espeja el `beforeSend` de `instrument.ts` del backend (docs/fase-10-features.md §2), relevante
// para la Ley 25.326.

const REDACTED = "[Filtered]";
const SENSITIVE_HEADERS = ["authorization", "cookie"];
const SENSITIVE_BODY_KEYS = ["password", "token", "refreshtoken", "accesstoken"];

function parseSampleRate(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : fallback;
}

function redactKeys(obj: Record<string, unknown>, keys: string[]): void {
  for (const key of Object.keys(obj)) {
    if (keys.includes(key.toLowerCase())) obj[key] = REDACTED;
  }
}

function scrubPii(event: ErrorEvent): ErrorEvent {
  const req = event.request;
  if (req?.headers && typeof req.headers === "object") {
    redactKeys(req.headers as Record<string, unknown>, SENSITIVE_HEADERS);
  }
  if (req && typeof req.data === "object" && req.data !== null) {
    redactKeys(req.data as Record<string, unknown>, SENSITIVE_BODY_KEYS);
  }
  return event;
}

// `NEXT_PUBLIC_*` para que el sampleo sea configurable también en el bundle del navegador (las
// env sin ese prefijo no llegan al cliente). `release`/`environment` sí se leen server-side; en
// el cliente quedan undefined y el plugin de Sentry inyecta el release en build.
export const sharedSentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: parseSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    0.1,
  ),
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  debug: false,
  beforeSend: scrubPii,
};

// Content-Security-Policy y headers de seguridad para toda la app (Fase 10 — Hardening).
//
// Estrategia: CSP **sin nonce**, seteado desde `next.config` `headers()`, para que las
// páginas sigan siendo estáticamente optimizables (un nonce obligaría dynamic rendering
// global). `script-src`/`style-src` conservan `'unsafe-inline'`: la app renderiza atributos
// `style={{}}` dinámicos por todos lados (colores de rating, gradientes de cover) que un nonce
// no puede cubrir, y la entrega estática descarta un nonce por-request de todas formas. Aceptar
// `'unsafe-inline'` en scripts es el tradeoff documentado de esta estrategia.
//
// Rollout: arranca como **Report-Only**. Poner `CSP_ENFORCE=true` recién después de verificar
// cero violaciones en la consola del navegador en toda la app (ver docs/deploy-frontend.md).

type Header = { key: string; value: string };

const isDev = process.env.NODE_ENV !== "production";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Origen del backend REST + SSE (mismo host). En dev cae a http://localhost:3001.
const apiOrigin =
  originOf(process.env.NEXT_PUBLIC_API_URL) ?? "http://localhost:3001";

// Assets externos. Deezer sirve covers y previews de audio desde *.dzcdn.net; Cloudinary aloja
// los avatars/covers subidos; los usuarios de Google OAuth pueden traer un avatar en
// lh3.googleusercontent.com. Verificar contra respuestas reales bajo Report-Only y ajustar si
// falta alguno (docs/deploy-frontend.md).
const DEEZER_CDN = "https://*.dzcdn.net";
const CLOUDINARY = "https://res.cloudinary.com";
const GOOGLE_AVATAR = "https://lh3.googleusercontent.com";

// Ingest de Sentry (errores + trazas del navegador). `*.sentry.io` cubre también los ingest
// regionales (o0.ingest.us.sentry.io, etc.: el comodín matchea múltiples labels).
const SENTRY_INGEST = "https://*.sentry.io";

// Consent screen de Google OAuth. `form-action` lo necesita porque el sign-in de Auth.js hace
// un POST same-origin que redirige a accounts.google.com (algunos navegadores aplican
// form-action a esa redirección).
const GOOGLE_OAUTH = "https://accounts.google.com";

function buildCsp(): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${DEEZER_CDN} ${CLOUDINARY} ${GOOGLE_AVATAR}`,
    `media-src 'self' blob: ${DEEZER_CDN}`,
    `font-src 'self'`,
    `connect-src 'self' ${apiOrigin} ${SENTRY_INGEST}`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' ${GOOGLE_OAUTH}`,
    `frame-ancestors 'none'`,
    // No forzar HTTPS en dev: rompería la API en http://localhost:3001.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

const cspEnforced = process.env.CSP_ENFORCE === "true";

export function securityHeaders(): Header[] {
  const headers: Header[] = [
    {
      key: cspEnforced
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: buildCsp(),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];

  // HSTS solo en prod: sobre http://localhost el navegador la ignora, pero la omitimos para no
  // ensuciar las respuestas de dev.
  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

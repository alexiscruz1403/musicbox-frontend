import { tokenStore } from "@/lib/token-store";
import { LOCALE_COOKIE, DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/i18n/locale";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

// `doFetch` runs in both server contexts (pages passing an explicit
// accessToken) and client contexts (e.g. account-client.tsx calling
// apiPatchMe directly) — `next/headers` is server-only, so it's imported
// dynamically and guarded by `typeof window` rather than statically, which
// would break client bundling.
async function resolveLocale(): Promise<AppLocale> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      const raw = store.get(LOCALE_COOKIE)?.value;
      return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const raw = match?.[1];
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleError(res: Response): Promise<never> {
  let code = "INTERNAL_ERROR";
  let message = res.statusText || "Unknown error";
  try {
    const body = (await res.json()) as {
      error?: { code: string; message: string };
    };
    if (body.error) {
      code = body.error.code;
      message = body.error.message;
    }
  } catch {
    // body not JSON
  }
  throw new ApiError(code, message, res.status);
}

export interface FetchOptions extends RequestInit {
  accessToken?: string;
}

async function doFetch(
  path: string,
  token: string | undefined,
  options: Omit<FetchOptions, "accessToken">,
): Promise<Response> {
  const { body, headers: extraHeaders, ...rest } = options;
  const locale = await resolveLocale();

  const headers: Record<string, string> = {
    "Accept-Language": locale,
    ...(extraHeaders as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE}${path}`, { ...rest, body, headers });
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { accessToken: explicitToken, ...rest } = options;
  const token = explicitToken ?? tokenStore.getAccessToken() ?? undefined;
  const hadToken = !!token;

  let res = await doFetch(path, token, rest);

  if (res.status === 401 && hadToken) {
    const refreshed = await tokenStore.refresh();
    if (refreshed) {
      res = await doFetch(path, tokenStore.getAccessToken() ?? undefined, rest);
    } else {
      throw new ApiError(
        "SESSION_EXPIRED",
        "Tu sesión expiró. Por favor iniciá sesión de nuevo.",
        401,
      );
    }
  }

  if (!res.ok) {
    return handleError(res);
  }

  // No alcanza con chequear `res.status === 204` — en la práctica algunos
  // endpoints devuelven 2xx con body vacío sin ser literalmente 204 (ej.
  // POST /push/subscriptions), y `res.json()` sobre un body vacío tira
  // "Unexpected end of JSON input". Leer como texto primero es válido para
  // cualquier body vacío, sin importar el status code exacto.
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// ─── Shapes compartidos entre módulos de dominio ────────────────────────────
//
// El backend de ReviewsModule/SocialModule/NotificationsModule/ModerationModule
// no sigue el shape de CatalogModule para listados paginados — devuelve
// { data: Row[], meta: { cursor } } (`data` es el array directo), no
// { data: { items, nextCursor } }. Cada módulo de dominio que consume un
// listado así usa este envelope para normalizar la respuesta cruda antes de
// exponerla como { items, nextCursor }. Ver docs/musicbox-frontend-guide.md §6.1.
export interface RawListEnvelope<T> {
  data: T[];
  meta: { cursor: string | null };
}

// Shape mínimo de usuario embebido en filas de reseñas/comentarios crudas —
// compartido por reviews.ts y social.ts (reviews y comentarios usan el mismo
// include de Prisma). Kept optional at call sites so a response without the
// include still degrades to a "Usuario" fallback instead of crashing.
export interface RawReviewUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

import { test as setup } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { SESSION_COOKIE, STORAGE_STATE } from "./constants";

// Firma una cookie de sesión NextAuth v5 válida SIN pasar por el backend, para los flujos
// autenticados de Tier 1. `auth()` la desencripta con el mismo AUTH_SECRET + salt (nombre de
// cookie). Los claims deben coincidir con lo que leen los callbacks jwt/session de src/auth.ts.
//
// Depende de internals del encode de NextAuth v5 (salt = nombre de cookie) — validar en la
// primera corrida. Requiere AUTH_SECRET (el mismo que usa el dev server); si falta, se saltea.

// accessToken falso con exp lejano: evita que el callback jwt dispare el refresh proactivo
// (que golpearía /auth/refresh del backend). Se codifica en base64 estándar porque
// decodeJwtExp de src/auth.ts hace Buffer.from(part, "base64").
function fakeAccessToken(sub: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64");
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, exp })}.sig`;
}

setup("authenticate", async ({ context }) => {
  const secret = process.env.AUTH_SECRET;
  setup.skip(!secret, "AUTH_SECRET no seteado — no se puede firmar la cookie de sesión.");

  const userId = "e2e-user-00000000-0000-0000-0000-000000000000";
  const maxAge = 7 * 24 * 60 * 60;

  const token = await encode({
    secret: secret as string,
    salt: SESSION_COOKIE,
    maxAge,
    token: {
      sub: userId,
      id: userId,
      handle: "e2e_user",
      displayName: "E2E User",
      avatarUrl: null,
      status: "ACTIVE",
      role: "USER",
      language: "ES",
      accessToken: fakeAccessToken(userId),
      refreshToken: "e2e-refresh-token",
    },
  });

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + maxAge,
    },
  ]);

  await context.storageState({ path: STORAGE_STATE });
});

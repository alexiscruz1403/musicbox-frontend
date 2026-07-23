"use server";

import { cookies } from "next/headers";
import { getValidSession } from "@/lib/session";
import { apiPatchMe, generateIdempotencyKey } from "@/lib/api";
import { LOCALE_COOKIE, isAppLocale, type AppLocale } from "@/i18n/locale";

export async function setLocale(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const session = await getValidSession();
  if (session?.accessToken) {
    try {
      await apiPatchMe(
        session.accessToken,
        { language: locale.toUpperCase() as "EN" | "ES" },
        generateIdempotencyKey(),
      );
    } catch {
      // Cookie already set — the UI already reflects the new language on
      // this device even if the cross-device backend sync failed. Don't
      // throw: a network hiccup here shouldn't block switching languages
      // locally, same "degrade, don't crash" convention as auth.ts's
      // GoogleAuthError/RefreshTokenError handling.
    }
  }
}

// Cookie-only correction used by LocaleSync (providers.tsx) when the
// backend's saved language differs from this device's cookie — the backend
// is already the source of truth here, so no apiPatchMe echo-back.
export async function setLocaleCookie(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

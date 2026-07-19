export const LOCALE_COOKIE = "mb_locale";
export const DEFAULT_LOCALE = "en" as const;
export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

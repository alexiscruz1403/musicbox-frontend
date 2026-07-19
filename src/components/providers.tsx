"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { QueryProvider } from "@/lib/query-client";
import { tokenStore } from "@/lib/token-store";
import { SwRegister } from "@/components/pwa/sw-register";
import { setLocaleCookie } from "@/lib/locale-actions";
import { isAppLocale } from "@/i18n/locale";

function SessionSync() {
  const { data: session } = useSession();

  // Registrar el callback de expiración una sola vez al montar
  useEffect(() => {
    tokenStore.onExpired(() => {
      void signOut({ callbackUrl: "/login" });
    });
  }, []);

  // Sincronizar tokens al store cada vez que la sesión cambia
  useEffect(() => {
    if (session?.accessToken && session?.refreshToken) {
      tokenStore.set(session.accessToken, session.refreshToken);
    }
    // Si el refresh proactivo de auth.ts falló, limpiar → dispara onExpired → signOut
    if (session?.error === "RefreshTokenError") {
      tokenStore.clear();
    }
  }, [session]);

  return null;
}

// Corrige la cookie de idioma de este dispositivo si difiere de la que el
// usuario ya guardó en su cuenta (ej. la cambió desde otro dispositivo).
// Se reconcilia una sola vez por sesión montada para no pelear contra un
// toggle manual hecho después (ese ya actualizó el backend vía setLocale).
function LocaleSync() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const reconciled = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || reconciled.current) return;
    const accountLocale = session?.user?.language?.toLowerCase();
    if (isAppLocale(accountLocale) && accountLocale !== locale) {
      reconciled.current = true;
      void setLocaleCookie(accountLocale).then(() => router.refresh());
    }
  }, [status, session, locale, router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <SessionSync />
        <LocaleSync />
        <SwRegister />
        {children}
      </QueryProvider>
    </SessionProvider>
  );
}

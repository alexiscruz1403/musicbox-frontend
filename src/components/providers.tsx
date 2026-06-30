"use client";

import { useEffect } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { QueryProvider } from "@/lib/query-client";
import { tokenStore } from "@/lib/token-store";

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <SessionSync />
        {children}
      </QueryProvider>
    </SessionProvider>
  );
}

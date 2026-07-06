"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStore } from "@/lib/token-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
const RECONNECT_DELAY_MS = 3000;

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      resolve();
    });
  });
}

// El backend requiere el header Authorization en el stream SSE, así que no se
// puede usar el EventSource nativo del navegador (no soporta headers custom) —
// se consume manualmente vía fetch() + ReadableStream, per docs/fase-5-features.md.
export function useNotificationsStream(accessToken: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();
    let cancelled = false;

    async function connectOnce(): Promise<void> {
      const token = tokenStore.getAccessToken() ?? accessToken;
      const res = await fetch(`${API_BASE}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          const eventType = /^event:\s*(.+)$/m.exec(chunk)?.[1]?.trim() ?? "message";
          if (eventType === "notification") {
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
          // eventType === "heartbeat" → no-op, solo confirma que la conexión sigue viva
        }
      }
    }

    async function loop(): Promise<void> {
      while (!cancelled) {
        try {
          await connectOnce();
        } catch {
          // conexión cortada / error de red — se reintenta abajo
        }
        if (cancelled) break;
        await delay(RECONNECT_DELAY_MS, controller.signal);
      }
    }

    void loop();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accessToken, queryClient]);
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ApiError } from "@/lib/api";

// Un 4xx no se arregla reintentando: un 401 por sesión expirada o un 404 van a
// fallar igual las tres veces del default de react-query, multiplicando por
// cuatro el tráfico inútil de cada widget montado.
function retry(failureCount: number, error: unknown): boolean {
  if (
    error instanceof ApiError &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  ) {
    return false;
  }
  return failureCount < 2;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

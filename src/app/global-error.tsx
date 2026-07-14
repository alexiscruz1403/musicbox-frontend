"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/errors/error-state";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-full bg-mb-bg text-mb-text antialiased">
        <div className="flex min-h-screen items-center justify-center px-6">
          <ErrorState
            code="500"
            title="Algo falló de nuestra parte"
            description="Estamos al tanto y ya lo estamos mirando."
            action={{ type: "button", onClick: unstable_retry, label: "Reintentar" }}
          />
        </div>
      </body>
    </html>
  );
}

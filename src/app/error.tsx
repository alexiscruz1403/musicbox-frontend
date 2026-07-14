"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/errors/error-state";

export default function Error({
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
    <div className="flex min-h-screen items-center justify-center bg-mb-bg px-6">
      <ErrorState
        code="500"
        title="Algo falló de nuestra parte"
        description="Estamos al tanto y ya lo estamos mirando."
        action={{ type: "button", onClick: unstable_retry, label: "Reintentar" }}
      />
    </div>
  );
}

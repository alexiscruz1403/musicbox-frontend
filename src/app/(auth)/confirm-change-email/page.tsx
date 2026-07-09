import { Suspense } from "react";
import { ConfirmChangeEmailClient } from "./confirm-change-email-client";

export default function ConfirmChangeEmailPage() {
  return (
    <Suspense>
      <ConfirmChangeEmailClient />
    </Suspense>
  );
}

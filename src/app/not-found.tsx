import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/errors/error-state";

export default async function NotFound() {
  const t = await getTranslations("Errors");

  return (
    <div className="flex min-h-screen items-center justify-center bg-mb-bg px-6">
      <ErrorState
        code="404"
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        action={{ type: "link", href: "/", label: t("backHome") }}
      />
    </div>
  );
}

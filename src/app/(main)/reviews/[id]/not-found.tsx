import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/errors/error-state";

export default async function ReviewNotFound() {
  const t = await getTranslations("Reviews.detail");
  const tErrors = await getTranslations("Errors");

  return (
    <div className="min-h-screen bg-mb-bg flex items-center justify-center px-6">
      <ErrorState
        code="404"
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        action={{ type: "link", href: "/search", label: tErrors("backToSearch") }}
      />
    </div>
  );
}

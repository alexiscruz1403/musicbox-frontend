import { ErrorState } from "@/components/errors/error-state";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mb-bg px-6">
      <ErrorState
        code="404"
        title="Esta página no existe"
        description="Quizás el álbum fue eliminado o el link es incorrecto."
        action={{ type: "link", href: "/", label: "Volver al inicio" }}
      />
    </div>
  );
}

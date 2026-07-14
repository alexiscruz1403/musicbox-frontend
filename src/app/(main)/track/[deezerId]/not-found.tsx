import { ErrorState } from "@/components/errors/error-state";

export default function TrackNotFound() {
  return (
    <div className="min-h-screen bg-mb-bg flex items-center justify-center px-6">
      <ErrorState
        code="404"
        title="Canción no encontrada"
        description="Esta canción no existe o aún no está disponible."
        action={{ type: "link", href: "/search", label: "Volver a búsqueda" }}
      />
    </div>
  );
}

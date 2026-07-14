import { ErrorState } from "@/components/errors/error-state";

export default function AlbumNotFound() {
  return (
    <div className="min-h-screen bg-mb-bg flex items-center justify-center px-6">
      <ErrorState
        code="404"
        title="Álbum no encontrado"
        description="Este álbum no existe o aún no está disponible."
        action={{ type: "link", href: "/search", label: "Volver a búsqueda" }}
      />
    </div>
  );
}

import { ErrorState } from "@/components/errors/error-state";

export default function ArtistNotFound() {
  return (
    <div className="min-h-screen bg-mb-bg flex items-center justify-center px-6">
      <ErrorState
        code="404"
        title="Artista no encontrado"
        description="Este artista no existe en Deezer."
        action={{ type: "link", href: "/search", label: "Volver a búsqueda" }}
      />
    </div>
  );
}

import { ErrorState } from "@/components/errors/error-state";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-mb-bg flex items-center justify-center px-6">
      <ErrorState
        code="404"
        title="Perfil no encontrado"
        description="Este usuario no existe o el enlace es incorrecto."
        action={{ type: "link", href: "/search", label: "Volver a búsqueda" }}
      />
    </div>
  );
}

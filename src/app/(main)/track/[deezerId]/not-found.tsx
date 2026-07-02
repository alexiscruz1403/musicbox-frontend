import Link from "next/link";

export default function TrackNotFound() {
  return (
    <div className="min-h-screen bg-mb-bg flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="font-serif text-2xl text-mb-text">Canción no encontrada</p>
      <p className="text-mb-muted text-sm">
        Esta canción no existe o aún no está disponible.
      </p>
      <Link
        href="/search"
        className="text-mb-accent text-sm underline underline-offset-2 hover:no-underline"
      >
        Volver a búsqueda
      </Link>
    </div>
  );
}

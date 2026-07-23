import { auth } from "@/auth";

// `auth()` devuelve una sesión truthy incluso cuando el refresh proactivo del
// callback `jwt` falló (session.error === "RefreshTokenError"): el objeto
// conserva el accessToken/refreshToken viejos, que ya no sirven. Repartir esos
// tokens a los componentes cliente genera una avalancha de 401 — cada uno
// intenta refrescar, falla, y dispara su propio signOut.
//
// Para todo el árbol de rutas, una sesión errorada es exactamente equivalente
// a no tener sesión: las páginas ya saben redirigir a /login con `null`, y las
// que usan el token de forma opcional degradan a una petición anónima.
export async function getValidSession() {
  const session = await auth();
  if (!session || session.error) return null;
  return session;
}

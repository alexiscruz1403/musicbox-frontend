// Rutas relativas al cwd (raíz del proyecto, desde donde corre `playwright test`).
export const STORAGE_STATE = "e2e/.auth/user.json";

// Nombre de la cookie de sesión de NextAuth v5 sobre http (dev). En https sería
// `__Secure-authjs.session-token`. Se usa como `salt` del encode y como nombre de cookie.
export const SESSION_COOKIE = "authjs.session-token";

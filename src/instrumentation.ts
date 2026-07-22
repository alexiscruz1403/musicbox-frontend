import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Sin este hook, los errores lanzados durante el render en el server (Server Components,
// route handlers) no llegan a Sentry. Requerido por @sentry/nextjs en Next 15+/16.
export const onRequestError = Sentry.captureRequestError;

"use client";

import { useCallback, useSyncExternalStore } from "react";

// `beforeinstallprompt` es no estándar (solo Chromium) y TS no lo tipa.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Safari iOS marca las apps abiertas desde la pantalla de inicio acá, no con
// el media query `display-mode: standalone`.
interface IosNavigator extends Navigator {
  standalone?: boolean;
}

// "hidden": no hay nada que ofrecer (ya instalada, descartada hace poco, o el
// browser no soporta ninguna de las dos vías).
// "prompt": Chromium nos dio el evento y podemos abrir el diálogo nativo.
// "ios": Safari iOS, hay que explicarle al usuario el flujo manual.
export type PwaInstallMode = "hidden" | "prompt" | "ios";

const DISMISS_KEY = "mb-pwa-install-dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

// El store vive a nivel de módulo, no dentro del componente, porque Chromium
// dispara `beforeinstallprompt` durante la carga de la página — normalmente
// antes de que React monte nada. Registrando el listener en el import no se
// pierde el evento, y el banner puede montarse/desmontarse sin perderlo.

let promptEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
let dismissed = false;
let iosEligible = false;
let checkedEnvironment = false;
let snapshot: PwaInstallMode = "hidden";
const listeners = new Set<() => void>();

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as IosNavigator).standalone === true
  );
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < DISMISS_MS;
  } catch {
    // Storage bloqueado (modo privado, cookies de terceros): tratamos el banner
    // como no descartado en vez de romper el feed.
    return false;
  }
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  // iPadOS se reporta como Mac; maxTouchPoints lo distingue de una Mac real.
  const isIos =
    /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!isIos) return false;
  // Chrome/Firefox/Edge en iOS no tienen "Añadir a pantalla de inicio".
  return !/CriOS|FxiOS|EdgiOS/.test(ua);
}

// Se difiere al primer subscribe (ya en cliente) en vez de correr en el import,
// para no tocar matchMedia/localStorage si el módulo se evalúa en el server.
function checkEnvironment() {
  if (checkedEnvironment) return;
  checkedEnvironment = true;
  installed = isStandalone();
  dismissed = wasDismissedRecently();
  iosEligible = isIosSafari();
}

function computeSnapshot(): PwaInstallMode {
  if (installed || dismissed) return "hidden";
  if (promptEvent) return "prompt";
  return iosEligible ? "ios" : "hidden";
}

function emit() {
  const next = computeSnapshot();
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Sin preventDefault el browser muestra su propio mini-infobar y el evento
    // deja de estar disponible para nuestro botón.
    event.preventDefault();
    promptEvent = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    promptEvent = null;
    installed = true;
    emit();
  });
}

function subscribe(listener: () => void) {
  checkEnvironment();
  emit();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PwaInstallMode {
  return snapshot;
}

// En SSR nunca hay banner: el primer render del cliente coincide y recién
// después el subscribe revela el modo real.
function getServerSnapshot(): PwaInstallMode {
  return "hidden";
}

export function usePwaInstall() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const install = useCallback(async () => {
    const event = promptEvent;
    if (!event) return;
    // El evento es de un solo uso: pase lo que pase, ya no sirve.
    promptEvent = null;
    emit();
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // El diálogo puede fallar si ya se consumió o si el browser lo bloquea.
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Si no podemos persistirlo, al menos lo ocultamos en esta sesión.
    }
    dismissed = true;
    emit();
  }, []);

  return { mode, install, dismiss };
}

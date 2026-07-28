"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

// Drag & drop sobre Pointer Events, que unifican mouse, touch y lápiz en un
// solo modelo. Reemplaza al HTML5 Drag and Drop, que no existe en touch y que
// además no arranca de forma confiable desde un control de formulario.
//
// El destino se resuelve geométricamente (elementFromPoint), no por bubbling,
// así que el consumidor sólo tiene que marcar el DOM:
//   - zonas de drop  → data-drop-zone="<id>"
//   - ítems          → data-album-id="<id>"

/** Píxeles de movimiento que arman el drag con mouse/lápiz (sin demora). */
const MOUSE_THRESHOLD = 5;
/** Milisegundos de long-press que arman el drag con el dedo. */
const TOUCH_DELAY = 200;
/** Movimiento tolerado durante el long-press antes de asumir que es scroll. */
const TOUCH_TOLERANCE = 8;
/** Distancia al borde del viewport que dispara el auto-scroll. */
const EDGE = 72;
/** Píxeles por frame del auto-scroll. */
const EDGE_SPEED = 12;

/** Referencia estable, para poder desregistrar el listener no pasivo. */
function preventDefault(e: Event) {
  e.preventDefault();
}

interface Point {
  x: number;
  y: number;
}

interface UseBoardDragOptions {
  onDrop: (itemId: string, zone: string, beforeId?: string) => void;
}

interface Gesture {
  pointerId: number;
  itemId: string;
  origin: Point;
  target: HTMLElement;
  active: boolean;
  zone: string | null;
  beforeId?: string;
}

export interface BoardDrag {
  draggingId: string | null;
  overZone: string | null;
  point: Point | null;
  startDrag: (e: ReactPointerEvent, itemId: string) => void;
  /** true si el gesto que acaba de terminar fue un drag — para no abrir el menú al soltar. */
  suppressClick: () => boolean;
}

export function useBoardDrag({ onDrop }: UseBoardDragOptions): BoardDrag {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  const [point, setPoint] = useState<Point | null>(null);

  const gesture = useRef<Gesture | null>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const justDragged = useRef(false);
  // El callback vive en un ref para que los listeners de window se registren
  // una sola vez y no dependan de la identidad de onDrop en cada render.
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const resolveTarget = useCallback((p: Point) => {
    const el = document.elementFromPoint(p.x, p.y);
    const g = gesture.current;
    if (!el || !g) return;
    const zoneEl = el.closest<HTMLElement>("[data-drop-zone]");
    const itemEl = el.closest<HTMLElement>("[data-album-id]");
    const zone = zoneEl?.dataset.dropZone ?? null;
    const over = itemEl?.dataset.albumId;
    g.zone = zone;
    g.beforeId = over && over !== g.itemId ? over : undefined;
    setOverZone(zone);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  // Expresión de función nombrada para poder reagendarse a sí misma sin
  // referenciar el binding externo, que todavía no está inicializado acá.
  const tickAutoScroll = useCallback(
    function tick() {
      rafId.current = null;
      const p = lastPoint.current;
      if (!gesture.current?.active || !p) return;

      const topGap = p.y - EDGE;
      const bottomGap = window.innerHeight - EDGE - p.y;
      let delta = 0;
      if (topGap < 0) delta = -EDGE_SPEED;
      else if (bottomGap < 0) delta = EDGE_SPEED;

      if (delta !== 0) {
        window.scrollBy(0, delta);
        // La página se movió bajo el puntero: el destino cambia aunque el dedo
        // esté quieto, así que se recalcula en cada frame.
        resolveTarget(p);
        rafId.current = requestAnimationFrame(tick);
      }
    },
    [resolveTarget],
  );

  const maybeAutoScroll = useCallback(
    (p: Point) => {
      const nearEdge = p.y < EDGE || p.y > window.innerHeight - EDGE;
      if (nearEdge && rafId.current === null) {
        rafId.current = requestAnimationFrame(tickAutoScroll);
      } else if (!nearEdge) {
        stopAutoScroll();
      }
    },
    [tickAutoScroll, stopAutoScroll],
  );

  const clearDelay = useCallback(() => {
    if (delayTimer.current !== null) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
  }, []);

  // Mientras el drag está activo hay que cortar el scroll táctil y el menú
  // contextual del long-press. `touch-action` no sirve acá: el navegador la
  // evalúa al empezar el gesto, no a mitad de camino. Se instalan y se sacan
  // de forma imperativa —no vía useEffect— para que no quede ni un frame de
  // margen entre que el drag arranca y el scroll queda bloqueado.
  const blockNativeGestures = useCallback((on: boolean) => {
    if (on) {
      document.addEventListener("touchmove", preventDefault, { passive: false });
      document.addEventListener("contextmenu", preventDefault);
    } else {
      document.removeEventListener("touchmove", preventDefault);
      document.removeEventListener("contextmenu", preventDefault);
    }
  }, []);

  const endGesture = useCallback(() => {
    const g = gesture.current;
    if (g?.active) {
      blockNativeGestures(false);
      try {
        g.target.releasePointerCapture(g.pointerId);
      } catch {
        // El puntero ya se liberó solo (p. ej. pointercancel del navegador).
      }
    }
    gesture.current = null;
    lastPoint.current = null;
    clearDelay();
    stopAutoScroll();
    setDraggingId(null);
    setOverZone(null);
    setPoint(null);
  }, [clearDelay, stopAutoScroll, blockNativeGestures]);

  const activate = useCallback(
    (p: Point) => {
      const g = gesture.current;
      if (!g || g.active) return;
      g.active = true;
      clearDelay();
      blockNativeGestures(true);
      try {
        g.target.setPointerCapture(g.pointerId);
      } catch {
        // Sin captura el drag igual funciona: los listeners viven en window.
      }
      justDragged.current = true;
      setDraggingId(g.itemId);
      setPoint(p);
      resolveTarget(p);
    },
    [clearDelay, resolveTarget, blockNativeGestures],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pointerId) return;
      const p = { x: e.clientX, y: e.clientY };
      lastPoint.current = p;

      if (!g.active) {
        const dist = Math.hypot(p.x - g.origin.x, p.y - g.origin.y);
        if (e.pointerType === "touch") {
          // Moverse antes de que venza el long-press significa scrollear:
          // se abandona el gesto y la página se queda con el toque.
          if (dist > TOUCH_TOLERANCE) endGesture();
        } else if (dist > MOUSE_THRESHOLD) {
          activate(p);
        }
        return;
      }

      setPoint(p);
      resolveTarget(p);
      maybeAutoScroll(p);
    }

    function onUp(e: PointerEvent) {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pointerId) return;
      if (g.active && g.zone) {
        onDropRef.current(g.itemId, g.zone, g.beforeId);
      }
      endGesture();
    }

    function onCancel(e: PointerEvent) {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pointerId) return;
      endGesture();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [activate, endGesture, resolveTarget, maybeAutoScroll]);

  useEffect(() => endGesture, [endGesture]);

  const startDrag = useCallback(
    (e: ReactPointerEvent, itemId: string) => {
      if (gesture.current || e.button !== 0) return;
      const origin = { x: e.clientX, y: e.clientY };
      gesture.current = {
        pointerId: e.pointerId,
        itemId,
        origin,
        target: e.currentTarget as HTMLElement,
        active: false,
        zone: null,
      };
      lastPoint.current = origin;
      justDragged.current = false;

      if (e.pointerType === "touch") {
        delayTimer.current = setTimeout(() => {
          delayTimer.current = null;
          activate(lastPoint.current ?? origin);
        }, TOUCH_DELAY);
      }
    },
    [activate],
  );

  const suppressClick = useCallback(() => {
    if (!justDragged.current) return false;
    justDragged.current = false;
    return true;
  }, []);

  return { draggingId, overZone, point, startDrag, suppressClick };
}

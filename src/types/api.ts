// Barrel de compatibilidad — `src/types/api.ts` pasó a ser un archivo por
// dominio bajo `src/types/api/` (mismo split que `src/lib/api/`, ver ese
// archivo). Este barrel existe para que los call sites existentes
// (`import type { Xxx } from "@/types/api"`) sigan funcionando sin cambios.
// Ver docs/musicbox-frontend-guide.md §9 y §12 (decisión del refactor).
export * from "./api/common";
export * from "./api/auth";
export * from "./api/users";
export * from "./api/catalog";
export * from "./api/reviews";
export * from "./api/social";
export * from "./api/trending";
export * from "./api/notifications";
export * from "./api/recommendations";
export * from "./api/moderation";
export * from "./api/push";

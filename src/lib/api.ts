// Barrel de compatibilidad — `src/lib/api.ts` pasó a ser un archivo por
// dominio bajo `src/lib/api/` (auth, users, catalog, reviews, social,
// trending, notifications, recommendations, moderation, account, push, más
// el núcleo compartido en `client`). Este barrel existe para que los ~50
// call sites que hacen `import { apiXxx } from "@/lib/api"` sigan
// funcionando sin cambios — el split es interno, no un cambio de contrato.
// Ver docs/musicbox-frontend-guide.md §6 y §12 (decisión del refactor).
export * from "./api/client";
export * from "./api/auth";
export * from "./api/users";
export * from "./api/catalog";
export * from "./api/reviews";
export * from "./api/social";
export * from "./api/trending";
export * from "./api/notifications";
export * from "./api/recommendations";
export * from "./api/moderation";
export * from "./api/account";
export * from "./api/push";

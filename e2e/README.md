# E2E (Playwright) — Fase 10

Tests end-to-end de flujos críticos. Delegados a este repo desde la Fase 10 del backend
(`docs/fase-10-features.md` §7). Dos niveles:

- **Tier 1 — sin backend (apto CI).** Corren contra el dev server con el backend mockeado a
  nivel de red del navegador (`page.route`) o sin backend en absoluto.
  - `anon/route-protection.spec.ts` — toda ruta autenticada redirige a `/login` sin sesión.
    Es la prueba automatizada de la matriz de route-protection.
  - `anon/public-access.spec.ts` — las rutas públicas cargan sin redirigir a login.
  - `auth/authenticated-access.spec.ts` — con una cookie de sesión **firmada localmente**
    (sin backend), `/feed`/`/settings` son accesibles y `/login` redirige a `/feed`.
- **Tier 2 — requiere `musicbox-api` real (corre el usuario).**
  - `backend/journeys.spec.ts` — journeys completos (login→feed, search). Se **saltan** salvo
    `E2E_BACKEND=1`.

## Correr

```bash
npx playwright install        # una vez
AUTH_SECRET=<mismo-que-el-dev-server> NEXT_PUBLIC_API_URL=http://localhost:3001/v1 npm run test:e2e
```

- `AUTH_SECRET` **debe** coincidir con el del dev server: `auth.setup.ts` firma la cookie con ese
  secreto y `auth()` la desencripta con el mismo. Sin `AUTH_SECRET`, el project `setup` se saltea
  (y con él los tests autenticados).
- Solo Tier 1 (sin backend):
  ```bash
  npx playwright test --project=setup --project=anon --project=authenticated
  ```
- Tier 2 (con backend levantado en `NEXT_PUBLIC_API_URL` y datos de seed):
  ```bash
  E2E_BACKEND=1 E2E_USER_EMAIL=... E2E_USER_PASSWORD=... npx playwright test --project=backend
  ```
- Contra un server ya corriendo (no levanta uno propio): setear `E2E_BASE_URL`.

## Notas / límites conocidos

- `page.route` intercepta solo fetch **del navegador**, no los fetch **server-side** de Next
  (`auth()`, Server Components). Por eso los tests autenticados de Tier 1 usan páginas cuyo render
  server-side solo depende de la cookie; las páginas de detalle que fetchean server-side
  (`/album/[id]`, `/track/[id]`, `/u/[handle]`) son territorio de Tier 2.
- `auth.setup.ts` depende de internals del `encode` de NextAuth v5 (salt = nombre de cookie
  `authjs.session-token` sobre http). **Validar en la primera corrida**; si NextAuth cambia el
  esquema de cookie, ajustar `constants.ts`.
- Los selectores de `backend/journeys.spec.ts` son best-effort — afinarlos al correr Tier 2.

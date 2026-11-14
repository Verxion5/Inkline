# Inkline — agent notes

TanStack Start (SSR) app: Vite 8 + Bun, React 19, Tailwind 4, TanStack Router, Supabase.

## Commands

```sh
bun install
bun run dev      # dev server on :5173 (0.0.0.0)
bun run build    # production build
bun run lint
```

Type checking is `bunx tsc --noEmit` (no script). Route generation runs from the
TanStack Start Vite plugin; `src/routeTree.gen.ts` is generated, never edited by hand.

## Things that are not obvious

- `vite.config.ts` is a direct Vite config. Plugin order matters: Tailwind, tsconfig
  paths, TanStack Start, React. The `@` alias points at `src`.
- `src/server.ts` is the SSR error wrapper wired through `tanstackStart({ server: { entry: "server" } })`.
- Server-only modules (`*.server.ts`) must be imported only from server functions or
  server routes; `importProtection` fails the client build if they leak.
- AI configuration lives only in the server environment: `AI_API_KEY`, plus optional
  `AI_BASE_URL`, `AI_TEXT_MODEL`, `AI_VISION_MODEL`, `AI_IMAGE_MODEL`. The image route
  (`/api/generate-image`) emits a single `image.completed` SSE frame because the
  images endpoint is not streamable.
- `authenticateCronRequest` (`src/integrations/supabase/cron-auth.ts`) reads
  `CRON_SECRET` / `CRON_SECRET_PREVIOUS` and compares digests in constant time.
- Supabase client env: `VITE_SUPABASE_*` for the browser, `SUPABASE_*` for SSR, and
  `SUPABASE_SERVICE_ROLE_KEY` for admin clients (lazily created, app boots without it).

## Verifying a change

`curl -sf http://localhost:3000/` should return the rendered shell, then exercise the
route you changed in the browser. Sign-in lives at `/auth`; project pages are behind it.

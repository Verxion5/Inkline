## Base44 Dev Environment

This is a TanStack Start (SSR) app using Vite + Bun. Run it with:

```
docker compose -f docker-compose.base44.yml up -d
```

- **Port**: 3000 (Vite dev server with `--host 0.0.0.0 --port 3000`)
- **Package manager**: Bun (`bun install --frozen-lockfile` at startup)
- **Base image**: `oven/bun:1` with source bind-mounted at `/app`
- **Env vars**: Supabase keys and AI keys are loaded via `env_file` (`.env` + `/run/base44/app.env`).
- **SSR**: TanStack Start renders server-side via Nitro. The server entry is `src/server.ts` (error wrapper around `@tanstack/react-start/server-entry`).
- **Auth**: Supabase client-side auth via `src/integrations/supabase/client.ts`. Google OAuth uses `supabase.auth.signInWithOAuth` directly.
- **AI**: Chat and image generation use configurable OpenAI-compatible endpoints via `AI_GATEWAY_URL`, `AI_IMAGES_URL`, and `AI_API_KEY` env vars.

### Vite Config

The app uses standard Vite plugins directly:
- `@tanstack/react-start/plugin/vite` — TanStack Start SSR
- `@vitejs/plugin-react` — React support
- `@tailwindcss/vite` — Tailwind CSS
- `vite-tsconfig-paths` — `@/` path alias from tsconfig.json

### Secrets

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations |
| `AI_API_KEY` | AI gateway API key (chat + images) |
| `AI_GATEWAY_URL` | Chat completions endpoint |
| `AI_IMAGES_URL` | Image generations endpoint |
| `CRON_SECRET` | Cron job authentication |

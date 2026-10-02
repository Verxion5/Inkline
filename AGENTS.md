<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Base44 Dev Environment

TanStack Start (SSR) app using Vite 8 + Bun. Run with:

```
docker compose -f docker-compose.base44.yml up -d
```

- **Port**: 3000 (Vite dev server, `--host 0.0.0.0 --port 3000`)
- **Package manager**: Bun (`bun install --frozen-lockfile` at startup)
- **Base image**: `oven/bun:1` with source bind-mounted at `/app`
- **Env**: Supabase keys in `.env` (loaded via `env_file`). `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` passed for Vite host allowlisting. `/run/base44/app.env` for platform secrets.
- **SSR**: TanStack Start renders server-side via Nitro. Server entry: `src/server.ts`.
- **Auth**: Supabase client-side auth via `src/integrations/supabase/client.ts`. Server admin client (`client.server.ts`) needs `SUPABASE_SERVICE_ROLE_KEY` (dev placeholder generated).
- **Build**: `bunx vite build` passes cleanly. No TypeScript errors.
- **Verify**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200

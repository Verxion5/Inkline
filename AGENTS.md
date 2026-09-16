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

This is a TanStack Start + Vite + React 19 SSR app using **Bun** as the package manager. It connects to a **remote Supabase** instance (credentials in the committed `.env` — they are public/publishable keys).

### Running locally (Base44)
```sh
docker compose -f docker-compose.base44.yml up -d
```
- Uses `oven/bun:1` with the source bind-mounted at `/app`.
- Runs `bun install` then `bun run dev --host 0.0.0.0 --port 3000` (Vite dev server with live reload).
- Port 3000 is the web entry point.

### Environment variables
- **Supabase public credentials** (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_*` variants) are in the committed `.env` and loaded via `env_file`.
- **`LOVABLE_API_KEY`** (optional, not required to boot) — Lovable AI gateway key for image generation and story brainstorming. Without it, the app renders but AI features return errors.
- **`SUPABASE_SERVICE_ROLE_KEY`** (optional, not required to boot) — for server-side admin Supabase operations (bypasses RLS). Lazily loaded, so the app boots without it.

### Key architecture notes
- `@lovable.dev/vite-tanstack-config` wraps the Vite config and handles sandbox detection, SSR (nitro), Tailwind, and path aliases — do not add those plugins manually.
- `src/server.ts` is the nitro server entry (custom SSR error wrapper).
- `src/start.ts` registers Supabase auth attachment and CSRF middleware for server functions.
- Supabase clients use a lazy Proxy pattern — they only initialize on first access, so missing keys don't crash boot.

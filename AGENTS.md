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

## Base44 dev environment

- **Stack:** TanStack Start (Vite SSR) + React 19, managed with **Bun** (`bun.lock`, `bunfig.toml`). Run via `docker-compose.base44.yml` (image `oven/bun:1`, repo bind-mounted, `bun run dev` with live reload).
- **Port:** Vite dev server runs on `5173` inside the container, mapped to host `3000`.
- **Env:** The repo's committed `.env` holds the public/publishable Supabase keys (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `VITE_` mirrors) — enough to boot. Real secrets (`SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`) are delivered via `/run/base44/app.env` and are only needed for admin/RLS-bypass operations and AI image generation respectively; both are lazily loaded so the app boots without them.
- **Verify:** `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`. The served HTML is SSR'd live source (look for `/src/styles.css`, unhashed module paths).

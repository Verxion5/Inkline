# Inkline

An AI creative OS for manga and manhwa: describe a series and Inkline builds the story genome,
the cast, the world, the chapters and the artwork — and remembers all of it between sessions.

Built with TanStack Start (React 19 + SSR), Vite, Tailwind CSS and Supabase.

## Development

Requires [Bun](https://bun.sh) (or Node.js + npm).

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

The dev server listens on http://localhost:5173.

```sh
bun run build     # production build (Nitro server output in dist/)
bun run lint
```

## Environment

Client/SSR Supabase configuration (see `.env`):

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin operations |

AI features run against any OpenAI-compatible API and read their configuration server-side only:

| Variable | Purpose |
| --- | --- |
| `AI_API_KEY` | Provider API key (required for AI features) |
| `AI_BASE_URL` | API root, default `https://api.openai.com/v1` |
| `AI_TEXT_MODEL` | Chat/JSON model, default `gpt-4o-mini` |
| `AI_VISION_MODEL` | Panel review model, default = `AI_TEXT_MODEL` |
| `AI_IMAGE_MODEL` | Artwork model, default `gpt-image-1` |
| `AI_IMAGE_SIZE` | Optional fixed size override for artwork |
| `CRON_SECRET` / `CRON_SECRET_PREVIOUS` | Bearer secret checked by cron-triggered routes |

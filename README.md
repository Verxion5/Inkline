# Inkline

An AI manga/manhwa creation studio: story genome, cast, world, chapters, storyboards and panel artwork.

## Development

Requires [Bun](https://bun.sh) (the lockfile is `bun.lock`) or Node.js with npm.

```sh
bun install
bun run dev    # Vite dev server
bun run build  # production build
bun run lint
```

## Environment

Copy the keys you need into `.env` (loaded by Vite) or the process environment:

| Variable                                              | Purpose                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`           | Supabase project used for auth and data                                                |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Same values, exposed to the browser                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`                           | Server-only key for admin Supabase operations                                          |
| `AI_API_KEY`                                          | Server-only key for text, vision and image generation                                  |
| `AI_BASE_URL`                                         | Optional OpenAI-compatible base URL (default `https://api.openai.com/v1`)              |
| `AI_TEXT_MODEL`                                       | Optional text/chat model (default `gpt-4o-mini`)                                       |
| `AI_VISION_MODEL`                                     | Optional vision model used to review artwork (defaults to `AI_TEXT_MODEL`)             |
| `AI_IMAGE_MODEL`                                      | Optional image model (default `gpt-image-1`)                                           |
| `CRON_SECRET` / `CRON_SECRET_PREVIOUS`                | Bearer token accepted by scheduled endpoints (previous value accepted during rotation) |

AI keys are only read on the server: text requests go through TanStack server functions and artwork goes through `/api/generate-image`.

## Stack

TanStack Start (SSR) + TanStack Router, React 19, Tailwind CSS 4, Supabase, Vite.

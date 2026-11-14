# Inkline

AI manga & manhwa creation studio: describe a story and Inkline plans the story
genome, cast, world, chapters and artwork.

## Stack

- TanStack Start (SSR) + TanStack Router, React 19, Vite 8
- Tailwind CSS v4 (`src/styles.css`)
- Supabase for auth and project persistence
- Any OpenAI-compatible provider for text/vision and image generation

## Development

```sh
bun install
bun run dev        # http://localhost:3000
bun run build      # client + SSR bundles, Nitro server output
bun run lint
```

`vite.config.ts` wires the plugins directly: `tanstackStart()` (with the SSR
error wrapper in `src/server.ts` as its server entry), `viteReact()`,
`tailwindcss()`, `tsConfigPaths()`, and `nitro()` for the production build.

## Environment

| Variable                                   | Purpose                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Supabase project (client + SSR); `VITE_`-prefixed equivalents work too  |
| `SUPABASE_SERVICE_ROLE_KEY`                | Server-only admin client (`src/integrations/supabase/client.server.ts`) |
| `AI_API_KEY`                               | Provider key for text, vision review and image generation (server only) |
| `AI_BASE_URL`                              | Optional; provider root, defaults to `https://api.openai.com/v1`        |
| `AI_TEXT_MODEL`                            | Optional; chat/completions model for the story agents                   |
| `AI_VISION_MODEL`                          | Optional; multimodal model used by the art review pass                  |
| `AI_IMAGE_MODEL`                           | Optional; images model, defaults to `gpt-image-1`                       |
| `CRON_SECRET`                              | Bearer secret for scheduled routes (`authenticateCronRequest`)          |
| `CRON_SECRET_PREVIOUS`                     | Optional; previous secret kept valid during rotation                    |

AI and image calls run server-side only: the browser posts to
`/api/generate-image` and to server functions, never to the provider directly.
`GET /api/generate-image` reports whether image generation is configured.

# Inkline

An AI creative OS for manga and manhwa — describe a story, and Inkline plans panels, casts characters, and draws original artwork.

## Development

You need Node.js and Bun — [install Bun](https://bun.sh/).

```sh
git clone <this-repository-url>
cd <this-repository-name>
bun install
bun run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side admin ops) |
| `AI_API_KEY` | API key for the AI gateway (chat + image generation) |
| `AI_GATEWAY_URL` | Chat completions endpoint (default: `https://api.openai.com/v1/chat/completions`) |
| `AI_IMAGES_URL` | Image generations endpoint (default: `https://api.openai.com/v1/images/generations`) |
| `CRON_SECRET` | Shared secret for authenticating cron job requests |

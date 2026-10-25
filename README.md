# AnimeHeaven

AnimeHeaven is a fresh anime discovery and episode browser built with Next.js App Router, TypeScript, and a configurable external API adapter.

## Features
- Responsive dark interface with discovery sections and anime cards.
- API adapter with configurable base URL and safe endpoint probing.
- Search, anime detail, and episode watch routes.
- Episode titles and thumbnails are normalized from the API response when available.
- AnimeHeaven-first provider resolver; Anikoto is attempted only when the primary provider fails and the provider endpoints are configured.
- Dynamic metadata, canonical URLs, sitemap, robots rules, and JSON-LD.
- Graceful empty/error states when the external API is unreachable.

## Quick start
1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local`.
3. Set `ANIME_API_BASE_URL=http://3.26.204.226:3000`.
4. Run `npm install`, then `npm run dev`.
5. Open http://localhost:3000.

## API integration
The API's exact route contract could not be inspected from the available environment. `src/lib/api.ts` therefore uses a centralized, conservative candidate-path adapter and normalizes common response shapes. Update the candidate paths in that file to match the API's actual documented endpoints for a fully exact integration. The site never claims that provider playback works unless a source is returned.

## Environment
- `ANIME_API_BASE_URL`: API base URL.
- `ANIME_API_TIMEOUT_MS`: server-side API timeout (default 7000ms).
- `NEXT_PUBLIC_SITE_URL`: canonical public site origin (default http://localhost:3000).
- `ANILIST_ENABLED`: optional metadata fallback flag (defaults false).
- `ANILIST_CLIENT_ID`: optional AniList client ID if your integration requires one.

## Routes
- `/` home
- `/trending`, `/popular`, `/latest`, `/movies`
- `/search?q=...`
- `/genres`, `/genres/[genre]`
- `/anime/[slug]`
- `/watch/[slug]/[episode]`
- `/api/health`, `/api/catalog`, `/api/search`, `/api/anime/[id]`, `/api/episodes/[id]`, `/api/stream`

## Deployment
Deploy to Vercel or any Node.js host. Configure `ANIME_API_BASE_URL` in the hosting environment. For production, expose the upstream API over HTTPS; the server-side proxy avoids browser mixed-content errors, but HTTP between servers is not encrypted.

Only use content and streaming sources you are authorized to distribute or embed.

# Mystic Builder

A dark-mode Dauntless build planner for the 1.14.7 "Mystic Paradox" revival.
Plan builds (weapon, armour, lantern, omnicell, cells), share them as links,
and get rich Discord link previews via Open Graph meta tags. The full item
database (231 weapons, 139 armour pieces, 81 cells, 81 perks, lanterns and
omnicells) is included.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma + SQLite (build view counters)
- Netlify Functions for dynamic Open Graph meta rendering
- Game data: [dauntless-builder-reforged](https://github.com/atomicptr/dauntless-builder-reforged) (AGPL-3.0, data public domain)

## Local development

```bash
bun install        # or npm install
npx prisma generate
cp .env.example .env   # DATABASE_URL="file:./db/custom.db"
npx prisma db push
npm run dev        # http://localhost:3000
```

## Deploy to Netlify via GitHub

1. Push this repo to GitHub (do not commit `.env`; `.env.example` is included).
2. In Netlify: **Add new site > Import an existing project** and pick the repo.
3. Build settings are read from `netlify.toml` (build command `npm run build`,
   publish `.next`, Next.js runtime plugin enabled).
4. Environment variables to set in Netlify (Site configuration > Environment variables):
   - `DATABASE_URL` - e.g. your hosted Postgres/SQLite-compatible URL. For the
     default SQLite setup on Netlify, use a hosted provider (e.g. Turso or
     Neon) or Netlify DB, because the file system is ephemeral.
   - `NEXT_PUBLIC_SITE_URL` - the final site URL (used to build canonical links
     and Discord preview URLs).
5. Deploy. Discord link previews work out of the box: `/b/<buildId>` renders
   dynamic `og:` tags, and `/api/builds/<buildId>/preview` serves the OG image.

## Project layout

- `src/app` - pages (home with builder + database tabs, `/b/[buildId]` shared
  build page, OG image route)
- `src/components` - UI: builder editor, database browser, shared build
  display, shared chip components (`src/components/chips.tsx`)
- `src/game` - game data (`data.json`) and build encode/decode logic
- `prisma/schema.prisma` - database schema (build views)
- `netlify.toml` - Netlify build configuration

Dauntless and all related assets are property of Phoenix Labs. This is a
fan-made tool and is not affiliated with Phoenix Labs.

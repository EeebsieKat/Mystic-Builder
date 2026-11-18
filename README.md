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

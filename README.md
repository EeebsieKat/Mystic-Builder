# Mystic Builder

A dark-mode Dauntless build planner for the 1.14.7 "Mystic Paradox" revival. Plan builds (weapon, armour, lantern, omnicell, cells), browse the complete database, explore 517 curated official Reforged meta loadouts, favorite builds with anonymous likes, and get rich Discord link previews via Open Graph meta tags.

The full 1.14.7 item database (231 weapons, 139 armour pieces, 81 cells, 81 perks, lanterns, and omnicells) is included.

---

## Features

- **Interactive Loadout Planner**:
  - Live perk budget & threshold calculations (rank 1–6 with max rank highlight).
  - Weapon bonding support with matching element affinity.
  - Cell slot validation (Brutality, Finesse, Fortitude, Insight, Mobility, Prismatic).
  - Direct shareable build links (`/b/[buildId]`) with Discord & Twitter Open Graph preview cards.

- **Official Meta Build Suggestions (`/?tab=suggestions`)**:
  - 517 curated Dauntless meta loadouts from the official Reforged meta index.
  - Filter by weapon class (Aether Strikers, Axe, Chain Blades, Hammer, Repeaters, Sword, War Pike).
  - Filter by combat archetype & omnicell (Revenant, Tempest, Discipline, Bastion, Artificer, Iceborne, Escalations, Exotics, Catalyst).
  - Elemental matchup filters (vs Blaze, Frost, Shock, Terra, Radiant, Umbral).
  - Multi-perk matching chips (match builds containing all chosen perks).
  - Full-text search across titles, weapons, bonds, gear, perks, and cells.
  - 1-click import into the live builder.

- **Anonymous Likes & Favorites (`/?tab=liked`)**:
  - Real-time like counts and user liking without requiring account sign-in (powered by canvas fingerprinting + client ID).
  - Dedicated "Liked" tab in top navigation and suggestions browser.
  - Dedicated empty state and personalized collection view.

- **Revamped Item Picker**:
  - Left-rail weapon class selector with custom weapon icons.
  - In-modal armor slot switcher (`HEAD`, `TORSO`, `ARMS (HANDS)`, `LEGS`).
  - Items grouped by behemoth with crafting origin tags.
  - Floating dark-glass Radix `HoverCard` tooltips with dynamic game text syntax highlighting (damage, elements, and perk modifiers).

- **Complete 1.14.7 Database (`/?tab=database`)**:
  - Searchable weapons, armor, cells, and perks with crafting requirements, unique effects, and elemental affinities.

---

## Recent Updates

For a detailed breakdown of all changes, additions, and bug fixes since the previous release, see [CHANGELOG.md](file:///d:/!DaunlessBuilder/CHANGELOG.md).

---

## Stack

- **Framework**: Next.js 15 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS 4 + Mystic Paradox theme palette + shadcn/ui + Radix UI
- **Database & ORM**: Prisma + SQLite (view counts, build statistics, anonymous build likes)
- **Deployment**: Netlify (with Netlify Functions for dynamic OG image rendering)
- **Game Data**: [dauntless-builder-reforged](https://github.com/atomicptr/dauntless-builder-reforged) (AGPL-3.0, data public domain)

---

## Local Development

```bash
bun install        # or npm install
npx prisma generate
cp .env.example .env   # DATABASE_URL="file:./db/custom.db"
npx prisma db push
npm run dev        # http://localhost:3000
```

---

## Project Layout

- `src/app` - Pages:
  - `/` (Builder, Database, Suggestions, Liked via `?tab=...`)
  - `/b/[buildId]` (Shared build page with preview counter and builder import)
  - `/api/builds/likes` & `/api/builds/[buildId]/like` (Build like sync API)
- `src/components`:
  - `loadout/` - Loadout screen, gear stages, and item picker modal
  - `build-suggestions.tsx` - Meta builds browser and suggestions explorer
  - `browse-database.tsx` - Item database explorer
  - `builder/` - Build editor components
  - `site-nav-links.tsx` - Header navigation with active states
- `src/lib`:
  - `build-likes.ts` - Like persistence & validation service
  - `client-id.ts` - Anonymous client ID & canvas fingerprinting
  - `game-text-highlighter.tsx` - Syntax highlighter for game tooltips
  - `site.ts` - Theme colors, cell types, and site metadata
- `src/game` - Game data (`data.json`, `meta-builds-indexed.json`) and build encode/decode logic
- `prisma/schema.prisma` - Database schema (build views, likes, stats)
- `scripts/index-meta-builds.ts` - Meta builds offline indexer pipeline

---

Dauntless and all related assets are property of Phoenix Labs. This is a fan-made tool and is not affiliated with Phoenix Labs.

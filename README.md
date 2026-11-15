# Mystic Builder

A dark-mode **Dauntless build planner** for the **1.14.7 Mystic Paradox** revival - a
standalone rebuild of the Dauntless Builder experience, plus rich Discord link
previews for every build you share.

## What it does

- **Full build editor** - pick a weapon (with specials/mods, or chamber/grip/mod for
  repeaters), bonded weapons, head/torso/arms/legs armour with Power Surge toggles,
  lantern, omnicell, and every cell slot. Cells that don't fit a slot are filtered out
  automatically, exactly like the original builder.
- **Live perk totals & build stats** - aggregated perks from gear + cells, weapon
  power, armour resistance, cells filled.
- **Shareable links** - the entire build is encoded in the URL
  (`/b/<build-id>`), the same encoding as the original Dauntless Builder (v8, with
  automatic upgrade of legacy v2-v7 links).
- **Rich Discord embeds** - `/b/<build-id>` pages emit Open Graph tags and render a
  dark preview card image, so Discord shows the whole build before anyone clicks.
- **Item database** - searchable browser for all weapons, armour, perks, cells,
  lanterns and omnicells.
- **Randomize** - roll a fully valid random build with one click.

Build links from the **original** Dauntless Builder paste straight into the import
box and load into the editor, and vice versa - the build format is identical.

## Tech

- Next.js (App Router) + TypeScript + Tailwind CSS 4 (dark theme)
- shadcn/ui components, cmdk comboboxes
- Game data: `src/game/data.json` from the
  [dauntless-builder-reforged](https://github.com/atomicptr/dauntless-builder-reforged)
  project (AGPL-3.0 for ported encoding code, data public domain)
- View counters: Netlify Blobs (no database server needed; in-memory fallback locally)

## Run locally

```bash
npm install
npm run dev
# http://localhost:3000
```

## Deploy to Netlify

See [DEPLOY.md](./DEPLOY.md) for the full step-by-step guide (GitHub connection,
environment variables, Blobs "database" setup, custom domain, troubleshooting).

## Project layout

```
src/app/            pages (editor on /, shared build view on /b/[buildId])
src/app/api/        preview JSON + view counter endpoints
src/components/     UI (build display, database browser, editor components)
src/game/           build id codec + game dataset (data.json, names.json)
src/lib/            site config, OG icon loader, view counter store
netlify.toml        Netlify build config
```

Dauntless and all related assets are property of Phoenix Labs. This is an unofficial
fan project.

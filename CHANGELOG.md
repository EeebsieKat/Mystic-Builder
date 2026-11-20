# Changelog & Recent Updates

All notable changes since commit [`be23802`](https://github.com/your-repo/commit/be238027ded0e040775868d65186120a8bd8d3b5) (*"feat: database UI overhaul, responsive card layout, focus spotlight, and behemoth search"*).

---

## Summary of Major Features

1. **Official Reforged Meta Build Suggestions**: Full browser with 517 curated builds from the official Reforged meta index.
2. **Anonymous Like & Favorite System**: Multi-layer fingerprinting (canvas + client ID) with SQLite persistence.
3. **Dedicated "Liked Builds" Navigation & View**: New top navigation link with personalized saved collection view and empty states.
4. **Loadout Item Picker Revamp**:
   - Left-rail weapon class filter (`All Weapons`, `Aether Strikers`, `Axe`, `Chain Blades`, `Hammer`, `Repeaters`, `Sword`, `War Pike`).
   - In-modal armor slot switcher (`HEAD`, `TORSO`, `ARMS (HANDS)`, `LEGS`).
   - Compact multi-item behemoth grouping with crafting source badges.
   - Rich dark-glass Radix `HoverCard` tooltips with dynamic game text syntax highlighting.
5. **Mystic Paradox Theme & Text Brightness**: Contrast improvements, glowing borders, and gold divider rules.
6. **Bug Fixes**: Resolved search runtime `TypeError: Cannot read properties of null (reading 'toLowerCase')`.

---

## Detailed Changes by Category

### 1. Build Suggestions & Official Meta Index
- **`scripts/index-meta-builds.ts`**:
  - Offline pipeline script that ingests 517 curated Dauntless meta loadouts from the official Reforged meta sheet.
  - Automatically parses titles, combat archetypes/omnicells, weapons, element affinities, bonds, lanterns, armour, cells, and perks.
  - Generates compact, optimized `src/game/meta-builds-indexed.json` (~190 KB) for instant client-side querying.
- **`src/components/build-suggestions.tsx`**:
  - **Weapon Class Selector**: Quick filter for 7 weapon classes + "All Weapons" with real-time count badges.
  - **Combat Archetype Filter**: Instant filtering by omnicell archetypes (*Revenant*, *Tempest*, *Discipline*, *Bastion*, *Artificer*, *Iceborne*, *Escalations*, *Exotics*, *Catalyst*).
  - **Elemental Matchup Pills**: vs Blaze, Frost, Shock, Terra, Radiant, and Umbral.
  - **Multi-Perk Filter Chips**: Fast multi-select matching builds that have all selected perks active.
  - **Live Search**: Instant substring search across build titles, weapons, bonds, omnicells, lanterns, gear, perks, and cells.
  - **Detailed Build Breakdown Dialog**: Deep inspection showing elemental affinity, active perks breakdown with rank tooltips, and equipment slot breakdown.
  - **1-Click Planner Import**: `Open in Loadout Builder` button to instantly import any build into the live builder.
  - **Shareable Link Copy**: Direct clipboard copy for `/b/{buildId}` links with visual checkmark feedback.
  - **Card Focus Spotlight**: Non-hovered cards softly dim on hover to highlight the hovered build.

### 2. Anonymous Build Likes & Persistence
- **`prisma/schema.prisma`**:
  - Added `BuildLike` model tracking `buildId`, `clientId`, `fingerprint`, `ip`, `userAgent`, and `createdAt`.
  - Compound unique constraint `@@unique([buildId, fingerprint])` preventing duplicate likes or voting abuse.
  - Added `BuildStat` model for fast like-count and view-count lookups.
- **`src/lib/client-id.ts`**:
  - Local client identifier generator (`localStorage.getItem("dauntless_client_id")`).
  - Client-side canvas fingerprinting (`getClientFingerprint`) combining user agent, screen resolution, timezone, color depth, and canvas hash for account-less persistence.
- **`src/lib/build-likes.ts`**:
  - Server-side like toggle and status calculation handling IP, userAgent, client ID, and fingerprint.
- **`src/app/api/builds/[buildId]/like/route.ts`**:
  - `POST` endpoint toggling like status with optimistic UI sync.
- **`src/app/api/builds/likes/route.ts`**:
  - `GET` endpoint returning `{ likes: Record<string, number>, userLikes: string[] }` for instant client hydration.

### 3. Liked Builds Navigation & Dedicated View
- **`src/components/site-nav-links.tsx`**:
  - Added **"Liked"** tab in top navigation bar with a `Heart` icon linking to `/?tab=liked`.
  - Active pill highlighting when on `/?tab=liked`.
  - Updated `builderActive` logic to prevent false-positive active states on `tab=liked`.
- **`src/app/page.tsx`**:
  - Added `tab === "liked"` support, mounting `<BuildSuggestions defaultLikedOnly={true} />`.
- **`src/components/build-suggestions.tsx`**:
  - **Custom Liked Hero**: Shows **"Liked Builds ❤️"** with user's saved count and description.
  - **Dedicated Empty State**: Centered dark-glass card with a pulsing heart and **"Browse Suggestions"** button when no builds are liked.
  - **Filter Mismatch State**: Shows **"No Liked Builds Match Your Filters"** with a **"Reset Active Filters"** button when filters yield 0 matches.
  - **Dynamic Filter Counts**: In Liked mode, weapon class and archetype counts reflect only the user's saved builds.
  - **Streamlined UI**: Removed redundant in-page toggle pills on both the Suggestions and Liked pages as requested.

### 4. Loadout Item Picker Overhaul
- **`src/components/loadout/item-picker.tsx`**:
  - **Left-Rail Weapon Class List**: Added weapon class selector (`All Weapons`, `Aether Strikers`, `Axe`, `Chain Blades`, `Hammer`, `Repeaters`, `Sword`, `War Pike`) with custom weapon icons and active pill styling.
  - **In-Modal Armor Slot Switcher**: Added slot switcher (`HEAD`, `TORSO`, `ARMS (HANDS)`, `LEGS`) to change gear slots directly inside the picker modal.
  - **Compact Multi-Item Behemoth Grouping**: Displays items grouped by behemoth with crafting origin badges (`Crafted from Thunderdeep Drask`, `Crafted from Alyra`, etc.).
  - **Rich Dark-Glass Radix Hover Tooltips**:
    - Replaced native browser tooltips and clunky bottom inspection banners with floating dark-glass Radix `HoverCard` tooltips.
    - Displays equipment stats, innate perks, cell slots with colored type badges, and unique passives/legendary abilities.
- **`src/lib/game-text-highlighter.tsx`**:
  - Interactive syntax highlighter for Dauntless game text:
    - Damage numbers (e.g., `700 umbral damage`, `500 health`).
    - Elemental damage (`Blaze`, `Frost`, `Shock`, `Terra`, `Radiant`, `Umbral`).
    - Modifiers & perks (`+4% damage`, `15 seconds`, `Lifesteal +2%`, `prevents all healing`).
- **`src/components/loadout/loadout-screen.tsx`**:
  - Removed outdated placeholder `LoadoutTabsStub` (`COMING WITH ACCOUNTS`) to clean up screen layout.

### 5. Mystic Paradox Theme & Text Brightness Upgrades
- **`src/app/globals.css`**:
  - Integrated official **Mystic Paradox** palette tokens (`#050a12`, `#0a1320`, `#14243b`, `#223859`, `#5ba3ff`, `#eef3fb`).
  - Brightened text color tokens: updated `--muted-foreground` to `#b8c7db` and `--ink-2`/`--ink-3` for high contrast against dark glass backgrounds.
  - Added golden rule dividers (`.gold-rule`), glowing border utilities (`.mystic-glow`, `.glow-cyan`), and custom scrollbars.
- **`src/components/ui/button.tsx`, `card.tsx`, `input.tsx`**:
  - Styled with Mystic Paradox dark glass borders and focus rings.

### 6. Bug Fixes & Stability
- **Null Safety in Search**:
  - Fixed runtime `TypeError: Cannot read properties of null (reading 'toLowerCase')` in `src/components/build-suggestions.tsx` when filtering builds where `omnicellName` or `bondName` is null.
  - Added safe optional-chaining guards `Boolean(b.field?.toLowerCase().includes(q))` across all searchable fields.
- **TypeScript Integrity**:
  - Verified 0 compilation errors across the entire codebase (`npx tsc --noEmit`).

---

## File Changes Overview

| Status | File | Description |
|---|---|---|
| **Added** | `scripts/index-meta-builds.ts` | Offline parser and indexer for 517 meta loadouts |
| **Added** | `src/game/meta-builds.json` | Raw meta builds database |
| **Added** | `src/game/meta-builds-indexed.json` | Indexed, search-optimized meta builds |
| **Added** | `src/lib/client-id.ts` | Anonymous client identifier & canvas fingerprinting |
| **Added** | `src/lib/build-likes.ts` | Backend like verification and SQLite aggregation service |
| **Added** | `src/lib/game-text-highlighter.tsx` | Game syntax highlighter for rich tooltips |
| **Added** | `src/components/build-suggestions.tsx` | Meta builds browser & suggestions explorer |
| **Added** | `src/app/api/builds/[buildId]/like/route.ts` | API route to toggle like on builds |
| **Added** | `src/app/api/builds/likes/route.ts` | API route to fetch build likes & user liked IDs |
| **Modified** | `prisma/schema.prisma` | Added `BuildLike` and `BuildStat` models |
| **Modified** | `src/app/page.tsx` | Added `tab=suggestions` and `tab=liked` routing |
| **Modified** | `src/components/site-nav-links.tsx` | Added `Suggestions` and `Liked` navigation links |
| **Modified** | `src/components/loadout/item-picker.tsx` | Weapon class rail, armor slot tabs, Radix tooltips, behemoth grouping |
| **Modified** | `src/components/loadout/loadout-screen.tsx` | Removed "COMING WITH ACCOUNTS" placeholder tabs |
| **Modified** | `src/app/globals.css` | Mystic Paradox color palette & text brightness boost |
| **Modified** | `src/components/browse-database.tsx` | Database browser improvements & crafting origin badges |
| **Modified** | `src/app/b/[buildId]/page.tsx` | Build viewer enhancements and likes integration |
| **Modified** | `.gitignore` | Ignored local SQLite databases & Prisma test files |
| **Modified** | `notes.md` | Updated roadmap checklist |

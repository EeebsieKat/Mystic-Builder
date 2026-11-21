# Mystic Builder

A dark-mode Dauntless build planner for the 1.14.7 "Mystic Paradox" revival. Plan builds (weapon, armour, lantern, omnicell, cells), browse the complete database, explore 517 curated official Reforged meta loadouts, favorite builds with anonymous likes, and get rich Discord link previews via Open Graph meta tags.

The full 1.14.7 item database (231 weapons, 139 armour pieces, 81 cells, 81 perks, lanterns, and omnicells) is included.

---

## Features

## 1. The Loadout Planner ("Awakening" builder screen)
- Pixel-faithful recreation of the in-game Awakening loadout UI on a 1920x1080 stage that auto-scales to any viewport (with a "designed for desktop" overlay when the scale drops below 0.45).
- Editable build nameplate (24-character cap) with the gold "MYSTIC PARADOX" subtitle.
- Full gear grid: weapon card, split lantern + omnicell card, and four armour cards (Head / Torso / Arms / Legs) — click to inspect, double-click to open the picker.
- Power-surge awareness on every gear piece: stats, gauges, perks and unique effects all swap between base and Power Surged values, and the surge state is stored inside the build.
- Power / resistance gauges on gear cards that scale with the item's value and visually "max out" when surged.
- Four consumable slots: locked Healing Flask plus three tonic/pylon picks (13 consumables total).
- Center detail card tracking the last-inspected slot (game behaviour): appearance line, item name over a gold rule, POWER / RESIST stat box with elemental strengths & weaknesses (+25 / -25 "vs attacks"), perk rows with point counters and "ACTIVATES AT N" thresholds, slotted cell rows, and unique effects (bonded weapon effects included, prefixed with the bond partner's name).
- Right panel: winged crest header with Power/Resistance plaques (ripped game art with gradient numerals), an item showcase with Special / Mod slots (Chamber / Grip / Mod for Repeaters), a Bonded weapon slot, tinted cell-slot boxes with hex icons, and Dye & Transmog chrome (placeholder UI — "arrives in a later update").
- Perk summary panel when nothing is selected: live perk point totals across the entire build, X/6 thresholds, dimmed inactive perks and maxed-rank highlighting.
- Bottom toolbar: COPY share link (checkmark feedback, disabled when the build is empty), RANDOMIZE (rolls a fully valid random build — slot-fitting cells, same-element/class bond pool, 75% consumable fill — plus a "Feeling lucky, Slayer?" toast), RESET (keeps the build name), and IMPORT.
- Import dialog: paste a /b/ link or a raw build id; links from the original Dauntless Builder are upgraded automatically; Enter/Escape shortcuts with dedicated error toasts.
- Live URL sync: every edit rewrites the address bar (/?b=<id> or /b/<id>) so the build is always shareable; Escape deselects back to the perk summary.
- Full slot validation: swapping weapons clears incompatible parts, bonds and cells; bonds must match element + weapon class and cannot be self-bonded; cells must fit their slot's allowed types (Brutality, Finesse, Fortitude, Insight, Alacrity, Prismatic).
- Ornamental backdrop drawn as inline SVG/CSS (light shafts, pedestal glow, vignette, flourish headers, diamond pips) so it stays crisp at any stage scale.

## 2. Full-Screen Item Picker (game-style inventory overlay)
- One overlay picks everything: weapons, armour, lanterns, omnicells, cells, weapon parts, bonds and consumables.
- Left-rail weapon class selector (All Weapons + 7 classes) with custom weapon icons and active-pill styling; correctly isolated so Weapon Special / Weapon Mod pickers don't render the class rail.
- In-modal armour slot switcher (HEAD / TORSO / ARMS (HANDS) / LEGS) that hot-swaps the target slot without closing the modal.
- Items grouped by category and behemoth with crafting-origin badges ("Crafted from Thunderdeep Drask", "Crafted from Alyra", ...).
- Live search plus facet filter rails (Element for weapons, Strength for armour) and a clear-selection action.
- Floating dark-glass Radix HoverCard tooltips: equipment stats, innate perks, cell slots with colored type badges, unique passives / legendary abilities, and interpolated part-effect descriptions.
- Keyboard navigation (arrows / Enter / Escape) and game-styled selected states.

## 3. Official Meta Build Suggestions (?tab=suggestions)
- 517 curated Dauntless meta loadouts from the official Reforged meta index, pre-indexed offline into a compact JSON for instant client-side querying.
- Quick weapon-class filter (7 classes + All Weapons) with real-time count badges.
- Combat archetype / omnicell category filters with descriptions: Revenant, Tempest, Discipline, Bastion, Artificer, Iceborne, Escalations, Exotics, Catalyst.
- Elemental matchup pills (vs Blaze / Frost / Shock / Terra / Radiant / Umbral) and subcategory filtering.
- Multi-perk matching chips (matches builds containing ALL chosen perks), a searchable perk dropdown, and popular-perk shortcuts (Predator, Overpower, Pulse, Cunning, Adrenaline, Galvanized, Impulse, Catalyst, Reuse).
- Instant full-text search across build titles, weapons, bonds, omnicells, lanterns, gear, perks and cells (null-safe).
- Shareable filter deep links (?weapon=, ?category=, ?q=, ?perks=).
- Card focus spotlight: non-hovered cards softly dim while the hovered build scales up with a glow border and shadow.
- Detailed build breakdown dialog: elemental affinity, active perks with rank tooltips (ranks 1-6), and a full equipment slot breakdown.
- 1-click "Open in Loadout Builder" import into the live planner, clipboard copy for /b/<id> links with checkmark feedback, and inline like buttons on every card.

## 4. Anonymous Likes & Favorites (?tab=liked)
- Like or unlike any build without an account: localStorage client ID + client-side canvas fingerprinting (user agent, screen size, timezone, color depth, canvas hash), hardened with a server-side SHA-256 fingerprint (client fp + IP + user agent + accept-language).
- Optimistic UI updates with automatic rollback when the request fails.
- Duplicate / vote-abuse prevention: BuildLike rows with a compound @@unique([buildId, fingerprint]) constraint plus fingerprint / clientId / (ip + user-agent) match heuristics.
- Like counts aggregated in a BuildStat table (upserted on every toggle) and bulk-hydrated on page load.
- Dedicated "Liked" tab in the top navigation and a personalized collection view with a custom hero ("Liked Builds" + your saved count).
- Purpose-built empty states: "No Liked Builds Yet" (pulsing heart + Browse Suggestions button) and "No Liked Builds Match Your Filters" (+ Reset Active Filters button); in Liked mode all filter counts reflect only the user's saved builds.

## 5. Complete 1.14.7 Item Database (?tab=database)
- The full game database bundled client-side: 231 weapons, 139 armour pieces, 81 cells, 81 perks, 8 lanterns, 6 omnicells, 13 consumables, and all 7 weapon part sets.
- Tabbed browser (Weapons / Armour / Perks / Cells / Misc) with a live item-count header and gold rule.
- Per-tab search (name, behemoth, type, element, description) with normalized casing.
- Collapsible filter drawer per tab: element (incl. Neutral), weapon class, armour slot, perk slot type, cell slot type, lantern/omnicell kind — each with a reset button.
- Paginated 12-item grids with numbered pagination that auto-resets to page 1 whenever filters change.
- Compact item rows rendered through a shared chip system (type / element / stat / perk / cell chips, elemental strength & weakness chips, no-slots chip) so spacing and colors stay identical site-wide.
- Click-through item detail dialog: full stats, innate perks, perk rank tables (1-6) with interpolated effect text, every cell variant with its perks, elemental strength (+25) / weakness (-25), crafting origin, and syntax-highlighted unique effects.
- "Suggested Builds Available" cross-link: detects meta guides matching that weapon and deep-links into the Suggestions tab pre-filtered.

## 6. Shareable Build Pages (/b/[buildId])
- Compact encoded build IDs (Sqids v8 alphabet) carrying a 28-field model: weapon, surge states, parts, bond, cells, all four armour pieces, lantern, omnicell and consumables.
- Full backward compatibility: decodes legacy Hashids and Sqids v7 ids and auto-upgrades old Dauntless Builder formats through a v2 -> v9 upgrade chain (flagged as "upgraded" in the view model).
- Build pages re-render the complete Awakening loadout screen with the shared build loaded, plus an eye-icon view counter.
- Server-generated per-build metadata: dynamic title, summary description, element-colored theme-color, Open Graph and Twitter cards.
- Graceful failure state: undecodable links get a friendly "This build link could not be decoded" page with a back-to-builder button and are excluded from search indexing.

## 7. Dynamic Open Graph / Discord Preview Cards
- Auto-generated 1200x630 PNG preview for every build link (next/og on the Node runtime, 24h revalidation).
- Card art is drawn entirely from the Mystic Paradox Launcher Theme design tokens: night-glass `#050a12` backdrop with the aether radial glow and vignette, glass panels (22px radius, hairline border, top sheen), the gold rule divider, and doc-spec chips (tone at 13% fill / 32% border / text mixed 55% with white).
- Branding strip on every card: ripped Mystic Paradox logo tile, gold "DAUNTLESS · MYSTIC PARADOX 1.14.7" eyebrow, Cinzel-700 headline in near-white with the soft aether glow, and an element-tinted weapon crest.
- Card art mirrors the build: element / weapon-class / surge / validity chips, four armour rows plus a lantern & omnicell row, perk rows with cell-type colored dots and gold values, ripped item icons inlined as data URLs.
- Site typography on the card: bundled Cinzel 700 display + Inter 400-700 UI fonts (OFL, via fontsource), matching `--font-display` / `--font-body`.
- Dedicated fallback card for invalid or corrupted build links, in the same night-glass language.
- Extra /api/builds/[buildId]/preview JSON endpoint (valid, title, description, themeColor, weaponName, gameVersion, gameEdition) powering an in-app mock Discord message preview with faithful Discord chrome.

## 8. Build View Counters
- POST increments and GET reads per-build views, validated against a strict build-id pattern.
- Storage: Netlify Blobs ("build-stats" store, strong consistency) in production with an automatic in-memory fallback for local dev and other hosts.
- Tracked via an invisible counter on the build page and rendered as "N view(s)".

## 9. Game Text Syntax Highlighter
- Rule engine that recolors Dauntless game text in tooltips everywhere in the app.
- Elemental damage lines (Blaze, Frost, Shock, Terra, Radiant, Umbral and stagger/wound/part damage) each rendered in their element color.
- Numeric modifiers highlighted (+4% damage, durations, Lifesteal +2%, ...).
- Critical negatives ("prevents all healing", "cannot ...", health drains/loss) emphasized in bold red/rose.

## 10. Mystic Paradox Theming & Site Chrome
- Official Mystic Paradox palette tokens (#050a12, #0a1320, #14243b, #223859, #5ba3ff, #eef3fb) with brightened text tokens for high contrast on dark-glass panels.
- Golden rule dividers, mystic-glow / glow-cyan glowing border utilities, a neon text-glow utility (3-stage Gaussian falloff), custom thin scrollbars, and a mystic-pulse animation that respects prefers-reduced-motion.
- Mystic Paradox launcher typography: Cinzel display serif + Inter UI text (with dedicated serif loadout classes).
- Sticky glass header with the Mystic logo, gold rule, and pill navigation (Builder / Database / Suggestions / Liked / About) with correct active states.
- Site-wide footer with the fan-made disclaimer, About & Licenses link, game-data (AGPL-3.0) credit and source-code link.
- Dark color scheme, theme-color meta, SEO keywords, Twitter summary_large_image cards, per-page titles, and an allow-all robots.txt.

## 11. About & Licenses Page (/about)
- License cards: AGPL-3.0 core license, Phoenix Labs IP / copyright notice, and the dauntless-builder-reforged data attribution.
- Services & tech attribution grid: GitHub, Netlify, SQLite, Next.js + React 19, Tailwind CSS 4, shadcn/ui + Radix UI, Prisma ORM, Lucide icons, CUE4Parse, Google Fonts.
- Project overview ("what Mystic Builder is") with GitHub repository and Open Build Planner call-to-action buttons.

## 12. Data Pipeline, Tooling & Shipped Assets
- scripts/index-meta-builds.ts: offline pipeline that parses the raw meta-builds export, resolves icons / elements / perks / cells, and emits the optimized meta-builds-indexed.json.
- Build decode verification script (test-decode.ts) and a project packaging script (package-project.sh).
- Runtime smoke-test shell scripts (database runtime build, Python runtime build, Python runtime container tests).
- tools/pak-extract: a CUE4Parse-based .NET UE4 PAK tool (list / extract modes) plus pak_reader.py, used to rip official UI art and audio.
- ~21 MB of shipped assets: ripped Awakening UI art (power plaques, level crests, text gradients, tonics, particles, logo), 493 item icons across 9 icon sets, and 41 ripped UI .wav sounds staged for future audio work.
- Four local patch files (awakening-ui, bonded-weapons, armor-cells-and-details, mystic-builder-ui-upgrade) documenting the key feature patches.

## 13. Backend, Storage & Deployment
- Next.js (App Router) + React 19 + TypeScript with standalone output; Tailwind CSS 4 + shadcn/ui + Radix primitives; framer-motion animations; toast notification system.
- Prisma + SQLite: BuildLike model (buildId, clientId, fingerprint, ip, userAgent + compound unique constraint and 4 indexes) and BuildStat model (likes + views).
- API routes: like toggle + per-build like status, bulk likes hydration, view counter, build preview JSON, and a health-check endpoint.
- Netlify-ready deployment: netlify.toml (Node 22, OG functions bundling all fonts/assets, @netlify/plugin-nextjs) and Netlify Blobs for view stats.
- Caddyfile dev proxy with XTransformPort query forwarding, and a local dev recipe (prisma generate / db push, .env DATABASE_URL).
- Legacy card-based build editor kept in src/components/builder (searchable combobox item selects, mock Discord preview, lantern cell indicators, stats / perk totals / import panels) — currently unrouted and superseded by the Awakening screen.


Dauntless and all related assets are property of Phoenix Labs. This is a fan-made tool and is not affiliated with Phoenix Labs.

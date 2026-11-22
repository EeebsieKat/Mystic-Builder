
**Branch:** `feature/ui-polish-and-omnicell-fixes`  
**Target:** `origin/main`  
**PR Creation Link:** [Create Pull Request on GitHub](https://github.com/EeebsieKat/Mystic-Builder/pull/new/feature/ui-polish-and-omnicell-fixes)

---

## 🌟 Executive Summary

This Pull Request delivers a comprehensive visual and functional overhaul to **Mystic Builder**, transitioning the Awakening loadout builder to a dedicated route with server-side rendered (SSR) default loadouts, introducing robust build name sharing via URLs, enhancing user navigation and page transitions, and streamlining the landing page experience.

---

## 🚀 Key Changes & Features

### 1. Dedicated `/builder` Route with Server-Side Rendered Default Build (`Nacroleps`)
- **SSR Default Loadout**: Navigating to `/builder` now immediately hydrates the full Galvanic Impact Shock Hammer build (`mczaOqYl60ZdgmRXePKDiMBgFnyuRcVwGsq085AktuUg7jUAO84NyPqlw19n9k-TC`) under the Slayer name **"Nacroleps"** on the server side (SSR), eliminating empty container layout shifts on load.
- **Clean URL Management**: When viewing the default build at `/builder`, the address bar remains cleanly `/builder` without appending `?b=...` query parameters.
- **Custom Name Sharing via URL (`?name=...`)**:
  - Editing the loadout nameplate dynamically syncs `?name=<BuildName>` into the URL.
  - The "COPY" share link automatically appends `?name=${encodeURIComponent(draft.buildName)}` (e.g. `/b/mczaOqYl60ZdgmRXePKDiMBgFnyuRcVwGsq085AktuUg7jUAO84NyPqlw19n9k-TC?name=Nacroleps`).
  - Loading `/b/<id>?name=...` extracts and populates both page metadata `<title>` and loadout draft state.
  - The **Import** modal parses links containing `name=` or `n=` query parameters.
- **Fixed `RANDOMIZE` and `RESET` Actions**:
  - Resolved a reactive dependency loop that previously reverted user edits back to the default build.
  - **RANDOMIZE**: Generates a complete, slot-validated build and generates a dynamic thematic Slayer title (e.g. `SHOCK HAMMER`, `VOID STALKER`, `FROST BINDER`).
  - **RESET**: Clears all equipped gear to an empty draft and resets the nameplate to `"SLAYER"`.

### 2. Landing Page Visual & Layout Polish
- **Streamlined Content Flow**:
  - Removed outdated and repetitive sections (weapon class armory grid, elemental matchup table, and mock Discord preview).
  - Replaced the omnicell showcase with an interactive **Development Roadmap & Upcoming Features** bento.
  - Transformed Core Capabilities into an asymmetric showcase bento displaying high-resolution application screenshots.
- **Refined Hero & Call-To-Action (CTA)**:
  - Removed heavy background golden wing crests and harsh glow artifacts from the CTA and hero for a sleek, modern aesthetic.
  - Centered typography and softened resting CTA action button opacity (`opacity-85`) with reduced shadow glow.
  - Embedded ASCII art of the Mystic Paradox crest with subtle atmospheric god rays.
  - Properly docked the footer cleanly to the bottom of the viewport.

### 3. Smooth Page Transitions & External Navigation
- **Page Transitions**: Added a global `PageTransition` wrapper (`src/components/page-transition.tsx`) featuring 150ms fade-out and 200ms fade-in animations across route changes and query tab switching.
- **External Navigation**: Added a **Main Website** navigation pill linking to `https://mysticparadox.com` with `target="_blank"` and `rel="noopener noreferrer"`.

### 4. OpenGraph SEO, Social Embeds & Dynamic Titles
- **Resolved Discord/Crawler 500 Error on OpenGraph Images**:
  - Bundled authentic Latin TTF font files (`Cinzel-700.ttf`, `Inter-400.ttf`, `Inter-500.ttf`, `Inter-600.ttf`, `Inter-700.ttf`) directly into `public/fonts/` and `src/assets/fonts/`.
  - Updated `scripts/copy-standalone.js` to ensure font assets are mirrored to `.next/standalone/`.
  - Added robust local fallback cascade in `src/lib/og-icons.ts` to prevent Satori `Font unavailable` runtime exceptions from ever 500-ing social crawlers.
  - Satori OpenGraph image generator now supports custom build names in the rendered card banner (`?name=...`).
- **Dynamic Browser Tab & Page `<title>` Synchronization**:
  - Added real-time `document.title` synchronization in `LoadoutScreen` reacting to build name edits, randomize, and reset.
  - Implemented SSR metadata resolution with absolute title formatting (`${title} - Mystic Builder`) across `/builder` and `/b/[buildId]`, ensuring the browser tab always identifies the active build rather than displaying the bare domain name.
  - Default build name resolution on `/b/[buildId]` (`buildNameplate`) now infers weapon identity (e.g. `TERRA CHAIN BLADES`, `SHOCK HAMMER`) instead of falling back to a generic `"SLAYER"`.
- **OpenGraph & Twitter Cards**: Updated website graph titles, site names, and metadata across `layout.tsx`, `page.tsx`, and `builder/page.tsx` to **`Mystic Builder`**, pointing to `https://builder.mysticparadox.com` in production environments.

### 5. Ad System & Promo Cards
- Fixed an issue where legacy 12-hour localStorage suppression (`mystic-builder-ads-suppressed-until`) prevented promotional dialogs from showing.
- Lowered initial popup trigger delay to 2 seconds and verified active promo cards.

### 6. Item Database & Slotted Cell Perk Breakdown
- **Perk Effect Overview**: Cell modals in the Item Database browser now display the underlying perk's effect overview and description directly.
- **Tier-Specific Breakdown**: Available Cell Tiers (+1, +2, +3) in the database modal now display the exact interpolated perk values (e.g. `+5 stamina regeneration`, `+10 stamina regeneration`, `+15 stamina regeneration`) alongside the rarity and rank.
- **Inherent Perks with Activation Stats**: Weapons, armours, and lanterns in the database browser now render full perk detail rows with the slot icon, perk points, exact effect description, and activation threshold (`ACTIVATES AT: X PERK POINTS`), matching the in-game detail card reference.
- **Meta Builds Slotted Cells & Tooltips**: The Meta Builds inspection dialog now renders slotted cells as full detail cards displaying slot icon, cell name, perk points (`PERK POINTS: 3`), exact interpolated tier bonus description, and activation threshold (`ACTIVATES AT: 3 PERK POINTS`). Weapon and armour hover cards also display slotted cell effects.

### 7. Full Build Perk Summary Modal & +1 to +6 Tier Hover Cards
- **Perk Summary Trigger Button**: Added a dedicated **View Build Perk Summary** action directly below equipment cell slots in the loadout right panel.
- **In-Game Faithful Perk Summary Modal**: Clicking the trigger opens a full build perk modal with the authentic silver banner header and tech corner brackets (`PERK SUMMARY`) showing all active build perks.
- **Interactive +1 to +6 Tier Tooltips**: Hovering over any perk card in the modal (or the loadout right panel) pops up a detailed tier breakdown displaying all 6 ranks (+1 to +6) with the build's currently active tier highlighted with glowing accents and status badges.

---

## 🛠️ Modified Files Summary

| File | Change Summary |
|------|----------------|
| `src/app/builder/page.tsx` | Server component initializing `Nacroleps` SSR default build, dynamic metadata, and query param support. |
| `src/app/b/[buildId]/page.tsx` | Added `searchParams` parsing for custom build name sharing and dynamic OpenGraph titles. |
| `src/app/layout.tsx` | Updated OpenGraph site name / title to `Mystic Builder`, wrapped children in `PageTransition`. |
| `src/app/page.tsx` | Added redirects to `/builder`, updated OpenGraph metadata, and passed through build name params. |
| `src/components/browse-database.tsx` | Added cell perk overview and tier-by-tier effect descriptions to database cards, detail dialogs, and inherent perk rows. |
| `src/components/build-suggestions.tsx` | Slotted cells in Meta Builds modal now display full perk points, interpolated tier stats, and activation thresholds. |
| `src/components/loadout/perk-summary-dialog.tsx` | In-game faithful Perk Summary popup dialog with interactive +1 to +6 tier hover cards. |
| `src/components/loadout/right-panel.tsx` | Added "View Build Perk Summary" button below cell slots and tier hover tooltips to perk summary rows. |
| `src/components/loadout/loadout-screen.tsx` | Integrated `PerkSummaryDialog` state and trigger handling in loadout screen. |
| `src/components/loadout/loadout-stage.tsx` | Initialized SSR stage scale to `1` to eliminate empty loadout container during server rendering. |
| `src/components/site-nav-links.tsx` | Added `Main Website` navigation pill linking to `https://mysticparadox.com`. |
| `src/components/page-transition.tsx` | Added smooth fade-out and fade-in page transitions. |
| `src/components/landing-page.tsx` | Polished CTA, removed deprecated sections, and adjusted bento layouts. |
| `src/lib/site.ts` | Updated `SITE_NAME` to `Mystic Builder`, enhanced `localBuildPath` and `localEditPath` with name support. |
| `src/ads/index.ts` & `src/ads/ads.json` | Fixed suppression lock and lowered modal delay. |

---

## 🧪 Verification & Testing

- [x] **SSR Verification**: `GET /builder` returns complete HTML containing `Galvanic Impact`, `MYSTIC PARADOX`, and `Nacroleps`.
- [x] **URL Cleanliness**: Visiting `/builder` displays the default build with URL bar cleanly remaining `http://localhost:3000/builder`.
- [x] **URL Name Sharing**: Editing nameplate to a custom name updates URL to `?name=...`. Loading `/b/<id>?name=CustomName` sets the nameplate and page title.
- [x] **Randomize & Reset**: Clicking `RANDOMIZE` updates all slots and generates a new name without snapping back to default. Clicking `RESET` clears all gear and resets name to `"SLAYER"`.
- [x] **Cell & Inherent Perk Details**: Database modal and Meta Builds slotted cells display full perk points, interpolated tier stats, and activation thresholds matching the Awakening detail card.
- [x] **OpenGraph Image Generation**: `GET /b/<id>/opengraph-image` returns HTTP 200 `image/png` with valid dimensions (1200x630) and rich gear/perk cards.
- [x] **Social Link Previews**: Checked Discord embed compatibility with `og:image`, `og:title`, and `og:description`.
- [x] **Browser Tab Synchronization**: Browser tab immediately updates to `${buildName} - Mystic Builder` on SSR load, input edits, randomize, and reset.
- [x] **Build Integrity**: `npm run build && node scripts/copy-standalone.js` builds with 0 errors.

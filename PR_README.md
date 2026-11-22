# Pull Request: UI Polish, Dedicated Builder Route, SSR Default Build & Omnicell Enhancements

**Branch:** `feature/ui-polish-and-omnicell-fixes`  
**Target:** `origin/main`  
**PR Creation Link:** [Create Pull Request on GitHub](https://github.com/EeebsieKat/Mystic-Builder/pull/new/feature/ui-polish-and-omnicell-fixes)

---

## 🌟 Executive Summary

This Pull Request delivers a comprehensive visual and functional overhaul to **mystic Builder**, transitioning the Awakening loadout builder to a dedicated route with server-side rendered (SSR) default loadouts, introducing robust build name sharing via URLs, enhancing user navigation and page transitions, and streamlining the landing page experience.

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

### 4. OpenGraph SEO & Branding
- **OpenGraph & Twitter Cards**: Updated website graph titles, site names, and metadata across `layout.tsx`, `page.tsx`, and `builder/page.tsx` to **`mystic Builder`**.
- Dynamic title generation supporting custom build names in social cards and browser tabs.

### 5. Ad System & Promo Cards
- Fixed an issue where legacy 12-hour localStorage suppression (`mystic-builder-ads-suppressed-until`) prevented promotional dialogs from showing.
- Lowered initial popup trigger delay to 2 seconds and verified active promo cards.

---

## 🛠️ Modified Files Summary

| File | Change Summary |
|------|----------------|
| `src/app/builder/page.tsx` | Server component initializing `Nacroleps` SSR default build, dynamic metadata, and query param support. |
| `src/app/b/[buildId]/page.tsx` | Added `searchParams` parsing for custom build name sharing and dynamic OpenGraph titles. |
| `src/app/layout.tsx` | Updated OpenGraph site name / title to `mystic Builder`, wrapped children in `PageTransition`. |
| `src/app/page.tsx` | Added redirects to `/builder`, updated OpenGraph metadata, and passed through build name params. |
| `src/components/loadout/loadout-screen.tsx` | Clean `/builder` URL sync, custom name URL sharing, fixed Randomize/Reset handlers, and name generators. |
| `src/components/loadout/loadout-stage.tsx` | Initialized SSR stage scale to `1` to eliminate empty loadout container during server rendering. |
| `src/components/site-nav-links.tsx` | Added `Main Website` navigation pill linking to `https://mysticparadox.com`. |
| `src/components/page-transition.tsx` | Added smooth fade-out and fade-in page transitions. |
| `src/components/landing-page.tsx` | Polished CTA, removed deprecated sections, and adjusted bento layouts. |
| `src/lib/site.ts` | Updated `SITE_NAME` to `mystic Builder`, enhanced `localBuildPath` and `localEditPath` with name support. |
| `src/ads/index.ts` & `src/ads/ads.json` | Fixed suppression lock and lowered modal delay. |

---

## 🧪 Verification & Testing

- [x] **SSR Verification**: `GET /builder` returns complete HTML containing `Galvanic Impact`, `MYSTIC PARADOX`, and `Nacroleps`.
- [x] **URL Cleanliness**: Visiting `/builder` displays the default build with URL bar cleanly remaining `http://localhost:3000/builder`.
- [x] **URL Name Sharing**: Editing nameplate to a custom name updates URL to `?name=...`. Loading `/b/<id>?name=CustomName` sets the nameplate and page title.
- [x] **Randomize & Reset**: Clicking `RANDOMIZE` updates all slots and generates a new name without snapping back to default. Clicking `RESET` clears all gear and resets name to `"SLAYER"`.
- [x] **OpenGraph Tags**: Checked `<meta property="og:title" content="mystic Builder" />` and `<meta property="og:site_name" content="mystic Builder" />`.
- [x] **Build Integrity**: `npm run build && node scripts/copy-standalone.js` builds with 0 errors.

#!/usr/bin/env bash
# Packages the GitHub/Netlify-ready project into download/mystic-builder
set -euo pipefail

ROOT=/home/z/my-project
DEST="$ROOT/download/mystic-builder"

rm -rf "$DEST"
mkdir -p "$DEST"

# --- app source ---
mkdir -p "$DEST/src/app" "$DEST/src/components/builder" "$DEST/src/components/ui" "$DEST/src/hooks" "$DEST/src/lib" "$DEST/src/game"
mkdir -p "$DEST/public/assets" "$DEST/public/fonts"

cp "$ROOT/src/app/globals.css" "$ROOT/src/app/layout.tsx" "$ROOT/src/app/page.tsx" "$ROOT/src/app/icon.svg" "$DEST/src/app/"
cp -r "$ROOT/src/app/b" "$DEST/src/app/"
cp -r "$ROOT/src/app/api" "$DEST/src/app/"

cp "$ROOT/src/components/build-display.tsx" \
   "$ROOT/src/components/copy-link-button.tsx" \
   "$ROOT/src/components/view-counter.tsx" \
   "$ROOT/src/components/browse-database.tsx" \
   "$DEST/src/components/"
cp "$ROOT/src/components/builder/build-editor.tsx" \
   "$ROOT/src/components/builder/item-select.tsx" \
   "$ROOT/src/components/builder/discord-preview.tsx" \
   "$DEST/src/components/builder/"

for f in badge.tsx button.tsx card.tsx collapsible.tsx command.tsx dialog.tsx input.tsx label.tsx popover.tsx separator.tsx switch.tsx tabs.tsx toast.tsx toaster.tsx; do
  cp "$ROOT/src/components/ui/$f" "$DEST/src/components/ui/"
done

cp "$ROOT/src/hooks/use-toast.ts" "$DEST/src/hooks/"
cp "$ROOT/src/lib/site.ts" "$ROOT/src/lib/og-icons.ts" "$ROOT/src/lib/stats.ts" "$ROOT/src/lib/utils.ts" "$DEST/src/lib/"
cp "$ROOT/src/game/"* "$DEST/src/game/"

cp -r "$ROOT/public/assets/icons" "$DEST/public/assets/"
cp "$ROOT/public/assets/noicon.png" "$DEST/public/assets/" 2>/dev/null || true
cp -r "$ROOT/public/fonts/." "$DEST/public/fonts/"
cp "$ROOT/public/robots.txt" "$DEST/public/"

# --- config ---
cp "$ROOT/netlify.toml" "$ROOT/tsconfig.json" "$ROOT/postcss.config.mjs" "$ROOT/eslint.config.mjs" "$ROOT/components.json" "$DEST/" 2>/dev/null || true
cp "$ROOT/.gitignore" "$DEST/" 2>/dev/null || true

cat > "$DEST/next.config.ts" <<'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
EOF

cat > "$DEST/package.json" <<'EOF'
{
  "name": "mystic-builder",
  "version": "1.0.0",
  "private": true,
  "description": "Dark-mode Dauntless (1.14.7 Mystic Paradox) build planner with rich Discord link previews",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "@netlify/blobs": "^11.1.9",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "hashids": "^2.3.0",
    "lucide-react": "^0.525.0",
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sqids": "^0.3.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@netlify/plugin-nextjs": "^5.4.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^16.1.1",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.5",
    "typescript": "^5"
  },
  "engines": {
    "node": ">=22"
  }
}
EOF

echo "Packaged to $DEST"

# Sanity check: every relative @/ import must resolve inside DEST.
missing=0
while IFS= read -r imp; do
  rel="${imp#\@/}"
  if [ ! -e "$DEST/src/${rel}.ts" ] && [ ! -e "$DEST/src/${rel}.tsx" ] && [ ! -e "$DEST/src/$rel" ]; then
    echo "MISSING: $imp"
    missing=1
  fi
done < <(grep -rhoE 'from "@/[^"]+"' "$DEST/src" | sed 's/from "//; s/"//' | sort -u)
if [ "$missing" -eq 0 ]; then echo "All @/ imports resolve."; fi

# DEPLOY.md - Deploying Mystic Builder to Netlify via GitHub

This guide takes you from zero to a live site at `https://<your-site>.netlify.app` with
automatic deploys every time you push to GitHub. Estimated time: ~10 minutes.

---

## 0. What you need

- A free [GitHub](https://github.com) account
- A free [Netlify](https://netlify.com) account
- The `mystic-builder` project folder (or the `mystic-builder.zip` from your download)

---

## 1. Push the project to a new GitHub repository

1. Unzip `mystic-builder.zip` (if you have the zip) and open a terminal in that folder.
2. Create a new **empty** repository on GitHub (e.g. `mystic-builder`). Do **not** add a
   README or license via the GitHub UI - the project already ships one.
3. Run:

```bash
git init
git add .
git commit -m "Mystic Builder - initial commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/mystic-builder.git
git push -u origin main
```

---

## 2. Connect Netlify to the repository

1. Log in to Netlify and click **Add new site > Import an existing project**.
2. Choose **GitHub** and authorize Netlify when asked.
3. Pick your `mystic-builder` repository from the list.
4. Netlify auto-detects Next.js. Confirm the build settings (they match `netlify.toml`):

   | Setting        | Value             |
   | -------------- | ----------------- |
   | Build command  | `npm run build`   |
   | Publish folder | `.next`           |
   | Node version   | 22 (from `netlify.toml`) |

5. Click **Deploy site**. The first build takes ~2-3 minutes.

> Do **not** add the `NEXT_PUBLIC_SITE_URL` variable yet - wait until step 4.

When it finishes, Netlify shows your site URL, e.g.
`https://sparkling-moonlight-abc123.netlify.app`.

---

## 3. Verify the deployment

Open these in a browser (replace with your real URL):

- `https://<YOUR_SITE>.netlify.app/` - the builder should load in dark mode.
- Build any random build (Randomize button) and copy the link, then open the
  `/b/...` link - the build page should render.
- Right-click > View Source on the `/b/...` page and search for `og:title` -
  you should see the build's title tag. That is what Discord reads.

---

## 4. Set your site URL (important for Discord embeds)

Open Graph tags and the OG preview image need to know the **final public URL** of the
site, otherwise they fall back to `localhost`.

1. In Netlify, open **Site configuration > Environment variables > Add a variable**.
2. Add:

   | Key                  | Value                                   |
   | -------------------- | --------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL` | `https://<YOUR_SITE>.netlify.app`     |

   (If you connect a custom domain later, use that domain instead - see step 7.)
3. Redeploy: **Deploys > Trigger deploy > Deploy site**.

> Alternative: instead of `NEXT_PUBLIC_SITE_URL` you can use Netlify's automatic
> `URL` env variable - the app already checks `NEXT_PUBLIC_SITE_URL`, then `URL`, then
> `DEPLOY_PRIME_URL`, in that order. Setting `NEXT_PUBLIC_SITE_URL` explicitly is still
> recommended because `URL` is only correct after the first deploy.

---

## 5. The "database" setup (Netlify Blobs - nothing to install)

This app deliberately needs **no external database server**. The only stored state is
the view counter shown on build pages, and it uses **Netlify Blobs**, a storage feature
that is built into every Netlify site.

**Setup is zero-config.** When your site deploys with the official Next.js runtime
(`@netlify/plugin-nextjs`, already declared in `netlify.toml`), Blobs are enabled
automatically and the app creates a store named `build-stats` on first use.

To confirm it is working after your deploy:

1. Open any `/b/<buildId>` page - you should see a small view counter appear.
2. In Netlify go to **Site configuration > Blobs** (or scroll the left sidebar) - you
   will see the `build-stats` store listed once it has been written to.

Nothing else to provision, no connection strings, no secrets.

Running locally or on a non-Netlify host? The app automatically falls back to an
in-memory counter (resets on restart) so development always works.

If you ever outgrow Blobs and want a real database (e.g. Postgres via Supabase or
Neon), the only code that touches storage is `src/lib/stats.ts` - swap that one file's
store for your database client and everything else keeps working.

---

## 6. Automatic deploys from GitHub

Already active by default:

- Every push to `main` triggers a production deploy.
- Every pull request gets its own preview deploy URL - great for testing changes
  before merging.
- You can add a deploy status badge / deploy previews from **Site configuration >
  Build & deploy**.

To change something:

```bash
git add .
git commit -m "my change"
git push        # Netlify picks this up automatically
```

---

## 7. Custom domain (optional)

1. Buy a domain (or use one you own).
2. **Site configuration > Domain management > Add a domain** and follow the DNS
   instructions (usually a `CNAME` for subdomains, or Netlify's nameservers for
   apex domains).
3. After the domain is live, update `NEXT_PUBLIC_SITE_URL` to the new domain and
   redeploy so Open Graph tags use it.
4. Enable **HTTPS > Verify DNS configuration** - Netlify provisions certificates
   automatically.

---

## 8. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Build fails on Netlify but works locally | Make sure Node version is 22 (`netlify.toml` sets it). Check **Deploys > deploy log** for the actual error. |
| Discord shows an old/blank preview | Discord caches aggressively. After changing metadata, redeploy, then use the Discord text box: type the link, delete it, re-type it. You can also add a dummy query `?v=2` once to bust the cache. |
| OG image missing / 404 | Confirm `netlify.toml` still contains the `included_files` block (fonts + icons are needed by the image generator). |
| View counter shows nothing locally | Expected - the in-memory fallback resets on restart; on Netlify it persists. |
| "This build link could not be decoded" | The `/b/...` id was truncated or mangled. Copy the full link again. |

---

## 9. Updating game data

The dataset lives in `src/game/data.json` and `src/game/names.json`
(v1.14.7 Mystic Paradox era, sourced from the `dauntless-builder-reforged` project,
data licensed public domain). When the revive project updates its data files, replace
those two files, commit and push - Netlify rebuilds automatically.

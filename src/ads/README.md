# Making ads (promo popups)

Ads are the little cards that slide in at the bottom-right corner of every
page, linger for a few seconds, then slide away. Everything is data-driven —
**you never touch component code to make an ad**, you only edit
`src/ads/ads.json` (and drop image files into `public/assets/ads/` if you
want a banner picture).

## Quick start: add an ad

1. Open `src/ads/ads.json`. It is an array — add a new object to it:

   ```json
   {
       "id": "summer-event",
       "enabled": true,
       "title": "Summer Hunt Event",
       "message": "Double drops all weekend on the Mystic Paradox server.",
       "ctaLabel": "See the event",
       "href": "https://discord.gg/mystic-paradox",
       "icon": "/assets/awakening-ui/logo/icon.png",
       "image": null,
       "accent": "gold",
       "weight": 2,
       "startsAt": null,
       "endsAt": null
   }
   ```

2. Deploy / restart. That's it — the popup system picks it up
   automatically on the next page load.

## Field reference

| Field       | Type            | Default              | What it does                                                                                             |
| ----------- | --------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`        | string          | **required**         | Unique name used for rotation memory. Never reuse an id for a different campaign.                        |
| `enabled`   | boolean         | `true`               | Set `false` to retire an ad without deleting it.                                                         |
| `title`     | string          | **required**         | Bold headline on the card. Short is better (3–6 words).                                                  |
| `message`   | string          | **required**         | Body text. Keep it to one sentence — the card is intentionally small.                                    |
| `ctaLabel`  | string          | `"Learn more"`       | Button text. Omit `href` too if you want a text-only card.                                               |
| `href`      | string          | `null`               | Where the button goes. External URLs open in a new tab; `/`-links navigate inside the site.               |
| `icon`      | string          | site logo            | Small square icon next to the title. Any image in `public/` works, e.g. `/assets/icons/generic/Sword.png`. |
| `image`     | string          | `null`               | Optional wide banner strip on top of the card (rendered 340×96, `object-cover` crops).                    |
| `accent`    | `"aether"`/`"gold"` | `"aether"`       | Button color theme: blue (aether) or antique gold.                                                        |
| `weight`    | 1–5             | `1`                  | How often the ad shows relative to others. `3` appears ~3x as often as `1`. Avoid repeating the same ad twice in a row regardless. |
| `startsAt`  | ISO date string | `null`               | Schedule: ad won't show before this moment, e.g. `"2026-12-20T00:00:00Z"`.                               |
| `endsAt`    | ISO date string | `null`               | Schedule: ad auto-retires at this moment. Great for events — set both and never touch it again.           |

### Using images

- Put new images in `public/assets/ads/` (create the folder) and reference
  them as `/assets/ads/your-image.png`.
- Any existing asset also works — the game icons under
  `/assets/icons/...`, awakening UI art under
  `/assets/awakening-ui/...`, etc.
- Banner images should be ~680×192px or wider; `object-cover` crops the
  middle. Square icons render at 32px.

## Tuning the popup behaviour

All timing knobs live in one place, `src/ads/index.ts` → `AD_CONFIG`:

| Knob                      | Default | Meaning                                                        |
| ------------------------- | ------- | -------------------------------------------------------------- |
| `firstDelayMs`            | `5000`  | Wait after page load before the first popup slides in.          |
| `visibleMs`               | `14000` | How long the card stays on screen (a thin progress bar shows the countdown). |
| `gapMs`                   | `60000` | Quiet time between the card sliding away and the next one.       |
| `suppressHoursAfterClose` | `12`    | When someone clicks the ✕, all promos hide for this long (remembered in localStorage). |
| `storageKey`              | —       | localStorage key for that memory; rename to reset everyone.      |
| `disabledOnPaths`         | `[]`    | Paths where popups never show, e.g. `["/about", "/b"]`.          |

Hovering the card pauses the countdown, so nobody is rushed reading it.

## How rotation works

- One card shows at a time; the next ad is a **weighted random pick** that
  never repeats the previous ad.
- Ads outside their `startsAt`/`endsAt` window (or with `enabled: false`)
  are skipped automatically.
- If a visitor closes a card, the system goes quiet for
  `suppressHoursAfterClose`, then resumes on its own — no code changes
  needed.
- Popups never show while the tab is hidden in the background.

## Testing an ad quickly

Temporarily set in `AD_CONFIG`: `firstDelayMs: 1000`, `gapMs: 3000`,
`visibleMs: 6000` — you'll see the full cycle in seconds. To re-test after
clicking ✕, clear localStorage
(`localStorage.removeItem("mystic-builder-ads-suppressed-until")` in the
browser console) or just use a private window.

## Rules of thumb for a good promo card

- One sentence of copy, one button, one link.
- Lead with the payoff ("Double drops", "New raid", "Giveaway"), not the
  category name.
- Use `weight` to keep your main campaign (e.g. the Discord) dominant and
  event ads occasional.
- Schedule event ads with `startsAt`/`endsAt` instead of enabling/disabling
  by hand.

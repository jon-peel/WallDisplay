# CLAUDE.md — WallDisplay

## Project Overview

WallDisplay is an ambient display application that renders one of three full-screen modes:
photo slideshow, slideshow with live weather panel, or a 4×4 YouTube video wall. It compiles
to fully static HTML/CSS/JS and is deployed to Cloudflare Workers.

**No UI framework.** Everything is vanilla TypeScript and direct DOM manipulation.

---

## Repository Structure

```
WallDisplay/
├── config.json              # App configuration (source of truth — edit this)
├── index.html               # HTML entry point
├── vite.config.ts           # Vite build config
├── wrangler.jsonc           # Cloudflare Workers deployment config
├── tsconfig.json            # TypeScript config (strict mode)
├── src/
│   ├── main.ts              # Entry point: hash-based mode routing
│   ├── style.css            # Global CSS variables and resets
│   ├── vite-env.d.ts        # Vite type declarations
│   ├── generated/           # AUTO-GENERATED — do not edit by hand
│   │   ├── app-config.ts    # Compiled from config.json
│   │   └── photo-manifest.ts# Compiled from public/photos/
│   ├── modes/
│   │   ├── slideshow/       # Photo slideshow mode
│   │   ├── slideshow-weather/ # Slideshow + weather panel
│   │   └── video-wall/      # YouTube 4×4 grid mode
│   ├── services/
│   │   └── weather.ts       # Weather API (Open-Meteo / OpenWeatherMap)
│   └── utils/
│       └── dom.ts           # Shared DOM helpers
├── scripts/                 # Build-time code-generation scripts
│   ├── build-config.ts      # config.json → src/generated/app-config.ts
│   ├── build-manifest.ts    # public/photos/ → src/generated/photo-manifest.ts
│   ├── build-icons.ts       # public/icons/icon.svg → PNG icons
│   ├── build-polyfills.ts   # Copies core-js-bundle to public/
│   └── convert-photos.ts    # Utility: batch JPEG resize/optimize
├── public/
│   ├── photos/              # Place JPEG/PNG/WebP photos here
│   ├── icons/               # PWA icons (icon.svg is the source)
│   ├── manifest.json        # PWA manifest
│   └── polyfills.js         # Generated: core-js polyfills for Safari 9+
└── openspec/                # OpenSpec feature-change workflow artifacts
    ├── config.yaml
    ├── changes/             # In-progress and archived change specs
    └── specs/               # Per-mode spec documents
```

---

## Tech Stack

| Concern | Tool |
|---|---|
| Language | TypeScript 6 (strict) |
| Bundler | Vite 8 |
| Deployment | Cloudflare Workers (`wrangler`) |
| Browser compat | `@vitejs/plugin-legacy` targeting Safari 9+ |
| Polyfills | `core-js-bundle` |
| Image processing | `sharp` (build-time only) |
| Script runner | `tsx` (for build scripts) |

No React, Vue, Svelte, or other UI frameworks. No CSS framework. No test runner.

---

## Development Commands

```bash
npm run dev              # Start Vite dev server with HMR
npm run build            # Full production build (see pipeline below)
npm run preview          # Build + run with Wrangler locally
npm run deploy           # Build + deploy to Cloudflare Workers
npm run convert:photos   # Batch-convert photos to optimised JPEG (1920px, 85%)
```

### Build Pipeline (in order)

`npm run build` runs these steps sequentially:

1. `build:icons` — SVG → PNG icons (32, 180, 192, 512 px)
2. `build:manifest` — Scans `public/photos/`, detects EXIF orientation via `sharp`,
   writes `src/generated/photo-manifest.ts`
3. `build:config` — Parses `config.json`, extracts YouTube video IDs from URLs,
   writes `src/generated/app-config.ts`
4. `build:polyfills` — Copies `core-js-bundle` to `public/polyfills.js`
5. `vite build` — Bundles everything to `dist/`

**First-time setup:** Run `npm run build` (or at minimum the individual `build:*` scripts)
before `npm run dev`, since `src/generated/` files are required by the TypeScript sources
and are not committed to git.

---

## Architecture

### Mode Pattern

Each display mode is a self-contained module that exports a single `mount*` function:

```typescript
// Signature
function mountSlideshow(container: HTMLElement, photos: PhotoMeta[], opts: SlideshowOpts): () => void
function mountSlideshowWeather(container: HTMLElement, photos: PhotoMeta[], opts: WeatherOpts): () => void
function mountVideoWall(container: HTMLElement, videoIds: string[]): () => void
```

- The function builds all DOM inside `container` and starts any timers/intervals.
- It returns a **cleanup function** (`() => void`) that stops timers and removes DOM.
- `main.ts` stores the active cleanup in `activeCleanup` and calls it before mounting a
  new mode.

### Hash-Based Routing (`src/main.ts`)

Modes are selected via `window.location.hash`:

| Hash | Mode |
|---|---|
| `/#slideshow` | Photo slideshow |
| `/#slideshow-weather` | Slideshow + weather panel |
| `/#video-wall` | YouTube video grid |

Invalid or missing hash falls back to `defaultMode` from `config.json`.
A `hashchange` listener triggers full unmount → remount.

### State Management

There is no state library. State lives in:
- **Closures** inside each mode's mount function (timers, counters, destroyed flags)
- **`localStorage`** for weather cache (`home-screen:weather-cache-v5`)
- **`window.location.hash`** for the active mode

---

## Code Conventions

### DOM Creation

Use the `createEl` helper from `src/utils/dom.ts` for typed element creation:

```typescript
import { createEl, clearApp, getApp } from '@/utils/dom'

const div = createEl('div', { id: 'my-el' }, { display: 'flex', gap: '8px' })
```

For quick inline elements in component code, `document.createElement` with
`element.style.cssText = '...'` is also standard in this codebase.

### Styling

- **No CSS classes for component styles.** Use inline `style.cssText` strings.
- CSS custom properties in `src/style.css` define the colour palette:
  `--color-bg`, `--color-text`, `--color-accent`, `--color-muted`.
- Global resets and font stack are in `style.css`. Everything else is inline.

### TypeScript

- Strict mode is on. `noUnusedLocals` and `noUnusedParameters` are enforced.
- Use named exports. Avoid `export default`.
- Path aliases: `@/*` → `src/*`, `@generated/*` → `src/generated/*`
- Types for generated data (`PhotoMeta`, `WeatherConfig`, `Mode`) live in
  `src/generated/app-config.ts` and `src/generated/photo-manifest.ts`.

### Naming

- Functions: `camelCase` — `mountSlideshow`, `groupPhotos`, `renderSlide`
- Types/interfaces: `PascalCase` — `PhotoMeta`, `WeatherData`, `Slide`
- Constants: `UPPER_SNAKE` for module-level fixed values — `MODE_LABELS`, `CACHE_KEY`
- Files: `kebab-case` matching the feature name

---

## Configuration (`config.json`)

Edit `config.json` at the project root. **Never edit `src/generated/app-config.ts`
directly** — it is overwritten on every build.

```jsonc
{
  "defaultMode": "slideshow",          // "slideshow" | "slideshow-weather" | "video-wall"
  "slideshowInterval": 60,             // seconds between slides
  "showModeSwitcher": true,            // show the bottom mode-switcher overlay
  "weather": {
    "provider": "open-meteo",          // "open-meteo" (free) or "openweathermap"
    "apiKey": "",                      // required only for openweathermap
    "latitude": 51.5074,
    "longitude": -0.1278,
    "locationName": "London",
    "units": "metric"                  // "metric" (°C) or "imperial" (°F)
  },
  "videoWall": {
    "videos": [                        // full YouTube URLs or bare video IDs
      "https://www.youtube.com/watch?v=VIDEO_ID"
    ]
  }
}
```

After editing `config.json`, run `npm run build:config` (or `npm run build`) for changes
to take effect.

---

## Photos

1. Place JPEG/PNG/WebP files in `public/photos/`.
2. Run `npm run build:manifest` (or `npm run build`) to regenerate the photo manifest.
3. EXIF orientation is read automatically — rotated photos are classified correctly.
4. For large photos, run `npm run convert:photos` to resize to 1920px max at 85% JPEG quality.

Photo layout in the slideshow is determined by orientation:
- **Landscape** → full-screen
- **Two portraits** → side-by-side (50/50)
- **Portrait + landscape pair** → portrait left 50%, two landscapes stacked right 50%

---

## Display Modes

### Slideshow (`src/modes/slideshow/`)
- Photos are shuffled (Fisher-Yates), then reshuffled when exhausted.
- `groupPhotos()` computes the layout for each slide based on consecutive orientations.
- Transitions are CSS opacity fades (0.8s).

### Slideshow + Weather (`src/modes/slideshow-weather/`)
- 70% slideshow (left) / 30% weather panel (right).
- Weather refreshes every 15 minutes; stale data is cached in `localStorage`.
- A `destroyed` flag guards async callbacks from running after unmount.

### Video Wall (`src/modes/video-wall/`)
- Up to 16 videos per page in a 4×4 grid.
- YouTube IFrame API is loaded lazily on first mount.
- All players start muted. Click a video to go fullscreen and unmute.
- Press Escape to return to the grid.

---

## OpenSpec Workflow

Feature changes are tracked in `openspec/changes/`. Use the OpenSpec Claude skills
to propose, implement, and archive changes:

| Skill | Purpose |
|---|---|
| `/openspec-propose` | Draft a new change with proposal + tasks |
| `/openspec-apply-change` | Implement tasks from a change spec |
| `/openspec-explore` | Explore ideas before proposing |
| `/openspec-archive-change` | Archive a completed change |

Active change specs live in `openspec/changes/<name>/`. Archived ones move to
`openspec/changes/archive/`.

---

## Deployment

```bash
npm run deploy   # builds and deploys to Cloudflare Workers
```

Configuration in `wrangler.jsonc`:
- SPA fallback: all unmatched paths serve `index.html`
- `nodejs_compat` flag enabled
- Observability enabled

---

## Important Constraints

- **Do not edit `src/generated/*.ts`** — these files are overwritten by build scripts.
- **Do not add UI frameworks** (React, Vue, etc.) — the project intentionally uses
  vanilla TypeScript/DOM.
- **Do not add a CSS framework** — styling is inline `style.cssText` and CSS variables.
- **No test infrastructure exists** — there are no `.test.ts` or `.spec.ts` files and
  no test runner is installed.
- **Browser target is Safari 9+** — avoid APIs not covered by the core-js polyfills
  unless you also add the appropriate polyfill.
- **Weather API keys are embedded at build time** in `src/generated/app-config.ts`.
  Do not log or expose them at runtime.

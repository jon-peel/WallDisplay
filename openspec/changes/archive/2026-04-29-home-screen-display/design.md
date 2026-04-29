## Context

A new static site project with no existing codebase. The display is intended to run on a dedicated screen (e.g., a wall-mounted monitor or TV) as an ambient display. It must compile to static HTML/CSS/JS so it can be served from any static host, a local file server, or even `file://` protocol. Three modes — photo slideshow, slideshow+weather, and video wall — share a common shell but diverge significantly in their runtime behaviour.

## Goals / Non-Goals

**Goals:**
- TypeScript source that compiles to fully static HTML/CSS/JS (no server runtime)
- Build-time asset discovery: photos scanned from `photos/`, YouTube URLs and weather config read from `config.json`
- Three independent display modes with a clean mode-switch mechanism
- Weather data fetched client-side at runtime using a free-tier API (no proxy needed)
- YouTube embeds via iframe API; videos muted by default, fullscreen+unmuted on click
- Intelligent photo layout: landscape → fullscreen, portrait combinations → tiled grid

**Non-Goals:**
- Server-side rendering or dynamic routing
- User authentication or persistent settings
- Photo upload or management UI
- Real-time collaborative features
- Mobile-first responsive design (ambient display is fixed-resolution)

## Decisions

### Build Tool: Vite + TypeScript

**Decision**: Use Vite with `vite-plugin-static-copy` for the build pipeline.

**Rationale**: Vite gives fast HMR during development, native TypeScript support, and produces optimised static bundles. A custom Node.js build script (`scripts/build-manifest.ts`) runs before Vite to scan the `photos/` folder and embed metadata (filename, width, height, orientation) into a generated `src/generated/photo-manifest.ts` file — making photo data available at compile time without a server.

**Alternatives considered**: esbuild alone (lacks dev server ergonomics), webpack (heavier config), plain tsc + rollup (more manual).

### Weather API: Open-Meteo (no API key) with optional OpenWeatherMap

**Decision**: Default to Open-Meteo (free, no key required) with the config supporting an optional `weatherProvider: "openweathermap"` override.

**Rationale**: Open-Meteo is free with no key, making zero-config setup possible. The config file supports `apiKey` and `provider` fields so users can switch to OpenWeatherMap for richer data if desired. Weather is fetched client-side on a timer (every 15 minutes).

**Alternatives considered**: Weather.gov (US-only), Weatherbit (key required), self-hosted proxy (adds server dependency).

### Photo Orientation Detection: Sharp at Build Time

**Decision**: Use the `sharp` library in the build script to read image dimensions and embed orientation metadata into the generated manifest.

**Rationale**: Orientation (landscape vs portrait) must be known before layout decisions are made. Doing this at build time avoids runtime `Image` load + layout recalculation flicker. Sharp is fast, handles EXIF rotation, and runs only during build.

**Alternatives considered**: Runtime detection via `naturalWidth/naturalHeight` (causes layout reflow), storing metadata in a sidecar JSON file (manual, error-prone).

### Display Mode Selection: URL Hash or Build-Time Flag

**Decision**: Mode is selected via URL hash (`#slideshow`, `#slideshow-weather`, `#video-wall`) at runtime, with an optional `defaultMode` in config baked in at build time.

**Rationale**: This allows a single built artifact to support all three modes. A TV browser can bookmark a specific hash. The default mode fallback ensures the screen shows something sensible on first load.

**Alternatives considered**: Separate build outputs per mode (triples build complexity), query params (not bookmarkable in all browsers).

### Video Wall Paging: Client-Side, 4×4 Grid

**Decision**: YouTube URLs are split into pages of 16. Navigation arrows cycle through pages. The YouTube Iframe API is loaded once; iframes are reused across pages.

**Rationale**: Reusing iframes avoids re-loading the YouTube player on each page turn, which is slow. Mute state is set via the Iframe API on load; click-to-fullscreen uses the browser Fullscreen API and calls `unMute()`.

**Alternatives considered**: Destroying/recreating iframes per page (slow, causes flicker), using `<video>` embeds (not supported by YouTube).

## Risks / Trade-offs

- **YouTube autoplay policy** → Iframes are muted by default; browsers allow muted autoplay. Unmuting on click requires a user gesture, which is satisfied by the click event.
- **Open-Meteo rate limits** → Fetching every 15 minutes for a single location is well within free limits (~10k req/day). Mitigation: cache last response in `localStorage` to survive refreshes.
- **Photo manifest staleness** → Adding photos requires a rebuild. Mitigation: document clearly; this is expected for a static site.
- **EXIF rotation** → Sharp handles EXIF rotation in the manifest; CSS `transform` is not needed. Risk: unusual EXIF values may mis-classify orientation. Mitigation: fallback to `width > height` pixel check.
- **Large photo folders** → Build time grows linearly with photo count. Mitigation: recommend resizing photos to ≤2MP before adding to `photos/`.

## Migration Plan

1. Scaffold project with `npm create vite@latest` (vanilla-ts template)
2. Add build script for photo manifest generation
3. Implement each mode as an isolated TypeScript module
4. Wire mode selection via URL hash router
5. Test with `vite preview` serving the `dist/` folder

No rollback strategy needed — this is a new project with no existing users.

## Open Questions

- Should the mode switcher be visible on screen (e.g., small corner button), or only via URL hash? → Default: URL hash only, but add a configurable `showModeSwitcher` flag.
- Should the slideshow advance automatically (interval configurable), or on a timer? → Default: 10-second interval, configurable in `config.json`.
- Should weather units be configurable (metric vs imperial)? → Yes, add `units: "metric" | "imperial"` to config.

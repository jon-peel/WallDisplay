## 1. Project Scaffold

- [x] 1.1 Initialise Vite + TypeScript project (`npm create vite@latest` with vanilla-ts template)
- [x] 1.2 Add dependencies: `sharp`, `vite-plugin-static-copy`, and dev types
- [x] 1.3 Create `config.json` with default values for all supported fields (slideshowInterval, weather, videoWall)
- [x] 1.4 Create `photos/` directory with a sample placeholder image
- [x] 1.5 Configure `vite.config.ts` to copy `photos/` folder into `dist/` output
- [x] 1.6 Set up `tsconfig.json` for strict mode and path aliases

## 2. Build-Time Photo Manifest

- [x] 2.1 Write `scripts/build-manifest.ts` using `sharp` to scan `photos/` for JPEG, PNG, and WebP files
- [x] 2.2 Read pixel dimensions and EXIF rotation for each image; classify as `landscape` or `portrait`
- [x] 2.3 Generate `src/generated/photo-manifest.ts` exporting a typed array of photo metadata
- [x] 2.4 Add npm script `build:manifest` and hook it to run before `vite build` in the `build` script
- [x] 2.5 Verify manifest regenerates correctly when photos are added or removed

## 3. Build-Time Config Parsing

- [x] 3.1 Write `scripts/build-config.ts` to read and validate `config.json` at build time
- [x] 3.2 Generate `src/generated/app-config.ts` exporting typed config constants (slideshowInterval, weather settings, video IDs)
- [x] 3.3 Parse YouTube URLs/IDs from `videoWall.videos` and normalise to video ID strings
- [x] 3.4 Emit build warning if `provider: "openweathermap"` is set without an `apiKey`
- [x] 3.5 Hook `build:config` script to run before `vite build` alongside manifest generation

## 4. App Shell & Mode Router

- [x] 4.1 Create `src/main.ts` entry point that reads URL hash and renders the appropriate mode
- [x] 4.2 Implement hash-change listener to switch modes without full page reload
- [x] 4.3 Apply `defaultMode` from generated config as the fallback when no hash is present
- [x] 4.4 Create base CSS: full-viewport layout, dark background, no scroll, CSS custom properties for palette
- [x] 4.5 Write `src/utils/dom.ts` helpers for mounting/unmounting mode components

## 5. Slideshow Mode

- [x] 5.1 Create `src/modes/slideshow/index.ts` that accepts the photo manifest and config
- [x] 5.2 Implement looping shuffle algorithm for photo ordering
- [x] 5.3 Implement layout grouping logic: pair consecutive portraits, form mixed tiles (1 portrait + 2 landscape), single landscape
- [x] 5.4 Build `FullscreenSlide` component: single landscape image, `object-fit: cover`, edge-to-edge
- [x] 5.5 Build `PortraitPairSlide` component: two portraits side-by-side, each 50% width × 100% height
- [x] 5.6 Build `MixedTileSlide` component: portrait left 50%, two landscapes stacked on right 50%
- [x] 5.7 Implement auto-advance timer using `slideshowInterval` from config; clear timer on mode unmount
- [x] 5.8 Add CSS transitions (crossfade) between slide groups

## 6. Slideshow + Weather Mode

- [x] 6.1 Create `src/modes/slideshow-weather/index.ts` that composes slideshow + weather panel
- [x] 6.2 Constrain slideshow to left 70% of viewport; create right 30% weather panel container
- [x] 6.3 Create `src/services/weather.ts` with fetch functions for Open-Meteo and OpenWeatherMap
- [x] 6.4 Implement `localStorage` caching for last successful weather response
- [x] 6.5 Set up 15-minute refresh timer; use cached data on fetch failure
- [x] 6.6 Build `CurrentWeather` component: location name, temperature, condition description, icon
- [x] 6.7 Build `HourlyForecast` component: 12-hour vertical list with time, temperature, icon per entry
- [x] 6.8 Build `DailyForecast` component: 5-day horizontal row with day name, high/low temps, icon
- [x] 6.9 Handle weather error state: show location name + offline indicator when data unavailable
- [x] 6.10 Map weather condition codes to icon set (use a simple SVG or emoji-based icon map)

## 7. Video Wall Mode

- [x] 7.1 Create `src/modes/video-wall/index.ts` that accepts the video ID array from generated config
- [x] 7.2 Load YouTube Iframe API script dynamically once; expose a typed wrapper
- [x] 7.3 Create `VideoGrid` component: 4×4 CSS grid of iframe containers filling the viewport
- [x] 7.4 Initialise all 16 iframes per page with `autoplay=1&mute=1` parameters via Iframe API
- [x] 7.5 Implement paging: slice video array into groups of 16; update iframe `src` on page change (reuse DOM elements)
- [x] 7.6 Build `PageControls` component: previous/next arrows, page indicator (e.g., "2 / 5"); hide controls when only 1 page
- [x] 7.7 Implement click-to-fullscreen: request Fullscreen API on the clicked container, call `unMute()` on the player
- [x] 7.8 Handle fullscreen exit (`fullscreenchange` event): restore grid view, call `mute()` on the player
- [x] 7.9 Show empty-state message when `videoWall.videos` is empty

## 8. Integration & Polish

- [x] 8.1 Verify all three modes load correctly via URL hash in `vite preview`
- [x] 8.2 Test slideshow with a mix of landscape and portrait photos; verify all three layout types appear
- [x] 8.3 Test weather panel with Open-Meteo using a real location; verify current, hourly, and daily sections render
- [x] 8.4 Test video wall with 20+ YouTube URLs; verify paging, mute default, and fullscreen click
- [x] 8.5 Validate `dist/` output is fully self-contained (no external font/script dependencies except YouTube API and weather API)
- [x] 8.6 Add `README.md` documenting setup: install, configure `config.json`, add photos, build, serve

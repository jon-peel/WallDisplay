## Why

The HomeScreen wall display does not render correctly on old iPads (iOS 13 and below), due to a combination of modern JavaScript syntax, ES modules, and WebP images that pre-2020 Safari does not support. Adding compatibility ensures the display works on older hardware that is commonly repurposed as a dedicated wall screen.

## What Changes

- Add `@vitejs/plugin-legacy` to transpile modern JS and inject polyfills for legacy Safari/iOS
- Lower the Vite `build.target` to include older Safari versions (e.g. `safari12`)
- Add JPEG/PNG fallbacks for WebP images so old iPads can display the photo slideshow
- Add testing guidance and tooling configuration for simulating old browsers locally

## Capabilities

### New Capabilities

- `legacy-browser-support`: Dual-bundle build (modern + legacy) via vite-plugin-legacy, with polyfills injected automatically for old iOS Safari
- `webp-fallback`: Serve JPEG/PNG fallback images to browsers that do not support WebP (old iPads pre-iOS 14)

### Modified Capabilities

- (none — no existing spec-level requirements are changing)

## Impact

- `vite.config.ts`: Add `@vitejs/plugin-legacy` plugin and configure `build.target`
- `index.html`: No changes required — the legacy plugin handles the `<script nomodule>` injection automatically
- `photos/`: May require generating JPEG fallbacks alongside existing WebP files
- `scripts/convert-photos.ts`: Extend to also produce JPEG fallbacks
- `package.json`: Add `@vitejs/plugin-legacy` and `core-js` as dev dependencies
- Build output size will increase (two JS bundles emitted); no runtime change for modern browsers

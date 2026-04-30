## Context

The HomeScreen app is a Vite + TypeScript wall display targeting a single always-on screen. It is currently built with `target: ES2020` in both TypeScript and Vite's default esbuild output. Old iPads (typically iOS 12–13, running Safari 12–13) cannot execute ES2020 module syntax or render WebP images, causing the display to show a blank screen.

The build pipeline is simple: `vite build` produces a single ES-module bundle. There are no tests, no CI, and a single deployment target (the `dist/` folder served statically).

## Goals / Non-Goals

**Goals:**
- The app SHALL load and run correctly on Safari 12+ (iOS 12+, roughly iPad mini 2 and newer)
- Photo slideshow images SHALL display on browsers without WebP support
- Modern browsers SHALL continue receiving the optimised ES-module bundle (no regression)
- A developer SHALL be able to simulate an old browser locally without a physical device

**Non-Goals:**
- Supporting Internet Explorer or Android WebView
- Server-side rendering or progressive enhancement beyond what the legacy plugin provides
- Automated cross-browser test suites (out of scope for this project's size)

## Decisions

### 1. Use `@vitejs/plugin-legacy` for JS transpilation and polyfill injection

**Decision:** Add the official Vite legacy plugin with `targets: ['safari >= 12']`.

**Why:** The plugin wraps Babel + `@babel/preset-env` + `core-js` and is the standard Vite solution. It automatically:
- Emits a second `<script nomodule>` bundle transpiled to ES5
- Injects `core-js` polyfills for any APIs used (e.g. `Promise`, `fetch`, `Array.from`)
- Adds a `SystemJS` module loader shim for dynamic imports if needed

**Alternatives considered:**
- Manual Babel config: More control, significantly more setup; not justified for this project.
- Lowering `tsconfig.json` target: TypeScript's `target` only affects type-checking and syntax emit from `tsc` — it does NOT add polyfills, and Vite bypasses `tsc` for bundling anyway. This alone would not fix runtime failures.

### 2. Keep TypeScript target at ES2020

**Decision:** Leave `tsconfig.json` `target: ES2020` unchanged.

**Why:** TypeScript's `target` only controls which syntax features are flagged as errors during type-checking. It does not influence what Vite emits. The legacy plugin operates on the final bundle output, not the TypeScript source. Changing the TS target to ES5 would add unnecessary friction (many modern APIs would need type stubs) with no runtime benefit.

### 3. Generate JPEG fallbacks for WebP images at build time

**Decision:** Extend `scripts/convert-photos.ts` to also write a `.jpg` alongside each `.webp`, and use `<picture>` + `<source>` tags (or runtime detection) in the slideshow renderer.

**Why:** iOS 13 and earlier Safari have zero WebP support — the image simply fails to load silently. The legacy JS plugin cannot fix this. Generating JPEGs at the same time as WebPs keeps the workflow a single step.

**Alternatives considered:**
- Serving WebP only and relying on the server to content-negotiate: Requires a dynamic server; the project is static.
- Converting at request time via a CDN: Adds infrastructure complexity; overkill.

### 4. Local old-browser testing via Xcode iOS Simulator

**Decision:** Document use of Xcode Simulator (free, Mac) as the primary testing method.

**Why:** It uses the real Safari/WebKit JS engine, unlike Chrome DevTools device emulation which only fakes the viewport. BrowserStack is an alternative but requires a paid account.

## Risks / Trade-offs

- **Build size increase** → Both bundles are emitted; modern browsers load only the ES-module bundle. Total `dist/` size roughly doubles for JS assets. Acceptable given the app is served on a local network.
- **`core-js` version drift** → The polyfill set is determined at build time. If new browser APIs are used later, the plugin automatically picks them up on next build.
- **JPEG quality vs size** → JPEGs are larger than WebP for equivalent quality. Set `quality: 85` in Sharp to balance.
- **Safari 12 fetch/CSS gap** → `fetch` is supported from Safari 10.1; CSS Grid from Safari 10. No polyfills needed for these.

## Migration Plan

1. Install new dev dependencies (`@vitejs/plugin-legacy`, `core-js`)
2. Update `vite.config.ts` to add the legacy plugin
3. Update `convert-photos.ts` to emit JPEGs alongside WebPs
4. Update slideshow renderer to use `<picture>` / `<source type="image/webp">` with JPEG fallback
5. Run `npm run build` — verify `dist/` contains both `index.legacy.js` (or similar) and `index.js`
6. Test in Xcode Simulator on iOS 13 Safari
7. Deploy `dist/` as normal

Rollback: revert `vite.config.ts` — the modern bundle is unaffected by removing the legacy plugin.

## Open Questions

- What is the exact iOS version of the old iPad? This determines whether we need `safari >= 12` or can relax to `safari >= 13`.
- Are there any CSS features in use that need prefixing (e.g. `-webkit-` prefixes)? A quick audit of `src/` styles should confirm.

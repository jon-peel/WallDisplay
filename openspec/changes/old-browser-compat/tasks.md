## 1. Install Dependencies

- [x] 1.1 Install `@vitejs/plugin-legacy` as a dev dependency (`npm install -D @vitejs/plugin-legacy`)
- [x] 1.2 Install `core-js` as a dev dependency (`npm install -D core-js`)
- [x] 1.3 Verify both packages appear in `package.json` devDependencies

## 2. Configure Vite for Legacy Browser Support

- [x] 2.1 Import `legacy` from `@vitejs/plugin-legacy` in `vite.config.ts`
- [x] 2.2 Add the legacy plugin to the `plugins` array with `targets: ['safari >= 12']`
- [x] 2.3 Set `additionalLegacyPolyfills: ['core-js/stable']` to include full polyfill set
- [x] 2.4 Run `npm run build` and confirm `dist/assets/` contains both a modern bundle and a `*-legacy-*.js` file
- [x] 2.5 Confirm `dist/index.html` contains both a `<script type="module">` and a `<script nomodule>` tag

## 3. Add JPEG Fallback Image Generation

- [x] 3.1 Open `scripts/convert-photos.ts` and read the existing WebP conversion logic
- [x] 3.2 After writing each `.webp`, add a `sharp(input).jpeg({ quality: 85 }).toFile(jpegPath)` call
- [x] 3.3 Run `npm run convert:photos` on a test image and verify both `.webp` and `.jpg` are produced
- [x] 3.4 Add the JPEG output path to the `viteStaticCopy` targets in `vite.config.ts` if not already covered by the `photos/*` glob

## 4. Update Slideshow Renderer for WebP/JPEG Fallback

- [x] 4.1 Open the slideshow rendering code (likely `src/modes/slideshow/index.ts` or `src/modes/slideshow-weather/index.ts`)
- [x] 4.2 Locate where image `src` is set for each photo
- [x] 4.3 Replace direct `.webp` `src` assignment with a `<picture>` element: `<source type="image/webp" srcset="...webp">` plus an `<img src="...jpg">` fallback, OR use runtime `canPlayType`/feature-detection to choose the URL
- [x] 4.4 Add error handling on image load failure to skip to the next photo rather than showing a broken image
- [ ] 4.5 Verify in a modern browser that WebP images still display correctly
- [ ] 4.6 Verify in iOS Simulator (Safari 13) that JPEG fallbacks display correctly

## 5. Local Testing Setup

- [ ] 5.1 Install Xcode from the Mac App Store if not already installed
- [ ] 5.2 Open Xcode → Preferences → Components and download the iOS 13 simulator runtime
- [ ] 5.3 Launch the iOS 13 simulator: `xcrun simctl boot "iPad (7th generation)"` (or use Xcode's Simulator app)
- [ ] 5.4 Run `npm run build && npm run preview` to start the preview server
- [ ] 5.5 In the simulator, open Safari and navigate to the preview server URL (e.g. `http://[your-local-IP]:4173`)
- [ ] 5.6 Confirm the app loads, JS executes, and photos display — no blank screen

## 6. Final Verification

- [x] 6.1 Run `npm run build` one final time and check for any build errors or warnings
- [ ] 6.2 Confirm modern browser (Chrome/Safari latest) still shows the app correctly with no regressions
- [ ] 6.3 Confirm iOS 13 simulator shows the app correctly with photos cycling
- [ ] 6.4 Check `dist/` bundle size and note the increase (expected: JS doubles; photos increase by JPEG size)

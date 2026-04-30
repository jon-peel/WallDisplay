## ADDED Requirements

### Requirement: Dual-bundle build for legacy browsers
The build system SHALL emit two JS bundles: a modern ES-module bundle for current browsers, and a transpiled ES5 legacy bundle with injected polyfills for Safari 12+. The correct bundle SHALL be selected automatically by the browser via `type="module"` / `nomodule` attributes.

#### Scenario: Modern browser receives ES-module bundle
- **WHEN** a modern browser (Safari 14+, Chrome 80+) loads the page
- **THEN** it executes the `<script type="module">` bundle and ignores the `nomodule` script

#### Scenario: Legacy browser receives polyfilled bundle
- **WHEN** an old browser (Safari 12–13) loads the page
- **THEN** it executes the `<script nomodule>` bundle which includes ES5 syntax and core-js polyfills

#### Scenario: Build produces both bundles
- **WHEN** `npm run build` completes
- **THEN** the `dist/` directory contains both a modern JS entry and a legacy JS entry (e.g. `assets/index-*.js` and `assets/index-legacy-*.js`)

### Requirement: Polyfills injected automatically
The legacy bundle SHALL include polyfills for all browser APIs used in the application, without manual configuration per feature.

#### Scenario: No manual polyfill imports required
- **WHEN** a developer adds use of a modern API (e.g. `Promise.allSettled`) to the source
- **THEN** the next build automatically includes the required polyfill in the legacy bundle via `core-js`
